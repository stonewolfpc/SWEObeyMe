/**
 * Project memory validation methods
 *
 * This module extends the ProjectMemory class with methods for validating
 * file splitting needs, file locations against architectural boundaries,
 * and file naming conventions.
 *
 * @module project-memory-validation
 */

import path from 'path';
import { toKebabCase } from './project-memory-utils.js';
import { ProjectMemory } from './project-memory-core.js';

/**
 * Evaluate if file should be split based on separation of concerns
 *
 * Evaluates a file against separation of concerns rules to determine if it
 * should be split into smaller modules. Checks conceptual units count,
 * line count, and minimum lines for splitting.
 *
 * @param {string} filePath - The file path to evaluate
 * @param {string} code - The source code to evaluate
 * @returns {Object} Evaluation result with shouldSplit flag, violations, units, and lineCount
 *
 * @example
 * const result = projectMemory.evaluateFileSplit('/path/to/file.js', code);
 * // Debug log removed // true if file should be split
 * // Debug log removed // Array of violation objects
 */
ProjectMemory.prototype.evaluateFileSplit = function (filePath, code) {
  const rules = this.projectMap?.rules?.separationOfConcerns || {};
  const lineCount = code.split('\n').length;
  const conceptualUnits = this.detectConceptualUnits(code);

  const violations = [];

  // Check max conceptual units
  if (rules.maxConceptualUnitsPerFile && conceptualUnits.length > rules.maxConceptualUnitsPerFile) {
    violations.push({
      type: 'too_many_concepts',
      message: `File contains ${conceptualUnits.length} conceptual units, max allowed is ${rules.maxConceptualUnitsPerFile}`,
      units: conceptualUnits,
    });
  }

  // Check max lines
  if (rules.maxLinesPerFile && lineCount > rules.maxLinesPerFile) {
    violations.push({
      type: 'too_long',
      message: `File has ${lineCount} lines, max allowed is ${rules.maxLinesPerFile}`,
      lineCount,
    });
  }

  // Check if should split
  if (rules.minLinesForSplit && lineCount > rules.minLinesForSplit && conceptualUnits.length > 1) {
    violations.push({
      type: 'should_split',
      message: `File exceeds ${rules.minLinesForSplit} lines with multiple conceptual units, consider splitting`,
      lineCount,
      units: conceptualUnits,
    });
  }

  return {
    shouldSplit: violations.length > 0,
    violations,
    conceptualUnits,
    lineCount,
  };
};

/**
 * Check if file belongs in current folder
 *
 * Validates that a file is in an appropriate location according to
 * architectural boundaries. Checks if files in root directory are allowed.
 *
 * @param {string} filePath - The file path to validate
 * @param {string} filePurpose - The purpose of the file (optional)
 * @returns {Object} Validation result with valid flag and violations array
 *
 * @example
 * const result = projectMemory.validateFileLocation('/path/to/file.js', 'Utility functions');
 * // Debug log removed // true if location is valid
 * // Debug log removed // Array of violation objects
 */
ProjectMemory.prototype.validateFileLocation = function (filePath, filePurpose) {
  const rules = this.projectMap?.conventions?.architecturalBoundaries || {};
  const violations = [];

  // Check if file is in root (no dumping in root)
  const relativePath = path.relative(this.workspacePath, filePath);
  const pathParts = relativePath.split(path.sep);

  if (pathParts.length === 1) {
    // File is in root
    const rootAllowed = rules.root?.allowedItems || [];
    const basename = path.basename(filePath);

    if (!rootAllowed.some((allowed) => basename.includes(allowed))) {
      violations.push({
        type: 'file_in_root',
        message: `File "${basename}" is in root directory but is not allowed. Root may only contain: ${rootAllowed.join(', ')}`,
        suggestedLocation: this.suggestLocationForFile(filePath, filePurpose),
      });
    }
  }

  return {
    valid: violations.length === 0,
    violations,
  };
};

/**
 * Validate file naming conventions
 *
 * Validates that a file name follows the project's naming conventions,
 * such as kebab-case for files.
 *
 * @param {string} filePath - The file path to validate
 * @returns {Object} Validation result with valid flag and violations array
 *
 * @example
 * const result = projectMemory.validateFileName('/path/to/MyFile.js');
 * // Debug log removed // false if naming convention violated
 * // Debug log removed // 'my-file.js'
 */
ProjectMemory.prototype.validateFileName = function (filePath) {
  const rules = this.projectMap?.rules?.naming || {};
  const basename = path.basename(filePath, path.extname(filePath));
  const violations = [];

  // Check kebab-case for files
  if (rules.enforceKebabCaseForFiles && !/^[a-z][a-z0-9-]*$/.test(basename)) {
    violations.push({
      type: 'naming_convention',
      message: `File name "${basename}" should use kebab-case (lowercase with hyphens)`,
      suggestedName: toKebabCase(basename),
    });
  }

  return {
    valid: violations.length === 0,
    violations,
  };
};
