/**
 * Project memory convention analysis methods
 *
 * This module extends the ProjectMemory class with methods for analyzing
 * naming conventions across files, directories, functions, classes, and variables.
 *
 * @module project-memory-conventions
 */

import path from 'path';
import { detectNamingPattern, getDominantPattern } from './project-memory-utils.js';
import { ProjectMemory } from './project-memory-core.js';

/**
 * Analyze naming conventions
 *
 * Analyzes naming patterns across the project to determine dominant conventions
 * for files, directories, functions, classes, and variables. Stores results in memory.
 *
 * @returns {Promise<Map>} Map of naming conventions by category and type
 *
 * @example
 * const conventions = await projectMemory.analyzeConventions();
 * // Debug log removed); // 'camelCase'
 * // Debug log removed); // 'kebab-case'
 */
ProjectMemory.prototype.analyzeConventions = async function () {
  const namingPatterns = {
    files: new Map(),
    directories: new Map(),
    functions: new Map(),
    classes: new Map(),
    variables: new Map(),
  };

  // Analyze file names
  for (const [filePath, fileInfo] of this.memory.structure.files) {
    const basename = path.basename(filePath, path.extname(filePath));
    const pattern = detectNamingPattern(basename);

    const key = path.extname(filePath).substring(1) || 'no_ext';
    const current = namingPatterns.files.get(key) || new Map();
    current.set(pattern, (current.get(pattern) || 0) + 1);
    namingPatterns.files.set(key, current);
  }

  // Analyze directory names
  for (const [dirPath, dirInfo] of this.memory.structure.directories) {
    const basename = path.basename(dirPath);
    const pattern = detectNamingPattern(basename);

    const current = namingPatterns.directories.get('dir') || new Map();
    current.set(pattern, (current.get(pattern) || 0) + 1);
    namingPatterns.directories.set('dir', current);
  }

  // Determine dominant patterns
  for (const [category, patterns] of Object.entries(namingPatterns)) {
    for (const [key, patternMap] of patterns) {
      const dominant = getDominantPattern(patternMap);
      if (dominant) {
        this.memory.conventions.naming.set(`${category}.${key}`, dominant);
      }
    }
  }

  this.memory.conventions.lastAnalyzed = Date.now();
  await this.save();

  return this.memory.conventions.naming;
};
