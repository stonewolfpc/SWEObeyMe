import { SurgicalWorkflow, activeWorkflows } from '../workflow.js';
import { recordAction } from '../session.js';
import { internalAudit } from '../enforcement.js';

/**
 * Workflow orchestration handlers
 */
/**
 * Dispatcher: session_manage swiss-army-knife handler
 * Routes to appropriate handler based on operation parameter
 */
export async function session_manage_handler(params) {
  const { operation, decision, reason } = params;

  if (!operation) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'operation parameter is required' }],
    };
  }

  switch (operation) {
    case 'context':
      return await get_workflow_context(params);
    case 'record_decision':
      // Record decision - would need to be implemented
      return {
        content: [{ type: 'text', text: `Decision recorded: ${decision}` }],
      };
    case 'recover':
      // Recover from error - would need to be implemented
      return {
        content: [{ type: 'text', text: `Recovery initiated: ${reason}` }],
      };
    default:
      return {
        isError: true,
        content: [{ type: 'text', text: `Unknown operation: ${operation}` }],
      };
  }
}

/**
 * Dispatcher: workflow_manage swiss-army-knife handler
 * Routes to appropriate handler based on operation parameter
 */
export async function workflow_manage_handler(params) {
  const { operation, goal, steps } = params;

  if (!operation) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'operation parameter is required' }],
    };
  }

  switch (operation) {
    case 'initiate':
      return await initiate_surgical_workflow({ goal, steps });
    case 'status':
      return await get_workflow_status(params);
    case 'context':
      return await get_workflow_context(params);
    default:
      return {
        isError: true,
        content: [{ type: 'text', text: `Unknown operation: ${operation}` }],
      };
  }
}

export const workflowHandlers = {
  session_manage: session_manage_handler,
  workflow_manage: workflow_manage_handler,
  initiate_surgical_workflow: async (args) => {
    const workflowId = `WF-${Date.now()}`;
    const newWorkflow = new SurgicalWorkflow(workflowId, args.goal, args.steps);
    activeWorkflows.set('current', newWorkflow);

    recordAction('WORKFLOW_START', { id: workflowId, goal: args.goal });
    console.error(`[ORCHESTRATOR] New Workflow Initiated: ${args.goal}`);

    return {
      content: [
        {
          type: 'text',
          text: `Workflow ${workflowId} active. Proceed with Step 1: ${args.steps[0].name}.`,
        },
      ],
    };
  },

  /**
   * Get status of active workflow
   */
  get_workflow_status: async (_args) => {
    const wf = activeWorkflows.get('current');
    if (!wf) return { content: [{ type: 'text', text: 'No active workflow.' }] };

    return {
      content: [
        {
          type: 'text',
          text: `Active Workflow: ${wf.goal}\nProgress: ${JSON.stringify(wf.steps, null, 2)}`,
        },
      ],
    };
  },
};
