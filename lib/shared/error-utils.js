/**
 * Shared Error Utilities
 * Provides consistent error handling and graceful degradation for all SWEObeyMe tools
 */

import { internalAudit } from '../enforcement.js';

/**
 * Standard error response format that ensures AI understands why a tool failed
 * @param {string} toolName - Name of the tool that failed
 * @param {Error|string} error - The error that occurred
 * @param {string} context - Additional context about what was being attempted
 * @param {Object} options - Additional options
 * @returns {Object} Standardized error response
 */
export function createErrorResponse(toolName, error, context = '', options = {}) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const severity = options.severity || 'error';

  // Update audit tracking
  internalAudit.consecutiveFailures++;
  const scorePenalty = severity === 'critical' ? 15 : severity === 'warning' ? 3 : 5;
  internalAudit.surgicalIntegrityScore = Math.max(0, internalAudit.surgicalIntegrityScore - scorePenalty);

  let userMessage = `ERROR [${toolName}]: ${errorMessage}`;

  if (context) {
    userMessage += `\n\nContext: ${context}`;
  }

  // Add specific guidance based on error type
  if (errorMessage.includes('ENOENT') || errorMessage.includes('no such file')) {
    userMessage += '\n\nThe file does not exist. Please verify the path and try again.';
  } else if (errorMessage.includes('EACCES') || errorMessage.includes('permission denied')) {
    userMessage += '\n\nPermission denied. You may need elevated privileges to access this file.';
  } else if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
    userMessage += '\n\nThe operation timed out. This may be due to:\n' +
      '1. The file is too large - try using offset/limit parameters for chunked reading\n' +
      '2. The operation is too complex - try breaking it into smaller steps\n' +
      '3. System is under heavy load - try again in a moment';
  } else if (errorMessage.includes('too large') || errorMessage.includes('File too large')) {
    userMessage += '\n\nThe file is too large to process at once. Options:\n' +
      '1. Use read_file_chunked with offset and limit parameters\n' +
      '2. Use check_file_stats first to see file size\n' +
      '3. Process the file in smaller sections';
  } else if (errorMessage.includes('ENOSPC') || errorMessage.includes('no space')) {
    userMessage += '\n\nDisk space is insufficient for this operation.';
  } else if (errorMessage.includes('EMFILE') || errorMessage.includes('too many open files')) {
    userMessage += '\n\nToo many files are open. Close some files and try again.';
  }

  // Add reporting instruction for unexpected errors
  if (!errorMessage.includes('ENOENT') &&
      !errorMessage.includes('EACCES') &&
      !errorMessage.includes('timeout') &&
      !errorMessage.includes('too large') &&
      !options.expected) {
    userMessage += '\n\nThis is an unexpected error. Please report this issue on GitHub:\n' +
      'https://github.com/stonewolfpc/SWEObeyMe/issues\n' +
      `Include: tool=${toolName}, error="${errorMessage.substring(0, 100)}"`;
  }

  userMessage += `\n\n[SURGICAL INTEGRITY: ${internalAudit.surgicalIntegrityScore}/100 | Consecutive Failures: ${internalAudit.consecutiveFailures}]`;

  return {
    isError: true,
    content: [{
      type: 'text',
      text: userMessage
    }]
  };
}

/**
 * Wrap an async function with standardized error handling
 * @param {Function} fn - The function to wrap
 * @param {string} toolName - Name of the tool for error reporting
 * @param {string} context - Context for error messages
 * @returns {Function} Wrapped function with error handling
 */
export function withErrorHandling(fn, toolName, context = '') {
  return async function(...args) {
    try {
      return await fn.apply(this, args);
    } catch (error) {
      return createErrorResponse(toolName, error, context);
    }
  };
}

/**
 * Create a timeout promise that rejects after specified milliseconds
 * @param {number} ms - Timeout in milliseconds
 * @param {string} operation - Description of the operation for error message
 * @returns {Promise} Promise that rejects after timeout
 */
export function createTimeoutPromise(ms, operation) {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`${operation} timeout after ${ms}ms`));
    }, ms);
  });
}

/**
 * Check if an error is a file system error that we can provide specific guidance for
 * @param {Error} error - The error to check
 * @returns {boolean} True if it's a known file system error
 */
export function isKnownFileSystemError(error) {
  const knownCodes = ['ENOENT', 'EACCES', 'EPERM', 'EISDIR', 'ENOTDIR', 'ENOSPC', 'EMFILE'];
  return knownCodes.includes(error.code) ||
    error.message.includes('no such file') ||
    error.message.includes('permission denied');
}

/**
 * Get guidance message for a specific error type
 * @param {Error} error - The error
 * @returns {string} Guidance message
 */
export function getErrorGuidance(error) {
  const code = error.code;

  switch (code) {
    case 'ENOENT':
      return 'The file or directory does not exist. Verify the path is correct.';
    case 'EACCES':
    case 'EPERM':
      return 'Permission denied. Check file permissions or run with elevated privileges.';
    case 'EISDIR':
      return 'Expected a file but found a directory. Provide a file path, not a directory.';
    case 'ENOTDIR':
      return 'Expected a directory but found a file. Provide a directory path.';
    case 'ENOSPC':
      return 'Insufficient disk space. Free up space and try again.';
    case 'EMFILE':
      return 'Too many open files. Close other files and retry.';
    default:
      return null;
  }
}

/**
 * Log error for debugging while still returning user-friendly response
 * @param {string} toolName - Tool that encountered the error
 * @param {Error} error - The error
 * @param {Object} context - Additional context
 */
export function logToolError(toolName, error, context = {}) {
  if (process.env.DEBUG || process.env.SWEOBEYME_DEBUG) {
    console.error(`[SWEObeyMe Error] ${toolName}:`, error.message);
    if (context && Object.keys(context).length > 0) {
      console.error('  Context:', JSON.stringify(context, null, 2));
    }
    if (error.stack) {
      console.error('  Stack:', error.stack.split('\n').slice(0, 3).join('\n'));
    }
  }
}

/**
 * Success response helper - clears consecutive failures and boosts integrity score
 * @param {string} text - Response text
 * @param {Object} additionalContent - Additional content items
 * @returns {Object} Success response
 */
export function createSuccessResponse(text, additionalContent = {}) {
  internalAudit.consecutiveFailures = 0;
  internalAudit.surgicalIntegrityScore = Math.min(100, internalAudit.surgicalIntegrityScore + 2);

  const response = {
    content: [{
      type: 'text',
      text: text + `\n\n[SURGICAL INTEGRITY: ${internalAudit.surgicalIntegrityScore}/100]`
    }]
  };

  if (additionalContent.items) {
    response.content.push(...additionalContent.items);
  }

  return response;
}
