/**
 * File Duplicate Detector
 *
 * Responsibility: Detect duplicate files by content
 * Separated from: file-registry.js (SoC compliance)
 *
 * @module lib/file-registry/file-duplicate-detector
 */

import path from 'path';
import { calculateHash } from './file-hash.js';

/**
 * Find duplicate files by content hash
 * @param {Map} fileHashes - Map of hash to file paths
 * @param {string} filePath - File path to check
 * @param {string} content - File content
 * @returns {Array} Array of duplicate file paths
 */
export function findDuplicateFiles(fileHashes, filePath, content) {
  const hash = calculateHash(content);
  const duplicates = fileHashes.get(hash);

  if (!duplicates) {
    return [];
  }

  // Return all files with same hash except the current one
  return Array.from(duplicates).filter((p) => p !== filePath);
}

/**
 * Find files with same name in directory
 * @param {Map} directories - Map of directory to file paths
 * @param {string} filePath - File path to check
 * @returns {Array} Array of file paths with same name
 */
export function findSameNameFiles(directories, filePath) {
  const dir = path.dirname(filePath);
  const basename = path.basename(filePath);
  const filesInDir = directories.get(dir);

  if (!filesInDir) {
    return [];
  }

  return Array.from(filesInDir).filter((p) => {
    const otherBasename = path.basename(p);
    return otherBasename === basename && p !== filePath;
  });
}

/**
 * Find similar files by name similarity
 * @param {Map} files - Map of file paths to metadata
 * @param {string} filePath - File path to check
 * @param {Function} calculateSimilarity - Similarity calculation function
 * @param {number} threshold - Similarity threshold (default 0.7)
 * @returns {Array} Array of similar files with similarity scores
 */
export function findSimilarFiles(files, filePath, calculateSimilarity, threshold = 0.7) {
  const basename = path.basename(filePath, path.extname(filePath));
  const similarFiles = [];

  for (const [otherPath] of files) {
    if (otherPath === filePath) continue;

    const otherBasename = path.basename(otherPath, path.extname(otherPath));
    const similarity = calculateSimilarity(basename, otherBasename);

    if (similarity >= threshold) {
      similarFiles.push({
        path: otherPath,
        similarity,
        basename: otherBasename,
      });
    }
  }

  return similarFiles.sort((a, b) => b.similarity - a.similarity);
}
