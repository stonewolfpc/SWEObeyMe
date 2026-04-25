/**
 * Project integrity and project memory tool definitions
 * NOTE: Most project integrity tools removed - now handled by audit system
 */

export function getProjectIntegrityToolDefinitions() {
  return [];
}

export function getProjectMemoryToolDefinitions() {
  return [
    {
      name: 'project_memory',
      priority: 75,
      description:
        'Swiss-army-knife for project awareness. Index structure, analyze conventions, get summary, record decisions, or suggest file locations. Use this when: starting work on a new project, analyzing conventions, getting project summary, recording decisions, or determining where to place new files. Helps with anti-hallucination and proper project awareness.',
      inputSchema: {
        type: 'object',
        properties: {
          operation: {
            type: 'string',
            enum: ['index', 'conventions', 'summary', 'record_decision', 'suggest_location'],
            description: 'Operation to perform',
          },
          directory: { type: 'string', description: 'Directory to index (for "index" operation)' },
          decision: {
            type: 'string',
            description: 'Decision to record (for "record_decision" operation)',
          },
          fileType: { type: 'string', description: 'File type (for "suggest_location" operation)' },
          purpose: {
            type: 'string',
            description: 'File purpose (for "suggest_location" operation)',
          },
        },
        required: ['operation'],
      },
    },
  ];
}
