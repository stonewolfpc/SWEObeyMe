/**
 * Path-Aware URL Handler
 * Provides URL validation, normalization, and path-aware routing for MCP transports
 */

/**
 * URL Validator and Normalizer
 */
export class URLHandler {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || '';
    this.defaultPath = options.defaultPath || '/mcp';
    this.strictValidation = options.strictValidation !== false;
    this.allowedProtocols = options.allowedProtocols || ['http:', 'https:'];
    this.maxPathLength = options.maxPathLength || 2048;
  }

  /**
   * Validate URL structure
   */
  validate(url) {
    if (!url || typeof url !== 'string') {
      throw new Error('URL must be a non-empty string');
    }

    try {
      const parsed = new URL(url);

      // Check protocol
      if (!this.allowedProtocols.includes(parsed.protocol)) {
        throw new Error(`Protocol ${parsed.protocol} is not allowed. Allowed: ${this.allowedProtocols.join(', ')}`);
      }

      // Check path length
      if (parsed.pathname.length > this.maxPathLength) {
        throw new Error(`Path length exceeds maximum of ${this.maxPathLength} characters`);
      }

      // Check for suspicious patterns
      if (this.strictValidation) {
        this.checkSuspiciousPatterns(parsed);
      }

      return { valid: true, parsed };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * Check for suspicious URL patterns
   */
  checkSuspiciousPatterns(parsed) {
    // Check for path traversal attempts
    if (parsed.pathname.includes('..')) {
      throw new Error('Path traversal detected in URL');
    }

    // Check for null bytes
    if (parsed.pathname.includes('\0')) {
      throw new Error('Null byte detected in URL');
    }

    // Check for excessive slashes
    if (parsed.pathname.includes('//')) {
      throw new Error('Excessive slashes in URL path');
    }

    // Check for control characters
    if (/[\x00-\x1F\x7F]/.test(parsed.pathname)) {
      throw new Error('Control characters detected in URL');
    }
  }

  /**
   * Normalize URL to canonical form
   */
  normalize(url) {
    const validation = this.validate(url);
    if (!validation.valid) {
      throw new Error(`Invalid URL: ${validation.error}`);
    }

    const parsed = validation.parsed;

    // Normalize path (remove trailing slash, handle empty paths)
    let pathname = parsed.pathname;
    if (pathname === '') {
      pathname = this.defaultPath;
    } else if (pathname.endsWith('/') && pathname.length > 1) {
      pathname = pathname.slice(0, -1);
    }

    // Ensure path starts with /
    if (!pathname.startsWith('/')) {
      pathname = '/' + pathname;
    }

    // Reconstruct URL
    const normalized = `${parsed.protocol}//${parsed.host}${pathname}${parsed.search || ''}`;

    return normalized;
  }

  /**
   * Build URL from components
   */
  build(components) {
    const {
      protocol = 'http:',
      host = 'localhost',
      port,
      path = this.defaultPath,
      query,
    } = components;

    let url = `${protocol}//${host}`;

    if (port) {
      url += `:${port}`;
    }

    if (path) {
      url += path.startsWith('/') ? path : `/${path}`;
    }

    if (query) {
      const queryString = typeof query === 'string' 
        ? query 
        : new URLSearchParams(query).toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    return this.normalize(url);
  }

  /**
   * Extract path components from URL
   */
  parsePath(url) {
    const validation = this.validate(url);
    if (!validation.valid) {
      throw new Error(`Invalid URL: ${validation.error}`);
    }

    const parsed = validation.parsed;
    const segments = parsed.pathname.split('/').filter(Boolean);

    return {
      full: parsed.pathname,
      segments,
      depth: segments.length,
      base: segments[0] || '',
      extension: segments.length > 0 ? segments[segments.length - 1].split('.').pop() : '',
    };
  }

  /**
   * Check if URL matches a pattern
   */
  matchesPattern(url, pattern) {
    const parsed = this.parsePath(url);
    
    // Simple pattern matching (supports * wildcard)
    const patternSegments = pattern.split('/').filter(Boolean);
    
    if (patternSegments.length !== parsed.segments.length) {
      return false;
    }

    for (let i = 0; i < patternSegments.length; i++) {
      const patternSeg = patternSegments[i];
      const urlSeg = parsed.segments[i];

      if (patternSeg === '*') {
        continue; // Wildcard matches anything
      }

      if (patternSeg !== urlSeg) {
        return false;
      }
    }

    return true;
  }
}

/**
 * Path-Aware Router for SSE Transport
 */
export class PathAwareRouter {
  constructor(options = {}) {
    this.urlHandler = new URLHandler(options.urlHandler || {});
    this.routes = new Map();
    this.middleware = [];
    this.defaultRoute = options.defaultRoute || null;
  }

  /**
   * Register a route
   */
  register(path, handler, options = {}) {
    const route = {
      path,
      handler,
      methods: options.methods || ['GET'],
      middleware: options.middleware || [],
      metadata: options.metadata || {},
    };

    this.routes.set(path, route);
  }

  /**
   * Register middleware
   */
  use(middleware) {
    this.middleware.push(middleware);
  }

  /**
   * Match route to request
   */
  match(url, method = 'GET') {
    const pathInfo = this.urlHandler.parsePath(url);
    const fullPath = pathInfo.full;

    // Check exact match first
    if (this.routes.has(fullPath)) {
      const route = this.routes.get(fullPath);
      if (route.methods.includes(method)) {
        return { route, pathInfo, matchType: 'exact' };
      }
    }

    // Check pattern matches
    for (const [pattern, route] of this.routes) {
      if (this.urlHandler.matchesPattern(url, pattern) && route.methods.includes(method)) {
        return { route, pathInfo, matchType: 'pattern' };
      }
    }

    // Check default route
    if (this.defaultRoute) {
      return { route: this.defaultRoute, pathInfo, matchType: 'default' };
    }

    return null;
  }

  /**
   * Execute middleware chain
   */
  async executeMiddleware(middleware, context) {
    for (const mw of middleware) {
      await mw(context);
    }
  }

  /**
   * Handle request
   */
  async handle(url, method, context = {}) {
    const match = this.match(url, method);

    if (!match) {
      throw new Error(`No route found for ${method} ${url}`);
    }

    const { route, pathInfo } = match;

    // Execute global middleware
    await this.executeMiddleware(this.middleware, context);

    // Execute route-specific middleware
    await this.executeMiddleware(route.middleware, context);

    // Execute route handler
    return await route.handler({
      ...context,
      pathInfo,
      matchType: match.matchType,
    });
  }

  /**
   * Get all registered routes
   */
  getRoutes() {
    return Array.from(this.routes.entries()).map(([path, route]) => ({
      path,
      methods: route.methods,
      metadata: route.metadata,
    }));
  }
}

/**
 * URL Configuration Manager
 */
export class URLConfigManager {
  constructor(options = {}) {
    this.configs = new Map();
    this.defaultConfig = options.defaultConfig || {};
    this.environment = options.environment || 'development';
  }

  /**
   * Register URL configuration
   */
  register(name, config) {
    this.configs.set(name, {
      ...this.defaultConfig,
      ...config,
      name,
    });
  }

  /**
   * Get URL configuration
   */
  get(name) {
    return this.configs.get(name);
  }

  /**
   * Build URL from configuration
   */
  buildFromConfig(name, overrides = {}) {
    const config = this.get(name);
    if (!config) {
      throw new Error(`URL configuration '${name}' not found`);
    }

    const urlHandler = new URLHandler();
    return urlHandler.build({
      ...config,
      ...overrides,
    });
  }

  /**
   * Get all configurations
   */
  getAll() {
    return Array.from(this.configs.values());
  }
}

// Global instances
let urlHandler = null;
let pathAwareRouter = null;
let urlConfigManager = null;

/**
 * Initialize URL handler components
 */
export function initializeURLHandler(options = {}) {
  urlHandler = new URLHandler(options.urlHandler || {});
  pathAwareRouter = new PathAwareRouter(options.router || {});
  urlConfigManager = new URLConfigManager(options.config || {});

  // Register default routes for MCP
  pathAwareRouter.register('/mcp', null, {
    methods: ['POST', 'GET'],
    metadata: { description: 'MCP endpoint' },
  });

  pathAwareRouter.register('/sse', null, {
    methods: ['GET'],
    metadata: { description: 'SSE endpoint' },
  });

  pathAwareRouter.register('/message', null, {
    methods: ['POST'],
    metadata: { description: 'SSE message endpoint' },
  });

  // Register default URL configurations
  urlConfigManager.register('mcp', {
    protocol: 'http:',
    host: 'localhost',
    port: 3001,
    path: '/mcp',
  });

  urlConfigManager.register('sse', {
    protocol: 'http:',
    host: 'localhost',
    port: 3001,
    path: '/sse',
  });

  urlConfigManager.register('oauth', {
    protocol: 'http:',
    host: 'localhost',
    port: 3001,
    path: '/oauth',
  });

  return {
    urlHandler,
    pathAwareRouter,
    urlConfigManager,
  };
}

/**
 * Get URL handler components
 */
export function getURLHandler() {
  if (!urlHandler || !pathAwareRouter || !urlConfigManager) {
    throw new Error('URL handler not initialized. Call initializeURLHandler first.');
  }

  return {
    urlHandler,
    pathAwareRouter,
    urlConfigManager,
  };
}
