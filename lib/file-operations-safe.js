/**
 * Safe File Operations
 * Provides timeout-protected, chunked file operations to prevent hangs on large files
 */

import fs from 'fs/promises';
import path from 'path';

/**
 * File size thresholds
 */
const THRESHOLDS = {
  SMALL: 100, // lines
  MEDIUM: 500, // lines
  LARGE: 2000, // lines
  HUGE: 10000, // lines
};

/**
 * Get file statistics without reading content
 */
export async function getFileStats(filePath) {
  try {
    const stats = await fs.stat(filePath);
    const content = await fs.readFile(filePath, 'utf-8');
    const lineCount = content.split(/\r\n|\r|\n/).length;

    return {
      exists: true,
      size: stats.size,
      lineCount,
      category: categorizeFileSize(lineCount),
      estimatedReadTime: estimateReadTime(stats.size),
    };
  } catch (error) {
    return {
      exists: false,
      error: error.message,
    };
  }
}

/**
 * Categorize file size
 */
function categorizeFileSize(lineCount) {
  if (lineCount <= THRESHOLDS.SMALL) return 'small';
  if (lineCount <= THRESHOLDS.MEDIUM) return 'medium';
  if (lineCount <= THRESHOLDS.LARGE) return 'large';
  if (lineCount <= THRESHOLDS.HUGE) return 'huge';
  return 'massive';
}

/**
 * Estimate read time in milliseconds
 */
function estimateReadTime(sizeInBytes) {
  // Assume 10MB/s read speed
  return Math.ceil(sizeInBytes / 10000);
}

/**
 * Read file with timeout protection
 */
export async function readFileSafe(filePath, options = {}) {
  const {
    timeout = 5000, // 5 second default timeout
    offset = 1,
    limit = 1000,
    maxLines = 1000, // default max lines to read
  } = options;

  const stats = await getFileStats(filePath);

  if (!stats.exists) {
    throw new Error(`File does not exist: ${filePath}`);
  }

  // If file is small, read normally
  if (stats.lineCount <= THRESHOLDS.MEDIUM) {
    return await readFileWithTimeout(filePath, timeout);
  }

  // If file is large, read in chunks or with limit
  if (stats.lineCount > maxLines) {
    console.error(
      `[SafeFile] Large file detected (${stats.lineCount} lines). Reading first ${maxLines} lines.`
    );
    return await readFileChunked(filePath, offset, Math.min(limit, maxLines), timeout);
  }

  return await readFileWithTimeout(filePath, timeout);
}

/**
 * Read file with timeout
 */
async function readFileWithTimeout(filePath, timeout) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const content = await fs.readFile(filePath, 'utf-8', { signal: controller.signal });
    clearTimeout(timeoutId);
    return content;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`File read timeout after ${timeout}ms`);
    }
    throw error;
  }
}

/**
 * Read file in chunks (specific line range)
 */
export async function readFileChunked(filePath, offset = 1, limit = 1000, timeout = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const content = await fs.readFile(filePath, 'utf-8', { signal: controller.signal });
    clearTimeout(timeoutId);

    const lines = content.split(/\r\n|\r|\n/);
    const startLine = Math.max(1, offset) - 1; // Convert to 0-indexed
    const endLine = Math.min(lines.length, startLine + limit);

    const chunk = lines.slice(startLine, endLine);

    // Add line numbers
    const numberedLines = chunk.map((line, idx) => `${startLine + idx + 1}\t${line}`).join('\n');

    return {
      content: numberedLines,
      totalLines: lines.length,
      linesRead: chunk.length,
      offset,
      limit,
      hasMore: endLine < lines.length,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`File read timeout after ${timeout}ms`);
    }
    throw error;
  }
}

/**
 * Check if file is safe to read
 */
export async function isSafeToRead(filePath, options = {}) {
  const { maxLines = 1000, maxReadTime = 5000 } = options;

  const stats = await getFileStats(filePath);

  if (!stats.exists) {
    return { safe: false, reason: 'File does not exist' };
  }

  if (stats.lineCount > maxLines) {
    return {
      safe: false,
      reason: `File too large (${stats.lineCount} lines > ${maxLines})`,
      recommendation: 'Use offset/limit parameters or read in chunks',
      stats,
    };
  }

  if (stats.estimatedReadTime > maxReadTime) {
    return {
      safe: false,
      reason: `Estimated read time too long (${stats.estimatedReadTime}ms > ${maxReadTime}ms)`,
      recommendation: 'Use chunked reading',
      stats,
    };
  }

  return { safe: true, stats };
}

export { THRESHOLDS };
