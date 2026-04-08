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

  structure.dirs.forEach(dir => {
    this.memory.structure.directories.set(dir, {
      path: dir,
      relativePath: path.relative(this.workspacePath, dir),
      fileCount: structure.dirFileCounts[dir] || 0,
    });
  });

  structure.files.forEach(file => {
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
 * Scan directory recursively
 *
 * Recursively scans a directory and its subdirectories, collecting all
 * directories and files. Excludes specified directories (e.g., .git, node_modules).
 *
 * @param {string} dir - The root directory to scan
 * @param {string[]} excludeDirs - Array of directory names to exclude (default: ['.git', 'node_modules', '.vscode'])
 * @returns {Promise<Object>} Object containing dirs array, files array, and dirFileCounts object
 *
 * @example
 * const result = await projectMemory.scanDirectory('/path/to/project');
 * console.log(result.dirs.length); // Number of directories
 * console.log(result.files.length); // Number of files
 */
ProjectMemory.prototype.scanDirectory = async function (dir, excludeDirs = ['.git', 'node_modules', '.vscode']) {
  const dirs = [];
  const files = [];
  const dirFileCounts = {};

  async function scan(currentDir) {
    try {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        const relativePath = path.relative(dir, fullPath);

        if (excludeDirs.some(ex => relativePath.startsWith(ex))) {
          continue;
        }

        if (entry.isDirectory()) {
          dirs.push(fullPath);
          await scan(fullPath);
        } else {
          files.push(fullPath);
          dirFileCounts[currentDir] = (dirFileCounts[currentDir] || 0) + 1;
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }

  await scan(dir);
  return { dirs, files, dirFileCounts };
};
