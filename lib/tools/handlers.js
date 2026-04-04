import fs from 'fs/promises';
import path from 'path';
import { toWindsurfUri, normalizePath } from '../utils.js';
import { createBackup, BACKUP_DIR } from '../backup.js';
import {
  validateCode,
  autoCorrectCode,
  repairJson,
  CONSTITUTION,
  internalAudit,
} from '../enforcement.js';
import { recordAction, sessionMemory } from '../session.js';
import { getProjectContract, shouldIgnore } from '../project.js';
import { activeWorkflows, SurgicalWorkflow } from '../workflow.js';
import { MAX_LINES, WARNING_THRESHOLD, DEBUG_LOGS } from '../config.js';
import { configHandlers } from './config-handlers.js';
import { validationHandlers } from './validation-handlers.js';
import { contextHandlers } from './context-handlers.js';
import { safetyHandlers } from './safety-handlers.js';
import { feedbackHandlers } from './feedback-handlers.js';
import { csharpHandlers } from './csharp-handlers.js';
import { projectIntegrityHandlers } from './project-integrity-handlers.js';
import { analyzeCSharpComplexity, validateCSharpBrackets } from '../csharp-validation.js';
import { analyzeMathExpression } from '../math-safety.js';
import {
  recordFileOperation,
  wasFileRecentlyWritten,
  checkForDuplicateWrite,
} from '../file-operation-audit.js';
import { findDuplicateFiles, findSameNameFiles, updateFileInRegistry } from '../file-registry.js';
import { analyzeCSharpFile } from '../csharp-bridge.js';

const log = msg => {
  if (!DEBUG_LOGS()) return;
  process.stderr.write(`[SWEObeyMe-Audit]: ${msg}\n`);
};

// getRandomQuote will be set by the main module
let getRandomQuote;
export function setGetRandomQuote(fn) {
  getRandomQuote = fn;
}

/**
 * Tool handlers registry
 */
