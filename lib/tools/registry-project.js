/**
 * Project integrity and project memory tool definitions
 */

export function getProjectIntegrityToolDefinitions() {
  return [
    {
      name: 'index_project_files',
      priority: 10,
      description: 'Index all files in a project to enable duplicate detection and reference validation.',
      inputSchema: {
        type: 'object',
        properties: {
          directory: { type: 'string', description: 'Directory to index' },
          excludeDirs: {
            items: { type: 'string' },
            type: 'array',
          },
        },
      },
    },
    {
      name: 'check_file_duplicates',
      priority: 10,
      description: 'Check for duplicate files in the project based on content.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to check for duplicates' },
        },
        required: ['path'],
      },
    },
    {
      name: 'validate_file_references',
      priority: 10,
      description: 'Validate that all file references in the codebase exist.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to validate references for' },
        },
        required: ['path'],
      },
    },
    {
      name: 'check_recent_operations',
      priority: 10,
      description: 'Check recent file operations to detect potential issues.',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Number of recent operations to check' },
        },
      },
    },
    {
      name: 'validate_before_write',
      priority: 10,
      description: 'Perform comprehensive validation before writing a file.',
      inputSchema: {
        type: 'object',
        properties: {
          content: { type: 'string', description: 'Content to validate' },
          path: { type: 'string', description: 'File path to validate' },
        },
        required: ['path', 'content'],
      },
    },
    {
      name: 'get_registry_stats',
      priority: 10,
      description: 'Get statistics about the file registry.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'search_files',
      priority: 10,
      description: 'Search for files in the registry.',
      inputSchema: {
        type: 'object',
        properties: {
          pattern: { type: 'string', description: 'Search pattern' },
        },
        required: ['pattern'],
      },
    },
    {
      name: 'generate_audit_report',
      priority: 10,
      description: 'Generate an audit report of file operations.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'check_file_exists',
      priority: 10,
      description: 'Check if a file exists in the registry.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to check' },
        },
        required: ['path'],
      },
    },
  ];
}

export function getProjectMemoryToolDefinitions() {
  return [
    {
      name: 'index_project_structure',
      priority: 80,
      description:
        'Index the entire project structure to build a comprehensive file and directory map. This is REQUIRED for anti-hallucination and proper project awareness. Use this when: starting work on a new project, after significant structural changes, or when the model seems lost about project structure. Do NOT use this for: simple file operations. Example: Index project structure to understand the codebase layout.',
      inputSchema: {
        type: 'object',
        properties: {
          directory: {
            type: 'string',
            description: 'Directory to index (defaults to workspace root)',
          },
        },
      },
    },
    {
      name: 'analyze_project_conventions',
      priority: 75,
      description:
        'Analyze naming and structure conventions across the project. Detects patterns like snake_case, PascalCase, folder organization, and import patterns. Use this to understand and follow project conventions. Example: Analyze conventions before adding new files to match existing patterns.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'get_project_memory_summary',
      priority: 70,
      description:
        'MUST use this tool before starting significant work on any project. This is the ONLY way to see accumulated project knowledge including structure, conventions, and past decisions. Call this at the start of each session to avoid repeating past mistakes.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'record_project_decision',
      priority: 60,
      description:
        'MUST use this tool to record significant architectural or design decisions to project memory. This is the ONLY way to persist decisions across sessions. Call this after every major refactoring decision, architecture change, or important design choice — prevents future sessions from undoing deliberate choices.',
      inputSchema: {
        type: 'object',
        properties: {
          decision: {
            type: 'string',
            description: 'Decision to record (what, why, impact)',
          },
        },
        required: ['decision'],
      },
    },
    {
      name: 'suggest_file_location',
      priority: 65,
      description:
        'MUST use this tool before creating any new file. This is the ONLY way to verify placement follows project conventions and existing structure. Never create a new file without calling this first — prevents structural drift and duplicate files.',
      inputSchema: {
        type: 'object',
        properties: {
          fileType: {
            type: 'string',
            description: 'File type (js, ts, md, etc.)',
          },
          purpose: {
            type: 'string',
            description: 'Purpose of the file (utility, component, docs, etc.)',
          },
        },
        required: ['fileType', 'purpose'],
      },
    },
  ];
}
