import { readFileWithSizeLimit } from '../shared/async-utils.js';
import { confirmDangerousOperation, checkForRepetitivePatterns } from '../safety.js';
import { checkTestCoverage, runRelatedTests } from '../testing.js';

/**
 * Safety and testing tool handlers
 */

/**
 * Dispatcher: safety_check swiss-army-knife handler
 * Routes to appropriate handler based on operation parameter
 */
export async function safety_check_handler(params) {
  const { operation, path, operation_desc, operations } = params;

  if (!operation) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'operation parameter is required' }],
    };
  }

  switch (operation) {
    case 'test_coverage': {
      const coverageResult = await checkTestCoverage(path);
      return {
        content: [{ type: 'text', text: JSON.stringify(coverageResult, null, 2) }],
      };
    }
    case 'confirm':
      return await confirmDangerousOperation({ operation_desc });
    case 'repetitive':
      return await checkForRepetitivePatterns({ operations });
    case 'run_tests': {
      const testResult = await runRelatedTests(path);
      return {
        content: [{ type: 'text', text: JSON.stringify(testResult, null, 2) }],
      };
    }
    default:
      return {
        isError: true,
        content: [{ type: 'text', text: `Unknown operation: ${operation}` }],
      };
  }
}

export const safetyHandlers = {
  safety_check: safety_check_handler,
  check_for_anti_patterns: async (args) => {
    try {
      const content = await readFileWithSizeLimit(args.path);
      const { checkForAntiPatterns } = await import('../validation.js');
      const result = checkForAntiPatterns(content);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Anti-pattern check failed: ${error.message}` }],
      };
    }
  },

  confirm_dangerous_operation: async (args) => {
    try {
      const result = confirmDangerousOperation(args.operation);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Danger check failed: ${error.message}` }],
      };
    }
  },

  check_for_repetitive_patterns: async (args) => {
    try {
      const result = checkForRepetitivePatterns(args.operations);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Repetitive pattern check failed: ${error.message}` }],
      };
    }
  },

  check_test_coverage: async (args) => {
    try {
      const result = await checkTestCoverage(args.path);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Coverage check failed: ${error.message}` }],
      };
    }
  },

  run_related_tests: async (args) => {
    try {
      const { runRelatedTests } = await import('../testing.js');
      const result = await runRelatedTests(args.path);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Test execution failed: ${error.message}` }],
      };
    }
  },
};
