/**
 * Fallback Behavior System
 * Provides intelligent fallback when tools fail
 * Ensures AI agents don't hallucinate or give up
 */

import { toolHandlers } from './tools/handlers.js';
import { getProjectMemory } from './project-memory.js';
import { sessionMemory, recordAction } from './session.js';

/**
 * Fallback strategies for different failure types
 */
export const FALLBACK_STRATEGIES = {
  FILE_NOT_FOUND: {
    name: 'File Not Found',
    priority: 1,
    actions: [
      {
        step: 'search',
        description: 'Search for similar files',
        tool: 'search_code_files',
        params: { query: '{filename}', directory: '{workspace}' },
      },
      {
        step: 'list',
        description: 'List directory to verify structure',
        tool: 'list_directory',
        params: { path: '{dir}' },
      },
      {
        step: 'ask',
        description: 'Ask user for correct path',
        tool: null,
        params: {},
      },
    ],
  },

  TOOL_FAILURE: {
    name: 'Tool Failed',
    priority: 2,
    actions: [
      {
        step: 'retry_with_context',
        description: 'Retry with additional context',
        tool: '{failed_tool}',
        params: '{original_params} + context',
      },
      {
        step: 'analyze',
        description: 'Analyze why tool failed',
        tool: 'get_operation_guidance',
        params: { operation: '{failed_tool}' },
      },
      {
        step: 'alternative',
        description: 'Try alternative approach',
        tool: 'suggest_alternatives',
        params: { failed_operation: '{failed_tool}' },
      },
    ],
  },

  PERMISSION_DENIED: {
    name: 'Permission Denied',
    priority: 3,
    actions: [
      {
        step: 'check_ignore',
        description: 'Check if file is in .sweignore',
        tool: null,
        params: {},
      },
      {
        step: 'ask_permission',
        description: 'Ask user for permission',
        tool: null,
        params: {},
      },
    ],
  },

  SYNTAX_ERROR: {
    name: 'Syntax Error',
    priority: 4,
    actions: [
      {
        step: 'verify',
        description: 'Verify syntax with dedicated tool',
        tool: 'verify_syntax',
        params: { code: '{content}' },
      },
      {
        step: 'repair',
        description: 'Attempt auto-repair',
        tool: 'auto_repair_submission',
        params: { type: 'code', raw_content: '{content}' },
      },
      {
        step: 'validate',
        description: 'Comprehensive validation',
        tool: 'validate_change_before_apply',
        params: { path: '{path}', content: '{content}' },
      },
    ],
  },

  IMPORT_ERROR: {
    name: 'Import Error',
    priority: 5,
    actions: [
      {
        step: 'verify_imports',
        description: 'Verify all imports exist',
        tool: 'verify_imports',
        params: { path: '{path}', content: '{content}' },
      },
      {
        step: 'search',
        description: 'Search for missing imports',
        tool: 'search_code_files',
        params: { query: '{import_name}' },
      },
    ],
  },

  LOOP_DETECTED: {
    name: 'Loop Detected',
    priority: 6,
    actions: [
      {
        step: 'analyze_session',
        description: 'Analyze session context',
        tool: 'get_session_context',
        params: {},
      },
      {
        step: 'directive',
        description: 'Get architectural directive',
        tool: 'get_architectural_directive',
        params: {},
      },
      {
        step: 'recovery',
        description: 'Request surgical recovery',
        tool: 'request_surgical_recovery',
        params: { reason: 'Loop detected' },
      },
    ],
  },

  UNKNOWN_ERROR: {
    name: 'Unknown Error',
    priority: 99,
    actions: [
      {
        step: 'explain',
        description: 'Get explanation',
        tool: 'explain_rejection',
        params: { reason: '{error_message}' },
      },
      {
        step: 'guidance',
        description: 'Get operation guidance',
        tool: 'get_operation_guidance',
        params: { operation: '{operation}' },
      },
      {
        step: 'ask',
        description: 'Ask user for help',
        tool: null,
        params: {},
      },
    ],
  },
};

/**
 * Fallback execution state
 */
let fallbackState = {
  attempts: new Map(),
  maxAttempts: 3,
  currentFallback: null,
};

/**
 * Execute fallback strategy for a failure
 */
