import { checkForDangerousOperations, checkForSecurityIssues } from '../guardrails.js';
import {
  confirmDangerousOperation,
  rateLimitOperation,
  checkForRepetitivePatterns,
  validateOperationSafety,
} from '../safety.js';
import { checkTestCoverage } from '../testing.js';

/**
 * Safety and testing tool handlers
 */

export const safetyHandlers = {
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
