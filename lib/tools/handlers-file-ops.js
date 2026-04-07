import fs from 'fs/promises';
import path from 'path';
import { toWindsurfUri, normalizePath } from '../utils.js';
import { createBackup, BACKUP_DIR } from '../backup.js';
import {
  validateCode,
  autoCorrectCode,
  internalAudit,
  CONSTITUTION,
} from '../enforcement.js';
import { recordAction, sessionMemory } from '../session.js';
import { getProjectContract, shouldIgnore } from '../project.js';
import { activeWorkflows } from '../workflow.js';
import { MAX_LINES, WARNING_THRESHOLD, DEBUG_LOGS } from '../config.js';
import { injectRuleCompliance, checkRuleCompliance } from '../rule-engine.js';
import { initializeProjectMemory, getProjectMemory } from '../project-memory.js';
import { executeFallback, detectFailureType, getFallbackSuggestions } from '../fallback-system.js';
import { analyzeCSharpComplexity, validateCSharpBrackets } from '../csharp-validation.js';
import { analyzeMathExpression } from '../math-safety.js';
import { analyzeCSharpFile } from '../csharp-bridge.js';
import {
  recordFileOperation,
  wasFileRecentlyWritten,
  checkForDuplicateWrite,
} from '../file-operation-audit.js';
import { findDuplicateFiles, findSameNameFiles, updateFileInRegistry } from '../file-registry.js';
import { getProjectAwarenessManager } from '../project-awareness.js';

const log = msg => {
  if (!DEBUG_LOGS()) return;
  process.stderr.write(`[SWEObeyMe-Audit]: ${msg}\n`);
};

/**
 * Generate proactive tool suggestions based on current context
 */
function generateToolSuggestions(context = {}) {
  const suggestions = [];

  if (context.operation === 'read_file' && context.filePath) {
    suggestions.push('RECOMMENDED: Call get_file_context to understand dependencies and impact before modifying this file.');
    suggestions.push('RECOMMENDED: If planning to modify, call obey_surgical_plan with current line count before write_file.');
  }

  if (context.operation === 'write_file') {
    suggestions.push('RECOMMENDED: Call run_related_tests after write_file to verify changes.');
    suggestions.push('RECOMMENDED: Call generate_change_summary to document what was changed.');
  }

  if (context.operation === 'search') {
    suggestions.push('RECOMMENDED: Use search_code_files instead of built-in search for language-aware ranking.');
  }

  if (suggestions.length === 0) {
    suggestions.push('REMEMBER: Use read_file for all file reads (not direct file access).');
    suggestions.push('REMEMBER: Use write_file for all file writes (not direct editing).');
  }

  return suggestions.join('\n');
}

/**
 * Inject tool suggestions into tool response
 */
function injectToolSuggestions(response, context = {}) {
  if (!response.content) return response;

  const suggestions = generateToolSuggestions(context);
  const suggestionText = `\n\n[TOOL SUGGESTIONS]\n${suggestions}\n`;

  for (let i = response.content.length - 1; i >= 0; i--) {
    if (response.content[i].type === 'text') {
      response.content[i].text += suggestionText;
      break;
    }
  }

  return response;
}

/**
 * Core file operation handlers
 */
