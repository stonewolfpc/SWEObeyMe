/**
 * C# tool definitions
 */

export function getCSharpToolDefinitions() {
  return [
    {
      name: 'get_csharp_errors',
      priority: 75,
      description: 'C# ERROR ANALYSIS - Get all C# errors in the workspace. Returns errors with severity levels (Info/Warning/Error), line ranges, and file paths. Use this when: checking overall C# code quality across the workspace before making changes.',
      inputSchema: {
        type: 'object',
        properties: {
          severityThreshold: {
            type: 'number',
            default: 0,
            description: 'Minimum severity level (0=Info, 1=Warning, 2=Error)',
          },
        },
      },
    },
    {
      name: 'get_csharp_errors_for_file',
      priority: 75,
      description: 'C# FILE ERROR ANALYSIS - Get C# errors for a specific file. Returns errors with severity levels and line ranges. Use this when: analyzing a specific C# file before editing or after changes to verify no new errors introduced.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to analyze' },
          severityThreshold: {
            type: 'number',
            default: 0,
            description: 'Minimum severity level (0=Info, 1=Warning, 2=Error)',
          },
        },
        required: ['path'],
      },
    },
    {
      name: 'get_csharp_integrity_report',
      priority: 75,
      description: 'C# INTEGRITY REPORT - Generate surgical integrity report for a C# file. Returns score (0-100), status, high-value rules, total errors, and recommendations. Use this when: evaluating C# file quality before committing or after refactoring.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to analyze' },
        },
        required: ['path'],
      },
    },
    {
      name: 'toggle_csharp_error_type',
      priority: 70,
      description: 'C# ERROR TYPE TOGGLE - Enable or disable specific C# error detection rules. Use this when: reducing false positives by disabling noisy rules, or enabling additional checks for stricter analysis.',
      inputSchema: {
        type: 'object',
        properties: {
          error_id: { type: 'string', description: 'Error rule ID to toggle' },
          enabled: { type: 'boolean', description: 'Enable or disable' },
        },
        required: ['error_id', 'enabled'],
      },
    },
    {
      name: 'set_csharp_ai_informed',
      priority: 70,
      description: 'C# AI-INFORMED MODE - Toggle automatic error injection into tool outputs. When enabled, C# errors will be automatically injected into tool responses. Use this when: wanting AI to be aware of C# errors without explicit requests.',
      inputSchema: {
        type: 'object',
        properties: {
          enabled: { type: 'boolean', description: 'Enable or disable AI-informed mode' },
        },
        required: ['enabled'],
      },
    },
    {
      name: 'update_csharp_config',
      priority: 70,
      description: 'C# CONFIG UPDATE - Update C# Bridge configuration settings. Can configure severity thresholds, confidence thresholds, detector settings, and more. Use this when: customizing C# error detection behavior for your project.',
      inputSchema: {
        type: 'object',
        properties: {
          severityThreshold: { type: 'number', description: 'Minimum severity level' },
          confidenceThreshold: { type: 'number', description: 'Minimum confidence score (0-100)' },
          detectors: { type: 'object', description: 'Detector settings' },
        },
      },
    },
  ];
}
