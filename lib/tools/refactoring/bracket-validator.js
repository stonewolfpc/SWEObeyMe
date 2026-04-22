/**
 * Bracket Validator
 * 
 * Responsibility: Validate bracket balance to prevent structure corruption
 * Separated from: handlers-refactoring.js (SoC compliance)
 * 
 * @module lib/tools/refactoring/bracket-validator
 */

import { validateSyntax } from '../../validation.js';

/**
 * Validate bracket balance before and after refactoring
 * @param {string} content - File content
 * @param {string} filePath - File path
 * @returns {Object} Validation result
 */
export function validateBracketBalance(content, filePath) {
  const result = validateSyntax(content);
  if (!result.valid && result.bracketErrors && result.bracketErrors.length > 0) {
    return {
      valid: false,
      errors: result.bracketErrors.map(err => err.message),
    };
  }
  return { valid: true, errors: [] };
}
