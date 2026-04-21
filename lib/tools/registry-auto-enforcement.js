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
      description: 'AUDIT SYSTEM SWISS-ARMY-KNIFE - Run pre-work audit, get audit status, get issues, schedule TODOs, get due TODOs, complete TODOs, get TODO schedules, clear completed TODOs, or audit directory structure. This is your swiss-army-knife for automated auditing. Use this when: starting new work, checking audit status, managing TODOs, or auditing directory structure. CRITICAL for preventing duplicate implementations and maintaining project organization. Example: audit with operation="pre_work" before starting new work to detect duplicates.',
      inputSchema: {
        type: 'object',
        properties: {
          operation: {
            type: 'string',
            enum: ['pre_work', 'status', 'issues', 'schedule_todo', 'due_todos', 'complete_todo', 'todo_schedules', 'clear_completed', 'audit_directory'],
            description: 'Operation to perform',
          },
          taskDescription: { type: 'string', description: 'Task description for pre-work audit (for "pre_work" operation)' },
          todo: { type: 'object', description: 'TODO to schedule (for "schedule_todo" operation)' },
          todoId: { type: 'string', description: 'TODO ID to complete (for "complete_todo" operation)' },
          directory: { type: 'string', description: 'Directory to audit (for "audit_directory" operation)' },
        },
        required: ['operation'],
      },
    },
  ];
}
