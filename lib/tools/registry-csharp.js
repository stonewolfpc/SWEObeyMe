/**
 * C# tool definitions
 */

export function getCSharpToolDefinitions() {
  return [
    {
      name: 'get_csharp_errors',
      priority: 10,
      description: 'Get C# errors in the workspace with severity colors and line ranges.',
      inputSchema: {
        type: 'object',
        properties: {
          severity_threshold: {
            default: 0,
            description: 'Minimum severity level to return (0=Info, 1=Warning, 2=Error)',
            type: 'number',
          },
        },
      },
    },
    {
      name: 'get_csharp_errors_for_file',
      priority: 10,
      description: 'MUST use this tool to get C# errors for a specific file - this is the ONLY way to check individual files. Returns errors with severity colors and line ranges. Only returns broken nodes (Edit, Do not Replace rule). Example: Check errors in Program.cs before making changes.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to analyze - REQUIRED' },
          severity_threshold: {
            default: 0,
            description: 'Minimum severity level to return (0=Info, 1=Warning, 2=Error)',
            type: 'number',
          },
        },
        required: ['path'],
      },
    },
    {
      name: 'get_integrity_report',
      priority: 10,
      description: 'MUST use this tool to get detailed integrity report for C# errors - this is the ONLY way to understand error context in relation to high-value rules. Returns integrity score, error breakdown by rule, and architectural recommendations. CRITICAL for understanding why errors happened. Example: Get integrity report for Program.cs to understand architectural impact.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to analyze - REQUIRED' },
        },
        required: ['path'],
      },
    },
    {
      name: 'toggle_csharp_error_type',
      priority: 10,
      description: 'MUST use this tool to enable/disable specific C# error checks - this is the ONLY way to configure error detection. Allows fine-grained control over which errors are reported. Example: Disable "string_concatenation" check if it produces false positives.',
      inputSchema: {
        type: 'object',
        properties: {
          enabled: { type: 'boolean', description: 'Enable or disable this error check - REQUIRED' },
          error_id: { type: 'string', description: 'Error rule ID to toggle - REQUIRED' },
        },
        required: ['error_id', 'enabled'],
      },
    },
    {
      name: 'set_csharp_ai_informed',
      priority: 10,
      description: 'MUST use this tool to toggle "Keep AI Informed" feature - this is the ONLY way to control automatic error injection. When enabled, C# errors are automatically injected into file reads based on Surgical Integrity Score throttling. Example: Enable to automatically inform AI about critical errors without being asked.',
      inputSchema: {
        type: 'object',
        properties: {
          enabled: { type: 'boolean', description: 'Enable or disable Keep AI Informed - REQUIRED' },
        },
        required: ['enabled'],
      },
    },
    {
      name: 'update_csharp_config',
      priority: 10,
      description: 'MUST use this tool to update C# Bridge configuration - this is the ONLY way to update analysis settings at runtime. Updates confidence threshold, deduplication, cooldown, and detector settings. Clears caches when configuration changes. Example: Update confidence threshold to 80 to reduce false positives.',
      inputSchema: {
        type: 'object',
        properties: {
          alertCooldown: { type: 'number', description: 'Cooldown in seconds before repeating same alert' },
          confidenceThreshold: { type: 'number', description: 'Minimum confidence percentage to show alerts (0-100)' },
          deduplicateAlerts: { type: 'boolean', description: 'Group identical warnings to reduce noise' },
          detectors: { type: 'object', description: 'Enable/disable specific error detectors' },
        },
      },
    },
    {
      name: 'undo_last_surgical_edit',
      priority: 10,
      description: 'MUST use this tool to revert a file to its last "Pass" state - this is the ONLY way to rollback when AI fixes lower Surgical Integrity Score. Reverts file to last state with Integrity Score > 90. CRITICAL for recovering from bad AI edits. Example: Undo last edit to Program.cs if it lowered the integrity score.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to revert - REQUIRED' },
        },
        required: ['path'],
      },
    },
  ];
}
