/**
 * Refresh Mechanisms and Error Recovery
 * Provides connection refresh, retry logic, circuit breaker, and health monitoring
 */

/**
 * Circuit Breaker Pattern
 * Prevents cascading failures by stopping requests to failing services
 */
export class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000; // 1 minute
    this.callTimeout = options.callTimeout || 30000; // 30 seconds
    
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.state = 'closed'; // closed, open, half-open
    this.successCount = 0;
  }

  async execute(fn) {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'half-open';
        this.successCount = 0;
      } else {
        throw new Error('Circuit breaker is OPEN - service unavailable');
      }
    }

    try {
      const result = await Promise.race([
        fn(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Circuit breaker timeout')), this.callTimeout)
        ),
      ]);

      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    if (this.state === 'half-open') {
      this.successCount++;
      if (this.successCount >= 2) {
        this.state = 'closed';
      }
    }
  }

  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'open';
    }
  }

  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
      successCount: this.successCount,
    };
  }

  reset() {
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.state = 'closed';
    this.successCount = 0;
  }
}

/**
 * Retry Logic with Exponential Backoff
 * Retries failed operations with increasing delay
 */
export class RetryHandler {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.initialDelay = options.initialDelay || 1000; // 1 second
    this.maxDelay = options.maxDelay || 30000; // 30 seconds
    this.backoffMultiplier = options.backoffMultiplier || 2;
    this.retryableErrors = options.retryableErrors || [
      'ECONNREFUSED',
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND',
      'EAI_AGAIN',
      'EPIPE',
    ];
  }

  async execute(fn, context = {}) {
    let lastError;
    let delay = this.initialDelay;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (attempt === this.maxRetries) {
          break;
        }

        if (!this.isRetryable(error)) {
          throw error;
        }

        console.error(`[Retry] Attempt ${attempt + 1}/${this.maxRetries} failed: ${error.message}`);
        console.error(`[Retry] Retrying in ${delay}ms...`);

        await this.sleep(delay);
        delay = Math.min(delay * this.backoffMultiplier, this.maxDelay);
      }
    }

    throw new Error(`Operation failed after ${this.maxRetries + 1} attempts: ${lastError.message}`);
  }

  isRetryable(error) {
    if (this.retryableErrors.includes(error.code)) {
      return true;
    }
    if (error.message && error.message.includes('timeout')) {
      return true;
    }
    if (error.message && error.message.includes('ECONN')) {
      return true;
    }
    return false;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Connection Refresh Manager
 * Manages connection refresh for HTTP/SSE transports
 */
export class ConnectionRefreshManager {
  constructor(options = {}) {
    this.refreshInterval = options.refreshInterval || 300000; // 5 minutes
    this.healthCheckInterval = options.healthCheckInterval || 60000; // 1 minute
    this.maxRetries = options.maxRetries || 3;
    
    this.connections = new Map();
    this.healthStatus = new Map();
    this.refreshTimers = new Map();
    this.healthCheckTimers = new Map();
  }

  registerConnection(connectionId, connection, options = {}) {
    const connectionConfig = {
      connection,
      refreshCallback: options.refreshCallback,
      healthCheckCallback: options.healthCheckCallback,
      autoRefresh: options.autoRefresh !== false,
      healthCheckEnabled: options.healthCheckEnabled !== false,
      lastRefresh: Date.now(),
      lastHealthCheck: Date.now(),
    };

    this.connections.set(connectionId, connectionConfig);
    this.healthStatus.set(connectionId, 'healthy');

    if (connectionConfig.autoRefresh) {
      this.startAutoRefresh(connectionId);
    }

    if (connectionConfig.healthCheckEnabled) {
      this.startHealthCheck(connectionId);
    }

    return connectionId;
  }

  unregisterConnection(connectionId) {
    this.stopAutoRefresh(connectionId);
    this.stopHealthCheck(connectionId);
    this.connections.delete(connectionId);
    this.healthStatus.delete(connectionId);
  }

  async refreshConnection(connectionId) {
    const config = this.connections.get(connectionId);
    if (!config) {
      throw new Error(`Connection ${connectionId} not found`);
    }

    try {
      if (config.refreshCallback) {
        await config.refreshCallback(config.connection);
      }
      config.lastRefresh = Date.now();
      this.healthStatus.set(connectionId, 'healthy');
      console.log(`[Connection Refresh] Connection ${connectionId} refreshed successfully`);
    } catch (error) {
      console.error(`[Connection Refresh] Failed to refresh connection ${connectionId}: ${error.message}`);
      this.healthStatus.set(connectionId, 'unhealthy');
      throw error;
    }
  }

  async healthCheck(connectionId) {
    const config = this.connections.get(connectionId);
    if (!config) {
      throw new Error(`Connection ${connectionId} not found`);
    }

    try {
      if (config.healthCheckCallback) {
        const isHealthy = await config.healthCheckCallback(config.connection);
        this.healthStatus.set(connectionId, isHealthy ? 'healthy' : 'unhealthy');
        config.lastHealthCheck = Date.now();
        return isHealthy;
      }
      return true;
    } catch (error) {
      console.error(`[Health Check] Failed for connection ${connectionId}: ${error.message}`);
      this.healthStatus.set(connectionId, 'unhealthy');
      return false;
    }
  }

  startAutoRefresh(connectionId) {
    this.stopAutoRefresh(connectionId);
    const timer = setInterval(() => {
      this.refreshConnection(connectionId).catch(() => {
        // Refresh failed, will retry on next interval
      });
    }, this.refreshInterval);
    this.refreshTimers.set(connectionId, timer);
  }

  stopAutoRefresh(connectionId) {
    const timer = this.refreshTimers.get(connectionId);
    if (timer) {
      clearInterval(timer);
      this.refreshTimers.delete(connectionId);
    }
  }

  startHealthCheck(connectionId) {
    this.stopHealthCheck(connectionId);
    const timer = setInterval(() => {
      this.healthCheck(connectionId).catch(() => {
        // Health check failed, status already set to unhealthy
      });
    }, this.healthCheckInterval);
    this.healthCheckTimers.set(connectionId, timer);
  }

  stopHealthCheck(connectionId) {
    const timer = this.healthCheckTimers.get(connectionId);
    if (timer) {
      clearInterval(timer);
      this.healthCheckTimers.delete(connectionId);
    }
  }

  getHealthStatus(connectionId) {
    const config = this.connections.get(connectionId);
    if (!config) {
      throw new Error(`Connection ${connectionId} not found`);
    }

    return {
      status: this.healthStatus.get(connectionId),
      lastRefresh: config.lastRefresh,
      lastHealthCheck: config.lastHealthCheck,
    };
  }

  getAllHealthStatus() {
    const status = {};
    for (const [id] of this.connections) {
      status[id] = this.getHealthStatus(id);
    }
    return status;
  }
}

/**
 * Error Recovery Strategies
 * Provides recovery strategies for common error scenarios
 */
export class ErrorRecovery {
  constructor(options = {}) {
    this.recoveryStrategies = new Map();
    this.defaultStrategy = options.defaultStrategy || 'log-and-continue';
  }

  registerStrategy(errorType, strategy) {
    this.recoveryStrategies.set(errorType, strategy);
  }

  async recover(error, context = {}) {
    const errorType = this.getErrorType(error);
    const strategy = this.recoveryStrategies.get(errorType) || this.recoveryStrategies.get('default');

    if (strategy) {
      return await strategy(error, context);
    }

    // Default strategy: log and rethrow
    console.error(`[Error Recovery] Unhandled error: ${error.message}`);
    throw error;
  }

  getErrorType(error) {
    if (error.code) {
      return error.code;
    }
    if (error.name) {
      return error.name;
    }
    return 'unknown';
  }

  async logAndContinue(error, context) {
    console.error(`[Error Recovery] Error occurred: ${error.message}`);
    console.error(`[Error Recovery] Context: ${JSON.stringify(context)}`);
    return null;
  }

  async retryWithBackoff(error, context) {
    const retryHandler = new RetryHandler();
    return await retryHandler.execute(context.retryFn);
  }

  async fallback(error, context) {
    if (context.fallbackFn) {
      console.log(`[Error Recovery] Using fallback for: ${error.message}`);
      return await context.fallbackFn();
    }
    throw error;
  }

  async circuitBreak(error, context) {
    if (context.circuitBreaker) {
      console.log(`[Error Recovery] Circuit breaker triggered for: ${error.message}`);
      context.circuitBreaker.onFailure();
      throw new Error('Circuit breaker triggered');
    }
    throw error;
  }
}

// Global instances
let circuitBreaker = null;
let retryHandler = null;
let connectionRefreshManager = null;
let errorRecovery = null;

/**
 * Initialize refresh and recovery components
 */
export function initializeRefreshRecovery(options = {}) {
  circuitBreaker = new CircuitBreaker(options.circuitBreaker);
  retryHandler = new RetryHandler(options.retryHandler);
  connectionRefreshManager = new ConnectionRefreshManager(options.connectionRefresh);
  errorRecovery = new ErrorRecovery(options.errorRecovery);

  // Register default recovery strategies
  errorRecovery.registerStrategy('default', errorRecovery.logAndContinue.bind(errorRecovery));
  errorRecovery.registerStrategy('ECONNREFUSED', errorRecovery.retryWithBackoff.bind(errorRecovery));
  errorRecovery.registerStrategy('ETIMEDOUT', errorRecovery.retryWithBackoff.bind(errorRecovery));
  errorRecovery.registerStrategy('fallback', errorRecovery.fallback.bind(errorRecovery));
  errorRecovery.registerStrategy('circuit-break', errorRecovery.circuitBreak.bind(errorRecovery));

  return {
    circuitBreaker,
    retryHandler,
    connectionRefreshManager,
    errorRecovery,
  };
}

/**
 * Get refresh and recovery components
 */
export function getRefreshRecovery() {
  if (!circuitBreaker || !retryHandler || !connectionRefreshManager || !errorRecovery) {
    throw new Error('Refresh/recovery not initialized. Call initializeRefreshRecovery first.');
  }

  return {
    circuitBreaker,
    retryHandler,
    connectionRefreshManager,
    errorRecovery,
  };
}
