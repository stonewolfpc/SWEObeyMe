/**
 * File Write Operations Handler
 * Handles writing files with validation, backups, and surgical compliance
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { createErrorResponse, createSuccessResponse } from '../shared/error-utils.js';
import { withTimeout } from '../shared/async-utils.js';
import { StreamingFileWriter } from '../shared/streaming-utils.js';
import { toWindsurfUri, normalizePath } from '../utils.js';
import { createBackup, BACKUP_DIR } from '../backup.js';
import { autoBackupBeforeEdit, autoSnapshotAfterEdit, getBackupStatus, quickRestore } from '../backup-auto.js';
import { validateCode, autoCorrectCode, internalAudit, CONSTITUTION } from '../enforcement.js';
import { MAX_LINES, WARNING_THRESHOLD, DEBUG_LOGS } from '../config.js';
import { injectRuleCompliance } from '../rule-engine.js';
import { recordAction, sessionMemory } from '../session.js';
import { shouldIgnore, getProjectContract } from '../project.js';
import { activeWorkflows } from '../workflow.js';
import { getProjectMemoryManager } from '../project-memory-system.js';
import { wasFileRecentlyWritten, checkForDuplicateWrite } from '../file-operation-audit.js';
import { updateFileInRegistry } from '../file-registry.js';

const log = (msg) => {
  if (!DEBUG_LOGS()) return;
  process.stderr.write(`[SWEObeyMe-Write]: ${msg}\n`);
};

/**
 * Write file with surgical compliance and validation
 */
export async function writeFileHandler(args) {
  const startTime = Date.now();

  // Validate required parameters
  if (!args.path || typeof args.path !== 'string') {
    return createErrorResponse(
      'write_file',
      new Error("'path' parameter is REQUIRED and must be a string. Example: path='index.js'"),
      'Parameter validation',
      { severity: 'medium' }
    );
  }

  if (!args.content || typeof args.content !== 'string') {
    return createErrorResponse(
      'write_file',
      new Error("'content' parameter is REQUIRED and must be a string."),
      'Parameter validation',
      { severity: 'medium' }
    );
  }

  // Check if file is protected
  if (shouldIgnore(args.path)) {
    return createErrorResponse(
      'write_file',
      new Error(`File '${args.path}' is in .sweignore and protected from modification.`),
      'File protection check',
      { severity: 'medium', expected: true }
    );
  }

  try {
    const content = args.content;
    let correctedContent = content;

    // Check for duplicate writes (loop detection)
    const recentWrites = sessionMemory.history.filter(
      (h) => h.action === 'WRITE' && h.details?.path === args.path
    );

    if (recentWrites.length >= 3) {
      internalAudit.consecutiveFailures++;
      internalAudit.surgicalIntegrityScore -= 15;
      return createErrorResponse(
        'write_file',
        new Error('Loop detected: You have attempted to write to this file 3+ times without moving to the next task. Re-evaluate your plan.'),
        'Loop detection',
        { severity: 'critical' }
      );
    }

    // Validate code before writing
    const validation = validateCode(content, args.path);

    if (!validation.valid) {
      internalAudit.consecutiveFailures++;
      internalAudit.surgicalIntegrityScore -= 10;

      // Try auto-correction
      correctedContent = autoCorrectCode(content);

      if (correctedContent === content) {
        return createErrorResponse(
          'write_file',
          new Error(`Validation failed:\n${validation.errors.join('\n')}`),
          'Code validation',
          { severity: 'medium' }
        );
      }
    }

    const lineCount = content.split(/\r\n|\r|\n/).length;

    // Check line count limit
    if (lineCount > MAX_LINES()) {
      internalAudit.consecutiveFailures++;
      internalAudit.surgicalIntegrityScore -= 10;
      return createErrorResponse(
        'write_file',
        new Error(`File exceeds maximum line count (${lineCount} > ${MAX_LINES()}). Split into smaller files or use extract_to_new_file.`),
        'Surgical limit check',
        { severity: 'medium' }
      );
    }

    // Check if file exists and create backup
    let fileExists = false;
    try {
      await withTimeout(fs.access(args.path), 5000, 'file existence check');
      fileExists = true;
    } catch {
      fileExists = false;
    }

    if (fileExists) {
      // Auto-backup before edit (silent, never errors)
      await autoBackupBeforeEdit(args.path);
    }

    // Warn if approaching line limit
    if (lineCount > WARNING_THRESHOLD()) {
      log(`WARNING: File at ${lineCount} lines, approaching ${MAX_LINES()} limit`);
    }

    // Write the file using streaming writer - handles ANY file size
    const writer = new StreamingFileWriter(args.path);
    const writeResult = await writer.write(correctedContent, { chunkSize: 1000 });

    if (!writeResult.success) {
      return createErrorResponse(
        'write_file',
        new Error(`Write failed: ${writeResult.error}`),
        'Streaming file write'
      );
    }

    // Update file registry
    await updateFileInRegistry(args.path, correctedContent);

    // Auto-snapshot after successful edit (silent, never errors)
    await autoSnapshotAfterEdit(args.path, { lineCount });

    // Update audit tracking
    internalAudit.consecutiveFailures = 0;
    internalAudit.surgicalIntegrityScore = Math.min(100, internalAudit.surgicalIntegrityScore + 2);

    // Update workflow tracking
    const currentWf = activeWorkflows.get('current');
    if (currentWf) {
      const writeStep = currentWf.steps.find(
        (s) => s.tool === 'write_file' && s.status === 'pending'
      );
      if (writeStep) {
        currentWf.updateStep(writeStep.name, 'completed');
        log(`Workflow step completed: ${writeStep.name}`);
      }

      if (currentWf.isComplete()) {
        log(`Workflow ${currentWf.id} complete!`);
        activeWorkflows.delete('current');
      }
    }

    // Record the action
    const actionType = correctedContent !== args.content ? 'WRITE_REPAIRED' : 'WRITE';
    recordAction(actionType, { path: args.path, lines: lineCount });

    // Build success message
    let msg;
    if (correctedContent !== args.content) {
      msg = `File saved. Note: SWEObeyMe auto-corrected minor violations. URI: ${normalizePath(args.path)}`;
    } else {
      msg = `Successfully saved ${args.path}. All rules satisfied. URI: ${normalizePath(args.path)}`;
    }

    // Shadow snapshot
    try {
      const memoryManager = await getProjectMemoryManager('default');
      if (memoryManager) {
        const versionId = crypto.randomUUID();
        memoryManager.setVersionId(versionId);

        const taskList = sessionMemory.history
          .filter((h) => h.action === 'WRITE' || h.action === 'EDIT')
          .slice(-5)
          .map((h) => ({
            action: h.action,
            timestamp: h.timestamp,
            details: h.details,
          }));
        memoryManager.setTaskList(taskList);

        const editSummary = `Edited ${args.path} (${lineCount} lines)`;
        const context = args.explanation ? args.explanation.substring(0, 100) : null;
        memoryManager.recordEditSnapshot(args.path, editSummary, context);
      }
    } catch (error) {
      log(`Shadow snapshot failed: ${error.message}`);
    }

    const ruleContext = {
      operation: 'write',
      path: args.path,
      pathVerified: true,
      fileExists: true,
    };

    let response = {
      content: [{ type: 'text', text: msg }],
      uri: toWindsurfUri(args.path),
    };

    response = injectRuleCompliance(response, 'write_file', ruleContext);

    log(`write_file completed in ${Date.now() - startTime}ms for ${args.path}`);

    return response;
  } catch (error) {
    log(`write_file error for ${args.path}: ${error.message}`);
    return createErrorResponse('write_file', error, `Writing file: ${args.path}`);
  }
}

