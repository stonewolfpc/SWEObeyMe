/**
 * Context tool definitions
 */

export function getContextToolDefinitions() {
  return [
    {
      name: 'diff_changes',
      priority: 10,
      description: 'Generate detailed diff between current and proposed file content. Shows line-by-line additions, deletions, and modifications. Helps understand exactly what will change. Example: Generate diff to see what changes will be made to a file.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to compare' },
          proposed_content: { type: 'string', description: 'Proposed new content' },
        },
        required: ['path', 'proposed_content'],
      },
    },
    {
      name: 'get_file_context',
      priority: 80,
      description:
        'MUST use this tool BEFORE refactoring - this is the ONLY way to get comprehensive file context. Never attempt to refactor without understanding file context. Get comprehensive context about a file including imports, exports, functions, classes, and metrics. Provides dependencies and usage information to prevent breaking changes. CRITICAL for understanding ripple effects of changes. Use this when: planning refactoring, renaming functions, understanding dependencies, analyzing impact. Do NOT use this for: simple reads, checking file existence. Best next tool after this: analyze_change_impact for ripple analysis, or obey_surgical_plan if modifying. Example: Get context for a file before refactoring to understand what depends on it.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to analyze - REQUIRED' },
        },
        required: ['path'],
      },
    },
    {
      name: 'analyze_change_impact',
      priority: 80,
      description:
        'Analyze the impact of proposed changes on the codebase. Lists affected files, functions, and classes. Identifies potential breaking changes and dependencies. CRITICAL for understanding ripple effects. Use this when: refactoring functions/classes, modifying shared utilities, changing API interfaces, or when uncertain about impact. Do NOT use this for: trivial changes, simple typo fixes. Best next tool after this: get_symbol_references for detailed dependency analysis. Example: Analyze impact before refactoring a function to see what depends on it.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to analyze' },
          changes: { type: 'string', description: 'Description of changes' },
        },
        required: ['path', 'changes'],
      },
    },
    {
      name: 'get_symbol_references',
      priority: 10,
      description: 'Find all references to a symbol (function, class, variable) in a file. Helps understand ripple effects of changes and ensures complete refactoring. Example: Find all references to a function before renaming it.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to search' },
          symbol: { type: 'string', description: 'Symbol name to find references for' },
        },
        required: ['path', 'symbol'],
      },
    },
    {
      name: 'get_historical_context',
      priority: 10,
      description: 'Get historical context about a file. Shows previous changes, last modified time, and change markers. Helps understand file evolution. Example: Get historical context before refactoring.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to analyze' },
        },
        required: ['path'],
      },
    },
  ];
}
