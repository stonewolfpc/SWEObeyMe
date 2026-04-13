/**
 * Safety and feedback tool definitions
 */

export function getSafetyToolDefinitions() {
  return [
    {
      name: 'check_test_coverage',
      priority: 10,
      description: 'Calculate test coverage for changed code. Returns coverage percentage and identifies untested code. Requires minimum coverage threshold when enabled. Example: Check test coverage for a file.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to check' },
        },
        required: ['path'],
      },
    },
    {
      name: 'confirm_dangerous_operation',
      priority: 60,
      description: 'MUST use this tool before any destructive operation (delete, overwrite without backup, bulk rename). This is the ONLY way to gate dangerous operations behind user approval. Never skip this for irreversible actions.',
      inputSchema: {
        type: 'object',
        properties: {
          operation: { type: 'string', description: 'Operation description' },
        },
        required: ['operation'],
      },
    },
    {
      name: 'check_for_repetitive_patterns',
      priority: 10,
      description: 'Detect repetitive operations that indicate a loop. Warns about stuck patterns and suggests breaking out. CRITICAL for preventing infinite loops. Example: Check for repetitive file operations.',
      inputSchema: {
        type: 'object',
        properties: {
          operations: {
            items: { type: 'string' },
            type: 'array',
          },
        },
        required: ['operations'],
      },
    },
    {
      name: 'run_related_tests',
      priority: 55,
      description: 'MUST use this tool after every write_file operation to verify changes did not break existing tests. This is the ONLY way to detect regressions automatically. Call this immediately after write_file completes.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to run tests for' },
        },
        required: ['path'],
      },
    },
  ];
}

export function getFeedbackToolDefinitions() {
  return [
    {
      name: 'generate_change_summary',
      priority: 50,
      description: 'MUST use this tool after completing a set of related changes to document what was modified. Generates a commit-ready summary of files changed, functions added/removed, and architectural impact. Call this before ending a work session.',
      inputSchema: {
        type: 'object',
        properties: {
          changes: { type: 'string', description: 'Description of changes' },
          path: { type: 'string', description: 'File path' },
        },
        required: ['path', 'changes'],
      },
    },
    {
      name: 'explain_rejection',
      priority: 10,
      description: 'Explain why an operation was rejected. Provides specific reasons, explanations, suggestions, and recommended tools. Helps model learn from mistakes. Example: Get explanation for a rejected write operation.',
      inputSchema: {
        type: 'object',
        properties: {
          context: { type: 'string', description: 'Additional context' },
          reason: { type: 'string', description: 'Rejection reason' },
        },
        required: ['reason'],
      },
    },
    {
      name: 'suggest_alternatives',
      priority: 10,
      description: 'Suggest alternative approaches when operations fail. Provides specific tools and methods to try next. Helps model find better solutions. Example: Get alternatives when write_file is rejected.',
      inputSchema: {
        type: 'object',
        properties: {
          context: { type: 'string', description: 'Additional context' },
          failed_operation: { type: 'string', description: 'Name of failed operation' },
        },
        required: ['failed_operation'],
      },
    },
    {
      name: 'get_operation_guidance',
      priority: 10,
      description: 'Get guidance on how to use a specific operation. Provides prerequisites, warnings, and best practices. Helps model use tools correctly. Example: Get guidance for write_file operation.',
      inputSchema: {
        type: 'object',
        properties: {
          context: { type: 'string', description: 'Additional context' },
          operation: { type: 'string', description: 'Operation name' },
        },
        required: ['operation'],
      },
    },
  ];
}
