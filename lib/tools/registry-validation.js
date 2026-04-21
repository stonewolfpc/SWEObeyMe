/**
 * Validation tool definitions
 * NOTE: Most validation tools removed - now handled by auto-enforcement system
 * Only keep require_documentation as it's not fully covered by auto-enforcement
 */

export function getValidationToolDefinitions() {
  return [
    {
      name: 'validate_code',
      priority: 95,
      description: 'COMPREHENSIVE CODE VALIDATION - This is your swiss-army-knife for all validation needs. Automatically performs syntax checks, anti-pattern detection, naming convention validation, import verification, and documentation checks. Use this BEFORE writing code to ensure quality. Returns detailed validation report with issues, fixes, and severity levels. CRITICAL for preventing broken code. Use this when: writing new code, refactoring, or when uncertain about code quality. Example: validate_code before writing to catch all issues at once.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to validate' },
          content: { type: 'string', description: 'Code content to validate (if not reading from file)' },
          checks: {
            type: 'array',
            items: { type: 'string' },
            description: 'Specific checks to run (syntax, anti_patterns, naming, imports, documentation). If omitted, runs all checks.',
          },
          language: {
            default: 'javascript',
            description: 'Language (javascript, typescript, python, etc.)',
            type: 'string',
          },
        },
        required: [],
      },
    },
  ];
}