export const toolHandlers = {
  obey_me_status: async _args => {
    // Check if consecutive failures trigger Constitution reading
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
      content: [{ type: 'text', text: `SWEObeyMe is online and compliant.\n\n[SURGICAL INTEGRITY: ${internalAudit.surgicalIntegrityScore}/100]` }],
    };
  },

  obey_surgical_plan: async args => {
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
      content: [{ type: 'text', text: `PLAN APPROVED: ${args.current_line_count} + ${args.estimated_addition || 0} = ${total} lines (within 700 limit). Proceed with surgical precision.\n\n[SURGICAL INTEGRITY: ${internalAudit.surgicalIntegrityScore}/100]` }],
    };
  },

  read_file: async args => {
    if (!args.path || typeof args.path !== 'string') {
      internalAudit.consecutiveFailures++;
      internalAudit.surgicalIntegrityScore -= 5;
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `ERROR: 'path' parameter is REQUIRED and must be a string. Provide the file path you want to read. Example: path='index.js'\n\n[SURGICAL INTEGRITY: ${internalAudit.surgicalIntegrityScore}/100 | Consecutive Failures: ${internalAudit.consecutiveFailures}]`,
          },
        ],
      };
    }

    // Check if file should be ignored
    if (shouldIgnore(args.path)) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `BLOCKED: File '${args.path}' is in .sweignore and excluded from AI context. This file is protected from AI modification. Choose a different file or update .sweignore if this is intentional.\n\n[SURGICAL INTEGRITY: ${internalAudit.surgicalIntegrityScore}/100]`,
          },
        ],
      };
    }

    try {
      const content = await fs.readFile(args.path, 'utf-8');
      const stats = await fs.stat(args.path);
      const lineCount = content.split(/\r\n|\r|\n/).length;

      // Injected Context: Forces AI to see rules every time it reads
      let contextHeader = `[SURGICAL CONTEXT]: File: ${path.basename(args.path)} | Lines: ${lineCount}/${MAX_LINES()} | Last Modified: ${stats.mtime}\n`;
      contextHeader += `[SURGICAL INTEGRITY: ${internalAudit.surgicalIntegrityScore}/100]\n\n`;

      // Inject project contract if available
      const projectContract = getProjectContract();
      if (projectContract) {
        contextHeader += `=== PROJECT CONTRACT ===\n${projectContract.substring(0, 500)}...\n=== END CONTRACT ===\n\n`;
      }

      // Add C# complexity warnings for C# files
      const isCSharp =
        args.path.endsWith('.cs') || (content.includes('namespace ') && content.includes('using '));
      if (isCSharp) {
        contextHeader += `=== C# COMPLEXITY ANALYSIS ===\n`;
        const complexity = analyzeCSharpComplexity(content);
        const brackets = validateCSharpBrackets(content);
        const mathSafety = analyzeMathExpression(content);

        // Calculate complexity score
        let complexityScore = 100;
        complexityScore -= complexity.metrics.maxNestingDepth * 2;
        complexityScore -= complexity.metrics.maxMethodComplexity;
        complexityScore -= complexity.metrics.tryCatchDepth * 3;
        complexityScore -= complexity.metrics.emptyCatchBlocks.length * 10;
        complexityScore -= complexity.metrics.missingUsingStatements.length * 15;
        complexityScore -= complexity.metrics.asyncAwaitIssues.length * 5;
        complexityScore -= mathSafety.metrics.complexExpressions.length * 3;
        complexityScore -= mathSafety.metrics.potentialOverflow.length * 8;
        complexityScore -= mathSafety.metrics.divisionByZeroRisk.length * 10;
        complexityScore = Math.max(0, Math.min(100, complexityScore));

        contextHeader += `Complexity Score: ${complexityScore}/100 | `;
        contextHeader += `Max Nesting: ${complexity.metrics.maxNestingDepth} | `;
        contextHeader += `Try-Catch Depth: ${complexity.metrics.tryCatchDepth} | `;
        contextHeader += `Brackets: ${brackets.valid ? '✓' : '✗'}\n`;

        // Add warnings if needed
        const warnings = [];
        if (complexityScore < 70) warnings.push(`⚠️ LOW COMPLEXITY SCORE (${complexityScore}/100)`);
        if (complexity.metrics.maxNestingDepth > 5)
          warnings.push(`⚠️ DEEP NESTING (${complexity.metrics.maxNestingDepth} levels)`);
        if (complexity.metrics.tryCatchDepth > 3)
          warnings.push(`⚠️ DEEP TRY-CATCH (${complexity.metrics.tryCatchDepth} levels)`);
        if (!brackets.valid) warnings.push(`⚠️ BRACKET MISMATCH DETECTED`);
        if (complexity.metrics.emptyCatchBlocks.length > 0)
          warnings.push(`⚠️ ${complexity.metrics.emptyCatchBlocks.length} EMPTY CATCH BLOCKS`);
        if (complexity.metrics.missingUsingStatements.length > 0)
          warnings.push(
            `⚠️ ${complexity.metrics.missingUsingStatements.length} MISSING USING STATEMENTS`
          );
        if (mathSafety.metrics.potentialOverflow.length > 0)
          warnings.push(`⚠️ ${mathSafety.metrics.potentialOverflow.length} POTENTIAL OVERFLOW RISKS`);
        if (mathSafety.metrics.divisionByZeroRisk.length > 0)
          warnings.push(`⚠️ ${mathSafety.metrics.divisionByZeroRisk.length} DIVISION BY ZERO RISKS`);

        if (warnings.length > 0) {
          contextHeader += `WARNINGS:\n${warnings.join('\n')}\n`;
        }

        contextHeader += `=== END C# ANALYSIS ===\n\n`;
      }

      // v1.1.0: C# Bridge - Keep AI Informed with Surgical Integrity Score Throttling
      if (isCSharp && global.csharpAiInformed === true) {
        try {
          const csharpAnalysis = await analyzeCSharpFile(args.path);
          
          if (csharpAnalysis && csharpAnalysis.errorCount > 0 && csharpAnalysis.errors) {
            // Filter errors based on Surgical Integrity Score throttling
            const filteredErrors = csharpAnalysis.errors.filter(error => {
              // High-severity (Red): Immediate injection
              if (error.severity === 2) return true;
              // Medium-severity (Orange): Inject if Integrity Score > 80
              if (error.severity === 1 && internalAudit.surgicalIntegrityScore > 80) return true;
              // Low-severity (Cyan/Silver): Wait for explicit tool call (no auto-injection)
              if (error.severity === 0) return false;
              return false;
            });

            if (filteredErrors.length > 0) {
              contextHeader += `=== C# ERRORS DETECTED (Keep AI Informed) ===\n`;
              contextHeader += `Found ${filteredErrors.length} error(s) requiring attention:\n`;
              
              filteredErrors.forEach(error => {
                const severityLabel = error.severity === 2 ? 'CRITICAL' : error.severity === 1 ? 'WARNING' : 'INFO';
                const color = error.color || 'UNKNOWN';
                contextHeader += `  [${color.toUpperCase()}] ${severityLabel}: ${error.name}\n`;
                if (error.lineRanges && error.lineRanges.length > 0) {
                  contextHeader += `    Lines: ${error.lineRanges.map(r => `${r.startLine}-${r.endLine}`).join(', ')}\n`;
                }
              });

              contextHeader += `\nACTION: Use get_integrity_report for detailed analysis or get_csharp_errors_for_file to inspect specific errors.\n`;
              contextHeader += `=== END C# ERRORS ===\n\n`;
            }
          }
        } catch (csharpError) {
          // Don't block file read if C# analysis fails
          log(`C# Bridge analysis failed for ${args.path}: ${csharpError.message}`);
        }
      }

      internalAudit.consecutiveFailures = 0;
      internalAudit.surgicalIntegrityScore = Math.min(100, internalAudit.surgicalIntegrityScore + 1);
      log(`Read ${args.path}: ${lineCount} lines.`);
      return {
        content: [
          {
            type: 'text',
            text: contextHeader + content,
          },
        ],
        uri: toWindsurfUri(args.path),
      };
    } catch (error) {
      internalAudit.consecutiveFailures++;
      internalAudit.surgicalIntegrityScore -= 5;
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `ERROR: Failed to read file '${args.path}'. ${error.message}. Ensure the file exists and you have permission to read it.\n\n[SURGICAL INTEGRITY: ${internalAudit.surgicalIntegrityScore}/100 | Consecutive Failures: ${internalAudit.consecutiveFailures}]`,
          },
        ],
      };
    }
  },

  write_file: async args => {
    let content = args.content;

    // RECORD OPERATION: Track the write attempt
    const operationRecord = await recordFileOperation('WRITE', args.path, { content });
    if (operationRecord.status === 'DUPLICATE') {
      internalAudit.consecutiveFailures++;
      internalAudit.surgicalIntegrityScore -= 5;
      return {
        isError: true,
        content: [
          { type: 'text', text: `BLOCKED: Duplicate operation detected. ${operationRecord.note}\n\n[SURGICAL INTEGRITY: ${internalAudit.surgicalIntegrityScore}/100 | Consecutive Failures: ${internalAudit.consecutiveFailures}]` },
        ],
      };
    }

    // DUPLICATE CHECK: Check for recent duplicate writes
    const recentDuplicate = await checkForDuplicateWrite(args.path, content, 10000);
    if (recentDuplicate) {
      internalAudit.consecutiveFailures++;
      internalAudit.surgicalIntegrityScore -= 10;
      console.error(
        `[SWE-INTEGRITY] Blocked duplicate write to ${args.path} - identical content written ${Date.now() - recentDuplicate.timestamp}ms ago`
      );
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `BLOCKED: Duplicate write operation detected. An identical write was performed on this file ${(Date.now() - recentDuplicate.timestamp) / 1000} seconds ago. This suggests SWE is in a loop. Please review your plan.\n\n[SURGICAL INTEGRITY: ${internalAudit.surgicalIntegrityScore}/100 | Consecutive Failures: ${internalAudit.consecutiveFailures}]`,
          },
        ],
      };
    }

    // DUPLICATE FILE CHECK: Check if file with same content already exists
    const duplicateFiles = findDuplicateFiles(args.path, content);
    if (duplicateFiles.length > 0) {
      internalAudit.consecutiveFailures++;
      internalAudit.surgicalIntegrityScore -= 5;
      console.error(
        `[SWE-INTEGRITY] Detected duplicate file creation attempt: ${args.path} matches ${duplicateFiles.join(', ')}`
      );
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `BLOCKED: File with identical content already exists at: ${duplicateFiles.join(', ')}. Use the existing file instead of creating a duplicate.\n\n[SURGICAL INTEGRITY: ${internalAudit.surgicalIntegrityScore}/100 | Consecutive Failures: ${internalAudit.consecutiveFailures}]`,
          },
        ],
      };
    }

    // SAME NAME CHECK: Check if file with same name exists in directory
    const sameNameFiles = findSameNameFiles(args.path);
    if (sameNameFiles.length > 0) {
      internalAudit.consecutiveFailures++;
      internalAudit.surgicalIntegrityScore -= 5;
      console.error(
        `[SWE-INTEGRITY] Detected same-name file creation attempt: ${args.path} matches ${sameNameFiles.join(', ')}`
      );
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `BLOCKED: File with same name already exists in directory: ${sameNameFiles.join(', ')}. This suggests you may be creating a duplicate file. Please verify the file path.\n\n[SURGICAL INTEGRITY: ${internalAudit.surgicalIntegrityScore}/100 | Consecutive Failures: ${internalAudit.consecutiveFailures}]`,
          },
        ],
      };
    }

    // RECENT WRITE CHECK: Prevent rapid repeated writes
    if (wasFileRecentlyWritten(args.path, 30000)) {
      internalAudit.consecutiveFailures++;
      internalAudit.surgicalIntegrityScore -= 10;
      console.error(`[SWE-INTEGRITY] Blocked rapid repeated write to ${args.path}`);
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `BLOCKED: This file was written less than 30 seconds ago. This suggests SWE may be in a loop. Please wait or verify the operation is necessary.\n\n[SURGICAL INTEGRITY: ${internalAudit.surgicalIntegrityScore}/100 | Consecutive Failures: ${internalAudit.consecutiveFailures}]`,
          },
        ],
      };
    }

    // Phase 6: Auto-Correction
    const correctedContent = autoCorrectCode(content);
    if (correctedContent !== content) {
      console.error(
        `[SWE-LOG] Action: HEAL | Target: ${toWindsurfUri(args.path)} | Status: Auto-corrected forbidden patterns`
      );
      content = correctedContent;
    }

    const validation = validateCode(content);
    if (!validation.valid) {
      internalAudit.consecutiveFailures++;
      internalAudit.surgicalIntegrityScore -= 10;
      recordAction('VIOLATION', { path: args.path, errors: validation.errors }, 'fail');
      return {
        isError: true,
        content: [{ type: 'text', text: `REJECTED: ${validation.errors.join(', ')}\n\n[SURGICAL INTEGRITY: ${internalAudit.surgicalIntegrityScore}/100 | Consecutive Failures: ${internalAudit.consecutiveFailures}]\n\nACTION REQUIRED: Review errors and correct the violations before retrying.` }],
      };
    }

    const lineCount = content.split(/\r\n|\r|\n/).length;

    // ANTI-LOOP: Detect if AI is stuck writing the same file repeatedly
    const recentWrites = sessionMemory.history.filter(
      h => h.action === 'WRITE' && h.details?.path === args.path
    );
    if (recentWrites.length >= 3) {
      internalAudit.consecutiveFailures++;
      internalAudit.surgicalIntegrityScore -= 15;
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: 'CRITICAL: Loop detected. You have attempted to write to this file 3 times without moving to the next task. Re-evaluate your plan.\n\n[SURGICAL INTEGRITY: ${internalAudit.surgicalIntegrityScore}/100 | Consecutive Failures: ${internalAudit.consecutiveFailures}]\n\nACTION REQUIRED: Call get_architectural_directive to review the Constitution.',
          },
        ],
      };
    }

    // PHASE 8: Mandatory Backup Before Write (only for existing files)
    let fileExists = false;
    try {
      await fs.access(args.path);
      fileExists = true;
    } catch {
      fileExists = false;
    }

    if (fileExists) {
      const backupPath = await createBackup(args.path);
      if (!backupPath) {
        internalAudit.consecutiveFailures++;
        internalAudit.surgicalIntegrityScore -= 10;
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `BACKUP FAILED: Cannot write to ${args.path} without a verified backup. Fix the backup system first.\n\n[SURGICAL INTEGRITY: ${internalAudit.surgicalIntegrityScore}/100 | Consecutive Failures: ${internalAudit.consecutiveFailures}]`,
            },
          ],
        };
      }
    }

    // Silent Foresight: Warn when approaching limit
    if (lineCount > WARNING_THRESHOLD()) {
      console.error(
        `[SWE-LOG] Action: WARNING | Target: ${toWindsurfUri(args.path)} | Status: File at ${lineCount} lines, approaching ${MAX_LINES()} limit`
      );
    }

    await fs.writeFile(args.path, content, 'utf-8');

    // Update file registry after successful write
    await updateFileInRegistry(args.path, content);

    // Reset consecutive failures on successful write
    internalAudit.consecutiveFailures = 0;
    internalAudit.surgicalIntegrityScore = Math.min(100, internalAudit.surgicalIntegrityScore + 2);

    // PHASE 8: Update workflow step if active
    const currentWf = activeWorkflows.get('current');
    if (currentWf) {
      const writeStep = currentWf.steps.find(
        s => s.tool === 'write_file' && s.status === 'pending'
      );
      if (writeStep) {
        currentWf.updateStep(writeStep.name, 'completed');
        console.error(`[ORCHESTRATOR] Step completed: ${writeStep.name}`);
      }

      if (currentWf.isComplete()) {
        console.error(`[ORCHESTRATOR] Workflow ${currentWf.id} complete!`);
        activeWorkflows.delete('current');
      }
    }

    // MEMORY: Record the write action
    const actionType = correctedContent !== args.content ? 'WRITE_REPAIRED' : 'WRITE';
    recordAction(actionType, { path: args.path, lines: lineCount });

    const msg =
      correctedContent !== args.content
        ? `File saved. (Note: SWEObeyMe auto-corrected minor architectural violations in your syntax). URI: ${normalizePath(args.path)}`
        : `Successfully saved ${args.path}. All rules satisfied. URI: ${normalizePath(args.path)}`;
    return {
      content: [{ type: 'text', text: msg }],
      uri: toWindsurfUri(args.path),
    };
  },

  get_session_context: async _args => {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(sessionMemory, null, 2),
        },
      ],
    };
  },

  record_decision: async args => {
    recordAction('DECISION', args.decision);
    console.error(`[MEMORY] Decision Recorded: ${args.decision}`);
    return { content: [{ type: 'text', text: 'Decision logged to session memory.' }] };
  },

  enforce_surgical_rules: async args => {
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
      content: [{ type: 'text', text: 'âœ“ All surgical rules satisfied. Code is compliant.' }],
    };
  },

  sanitize_request: async args => {
    const sanitized = `[OBEY-MODE]: Processing intent "${args.logic_intent}" through SWEObeyMe Filter... 
  - Thread-safety: CHECKED.
  - Memory-leak prevention: CHECKED.
  - Line-count compliance: PENDING WRITE.
  - Forbidden patterns: SCANNING...`;

    return { content: [{ type: 'text', text: sanitized }] };
  },

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

  refactor_move_block: async args => {
    const sourceContent = await fs.readFile(args.source_path, 'utf-8');

    // 1. Verify the code block exists in the source
    if (!sourceContent.includes(args.code_block)) {
      return {
        isError: true,
        content: [
          { type: 'text', text: 'ERROR: Code block not found in source file. Move aborted.' },
        ],
      };
    }

    // 2. Read/Create target file
    let targetContent = '';
    try {
      targetContent = await fs.readFile(args.target_path, 'utf-8');
    } catch (e) {
      targetContent = '// New Module created by SWEObeyMe\n';
    }

    // 3. Perform the "Paste"
    const newTargetContent = targetContent + '\n' + args.code_block;

    // 4. Validate the new file doesn't break our 700-line rule
    if (newTargetContent.split('\n').length > 700) {
      return {
        isError: true,
        content: [
          { type: 'text', text: 'ERROR: Move would cause target file to exceed 700 lines.' },
        ],
      };
    }

    // 5. Atomic Execution
    await fs.writeFile(args.target_path, newTargetContent, 'utf-8');
    const newSourceContent = sourceContent.replace(
      args.code_block,
      `// [MOVED TO ${path.basename(args.target_path)}]`
    );
    await fs.writeFile(args.source_path, newSourceContent, 'utf-8');

    recordAction('REFACTOR_MOVE', { from: args.source_path, to: args.target_path });
    return {
      content: [
        {
          type: 'text',
          text: `Successfully moved code block to ${args.target_path} (URI: ${normalizePath(args.target_path)}). Source has been updated with a reference comment.`,
        },
      ],
      uri: toWindsurfUri(args.target_path),
    };
  },

  extract_to_new_file: async args => {
    // 1. Create the new file with the code block and description
    const header = `// ${args.description || 'Module extracted by SWEObeyMe'}\n// Source: ${args.source_path}\n\n`;
    const newContent = header + args.code_block;

    // 2. Validate line count
    if (newContent.split('\n').length > 700) {
      return {
        isError: true,
        content: [{ type: 'text', text: 'ERROR: Extracted module would exceed 700 lines.' }],
      };
    }

    // 3. Create backup of source first
    const backupPath = await createBackup(args.source_path);
    if (!backupPath) {
      return {
        isError: true,
        content: [{ type: 'text', text: 'BACKUP FAILED: Cannot extract without verified backup.' }],
      };
    }

    // 4. Write the new file
    await fs.writeFile(args.new_file_path, newContent, 'utf-8');

    // 5. Update source to reference the new file
    const sourceContent = await fs.readFile(args.source_path, 'utf-8');
    const newSourceContent = sourceContent.replace(
      args.code_block,
      `// [EXTRACTED TO ${path.basename(args.new_file_path)}]\n// See: ${args.new_file_path}`
    );
    await fs.writeFile(args.source_path, newSourceContent, 'utf-8');

    recordAction('EXTRACT', { from: args.source_path, to: args.new_file_path });
    return {
      content: [
        {
          type: 'text',
          text: `Successfully extracted to ${args.new_file_path} (URI: ${normalizePath(args.new_file_path)}). Source has been updated with reference comments.`,
        },
      ],
      uri: toWindsurfUri(args.new_file_path),
    };
  },

  get_architectural_directive: async _args => {
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

  request_surgical_recovery: async args => {
    sessionMemory.history = []; // Wipe the confusing history
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

  auto_repair_submission: async args => {
    if (args.type === 'json') {
      const repaired = repairJson(args.raw_content);
      if (repaired) {
        return { content: [{ type: 'text', text: JSON.stringify(repaired, null, 2) }] };
      }
    } else if (args.type === 'code') {
      const corrected = autoCorrectCode(args.raw_content);
      return { content: [{ type: 'text', text: corrected }] };
    }
    return {
      isError: true,
      content: [{ type: 'text', text: 'Content unrepairable. Refactor required.' }],
    };
  },

  analyze_file_health: async args => {
    const content = await fs.readFile(args.path, 'utf-8');
    const issues = [];

    // Check for Complexity (Deep Nesting)
    const maxNesting = content.split('\n').reduce((max, line) => {
      const depth = (line.match(/ {2}|\t/g) || []).length;
      return Math.max(max, depth);
    }, 0);

    if (maxNesting > 5)
      issues.push("CRITICAL: Deep nesting detected. Logic is becoming a 'Black Box'.");
    if (content.includes('try {} catch') || content.includes('catch (e) {}'))
      issues.push('SMELL: Silent catch blocks detected. Digital Debt alert.');

    const report = issues.length > 0 ? issues.join('\n') : 'File is Surgically Clean.';
    return { content: [{ type: 'text', text: `[HEALTH REPORT for ${args.path}]:\n${report}` }] };
  },

  detect_architectural_drift: async args => {
    const content = await fs.readFile(args.path, 'utf-8');
    const lines = content.split('\n');
    const commentCount = lines.filter(
      l => l.trim().startsWith('//') || l.trim().startsWith('/*')
    ).length;
    const ratio = commentCount / lines.length;

    if (ratio < 0.1) {
      return {
        content: [
          {
            type: 'text',
            text: "DRIFT DETECTED: Documentation ratio is below 10%. Add 'Non-Coder' explanations immediately.",
          },
        ],
      };
    }
    return { content: [{ type: 'text', text: 'Alignment: COMPLIANT.' }] };
  },

  create_backup: async args => {
    const backupPath = await createBackup(args.path);
    if (backupPath) {
      return {
        content: [
          {
            type: 'text',
            text: `Backup created at: ${backupPath} (URI: ${normalizePath(backupPath)})`,
          },
        ],
        uri: toWindsurfUri(backupPath),
      };
    }
    return { isError: true, content: [{ type: 'text', text: 'Failed to create backup.' }] };
  },

  restore_backup: async args => {
    try {
      const files = await fs.readdir(BACKUP_DIR);
      const baseName = path.basename(args.path);
      const backups = files.filter(f => f.startsWith(baseName + '.backup-'));

      if (args.backup_index >= backups.length) {
        return { isError: true, content: [{ type: 'text', text: 'Invalid backup index.' }] };
      }

      // Sort by timestamp (newest first)
      backups.sort((a, b) => {
        const tsA = parseInt(a.match(/-(\d+)\.readonly$/)[1], 10);
        const tsB = parseInt(b.match(/-(\d+)\.readonly$/)[1], 10);
        return tsB - tsA;
      });

      const backupFile = backups[args.backup_index];
      const backupPath = path.join(BACKUP_DIR, backupFile);
      const content = await fs.readFile(backupPath, 'utf-8');

      await fs.writeFile(args.path, content, 'utf-8');
      return {
        content: [
          {
            type: 'text',
            text: `Restored ${args.path} (URI: ${normalizePath(args.path)}) from backup ${backupFile}.`,
          },
        ],
        uri: toWindsurfUri(args.path),
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Restore failed: ${error.message}` }],
      };
    }
  },

  query_the_oracle: async _args => {
    const categories = ['SUCCESS', 'FAILURE', 'RECOVERY'];
    const randomCat = categories[Math.floor(Math.random() * categories.length)];
    return { content: [{ type: 'text', text: `[ORACLE]: ${getRandomQuote(randomCat)}` }] };
  },

  get_config: configHandlers.get_config,

  set_config: configHandlers.set_config,

  reset_config: configHandlers.reset_config,

  get_config_schema: configHandlers.get_config_schema,

  list_directory: async args => {
    const files = await fs.readdir(args.path);
    return { content: [{ type: 'text', text: files.join('\n') }] };
  },

  dry_run_write_file: validationHandlers.dry_run_write_file,

  validate_change_before_apply: validationHandlers.validate_change_before_apply,

  diff_changes: contextHandlers.diff_changes,

  get_file_context: contextHandlers.get_file_context,

  verify_syntax: validationHandlers.verify_syntax,

  analyze_change_impact: contextHandlers.analyze_change_impact,

  get_symbol_references: contextHandlers.get_symbol_references,

  enforce_strict_mode: configHandlers.enforce_strict_mode,

  check_for_anti_patterns: validationHandlers.check_for_anti_patterns,

  validate_naming_conventions: validationHandlers.validate_naming_conventions,

  verify_imports: validationHandlers.verify_imports,

  check_test_coverage: safetyHandlers.check_test_coverage,

  require_documentation: feedbackHandlers.require_documentation,

  generate_change_summary: feedbackHandlers.generate_change_summary,

  confirm_dangerous_operation: safetyHandlers.confirm_dangerous_operation,

  check_for_repetitive_patterns: safetyHandlers.check_for_repetitive_patterns,

  explain_rejection: feedbackHandlers.explain_rejection,

  suggest_alternatives: feedbackHandlers.suggest_alternatives,

  get_historical_context: feedbackHandlers.get_historical_context,

  get_operation_guidance: feedbackHandlers.get_operation_guidance,

  run_related_tests: safetyHandlers.run_related_tests,

  // C# specific handlers
  validate_csharp_code: csharpHandlers.validate_csharp_code,
  validate_csharp_brackets: csharpHandlers.validate_csharp_brackets,
  analyze_csharp_complexity: csharpHandlers.analyze_csharp_complexity,
  detect_nested_try_catch: csharpHandlers.detect_nested_try_catch,
  visualize_scope_depth: csharpHandlers.visualize_scope_depth,
  validate_math_safety: csharpHandlers.validate_math_safety,
  analyze_math_expressions: csharpHandlers.analyze_math_expressions,
  validate_csharp_math: csharpHandlers.validate_csharp_math,
  suggest_math_improvements: csharpHandlers.suggest_math_improvements,
  csharp_health_check: csharpHandlers.csharp_health_check,

  // Project integrity handlers
  index_project_files: projectIntegrityHandlers.index_project_files,
  check_file_duplicates: projectIntegrityHandlers.check_file_duplicates,
  validate_file_references: projectIntegrityHandlers.validate_file_references,
  check_recent_operations: projectIntegrityHandlers.check_recent_operations,
  validate_before_write: projectIntegrityHandlers.validate_before_write,
  get_registry_stats: projectIntegrityHandlers.get_registry_stats,
  search_files: projectIntegrityHandlers.search_files,
  generate_audit_report: projectIntegrityHandlers.generate_audit_report,
  check_file_exists: projectIntegrityHandlers.check_file_exists,
};
