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
  const { task } = params;

  if (!task) {
    return {
      success: false,
      error: 'task is required',
    };
  }

  const manager = getProjectAwarenessManager();
  await manager.addPendingTask(task);

  return {
    success: true,
    message: 'Task added successfully',
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
  const { operation, task, warning, error } = params;

  if (!operation) {
    return {
      success: false,
      error: 'operation parameter is required',
    };
  }

  switch (operation) {
    case 'add_task':
      return await add_pending_task_handler({ task });
    case 'add_warning':
      return await add_project_warning_handler({ warning });
    case 'add_error':
      return await add_project_error_handler({ error });
    case 'clear_tasks':
      return await clear_pending_tasks_handler(params);
    default:
      return {
        success: false,
        error: `Unknown operation: ${operation}`,
      };
  }
}
