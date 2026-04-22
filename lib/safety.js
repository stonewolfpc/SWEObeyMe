import { REQUIRE_CONFIRMATION, MAX_OPERATIONS_PER_MINUTE } from './config.js';

/**
 * Safety mechanisms for preventing dangerous operations
 */

// Operation tracking for rate limiting
const operationHistory = [];

/**
 * Confirm dangerous operation
 */
export function confirmDangerousOperation(operation) {
  const dangerousOperations = [
    'delete',
    'remove',
    'unlink',
    'rm -rf',
    'exec',
    'eval',
    'innerHTML',
    'document.write',
  ];

  const isDangerous = dangerousOperations.some(op => operation.toLowerCase().includes(op));

  if (!isDangerous) {
    return { requiresConfirmation: false, reason: '' };
  }

  if (!REQUIRE_CONFIRMATION()) {
    return { requiresConfirmation: false, reason: 'Confirmation not required' };
  }

  return {
    requiresConfirmation: true,
    reason: `Operation contains dangerous pattern: ${operation}`,
    warning: 'This operation cannot be undone. Are you sure?',
  };
}

/**
 * Rate limit operations
 */
export function rateLimitOperation() {
  const now = Date.now();

  // Remove operations older than 1 minute
  const oneMinuteAgo = now - 60000;
  const recentOperations = operationHistory.filter(op => op > oneMinuteAgo);

  // Check if we're over the limit
  if (recentOperations.length >= MAX_OPERATIONS_PER_MINUTE()) {
    const oldestOperation = recentOperations[0];
    const waitTime = Math.ceil((oldestOperation + 60000 - now) / 1000);

    return {
      allowed: false,
      reason: `Rate limit exceeded. Wait ${waitTime} seconds before next operation.`,
      waitTime,
      operationsPerMinute: recentOperations.length,
      maxOperations: MAX_OPERATIONS_PER_MINUTE(),
    };
  }

  // Add this operation to history
  operationHistory.push(now);

  return {
    allowed: true,
    operationsPerMinute: recentOperations.length,
    maxOperations: MAX_OPERATIONS_PER_MINUTE(),
  };
}

/**
 * Sandbox execution using Node.js vm module
 */
export function sandboxExecution(code, _filePath) {
  const result = {
    success: true,
    output: '',
    errors: [],
    warnings: [],
  };

  try {
    const vm = require('vm');
    
    // Basic validation before execution
    if (code.includes('process.exit')) {
      result.warnings.push('Code contains process.exit() call');
    }

    if (code.includes('require(') && !code.includes('fs.') && !code.includes('path.')) {
      result.warnings.push('Code may attempt to load external modules');
    }

    // Create a sandbox with restricted access
    const sandbox = {
      console: {
        log: (...args) => { result.output += args.join(' ') + '\n'; },
        error: (...args) => { result.errors.push(args.join(' ')); },
        warn: (...args) => { result.warnings.push(args.join(' ')); },
      },
      setTimeout: () => { result.warnings.push('setTimeout called - not allowed in sandbox'); },
      setInterval: () => { result.warnings.push('setInterval called - not allowed in sandbox'); },
      process: {
        env: {},
        platform: process.platform,
        arch: process.arch,
      },
    };

    // Execute code in sandbox with timeout
    const script = new vm.Script(code, {
      timeout: 5000, // 5 second timeout
    });

    const context = vm.createContext(sandbox);
    script.runInContext(context, { timeout: 5000 });

    result.success = true;
  } catch (error) {
    result.success = false;
    result.errors.push(error.message);
  }

  return result;
}

/**
 * Check for repetitive patterns (loop detection)
 */
export function checkForRepetitivePatterns(operations) {
  const patterns = [];
  const threshold = 3;

  // Check for repeated operations on same file
  const fileOperations = {};
  operations.forEach(op => {
    if (!op.file) return;
    fileOperations[op.file] = (fileOperations[op.file] || 0) + 1;
  });

  for (const [file, count] of Object.entries(fileOperations)) {
    if (count >= threshold) {
      patterns.push({
        type: 'repetitive_file_operation',
        file,
        count,
        message: `${count} operations on file ${file}`,
      });
    }
  }

  // Check for repeated tool calls
  const toolOperations = {};
  operations.forEach(op => {
    if (!op.tool) return;
    toolOperations[op.tool] = (toolOperations[op.tool] || 0) + 1;
  });

  for (const [tool, count] of Object.entries(toolOperations)) {
    if (count >= threshold) {
      patterns.push({
        type: 'repetitive_tool_call',
        tool,
        count,
        message: `${count} calls to tool ${tool}`,
      });
    }
  }

  return {
    hasRepetitivePatterns: patterns.length > 0,
    patterns,
    suggestion:
      patterns.length > 0 ? 'Consider breaking out of the loop or using a different approach' : '',
  };
}

/**
 * Validate operation safety
 */
export function validateOperationSafety(operation, content) {
  const result = {
    safe: true,
    warnings: [],
    errors: [],
    requiresConfirmation: false,
  };

  // Check for dangerous patterns
  const dangerousPatterns = [
    { pattern: /rm\s+-rf/g, severity: 'critical' },
    { pattern: /exec\s*\(/g, severity: 'high' },
    { pattern: /eval\s*\(/g, severity: 'high' },
    { pattern: /innerHTML\s*=/g, severity: 'medium' },
  ];

  dangerousPatterns.forEach(({ pattern, severity }) => {
    const matches = content.match(pattern);
    if (matches) {
      result.warnings.push(`Dangerous pattern detected: ${pattern} (${severity} severity)`);
      if (severity === 'critical') {
        result.safe = false;
        result.errors.push('Critical safety violation');
      }
      if (severity === 'high' || severity === 'critical') {
        result.requiresConfirmation = true;
      }
    }
  });

  // Check for large file operations
  if (content.length > 100000) {
    // 100KB
    result.warnings.push('Large file operation (>100KB)');
  }

  return result;
}
