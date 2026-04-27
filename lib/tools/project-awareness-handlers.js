/**
 * Project Awareness MCP Tool Handlers
 *
 * These handlers provide MCP tools for project detection, switching,
 * and rule enforcement as part of the Project Awareness & Context Switching Layer.
 */

import {
  getProjectAwarenessManager,
  PROJECT_TYPES,
  PROJECT_RULE_SETS,
} from '../project-awareness.js';

/**
 * Handler: Detect project type from a file path
 * MUST use this tool when opening a new file or working on a new project
 */
export async function detect_project_type_handler(params) {
  const { filePath } = params;

  if (!filePath) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ success: false, error: 'filePath is required' }, null, 2),
        },
      ],
      isError: false,
    };
  }

  const manager = getProjectAwarenessManager();
  const projectPath = await manager.findProjectRoot(filePath);

  if (!projectPath) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: false,
              error: 'Could not determine project root from file path',
              projectType: PROJECT_TYPES.UNKNOWN,
            },
            null,
            2
          ),
        },
      ],
      isError: false,
    };
  }

  const projectType = await manager.detectProjectType(projectPath);
  const project = await manager.getOrCreateProject(projectPath);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            success: true,
            projectPath,
            projectName: project.projectName,
            projectType,
            ruleSetName: PROJECT_RULE_SETS[projectType]?.name || 'No rule set',
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
 * Handler: Detect and handle project switch
 * MUST use this tool before performing any file operations to ensure correct context
 */
export async function detect_project_switch_handler(params) {
  const { filePath } = params;

  if (!filePath) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ success: false, error: 'filePath is required' }, null, 2),
        },
      ],
      isError: false,
    };
  }

  const manager = getProjectAwarenessManager();
  const announcement = await manager.detectProjectSwitch(filePath);

  if (announcement) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            { success: true, announcement, currentProject: manager.getCurrentProject() },
            null,
            2
          ),
        },
      ],
      isError: false,
    };
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            success: true,
            message: 'No project switch detected',
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
 * Handler: Get current project information
 * Use this to verify the active project context
 */
export async function get_current_project_handler(params) {
  const manager = getProjectAwarenessManager();
  const currentProject = manager.getCurrentProject();

  if (!currentProject) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            { success: false, error: 'No active project', currentProject: null },
            null,
            2
          ),
        },
      ],
      isError: false,
    };
  }

  return {
    content: [{ type: 'text', text: JSON.stringify({ success: true, currentProject }, null, 2) }],
    isError: false,
  };
}

/**
 * Handler: Validate an action against current project rules
 * MUST use this tool before performing file modifications
 */
export async function validate_action_handler(params) {
  const { action, filePath } = params;

  if (!action || !filePath) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            { success: false, error: 'action and filePath are required' },
            null,
            2
          ),
        },
      ],
      isError: false,
    };
  }

  const manager = getProjectAwarenessManager();
  const validation = manager.validateAction(action, filePath);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            success: true,
            valid: validation.valid,
            reason: validation.reason,
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
 * Handler: Add pending task to current project
 * Use this to track work that needs to be completed
 */
export async function add_pending_task_handler(params) {
  const { task, taskId, taskStatus } = params;

  if (!task) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ success: false, error: 'task is required' }, null, 2),
        },
      ],
      isError: false,
    };
  }

  const manager = getProjectAwarenessManager();
  const result = await manager.addPendingTask(task, taskId, taskStatus);

  // Sync task list snapshot with session state
  const currentProject = manager.getCurrentProject();
  if (currentProject && currentProject.pendingTasks) {
    const { setTaskListSnapshot, setCurrentTaskId } = await import('../session-state.js');
    setTaskListSnapshot(currentProject.pendingTasks);
    if (result.taskId) {
      setCurrentTaskId(result.taskId);
    }
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            success: true,
            message: 'Task added successfully',
            taskId: result.taskId,
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
 * Handler: Get project-specific rules
 * Use this to understand the constraints for the current project type
 */
export async function get_project_rules_handler(params) {
  const { projectType } = params;

  const manager = getProjectAwarenessManager();
  const currentProject = manager.getCurrentProject();
  const targetProjectType = projectType || currentProject?.projectType;

  if (!targetProjectType) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            { success: false, error: 'No project type specified and no active project' },
            null,
            2
          ),
        },
      ],
      isError: false,
    };
  }

  const rules = manager.getProjectRules(targetProjectType);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ success: true, projectType: targetProjectType, rules }, null, 2),
      },
    ],
    isError: false,
  };
}

/**
 * Handler: Switch to a specific project
 * Use this to manually switch project context
 */
export async function switch_project_handler(params) {
  const { projectPath } = params;

  if (!projectPath) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ success: false, error: 'projectPath is required' }, null, 2),
        },
      ],
      isError: false,
    };
  }

  const manager = getProjectAwarenessManager();
  const project = await manager.getOrCreateProject(projectPath);
  const announcement = await manager.switchProject(project);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          { success: true, announcement, currentProject: manager.getCurrentProject() },
          null,
          2
        ),
      },
    ],
    isError: false,
  };
}

/**
 * Handler: Add warning to current project
 * Use this to track project-specific warnings
 */
export async function add_project_warning_handler(params) {
  const { warning } = params;

  if (!warning) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ success: false, error: 'warning is required' }, null, 2),
        },
      ],
      isError: false,
    };
  }

  const manager = getProjectAwarenessManager();
  await manager.addWarning(warning);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            success: true,
            message: 'Warning added successfully',
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
 * Handler: Add error to current project
 * Use this to track project-specific errors
 */
export async function add_project_error_handler(params) {
  const { error } = params;

  if (!error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ success: false, error: 'error is required' }, null, 2),
        },
      ],
      isError: false,
    };
  }

  const manager = getProjectAwarenessManager();
  await manager.addError(error);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            success: true,
            message: 'Error added successfully',
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
 * Handler: Clear pending tasks
 * Use this when all pending tasks are completed
 */

export { clear_pending_tasks_handler, get_all_projects_handler, set_current_task_handler, advance_task_handler, audit_tasks_handler, archive_tasks_handler, project_context_handler, project_rules_handler, project_track_handler } from './project-task-handlers.js';
