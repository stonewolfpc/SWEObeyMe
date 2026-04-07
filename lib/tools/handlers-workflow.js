import { SurgicalWorkflow, activeWorkflows } from '../workflow.js';
import { recordAction } from '../session.js';
import { internalAudit } from '../enforcement.js';

/**
 * Workflow orchestration handlers
 */
export const workflowHandlers = {
  /**
   * Initiate a multi-step surgical workflow
   */
  initiate_surgical_workflow: async args => {
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
  get_workflow_status: async _args => {
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
