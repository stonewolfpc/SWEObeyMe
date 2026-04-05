export function getToolDefinitions() {
  return [
    {
      name: 'obey_me_status',
      description:
        'Checks if the SWEObMe surgical governance system is operational. Use this first to verify the system is active before proceeding with any file operations.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'obey_surgical_plan',
      description:
        'CRITICAL: MUST call this BEFORE using write_file to validate your surgical plan complies with architectural rules. This prevents file bloat by checking if your changes will exceed the 700-line limit. If rejected, you MUST use refactor_move_block or extract_to_new_file to reduce file size before proceeding. Example: Call with current_line_count=650 and estimated_addition=100 to check if adding 100 lines to a 650-line file is safe.',
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
      name: 'read_file',
      description:
        'Read a file with surgical context injection. This is the ONLY way to read files - it enforces .sweignore rules and injects architectural context including line count, last modified time, and project contract. Use this instead of direct file reading to ensure you see architectural constraints. Example: Read index.js to see it has 156 lines and any surgical warnings.',
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
      description:
        'CRITICAL: This is the ONLY way to write files. It enforces surgical rules including: 1) Line count limit (max 700), 2) Forbidden pattern detection (console.log, debugger, eval, TODO comments), 3) Automatic backup of existing files, 4) Loop detection (prevents repetitive writes), 5) Auto-correction of minor violations. PREREQUISITE: MUST call obey_surgical_plan BEFORE this to ensure compliance. If your write is rejected with line count error, use refactor_move_block or extract_to_new_file to reduce file size first.',
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
      name: 'list_directory',
      description:
        'MUST use this tool to list files in a directory - this is the ONLY way to explore project structure. Never attempt to list directories using any other method. Use this before making changes to understand the project layout. Example: List the lib directory to see available modules before refactoring.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Directory path - REQUIRED' },
        },
        required: ['path'],
      },
    },
    {
      name: 'get_session_context',
      description:
        "Get current session memory and history. Use this when you encounter repeated failures or need to understand what actions have been taken. This helps you avoid loops and understand your progress. Example: Check session context after 3 consecutive failures to see if you're stuck in a loop.",
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'record_decision',
      description:
        'Record a decision to session memory for accountability. Use this to document architectural decisions and rationale. Example: Record your decision to extract a large function to a new module for maintainability.',
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
      description:
        'MUST call this tool BEFORE write_file - this is the ONLY way to validate code against surgical rules. Never attempt to write code without this validation. This pre-flight check ensures your code complies with architectural standards designed to prevent technical debt. It checks for: line count limits, forbidden patterns (console.log, debugger, eval, TODO), and mandatory comments. Example: Validate your refactored code before calling write_file to ensure it passes all surgical rules.',
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
      description:
        'Sanitize a request through SWEObMe filters. This ensures your intent aligns with surgical principles before execution. Use this for complex operations to verify your approach is sound. Example: Sanitize your intent to refactor a large file to ensure it follows surgical principles.',
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
      description:
        'Attempt to repair malformed submissions automatically. Use this when write_file rejects your content with JSON or syntax errors. It fixes trailing commas, markdown wrapping, and removes forbidden patterns. Example: Repair a JSON response that has trailing commas before calling write_file again.',
      inputSchema: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['json', 'code'],
            description: 'Type of content to repair',
          },
          raw_content: { type: 'string', description: 'Raw content to repair' },
        },
        required: ['type', 'raw_content'],
      },
    },
    {
      name: 'analyze_file_health',
      description:
        'Analyze file health for code smells and complexity. Use this before refactoring to identify issues like deep nesting, silent catch blocks, and complexity. Example: Analyze index.js before refactoring to understand what needs to be improved.',
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
      description:
        'Detect architectural drift from documentation standards. Use this to check if files have adequate documentation (min 10% comment ratio). Example: Check if a recently modified file still follows documentation standards.',
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
      description:
        'Create a manual backup of a file. Use this before risky operations. Note: write_file automatically creates backups for existing files, so this is only needed for manual backup operations. Example: Backup a critical file before attempting a complex refactoring.',
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
      description:
        'Restore a file from backup. Use this when a change breaks the code and you need to revert. Example: Restore index.js to its previous state after a failed refactoring attempt. Use backup_index=0 for the most recent backup.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to restore' },
          backup_index: {
            type: 'number',
            description: 'Backup index (0 = newest, 1 = second newest, etc.)',
          },
        },
        required: ['path', 'backup_index'],
      },
    },
    {
      name: 'initiate_surgical_workflow',
      description:
        'Initiate a multi-step surgical workflow for complex operations. Use this for tasks requiring multiple coordinated steps (e.g., refactoring a large file into multiple modules). This ensures proper sequencing and maintains surgical compliance throughout. Example: Initiate a workflow to split a 600-line file into three smaller modules.',
      inputSchema: {
        type: 'object',
        properties: {
          goal: { type: 'string', description: 'Workflow goal - what you want to accomplish' },
          steps: {
            type: 'array',
            description: 'Workflow steps in execution order',
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
      description:
        "Get status of the active surgical workflow. Use this to track progress and understand which steps are completed. Example: Check workflow status to see if you've completed the extraction step before proceeding to the next step.",
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'refactor_move_block',
      description:
        "Move a code block from one file to another while maintaining surgical compliance. This is the PREFERRED method for reducing file size when obey_surgical_plan rejects your plan. It validates that the target file won't exceed 700 lines. Example: Move a 200-line function from index.js to utils.js to keep index.js under the limit.",
      inputSchema: {
        type: 'object',
        properties: {
          source_path: { type: 'string', description: 'Source file path to extract from' },
          target_path: { type: 'string', description: 'Target file path to move to' },
          code_block: {
            type: 'string',
            description: 'Exact code block to move (must match source file content exactly)',
          },
        },
        required: ['source_path', 'target_path', 'code_block'],
      },
    },
    {
      name: 'extract_to_new_file',
      description:
        "Extract a code block to a new file while maintaining surgical compliance. Use this when you need to create a new module from existing code. It validates the new file won't exceed 700 lines and creates a backup of the source. Example: Extract a large class to a new file to reduce source file size.",
      inputSchema: {
        type: 'object',
        properties: {
          source_path: { type: 'string', description: 'Source file path to extract from' },
          new_file_path: { type: 'string', description: 'New file path to create' },
          code_block: {
            type: 'string',
            description: 'Exact code block to extract (must match source file content exactly)',
          },
          description: {
            type: 'string',
            description: 'Description of the extraction for documentation',
          },
        },
        required: ['source_path', 'new_file_path', 'code_block'],
      },
    },
    {
      name: 'get_architectural_directive',
      description:
        "Get the current architectural directive from SWEObeyMe. Call this when you're unsure about the project's coding standards or when you've encountered multiple failures. This provides the current mandate, integrity score, and compliance status. Example: Call after 3 consecutive failures to understand why your approach is being rejected.",
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'request_surgical_recovery',
      description:
        "Reset session state when you encounter repeated failures. Call this after 3 consecutive errors to clear history and start fresh. This is a recovery mechanism when you're stuck in a loop or the session state is corrupted. Example: Call after 3 failed write attempts to reset and try a different approach.",
      inputSchema: {
        type: 'object',
        properties: {
          reason: {
            type: 'string',
            description: "Reason for recovery (e.g., '3 consecutive write failures')",
          },
        },
        required: ['reason'],
      },
    },
    {
      name: 'query_the_oracle',
      description:
        'Query the Oracle for surgical wisdom and motivation. Use this when you need guidance or encouragement during complex tasks. This provides inspirational quotes to maintain surgical discipline. Example: Query the Oracle for motivation when tackling a difficult refactoring.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'get_config',
      description:
        'Get current SWEObeyMe configuration values. Use this to view all configurable settings and their current values. Example: Get current configuration to see line count limits and feature toggles.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'set_config',
      description:
        'Set SWEObeyMe configuration values. Use this to change settings like line count limits, warning thresholds, debug logging, auto-correction, and feature toggles. All changes are saved to ~/.sweobeyme-config.json. Example: Set maxLines to 800 to increase the file size limit.',
      inputSchema: {
        type: 'object',
        properties: {
          settings: {
            type: 'object',
            description:
              'Configuration key-value pairs to set. Valid keys: maxLines, warningThreshold, maxBackupsPerFile, enableAutoCorrection, debugLogs, enableLoopDetection, maxLoopAttempts, minDocumentationRatio, enableWorkflowOrchestration, enableSessionMemory, enableOracle, forbiddenPatterns',
          },
        },
        required: ['settings'],
      },
    },
    {
      name: 'reset_config',
      description:
        'Reset all SWEObeyMe configuration to default values. Use this when you want to revert all custom settings. Example: Reset configuration after making too many experimental changes.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'get_config_schema',
      description:
        'Get the configuration schema with validation rules and descriptions. Use this to understand what configuration options are available and their valid values. Example: Get schema to see what settings can be configured.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'dry_run_write_file',
      description:
        'MUST use this tool BEFORE write_file when requireDryRun is enabled - this is the ONLY way to simulate write operations. Never attempt to write files without this simulation when dry run is required. Simulates a write operation without actually writing to the file. CRITICAL for lower-tier models to prevent irreversible mistakes. Validates line count, forbidden patterns, and syntax before any changes. Returns detailed results showing what would happen. Example: Dry run a file write to validate it will succeed.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to write - REQUIRED' },
          content: { type: 'string', description: 'Content to write - REQUIRED' },
        },
        required: ['path', 'content'],
      },
    },
    {
      name: 'validate_change_before_apply',
      description:
        'MUST use this tool BEFORE applying any changes - this is the ONLY way to perform comprehensive validation. Never apply changes without this validation. Checks syntax, imports, anti-patterns, naming conventions, and more. Returns detailed validation report with issues and fixes. CRITICAL for lower-tier models to prevent broken code. Example: Validate a refactoring before applying changes.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to validate - REQUIRED' },
          content: { type: 'string', description: 'Proposed content - REQUIRED' },
        },
        required: ['path', 'content'],
      },
    },
    {
      name: 'diff_changes',
      description:
        'Generate detailed diff between current and proposed file content. Shows line-by-line additions, deletions, and modifications. Helps understand exactly what will change. Example: Generate diff to see what changes will be made to a file.',
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
      description:
        'MUST use this tool BEFORE refactoring - this is the ONLY way to get comprehensive file context. Never attempt to refactor without understanding file context. Get comprehensive context about a file including imports, exports, functions, classes, and metrics. Provides dependencies and usage information to prevent breaking changes. CRITICAL for understanding ripple effects of changes. Example: Get context for a file before refactoring.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to analyze - REQUIRED' },
        },
        required: ['path'],
      },
    },
    {
      name: 'verify_syntax',
      description:
        'MUST use this tool BEFORE writing code - this is the ONLY way to validate syntax. Never write code without syntax validation. Validates syntax of JavaScript/TypeScript code. Checks for unmatched braces, parentheses, brackets, and unclosed strings. Returns specific syntax errors with line numbers. CRITICAL for preventing broken code. Example: Verify syntax of code before writing.',
      inputSchema: {
        type: 'object',
        properties: {
          code: { type: 'string', description: 'Code to validate - REQUIRED' },
          language: {
            type: 'string',
            description: 'Language (javascript or typescript)',
            default: 'javascript',
          },
        },
        required: ['code'],
      },
    },
    {
      name: 'analyze_change_impact',
      description:
        'Analyze the impact of proposed changes on the codebase. Lists affected files, functions, and classes. Identifies potential breaking changes and dependencies. CRITICAL for understanding ripple effects. Example: Analyze impact before refactoring a function.',
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
      description:
        'Find all references to a symbol (function, class, variable) in a file. Helps understand ripple effects of changes and ensures complete refactoring. Example: Find all references to a function before renaming it.',
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
      name: 'enforce_strict_mode',
      description:
        'Enforce strict validation mode with extra conservative checks. Rejects more changes and requires higher quality standards. Use this for lower-tier models that need more guardrails. Example: Enable strict mode for safer operations.',
      inputSchema: {
        type: 'object',
        properties: {
          enable: { type: 'boolean', description: 'Enable or disable strict mode' },
        },
        required: ['enable'],
      },
    },
    {
      name: 'check_for_anti_patterns',
      description:
        'Detect common anti-patterns and code smells in code. Checks for god functions, deep nesting, magic numbers, and more. Returns specific issues with line numbers. Example: Check code for anti-patterns before committing.',
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
      description:
        'Enforce naming conventions (camelCase, PascalCase, UPPER_SNAKE_CASE). Validates function, class, and constant naming. Returns violations with suggestions. Example: Validate naming conventions in a file.',
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
      description:
        'Validate all imports in code. Checks that imported files exist and are accessible. Detects circular dependencies. Returns specific import errors. Example: Verify imports before writing code.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to validate' },
          content: { type: 'string', description: 'Code content to check' },
        },
        required: ['path', 'content'],
      },
    },
    {
      name: 'check_test_coverage',
      description:
        'Calculate test coverage for changed code. Returns coverage percentage and identifies untested code. Requires minimum coverage threshold when enabled. Example: Check test coverage for a file.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to check' },
        },
        required: ['path'],
      },
    },
    {
      name: 'require_documentation',
      description:
        'Enforce documentation requirements. Checks for function/class comments and minimum documentation ratio. Returns specific documentation issues. Example: Check documentation for a file.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to check' },
          content: { type: 'string', description: 'Code content to check' },
        },
        required: ['path', 'content'],
      },
    },
    {
      name: 'generate_change_summary',
      description:
        'Generate a summary of changes made. Lists files modified, functions added/removed, and creates a commit message draft. Helps with accountability and tracking. Example: Generate summary after making changes.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path' },
          changes: { type: 'string', description: 'Description of changes' },
        },
        required: ['path', 'changes'],
      },
    },
    {
      name: 'confirm_dangerous_operation',
      description:
        'Check if an operation is dangerous and requires confirmation. Returns warning and requires user approval for destructive operations. Example: Check before deleting a file.',
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
      description:
        'Detect repetitive operations that indicate a loop. Warns about stuck patterns and suggests breaking out. CRITICAL for preventing infinite loops. Example: Check for repetitive file operations.',
      inputSchema: {
        type: 'object',
        properties: {
          operations: { type: 'array', items: { type: 'string' }, description: 'Array of recent operations' },
        },
        required: ['operations'],
      },
    },
    {
      name: 'explain_rejection',
      description:
        'Explain why an operation was rejected. Provides specific reasons, explanations, suggestions, and recommended tools. Helps model learn from mistakes. Example: Get explanation for a rejected write operation.',
      inputSchema: {
        type: 'object',
        properties: {
          reason: { type: 'string', description: 'Rejection reason' },
          context: { type: 'string', description: 'Additional context' },
        },
        required: ['reason'],
      },
    },
    {
      name: 'suggest_alternatives',
      description:
        'Suggest alternative approaches when operations fail. Provides specific tools and methods to try next. Helps model find better solutions. Example: Get alternatives when write_file is rejected.',
      inputSchema: {
        type: 'object',
        properties: {
          failed_operation: { type: 'string', description: 'Name of failed operation' },
          context: { type: 'string', description: 'Additional context' },
        },
        required: ['failed_operation'],
      },
    },
    {
      name: 'get_historical_context',
      description:
        'Get historical context about a file. Shows previous changes, last modified time, and change markers. Helps understand file evolution. Example: Get historical context before refactoring.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to analyze' },
        },
        required: ['path'],
      },
    },
    {
      name: 'get_operation_guidance',
      description:
        'Get guidance on how to use a specific operation. Provides prerequisites, warnings, and best practices. Helps model use tools correctly. Example: Get guidance for write_file operation.',
      inputSchema: {
        type: 'object',
        properties: {
          operation: { type: 'string', description: 'Operation name' },
          context: { type: 'string', description: 'Additional context' },
        },
        required: ['operation'],
      },
    },
    {
      name: 'run_related_tests',
      description:
        'Run tests for files affected by changes. Returns test results and coverage. Fails changes that break tests. Prevents regressions. Example: Run tests after modifying a file.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to run tests for' },
        },
        required: ['path'],
      },
    },
    {
      name: 'get_csharp_errors',
      description:
        'MUST use this tool to get C# errors in the workspace - this is the ONLY way to access C# error detection. Returns errors from all .cs files with severity colors and line ranges. Only returns broken nodes (Edit, Don\'t Replace rule). Example: Get all C# errors to understand workspace health.',
      inputSchema: {
        type: 'object',
        properties: {
          severity_threshold: {
            type: 'number',
            description: 'Minimum severity level to return (0=Info, 1=Warning, 2=Error)',
            default: 0,
          },
        },
        required: [],
      },
    },
    {
      name: 'get_csharp_errors_for_file',
      description:
        'MUST use this tool to get C# errors for a specific file - this is the ONLY way to check individual files. Returns errors with severity colors and line ranges. Only returns broken nodes (Edit, Don\'t Replace rule). Example: Check errors in Program.cs before making changes.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to analyze - REQUIRED' },
          severity_threshold: {
            type: 'number',
            description: 'Minimum severity level to return (0=Info, 1=Warning, 2=Error)',
            default: 0,
          },
        },
        required: ['path'],
      },
    },
    {
      name: 'get_integrity_report',
      description:
        'MUST use this tool to get detailed integrity report for C# errors - this is the ONLY way to understand error context in relation to high-value rules. Returns integrity score, error breakdown by rule, and architectural recommendations. CRITICAL for understanding why errors happened. Example: Get integrity report for Program.cs to understand architectural impact.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to analyze - REQUIRED' },
        },
        required: ['path'],
      },
    },
    {
      name: 'toggle_csharp_error_type',
      description:
        'MUST use this tool to enable/disable specific C# error checks - this is the ONLY way to configure error detection. Allows fine-grained control over which errors are reported. Example: Disable "string_concatenation" check if it produces false positives.',
      inputSchema: {
        type: 'object',
        properties: {
          error_id: { type: 'string', description: 'Error rule ID to toggle - REQUIRED' },
          enabled: { type: 'boolean', description: 'Enable or disable this error check - REQUIRED' },
        },
        required: ['error_id', 'enabled'],
      },
    },
    {
      name: 'set_csharp_ai_informed',
      description:
        'MUST use this tool to toggle "Keep AI Informed" feature - this is the ONLY way to control automatic error injection. When enabled, C# errors are automatically injected into file reads based on Surgical Integrity Score throttling. Example: Enable to automatically inform AI about critical errors without being asked.',
      inputSchema: {
        type: 'object',
        properties: {
          enabled: { type: 'boolean', description: 'Enable or disable Keep AI Informed - REQUIRED' },
        },
        required: ['enabled'],
      },
    },
    {
      name: 'undo_last_surgical_edit',
      description:
        'MUST use this tool to revert a file to its last "Pass" state - this is the ONLY way to rollback when AI fixes lower Surgical Integrity Score. Reverts file to last state with Integrity Score > 90. CRITICAL for recovering from bad AI edits. Example: Undo last edit to Program.cs if it lowered the integrity score.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to revert - REQUIRED' },
        },
        required: ['path'],
      },
    },
  ];
}
