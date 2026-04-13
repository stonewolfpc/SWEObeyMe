/**
 * Configuration and system tool definitions
 */

export function getConfigToolDefinitions() {
  return [
    {
      name: 'get_config',
      priority: 10,
      description: 'Get current SWEObeyMe configuration values. Use this to view all configurable settings and their current values.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'set_config',
      priority: 10,
      description: 'Set SWEObeyMe configuration values. Use this to change settings like line count limits and feature toggles.',
      inputSchema: {
        type: 'object',
        properties: {
          settings: {
            type: 'object',
            description: 'Configuration key-value pairs to set. Valid keys: maxLines, warningThreshold, maxBackupsPerFile, enableAutoCorrection, debugLogs, enableLoopDetection, maxLoopAttempts, minDocumentationRatio, enableWorkflowOrchestration, enableSessionMemory, enableOracle, forbiddenPatterns',
          },
        },
        required: ['settings'],
      },
    },
    {
      name: 'reset_config',
      priority: 10,
      description: 'Reset all SWEObeyMe configuration to default values. Use this when you want to revert all custom settings.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'get_config_schema',
      priority: 10,
      description: 'Get the configuration schema with validation rules and descriptions. Use this to understand what configuration options are available and their valid values.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'enforce_strict_mode',
      priority: 10,
      description: 'Enforce strict validation mode with extra conservative checks. Rejects more changes and requires higher quality standards.',
      inputSchema: {
        type: 'object',
        properties: {
          enable: { type: 'boolean', description: 'Enable or disable strict mode' },
        },
        required: ['enable'],
      },
    },
    {
      name: 'list_directory',
      priority: 10,
      description: 'List files and directories in a given path. Use this to explore project structure before making changes.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Directory path to list' },
        },
        required: ['path'],
      },
    },
    {
      name: 'get_session_context',
      priority: 40,
      description: 'MUST use this tool when you encounter repeated failures or unexpected behavior. This is the ONLY way to see the full history of actions taken in this session. Call this after 2+ consecutive errors to break the failure loop.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'record_decision',
      priority: 35,
      description: 'MUST use this tool to record significant decisions made during a session. Provides an audit trail and prevents re-debating the same choices. Call this whenever you make an architectural or design decision that could be questioned later.',
      inputSchema: {
        type: 'object',
        properties: {
          decision: { type: 'string', description: 'Decision to record' },
        },
        required: ['decision'],
      },
    },
    {
      name: 'enforce_surgical_rules',
      priority: 10,
      description: 'MUST call this tool BEFORE write_file - this is the ONLY way to validate your code against surgical rules. Checks for line count limits, forbidden patterns (console.log, debugger, eval, TODO), and ensures compliance with architectural standards.',
      inputSchema: {
        type: 'object',
        properties: {
          proposed_code: { type: 'string', description: 'Code to validate - REQUIRED' },
          file_path: { type: 'string', description: 'File path for context' },
        },
        required: ['proposed_code'],
      },
    },
    {
      name: 'sanitize_request',
      priority: 10,
      description: 'Sanitize a request through SWEObeyMe filters. Use this for complex operations to verify your approach is sound.',
      inputSchema: {
        type: 'object',
        properties: {
          logic_intent: { type: 'string', description: 'Logic intent to sanitize' },
        },
        required: ['logic_intent'],
      },
    },
    {
      name: 'auto_repair_submission',
      priority: 10,
      description: 'Attempt to repair malformed submissions automatically. Use this when write_file rejects your content with JSON or syntax errors.',
      inputSchema: {
        type: 'object',
        properties: {
          raw_content: { type: 'string', description: 'Raw content to repair' },
          type: { type: 'string', enum: ['json', 'code'], description: 'Type of content to repair' },
        },
        required: ['type', 'raw_content'],
      },
    },
    {
      name: 'analyze_file_health',
      priority: 10,
      description: 'Analyze file health for code smells and complexity. Use this before refactoring to identify issues like deep nesting, silent catch blocks, and complexity.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to analyze' },
        },
        required: ['path'],
      },
    },
    {
      name: 'detect_architectural_drift',
      priority: 10,
      description: 'Detect architectural drift from documentation standards. Use this to check if files have adequate documentation (min 10% comment ratio).',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to check' },
        },
        required: ['path'],
      },
    },
    {
      name: 'create_backup',
      priority: 55,
      description: 'MUST use this tool before any risky or experimental operation on an important file. This is the ONLY way to create a verified, restorable snapshot outside of write_file\'s automatic backup. Call this before: refactoring, bulk edits, or any change you may need to undo.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to backup' },
        },
        required: ['path'],
      },
    },
    {
      name: 'restore_backup',
      priority: 55,
      description: 'MUST use this tool to revert a file to its last "Pass" state - this is the ONLY way to rollback when AI fixes lower Surgical Integrity Score. Reverts file to last state with Integrity Score > 90. CRITICAL for recovering from bad AI edits. Example: Undo last edit to Program.cs if it lowered the integrity score.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to restore' },
          backup_index: { type: 'number', description: 'Backup index (0 = newest, 1 = second newest, etc.)' },
        },
        required: ['path', 'backup_index'],
      },
    },
    {
      name: 'initiate_surgical_workflow',
      priority: 45,
      description: 'MUST use this tool for any task requiring 3 or more coordinated steps. This is the ONLY way to track multi-step operations and prevent abandoned half-complete refactors. Call this before any major refactoring, module split, or architectural change.',
      inputSchema: {
        type: 'object',
        properties: {
          goal: { type: 'string', description: 'Workflow goal - what you want to accomplish' },
          steps: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Step name for tracking' },
                tool: { type: 'string', description: 'Tool to execute for this step' },
              },
            },
          },
        },
        required: ['goal', 'steps'],
      },
    },
    {
      name: 'get_workflow_status',
      priority: 45,
      description: 'MUST use this tool after each step of an active surgical workflow. This is the ONLY way to track progress and detect stalled or incomplete operations. Call this between every step of a multi-step workflow.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'refactor_move_block',
      priority: 50,
      description: 'Move a code block from one file to another while maintaining surgical compliance. SEPARATION OF CONCERNS: This is the PRIMARY tool for fixing mixed concerns. Use this when: (1) obey_surgical_plan rejects your plan due to file size, (2) File handles multiple distinct concerns, (3) Code belongs in a different module by domain (e.g., validation should be in validators/, not in components/). WHY move instead of add: Moving maintains separation of concerns by placing code where it belongs. HOW: Identify cohesive block, choose appropriate target file based on concern/domain, move the block. Pattern: Move validation to validators/, data access to repositories/, UI logic to components/, utilities to utils/. Example: Move validateUser() from components/UserForm.js to validators/user-validator.js.',
      inputSchema: {
        type: 'object',
        properties: {
          code_block: { type: 'string', description: 'Exact code block to move (must match source file content exactly)' },
          source_path: { type: 'string', description: 'Source file path to extract from' },
          target_path: { type: 'string', description: 'Target file path to move to' },
        },
        required: ['source_path', 'target_path', 'code_block'],
      },
    },
    {
      name: 'extract_to_new_file',
      priority: 50,
      description: 'Extract a code block to a new file while maintaining surgical compliance. SEPARATION OF CONCERNS: This is the PRIMARY tool for creating focused modules. Use this when: (1) Code represents a distinct concern/domain, (2) Code is reusable across multiple files, (3) Code is complex enough to warrant its own module, (4) File is growing beyond 700 lines and needs splitting. WHY extract: Creating focused modules enforces Single Responsibility Principle, makes code testable in isolation, and prevents mixed concerns. HOW: Identify cohesive block with clear single responsibility, create new file with appropriate name and location (use suggest_file_location), extract the block. Pattern: Extract validation to validators/[name]-validator.js, API calls to api/[name]-api.js, utilities to utils/[name]-utils.js. Example: Extract user validation from UserForm.js to validators/user-validator.js.',
      inputSchema: {
        type: 'object',
        properties: {
          code_block: { type: 'string', description: 'Exact code block to extract (must match source file content exactly)' },
          description: { type: 'string', description: 'Description of the extraction for documentation' },
          new_file_path: { type: 'string', description: 'New file path to create' },
          source_path: { type: 'string', description: 'Source file path to extract from' },
        },
        required: ['source_path', 'new_file_path', 'code_block'],
      },
    },
    {
      name: 'get_architectural_directive',
      priority: 45,
      description: 'MUST use this tool when uncertain about coding standards or after multiple failures. This is the ONLY way to get the current architectural directive. Call this before making any structural decision you are unsure about.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'request_surgical_recovery',
      priority: 50,
      description: 'MUST use this tool after 3 or more consecutive errors. This is the ONLY way to reset corrupted session state and start fresh. CRITICAL: Never continue attempting the same failing operation without calling this first.',
      inputSchema: {
        type: 'object',
        properties: {
          reason: { type: 'string', description: 'Reason for recovery (e.g., \'3 consecutive write failures\')' },
        },
        required: ['reason'],
      },
    },
    {
      name: 'query_the_oracle',
      priority: 10,
      description: 'Query the Oracle for surgical wisdom and motivation. Use this when you need guidance or encouragement during complex tasks.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
  ];
}
