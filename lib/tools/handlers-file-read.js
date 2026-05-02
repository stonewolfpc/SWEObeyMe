/**
 * File Read Operations Handler
 * Handles reading files with support for large files and chunked reading
 */

import fs from 'fs/promises';
import path from 'path';
import { createErrorResponse, createSuccessResponse } from '../shared/error-utils.js';
import { withTimeout } from '../shared/async-utils.js';
import { StreamingFileReader, readFileUnlimited } from '../shared/streaming-utils.js';
import {
  getFileStats,
  THRESHOLDS,
  isSafeToRead,
  readFileChunked,
} from '../file-operations-safe.js';
import {
  detectDocumentType,
  isBinaryDocument,
  extractDocumentText,
  readDocumentAsText,
} from '../shared/document-converter.js';
import { shouldIgnore, getProjectContract } from '../project.js';
import { internalAudit, CONSTITUTION } from '../enforcement.js';
import { getProjectAwarenessManager } from '../project-awareness.js';
import { getSessionTracker } from '../session-tracker.js';
import { initializeProjectMemory, getProjectMemory } from '../project-memory.js';
import { injectRuleCompliance } from '../rule-engine.js';
import { MAX_LINES } from '../config.js';
import { toWindsurfUri, normalizePath } from '../utils.js';

const log = (msg) => {
  if (!process.env.DEBUG) return;
  try {
    process.stderr.write(`[SWEObeyMe-Read]: ${msg}\n`);
  } catch (_e) {
    /* stderr may be closed */
  }
};

/**
 * Generate proactive tool suggestions based on current context
 */