export const fileOperationHandlers = {
  /**
   * Read a file with surgical context injection
   */
  read_file: async args => {
    const projectMemory = getProjectMemory();
    if (!projectMemory && args.path) {
      try {
        await initializeProjectMemory(path.dirname(args.path));
      } catch (e) {
        log(`Project memory initialization failed: ${e.message}`);
      }
    }

    // Project Awareness: Detect project switch when reading files
    const projectManager = getProjectAwarenessManager();
    const switchResult = await projectManager.detectProjectSwitch(args.path);
    if (switchResult) {
      log(`Project switch detected: ${switchResult}`);
    }

    const ruleContext = {
      operation: 'read',
      path: args.path,
      pathVerified: false,
      structureKnown: false,
    };

    if (!args.path || typeof args.path !== 'string') {
      internalAudit.consecutiveFailures++;
      internalAudit.surgicalIntegrityScore -= 5;
      const response = {
        isError: true,
        content: [
          {
            type: 'text',
            text: `ERROR: 'path' parameter is REQUIRED and must be a string. Provide the file path you want to read. Example: path='index.js'\n\n[SURGICAL INTEGRITY: ${internalAudit.surgicalIntegrityScore}/100 | Consecutive Failures: ${internalAudit.consecutiveFailures}]`,
          },
        ],
      };
      return injectRuleCompliance(response, 'read_file', ruleContext);
    }

    if (shouldIgnore(args.path)) {
      const response = {
        isError: true,
        content: [
          {
            type: 'text',
            text: `BLOCKED: File '${args.path}' is in .sweignore and excluded from AI context. This file is protected from AI modification. Choose a different file or update .sweignore if this is intentional.\n\n[SURGICAL INTEGRITY: ${internalAudit.surgicalIntegrityScore}/100]`,
          },
        ],
      };
      return injectRuleCompliance(response, 'read_file', ruleContext);
    }

    try {
      const content = await fs.readFile(args.path, 'utf-8');
      const stats = await fs.stat(args.path);
      const lineCount = content.split(/\r\n|\r|\n/).length;

      ruleContext.pathVerified = true;
      ruleContext.fileExists = true;

      let contextHeader = `[SURGICAL CONTEXT]: File: ${path.basename(args.path)} | Lines: ${lineCount}/${MAX_LINES()} | Last Modified: ${stats.mtime}\n`;
      contextHeader += `[SURGICAL INTEGRITY: ${internalAudit.surgicalIntegrityScore}/100]\n\n`;

      const projectContract = getProjectContract();
      if (projectContract) {
        contextHeader += `=== PROJECT CONTRACT ===\n${projectContract.substring(0, 500)}...\n=== END CONTRACT ===\n\n`;
      }

      contextHeader += '=== PROJECT MAP ===\n';
      contextHeader += 'Entry Points: index.js (MCP server), extension.js (VSCode extension)\n';
      contextHeader += 'Core: lib/tools/ (68 MCP tools), lib/ (validation, enforcement, C# bridge)\n';
      contextHeader += 'Docs: docs/ (LlamaCpp, Math reference), README.md (changelog, license)\n';
      contextHeader += 'Tests: tests/ (MCP compliance, schema validation), test-tools/ (tool tests)\n';

      const pm = getProjectMemory();
      if (pm) {
        const summary = pm.getSummary();
        contextHeader += `Project Memory: ${summary.structure.totalFiles} files indexed, ${summary.structure.totalDirectories} directories\n`;
      }

      contextHeader += '=== END PROJECT MAP ===\n\n';
      contextHeader += '=== FILE CONTEXT ===\n';
      contextHeader += `Related files in same directory: ${path.dirname(args.path)}\n`;
      contextHeader += 'Suggested next tools: get_file_context, analyze_change_impact, preflight_change\n';
      contextHeader += '=== END FILE CONTEXT ===\n\n';

      const isCSharp =
        args.path.endsWith('.cs') || (content.includes('namespace ') && content.includes('using '));
      if (isCSharp) {
        contextHeader += '=== C# COMPLEXITY ANALYSIS ===\n';
        const complexity = analyzeCSharpComplexity(content);
        const brackets = validateCSharpBrackets(content);
        const mathSafety = analyzeMathExpression(content);

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

        const warnings = [];
        if (complexityScore < 70) warnings.push(`⚠️ LOW COMPLEXITY SCORE (${complexityScore}/100)`);
        if (complexity.metrics.maxNestingDepth > 5)
          warnings.push(`⚠️ DEEP NESTING (${complexity.metrics.maxNestingDepth} levels)`);
        if (complexity.metrics.tryCatchDepth > 3)
          warnings.push(`⚠️ DEEP TRY-CATCH (${complexity.metrics.tryCatchDepth} levels)`);
        if (!brackets.valid) warnings.push('⚠️ BRACKET MISMATCH DETECTED');
        if (complexity.metrics.emptyCatchBlocks.length > 0)
          warnings.push(`⚠️ ${complexity.metrics.emptyCatchBlocks.length} EMPTY CATCH BLOCKS`);
        if (complexity.metrics.missingUsingStatements.length > 0)
          warnings.push(`⚠️ ${complexity.metrics.missingUsingStatements.length} MISSING USING STATEMENTS`);
        if (mathSafety.metrics.potentialOverflow.length > 0)
          warnings.push(`⚠️ ${mathSafety.metrics.potentialOverflow.length} POTENTIAL OVERFLOW RISKS`);
        if (mathSafety.metrics.divisionByZeroRisk.length > 0)
          warnings.push(`⚠️ ${mathSafety.metrics.divisionByZeroRisk.length} DIVISION BY ZERO RISKS`);

        if (warnings.length > 0) {
          contextHeader += `WARNINGS:\n${warnings.join('\n')}\n`;
        }

        contextHeader += '=== END C# ANALYSIS ===\n\n';
      }

      if (isCSharp && global.csharpAiInformed === true) {
        try {
          const csharpAnalysis = await analyzeCSharpFile(args.path);

          if (csharpAnalysis && csharpAnalysis.errorCount > 0 && csharpAnalysis.errors) {
            const filteredErrors = csharpAnalysis.errors.filter(error => {
              if (error.severity === 2) return true;
              if (error.severity === 1 && internalAudit.surgicalIntegrityScore > 80) return true;
              if (error.severity === 0) return false;
              return false;
            });

            if (filteredErrors.length > 0) {
              contextHeader += '=== C# ERRORS DETECTED (Keep AI Informed) ===\n';
              contextHeader += `Found ${filteredErrors.length} error(s) requiring attention:\n`;

              filteredErrors.forEach(error => {
                const severityLabel = error.severity === 2 ? 'CRITICAL' : error.severity === 1 ? 'WARNING' : 'INFO';
                const color = error.color || 'UNKNOWN';
                contextHeader += `  [${color.toUpperCase()}] ${severityLabel}: ${error.name}\n`;
                if (error.lineRanges && error.lineRanges.length > 0) {
                  contextHeader += `    Lines: ${error.lineRanges.map(r => `${r.startLine}-${r.endLine}`).join(', ')}\n`;
                }
              });

              contextHeader += '\nACTION: Use get_integrity_report for detailed analysis or get_csharp_errors_for_file to inspect specific errors.\n';
              contextHeader += '=== END C# ERRORS ===\n\n';
            }
          }
        } catch (csharpError) {
          log(`C# Bridge analysis failed for ${args.path}: ${csharpError.message}`);
        }
      }

      internalAudit.consecutiveFailures = 0;
      internalAudit.surgicalIntegrityScore = Math.min(100, internalAudit.surgicalIntegrityScore + 1);
      log(`Read ${args.path}: ${lineCount} lines.`);

      const response = {
        content: [
          {
            type: 'text',
            text: contextHeader + content,
          },
        ],
        uri: toWindsurfUri(args.path),
      };

      return injectToolSuggestions(injectRuleCompliance(response, 'read_file', ruleContext), { operation: 'read_file', filePath: args.path });
    } catch (error) {
      internalAudit.consecutiveFailures++;
      internalAudit.surgicalIntegrityScore -= 5;

      const failureType = detectFailureType(error, { path: args.path });
      const fallbackSuggestions = getFallbackSuggestions(failureType, { path: args.path });

      const response = {
        isError: true,
        content: [
          {
            type: 'text',
            text: `ERROR: Failed to read file '${args.path}'. ${error.message}. Ensure the file exists and you have permission to read it.\n\n${fallbackSuggestions}\n\n[SURGICAL INTEGRITY: ${internalAudit.surgicalIntegrityScore}/100 | Consecutive Failures: ${internalAudit.consecutiveFailures}]`,
          },
        ],
      };

      return injectRuleCompliance(response, 'read_file', ruleContext);
    }
  },

  /**
   * Write a file with comprehensive validation
   */
  write_file: async args => {
    const ruleContext = {
      operation: 'write_file',
      path: args.path,
      pathVerified: false,
      fileExists: false,
      planExplained: false,
      searched: false,
    };

    // Project Awareness: Validate action against project rules
    const projectManager = getProjectAwarenessManager();
    const projectValidation = projectManager.validateAction('write_file', args.path);

    if (!projectValidation.valid) {
      const response = {
        isError: true,
        content: [
          {
            type: 'text',
            text: `PROJECT RULE VIOLATION: ${projectValidation.reason}\n\nThis action violates the current project's constraints. Use detect_project_switch to ensure you are working in the correct project context, and get_project_rules to understand the applicable constraints.`,
          },
        ],
      };
      return response;
    }

    let content = args.content;

    const operationRecord = await recordFileOperation('WRITE', args.path, { content });
    if (operationRecord.status === 'DUPLICATE') {
      internalAudit.consecutiveFailures++;
      internalAudit.surgicalIntegrityScore -= 5;
      const response = {
        isError: true,
        content: [
          { type: 'text', text: `BLOCKED: Duplicate operation detected. ${operationRecord.note}\n\n[SURGICAL INTEGRITY: ${internalAudit.surgicalIntegrityScore}/100 | Consecutive Failures: ${internalAudit.consecutiveFailures}]` },
        ],
      };
      return injectRuleCompliance(response, 'write_file', ruleContext);
    }

    const recentDuplicate = await checkForDuplicateWrite(args.path, content, 10000);
    if (recentDuplicate) {
      internalAudit.consecutiveFailures++;
      internalAudit.surgicalIntegrityScore -= 10;
      console.error(
        `[SWE-INTEGRITY] Blocked duplicate write to ${args.path} - identical content written ${Date.now() - recentDuplicate.timestamp}ms ago`,
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

    const duplicateFiles = findDuplicateFiles(args.path, content);
    if (duplicateFiles.length > 0) {
      internalAudit.consecutiveFailures++;
      internalAudit.surgicalIntegrityScore -= 5;
      console.error(
        `[SWE-INTEGRITY] Detected duplicate file creation attempt: ${args.path} matches ${duplicateFiles.join(', ')}`,
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

    const sameNameFiles = findSameNameFiles(args.path);
    if (sameNameFiles.length > 0) {
      internalAudit.consecutiveFailures++;
      internalAudit.surgicalIntegrityScore -= 5;
      console.error(
        `[SWE-INTEGRITY] Detected same-name file creation attempt: ${args.path} matches ${sameNameFiles.join(', ')}`,
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

    const correctedContent = autoCorrectCode(content);
    if (correctedContent !== content) {
      console.error(
        `[SWE-LOG] Action: HEAL | Target: ${toWindsurfUri(args.path)} | Status: Auto-corrected forbidden patterns`,
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

    const recentWrites = sessionMemory.history.filter(
      h => h.action === 'WRITE' && h.details?.path === args.path,
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

    if (lineCount > WARNING_THRESHOLD()) {
      console.error(
        `[SWE-LOG] Action: WARNING | Target: ${toWindsurfUri(args.path)} | Status: File at ${lineCount} lines, approaching ${MAX_LINES()} limit`,
      );
    }

    await fs.writeFile(args.path, content, 'utf-8');

    await updateFileInRegistry(args.path, content);

    internalAudit.consecutiveFailures = 0;
    internalAudit.surgicalIntegrityScore = Math.min(100, internalAudit.surgicalIntegrityScore + 2);

    const currentWf = activeWorkflows.get('current');
    if (currentWf) {
      const writeStep = currentWf.steps.find(
        s => s.tool === 'write_file' && s.status === 'pending',
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

    const actionType = correctedContent !== args.content ? 'WRITE_REPAIRED' : 'WRITE';
    recordAction(actionType, { path: args.path, lines: lineCount });

    const msg =
      correctedContent !== args.content
        ? `File saved. (Note: SWEObeyMe auto-corrected minor architectural violations in your syntax). URI: ${normalizePath(args.path)}`
        : `Successfully saved ${args.path}. All rules satisfied. URI: ${normalizePath(args.path)}`;

    const pm = getProjectMemory();
    if (pm) {
      pm.setFilePurpose(args.path, 'Modified by write_file operation');
      await pm.save();
    }

    const response = {
      content: [{ type: 'text', text: msg }],
      uri: toWindsurfUri(args.path),
    };

    ruleContext.pathVerified = true;
    ruleContext.fileExists = true;

    return injectToolSuggestions(injectRuleCompliance(response, 'write_file', ruleContext), { operation: 'write_file', filePath: args.path });
  },

  /**
   * List directory contents
   */
  list_directory: async args => {
    const files = await fs.readdir(args.path);
    return { content: [{ type: 'text', text: files.join('\n') }] };
  },

  /**
   * Restore a file from backup
   */
  restore_backup: async args => {
    try {
      const files = await fs.readdir(BACKUP_DIR);
      const baseName = path.basename(args.path);
      const backups = files.filter(f => f.startsWith(baseName + '.backup-'));

      if (args.backup_index >= backups.length) {
        return { isError: true, content: [{ type: 'text', text: 'Invalid backup index.' }] };
      }

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
};
