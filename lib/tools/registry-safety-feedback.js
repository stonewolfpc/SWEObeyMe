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
      priority: 10,
      description: 'Check if an operation is dangerous and requires confirmation. Returns warning and requires user approval for destructive operations. Example: Check before deleting a file.',
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
      priority: 10,
      description: 'Run tests for files affected by changes. Returns test results and coverage. Fails changes that break tests. Prevents regressions. Example: Run tests after modifying a file.',
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
      priority: 10,
      description: 'Generate a summary of changes made. Lists files modified, functions added/removed, and creates a commit message draft. Helps with accountability and tracking. Example: Generate summary after making changes.',
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
