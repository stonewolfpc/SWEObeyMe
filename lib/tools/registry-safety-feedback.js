/**
 * Safety and feedback tool definitions
 */

export function getSafetyToolDefinitions() {
  return [
    {
      name: 'safety_check',
      priority: 80,
      description:
        'Swiss-army-knife for safety and testing. Check test coverage, confirm dangerous operations, detect repetitive patterns, or run related tests. Use this when: checking test coverage, gating destructive operations, detecting loops, or running tests after changes. Helps prevent regressions and dangerous actions.',
      inputSchema: {
        type: 'object',
        properties: {
          operation: {
            type: 'string',
            enum: ['test_coverage', 'confirm', 'repetitive', 'run_tests'],
            description: 'Operation to perform',
          },
          path: {
            type: 'string',
            description: 'File path (for "test_coverage" or "run_tests" operations)',
          },
          operation_desc: {
            type: 'string',
            description: 'Operation description (for "confirm" operation)',
          },
          operations: {
            items: { type: 'string' },
            type: 'array',
            description: 'Operations to check (for "repetitive" operation)',
          },
        },
        required: ['operation'],
      },
    },
  ];
}

export function getFeedbackToolDefinitions() {
  return [
    {
      name: 'guidance',
      priority: 75,
      description:
        'Swiss-army-knife for learning and documentation. Explain rejections, suggest alternatives, get operation guidance, or generate change summaries. Use this when: operations fail, you need guidance on tool usage, or documenting changes. Helps model learn from mistakes and provides actionable next steps.',
      inputSchema: {
        type: 'object',
        properties: {
          operation: {
            type: 'string',
            enum: ['explain', 'alternatives', 'operation_guide', 'summary'],
            description: 'Operation to perform',
          },
          reason: { type: 'string', description: 'Rejection reason (for "explain" operation)' },
          context: { type: 'string', description: 'Additional context' },
          failed_operation: {
            type: 'string',
            description: 'Failed operation name (for "alternatives" operation)',
          },
          operation_name: {
            type: 'string',
            description: 'Operation name (for "operation_guide" operation)',
          },
          changes: {
            type: 'string',
            description: 'Description of changes (for "summary" operation)',
          },
          path: { type: 'string', description: 'File path (for "summary" operation)' },
        },
        required: ['operation'],
      },
    },
  ];
}