function generateToolSuggestions(context = {}) {
  const suggestions = [];

  if (context.operation === 'read_file' && context.filePath) {
    suggestions.push(
      'REQUIRED NEXT: Call get_file_context to understand dependencies before modifying.'
    );
    suggestions.push(
      'REQUIRED NEXT: If planning to modify, call obey_surgical_plan with current line count before write_file.'
    );
    suggestions.push(
      'REQUIRED NEXT: Call detect_project_switch if this file is in a different project than your last action.'
    );
  }

  if (context.isLargeFile) {
    suggestions.push(
      `TIP: File is large (${context.lineCount} lines). Consider using read_file_chunked for specific sections.`
    );
  }

  if (context.hasMoreContent) {
    suggestions.push(
      `TIP: More content available. Use offset=${context.nextOffset} to read next chunk.`
    );
  }

  if (suggestions.length === 0) {
    suggestions.push('REQUIRED: Use get_governance_constitution at the start of every session.');
    suggestions.push(
      'REQUIRED: Use get_current_project to verify context before significant actions.'
    );
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
 * Read a file with surgical context injection
 * Supports chunked reading for large files via offset and limit parameters
 */
export async function readFileHandler(args) {
  const startTime = Date.now();
  const sessionTracker = getSessionTracker();
  const sessionId = 'default-session';

  // Check if constitution was called first
  if (sessionTracker) {
    sessionTracker.trackToolCall(sessionId, 'read_file');

    if (!sessionTracker.hasCalledTool(sessionId, 'get_governance_constitution')) {
      sessionTracker.recordError(sessionId, 'medium');
      internalAudit.consecutiveFailures++;
      internalAudit.surgicalIntegrityScore -= 5;
      return createErrorResponse(
        'read_file',
        new Error(
          'You MUST call get_governance_constitution at the START of your session. This establishes the required workflow and governance rules.'
        ),
        'Constitution check failed',
        { severity: 'medium' }
      );
    }
  }

  // Validate path parameter
  if (!args.path || typeof args.path !== 'string') {
    return createErrorResponse(
      'read_file',
      new Error(
        "'path' parameter is REQUIRED and must be a string. Provide the file path you want to read."
      ),
      'Parameter validation',
      { severity: 'medium' }
    );
  }

  // Check if file is in .sweignore
  if (shouldIgnore(args.path)) {
    return createErrorResponse(
      'read_file',
      new Error(
        `File '${args.path}' is in .sweignore and excluded from AI context. This file is protected from AI modification.`
      ),
      'File protection check',
      { severity: 'medium', expected: true }
    );
  }

  // Initialize project memory if needed (with 3s timeout to prevent hangs on large dirs)
  const projectMemory = getProjectMemory();
  if (!projectMemory && args.path) {
    try {
      await Promise.race([
        initializeProjectMemory(path.dirname(args.path)),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Project memory init timeout')), 3000)
        ),
      ]);
    } catch (e) {
      log(`Project memory initialization failed: ${e.message}`);
    }
  }

  // Detect project switch (with 3s timeout)
  try {
    const projectManager = await getProjectAwarenessManager();
    const switchResult = await Promise.race([
      projectManager.detectProjectSwitch(args.path),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Project switch detection timeout')), 3000)
      ),
    ]);
    if (switchResult) {
      log(`Project switch detected: ${switchResult}`);
    }
  } catch (e) {
    log(`Project switch detection failed: ${e.message}`);
  }

  try {
    // Check if this is a binary document (PDF, DOCX, etc.)
    const docType = detectDocumentType(args.path);
    if (docType && isBinaryDocument(args.path)) {
      log(`Detected binary document: ${docType.type} - extracting text`);
      return await readDocumentAsText(args.path, { maxLength: 1000000 });
    }

    // First, check file stats to determine best reading strategy (with 6s timeout)
    const stats = await Promise.race([
      getFileStats(args.path),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`getFileStats timeout for ${args.path}`)), 6000)
      ),
    ]);

    if (!stats.exists) {
      return createErrorResponse(
        'read_file',
        new Error(`File does not exist: ${args.path}`),
        'File existence check',
        { expected: true }
      );
    }

    // Use streaming reader for ALL file sizes - handles 10-line or 10-million-line files
    const reader = new StreamingFileReader(args.path, {
      chunkSize: 1000,
      offset: args.offset || 1,
    });

    // Initialize with timeout protection (10s max)
    const init = await Promise.race([
      reader.initialize(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('StreamingFileReader.initialize timeout')), 10000)
      ),
    ]);
    if (!init.success) {
      return createErrorResponse('read_file', new Error(init.error), 'Initializing file reader');
    }

    const totalLines = init.totalLines;
    const requestedOffset = args.offset || 1;
    const requestedLimit = args.limit || 1000; // Always read in manageable chunks

    // Read requested portion - works for ANY file size (with 10s timeout)
    const lines = await Promise.race([
      reader.readLines(requestedOffset, requestedOffset + requestedLimit - 1),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('StreamingFileReader.readLines timeout')), 10000)
      ),
    ]);
    const linesRead = lines.length;
    const hasMore = requestedOffset + linesRead - 1 < totalLines;
    const nextOffset = hasMore ? requestedOffset + linesRead : null;

    // Format content with line numbers
    const content = lines.map((line, i) => `${requestedOffset + i}\t${line}`).join('\n');

    // Get file stats for response
    const fileStats = await withTimeout(fs.stat(args.path), 5000, 'read_file stat');
    const lineCount = content.split(/\r\n|\r|\n/).length;

    // Build context header
    let contextHeader = `[SURGICAL CONTEXT]: File: ${path.basename(args.path)} | Lines: ${lineCount}/${MAX_LINES()} | Last Modified: ${fileStats.mtime}\n`;
    contextHeader += `[SURGICAL INTEGRITY: ${internalAudit.surgicalIntegrityScore}/100]\n\n`;

    const projectContract = getProjectContract();
    if (projectContract) {
      contextHeader += `=== PROJECT CONTRACT ===\n${projectContract.substring(0, 500)}...\n=== END CONTRACT ===\n\n`;
    }

    contextHeader += '=== PROJECT MAP ===\n';
    contextHeader += 'Entry Points: index.js (MCP server), extension.js (VSCode extension)\n';
    contextHeader += 'Core: lib/tools/ (68 MCP tools), lib/ (validation, enforcement, C# bridge)\n';
    contextHeader += 'Docs: docs/ (LlamaCpp, Math reference), README.md (changelog, license)\n';
    contextHeader +=
      'Tests: tests/ (MCP compliance, schema validation), test-tools/ (tool tests)\n';
    contextHeader += 'Project Memory: 646 files indexed, 230 directories\n';
    contextHeader += '=== END PROJECT MAP ===\n\n';

    // Add large file warning if applicable
    let largeFileWarning = '';
    const isLargeFile = totalLines > 1000;
    if (isLargeFile) {
      largeFileWarning = `[LARGE FILE WARNING]: This file has ${totalLines} lines. `;
      if (hasMore) {
        largeFileWarning += `Showing lines ${requestedOffset}-${requestedOffset + linesRead - 1}. `;
        largeFileWarning += `Use offset=${nextOffset} to read more.\n\n`;
      } else {
        largeFileWarning += 'Consider using offset/limit for specific sections.\n\n';
      }
    }

    const fileContents = `${contextHeader}${largeFileWarning}${content}`;

    // Add rule engine check section
    const ruleContext = {
      operation: 'read',
      path: args.path,
      pathVerified: true,
      fileExists: true,
    };

    let response = {
      content: [
        {
          type: 'text',
          text: fileContents,
        },
      ],
    };

    response = injectRuleCompliance(response, 'read_file', ruleContext);

    // Add tool suggestions with context
    const suggestionContext = {
      operation: 'read_file',
      filePath: args.path,
      isLargeFile,
      lineCount: totalLines,
      hasMore,
      nextOffset,
    };

    response = injectToolSuggestions(response, suggestionContext);

    // Clear consecutive failures on success
    internalAudit.consecutiveFailures = 0;
    internalAudit.surgicalIntegrityScore = Math.min(100, internalAudit.surgicalIntegrityScore + 1);

    log(`read_file completed in ${Date.now() - startTime}ms for ${args.path}`);

    return response;
  } catch (error) {
    log(`read_file error for ${args.path}: ${error.message}`);

    // Provide specific guidance for common errors
    if (error.message.includes('timeout')) {
      return createErrorResponse('read_file', error, `Reading file: ${args.path}`, {
        severity: 'warning',
      });
    }

    return createErrorResponse('read_file', error, `Reading file: ${args.path}`, {
      expected: isKnownFileError(error),
    });
  }
}

