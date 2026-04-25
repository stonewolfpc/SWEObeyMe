/**
 * Configuration and system tool definitions
 * NOTE: enforce_surgical_rules removed - handled by auto-enforcement system
 */

export function getConfigToolDefinitions() {
  return [
    {
      name: 'config_manage',
      priority: 85,
      description:
        'Swiss-army-knife for configuration management. Get, set, reset, view schema, and toggle strict mode. Control line count limits, feature toggles, validation strictness, and all other settings. Use this when: changing settings, viewing current configuration, resetting to defaults, or enabling strict mode.',
      inputSchema: {
        type: 'object',
        properties: {
          operation: {
            type: 'string',
            enum: ['get', 'set', 'reset', 'schema', 'strict_mode', 'stats', 'diagnostics'],
            description: 'Operation to perform',
          },
          settings: {
            type: 'object',
            description:
              'Configuration key-value pairs to set (for "set" operation). Valid keys: maxLines, warningThreshold, maxBackupsPerFile, enableAutoCorrection, debugLogs, enableLoopDetection, maxLoopAttempts, minDocumentationRatio, enableWorkflowOrchestration, enableSessionMemory, enableOracle, forbiddenPatterns, reminderInterval',
          },
          enable: {
            type: 'boolean',
            description: 'Enable or disable (for "strict_mode" operation)',
          },
        },
        required: ['operation'],
      },
    },
    {
      name: 'list_directory',
      priority: 10,
      description:
        'List files and directories in a given path. Use this to explore project structure before making changes.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Directory path to list' },
        },
        required: ['path'],
      },
    },
    {
      name: 'session_manage',
      priority: 80,
      description:
        'Swiss-army-knife for session management. Get context, record decisions, or recover from errors. Use this when: you encounter repeated failures, need to see session history, want to record a decision, or need to recover from errors. Helps break failure loops and maintain audit trails.',
      inputSchema: {
        type: 'object',
        properties: {
          operation: {
            type: 'string',
            enum: ['context', 'record_decision', 'recover'],
            description: 'Operation to perform',
          },
          decision: {
            type: 'string',
            description: 'Decision to record (for "record_decision" operation)',
          },
          reason: { type: 'string', description: 'Reason for recovery (for "recover" operation)' },
        },
        required: ['operation'],
      },
    },
    {
      name: 'code_analyze',
      priority: 75,
      description:
        'Swiss-army-knife for code quality analysis. Sanitize requests, repair submissions, analyze file health, detect architectural drift. Use this when: verifying approach is sound, repairing malformed submissions, analyzing file health, or detecting documentation drift.',
      inputSchema: {
        type: 'object',
        properties: {
          operation: {
            type: 'string',
            enum: ['sanitize', 'repair', 'health', 'drift'],
            description: 'Operation to perform',
          },
          logic_intent: {
            type: 'string',
            description: 'Logic intent to sanitize (for "sanitize" operation)',
          },
          raw_content: {
            type: 'string',
            description: 'Raw content to repair (for "repair" operation)',
          },
          type: {
            type: 'string',
            enum: ['json', 'code'],
            description: 'Type of content to repair (for "repair" operation)',
          },
          path: {
            type: 'string',
            description: 'File path to analyze (for "health" or "drift" operations)',
          },
        },
        required: ['operation'],
      },
    },
    {
      name: 'refactor_manage',
      priority: 70,
      description:
        'Swiss-army-knife for ALL refactoring needs. Move, extract, rename, inline, replace, delete, or split code. Auto-deletes source code by default. Use leave_reference=true ONLY for file splits. Use when: obey_surgical_plan rejects plan, file handles multiple concerns, code belongs in different module, renaming symbols, inlining functions, or splitting files.',
      inputSchema: {
        type: 'object',
        properties: {
          operation: {
            type: 'string',
            enum: ['move', 'extract', 'rename', 'inline', 'replace', 'delete', 'split'],
            description: 'Operation to perform',
          },
          code_block: {
            type: 'string',
            description: 'Exact code block to move/extract/delete (must match source exactly)',
          },
          source_path: {
            type: 'string',
            description: 'Source file path (for "move", "extract", "split" operations)',
          },
          target_path: { type: 'string', description: 'Target file path (for "move" operation)' },
          new_file_path: {
            type: 'string',
            description: 'New file path to create (for "extract" operation)',
          },
          description: {
            type: 'string',
            description: 'Description of extraction (for "extract" operation)',
          },
          auto_delete: {
            type: 'boolean',
            description: 'Auto-delete source code after move/extract (default: true)',
          },
          leave_reference: {
            type: 'boolean',
            description:
              'Leave reference comment in source (use ONLY for file splits, default: false)',
          },
          file_path: {
            type: 'string',
            description: 'File path (for "rename", "inline", "replace", "delete" operations)',
          },
          old_name: { type: 'string', description: 'Old symbol name (for "rename" operation)' },
          new_name: { type: 'string', description: 'New symbol name (for "rename" operation)' },
          symbol_type: {
            type: 'string',
            enum: ['all', 'function', 'class', 'variable'],
            description: 'Symbol type for rename (default: "all")',
          },
          function_name: {
            type: 'string',
            description: 'Function name to inline (for "inline" operation)',
          },
          replacement_code: {
            type: 'string',
            description: 'Replacement code (for "inline", "replace" operations)',
          },
          old_code: {
            type: 'string',
            description: 'Old code to replace (for "replace" operation)',
          },
          new_code: { type: 'string', description: 'New code (for "replace" operation)' },
          splits: {
            type: 'array',
            items: { type: 'object' },
            description:
              'Split definitions (for "split" operation): [{ delimiter, target_path, description }]',
          },
        },
        required: ['operation'],
      },
    },
    {
      name: 'backup_manage',
      priority: 65,
      description:
        'Swiss-army-knife for file safety. Create, restore, or undo backups. Use this before risky operations or when you need to recover from bad edits.',
      inputSchema: {
        type: 'object',
        properties: {
          operation: {
            type: 'string',
            enum: ['create', 'restore', 'undo'],
            description: 'Operation to perform',
          },
          path: { type: 'string', description: 'File path to backup/restore/undo' },
          backup_index: { type: 'number', description: 'Backup index for restore (0 = newest)' },
        },
        required: ['operation', 'path'],
      },
    },
    {
      name: 'workflow_manage',
      priority: 60,
      description:
        'Initiate, track status, or get context for multi-step operations. Use this for tasks requiring 3+ coordinated steps to prevent abandoned half-complete refactors. Helps track complex refactors.',
      inputSchema: {
        type: 'object',
        properties: {
          operation: {
            type: 'string',
            enum: ['initiate', 'status', 'context'],
            description: 'Operation to perform',
          },
          goal: { type: 'string', description: 'Workflow goal (for "initiate" operation)' },
          steps: {
            type: 'array',
            items: { type: 'object' },
            description: 'Workflow steps (for "initiate" operation)',
          },
        },
        required: ['operation'],
      },
    },
    {
      name: 'query_the_oracle',
      priority: 10,
      description:
        'Query the Oracle for surgical wisdom and motivation. Use this when you need guidance or encouragement during complex tasks.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'autonomous_execute',
      priority: 95,
      description:
        'AUTONOMOUS EXECUTION - "Anti-Vibe-Coder / 3AM Finish This While I\'m Gone" Upgrade. Automatically generates full task plans from long prompts and executes them autonomously. This is DEFAULT ON and makes Windsurf invaluable at $15 price point. Use this when: you give a long messy prompt, say "finish this while I\'m gone", or want hands-off execution. The system breaks tasks into atomic steps, orders by dependency, groups into phases, and continues until complete. OFF SWITCH: Set "autonomousExecutionProfessionalOnly" to true in config to disable for professional developers only. Example: autonomous_execute with prompt="Build a REST API with user authentication" to get autonomous execution.',
      inputSchema: {
        type: 'object',
        properties: {
          prompt: {
            type: 'string',
            description: 'User prompt to process and generate task plan from',
          },
          context: {
            type: 'object',
            description: 'Additional context for task generation (project type, framework, etc.)',
          },
          workspace_path: { type: 'string', description: 'Workspace path for execution' },
        },
        required: ['prompt'],
      },
    },
    {
      name: 'autonomous_status',
      priority: 90,
      description:
        'AUTONOMOUS STATUS - Get current autonomous execution status. Shows active plan, progress, current task, and execution mode. Use this to monitor 3AM autopilot progress. Example: autonomous_status to see if autonomous execution is active and how far along it is.',
      inputSchema: {
        type: 'object',
        properties: {
          workspace_path: { type: 'string', description: 'Workspace path for status check' },
        },
      },
    },
    {
      name: 'autonomous_pause',
      priority: 85,
      description:
        'AUTONOMOUS PAUSE - Pause autonomous execution. Use this to temporarily stop 3AM autopilot mode. Example: autonomous_pause to pause current autonomous execution.',
      inputSchema: {
        type: 'object',
        properties: {
          workspace_path: { type: 'string', description: 'Workspace path for pause operation' },
        },
      },
    },
    {
      name: 'autonomous_resume',
      priority: 85,
      description:
        'AUTONOMOUS RESUME - Resume paused autonomous execution. Use this to continue 3AM autopilot mode after pausing. Example: autonomous_resume to continue paused execution.',
      inputSchema: {
        type: 'object',
        properties: {
          workspace_path: { type: 'string', description: 'Workspace path for resume operation' },
        },
      },
    },
    {
      name: 'autonomous_cancel',
      priority: 85,
      description:
        'AUTONOMOUS CANCEL - Cancel autonomous execution and clear task plan. Use this to stop 3AM autopilot mode completely. Example: autonomous_cancel to cancel current execution and clear plan.',
      inputSchema: {
        type: 'object',
        properties: {
          workspace_path: { type: 'string', description: 'Workspace path for cancel operation' },
        },
      },
    },
    {
      name: 'autonomous_plan',
      priority: 80,
      description:
        'AUTONOMOUS PLAN - Generate task plan only without execution. Use this to review the plan before autonomous execution. Example: autonomous_plan with prompt="Build a REST API" to see the generated task plan without executing.',
      inputSchema: {
        type: 'object',
        properties: {
          prompt: { type: 'string', description: 'User prompt to generate task plan from' },
          context: { type: 'object', description: 'Additional context for task generation' },
          workspace_path: { type: 'string', description: 'Workspace path for plan generation' },
        },
        required: ['prompt'],
      },
    },
    {
      name: 'autonomous_enable',
      priority: 75,
      description:
        'AUTONOMOUS ENABLE - Enable autonomous mode. OFF SWITCH: If "autonomousExecutionProfessionalOnly" is true in config, this will fail. Use this to manually enable 3AM autopilot mode. Example: autonomous_enable to enable autonomous execution.',
      inputSchema: {
        type: 'object',
        properties: {
          workspace_path: { type: 'string', description: 'Workspace path for enable operation' },
        },
      },
    },
    {
      name: 'autonomous_disable',
      priority: 75,
      description:
        'AUTONOMOUS DISABLE - Disable autonomous mode. Use this to manually disable 3AM autopilot mode. Example: autonomous_disable to disable autonomous execution.',
      inputSchema: {
        type: 'object',
        properties: {
          workspace_path: { type: 'string', description: 'Workspace path for disable operation' },
        },
      },
    },
    {
      name: 'agent_spawn',
      priority: 88,
      description:
        'AGENT SPAWN - Spawn a new agent for parallel execution. Addresses RedMonk Complaint #5: Multi-Agent Orchestration. Use this to create agents that can work in parallel on different tasks. Supports priority levels and dependencies between agents. Example: agent_spawn with name="File Refactor" and task="Refactor validation logic" to spawn a new agent.',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Agent name' },
          task: { type: 'string', description: 'Task description' },
          priority: {
            type: 'string',
            enum: ['high', 'medium', 'low'],
            description: 'Agent priority (default: medium)',
          },
          dependencies: {
            type: 'array',
            items: { type: 'string' },
            description: 'Agent IDs this agent depends on',
          },
        },
        required: ['name', 'task'],
      },
    },
    {
      name: 'agent_start',
      priority: 87,
      description:
        'AGENT START - Start a spawned agent. Checks dependencies and conflicts before starting. Example: agent_start with agent_id to begin execution.',
      inputSchema: {
        type: 'object',
        properties: {
          agent_id: { type: 'string', description: 'Agent ID to start' },
        },
        required: ['agent_id'],
      },
    },
    {
      name: 'agent_pause',
      priority: 86,
      description:
        'AGENT PAUSE - Pause a running agent. Use this to temporarily stop execution. Example: agent_pause with agent_id to pause execution.',
      inputSchema: {
        type: 'object',
        properties: {
          agent_id: { type: 'string', description: 'Agent ID to pause' },
        },
        required: ['agent_id'],
      },
    },
    {
      name: 'agent_resume',
      priority: 86,
      description:
        'AGENT RESUME - Resume a paused agent. Example: agent_resume with agent_id to continue execution.',
      inputSchema: {
        type: 'object',
        properties: {
          agent_id: { type: 'string', description: 'Agent ID to resume' },
        },
        required: ['agent_id'],
      },
    },
    {
      name: 'agent_terminate',
      priority: 86,
      description:
        'AGENT TERMINATE - Terminate an agent permanently. Use this to stop execution completely. Example: agent_terminate with agent_id to terminate agent.',
      inputSchema: {
        type: 'object',
        properties: {
          agent_id: { type: 'string', description: 'Agent ID to terminate' },
        },
        required: ['agent_id'],
      },
    },
    {
      name: 'agent_dashboard',
      priority: 85,
      description:
        'AGENT DASHBOARD - Get multi-agent orchestration dashboard showing all agents, their status, progress, and conflicts. Addresses RedMonk Complaint #5: Dashboards showing which agents are working on what. Example: agent_dashboard to see all agents.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'agent_details',
      priority: 84,
      description:
        'AGENT DETAILS - Get detailed information about a specific agent including logs, conflicts, and affected files. Example: agent_details with agent_id to see agent details.',
      inputSchema: {
        type: 'object',
        properties: {
          agent_id: { type: 'string', description: 'Agent ID to get details for' },
        },
        required: ['agent_id'],
      },
    },
    {
      name: 'agent_execute_parallel',
      priority: 83,
      description:
        'AGENT EXECUTE PARALLEL - Execute multiple agents in parallel. Addresses RedMonk Complaint #5: Running multiple agents in parallel. Example: agent_execute_parallel with agent_ids array to run agents simultaneously.',
      inputSchema: {
        type: 'object',
        properties: {
          agent_ids: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of agent IDs to execute',
          },
        },
        required: ['agent_ids'],
      },
    },
    {
      name: 'agent_clear_completed',
      priority: 82,
      description:
        'AGENT CLEAR COMPLETED - Clear completed/failed/terminated agents from memory. Use this to clean up after parallel execution. Example: agent_clear_completed to remove completed agents.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'spec_load',
      priority: 81,
      description:
        'SPEC LOAD - Load spec files (requirements.md, design.md, tasks.md) as source of truth. Addresses RedMonk Complaint #6: Spec-Driven Development. Use this to load specifications for tracking and verification. Example: spec_load to load spec files from workspace.',
      inputSchema: {
        type: 'object',
        properties: {
          workspace_path: { type: 'string', description: 'Workspace path containing spec files' },
        },
      },
    },
    {
      name: 'spec_compliance',
      priority: 80,
      description:
        'SPEC COMPLIANCE - Generate compliance report showing spec item status and completion. Example: spec_compliance to see compliance status.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'spec_verify',
      priority: 79,
      description:
        'SPEC VERIFY - Verify implementation against specs as a checkpoint. Addresses RedMonk Complaint #6: Use specifications as verification checkpoints. Example: spec_verify to verify implementation progress.',
      inputSchema: {
        type: 'object',
        properties: {
          workspace_path: { type: 'string', description: 'Workspace path for verification' },
        },
      },
    },
    {
      name: 'spec_update',
      priority: 78,
      description:
        'SPEC UPDATE - Update spec item status. Addresses RedMonk Complaint #6: Agents that update specs as code evolves. Example: spec_update with spec_type="requirements", item_id="REQ-1", status="completed" to mark requirement complete.',
      inputSchema: {
        type: 'object',
        properties: {
          spec_type: {
            type: 'string',
            enum: ['requirements', 'design', 'tasks'],
            description: 'Spec type',
          },
          item_id: { type: 'string', description: 'Item ID to update' },
          status: {
            type: 'string',
            enum: ['pending', 'in_progress', 'completed', 'blocked'],
            description: 'New status',
          },
          update_content: { type: 'string', description: 'Additional content to add' },
        },
        required: ['spec_type', 'item_id', 'status'],
      },
    },
    {
      name: 'spec_track',
      priority: 77,
      description:
        'SPEC TRACK - Track implementation against spec items. Example: spec_track with file_path and spec_item_ids to link file to requirements.',
      inputSchema: {
        type: 'object',
        properties: {
          file_path: { type: 'string', description: 'File path being implemented' },
          spec_item_ids: {
            type: 'array',
            items: { type: 'string' },
            description: 'Spec item IDs this file implements',
          },
        },
        required: ['file_path', 'spec_item_ids'],
      },
    },
    {
      name: 'spec_divergence',
      priority: 76,
      description:
        'SPEC DIVERGENCE - Check for divergences between implementation and specs. Addresses RedMonk Complaint #6: Flag when implementation diverges from design. Example: spec_divergence to check for divergences.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'comprehensive_error_detection',
      priority: 90,
      description:
        'Comprehensive Error Detection - Detects ALL potential errors from frontend UI to tiny lint issues. Uses ESLint, TypeScript, Prettier, security scanning, accessibility checks, performance analysis, dead code detection, and circular dependency checks. Designed for indie budget developers with 1 test machine. Example: comprehensive_error_detection to run full project scan.',
      inputSchema: {
        type: 'object',
        properties: {
          projectRoot: {
            type: 'string',
            description: 'Project root path (default: current working directory)',
          },
          enableTypeScript: {
            type: 'boolean',
            description: 'Enable TypeScript type checking (default: true)',
          },
          enableESLint: { type: 'boolean', description: 'Enable ESLint linting (default: true)' },
          enablePrettier: {
            type: 'boolean',
            description: 'Enable Prettier formatting check (default: true)',
          },
          enableSecurity: {
            type: 'boolean',
            description: 'Enable security scanning (default: true)',
          },
          enableAccessibility: {
            type: 'boolean',
            description: 'Enable accessibility checks (default: true)',
          },
          enablePerformance: {
            type: 'boolean',
            description: 'Enable performance analysis (default: true)',
          },
          enableDeadCode: {
            type: 'boolean',
            description: 'Enable dead code detection (default: true)',
          },
          enableCircularDeps: {
            type: 'boolean',
            description: 'Enable circular dependency check (default: true)',
          },
        },
      },
    },
    {
      name: 'comprehensive_error_detection_file',
      priority: 89,
      description:
        'Comprehensive Error Detection (File) - Detects errors on a specific file. Uses ESLint, TypeScript, and Prettier. Example: comprehensive_error_detection_file with filePath="index.js" to check a single file.',
      inputSchema: {
        type: 'object',
        properties: {
          filePath: { type: 'string', description: 'File path to check' },
          enableTypeScript: {
            type: 'boolean',
            description: 'Enable TypeScript type checking (default: true)',
          },
          enableESLint: { type: 'boolean', description: 'Enable ESLint linting (default: true)' },
          enablePrettier: {
            type: 'boolean',
            description: 'Enable Prettier formatting check (default: true)',
          },
        },
        required: ['filePath'],
      },
    },
    {
      name: 'get_error_detection_status',
      priority: 88,
      description:
        'Get Error Detection Status - Quick status check of error detection results. Returns counts of all error types and overall status. Example: get_error_detection_status to check current error state.',
      inputSchema: {
        type: 'object',
        properties: {
          projectRoot: {
            type: 'string',
            description: 'Project root path (default: current working directory)',
          },
        },
      },
    },
  ];
}
