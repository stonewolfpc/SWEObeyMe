/**
 * Codebase Orientation tool definitions
 * These tools help AI agents understand codebase structure without overwhelming context
 */

export function getCodebaseOrientationToolDefinitions() {
  return [
    {
      name: 'codebase_orientation',
      priority: 60,
      description:
        'Generate architecture map of a codebase. Analyzes directory structure, identifies frameworks, entry points, and module boundaries. Use this when: first exploring a new codebase, needing to understand project structure, identifying where to start work. Do NOT use this for: reading specific files, making changes, analyzing dependencies. Returns module structure, framework detection, entry points, and module responsibilities.',
      inputSchema: {
        type: 'object',
        properties: {
          project_root: {
            type: 'string',
            description: 'Project root directory path - defaults to current working directory if not provided',
          },
        },
      },
    },
    {
      name: 'dependency_analysis',
      priority: 60,
      description:
        'Analyze codebase dependencies and build dependency graph. Identifies hub files (imported by many modules), circular dependencies, and external dependencies. Use this when: planning refactoring, checking impact of changes, understanding module relationships. Do NOT use this for: reading file contents, making changes. Returns dependency matrix, hub files, circular dependency warnings.',
      inputSchema: {
        type: 'object',
        properties: {
          project_root: {
            type: 'string',
            description: 'Project root directory path - defaults to current working directory if not provided',
          },
        },
      },
    },
    {
      name: 'entry_point_mapper',
      priority: 60,
      description:
        'Map entry points and document API contracts. Extracts public API signatures, configuration requirements, and initialization sequences from entry point files. Use this when: understanding how to integrate with a module, finding API documentation, checking interface contracts. Do NOT use this for: reading implementation details, making changes. Returns entry point locations, API contracts, related modules.',
      inputSchema: {
        type: 'object',
        properties: {
          project_root: {
            type: 'string',
            description: 'Project root directory path - defaults to current working directory if not provided',
          },
        },
      },
    },
    {
      name: 'codebase_explore',
      priority: 65,
      description:
        'On-demand codebase exploration guidance. Answers natural language queries about where to implement features, what modules to consider, and what dependencies to check. Use this when: starting a new feature, unsure where to add code, needing guidance on codebase navigation. Do NOT use this for: reading files, making changes. Returns entry points, affected modules, critical dependencies for your query.',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Natural language query about codebase exploration - REQUIRED',
          },
          project_root: {
            type: 'string',
            description: 'Project root directory path - defaults to current working directory if not provided',
          },
        },
        required: ['query'],
      },
    },
  ];
}
