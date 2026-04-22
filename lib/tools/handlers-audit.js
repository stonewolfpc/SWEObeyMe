/**
 * Audit System Tool Handlers
 * Provides MCP tools for pre-work auditing, duplicate detection, and todo scheduling
 */

import { getAuditSystem } from '../audit-system.js';

/**
 * Run pre-work audit before starting new work
 */
export async function pre_work_audit_handler(args) {
  const { taskDescription } = args;

  if (!taskDescription) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Task description is required for pre-work audit' }],
    };
  }

  try {
    const { preWorkAuditor } = getAuditSystem();
    const audit = await preWorkAuditor.auditBeforeWork(taskDescription);

    let response = `Pre-Work Audit Results\n`;
    response += `======================\n\n`;
    response += `Should Proceed: ${audit.shouldProceed ? 'YES' : 'NO'}\n`;
    response += `Critical Issues: ${audit.criticalCount}\n`;
    response += `High Priority Issues: ${audit.highCount}\n`;
    response += `Total Issues: ${audit.issues.length}\n\n`;

    if (audit.issues.length > 0) {
      response += 'Issues Found:\n';
      for (const issue of audit.issues) {
        response += `\n[${issue.severity.toUpperCase()}] ${issue.description}\n`;
        response += `  Type: ${issue.type}\n`;
        if (issue.details) {
          response += `  Details: ${JSON.stringify(issue.details)}\n`;
        }
        if (issue.suggestion) {
          response += `  Suggestion: ${issue.suggestion}\n`;
        }
      }
    } else {
      response += 'No issues found. Safe to proceed.\n';
    }

    if (!audit.shouldProceed) {
      response += '\n⚠️  CRITICAL ISSUES FOUND - Do not proceed until these are resolved.\n';
    }

    return {
      content: [{ type: 'text', text: response }],
    };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Error running pre-work audit: ${error.message}` }],
    };
  }
}

/**
 * Get audit issues
 */
export async function get_audit_issues_handler(args) {
  try {
    const { preWorkAuditor } = getAuditSystem();
    const issues = preWorkAuditor.getIssues();

    let response = `Audit Issues (${issues.length})\n`;
    response += `=========================\n\n`;

    if (issues.length === 0) {
      response += 'No audit issues.\n';
    } else {
      for (const issue of issues) {
        response += `[${issue.severity.toUpperCase()}] ${issue.description}\n`;
        response += `  Type: ${issue.type}\n`;
        if (issue.suggestion) {
          response += `  Suggestion: ${issue.suggestion}\n`;
        }
        response += '\n';
      }
    }

    return {
      content: [{ type: 'text', text: response }],
    };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Error getting audit issues: ${error.message}` }],
    };
  }
}

/**
 * Clear audit issues
 */
export async function clear_audit_issues_handler(args) {
  try {
    const { preWorkAuditor } = getAuditSystem();
    preWorkAuditor.clearIssues();

    return {
      content: [{ type: 'text', text: 'All audit issues cleared.' }],
    };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Error clearing audit issues: ${error.message}` }],
    };
  }
}

/**
 * Schedule a todo
 */
export async function schedule_todo_handler(args) {
  const { todoId, todoDescription, trigger, priority, dependencies, phase, delay } = args;

  if (!todoId || !todoDescription) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'todoId and todoDescription are required' }],
    };
  }

  try {
    const { todoScheduler } = getAuditSystem();
    
    const todo = {
      id: todoId,
      description: todoDescription,
    };

    const schedule = {
      trigger: trigger || 'immediate',
      priority: priority || 'medium',
      dependencies: dependencies || [],
      ...(phase && { phase }),
      ...(delay && { delay }),
    };

    todoScheduler.scheduleTodo(todo, schedule);

    return {
      content: [{ type: 'text', text: `Todo "${todoId}" scheduled successfully.` }],
    };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Error scheduling todo: ${error.message}` }],
    };
  }
}

/**
 * Get due todos
 */
export async function get_due_todos_handler(args) {
  const { action, phase } = args;

  try {
    const { todoScheduler } = getAuditSystem();
    const context = {};
    
    if (action) context.action = action;
    if (phase) context.phase = phase;

    const dueTodos = todoScheduler.getDueTodos(context);

    let response = `Due Todos (${dueTodos.length})\n`;
    response += `======================\n\n`;

    if (dueTodos.length === 0) {
      response += 'No todos due.\n';
    } else {
      for (const schedule of dueTodos) {
        response += `[${schedule.priority.toUpperCase()}] ${schedule.todo.id}\n`;
        response += `  Description: ${schedule.todo.description}\n`;
        response += `  Trigger: ${schedule.trigger}\n`;
        if (schedule.dependencies.length > 0) {
          response += `  Dependencies: ${schedule.dependencies.join(', ')}\n`;
        }
        response += '\n';
      }
    }

    return {
      content: [{ type: 'text', text: response }],
    };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Error getting due todos: ${error.message}` }],
    };
  }
}

/**
 * Complete a todo
 */
export async function complete_todo_handler(args) {
  const { todoId } = args;

  if (!todoId) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'todoId is required' }],
    };
  }

  try {
    const { todoScheduler } = getAuditSystem();
    todoScheduler.completeTodo(todoId);

    return {
      content: [{ type: 'text', text: `Todo "${todoId}" marked as completed.` }],
    };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Error completing todo: ${error.message}` }],
    };
  }
}

