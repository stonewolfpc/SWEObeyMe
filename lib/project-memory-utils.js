/**
 * Helper functions for project memory
 * 
 * This module provides utility functions for naming pattern detection,
 * string conversion, and pattern analysis used throughout the project memory system.
 * 
 * @module project-memory-utils
 */

/**
 * Convert string to kebab-case
 * 
 * Transforms a string to kebab-case format by:
 * - Converting camelCase to kebab-case
 * - Replacing spaces and underscores with hyphens
 * - Converting to lowercase
 * 
 * @param {string} str - The string to convert
 * @returns {string} The kebab-case formatted string
 * 
 * @example
 * toKebabCase('myFunctionName') // 'my-function-name'
 * toKebabCase('my_function_name') // 'my-function-name'
 * toKebabCase('My Function Name') // 'my-function-name'
 */
export function toKebabCase(str) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/**
 * Detect naming pattern from a string
 * 
 * Analyzes a string to determine its naming convention pattern.
 * Supports detection of: snake_case, kebab-case, UPPER_SNAKE_CASE,
 * PascalCase, camelCase, and unknown patterns.
 * 
 * @param {string} str - The string to analyze
 * @returns {string} The detected naming pattern
 * 
 * @example
 * detectNamingPattern('my_function') // 'snake_case'
 * detectNamingPattern('my-function') // 'kebab-case'
 * detectNamingPattern('MY_CONSTANT') // 'UPPER_SNAKE_CASE'
 * detectNamingPattern('MyClass') // 'PascalCase'
 * detectNamingPattern('myVariable') // 'camelCase'
 */
export function detectNamingPattern(str) {
  if (str.includes('_') && str === str.toLowerCase()) {
    return 'snake_case';
  }
  if (str.includes('-') && str === str.toLowerCase()) {
    return 'kebab-case';
  }
  if (str === str.toUpperCase() && str.includes('_')) {
    return 'UPPER_SNAKE_CASE';
  }
  if (/^[A-Z]/.test(str) && !str.includes('_') && !str.includes('-')) {
    return 'PascalCase';
  }
  if (/^[a-z]/.test(str) && !str.includes('_') && !str.includes('-')) {
    return 'camelCase';
  }
  return 'unknown';
}

/**
 * Get dominant pattern from pattern counts
 * 
 * Analyzes a Map of pattern counts and returns the pattern with the
 * highest count. Used to determine the most common naming pattern
 * in a codebase.
 * 
 * @param {Map<string, number>} patternMap - A Map of pattern names to their counts
 * @returns {string|null} The dominant pattern, or null if map is empty
 * 
 * @example
 * const patternMap = new Map([
 *   ['camelCase', 10],
 *   ['PascalCase', 5],
 *   ['snake_case', 2]
 * ]);
 * getDominantPattern(patternMap) // 'camelCase'
 */
export function getDominantPattern(patternMap) {
  let maxCount = 0;
  let dominant = null;
  
  for (const [pattern, count] of patternMap) {
    if (count > maxCount) {
      maxCount = count;
      dominant = pattern;
    }
  }
  
  return dominant;
}
