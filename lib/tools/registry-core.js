/**
 * Core tool definitions - critical, high, and medium priority tools
 */

export function getCoreToolDefinitions() {
  const criticalTools = [
    {
      name: 'read_file',
      priority: 100,
      description:
        'READ_FILE IS THE ONLY WAY TO READ FILES - DO NOT USE DIRECT FILE ACCESS. This tool enforces .sweignore rules and injects architectural context including line count, last modified time, and project contract. Use this when: you need to see file contents, understand file context, check file size. Do NOT use this for: writing files, checking if file exists (use file system tools), listing directories. Best next tool after this: get_file_context for deeper analysis, or obey_surgical_plan if you plan to modify. Example: Read index.js to see it has 156 lines and any surgical warnings.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to read' },
        },
        required: ['path'],
      },
    },
    {
      name: 'write_file',
      priority: 100,
      description:
        'WRITE_FILE IS THE ONLY WAY TO WRITE FILES - DO NOT USE DIRECT FILE EDITING. This tool enforces surgical rules including: 1) Line count limit (max 700), 2) Forbidden pattern detection (console.log, debugger, eval, TODO comments), 3) Automatic backup of existing files, 4) Loop detection (prevents repetitive writes), 5) Auto-correction of minor violations. PREREQUISITE: MUST call obey_surgical_plan BEFORE this to ensure compliance. If your write is rejected with line count error, use refactor_move_block or extract_to_new_file to reduce file size first. Use this when: writing new code, modifying existing files, creating files. Do NOT use this for: reading files, checking file existence. Best next tool after this: run_related_tests to verify changes. Example: Write to index.js after obey_surgical_plan approval.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to write' },
          content: {
            type: 'string',
            description: 'Content to write - will be validated for surgical compliance',
          },
        },
        required: ['path', 'content'],
      },
    },
    {
      name: 'obey_surgical_plan',
      priority: 95,
      description:
        'CRITICAL: MUST call this BEFORE using write_file to validate your surgical plan complies with architectural rules. This prevents file bloat by checking if your changes will exceed the 700-line limit. If rejected, you MUST use refactor_move_block or extract_to_new_file to reduce file size before proceeding. Use this when: modifying any file, adding code, refactoring. Do NOT use this for: reading files, checking status, non-file operations. Best next tool after this: write_file if approved, or refactor_move_block/extract_to_new_file if rejected. Example: Call with current_line_count=650 and estimated_addition=100 to check if adding 100 lines to a 650-line file is safe.',
      inputSchema: {
        type: 'object',
        properties: {
          target_file: {
            type: 'string',
            description: 'File to be modified - REQUIRED for validation',
          },
          current_line_count: {
            type: 'number',
            description: 'Current line count - REQUIRED for validation',
          },
          estimated_addition: {
            type: 'number',
            description: 'Estimated lines to add - defaults to 0 if not specified',
          },
        },
        required: ['target_file', 'current_line_count'],
      },
    },
    {
      name: 'preflight_change',
      priority: 95,
      description:
        'CRITICAL: MUST call this BEFORE write_file for any non-trivial change. This orchestrates the complete validation sequence: 1) get_file_context, 2) analyze_change_impact, 3) verify_imports, 4) check_test_coverage, 5) dry_run_write_file. Returns comprehensive validation report. Use this when: making significant changes, modifying core files, or when uncertain about impact. Do NOT use this for trivial typo fixes. Best next tool after this: write_file if validation passes, or address issues if validation fails.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to validate - REQUIRED' },
          content: { type: 'string', description: 'Proposed content to validate - REQUIRED' },
          changes: { type: 'string', description: 'Description of changes for impact analysis' },
        },
        required: ['path', 'content'],
      },
    },
  ];

  const highPriorityTools = [
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
  ];

  const mediumPriorityTools = [
    {
      name: 'obey_me_status',
      priority: 50,
      description:
        'Checks if the SWEObMe surgical governance system is operational. Use this first to verify the system is active before proceeding with any file operations.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'get_tool_metrics',
      priority: 50,
      description:
        'Get comprehensive tool success metrics including call counts, success rates, error types, and performance data. Use this to monitor AI tool usage patterns and identify problematic tools or error trends.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
  ];

  return [...criticalTools, ...highPriorityTools, ...mediumPriorityTools].sort((a, b) => (b.priority || 0) - (a.priority || 0));
}
