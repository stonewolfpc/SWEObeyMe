/**
 * Project memory structure indexing and scanning methods
 *
 * This module extends the ProjectMemory class with methods for indexing
 * and scanning the project directory structure, including directories,
 * files, and file counts per directory.
 *
 * @module project-memory-structure
 */

import fs from 'fs/promises';
import path from 'path';
import { ProjectMemory } from './project-memory-core.js';
import { readdirSafe, withTimeout } from './shared/async-utils.js';

/**
 * Index project structure
 *
 * Scans the project directory and indexes all directories and files,
 * storing their metadata in memory. This includes relative paths,
 * file extensions, basenames, and file counts per directory.
 *
 * @param {string} directory - The directory to index (defaults to workspacePath)
 * @returns {Promise<Object>} Structure object containing dirs, files, and dirFileCounts
 *
 * @example
 * const structure = await projectMemory.indexStructure();
 * console.log(structure.dirs); // Array of directory paths
 * console.log(structure.files); // Array of file paths
 * console.log(structure.dirFileCounts); // Object with file counts per directory
 */
ProjectMemory.prototype.indexStructure = async function (directory = this.workspacePath) {
  const structure = await this.scanDirectory(directory);

  this.memory.structure.directories = new Map();
  this.memory.structure.files = new Map();

  structure.dirs.forEach((dir) => {
    this.memory.structure.directories.set(dir, {
      path: dir,
      relativePath: path.relative(this.workspacePath, dir),
      fileCount: structure.dirFileCounts[dir] || 0,
    });
  });

  structure.files.forEach((file) => {
    this.memory.structure.files.set(file, {
      path: file,
      relativePath: path.relative(this.workspacePath, file),
      extension: path.extname(file),
      basename: path.basename(file),
    });
  });

  this.memory.structure.lastIndexed = Date.now();
  await this.save();

  return structure;
};

/**
 * Scan directory recursively with timeout protection
 *
 * Recursively scans a directory and its subdirectories, collecting all
 * directories and files. Excludes specified directories (e.g., .git, node_modules).
 * Added timeout protection, depth limiting, and circular reference detection to prevent hanging.
 *
 * @param {string} dir - The root directory to scan
 * @param {string[]} excludeDirs - Array of directory names to exclude (default: ['.git', 'node_modules', '.vscode'])
 * @param {Object} options - Options for scanning
 * @param {number} options.maxDepth - Maximum directory depth (default: 15)
 * @param {number} options.timeoutMs - Timeout in milliseconds (default: 30000)
 * @returns {Promise<Object>} Object containing dirs array, files array, and dirFileCounts object
 *
 * @example
 * const result = await projectMemory.scanDirectory('/path/to/project');
 * console.log(result.dirs.length); // Number of directories
 * console.log(result.files.length); // Number of files
 */
ProjectMemory.prototype.scanDirectory = async function (
  dir,
  excludeDirs = ['.git', 'node_modules', '.vscode'],
  options = {}
) {
  const { maxDepth = 15, timeoutMs = 30000 } = options;
  const dirs = [];
  const files = [];
  const dirFileCounts = {};
  const startTime = Date.now();
  const visitedDirs = new Set();

  async function scan(currentDir, depth = 0) {
    // Check timeout
    if (Date.now() - startTime > timeoutMs) {
      throw new Error(`Scan timeout after ${timeoutMs}ms`);
    }

    // Check depth limit
    if (depth > maxDepth) {
      return;
    }

    // Check for circular references
    const normalizedDir = path.normalize(currentDir);
    if (visitedDirs.has(normalizedDir)) {
      return;
    }
    visitedDirs.add(normalizedDir);

    try {
      const entries = await readdirSafe(currentDir, { withFileTypes: true }, 5000, 'scanDirectory');

      for (const entry of entries) {
        // Check timeout again during iteration
        if (Date.now() - startTime > timeoutMs) {
          throw new Error(`Scan timeout after ${timeoutMs}ms`);
        }

        const fullPath = path.join(currentDir, entry.name);
        const relativePath = path.relative(dir, fullPath);

        if (excludeDirs.some((ex) => relativePath.startsWith(ex))) {
          continue;
        }

        if (entry.isDirectory()) {
          dirs.push(fullPath);
          await scan(fullPath, depth + 1);
        } else {
          files.push(fullPath);
          dirFileCounts[currentDir] = (dirFileCounts[currentDir] || 0) + 1;
        }
      }
    } catch (e) {
      // Skip directories we can't read or timeout errors
      if (e.message && e.message.includes('timeout')) {
        throw e;
      }
    }
  }

  try {
    await scan(dir);
  } catch (e) {
    if (e.message && e.message.includes('timeout')) {
      console.warn(
        `[scanDirectory] Scan timed out after ${timeoutMs}ms, returning ${dirs.length} dirs and ${files.length} files (partial results)`
      );
    } else {
      throw e;
    }
  }

  return { dirs, files, dirFileCounts };
};
