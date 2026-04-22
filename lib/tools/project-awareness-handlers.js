/**
 * Project Awareness MCP Tool Handlers
 *
 * These handlers provide MCP tools for project detection, switching,
 * and rule enforcement as part of the Project Awareness & Context Switching Layer.
 */

import { getProjectAwarenessManager, PROJECT_TYPES, PROJECT_RULE_SETS } from '../project-awareness.js';

/**
 * Handler: Detect project type from a file path
 * MUST use this tool when opening a new file or working on a new project
 */
export async function detect_project_type_handler(params) {
  const { filePath } = params;

  if (!filePath) {
    return {
      success: false,
      error: 'filePath is required',
    };
  }

  const manager = getProjectAwarenessManager();
  const projectPath = manager.findProjectRoot(filePath);

  if (!projectPath) {
    return {
      success: false,
      error: 'Could not determine project root from file path',
      projectType: PROJECT_TYPES.UNKNOWN,
    };
  }

  const projectType = manager.detectProjectType(projectPath);
  const project = manager.getOrCreateProject(projectPath);

  return {
    success: true,
    projectPath,
    projectName: project.projectName,
    projectType,
    ruleSetName: PROJECT_RULE_SETS[projectType]?.name || 'No rule set',
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
      success: false,
      error: 'filePath is required',
    };
  }

  const manager = getProjectAwarenessManager();
  const announcement = await manager.detectProjectSwitch(filePath);

  if (announcement) {
    return {
      success: true,
      announcement,
      currentProject: manager.getCurrentProject(),
    };
  }

  return {
    success: true,
    message: 'No project switch detected',
    currentProject: manager.getCurrentProject(),
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
      success: false,
      error: 'No active project',
      currentProject: null,
    };
  }

  return {
    success: true,
    currentProject,
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
      success: false,
      error: 'action and filePath are required',
    };
  }

  const manager = getProjectAwarenessManager();
  const validation = manager.validateAction(action, filePath);

  return {
    success: true,
    valid: validation.valid,
    reason: validation.reason,
    currentProject: manager.getCurrentProject(),
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
      success: false,
      error: 'task is required',
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
    success: true,
    message: 'Task added successfully',
    taskId: result.taskId,
    currentProject: manager.getCurrentProject(),
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
      success: false,
      error: 'No project type specified and no active project',
    };
  }

  const rules = manager.getProjectRules(targetProjectType);

  return {
    success: true,
    projectType: targetProjectType,
    rules,
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
      success: false,
      error: 'projectPath is required',
    };
  }

  const manager = getProjectAwarenessManager();
  const project = manager.getOrCreateProject(projectPath);
  const announcement = await manager.switchProject(project);

  return {
    success: true,
    announcement,
    currentProject: manager.getCurrentProject(),
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
      success: false,
      error: 'warning is required',
    };
  }

  const manager = getProjectAwarenessManager();
  await manager.addWarning(warning);

  return {
    success: true,
    message: 'Warning added successfully',
    currentProject: manager.getCurrentProject(),
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
      success: false,
      error: 'error is required',
    };
  }

  const manager = getProjectAwarenessManager();
  await manager.addError(error);

  return {
    success: true,
    message: 'Error added successfully',
    currentProject: manager.getCurrentProject(),
  };
}

/**
 * Handler: Clear pending tasks
 * Use this when all pending tasks are completed
 */
export async function clear_pending_tasks_handler(params) {
  const manager = getProjectAwarenessManager();
  await manager.clearPendingTasks();

  return {
    success: true,
    message: 'Pending tasks cleared successfully',
    currentProject: manager.getCurrentProject(),
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
    success: true,
    projects,
    count: projects.length,
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
      success: false,
      error: 'taskId is required',
    };
  }

  const manager = getProjectAwarenessManager();
  await manager.setCurrentTask(taskId);

  return {
    success: true,
    message: 'Current task set successfully',
    currentProject: manager.getCurrentProject(),
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
    success: true,
    message: result.message,
    nextTaskId: result.nextTaskId,
    currentProject: manager.getCurrentProject(),
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
    success: true,
    audit,
    currentProject: manager.getCurrentProject(),
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
    success: true,
    message: 'Task list archived successfully',
    currentProject: manager.getCurrentProject(),
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
      success: false,
      error: 'operation parameter is required',
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
        success: false,
        error: `Unknown operation: ${operation}`,
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
      success: false,
      error: 'operation parameter is required',
    };
  }

  switch (operation) {
    case 'validate':
      return await validate_action_handler({ action, filePath: file_path });
    case 'get_rules':
      return await get_project_rules_handler(params);
    default:
      return {
        success: false,
        error: `Unknown operation: ${operation}`,
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
      success: false,
      error: 'operation parameter is required',
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
        success: false,
        error: `Unknown operation: ${operation}`,
      };
  }
}
