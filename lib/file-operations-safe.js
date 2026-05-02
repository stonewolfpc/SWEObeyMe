/**
 * Safe File Operations
 * Provides timeout-protected, chunked file operations to prevent hangs on large files
 */

import fs from 'fs/promises';
import { createReadStream } from 'fs';
import readline from 'readline';
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
export async function getFileStats(filePath, options = {}) {
  const { maxLinesToCount = Infinity, timeoutMs = 30000 } = options;

  try {
    // Wrap fs.stat in timeout to prevent hangs on locked/network files
    const statPromise = fs.stat(filePath);
    const statTimeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`fs.stat timeout after 5000ms for ${filePath}`)), 5000)
    );
    const stats = await Promise.race([statPromise, statTimeoutPromise]);

    // Stream-count lines - never loads entire file into memory
    const { count: lineCount, truncated: lineCountTruncated } = await countLinesStreaming(
      filePath,
      maxLinesToCount,
      timeoutMs
    );

    return {
      exists: true,
      size: stats.size,
      lineCount,
      lineCountTruncated,
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
 * Stream-count lines in a file without loading it into memory.
 * Works on files of ANY size - 10 lines or 10 million lines.
 * Safety-net timeout resolves with partial count if exceeded.
 */
function countLinesStreaming(filePath, maxLines = Infinity, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    let count = 0;
    let finished = false;
    let truncated = false;

    const stream = createReadStream(filePath);
    const rl = readline.createInterface({
      input: stream,
      crlfDelay: Infinity,
    });

    const timeoutId = setTimeout(() => {
      if (finished) return;
      finished = true;
      truncated = true;
      stream.destroy();
      rl.close();
      resolve({ count, truncated });
    }, timeoutMs);

    rl.on('line', () => {
      count++;
      if (count >= maxLines) {
        if (finished) return;
        finished = true;
        truncated = true;
        clearTimeout(timeoutId);
        stream.destroy();
        rl.close();
        resolve({ count, truncated });
      }
    });

    rl.on('close', () => {
      if (finished) return;
      finished = true;
      clearTimeout(timeoutId);
      resolve({ count, truncated });
    });

    rl.on('error', (err) => {
      if (finished) return;
      finished = true;
      clearTimeout(timeoutId);
      reject(err);
    });

    stream.on('error', (err) => {
      if (finished) return;
      finished = true;
      clearTimeout(timeoutId);
      reject(err);
    });
  });
}

/**
 * Stream-read specific line range from a file without loading entire file.
 * Safety-net timeout resolves with partial results if exceeded.
 */
function readLinesStreaming(filePath, startLine = 1, lineLimit = 1000, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const lines = [];
    let currentLine = 0;
    let finished = false;
    const endLine = startLine + lineLimit - 1;

    const stream = createReadStream(filePath);
    const rl = readline.createInterface({
      input: stream,
      crlfDelay: Infinity,
    });

    const timeoutId = setTimeout(() => {
      if (finished) return;
      finished = true;
      stream.destroy();
      rl.close();
      resolve({
        content: lines.map((line, i) => `${startLine + i}\t${line}`).join('\n'),
        totalLines: currentLine,
        linesRead: lines.length,
        offset: startLine,
        limit: lineLimit,
        hasMore: true,
        timedOut: true,
      });
    }, timeoutMs);

    rl.on('line', (line) => {
      currentLine++;
      if (currentLine >= startLine && currentLine <= endLine) {
        lines.push(line);
      }
      if (currentLine > endLine) {
        if (finished) return;
        finished = true;
        clearTimeout(timeoutId);
        stream.destroy();
        rl.close();
        resolve({
          content: lines.map((line, i) => `${startLine + i}\t${line}`).join('\n'),
          totalLines: currentLine,
          linesRead: lines.length,
          offset: startLine,
          limit: lineLimit,
          hasMore: true,
          timedOut: false,
        });
      }
    });

    rl.on('close', () => {
      if (finished) return;
      finished = true;
      clearTimeout(timeoutId);
      resolve({
        content: lines.map((line, i) => `${startLine + i}\t${line}`).join('\n'),
        totalLines: currentLine,
        linesRead: lines.length,
        offset: startLine,
        limit: lineLimit,
        hasMore: false,
        timedOut: false,
      });
    });

    rl.on('error', (err) => {
      if (finished) return;
      finished = true;
      clearTimeout(timeoutId);
      reject(err);
    });

    stream.on('error', (err) => {
      if (finished) return;
      finished = true;
      clearTimeout(timeoutId);
      reject(err);
    });
  });
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
  const { timeout = 30000, offset = 1, limit = 1000, maxLines = 1000 } = options;

  const stats = await getFileStats(filePath, { timeoutMs: 5000 });

  if (!stats.exists) {
    throw new Error(`File does not exist: ${filePath}`);
  }

  // For small files, read normally
  if (stats.lineCount <= THRESHOLDS.MEDIUM) {
    return fs.readFile(filePath, 'utf-8');
  }

  // For larger files, read only the requested chunk via streaming
  if (stats.lineCount > maxLines) {
    const result = await readLinesStreaming(filePath, offset, Math.min(limit, maxLines), timeout);
    return result.content;
  }

  return fs.readFile(filePath, 'utf-8');
}

/**
 * Read file in chunks (specific line range) using streaming.
 * Never loads the entire file into memory.
 */
export async function readFileChunked(filePath, offset = 1, limit = 1000, timeout = 30000) {
  return readLinesStreaming(filePath, offset, limit, timeout);
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
