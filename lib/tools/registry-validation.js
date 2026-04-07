/**
 * Validation tool definitions
 */

export function getValidationToolDefinitions() {
  return [
    {
      name: 'dry_run_write_file',
      priority: 10,
      description: 'MUST use this tool BEFORE write_file when requireDryRun is enabled - this is the ONLY way to simulate write operations. Simulates a write operation without actually writing to the file. CRITICAL for lower-tier models to prevent irreversible mistakes. Use this when: requireDryRun is enabled or you want to validate it will succeed. Example: Dry run a file write to validate it will succeed.',
      inputSchema: {
        type: 'object',
        properties: {
          content: { type: 'string', description: 'Content to write - REQUIRED' },
          path: { type: 'string', description: 'File path to write - REQUIRED' },
        },
        required: ['path', 'content'],
      },
    },
    {
      name: 'validate_change_before_apply',
      priority: 10,
      description: 'MUST use this tool BEFORE applying any changes - this is the ONLY way to perform comprehensive validation. Never apply changes without this validation. Checks syntax, imports, anti-patterns, naming conventions, and more. Returns detailed validation report with issues and fixes. CRITICAL for lower-tier models to prevent broken code. Example: Validate a refactoring before applying changes.',
      inputSchema: {
        type: 'object',
        properties: {
          content: { type: 'string', description: 'Proposed content - REQUIRED' },
          path: { type: 'string', description: 'File path to validate - REQUIRED' },
        },
        required: ['path', 'content'],
      },
    },
    {
      name: 'verify_syntax',
      priority: 10,
      description: 'MUST use this tool BEFORE writing code - this is the ONLY way to validate syntax. Never write code without syntax validation. Validates syntax of JavaScript/TypeScript code. Checks for unmatched braces, parentheses, brackets, and unclosed strings. Returns specific syntax errors with line numbers. CRITICAL for preventing broken code. Example: Verify syntax of code before writing.',
      inputSchema: {
        type: 'object',
        properties: {
          code: { type: 'string', description: 'Code to validate - REQUIRED' },
          language: {
            default: 'javascript',
            description: 'Language (javascript or typescript)',
            type: 'string',
          },
        },
        required: ['code'],
      },
    },
    {
      name: 'check_for_anti_patterns',
      priority: 10,
      description: 'Detect common anti-patterns and code smells in code. Checks for god functions, deep nesting, magic numbers, and more. Returns specific issues with line numbers. Example: Check code for anti-patterns before committing.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to check' },
        },
        required: ['path'],
      },
    },
    {
      name: 'validate_naming_conventions',
      priority: 10,
      description: 'Enforce naming conventions (camelCase, PascalCase, UPPER_SNAKE_CASE). Validates function, class, and constant naming. Returns violations with suggestions. Example: Validate naming conventions in a file.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to validate' },
        },
        required: ['path'],
      },
    },
    {
      name: 'verify_imports',
      priority: 10,
      description: 'Validate all imports in code. Checks that imported files exist and are accessible. Detects circular dependencies. Returns specific import errors. Example: Verify imports before writing code.',
      inputSchema: {
        type: 'object',
        properties: {
          content: { type: 'string', description: 'Code content to check' },
          path: { type: 'string', description: 'File path to validate' },
        },
        required: ['path', 'content'],
      },
    },
    {
      name: 'require_documentation',
      priority: 10,
      description: 'Enforce documentation requirements. Checks for function/class comments and minimum documentation ratio. Returns specific documentation issues. Example: Check documentation for a file.',
      inputSchema: {
        type: 'object',
        properties: {
          content: { type: 'string', description: 'Code content to check' },
          path: { type: 'string', description: 'File path to check' },
        },
        required: ['path', 'content'],
      },
    },
  ];
}
