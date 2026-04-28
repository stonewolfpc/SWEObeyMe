/**
 * Shared Async Utilities
 * Common timeout and async operation utilities for SWEObeyMe
 */

import fs from 'fs/promises';

/**
 * Timeout wrapper for async operations
 */
export async function withTimeout(promise, timeoutMs, operationName) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`Timeout: ${operationName} exceeded ${timeoutMs}ms`)),
        timeoutMs
      )
    ),
  ]);
}

/**
 * Safe file read with timeout
 */
export async function readFileSafe(filePath, timeoutMs = 10000, operationName = 'readFile') {
  return withTimeout(fs.readFile(filePath, 'utf8'), timeoutMs, `${operationName} ${filePath}`);
}

/**
 * Safe file write with timeout
 */
export async function writeFileSafe(
  filePath,
  content,
  timeoutMs = 10000,
  operationName = 'writeFile'
) {
  return withTimeout(
    fs.writeFile(filePath, content, 'utf8'),
    timeoutMs,
    `${operationName} ${filePath}`
  );
}

/**
 * Safe directory read with timeout
 */
export async function readdirSafe(dir, options = {}, timeoutMs = 5000, operationName = 'readdir') {
  return withTimeout(fs.readdir(dir, options), timeoutMs, `${operationName} ${dir}`);
}

/**
 * Safe file existence check with timeout
 */
export async function existsSafe(filePath, timeoutMs = 1000, operationName = 'exists') {
  try {
    return await withTimeout(fs.access(filePath), timeoutMs, `${operationName} ${filePath}`);
  } catch {
    return false;
  }
}

/**
 * Safe file read with size limit and timeout.
 * Rejects if file exceeds maxSizeBytes to prevent OOM on massive files.
 */
export async function readFileWithSizeLimit(
  filePath,
  maxSizeBytes = 5 * 1024 * 1024,
  timeoutMs = 10000
) {
  const stats = await fs.stat(filePath);
  if (stats.size > maxSizeBytes) {
    throw new Error(
      `File size (${(stats.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed ` +
        `(${(maxSizeBytes / 1024 / 1024).toFixed(0)}MB). Use chunked reading or read specific sections.`
    );
  }
  return withTimeout(fs.readFile(filePath, 'utf8'), timeoutMs, `readFileWithSizeLimit ${filePath}`);
}