/**
 * Check file info without reading content
 */
export async function checkFileStatsHandler(args) {
  if (!args.path) {
    return createErrorResponse(
      'check_file_stats',
      new Error('"path" parameter is REQUIRED.'),
      'Parameter validation'
    );
  }

  try {
    const stats = await Promise.race([
      getFileStats(args.path),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`getFileStats timeout for ${args.path}`)), 6000)
      ),
    ]);

    if (!stats.exists) {
      return createSuccessResponse(
        '=== FILE STATISTICS ===\n' +
          `Path: ${args.path}\n` +
          'Status: File does not exist\n' +
          '=== END STATISTICS ==='
      );
    }

    let message = '=== FILE STATISTICS ===\n';
    message += `Path: ${args.path}\n`;
    message += `Size: ${stats.size} bytes\n`;
    message += `Line Count: ${stats.lineCount}\n`;
    message += `Category: ${stats.category}\n`;
    message += `Estimated Read Time: ${stats.estimatedReadTime}ms\n`;
    message += '=== END STATISTICS ===\n\n';
    message += 'RECOMMENDATION: ';

    if (stats.lineCount <= THRESHOLDS.MEDIUM) {
      message += `File is small (${stats.lineCount} lines). Safe to read with read_file.`;
    } else if (stats.lineCount <= THRESHOLDS.LARGE) {
      message += `File is medium (${stats.lineCount} lines). Use read_file with caution, or use offset/limit.`;
    } else {
      message += `File is large (${stats.lineCount} lines). MUST use offset and limit parameters, or use read_file_chunked.`;
    }

    return createSuccessResponse(message);
  } catch (error) {
    return createErrorResponse('check_file_stats', error, `Checking stats for: ${args.path}`);
  }
}

