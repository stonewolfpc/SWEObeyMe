/**
 * Core tool definitions - critical, high, and medium priority tools
 */

export function getCoreToolDefinitions() {
  const criticalTools = [
    {
      name: 'read_file',
      priority: 100,
      description:
        'Read files with .sweignore enforcement and architectural context injection. This tool provides line count, last modified time, and project contract context. Use this before any edit to confirm current state. Skipping may cause edits to fail due to missing context. Use this when: you need to see file contents, understand file context, check file size. Do NOT use this for: writing files, checking if file exists (use file system tools), listing directories. Best next tool after this: get_file_context for deeper analysis, or obey_surgical_plan if you plan to modify. Example: Read index.js to see it has 156 lines and any surgical warnings.',
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
        'Write files with surgical rule enforcement. This tool enforces: 1) Line count limit (max 700), 2) Forbidden pattern detection (console.log, debugger, eval, TODO), 3) Automatic backup, 4) Loop detection, 5) Auto-correction. Call obey_surgical_plan BEFORE this tool to ensure compliance. If rejected with line count error, use refactor_move_block or extract_to_new_file to reduce file size. Use this when: writing new code, modifying existing files, creating files. Do NOT use this for: reading files, checking file existence. Best next tool after this: run_related_tests to verify changes.',
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
        'Validate surgical plan complies with architectural rules and prevents file bloat by checking if changes will exceed the 700-line limit. Call this BEFORE write_file to ensure compliance. If rejected, use refactor_move_block or extract_to_new_file to reduce file size. This enforces Single Responsibility Principle. Ask yourself: Is this code adding a new concern to this file? Should it be in a separate file? Use this when: modifying any file, adding code, refactoring. Do NOT use this for: reading files, checking status, non-file operations. Best next tool after this: write_file if approved, or refactor_move_block/extract_to_new_file if rejected.',
      inputSchema: {
        type: 'object',
        properties: {
          target_file: {
            type: 'string',
            description: 'File to be modified - REQUIRED for validation',
          },
          current_line_count: {
            type: 'number',
            description: 'Current line count of the file',
          },
          estimated_addition: {
            type: 'number',
            description: 'Estimated lines to add',
          },
        },
        required: ['target_file', 'current_line_count', 'estimated_addition'],
      },
    },
    {
      name: 'search_code',
      priority: 90,
      description: 'Search the codebase for patterns and symbols. Use this when: finding function definitions, locating usages, searching for specific code patterns. Do NOT use this for: reading file contents, listing directories.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
          maxResults: { type: 'number', description: 'Maximum results to return' },
        },
        required: ['query'],
      },
    },
    {
      name: 'workflow_manage',
      priority: 85,
      description: 'Workflow orchestration and management. Use this when: managing multi-step operations, creating workflows, listing available workflows.',
      inputSchema: {
        type: 'object',
        properties: {
          operation: { type: 'string', description: 'Operation type: list, create, execute' },
          goal: { type: 'string', description: 'Workflow goal' },
          steps: { type: 'array', description: 'Workflow steps' },
        },
        required: ['operation'],
      },
    },
    {
      name: 'preflight_change',
      priority: 95,
      description:
        'Orchestrate complete validation sequence for non-trivial changes: 1) get_file_context, 2) analyze_change_impact, 3) verify_imports, 4) check_test_coverage, 5) dry_run_write_file. Returns comprehensive validation report. Call this BEFORE write_file for significant changes or when uncertain about impact. Do NOT use this for trivial typo fixes. Best next tool after this: write_file if validation passes, or address issues if validation fails.',
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

  // Note: get_file_context and analyze_change_impact are defined in registry-context.js
  // to avoid duplicates. Do NOT add them here.
  const highPriorityTools = [];

  const mediumPriorityTools = [
    {
      name: 'obey_me_status',
      priority: 50,
      description:
        'Verify the SWEObeyMe surgical governance system is operational. Use this at the start of a session to confirm the system is active before proceeding with file operations.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'get_tool_metrics',
      priority: 50,
      description:
        'Monitor tool usage and detect silent failures. Returns call counts, success rates, error types, and performance data. Use this to identify which tools are being skipped or underused.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
  ];

  // Hidden AI-query-only tools - for internal use by AI agents
  const hiddenTools = [
    {
      name: 'query_project_memory',
      priority: 1,
      description:
        'HIDDEN AI-QUERY-ONLY - Query project memory for context. Available query types: snapshot, file_history, decisions, patterns, errors, architecture, backup_history. Not for direct use.',
      inputSchema: {
        type: 'object',
        properties: {
          projectName: {
            type: 'string',
            description: 'Project name (optional, uses current project if not provided)',
          },
          queryType: {
            type: 'string',
            description:
              'Query type: snapshot, file_history, decisions, patterns, errors, architecture, backup_history',
          },
          filePath: {
            type: 'string',
            description: 'File path (required for file_history and backup_history queries)',
          },
        },
      },
    },
    {
      name: 'query_project_archives',
      priority: 1,
      description:
        'HIDDEN AI-QUERY-ONLY - Query project archives for historical reference. Can list all archives, load specific archive, or search archives. Not for direct use.',
      inputSchema: {
        type: 'object',
        properties: {
          projectName: {
            type: 'string',
            description: 'Project name (optional, lists all if not provided)',
          },
          query: {
            type: 'string',
            description: 'Search query (optional, searches archives if provided)',
          },
        },
      },
    },
    {
      name: 'list_projects',
      priority: 1,
      description:
        'HIDDEN AI-QUERY-ONLY - List all projects in the project registry. Not for direct use.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'query_implementation_knowledge',
      priority: 1,
      description:
        'HIDDEN AI-QUERY-ONLY - Query implementation knowledge for experimental attempts, assumptions, working patterns, context annotations, and dependency impacts. Available query types: attempts, assumptions, patterns, annotations, impacts, all. Not for direct use.',
      inputSchema: {
        type: 'object',
        properties: {
          projectName: {
            type: 'string',
            description: 'Project name (optional, uses current project if not provided)',
          },
          queryType: {
            type: 'string',
            description: 'Query type: attempts, assumptions, patterns, annotations, impacts, all',
          },
          filters: {
            type: 'object',
            description:
              'Filters for query (optional): { outcome, status, annotationType, isNonStandard }',
          },
          relatedTo: {
            type: 'string',
            description: 'Filter to entries related to this file or module (optional)',
          },
        },
      },
    },
  ];

  return [...criticalTools, ...highPriorityTools, ...mediumPriorityTools, ...hiddenTools].sort(
    (a, b) => (b.priority || 0) - (a.priority || 0)
  );
}
