/**
 * Diagnostics Tool Handlers
 * Handlers for exposing server diagnostics and validation status to Windsurf UI
 */

import { getServerDiagnostics } from '../../lib/server-diagnostics.js';
import { internalAudit } from '../../lib/enforcement.js';

/**
 * Diagnostics handlers
 */
export const diagnosticsHandlers = {
  /**
   * Get server diagnostics
   */
  get_server_diagnostics: async (args) => {
    const diagnostics = getServerDiagnostics();
    const runChecks = args?.runChecks === true;

    let results;
    if (runChecks) {
      results = await diagnostics.runDiagnostics();
    } else {
      // Return cached results or run fresh if no cache
      if (!diagnostics.lastResults) {
        results = await diagnostics.runDiagnostics();
        diagnostics.lastResults = results;
      } else {
        results = diagnostics.lastResults;
      }
    }

    let message = `=== SERVER DIAGNOSTICS ===\n`;
    message += `Timestamp: ${results.timestamp}\n`;
    message += `Startup Time: ${results.startupTime}ms\n`;
    message += `Overall Status: ${results.summary.overall.toUpperCase()}\n`;
    message += `Checks: ${results.summary.total} (Pass: ${results.summary.pass}, Fail: ${results.summary.fail}, Warn: ${results.summary.warn})\n\n`;

    message += `Component Status:\n`;
    results.checks.forEach((check) => {
      const status = check.status.toUpperCase();
      const icon = status === 'PASS' ? '✓' : status === 'FAIL' ? '✗' : '⚠';
      message += `  ${icon} ${check.name}: ${check.message}\n`;
      if (check.error) {
        message += `    Error: ${check.error}\n`;
      }
    });

    message += `\n=== END DIAGNOSTICS ===`;

    return {
      content: [{ type: 'text', text: message }],
      _diagnostics: results, // Include raw data for UI parsing
    };
  },

  /**
   * Get validation status
   */
  get_validation_status: async () => {
    let message = `=== VALIDATION STATUS ===\n`;
    message += `Surgical Integrity Score: ${internalAudit.surgicalIntegrityScore}/100\n`;
    message += `Consecutive Failures: ${internalAudit.consecutiveFailures}\n`;
    message += `Constitution Threshold: ${internalAudit.consecutiveFailures >= 3 ? 'TRIGGERED' : 'OK'}\n\n`;

    if (internalAudit.recentViolations && internalAudit.recentViolations.length > 0) {
      message += `Recent Violations (last 10):\n`;
      internalAudit.recentViolations.slice(-10).forEach((violation, i) => {
        message += `  ${i + 1}. ${violation.type}: ${violation.message}\n`;
      });
    } else {
      message += `Recent Violations: None\n`;
    }

    message += `\n=== END STATUS ===`;

    return {
      content: [{ type: 'text', text: message }],
      _validation: {
        integrityScore: internalAudit.surgicalIntegrityScore,
        consecutiveFailures: internalAudit.consecutiveFailures,
        recentViolations: internalAudit.recentViolations || [],
      },
    };
  },
};