/**
 * Extract code block to a new file
 * Uses streaming for unlimited file size support
 */
export async function extractToNewFileHandler(args) {
  if (!args.source_path || !args.target_path || !args.start_line || !args.end_line) {
    return createErrorResponse(
      'extract_to_new_file',
      new Error('source_path, target_path, start_line, and end_line are all required'),
      'Parameter validation'
    );
  }

  try {
    // Use streaming reader for source file - handles ANY size
    const { StreamingFileReader } = await import('../shared/streaming-utils.js');
    const reader = new StreamingFileReader(args.source_path, { chunkSize: 1000 });

    const init = await reader.initialize();
    if (!init.success) {
      return createErrorResponse(
        'extract_to_new_file',
        new Error(`Cannot read source: ${init.error}`),
        'Source file read'
      );
    }

    // Validate line numbers
    if (args.start_line < 1 || args.end_line > init.totalLines || args.start_line > args.end_line) {
      return createErrorResponse(
        'extract_to_new_file',
        new Error(`Invalid line range: ${args.start_line}-${args.end_line}. File has ${init.totalLines} lines.`),
        'Line range validation'
      );
    }

    // Extract the block using streaming
    const extractedLines = await reader.readLines(args.start_line, args.end_line);
    const extractedContent = extractedLines.join('\n');

    // Check if target exists
    let targetExists = false;
    try {
      await withTimeout(fs.access(args.target_path), 5000, 'check target exists');
      targetExists = true;
    } catch {
      targetExists = false;
    }

    if (targetExists && !args.force) {
      return createErrorResponse(
        'extract_to_new_file',
        new Error(`Target file ${args.target_path} already exists. Use force=true to overwrite.`),
        'Target file check',
        { expected: true }
      );
    }

    // Create backup if target exists
    if (targetExists) {
      await createBackup(args.target_path);
    }

    // Write extracted content using streaming writer
    const writer = new StreamingFileWriter(args.target_path);
    const writeResult = await writer.write(extractedContent, { chunkSize: 1000 });

    if (!writeResult.success) {
      return createErrorResponse(
        'extract_to_new_file',
        new Error(`Write failed: ${writeResult.error}`),
        'Writing target file'
      );
    }

    return createSuccessResponse(
      `Successfully extracted lines ${args.start_line}-${args.end_line} from ${args.source_path} to ${args.target_path}`
    );
  } catch (error) {
    return createErrorResponse('extract_to_new_file', error, 'Extracting code block');
  }
}

/**
 * Dispatcher: refactor_manage swiss-army-knife
 */
export async function refactorManageHandler(params) {
  const { operation, source_path, target_path, start_line, end_line, force } = params;

  if (!operation) {
    return createErrorResponse(
      'refactor_manage',
      new Error('operation parameter is required'),
      'Parameter validation'
    );
  }

  switch (operation) {
    case 'extract':
      return await extractToNewFileHandler({ source_path, target_path, start_line, end_line, force });
    default:
      return createErrorResponse(
        'refactor_manage',
        new Error(`Unknown operation: ${operation}`),
        'Operation validation'
      );
  }
}
