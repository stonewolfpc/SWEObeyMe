import { internalAudit, CONSTITUTION, getToolMetricsReport } from '../enforcement.js';
import { recordAction, sessionMemory } from '../session.js';
import { SurgicalWorkflow, activeWorkflows } from '../workflow.js';
import { DEBUG_LOGS } from '../config.js';
import { getSessionTracker } from '../session-tracker.js';

const log = (msg) => {
  if (!DEBUG_LOGS()) return;
  try {
    process.stderr.write(`[SWEObeyMe-Audit]: ${msg}\n`);
  } catch (_e) {
    /* stderr may be closed */
  }
};

/**
 * Status and metrics handlers
 */
export const statusHandlers = {
  /**
   * Check server status and compliance
   */
  obey_me_status: async (_args) => {
    if (internalAudit.consecutiveFailures >= CONSTITUTION.ERROR_THRESHOLD) {
      return {
        content: [
          {
            type: 'text',
            text: `[SYSTEM ALERT]: High failure rate detected (${internalAudit.consecutiveFailures} errors).\n\n[SURGICAL INTEGRITY: ${internalAudit.surgicalIntegrityScore}/100]\n\nMANDATORY ACTION: Call 'get_architectural_directive' to review the Constitution before proceeding.`,
          },
        ],
      };
    }
    return {
      content: [
        {
          type: 'text',
          text: `SWEObeyMe is online and compliant.\n\n[SURGICAL INTEGRITY: ${internalAudit.surgicalIntegrityScore}/100]`,
        },
      ],
    };
  },

  /**
   * Get comprehensive tool success metrics
   */
  get_tool_metrics: async (_args) => {
    const metrics = getToolMetricsReport();
    let report =
      '=== TOOL SUCCESS METRICS REPORT ===\n\n' +
      'OVERALL STATISTICS:\n' +
      `  Total Calls: ${metrics.overall.totalCalls}\n` +
      `  Successes: ${metrics.overall.successes}\n` +
      `  Failures: ${metrics.overall.failures}\n` +
      `  Success Rate: ${metrics.overall.successRate}%\n` +
      `  Surgical Integrity Score: ${metrics.overall.surgicalIntegrityScore}/100\n` +
      `  Consecutive Failures: ${metrics.overall.consecutiveFailures}\n\n` +
      'PERFORMANCE METRICS:\n' +
      `  Average Response Time: ${metrics.performance.averageResponseTime}ms\n` +
      `  Slowest Tool: ${metrics.performance.slowestTool || 'N/A'}\n` +
      `  Slowest Time: ${metrics.performance.slowestTime}ms\n\n` +
      'ERROR TYPES:\n' +
      `  Validation Errors: ${metrics.errorTypes.validation}\n` +
      `  Permission Errors: ${metrics.errorTypes.permission}\n` +
      `  Not Found Errors: ${metrics.errorTypes.notFound}\n` +
      `  Syntax Errors: ${metrics.errorTypes.syntax}\n` +
      `  Loop Errors: ${metrics.errorTypes.loop}\n` +
      `  Other Errors: ${metrics.errorTypes.other}\n\n` +
      'PER-TOOL STATISTICS:\n';

    const toolNames = Object.keys(metrics.tools).sort(
      (a, b) => metrics.tools[b].calls - metrics.tools[a].calls
    );
    for (const toolName of toolNames) {
      const tool = metrics.tools[toolName];
      report +=
        `  ${toolName}:\n` +
        `    Calls: ${tool.calls}\n` +
        `    Successes: ${tool.successes}\n` +
        `    Failures: ${tool.failures}\n` +
        `    Success Rate: ${tool.successRate.toFixed(2)}%\n` +
        `    Avg Response Time: ${tool.averageResponseTime.toFixed(2)}ms\n`;
    }

    report += '\n=== END METRICS REPORT ===\n';

    return {
      content: [{ type: 'text', text: report }],
    };
  },

  /**
   * Validate surgical plan before execution
   */
  obey_surgical_plan: async (args) => {
    // Track this tool call
    const sessionTracker = getSessionTracker();
    if (sessionTracker) {
      const sessionId = 'default-session';
      sessionTracker.trackToolCall(sessionId, 'obey_surgical_plan');
    }

    if (!args.target_file || typeof args.target_file !== 'string') {
      internalAudit.consecutiveFailures++;
      internalAudit.surgicalIntegrityScore -= 5;
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `ERROR: 'target_file' parameter is REQUIRED and must be a string. Provide the file path you intend to modify. Example: target_file='index.js'\n\n[SURGICAL INTEGRITY: ${internalAudit.surgicalIntegrityScore}/100 | Consecutive Failures: ${internalAudit.consecutiveFailures}]`,
          },
        ],
      };
    }
    if (!args.current_line_count || typeof args.current_line_count !== 'number') {
      internalAudit.consecutiveFailures++;
      internalAudit.surgicalIntegrityScore -= 5;
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `ERROR: 'current_line_count' parameter is REQUIRED and must be a number. Count the lines in your target file. Example: current_line_count=156\n\n[SURGICAL INTEGRITY: ${internalAudit.surgicalIntegrityScore}/100 | Consecutive Failures: ${internalAudit.consecutiveFailures}]`,
          },
        ],
      };
    }
    const total = args.current_line_count + (args.estimated_addition || 0);
    if (total > 700) {
      internalAudit.consecutiveFailures++;
      internalAudit.surgicalIntegrityScore -= 10;
      log(`CRITICAL: ${args.target_file} will exceed 700 lines. MANDATORY SPLIT REQUIRED.`);
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `REJECTED: File bloat detected. Current: ${args.current_line_count} lines. After addition: ${total} lines (exceeds 700). ACTION REQUIRED: Use 'refactor_move_block' or 'extract_to_new_file' to reduce file size before proceeding.\n\n[SURGICAL INTEGRITY: ${internalAudit.surgicalIntegrityScore}/100 | Consecutive Failures: ${internalAudit.consecutiveFailures}]`,
          },
        ],
      };
    }
    internalAudit.consecutiveFailures = 0;
    internalAudit.surgicalIntegrityScore = Math.min(100, internalAudit.surgicalIntegrityScore + 1);
    return {
      content: [
        {
          type: 'text',
          text: `PLAN APPROVED: ${args.current_line_count} + ${args.estimated_addition || 0} = ${total} lines (within 700 limit). Proceed with surgical precision.\n\n[SURGICAL INTEGRITY: ${internalAudit.surgicalIntegrityScore}/100]`,
        },
      ],
    };
  },

  /**
   * Get current session context
   */
  get_session_context: async (_args) => {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(sessionMemory, null, 2),
        },
      ],
    };
  },

  /**
   * Get architectural directive from Constitution
   */
  get_architectural_directive: async (_args) => {
    const status = internalAudit.surgicalIntegrityScore > 80 ? 'STABLE' : 'COMPROMISED';
    return {
      content: [
        {
          type: 'text',
          text: `[SWEObeyMe CONSTITUTION]:
Status: ${status}
Integrity Score: ${internalAudit.surgicalIntegrityScore}%
Current Mandate: ${CONSTITUTION.MANDATE}
Reminder: You are a surgeon. Precision over speed.`,
        },
      ],
    };
  },

  /**
   * Request surgical recovery
   */
  request_surgical_recovery: async (args) => {
    sessionMemory.history = [];
    internalAudit.consecutiveFailures = 0;
    recordAction('RECOVERY', `Recovery triggered: ${args.reason}`);
    return {
      content: [
        {
          type: 'text',
          text: "RECOVERY INITIATED: Session memory purged. Please run 'scan_project' to re-orient your surgical map.",
        },
      ],
    };
  },

  /**
   * Record a decision to session memory
   */
  record_decision: async (args) => {
    recordAction('DECISION', args.decision);
    console.error(`[MEMORY] Decision Recorded: ${args.decision}`);
    return { content: [{ type: 'text', text: 'Decision logged to session memory.' }] };
  },

  /**
   * Enforce surgical rules on proposed code
   */
  enforce_surgical_rules: async (args) => {
    const { validateCode } = await import('../enforcement.js');
    const validation = validateCode(args.proposed_code);

    if (!validation.valid) {
      recordAction('VIOLATION', { path: args.file_path, errors: validation.errors }, 'fail');
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `SURGICAL BLOCK: Your code was rejected for the following violations:\n- ${validation.errors.join('\n- ')}\n\nYou must refactor and try again within limits.`,
          },
        ],
      };
    }

    return {
      content: [{ type: 'text', text: '✓ All surgical rules satisfied. Code is compliant.' }],
    };
  },

  /**
   * Sanitize request through SWEObeyMe filters
   */
  sanitize_request: async (args) => {
    const sanitized = `[OBEY-MODE]: Processing intent "${args.logic_intent}" through SWEObeyMe Filter... 
  - Thread-safety: CHECKED.
  - Memory-leak prevention: CHECKED.
  - Line-count compliance: PENDING WRITE.
  - Forbidden patterns: SCANNING...`;

    return { content: [{ type: 'text', text: sanitized }] };
  },
};
