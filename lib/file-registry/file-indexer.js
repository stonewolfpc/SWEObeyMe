/**
 * File Indexer
 * 
 * Responsibility: Index files and track metadata
 * Separated from: file-registry.js (SoC compliance)
 * 
 * @module lib/file-registry/file-indexer
 */

import fs from 'fs/promises';
import path from 'path';
import { calculateHash } from './file-hash.js';

/**
 * Index a single file
 * @param {string} filePath - File path
 * @returns {Object|null} File metadata or null if error
 */
export async function indexFile(filePath) {
  try {
    const stats = await fs.stat(filePath);
    const content = await fs.readFile(filePath, 'utf-8');
    const hash = calculateHash(content);
    const dir = path.dirname(filePath);

    const metadata = {
      path: filePath,
      hash,
      size: stats.size,
      modified: stats.mtime,
      indexed: Date.now(),
      directory: dir,
      basename: path.basename(filePath),
      extension: path.extname(filePath),
    };

    return metadata;
  } catch (error) {
    // File might not exist or be inaccessible
    return null;
  }
}

/**
 * Index entire project directory
 * @param {string} rootDir - Root directory to index
 * @param {Object} options - Indexing options
 * @returns {Object} Indexing results
 */
export async function indexProject(rootDir, options = {}) {
  const {
    ignorePatterns = ['node_modules', '.git', 'dist', 'build', 'bin', 'obj'],
    maxDepth = 20,
    onProgress = null,
  } = options;

  const files = new Map();
  const fileHashes = new Map();
  const directories = new Map();
  const lastIndexTime = Date.now();

  let indexedCount = 0;
  let skippedCount = 0;

  const indexDirectory = async (dir, depth = 0) => {
    if (depth > maxDepth) return;

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        // Skip ignored patterns
        if (ignorePatterns.some(pattern => fullPath.includes(pattern))) {
          skippedCount++;
          continue;
        }

        if (entry.isDirectory()) {
          await indexDirectory(fullPath, depth + 1);
        } else if (entry.isFile()) {
          const metadata = await indexFile(fullPath);
          if (metadata) {
            files.set(fullPath, metadata);

            // Store hash mapping for duplicate detection
            if (!fileHashes.has(metadata.hash)) {
              fileHashes.set(metadata.hash, new Set());
            }
            fileHashes.get(metadata.hash).add(fullPath);

            // Store directory mapping
            if (!directories.has(metadata.directory)) {
              directories.set(metadata.directory, new Set());
            }
            directories.get(metadata.directory).add(fullPath);

            indexedCount++;
            if (onProgress && indexedCount % 100 === 0) {
              onProgress(indexedCount, fullPath);
            }
          }
        }
      }
    } catch (error) {
      // Directory might be inaccessible
      console.error(`[FILE-INDEXER] Error indexing directory ${dir}: ${error.message}`);
    }
  };

  await indexDirectory(rootDir);

  console.error(`[FILE-INDEXER] Indexed ${indexedCount} files, skipped ${skippedCount} files`);

  return {
    files,
    fileHashes,
    directories,
    lastIndexTime,
    indexedCount,
    skippedCount,
  };
}
