/**
 * Project Awareness Tool Definitions Registry
 *
 * Registers all project awareness and context switching tools
 */

import { detect_project_type_handler, detect_project_switch_handler, get_current_project_handler, validate_action_handler, add_pending_task_handler, get_project_rules_handler, switch_project_handler, add_project_warning_handler, add_project_error_handler, clear_pending_tasks_handler, get_all_projects_handler } from '../tools/project-awareness-handlers.js';

export function getProjectAwarenessToolDefinitions() {
  return [
    {
      name: 'detect_project_type',
      description: 'MUST use this tool when opening a new file or working on a new project. Detects the project type (Godot, Node, Python, C#, etc.) from a file path and returns the applicable rule set.',
      inputSchema: {
        type: 'object',
        properties: {
          file_path: {
            type: 'string',
            description: 'File path to detect project type from',
          },
        },
        required: ['file_path'],
      },
      handler: detect_project_type_handler,
      priority: 100,
      dependencies: [],
      orderingHint: 'Use before any file operations in a new project',
    },
    {
      name: 'detect_project_switch',
      description: 'MUST use this tool before performing any file operations to ensure correct context. Detects project switches and automatically loads the correct rule set, tools, and workflows. Announces project switches to the user.',
      inputSchema: {
        type: 'object',
        properties: {
          file_path: {
            type: 'string',
            description: 'File path to check for project switch',
          },
        },
        required: ['file_path'],
      },
      handler: detect_project_switch_handler,
      priority: 95,
      dependencies: [],
      orderingHint: 'Use at the start of every session and when opening files from different projects',
    },
    {
      name: 'get_current_project',
      description: 'MUST use this tool to verify the active project context before performing actions. This is the ONLY way to confirm pending tasks, active workflows, and current project type. Call this at the start of every session and before making any significant decisions.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      handler: get_current_project_handler,
      priority: 90,
      dependencies: [],
      orderingHint: 'Use to check current project state',
    },
    {
      name: 'validate_action',
      description: 'MUST use this tool before performing file modifications. Validates an action against current project rules to prevent violations of project-specific constraints.',
      inputSchema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            description: 'Action to validate (e.g., "write_file", "rename_file")',
          },
          file_path: {
            type: 'string',
            description: 'File path for the action',
          },
        },
        required: ['action', 'file_path'],
      },
      handler: validate_action_handler,
      priority: 95,
      dependencies: ['detect_project_switch'],
      orderingHint: 'Use before any file write, rename, or delete operation',
    },
    {
      name: 'get_project_rules',
      description: 'MUST use this tool to understand the constraints for the current project type. This is the ONLY way to get project-specific rules, SoC boundaries, and workflow requirements. Call this before making architectural decisions or adding new files.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      handler: get_project_rules_handler,
      priority: 85,
      dependencies: ['detect_project_switch'],
      orderingHint: 'Use to understand what rules apply to the current project',
    },
    {
      name: 'switch_project',
      description: 'MUST use this tool when explicitly switching between projects. This is the ONLY way to load the correct rule set, tools, and workflows for a different project path. Always call detect_project_switch first for automatic detection.',
      inputSchema: {
        type: 'object',
        properties: {
          project_path: {
            type: 'string',
            description: 'Path to the project to switch to',
          },
        },
        required: ['project_path'],
      },
      handler: switch_project_handler,
      priority: 80,
      dependencies: [],
      orderingHint: 'Use when explicitly switching between projects',
    },
    {
      name: 'add_pending_task',
      description: 'MUST use this tool to track work that needs to be completed for the current project. This is the ONLY way to persist tasks across sessions. Call this whenever you identify work that cannot be completed immediately — prevents lost context between sessions.',
      inputSchema: {
        type: 'object',
        properties: {
          task: {
            type: 'string',
            description: 'Task description',
          },
        },
        required: ['task'],
      },
      handler: add_pending_task_handler,
      priority: 75,
      dependencies: ['detect_project_switch'],
      orderingHint: 'Use to track incomplete work',
    },
    {
      name: 'add_project_warning',
      description: 'MUST use this tool to track project-specific warnings. Warnings are persisted and shown on every return to the project. Call this immediately when you detect a potential issue that needs future attention.',
      inputSchema: {
        type: 'object',
        properties: {
          warning: {
            type: 'string',
            description: 'Warning message',
          },
        },
        required: ['warning'],
      },
      handler: add_project_warning_handler,
      priority: 70,
      dependencies: ['detect_project_switch'],
      orderingHint: 'Use to track issues that need attention',
    },
    {
      name: 'add_project_error',
      description: 'MUST use this tool to track project-specific errors. Errors are persisted and shown on every return to the project. Call this immediately when an error occurs that could affect future work.',
      inputSchema: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: 'Error message',
          },
        },
        required: ['error'],
      },
      handler: add_project_error_handler,
      priority: 70,
      dependencies: ['detect_project_switch'],
      orderingHint: 'Use to track errors that occurred',
    },
    {
      name: 'clear_pending_tasks',
      description: 'MUST use this tool when all pending tasks are completed. This is the ONLY way to clear the task list and signal a clean project state. Call this after confirming all tracked tasks are done.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      handler: clear_pending_tasks_handler,
      priority: 65,
      dependencies: ['detect_project_switch'],
      orderingHint: 'Use after completing all tracked tasks',
    },
    {
      name: 'get_all_projects',
      description: 'MUST use this tool to see all projects in the registry before switching context. This is the ONLY way to get a list of all registered projects with their types and states.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      handler: get_all_projects_handler,
      priority: 60,
      dependencies: [],
      orderingHint: 'Use to see all known projects',
    },
  ];
}
