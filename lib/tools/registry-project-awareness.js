/**
 * Project Awareness Tool Definitions Registry
 *
 * Registers all project awareness and context switching tools
 */

import { detect_project_type_handler, detect_project_switch_handler, get_current_project_handler, validate_action_handler, add_pending_task_handler, get_project_rules_handler, switch_project_handler, add_project_warning_handler, add_project_error_handler, clear_pending_tasks_handler, get_all_projects_handler } from '../tools/project-awareness-handlers.js';

export function getProjectAwarenessToolDefinitions() {
  return [
    {
      name: 'project_context',
      priority: 95,
      description: 'PROJECT CONTEXT SWISS-ARMY-KNIFE - Detect project type, detect project switches, get current project, switch projects, or get all projects. This is your swiss-army-knife for project context management. Use this when: opening a new file, starting a session, switching projects, or verifying active context. CRITICAL for ensuring correct rule sets and workflows are loaded. Example: project_context with operation="detect_switch" before file operations to ensure correct context.',
      inputSchema: {
        type: 'object',
        properties: {
          operation: {
            type: 'string',
            enum: ['detect_type', 'detect_switch', 'get_current', 'switch', 'get_all'],
            description: 'Operation to perform',
          },
          file_path: { type: 'string', description: 'File path (for "detect_type" or "detect_switch" operations)' },
          project_path: { type: 'string', description: 'Project path to switch to (for "switch" operation)' },
        },
        required: ['operation'],
      },
    },
    {
      name: 'project_rules',
      priority: 90,
      description: 'PROJECT RULES SWISS-ARMY-KNIFE - Validate actions or get project rules. This is your swiss-army-knife for project-specific constraint management. Use this when: validating file modifications, understanding project constraints, or checking SoC boundaries. CRITICAL for preventing violations of project-specific constraints. Example: project_rules with operation="validate" before writing files to ensure compliance.',
      inputSchema: {
        type: 'object',
        properties: {
          operation: {
            type: 'string',
            enum: ['validate', 'get_rules'],
            description: 'Operation to perform',
          },
          action: { type: 'string', description: 'Action to validate (for "validate" operation)' },
          file_path: { type: 'string', description: 'File path for the action (for "validate" operation)' },
        },
        required: ['operation'],
      },
    },
    {
      name: 'project_track',
      priority: 85,
      description: 'PROJECT TRACKING SWISS-ARMY-KNIFE - Add pending tasks, warnings, errors, or clear pending tasks. This is your swiss-army-knife for project state tracking. Use this when: tracking incomplete work, logging issues, or clearing completed tasks. CRITICAL for persisting context across sessions. Example: project_track with operation="add_task" when work cannot be completed immediately.',
      inputSchema: {
        type: 'object',
        properties: {
          operation: {
            type: 'string',
            enum: ['add_task', 'add_warning', 'add_error', 'clear_tasks'],
            description: 'Operation to perform',
          },
          task: { type: 'string', description: 'Task description (for "add_task" operation)' },
          warning: { type: 'string', description: 'Warning message (for "add_warning" operation)' },
          error: { type: 'string', description: 'Error message (for "add_error" operation)' },
        },
        required: ['operation'],
      },
    },
  ];
}
