/**
 * Auto-Enforcement Tool Registry
 * Tools for automated rule enforcement and surgical compliance
 */

export function getAutoEnforcementToolDefinitions() {
  return [
    {
      name: 'auto_enforce',
      priority: 98,
      description: 'AUTO-ENFORCEMENT SWISS-ARMY-KNIFE - Validate files, get enforcement status, update thresholds, toggle enforcement, get stats, clear violations, or suggest refactoring. This is your swiss-army-knife for automated rule enforcement. Use this when: validating files against rules, checking enforcement status, updating thresholds, or getting violation statistics. CRITICAL for preventing architectural violations and maintaining code quality. Example: auto_enforce with operation="validate" before writing to check for violations.',
      inputSchema: {
        type: 'object',
        properties: {
          operation: {
            type: 'string',
            enum: ['validate', 'status', 'update_thresholds', 'toggle', 'stats', 'clear', 'suggest'],
            description: 'Operation to perform',
          },
          path: { type: 'string', description: 'File path to validate (for "validate" or "suggest" operations)' },
          content: { type: 'string', description: 'File content to validate (for "validate" operation)' },
          thresholds: { type: 'object', description: 'Thresholds to update (for "update_thresholds" operation)' },
          enabled: { type: 'boolean', description: 'Enable or disable enforcement (for "toggle" operation)' },
        },
        required: ['operation'],
      },
    },
  ];
}

export function getAuditToolDefinitions() {
  return [
    {
      name: 'audit',
      priority: 97,
      description: 'AUDIT SYSTEM - Run pre-work audit, get audit status, or get issues. Use this when: starting new work, checking audit status, or reviewing detected issues. CRITICAL for preventing duplicate implementations and maintaining project organization. Example: audit with operation="pre_work" before starting new work to detect existing implementations.',
      inputSchema: {
        type: 'object',
        properties: {
          operation: {
            type: 'string',
            enum: ['pre_work', 'status', 'issues'],
            description: 'Operation to perform',
          },
          taskDescription: { type: 'string', description: 'Task description for pre-work audit (for "pre_work" operation)' },
        },
        required: ['operation'],
      },
    },
    {
      name: 'scan_duplicates',
      priority: 96,
      description: 'DUPLICATE SCANNER - Scan codebase for duplicate implementations, UI elements, or config issues. Use this when: finding duplicate code, duplicate UI panels, duplicate command IDs, or duplicate view IDs. CRITICAL for preventing duplicate implementations and maintaining clean codebase. Example: scan_duplicates to find all duplicates in the codebase.',
      inputSchema: {
        type: 'object',
        properties: {
          targetDescription: { type: 'string', description: 'Target description to scan for (optional - if not provided, scans entire codebase)' },
        },
        required: [],
      },
    },
  ];
}
