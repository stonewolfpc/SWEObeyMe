/**
 * SWEObeyMe C# Bridge Handlers
 *
 * Responsibility: C# Bridge specific handlers (error detection, config, undo)
 * Separated from: lib/tools/csharp-handlers.js (SoC compliance)
 *
 * @module lib/tools/csharp/bridge-handlers
 */

import * as path from 'path';

// v1.1.0 C# Bridge handlers
export const csharpBridgeHandlers = {
  get_csharp_errors: async (args) => {
    try {
      const { severityThreshold = 0 } = args;
      const workspace = process.cwd();

      // Get all C# files in workspace
      const csFiles = await findCsFiles(workspace);

      // Analyze each file
      const allErrors = [];
      for (const filePath of csFiles.slice(0, 50)) {
        // Limit to prevent timeouts
        const result = await analyzeCSharpFile(filePath);
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
            text: `Found ${allErrors.length} C# errors in workspace:\n\n${allErrors
              .map(
                (e) =>
                  `[${e.severity === 2 ? 'Error' : e.severity === 1 ? 'Warning' : 'Info'}] ${e.fileName}:${e.line}: ${e.message}`
              )
              .join('\n')}`,
          },
        ],
        errors: allErrors,
        totalFiles: csFiles.length,
        filesScanned: Math.min(csFiles.length, 50),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[SWEObeyMe C#] Error in get_csharp_errors:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error analyzing C# files: ${error.message}`,
          },
        ],
        isError: true,
        error: error.message,
      };
    }
  },

  get_csharp_errors_for_file: async (args) => {
    if (!args.path) {
      return {
        content: [{ type: 'text', text: 'Error: path parameter is required' }],
        isError: true,
      };
    }

    try {
      const result = await analyzeCSharpFile(args.path);
      const { severityThreshold = 0 } = args;
      const filtered = result.errors?.filter((e) => e.severity >= severityThreshold) || [];

      return {
        content: [
          {
            type: 'text',
            text:
              filtered.length > 0
                ? `C# errors in ${path.basename(args.path)}:\n\n${filtered
                    .map(
                      (e) =>
                        `[${e.severity === 2 ? 'Error' : e.severity === 1 ? 'Warning' : 'Info'}] Line ${e.line}: ${e.message}`
                    )
                    .join('\n')}`
                : `No C# errors found in ${path.basename(args.path)}`,
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

  get_csharp_integrity_report: async (args) => {
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
              `Score: ${report.score}/100\n` +
              `Status: ${report.score >= 90 ? 'EXCELLENT' : report.score >= 70 ? 'GOOD' : report.score >= 50 ? 'FAIR' : 'POOR'}\n\n` +
              `High-value rules: ${report.highValueRules}\n` +
              `Total errors: ${report.totalErrors}\n\n` +
              `Recommendations:\n${report.recommendations.map((r) => `- ${r}`).join('\n')}`,
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

  toggle_csharp_error_type: async (args) => {
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

      // Update the rule state
      rule.enabled = args.enabled;

      // Clear caches to apply changes
      clearCaches();

      return {
        content: [
          {
            type: 'text',
            text: `${args.enabled ? 'Enabled' : 'Disabled'} C# error detection: ${rule.name}\n\n${rule.description}`,
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

  set_csharp_ai_informed: async (args) => {
    if (typeof args.enabled !== 'boolean') {
      return {
        content: [{ type: 'text', text: 'Error: enabled parameter must be boolean' }],
        isError: true,
      };
    }

    try {
      // Update global config
      global.csharpConfig = {
        ...(global.csharpConfig || {}),
        keepAiInformed: args.enabled,
      };

      return {
        content: [
          {
            type: 'text',
            text:
              `AI error notification ${args.enabled ? 'enabled' : 'disabled'}\n\n` +
              `When enabled, C# errors will be automatically injected into tool outputs.`,
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

  update_csharp_config: async (args) => {
    try {
      // Update global config with new settings
      global.csharpConfig = {
        ...(global.csharpConfig || {}),
        ...args,
      };

      return {
        content: [
          {
            type: 'text',
            text:
              'C# Bridge configuration updated successfully\n\n' +
              `Settings: ${Object.keys(args).join(', ')}`,
          },
        ],
        config: global.csharpConfig,
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
