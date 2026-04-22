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
    case 'test_coverage':
      return await check_test_coverage({ path });
    case 'confirm':
      return await confirm_dangerous_operation({ operation_desc });
    case 'repetitive':
      return await check_for_repetitive_patterns({ operations });
    case 'run_tests':
      return await run_related_tests({ path });
    default:
      return {
        isError: true,
        content: [{ type: 'text', text: `Unknown operation: ${operation}` }],
      };
  }
}

export const safetyHandlers = {
  safety_check: safety_check_handler,
  check_for_anti_patterns: async args => {
    try {
      const fs = await import('fs/promises');
      const content = await fs.readFile(args.path, 'utf-8');
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

  confirm_dangerous_operation: async args => {
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

  check_for_repetitive_patterns: async args => {
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

  check_test_coverage: async args => {
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

  run_related_tests: async args => {
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
