/**
 * Project Task & Audit Handlers
 * Extracted from project-awareness-handlers.js for SoC compliance.
 */

import {
  getProjectAwarenessManager,
  PROJECT_TYPES,
  PROJECT_RULE_SETS,
} from '../project-awareness.js';
export async function clear_pending_tasks_handler(params) {
  const manager = getProjectAwarenessManager();
  await manager.clearPendingTasks();

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            success: true,
            message: 'Pending tasks cleared successfully',
            currentProject: manager.getCurrentProject(),
          },
          null,
          2
        ),
      },
    ],
    isError: false,
  };
}

/**
 * Handler: Get all registered projects
 * Use this to see all projects in the registry
 */
export async function get_all_projects_handler(params) {
  const manager = getProjectAwarenessManager();
  const projects = manager.getAllProjects ? manager.getAllProjects() : [];

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ success: true, projects, count: projects.length }, null, 2),
      },
    ],
    isError: false,
  };
}

/**
 * Handler: Set current task
 * Use this to mark which task is currently being worked on
 */
export async function set_current_task_handler(params) {
  const { taskId } = params;

  if (!taskId) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ success: false, error: 'taskId is required' }, null, 2),
        },
      ],
      isError: false,
    };
  }

  const manager = getProjectAwarenessManager();
  await manager.setCurrentTask(taskId);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            success: true,
            message: 'Current task set successfully',
            currentProject: manager.getCurrentProject(),
          },
          null,
          2
        ),
      },
    ],
    isError: false,
  };
}

/**
 * Handler: Advance to next pending task
 * Use this to move to the next task after completing current one
 */
export async function advance_task_handler(params) {
  const manager = getProjectAwarenessManager();
  const result = await manager.advanceToNextTask();

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            success: true,
            message: result.message,
            nextTaskId: result.nextTaskId,
            currentProject: manager.getCurrentProject(),
          },
          null,
          2
        ),
      },
    ],
    isError: false,
  };
}

/**
 * Handler: Audit task list
 * Use this to present final summary before deletion
 */
export async function audit_tasks_handler(params) {
  const manager = getProjectAwarenessManager();
  const audit = await manager.auditTasks();

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          { success: true, audit, currentProject: manager.getCurrentProject() },
          null,
          2
        ),
      },
    ],
    isError: false,
  };
}

/**
 * Handler: Archive completed task list
 * Use this to archive to project memory and clear active state
 */
export async function archive_tasks_handler(params) {
  const manager = getProjectAwarenessManager();
  await manager.archiveTasks();

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            success: true,
            message: 'Task list archived successfully',
            currentProject: manager.getCurrentProject(),
          },
          null,
          2
        ),
      },
    ],
    isError: false,
  };
}

/**
 * Dispatcher: project_context swiss-army-knife handler
 * Routes to appropriate handler based on operation parameter
 */
export async function project_context_handler(params) {
  const { operation, file_path, project_path } = params;

  if (!operation) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            { success: false, error: 'operation parameter is required' },
            null,
            2
          ),
        },
      ],
      isError: false,
    };
  }

  switch (operation) {
    case 'detect_type':
      return await detect_project_type_handler({ filePath: file_path });
    case 'detect_switch':
      return await detect_project_switch_handler({ filePath: file_path });
    case 'get_current':
      return await get_current_project_handler(params);
    case 'switch':
      return await switch_project_handler({ projectPath: project_path });
    case 'get_all':
      return await get_all_projects_handler(params);
    default:
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              { success: false, error: `Unknown operation: ${operation}` },
              null,
              2
            ),
          },
        ],
        isError: false,
      };
  }
}

/**
 * Dispatcher: project_rules swiss-army-knife handler
 * Routes to appropriate handler based on operation parameter
 */
export async function project_rules_handler(params) {
  const { operation, action, file_path } = params;

  if (!operation) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            { success: false, error: 'operation parameter is required' },
            null,
            2
          ),
        },
      ],
      isError: false,
    };
  }

  switch (operation) {
    case 'validate':
      return await validate_action_handler({ action, filePath: file_path });
    case 'get_rules':
      return await get_project_rules_handler(params);
    default:
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              { success: false, error: `Unknown operation: ${operation}` },
              null,
              2
            ),
          },
        ],
        isError: false,
      };
  }
}

/**
 * Dispatcher: project_track swiss-army-knife handler
 * Routes to appropriate handler based on operation parameter
 */
export async function project_track_handler(params) {
  const { operation, task, warning, error, taskId, taskStatus } = params;

  if (!operation) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            { success: false, error: 'operation parameter is required' },
            null,
            2
          ),
        },
      ],
      isError: false,
    };
  }

  switch (operation) {
    case 'add_task':
      return await add_pending_task_handler({ task, taskId, taskStatus });
    case 'add_warning':
      return await add_project_warning_handler({ warning });
    case 'add_error':
      return await add_project_error_handler({ error });
    case 'clear_tasks':
      return await clear_pending_tasks_handler(params);
    case 'set_current':
      return await set_current_task_handler({ taskId });
    case 'advance':
      return await advance_task_handler(params);
    case 'audit':
      return await audit_tasks_handler(params);
    case 'archive':
      return await archive_tasks_handler(params);
    default:
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              { success: false, error: `Unknown operation: ${operation}` },
              null,
              2
            ),
          },
        ],
        isError: false,
      };
  }
}
