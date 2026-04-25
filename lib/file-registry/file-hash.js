/**
 * File Hash Calculator
 *
 * Responsibility: Calculate cryptographic hashes for file content comparison
 * Separated from: file-registry.js (SoC compliance)
 *
 * @module lib/file-registry/file-hash
 */

import crypto from 'crypto';

/**
 * Calculate file hash for content comparison
 * @param {string} content - File content
 * @returns {string} MD5 hash
 */
export function calculateHash(content) {
  return crypto.createHash('md5').update(content).digest('hex');
}
