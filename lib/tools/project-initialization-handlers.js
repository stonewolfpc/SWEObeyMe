/**
 * Project Initialization Handlers
 * Handlers for project scanning and initialization workflow
 */

import { initializeInitializationWorkflow, getInitializationWorkflow } from '../project-initialization-workflow.js';

/**
 * Run project initialization workflow
 */
export async function runInitializationWorkflow(args) {
  try {
    const workflow = initializeInitializationWorkflow(process.cwd());
    const result = await workflow.run();

    if (result.status === 'awaiting_approval') {
      return {
        content: [{ type: 'text', text: result.formattedReport }],
      };
    } else if (result.status === 'already_approved') {
      return {
        content: [{ type: 'text', text: result.message }],
      };
    } else if (result.status === 'error') {
      return {
        isError: true,
        content: [{ type: 'text', text: `Initialization failed: ${result.error}` }],
      };
    }
  } catch (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to run initialization workflow: ${error.message}` }],
    };
  }
}

/**
 * Grant approval to proceed with task
 */
export async function grantProjectApproval(args) {
  try {
    const workflow = getInitializationWorkflow();
    if (!workflow) {
      return {
        isError: true,
        content: [{ type: 'text', text: 'No initialization workflow running. Use run_initialization_workflow first.' }],
      };
    }

    const result = await workflow.grantApproval();

    let output = '✅ APPROVAL GRANTED\n\n';
    output += result.message + '\n';
    output += 'SWEObeyMe will now proceed with the requested task.\n';

    return {
      content: [{ type: 'text', text: output }],
    };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to grant approval: ${error.message}` }],
    };
  }
}

/**
 * Check if project needs scan
 */
export async function checkProjectScanNeeded(args) {
  try {
    const workflow = initializeInitializationWorkflow(process.cwd());
    const detection = await workflow.detectNewProject();

    let output = 'Project Scan Status:\n\n';
    output += `Needs Scan: ${detection.needsScan ? 'YES' : 'NO'}\n`;
    output += `Has project_map.json: ${detection.hasProjectMap ? 'YES' : 'NO'}\n`;
    output += `Has .sweobeyme-init-state: ${detection.hasState ? 'YES' : 'NO'}\n`;

    if (detection.lastScanTime) {
      output += `Last Scan: ${detection.lastScanTime}\n`;
    }

    if (detection.needsScan) {
      output += '\n⚠️ Project scan is required before proceeding with any task.\n';
      output += 'Use `run_initialization_workflow` to scan the project.\n';
    } else {
      output += '\n✅ Project has been scanned and is ready for tasks.\n';
    }

    return {
      content: [{ type: 'text', text: output }],
    };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to check scan status: ${error.message}` }],
    };
  }
}

/**
 * Get project health report
 */
export async function getProjectHealthReport(args) {
  try {
    const workflow = getInitializationWorkflow();
    if (!workflow) {
      return {
        isError: true,
        content: [{ type: 'text', text: 'No initialization workflow running. Use run_initialization_workflow first.' }],
      };
    }

    const state = workflow.state;

    if (!state.reportGenerated) {
      return {
        isError: true,
        content: [{ type: 'text', text: 'No report generated yet. Use run_initialization_workflow first.' }],
      };
    }

    // Regenerate report
    const scanner = workflow.scanner || (await workflow.performScan());
    const report = await workflow.generateReport(scanner);

    return {
      content: [{ type: 'text', text: workflow.formatReport(report) }],
    };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to get health report: ${error.message}` }],
    };
  }
}

/**
 * Force rescan project
 */
export async function forceRescanProject(args) {
  try {
    const workflow = initializeInitializationWorkflow(process.cwd());

    // Reset state
    workflow.state.scanned = false;
    workflow.state.reportGenerated = false;
    workflow.state.userApproved = false;
    await workflow.saveState();

    // Run workflow
    const result = await workflow.run();

    if (result.status === 'awaiting_approval') {
      return {
        content: [{ type: 'text', text: 'Project rescan complete.\n\n' + result.formattedReport }],
      };
    } else {
      return {
        content: [{ type: 'text', text: 'Project rescan complete.' }],
      };
    }
  } catch (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to rescan project: ${error.message}` }],
    };
  }
}

export const projectInitializationHandlers = {
  run_initialization_workflow: runInitializationWorkflow,
  grant_project_approval: grantProjectApproval,
  check_project_scan_needed: checkProjectScanNeeded,
  get_project_health_report: getProjectHealthReport,
  force_rescan_project: forceRescanProject,
};
