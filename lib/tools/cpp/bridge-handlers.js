/**
 * SWEObeyMe C++ Bridge Handlers
 *
 * Responsibility: C++ Bridge specific handlers (error detection, config, undo)
 * Separated from: lib/tools/cpp-handlers.js (SoC compliance)
 *
 * @module lib/tools/cpp/bridge-handlers
 */

import * as path from 'path';
import { analyzeCppFile, getIntegrityReport, errorRules, clearCaches } from '../../cpp-bridge.js';
import { restoreBackup } from '../../backup.js';

// v1.1.0 C++ Bridge handlers
export const cppBridgeHandlers = {
  get_cpp_errors: async (args) => {
    try {
      const { severityThreshold = 0 } = args;
      const workspace = process.cwd();

      // Get all C++ files in workspace
      const cppFiles = await findCppFiles(workspace);

      // Analyze each file
      const allErrors = [];
      for (const filePath of cppFiles.slice(0, 50)) {
        // Limit to prevent timeouts
        const result = await analyzeCppFile(filePath);
        if (result.errors) {
          const filtered = result.errors.filter((e) => e.severity >= severityThreshold);
          allErrors.push(
            ...filtered.map((e) => ({
              ...e,
              file: filePath,
              fileName: path.basename(filePath),
            }))
          );
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: `Found ${allErrors.length} C++ errors in workspace:\n\n${allErrors
              .map(
                (e) =>
                  `[${e.severity === 2 ? 'Error' : e.severity === 1 ? 'Warning' : 'Info'}] ${e.fileName}:${e.lineRanges?.[0]?.startLine || '?'}: ${e.name}`
              )
              .join('\n')}`,
          },
        ],
        errors: allErrors,
        totalFiles: cppFiles.length,
        filesScanned: Math.min(cppFiles.length, 50),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[SWEObeyMe C++] Error in get_cpp_errors:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error analyzing C++ files: ${error.message}`,
          },
        ],
        isError: true,
        error: error.message,
      };
    }
  },

  get_cpp_errors_for_file: async (args) => {
    if (!args.path) {
      return {
        content: [{ type: 'text', text: 'Error: path parameter is required' }],
        isError: true,
      };
    }

    try {
      const result = await analyzeCppFile(args.path);
      const { severityThreshold = 0 } = args;
      const filtered = result.errors?.filter((e) => e.severity >= severityThreshold) || [];

      return {
        content: [
          {
            type: 'text',
            text:
              filtered.length > 0
                ? `C++ errors in ${path.basename(args.path)}:\n\n${filtered
                    .map(
                      (e) =>
                        `[${e.severity === 2 ? 'Error' : e.severity === 1 ? 'Warning' : 'Info'}] Line ${e.lineRanges?.[0]?.startLine || '?'}: ${e.name}: ${typeof e.details === 'object' ? JSON.stringify(e.details) : e.details}`
                    )
                    .join('\n')}`
                : `No C++ errors found in ${path.basename(args.path)}`,
          },
        ],
        errors: filtered,
        file: args.path,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error analyzing file: ${error.message}` }],
        isError: true,
        error: error.message,
      };
    }
  },

  get_cpp_integrity_report: async (args) => {
    if (!args.path) {
      return {
        content: [{ type: 'text', text: 'Error: path parameter is required' }],
        isError: true,
      };
    }

    try {
      const report = await getIntegrityReport(args.path);

      return {
        content: [
          {
            type: 'text',
            text:
              `Surgical Integrity Report for ${path.basename(args.path)}:\n\n` +
              `Score: ${report.integrityScore}/100\n` +
              `Status: ${report.integrityScore >= 90 ? 'EXCELLENT' : report.integrityScore >= 70 ? 'GOOD' : report.integrityScore >= 50 ? 'FAIR' : 'POOR'}\n\n` +
              `Critical Errors: ${report.criticalCount}\n` +
              `Warnings: ${report.warningCount}\n` +
              `Info: ${report.infoCount}\n\n` +
              `Tools Used: ${JSON.stringify(report.toolsUsed)}\n\n` +
              `Recommendations:\n${report.context.recommendations.map((r) => `- ${r}`).join('\n')}`,
          },
        ],
        report,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error generating report: ${error.message}` }],
        isError: true,
        error: error.message,
      };
    }
  },

  toggle_cpp_error_type: async (args) => {
    if (!args.error_id || typeof args.enabled !== 'boolean') {
      return {
        content: [{ type: 'text', text: 'Error: error_id and enabled parameters are required' }],
        isError: true,
      };
    }

    try {
      // Find the rule
      const rule = errorRules.find((r) => r.id === args.error_id);
      if (!rule) {
        return {
          content: [{ type: 'text', text: `Error: Unknown error rule "${args.error_id}"` }],
          isError: true,
        };
      }

      // Update the rule state (using global config for now)
      if (!global.cppConfig) global.cppConfig = {};
      if (!global.cppConfig.disabledRules) global.cppConfig.disabledRules = [];

      if (args.enabled) {
        global.cppConfig.disabledRules = global.cppConfig.disabledRules.filter(
          (id) => id !== args.error_id
        );
      } else {
        if (!global.cppConfig.disabledRules.includes(args.error_id)) {
          global.cppConfig.disabledRules.push(args.error_id);
        }
      }

      // Clear caches to apply changes
      clearCaches();

      return {
        content: [
          {
            type: 'text',
            text: `${args.enabled ? 'Enabled' : 'Disabled'} C++ error detection: ${rule.name}\n\n${rule.description || rule.name}`,
          },
        ],
        rule,
        enabled: args.enabled,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error toggling rule: ${error.message}` }],
        isError: true,
        error: error.message,
      };
    }
  },

  set_cpp_ai_informed: async (args) => {
    if (typeof args.enabled !== 'boolean') {
      return {
        content: [{ type: 'text', text: 'Error: enabled parameter must be boolean' }],
        isError: true,
      };
    }

    try {
      // Update global config
      if (!global.cppConfig) global.cppConfig = {};
      global.cppConfig.keepAiInformed = args.enabled;

      return {
        content: [
          {
            type: 'text',
            text:
              `AI error notification ${args.enabled ? 'enabled' : 'disabled'}\n\n` +
              `When enabled, C++ errors will be automatically injected into tool outputs.`,
          },
        ],
        enabled: args.enabled,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error updating setting: ${error.message}` }],
        isError: true,
        error: error.message,
      };
    }
  },

  update_cpp_config: async (args) => {
    try {
      // Update global config with new settings
      if (!global.cppConfig) global.cppConfig = {};
      global.cppConfig = {
        ...global.cppConfig,
        ...args,
      };

      return {
        content: [
          {
            type: 'text',
            text:
              'C++ Bridge configuration updated successfully\n\n' +
              `Settings: ${Object.keys(args).join(', ')}`,
          },
        ],
        config: global.cppConfig,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error updating config: ${error.message}` }],
        isError: true,
        error: error.message,
      };
    }
  },
};

/**
 * Find C++ files in workspace
 */
async function findCppFiles(workspace) {
  const fs = await import('fs/promises');
  const { readdir } = fs;

  const cppExtensions = ['.cpp', '.cc', '.cxx', '.hpp', '.h', '.c'];
  const files = [];

  async function scanDir(dir, depth = 0) {
    if (depth > 5) return; // Limit depth

    try {
      const entries = await readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.name === 'node_modules' || entry.name === '.git') continue;

        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          await scanDir(fullPath, depth + 1);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (cppExtensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }

  await scanDir(workspace);
  return files;
}
