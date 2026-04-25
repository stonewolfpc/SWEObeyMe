/**
 * Context tool definitions
 */

export function getContextToolDefinitions() {
  return [
    {
      name: 'analyze_file',
      priority: 85,
      description:
        'Swiss-army-knife for understanding files. Get context, analyze change impact, find symbol references, view diffs, and get historical context. Use this BEFORE refactoring to understand ripple effects and prevent breaking changes. Use this when: planning refactoring, renaming functions, understanding dependencies, analyzing impact, or viewing what will change.',
      inputSchema: {
        type: 'object',
        properties: {
          operation: {
            type: 'string',
            enum: ['context', 'impact', 'references', 'diff', 'history'],
            description: 'Operation to perform',
          },
          path: { type: 'string', description: 'File path to analyze' },
          changes: {
            type: 'string',
            description: 'Description of changes (for "impact" operation)',
          },
          symbol: { type: 'string', description: 'Symbol name (for "references" operation)' },
          proposed_content: {
            type: 'string',
            description: 'Proposed new content (for "diff" operation)',
          },
        },
        required: ['operation', 'path'],
      },
    },
  ];
}
