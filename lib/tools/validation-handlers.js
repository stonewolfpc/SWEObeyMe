import fs from "fs/promises";
import { dryRunWriteFile, verifySyntax, verifyImports } from "../verification.js";
import { checkForAntiPatterns } from "../guardrails.js";
import { validateNamingConventions } from "../validation.js";

/**
 * Validation and verification tool handlers
 */

export const validationHandlers = {
  dry_run_write_file: async (args) => {
    try {
      const result = await dryRunWriteFile(args.path, args.content);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    } catch (error) {
      return { isError: true, content: [{ type: "text", text: `Dry run failed: ${error.message}` }] };
    }
  },

  validate_change_before_apply: async (args) => {
    try {
      const { validateCodeComprehensive } = await import("../validation.js");
      const result = await validateCodeComprehensive(args.content, args.path);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    } catch (error) {
      return { isError: true, content: [{ type: "text", text: `Validation failed: ${error.message}` }] };
    }
  },

  verify_syntax: async (args) => {
    try {
      const result = verifySyntax(args.code, args.language);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    } catch (error) {
      return { isError: true, content: [{ type: "text", text: `Syntax verification failed: ${error.message}` }] };
    }
  },

  verify_imports: async (args) => {
    try {
      const result = await verifyImports(args.content, args.path);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    } catch (error) {
      return { isError: true, content: [{ type: "text", text: `Import verification failed: ${error.message}` }] };
    }
  },

  check_for_anti_patterns: async (args) => {
    try {
      const content = await fs.readFile(args.path, 'utf-8');
      const result = checkForAntiPatterns(content);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    } catch (error) {
      return { isError: true, content: [{ type: "text", text: `Anti-pattern check failed: ${error.message}` }] };
    }
  },

  validate_naming_conventions: async (args) => {
    try {
      const content = await fs.readFile(args.path, 'utf-8');
      const result = validateNamingConventions(content);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    } catch (error) {
      return { isError: true, content: [{ type: "text", text: `Naming validation failed: ${error.message}` }] };
    }
  }
};