export async function executeFallback(failureType, context = {}) {
  const strategy = FALLBACK_STRATEGIES[failureType] || FALLBACK_STRATEGIES.UNKNOWN_ERROR;

  fallbackState.currentFallback = {
    type: failureType,
    strategy: strategy.name,
    startTime: Date.now(),
  };

  const results = [];

  for (const action of strategy.actions) {
    const attemptKey = `${failureType}_${action.step}`;
    const attempts = fallbackState.attempts.get(attemptKey) || 0;

    if (attempts >= fallbackState.maxAttempts) {
      results.push({
        step: action.step,
        status: 'skipped',
        reason: 'Max attempts reached',
      });
      continue;
    }

    fallbackState.attempts.set(attemptKey, attempts + 1);

    try {
      const result = await executeFallbackAction(action, context);
      results.push({
        step: action.step,
        status: 'success',
        result,
      });

      // If action succeeded, return early
      if (result && result.success) {
        fallbackState.currentFallback = null;
        return {
          success: true,
          strategy: strategy.name,
          resolvedBy: action.step,
          results,
        };
      }
    } catch (error) {
      results.push({
        step: action.step,
        status: 'failed',
        error: error.message,
      });
    }
  }

  fallbackState.currentFallback = null;

  return {
    success: false,
    strategy: strategy.name,
    results,
    suggestion: `All fallback attempts failed. Consider: ${strategy.actions.map((a) => a.description).join(', ')}`,
  };
}

/**
 * Execute a single fallback action
 */
async function executeFallbackAction(action, context) {
  // Substitute parameters
  const params = substituteParams(action.params, context);

  if (action.tool === null) {
    // Non-tool action (ask user, etc.)
    return {
      success: true,
      message: action.description,
      requiresUserInput: true,
    };
  }

  if (action.tool === '{failed_tool}') {
    // Retry the failed tool with context
    return {
      success: false,
      message: 'Retry with context would be implemented by the caller',
    };
  }

  // Call the tool handler
  if (toolHandlers[action.tool]) {
    const result = await toolHandlers[action.tool](params);
    return {
      success: !result.isError,
      result,
    };
  }

  return {
    success: false,
    message: `Tool ${action.tool} not found`,
  };
}

/**
 * Substitute parameters in action template
 */
function substituteParams(template, context) {
  if (typeof template !== 'string') {
    return template;
  }

  let result = template;

  // Common substitutions
  const substitutions = {
    '{filename}': context.filename || context.path ? path.basename(context.path) : '',
    '{workspace}': context.workspace || process.cwd(),
    '{dir}': context.path ? path.dirname(context.path) : '',
    '{failed_tool}': context.failedTool || '',
    '{original_params}': JSON.stringify(context.originalParams || {}),
    '{content}': context.content || '',
    '{path}': context.path || '',
    '{import_name}': context.importName || '',
    '{error_message}': context.errorMessage || '',
    '{operation}': context.operation || '',
  };

  for (const [key, value] of Object.entries(substitutions)) {
    result = result.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
  }

  // Try to parse as JSON if it looks like an object
  if (result.startsWith('{') && result.endsWith('}')) {
    try {
      return JSON.parse(result);
    } catch {
      return result;
    }
  }

  return result;
}

/**
 * Detect failure type from error
 */
export function detectFailureType(error, context = {}) {
  const errorMessage = error.message || error.toString() || '';

  if (errorMessage.includes('ENOENT') || errorMessage.includes('no such file')) {
    return 'FILE_NOT_FOUND';
  }

  if (errorMessage.includes('EACCES') || errorMessage.includes('permission')) {
    return 'PERMISSION_DENIED';
  }

  if (errorMessage.includes('SyntaxError') || errorMessage.includes('syntax')) {
    return 'SYNTAX_ERROR';
  }

  if (errorMessage.includes('import') || errorMessage.includes('module')) {
    return 'IMPORT_ERROR';
  }

  if (errorMessage.includes('loop') || errorMessage.includes('repeated')) {
    return 'LOOP_DETECTED';
  }

  return 'UNKNOWN_ERROR';
}

/**
 * Get fallback suggestions for user
 */
export function getFallbackSuggestions(failureType, context = {}) {
  const strategy = FALLBACK_STRATEGIES[failureType] || FALLBACK_STRATEGIES.UNKNOWN_ERROR;

  const suggestions = [`Failure Type: ${strategy.name}`, 'Suggested Actions:'];

  strategy.actions.forEach((action, index) => {
    suggestions.push(`${index + 1}. ${action.description}`);
    if (action.tool) {
      suggestions.push(`   Tool: ${action.tool}`);
    }
  });

  return suggestions.join('\n');
}

/**
 * Reset fallback state
 */
export function resetFallbackState() {
  fallbackState.attempts.clear();
  fallbackState.currentFallback = null;
}

/**
 * Get fallback statistics
 */
export function getFallbackStats() {
  return {
    attempts: Object.fromEntries(fallbackState.attempts),
    currentFallback: fallbackState.currentFallback,
    maxAttempts: fallbackState.maxAttempts,
  };
}