/**
 * Get all todo schedules
 */
export async function get_todo_schedules_handler(args) {
  try {
    const { todoScheduler } = getAuditSystem();
    const schedules = todoScheduler.getSchedules();

    let response = `All Todo Schedules (${schedules.length})\n`;
    response += `===============================\n\n`;

    if (schedules.length === 0) {
      response += 'No scheduled todos.\n';
    } else {
      for (const schedule of schedules) {
        const status = schedule.completedAt ? 'COMPLETED' : 'PENDING';
        response += `[${status}] ${schedule.todo.id}\n`;
        response += `  Description: ${schedule.todo.description}\n`;
        response += `  Priority: ${schedule.priority}\n`;
        response += `  Trigger: ${schedule.trigger}\n`;
        if (schedule.completedAt) {
          response += `  Completed At: ${new Date(schedule.completedAt).toISOString()}\n`;
        }
        response += '\n';
      }
    }

    return {
      content: [{ type: 'text', text: response }],
    };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Error getting todo schedules: ${error.message}` }],
    };
  }
}

/**
 * Clear completed todos
 */
export async function clear_completed_todos_handler(args) {
  try {
    const { todoScheduler } = getAuditSystem();
    const beforeCount = todoScheduler.getSchedules().length;
    todoScheduler.clearCompleted();
    const afterCount = todoScheduler.getSchedules().length;
    const cleared = beforeCount - afterCount;

    return {
      content: [{ type: 'text', text: `Cleared ${cleared} completed todos.` }],
    };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Error clearing completed todos: ${error.message}` }],
    };
  }
}

/**
 * Audit directory structure
 */
export async function audit_directory_structure_handler(args) {
  try {
    const { preWorkAuditor } = getAuditSystem();
    const issues = preWorkAuditor.auditDirectoryStructure();

    let response = `Directory Structure Audit\n`;
    response += `=========================\n\n`;
    response += `Issues Found: ${issues.length}\n\n`;

    if (issues.length === 0) {
      response += 'Directory structure follows professional standards.\n';
    } else {
      for (const issue of issues) {
        response += `[${issue.severity.toUpperCase()}] ${issue.description}\n`;
        if (issue.details) {
          response += `  Details: ${JSON.stringify(issue.details)}\n`;
        }
        if (issue.suggestion) {
          response += `  Suggestion: ${issue.suggestion}\n`;
        }
        response += '\n';
      }
    }

    return {
      content: [{ type: 'text', text: response }],
    };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Error auditing directory structure: ${error.message}` }],
    };
  }
}

/**
 * Dispatcher: audit swiss-army-knife handler
 * Routes to appropriate handler based on operation parameter
 */
export async function audit_handler(params) {
  const { operation, taskDescription, todo, todoId, directory } = params;

  if (!operation) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'operation parameter is required' }],
    };
  }

  switch (operation) {
    case 'pre_work':
      return await pre_work_audit_handler({ taskDescription });
    case 'status':
      return await get_audit_issues_handler(params);
    case 'issues':
      return await get_audit_issues_handler(params);
    case 'schedule_todo':
      return await schedule_todo_handler({ todo });
    case 'due_todos':
      return await get_due_todos_handler(params);
    case 'complete_todo':
      return await complete_todo_handler({ todoId });
    case 'todo_schedules':
      return await get_todo_schedules_handler(params);
    case 'clear_completed':
      return await clear_completed_todos_handler(params);
    case 'audit_directory':
      return await audit_directory_structure_handler({ directory });
    default:
      return {
        isError: true,
        content: [{ type: 'text', text: `Unknown operation: ${operation}` }],
      };
  }
}

export const auditHandlers = {
  audit: audit_handler,
  pre_work_audit: pre_work_audit_handler,
  get_audit_issues: get_audit_issues_handler,
  clear_audit_issues: clear_audit_issues_handler,
  schedule_todo: schedule_todo_handler,
  get_due_todos: get_due_todos_handler,
  complete_todo: complete_todo_handler,
  get_todo_schedules: get_todo_schedules_handler,
  clear_completed_todos: clear_completed_todos_handler,
  audit_directory_structure: audit_directory_structure_handler,
};
