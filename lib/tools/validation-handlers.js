import fs from 'fs/promises';
import { readFileWithSizeLimit } from '../shared/async-utils.js';
import { dryRunWriteFile, verifySyntax, verifyImports } from '../verification.js';
import { checkForAntiPatterns } from '../guardrails.js';
import { validateNamingConventions } from '../validation.js';

/**
 * Validation and verification tool handlers
 */

export const validationHandlers = {
  dry_run_write_file: async (args) => {
    try {
      const result = await dryRunWriteFile(args.path, args.content);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Dry run failed: ${error.message}` }],
      };
    }
  },

  validate_change_before_apply: async (args) => {
    try {
      const { validateCodeComprehensive } = await import('../validation.js');
      const result = await validateCodeComprehensive(args.content, args.path);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Validation failed: ${error.message}` }],
      };
    }
  },

  verify_syntax: async (args) => {
    try {
      const result = verifySyntax(args.code, args.language);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Syntax verification failed: ${error.message}` }],
      };
    }
  },

  verify_imports: async (args) => {
    try {
      const result = await verifyImports(args.content, args.path);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Import verification failed: ${error.message}` }],
      };
    }
  },

  check_for_anti_patterns: async (args) => {
    try {
      const content = await readFileWithSizeLimit(args.path);
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

  validate_naming_conventions: async (args) => {
    try {
      const content = await readFileWithSizeLimit(args.path);
      const result = validateNamingConventions(content);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Naming validation failed: ${error.message}` }],
      };
    }
  },

  validate_code: async (args) => {
    try {
      const { operation, path, content, checks, language = 'javascript' } = args;

      // Handle specific operations (swiss-army-knife pattern)
      if (operation) {
        switch (operation) {
          case 'dry_run':
            return await validationHandlers.dry_run_write_file({ path, content });
          case 'verify_syntax':
            return await validationHandlers.verify_syntax({
              code: content || (path ? await fs.readFile(path, 'utf-8') : null),
              language,
            });
          case 'verify_imports':
            return await validationHandlers.verify_imports({
              content: content || (path ? await fs.readFile(path, 'utf-8') : null),
              path,
            });
          case 'check_anti_patterns':
            return await validationHandlers.check_for_anti_patterns({ path });
          case 'validate_naming':
            return await validationHandlers.validate_naming_conventions({ path });
          case 'comprehensive':
            return await validationHandlers.validate_change_before_apply({ content, path });
          default:
            return {
              isError: true,
              content: [
                {
                  type: 'text',
                  text: `Unknown operation: ${operation}. Valid: dry_run, verify_syntax, verify_imports, check_anti_patterns, validate_naming, comprehensive`,
                },
              ],
            };
        }
      }

      // Default behavior: run all checks
      const codeContent = content || (path ? await fs.readFile(path, 'utf-8') : null);

      if (!codeContent) {
        return {
          isError: true,
          content: [{ type: 'text', text: 'Either path or content is required' }],
        };
      }

      const results = [];
      const checksToRun = checks || [
        'syntax',
        'anti_patterns',
        'naming',
        'imports',
        'documentation',
      ];

      if (checksToRun.includes('syntax')) {
        const result = verifySyntax(codeContent, language);
        results.push({ check: 'syntax', ...result });
      }

      if (checksToRun.includes('anti_patterns')) {
        const result = checkForAntiPatterns(codeContent);
        results.push({ check: 'anti_patterns', ...result });
      }

      if (checksToRun.includes('naming')) {
        const result = validateNamingConventions(codeContent);
        results.push({ check: 'naming', ...result });
      }

      if (checksToRun.includes('imports') && path) {
        const result = await verifyImports(codeContent, path);
        results.push({ check: 'imports', ...result });
      }

      return {
        content: [{ type: 'text', text: JSON.stringify({ checks: results }, null, 2) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Code validation failed: ${error.message}` }],
      };
    }
  },
};
