/**
 * Core tool definitions - critical, high, and medium priority tools
 */

export function getCoreToolDefinitions() {
  const criticalTools = [
    {
      name: 'read_file',
      priority: 100,
      description:
        'READ_FILE IS THE ONLY WAY TO READ FILES - DO NOT USE DIRECT FILE ACCESS. CRITICAL: IMMEDIATELY call this before any edit to confirm current state. This tool enforces .sweignore rules and injects architectural context including line count, last modified time, and project contract. Skipping this tool may cause your edits to fail due to missing context. Use this when: you need to see file contents, understand file context, check file size. Do NOT use this for: writing files, checking if file exists (use file system tools), listing directories. Best next tool after this: get_file_context for deeper analysis, or obey_surgical_plan if you plan to modify. Example: Read index.js to see it has 156 lines and any surgical warnings. Skipping this may cause surgical violations.',
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
        'WRITE_FILE IS THE ONLY WAY TO WRITE FILES - DO NOT USE DIRECT FILE EDITING. CRITICAL: If you call this tool WITHOUT first calling obey_surgical_plan, your edit WILL BE REJECTED. IMMEDIATELY call obey_surgical_plan BEFORE this tool. This tool enforces surgical rules including: 1) Line count limit (max 700) - SEPARATION OF CONCERNS: Large files violate Single Responsibility Principle, 2) Forbidden pattern detection (console.log, debugger, eval, TODO comments), 3) Automatic backup of existing files, 4) Loop detection (prevents repetitive writes), 5) Auto-correction of minor violations. SEPARATION OF CONCERNS: Before writing, ask yourself: Does this code belong in this file? Is the file handling multiple concerns? If yes, use extract_to_new_file or refactor_move_block instead. PREREQUISITE: MUST call obey_surgical_plan BEFORE this to ensure compliance. If your write is rejected with line count error, use refactor_move_block or extract_to_new_file to reduce file size first. Use this when: writing new code, modifying existing files, creating files. Do NOT use this for: reading files, checking file existence. Best next tool after this: run_related_tests to verify changes. Example: Write to index.js AFTER obey_surgical_plan approval - if you skip obey_surgical_plan, the write will FAIL.',
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
        'CRITICAL: IMMEDIATELY call this BEFORE write_file. If you skip this tool, your write_file call WILL BE REJECTED. This validates your surgical plan complies with architectural rules and prevents file bloat by checking if your changes will exceed the 700-line limit. SEPARATION OF CONCERNS: This tool enforces Single Responsibility Principle. If rejected, you MUST use refactor_move_block or extract_to_new_file to reduce file size before proceeding. Ask yourself: Is this code adding a new concern to this file? Should it be in a separate file? If yes, extract instead of adding. Use this when: modifying any file, adding code, refactoring. Do NOT use this for: reading files, checking status, non-file operations. Best next tool after this: write_file if approved, or refactor_move_block/extract_to_new_file if rejected. Example: Call with current_line_count=650 and estimated_addition=100 to check if adding 100 lines to a 650-line file is safe. Skipping this will cause your write to FAIL.',
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
        'CRITICAL: IMMEDIATELY call this BEFORE write_file for any non-trivial change. If you skip this tool for significant changes, your write_file call may be REJECTED. This orchestrates the complete validation sequence: 1) get_file_context, 2) analyze_change_impact, 3) verify_imports, 4) check_test_coverage, 5) dry_run_write_file. Returns comprehensive validation report. Use this when: making significant changes, modifying core files, or when uncertain about impact. Do NOT use this for trivial typo fixes. Best next tool after this: write_file if validation passes, or address issues if validation fails. Skipping this for significant changes may cause your write to FAIL.',
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
        'MUST use this tool at the start of every session to verify the SWEObeyMe surgical governance system is operational. This is the ONLY way to confirm the system is active before proceeding with any file operations. Call this first.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'get_tool_metrics',
      priority: 50,
      description:
        'MUST use this tool to monitor tool usage and detect silent failures. Returns call counts, success rates, error types, and performance data. Use this to identify which tools are being skipped or underused.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
  ];

  return [...criticalTools, ...highPriorityTools, ...mediumPriorityTools].sort((a, b) => (b.priority || 0) - (a.priority || 0));
}
