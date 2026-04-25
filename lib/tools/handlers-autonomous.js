/**
 * Autonomous Execution Handlers - "Anti-Vibe-Coder / 3AM Finish This While I'm Gone" Upgrade
 *
 * MCP tools for controlling autonomous execution mode
 */

import { AutonomousExecutionEngine } from '../autonomous-execution.js';
import { ENABLE_AUTONOMOUS_EXECUTION, AUTONOMOUS_EXECUTION_PROFESSIONAL_ONLY } from '../config.js';

// Global execution engine instance
let executionEngine = null;

/**
 * Get or create execution engine instance
 */
function getExecutionEngine(workspacePath) {
  if (!executionEngine) {
    executionEngine = new AutonomousExecutionEngine(workspacePath);
  }
  return executionEngine;
}

/**
 * Autonomous execution handlers
 */
export const autonomousHandlers = {
  /**
   * Process a prompt and generate/execute task plan
   * This is the main entry point for autonomous execution
   */
  autonomous_execute: async (args) => {
    const { prompt, context = {}, workspace_path } = args;

    // Check if autonomous execution is enabled
    if (!ENABLE_AUTONOMOUS_EXECUTION()) {
      return {
        isError: true,
        content: [
          { type: 'text', text: 'Autonomous execution is disabled. Enable it in configuration.' },
        ],
      };
    }

    // Check if professional only mode is enabled
    if (AUTONOMOUS_EXECUTION_PROFESSIONAL_ONLY()) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: 'Autonomous execution is in PROFESSIONAL ONLY mode. Disable "autonomousExecutionProfessionalOnly" in configuration to enable.',
          },
        ],
      };
    }

    try {
      const engine = getExecutionEngine(workspace_path || process.cwd());
      await engine.initialize();

      const result = await engine.processPrompt(prompt, context);

      if (result.mode === 'autonomous') {
        return {
          content: [
            {
              type: 'text',
              text: `Autonomous execution started\n\nGoal: ${result.plan.goal}\nTasks: ${result.plan.tasks.length}\nPhases: ${result.plan.phases.length}\n\nProgress: ${result.executionResult.completedTasks}/${result.executionResult.totalTasks} tasks completed`,
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: 'text',
              text: `Task plan generated (interactive mode)\n\nGoal: ${result.plan.goal}\nTasks: ${result.plan.tasks.length}\nPhases: ${result.plan.phases.length}\n\n${result.message}`,
            },
          ],
        };
      }
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Autonomous execution failed: ${error.message}` }],
      };
    }
  },

  /**
   * Get current autonomous execution status
   */
  autonomous_status: async (args) => {
    const { workspace_path } = args;

    try {
      const engine = getExecutionEngine(workspace_path || process.cwd());
      await engine.initialize();

      const status = engine.getExecutionStatus();

      if (status.active) {
        return {
          content: [
            {
              type: 'text',
              text: `Autonomous Execution Active\n\nPlan ID: ${status.planId}\nGoal: ${status.goal}\nProgress: ${status.progress.toFixed(1)}%\nCompleted: ${status.completed}/${status.total}\nMode: ${status.isAutonomous ? 'Autonomous' : 'Interactive'}\nCurrent Task: ${status.currentTask?.description || 'None'}`,
            },
          ],
        };
      } else {
        return {
          content: [{ type: 'text', text: status.message }],
        };
      }
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Failed to get status: ${error.message}` }],
      };
    }
  },

  /**
   * Pause autonomous execution
   */
  autonomous_pause: async (args) => {
    const { workspace_path } = args;

    try {
      const engine = getExecutionEngine(workspace_path || process.cwd());
      engine.pause();

      return {
        content: [{ type: 'text', text: 'Autonomous execution paused' }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Failed to pause: ${error.message}` }],
      };
    }
  },

  /**
   * Resume autonomous execution
   */
  autonomous_resume: async (args) => {
    const { workspace_path } = args;

    try {
      const engine = getExecutionEngine(workspace_path || process.cwd());
      const result = await engine.resume();

      return {
        content: [
          {
            type: 'text',
            text: `Autonomous execution resumed\nCompleted: ${result.completedTasks.length}/${result.totalTasks} tasks`,
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Failed to resume: ${error.message}` }],
      };
    }
  },

  /**
   * Cancel autonomous execution
   */
  autonomous_cancel: async (args) => {
    const { workspace_path } = args;

    try {
      const engine = getExecutionEngine(workspace_path || process.cwd());
      await engine.cancel();

      return {
        content: [{ type: 'text', text: 'Autonomous execution cancelled' }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Failed to cancel: ${error.message}` }],
      };
    }
  },

  /**
   * Generate task plan only (without execution)
   */
  autonomous_plan: async (args) => {
    const { prompt, context = {}, workspace_path } = args;

    try {
      const engine = getExecutionEngine(workspace_path || process.cwd());
      await engine.initialize();

      const result = await engine.generatePlanOnly(prompt, context);

      return {
        content: [
          {
            type: 'text',
            text: `Task Plan Generated\n\nGoal: ${result.plan.goal}\nComplexity: ${result.plan.metadata.complexity}\nRisks: ${result.plan.metadata.risks.length}\nPrerequisites: ${result.plan.metadata.prerequisites.length}\n\nPhases:\n${result.plan.phases.map((p) => `- ${p.name}: ${p.tasks.length} tasks`).join('\n')}\n\nTasks:\n${result.plan.tasks.map((t, i) => `${i + 1}. [${t.status.toUpperCase()}] ${t.description} (${t.priority})`).join('\n')}`,
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Failed to generate plan: ${error.message}` }],
      };
    }
  },

  /**
   * Enable autonomous mode
   */
  autonomous_enable: async (args) => {
    const { workspace_path } = args;

    // Check if autonomous execution is enabled
    if (!ENABLE_AUTONOMOUS_EXECUTION()) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: 'Autonomous execution is disabled in configuration. Enable "enableAutonomousExecution" to use this feature.',
          },
        ],
      };
    }

    // Check if professional only mode is enabled
    if (AUTONOMOUS_EXECUTION_PROFESSIONAL_ONLY()) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: 'Autonomous execution is in PROFESSIONAL ONLY mode. Disable "autonomousExecutionProfessionalOnly" in configuration to enable.',
          },
        ],
      };
    }

    try {
      const engine = getExecutionEngine(workspace_path || process.cwd());
      engine.enableAutonomousMode();

      return {
        content: [{ type: 'text', text: 'Autonomous mode enabled' }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Failed to enable autonomous mode: ${error.message}` }],
      };
    }
  },

  /**
   * Disable autonomous mode
   */
  autonomous_disable: async (args) => {
    const { workspace_path } = args;

    try {
      const engine = getExecutionEngine(workspace_path || process.cwd());
      engine.disableAutonomousMode();

      return {
        content: [{ type: 'text', text: 'Autonomous mode disabled' }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Failed to disable autonomous mode: ${error.message}` }],
      };
    }
  },
};