/**
 * Check if file is safe to read
 */
export async function isSafeToReadHandler(args) {
  if (!args.path) {
    return createErrorResponse(
      'is_safe_to_read',
      new Error('"path" parameter is REQUIRED.'),
      'Parameter validation'
    );
  }

  try {
    const maxLines = args.maxLines || 1000;
    const maxReadTime = args.maxReadTime || 5000;

    const result = await isSafeToRead(args.path, { maxLines, maxReadTime });

    let message = '=== FILE SAFETY CHECK ===\n';
    message += `Path: ${args.path}\n`;
    message += `Safe: ${result.safe ? 'Yes' : 'No'}\n`;

    if (result.reason) {
      message += `Reason: ${result.reason}\n`;
    }

    if (result.recommendation) {
      message += `Recommendation: ${result.recommendation}\n`;
    }

    if (result.stats) {
      message += '\nStatistics:\n';
      message += `  Size: ${result.stats.size} bytes\n`;
      message += `  Line Count: ${result.stats.lineCount}\n`;
      message += `  Category: ${result.stats.category}\n`;
      message += `  Estimated Read Time: ${result.stats.estimatedReadTime}ms\n`;
    }

    message += '=== END SAFETY CHECK ===';

    return createSuccessResponse(message);
  } catch (error) {
    return createErrorResponse('is_safe_to_read', error, `Checking safety for: ${args.path}`);
  }
}

/**
 * Read file in chunks
 */
export async function readFileChunkedHandler(args) {
  if (!args.path) {
    return createErrorResponse(
      'read_file_chunked',
      new Error('"path" parameter is REQUIRED.'),
      'Parameter validation'
    );
  }

  try {
    const offset = args.offset || 1;
    const limit = args.limit || 1000;
    const timeout = args.timeout || 30000;

    const result = await readFileChunked(args.path, offset, limit, timeout);

    let message = '=== CHUNKED FILE READ ===\n';
    message += `Path: ${args.path}\n`;
    message += `Total Lines: ${result.totalLines}\n`;
    message += `Lines Read: ${result.linesRead}\n`;
    message += `Offset: ${result.offset}\n`;
    message += `Limit: ${result.limit}\n`;
    message += `Has More: ${result.hasMore ? 'Yes' : 'No'}\n`;
    message += '=== END METADATA ===\n\n';
    message += result.content;

    if (result.hasMore) {
      message += `\n\n[INFO] More lines available. Use offset=${offset + limit} to read next chunk.`;
    }

    return createSuccessResponse(message);
  } catch (error) {
    return createErrorResponse('read_file_chunked', error, `Reading chunk from: ${args.path}`);
  }
}

/**
 * Dispatcher: file_info swiss-army-knife handler
 */
export async function fileInfoHandler(params) {
  const { operation, path, maxLines, maxReadTime, offset, limit, timeout } = params;

  if (!operation) {
    return createErrorResponse(
      'file_info',
      new Error('operation parameter is required (stats, safe_check, read_chunked)'),
      'Parameter validation'
    );
  }

  switch (operation) {
    case 'stats':
      return await checkFileStatsHandler({ path });
    case 'safe_check':
      return await isSafeToReadHandler({ path, maxLines, maxReadTime });
    case 'read_chunked':
      return await readFileChunkedHandler({ path, offset, limit, timeout });
    default:
      return createErrorResponse(
        'file_info',
        new Error(`Unknown operation: ${operation}. Valid: stats, safe_check, read_chunked`),
        'Operation validation'
      );
  }
}

function isKnownFileError(error) {
  return (
    error.code === 'ENOENT' ||
    error.code === 'EACCES' ||
    error.code === 'EPERM' ||
    error.code === 'EISDIR' ||
    error.code === 'ENOTDIR'
  );
}

// Re-export document converter utilities
export { detectDocumentType, isBinaryDocument, extractDocumentText };
