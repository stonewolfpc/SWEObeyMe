import { contextHandlers } from './context-handlers.js';
import { validationHandlers } from './validation-handlers.js';
import { safetyHandlers } from './safety-handlers.js';
import { internalAudit } from '../enforcement.js';
import { DEBUG_LOGS } from '../config.js';
import { getTriggerDetection } from '../prompts/trigger-detection.js';
import { getPromptRegistry } from '../prompts/registry.js';
import { getSessionTracker } from '../session-tracker.js';

const log = msg => {
  if (!DEBUG_LOGS()) return;
  process.stderr.write(`[SWEObeyMe-Audit]: ${msg}\n`);
};

/**
 * Preflight validation handlers
 */
export const preflightHandlers = {
  /**
   * Comprehensive preflight validation before applying changes
   * Added overall timeout protection to prevent hangs on aggregate operations
   */
  preflight_change: async args => {
    // Overall timeout for preflight validation (30 seconds)
    const preflightTimeout = 30000;
    const startTime = Date.now();
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`Preflight validation timeout after ${preflightTimeout}ms`)), preflightTimeout)
    );
    
    // Track this tool call
    const sessionTracker = getSessionTracker();
    if (sessionTracker) {
      const sessionId = 'default-session';
      sessionTracker.trackToolCall(sessionId, 'preflight_change');
    }
    
    if (!args.path || typeof args.path !== 'string') {
      internalAudit.consecutiveFailures++;
      internalAudit.surgicalIntegrityScore -= 5;
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `ERROR: 'path' parameter is REQUIRED and must be a string. Provide the file path you want to validate. Example: path='index.js'\n\n[SURGICAL INTEGRITY: ${internalAudit.surgicalIntegrityScore}/100 | Consecutive Failures: ${internalAudit.consecutiveFailures}]`,
          },
        ],
      };
    }
    if (!args.content || typeof args.content !== 'string') {
      internalAudit.consecutiveFailures++;
      internalAudit.surgicalIntegrityScore -= 5;
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `ERROR: 'content' parameter is REQUIRED and must be a string. Provide the proposed file content. Example: content='const x = 1;'\n\n[SURGICAL INTEGRITY: ${internalAudit.surgicalIntegrityScore}/100 | Consecutive Failures: ${internalAudit.consecutiveFailures}]`,
          },
        ],
      };
    }

    const report = {
      path: args.path,
      changes: args.changes || 'No description provided',
      steps: [],
      overall: { valid: true, errors: [], warnings: [] },
    };

    // Wrap entire preflight in timeout protection
    const preflightPromise = (async () => {
      try {
        report.steps.push({ name: 'get_file_context', status: 'running' });
        try {
          const contextResult = await contextHandlers.get_file_context({ path: args.path });
          report.steps[0].status = 'passed';
          report.steps[0].result = 'File context retrieved successfully';
        } catch (error) {
          report.steps[0].status = 'warning';
          report.steps[0].result = `Context retrieval warning: ${error.message}`;
          report.overall.warnings.push(`File context warning: ${error.message}`);
        }

        report.steps.push({ name: 'analyze_change_impact', status: 'running' });
        try {
          const impactResult = await contextHandlers.analyze_change_impact({
            path: args.path,
            changes: args.changes || 'No description provided',
          });
          report.steps[1].status = 'passed';
          report.steps[1].result = 'Change impact analyzed';
        } catch (error) {
          report.steps[1].status = 'warning';
          report.steps[1].result = `Impact analysis warning: ${error.message}`;
          report.overall.warnings.push(`Impact analysis warning: ${error.message}`);
        }

        report.steps.push({ name: 'verify_imports', status: 'running' });
        try {
          const importResult = await validationHandlers.verify_imports({
            path: args.path,
            content: args.content,
          });
          if (importResult.isError) {
            report.steps[2].status = 'failed';
            report.steps[2].result = importResult.content[0].text;
            report.overall.valid = false;
            report.overall.errors.push('Import validation failed');
          } else {
            report.steps[2].status = 'passed';
            report.steps[2].result = 'Imports validated';
          }
        } catch (error) {
          report.steps[2].status = 'warning';
          report.steps[2].result = `Import check warning: ${error.message}`;
          report.overall.warnings.push(`Import check warning: ${error.message}`);
        }

        report.steps.push({ name: 'check_test_coverage', status: 'running' });
        try {
          const coverageResult = await safetyHandlers.check_test_coverage({ path: args.path });
          report.steps[3].status = 'passed';
          report.steps[3].result = 'Test coverage checked';
          if (coverageResult.content) {
            const coverageData = JSON.parse(coverageResult.content[0].text);
            if (coverageData.coverage < 50) {
              report.overall.warnings.push(`Low test coverage: ${coverageData.coverage}%`);
            }
          }
        } catch (error) {
          report.steps[3].status = 'warning';
          report.steps[3].result = `Coverage check warning: ${error.message}`;
          report.overall.warnings.push(`Coverage check warning: ${error.message}`);
        }

        report.steps.push({ name: 'dry_run_write_file', status: 'running' });
        try {
          const dryRunResult = await validationHandlers.dry_run_write_file({
            path: args.path,
            content: args.content,
          });
          if (dryRunResult.isError) {
            report.steps[4].status = 'failed';
            report.steps[4].result = dryRunResult.content[0].text;
            report.overall.valid = false;
            report.overall.errors.push('Dry run validation failed');
          } else {
            report.steps[4].status = 'passed';
            report.steps[4].result = 'Dry run successful';
          }
        } catch (error) {
          report.steps[4].status = 'failed';
          report.steps[4].result = `Dry run error: ${error.message}`;
          report.overall.valid = false;
          report.overall.errors.push(`Dry run error: ${error.message}`);
        }

        // Step 6: Prompt trigger detection for architectural guidance
        report.steps.push({ name: 'prompt_trigger_detection', status: 'running' });
        let promptRecommendations = [];
        try {
          const triggerDetection = await getTriggerDetection();
          const triggerContext = {
            violations: report.overall.errors.map(e => ({ rule: e, category: 'preflight' })),
            validationFailed: !report.overall.valid,
            fileOperations: [{ lineCount: args.content.split('\n').length }],
          };
          
          const triggerResult = await triggerDetection.analyze(triggerContext);
          if (triggerResult.hasTriggers()) {
            promptRecommendations = triggerResult.getRecommendedPrompts();
            report.steps[5].status = 'passed';
            report.steps[5].result = `Triggers detected, ${promptRecommendations.length} prompts recommended`;
          } else {
            report.steps[5].status = 'passed';
            report.steps[5].result = 'No triggers detected';
          }
        } catch (error) {
          report.steps[5].status = 'warning';
          report.steps[5].result = `Trigger detection warning: ${error.message}`;
        }

        internalAudit.consecutiveFailures = 0;
        internalAudit.surgicalIntegrityScore = Math.min(100, internalAudit.surgicalIntegrityScore + 1);
        log(`Preflight validation completed for ${args.path}`);

        return {
          content: [
            {
              type: 'text',
              text: `=== PREFLIGHT VALIDATION REPORT ===\n\nFile: ${args.path}\nChanges: ${args.changes || 'No description provided'}\n\nValidation Steps:\n${report.steps.map((step, i) => `${i + 1}. ${step.name}: ${step.status.toUpperCase()} - ${step.result}`).join('\n')}\n\nOverall Status: ${report.overall.valid ? '✓ PASSED' : '✗ FAILED'}\n\n${report.overall.errors.length > 0 ? `Errors:\n${report.overall.errors.join('\n')}\n\n` : ''}${report.overall.warnings.length > 0 ? `Warnings:\n${report.overall.warnings.join('\n')}\n\n` : ''}${promptRecommendations.length > 0 ? `⚠️ ARCHITECTURAL GUIDANCE:\nThe following prompts are recommended based on detected triggers:\n${promptRecommendations.map(p => `- ${p}`).join('\n')}\n\nUse prompts/get to retrieve these prompts for architectural guidance.\n\n` : ''}=== END REPORT ===\n\n[SURGICAL INTEGRITY: ${internalAudit.surgicalIntegrityScore}/100]\n\n${report.overall.valid ? '✓ Preflight passed. You may proceed with write_file.' : '✗ Preflight failed. Address the issues above before proceeding with write_file.'}`,
            },
          ],
        };
      } catch (error) {
        internalAudit.consecutiveFailures++;
        internalAudit.surgicalIntegrityScore -= 5;
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `ERROR: Preflight validation failed for '${args.path}'. ${error.message}.\n\n[SURGICAL INTEGRITY: ${internalAudit.surgicalIntegrityScore}/100 | Consecutive Failures: ${internalAudit.consecutiveFailures}]`,
            },
          ],
        };
      }
    })();
    
    // Execute preflight with timeout protection
    return await Promise.race([preflightPromise, timeoutPromise]);
  },
};
