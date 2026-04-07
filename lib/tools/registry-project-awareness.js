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
      handler: detect_project_type_handler,
      priority: 100,
      dependencies: [],
      orderingHint: 'Use before any file operations in a new project',
    },
    {
      name: 'detect_project_switch',
      description: 'MUST use this tool before performing any file operations to ensure correct context. Detects project switches and automatically loads the correct rule set, tools, and workflows. Announces project switches to the user.',
      handler: detect_project_switch_handler,
      priority: 95,
      dependencies: [],
      orderingHint: 'Use at the start of every session and when opening files from different projects',
    },
    {
      name: 'get_current_project',
      description: 'Use this to verify the active project context before performing actions. Returns current project information including type, active workflows, and pending tasks.',
      handler: get_current_project_handler,
      priority: 90,
      dependencies: [],
      orderingHint: 'Use to check current project state',
    },
    {
      name: 'validate_action',
      description: 'MUST use this tool before performing file modifications. Validates an action against current project rules to prevent violations of project-specific constraints.',
      handler: validate_action_handler,
      priority: 95,
      dependencies: ['detect_project_switch'],
      orderingHint: 'Use before any file write, rename, or delete operation',
    },
    {
      name: 'get_project_rules',
      description: 'Use this to understand the constraints for the current project type. Returns project-specific rules, constraints, workflows, and SoC boundaries.',
      handler: get_project_rules_handler,
      priority: 85,
      dependencies: ['detect_project_switch'],
      orderingHint: 'Use to understand what rules apply to the current project',
    },
    {
      name: 'switch_project',
      description: 'Use this to manually switch project context. Loads the correct rule set, tools, and workflows for the specified project path.',
      handler: switch_project_handler,
      priority: 80,
      dependencies: [],
      orderingHint: 'Use when explicitly switching between projects',
    },
    {
      name: 'add_pending_task',
      description: 'Use this to track work that needs to be completed for the current project. Tasks are persisted and restored when returning to the project.',
      handler: add_pending_task_handler,
      priority: 75,
      dependencies: ['detect_project_switch'],
      orderingHint: 'Use to track incomplete work',
    },
    {
      name: 'add_project_warning',
      description: 'Use this to track project-specific warnings. Warnings are persisted and shown when returning to the project.',
      handler: add_project_warning_handler,
      priority: 70,
      dependencies: ['detect_project_switch'],
      orderingHint: 'Use to track issues that need attention',
    },
    {
      name: 'add_project_error',
      description: 'Use this to track project-specific errors. Errors are persisted and shown when returning to the project.',
      handler: add_project_error_handler,
      priority: 70,
      dependencies: ['detect_project_switch'],
      orderingHint: 'Use to track errors that occurred',
    },
    {
      name: 'clear_pending_tasks',
      description: 'Use this when all pending tasks are completed. Clears the pending task list for the current project.',
      handler: clear_pending_tasks_handler,
      priority: 65,
      dependencies: ['detect_project_switch'],
      orderingHint: 'Use after completing all tracked tasks',
    },
    {
      name: 'get_all_projects',
      description: 'Use this to see all projects in the registry. Returns a list of all registered projects with their types and states.',
      handler: get_all_projects_handler,
      priority: 60,
      dependencies: [],
      orderingHint: 'Use to see all known projects',
    },
  ];
}
