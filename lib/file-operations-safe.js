/**
 * Safe File Operations
 * Provides timeout-protected, chunked file operations to prevent hangs on large files
 */

import fs from 'fs/promises';
import { createReadStream } from 'fs';
import readline from 'readline';
import path from 'path';

/**
 * File size thresholds (in bytes for size-based strategy)
 */
const THRESHOLDS = {
  SMALL: 100, // lines
  MEDIUM: 500, // lines
  LARGE: 2000, // lines
  HUGE: 10000, // lines
  SIZE_SMALL: 1024 * 1024, // 1MB
  SIZE_MEDIUM: 10 * 1024 * 1024, // 10MB
  SIZE_LARGE: 100 * 1024 * 1024, // 100MB
};

/**
 * Stat result cache to avoid recounting
 */
const statCache = new Map();
const CACHE_TTL = 5000; // 5 seconds

/**
 * Get file statistics without reading content
 * Uses size-based strategy to avoid unnecessary line counting
 */
export async function getFileStats(filePath, options = {}) {
  const { maxLinesToCount = Infinity, timeoutMs = 30000 } = options;

  // Check cache first
  const cacheKey = filePath;
  const cached = statCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    // Wrap fs.stat in timeout to prevent hangs on locked/network files
    const statPromise = fs.stat(filePath);
    const statTimeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`fs.stat timeout after 5000ms for ${filePath}`)), 5000)
    );
    const stats = await Promise.race([statPromise, statTimeoutPromise]);

    // Size-based line counting strategy
    let lineCount, lineCountTruncated;

    if (stats.size < THRESHOLDS.SIZE_SMALL) {
      // Small files: count all lines using fast buffer scanning
      const result = await countLinesBuffered(filePath, maxLinesToCount, timeoutMs);
      lineCount = result.count;
      lineCountTruncated = result.truncated;
    } else if (stats.size < THRESHOLDS.SIZE_MEDIUM) {
      // Medium files: count first 1000 lines to estimate
      const result = await countLinesBuffered(filePath, 1000, 2000);
      const avgLineLength = stats.size / result.count;
      lineCount = Math.floor(stats.size / avgLineLength);
      lineCountTruncated = true;
    } else if (stats.size < THRESHOLDS.SIZE_LARGE) {
      // Large files: use size / 100 chars as estimate
      lineCount = Math.floor(stats.size / 100);
      lineCountTruncated = true;
    } else {
      // Huge files: return massive category without counting
      lineCount = Math.floor(stats.size / 100);
      lineCountTruncated = true;
    }

    const result = {
      exists: true,
      size: stats.size,
      lineCount,
      lineCountTruncated,
      category: categorizeFileSize(lineCount),
      estimatedReadTime: estimateReadTime(stats.size),
    };

    // Cache the result
    statCache.set(cacheKey, { timestamp: Date.now(), data: result });

    return result;
  } catch (error) {
    return {
      exists: false,
      error: error.message,
    };
  }
}

/**
 * Fast line counting using raw buffer scanning (5-10x faster than readline)
 * Counts newlines in chunks without loading entire file into memory
 */
function countLinesBuffered(filePath, maxLines = Infinity, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    let count = 0;
    let finished = false;
    let truncated = false;
    let bytesScanned = 0;

    const stream = createReadStream(filePath, { highWaterMark: 64 * 1024 }); // 64KB chunks

    const timeoutId = setTimeout(() => {
      if (finished) return;
      finished = true;
      truncated = true;
      stream.destroy();
      resolve({ count, truncated });
    }, timeoutMs);

    stream.on('data', (chunk) => {
      if (finished) return;

      bytesScanned += chunk.length;

      // Count newlines in this chunk
      for (let i = 0; i < chunk.length; i++) {
        if (chunk[i] === 10) {
          // newline character
          count++;
          if (count >= maxLines) {
            finished = true;
            truncated = true;
            clearTimeout(timeoutId);
            stream.destroy();
            resolve({ count, truncated });
            return;
          }
        }
      }

      // Early termination for very large files (stop after scanning 10MB)
      if (bytesScanned > 10 * 1024 * 1024) {
        finished = true;
        truncated = true;
        clearTimeout(timeoutId);
        stream.destroy();
        resolve({ count, truncated });
      }
    });

    stream.on('end', () => {
      if (finished) return;
      finished = true;
      clearTimeout(timeoutId);
      resolve({ count, truncated });
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
 * Stream-count lines in a file without loading it into memory.
 * Uses readline for compatibility (slower but handles edge cases)
 * DEPRECATED: Use countLinesBuffered for better performance
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
