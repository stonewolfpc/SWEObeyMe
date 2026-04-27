/**
 * Project memory file location suggestions and project map updates
 *
 * This module extends the ProjectMemory class with methods for suggesting
 * file locations based on conventions and updating the project map after
 * file operations.
 *
 * @module project-memory-location
 */

import path from 'path';
import { ProjectMemory } from './project-memory-core.js';

/**
 * Suggest file location based on conventions
 *
 * Suggests appropriate directory locations for a file based on its type
 * and existing project structure. Returns suggestions sorted by confidence.
 *
 * @param {string} fileType - The file extension (e.g., 'js', 'ts', 'md')
 * @param {string} purpose - The purpose of the file (optional)
 * @returns {Array<Object>} Array of location suggestions with path, confidence, and reason
 *
 * @example
 * const suggestions = projectMemory.suggestFileLocation('js', 'Utility functions');
 * // Debug log removed // [{ path: '/path/to/utils', confidence: 0.8, reason: 'Utilities directory' }, ...]
 */
ProjectMemory.prototype.suggestFileLocation = function (fileType, purpose) {
  const suggestions = [];

  // Check existing structure
  for (const [dirPath, dirInfo] of this.memory.structure.directories) {
    const dirName = path.basename(dirPath);

    // Common patterns
    if (fileType === 'js' || fileType === 'ts') {
      if (dirName === 'lib' || dirName === 'src') {
        suggestions.push({ path: dirPath, confidence: 0.9, reason: 'Source code directory' });
      }
      if (dirName === 'utils') {
        suggestions.push({ path: dirPath, confidence: 0.8, reason: 'Utilities directory' });
      }
      if (dirName === 'tests') {
        suggestions.push({ path: dirPath, confidence: 0.7, reason: 'Tests directory' });
      }
    }

    if (fileType === 'md') {
      if (dirName === 'docs') {
        suggestions.push({ path: dirPath, confidence: 0.9, reason: 'Documentation directory' });
      }
    }
  }

  // Sort by confidence
  suggestions.sort((a, b) => b.confidence - a.confidence);

  return suggestions;
};

/**
 * Suggest location for a file based on domain
 *
 * Suggests an appropriate folder location for a file based on its domain
 * as defined in the project map conventions.
 *
 * @param {string} filePath - The file path to analyze
 * @param {string} filePurpose - The purpose of the file (optional)
 * @returns {Object} Suggestion object with domain, suggestedFolder, and testLocation
 *
 * @example
 * const suggestion = projectMemory.suggestLocationForFile('/path/to/auth-service.js', 'Authentication');
 * // Debug log removed // { domain: 'auth', suggestedFolder: 'auth/', testLocation: 'tests/auth/' }
 */
ProjectMemory.prototype.suggestLocationForFile = function (filePath, filePurpose) {
  const domains = this.projectMap?.conventions?.domains || {};
  const ext = path.extname(filePath).substring(1);

  // Try to detect domain from purpose or file name
  const basename = path.basename(filePath, path.extname(filePath)).toLowerCase();

  for (const [domainName, domainConfig] of Object.entries(domains)) {
    if (
      domainConfig.allowedFileTypes.includes(basename) ||
      basename.includes(domainName) ||
      (filePurpose && filePurpose.toLowerCase().includes(domainName))
    ) {
      return {
        domain: domainName,
        suggestedFolder: domainConfig.folder,
        testLocation: domainConfig.testLocation,
      };
    }
  }

  // Default suggestions based on extension
  if (['js', 'ts', 'jsx', 'tsx'].includes(ext)) {
    return { domain: 'services', suggestedFolder: 'services/', testLocation: 'tests/services/' };
  }
  if (['md'].includes(ext)) {
    return { domain: 'docs', suggestedFolder: 'docs/', testLocation: null };
  }

  return { domain: 'unknown', suggestedFolder: 'lib/', testLocation: 'tests/' };
};

/**
 * Update project map after file operation
 *
 * Updates the project map structure after a file operation (create, update,
 * delete, move). Stores file metadata including purpose, domain, conceptual
 * units, dependencies, and timestamps.
 *
 * @param {string} filePath - The file path that was operated on
 * @param {string} operation - The operation type: 'create', 'update', 'delete', or 'move'
 * @param {Object} metadata - Additional metadata about the file operation
 * @param {string} metadata.purpose - The file purpose
 * @param {string} metadata.module - The module name
 * @param {string} metadata.domain - The domain
 * @param {string} metadata.code - The source code (for domain detection)
 * @param {Array} metadata.conceptualUnits - Array of conceptual units
 * @param {Array} metadata.dependencies - Array of dependencies
 * @param {number} metadata.lineCount - Line count of the file
 * @param {string} metadata.createdAt - Creation timestamp
 * @param {string} metadata.oldPath - Old file path (for move operation)
 * @returns {Promise<boolean>} True if update was successful
 *
 * @example
 * await projectMemory.updateProjectMapForFile('/path/to/file.js', 'create', {
 *   purpose: 'Authentication service',
 *   domain: 'auth',
 *   lineCount: 150
 * });
 */
ProjectMemory.prototype.updateProjectMapForFile = async function (
  filePath,
  operation,
  metadata = {}
) {
  if (!this.projectMap) {
    await this.loadProjectMap();
  }

  const relativePath = path.relative(this.workspacePath, filePath);

  if (operation === 'create' || operation === 'update') {
    this.projectMap.structure.files[relativePath] = {
      purpose: metadata.purpose || 'Unknown',
      module: metadata.module || 'Unknown',
      domain: metadata.domain || this.detectDomain(metadata.code || ''),
      conceptualUnits: metadata.conceptualUnits || [],
      dependencies: metadata.dependencies || [],
      lineCount: metadata.lineCount || 0,
      createdAt: metadata.createdAt || new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };
  } else if (operation === 'delete') {
    delete this.projectMap.structure.files[relativePath];
  } else if (operation === 'move') {
    const oldPath = metadata.oldPath;
    const oldRelativePath = path.relative(this.workspacePath, oldPath);

    // Move file metadata
    const fileData = this.projectMap.structure.files[oldRelativePath];
    if (fileData) {
      delete this.projectMap.structure.files[oldRelativePath];
      this.projectMap.structure.files[relativePath] = fileData;
      this.projectMap.structure.files[relativePath].lastModified = new Date().toISOString();
    }
  }

  this.projectMap.audit.lastUpdated = new Date().toISOString();
  await this.saveProjectMap();

  return true;
};
