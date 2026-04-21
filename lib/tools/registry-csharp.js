/**
 * C# tool definitions
 */

export function getCSharpToolDefinitions() {
  return [
    {
      name: 'csharp_errors',
      priority: 75,
      description: 'C# ERROR ANALYSIS - Get workspace errors, file-specific errors, or integrity reports. This is your swiss-army-knife for C# diagnostics. Returns errors with severity colors and line ranges. Use this when: checking C# errors in workspace, analyzing specific files, or getting integrity reports. CRITICAL for understanding C# code quality. Example: csharp_errors with operation="file" to check errors in Program.cs before making changes.',
      inputSchema: {
        type: 'object',
        properties: {
          operation: {
            type: 'string',
            enum: ['workspace', 'file', 'integrity'],
            description: 'Operation to perform',
          },
          path: { type: 'string', description: 'File path to analyze (for "file" or "integrity" operations)' },
          severity_threshold: {
            default: 0,
            description: 'Minimum severity level (0=Info, 1=Warning, 2=Error)',
            type: 'number',
          },
        },
        required: ['operation'],
      },
    },
    {
      name: 'csharp_config',
      priority: 70,
      description: 'C# CONFIGURATION - Toggle error types, enable AI-informed mode, or update analysis settings. This is your swiss-army-knife for C# diagnostics configuration. Use this when: enabling/disabling specific error checks, toggling automatic error injection, or updating analysis thresholds. Example: csharp_config with operation="update" to set confidence threshold to 80 and reduce false positives.',
      inputSchema: {
        type: 'object',
        properties: {
          operation: {
            type: 'string',
            enum: ['toggle_error', 'ai_informed', 'update'],
            description: 'Operation to perform',
          },
          error_id: { type: 'string', description: 'Error rule ID to toggle (for "toggle_error" operation)' },
          enabled: { type: 'boolean', description: 'Enable or disable (for "toggle_error" or "ai_informed" operations)' },
          alertCooldown: { type: 'number', description: 'Cooldown in seconds (for "update" operation)' },
          confidenceThreshold: { type: 'number', description: 'Minimum confidence percentage (for "update" operation)' },
          deduplicateAlerts: { type: 'boolean', description: 'Group identical warnings (for "update" operation)' },
          detectors: { type: 'object', description: 'Enable/disable specific detectors (for "update" operation)' },
        },
        required: ['operation'],
      },
    },
  ];
}
