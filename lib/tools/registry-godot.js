/**
 * Godot tool definitions for SWEObeyMe
 * Provides tools for detecting Godot projects and enforcing Godot best practices
 */

/**
 * Get Godot tool definitions
 * @returns {Array} Array of Godot tool definitions
 */
export function getGodotToolDefinitions() {
  return [
    {
      name: 'detect_godot_project',
      description: 'MUST use this tool to detect if a project is a Godot project before making any Godot-specific changes. This is the ONLY way to reliably identify Godot projects by checking for project.godot, .godot folder, GDScript files, and Godot directory structure. Returns project type (2D/3D/mixed), Godot version, and whether GDScript files are present.',
      inputSchema: {
        type: 'object',
        properties: {
          projectPath: {
            type: 'string',
            description: 'Path to the project directory to check',
          },
        },
        required: ['projectPath'],
      },
      priority: 95, // High priority for project detection
      handler: 'detect_godot_project_handler',
    },
    {
      name: 'check_godot_practices',
      description: 'MUST use this tool to verify code follows Godot best practices before finalizing changes in Godot projects. This is the ONLY way to ensure compliance with Godot coding standards including line length limits, naming conventions (snake_case for files, PascalCase for classes), autoload usage, scene organization, and script organization. Returns violations and actionable suggestions.',
      inputSchema: {
        type: 'object',
        properties: {
          projectPath: {
            type: 'string',
            description: 'Path to the Godot project directory',
          },
          filePath: {
            type: 'string',
            description: 'Optional: Specific file path to check for violations',
          },
        },
        required: ['projectPath'],
      },
      priority: 94, // High priority for practice enforcement
      handler: 'check_godot_practices_handler',
    },
    {
      name: 'godot_lookup',
      description: 'MUST use this tool to search Godot best practices documentation before implementing features in Godot projects. This is the ONLY way to access official Godot documentation on object-oriented principles, scene organization, autoloads, interfaces, notifications, data preferences, logic preferences, project organization, and version control. Search by query or category to find relevant guidance.',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query to find relevant best practices (e.g., "autoload", "scene organization")',
          },
          category: {
            type: 'string',
            description: 'Specific category to lookup (e.g., "scene_organization", "autoloads")',
          },
        },
      },
      priority: 93, // High priority for documentation lookup
      handler: 'godot_lookup_handler',
    },
  ];
}
