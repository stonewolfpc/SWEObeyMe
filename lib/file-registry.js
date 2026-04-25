/**
 * File Registry System
 * Tracks all files in the project to prevent duplication and ensure proper auditing
 * Critical for massive projects with thousands of files
 *
 * Responsibility: Orchestrate file indexing and querying
 * Delegates to: file-indexer, file-duplicate-detector, file-similarity (SoC compliance)
 */

import path from 'path';
import { indexFile, indexProject } from './file-registry/file-indexer.js';
import { calculateHash } from './file-registry/file-hash.js';
import { calculateStringSimilarity } from './file-registry/file-similarity.js';
import {
  findDuplicateFiles as findDuplicateFilesImpl,
  findSameNameFiles as findSameNameFilesImpl,
  findSimilarFiles as findSimilarFilesImpl,
} from './file-registry/file-duplicate-detector.js';

/**
 * File Registry - maintains a comprehensive index of all project files
 */
class FileRegistry {
  constructor() {
    this.files = new Map(); // path -> FileMetadata
    this.fileHashes = new Map(); // hash -> Set of file paths
    this.directories = new Map(); // directory -> Set of file paths
    this.lastIndexTime = 0;
    this.indexed = false;
  }

  /**
   * Index a single file
   */
  async indexFile(filePath) {
    const metadata = await indexFile(filePath);
    if (!metadata) return null;

    // Store file metadata
    this.files.set(filePath, metadata);

    // Store hash mapping for duplicate detection
    if (!this.fileHashes.has(metadata.hash)) {
      this.fileHashes.set(metadata.hash, new Set());
    }
    this.fileHashes.get(metadata.hash).add(filePath);

    // Store directory mapping
    if (!this.directories.has(metadata.directory)) {
      this.directories.set(metadata.directory, new Set());
    }
    this.directories.get(metadata.directory).add(filePath);

    return metadata;
  }

  /**
   * Index entire project directory
   */
  async indexProject(rootDir, options = {}) {
    const result = await indexProject(rootDir, options);

    this.files = result.files;
    this.fileHashes = result.fileHashes;
    this.directories = result.directories;
    this.lastIndexTime = result.lastIndexTime;
    this.indexed = true;

    return {
      indexedCount: result.indexedCount,
      skippedCount: result.skippedCount,
      totalFiles: this.files.size,
      directories: this.directories.size,
    };
  }

  /**
   * Check if file exists in registry
   */
  fileExists(filePath) {
    return this.files.has(filePath);
  }

  /**
   * Get file metadata
   */
  getFileMetadata(filePath) {
    return this.files.get(filePath);
  }

  /**
   * Check if file content already exists (duplicate detection)
   */
  findDuplicateFiles(filePath, content) {
    return findDuplicateFiles(this.fileHashes, filePath, content);
  }

  /**
   * Check if file with same name exists in directory
   */
  findSameNameFiles(filePath) {
    return findSameNameFiles(this.directories, filePath);
  }

  /**
   * Check if similar file exists (by name similarity)
   */
  findSimilarFiles(filePath, threshold = 0.7) {
    return findSimilarFiles(this.files, filePath, calculateStringSimilarity, threshold);
  }

  /**
   * Get all files in directory
   */
  getFilesInDirectory(dir, recursive = false) {
    if (!recursive) {
      const files = this.directories.get(dir);
      return files ? Array.from(files) : [];
    }

    // Recursive search
    const results = [];
    for (const [filePath] of this.files) {
      if (filePath.startsWith(dir)) {
        results.push(filePath);
      }
    }
    return results;
  }

  /**
   * Search files by pattern
   */
  searchFiles(pattern, options = {}) {
    const { caseSensitive = false, inDirectory = null, extension = null } = options;

    const regex = new RegExp(pattern, caseSensitive ? 'g' : 'gi');
    const results = [];

    for (const [filePath, metadata] of this.files) {
      // Filter by directory
      if (inDirectory && !filePath.startsWith(inDirectory)) {
        continue;
      }

      // Filter by extension
      if (extension && metadata.extension !== extension) {
        continue;
      }

      // Check if basename matches pattern
      if (regex.test(metadata.basename)) {
        results.push(metadata);
      }
    }

    return results;
  }

  /**
   * Get file statistics
   */
  getStatistics() {
    const stats = {
      totalFiles: this.files.size,
      totalDirectories: this.directories.size,
      lastIndexed: this.lastIndexTime,
      fileTypes: {},
      duplicates: 0,
      totalSize: 0,
    };

    for (const metadata of this.files.values()) {
      const ext = metadata.extension || 'no-extension';
      stats.fileTypes[ext] = (stats.fileTypes[ext] || 0) + 1;
      stats.totalSize += metadata.size;
    }

    for (const [, paths] of this.fileHashes) {
      if (paths.size > 1) {
        stats.duplicates += paths.size - 1;
      }
    }

    return stats;
  }

  /**
   * Remove file from registry
   */
  async removeFile(filePath) {
    const metadata = this.files.get(filePath);
    if (!metadata) return false;

    // Remove from files map
    this.files.delete(filePath);

    // Remove from hash mapping
    const hashPaths = this.fileHashes.get(metadata.hash);
    if (hashPaths) {
      hashPaths.delete(filePath);
      if (hashPaths.size === 0) {
        this.fileHashes.delete(metadata.hash);
      }
    }

    // Remove from directory mapping
    const dirFiles = this.directories.get(metadata.directory);
    if (dirFiles) {
      dirFiles.delete(filePath);
      if (dirFiles.size === 0) {
        this.directories.delete(metadata.directory);
      }
    }

    return true;
  }

  /**
   * Update file in registry
   */
  async updateFile(filePath, _content) {
    // Remove old entry
    await this.removeFile(filePath);

    // Add new entry
    return await this.indexFile(filePath);
  }

  /**
   * Check registry needs reindexing
   */
  needsReindex(maxAge = 60000) {
    if (!this.indexed) return true;
    const age = Date.now() - this.lastIndexTime;
    return age > maxAge;
  }

  /**
   * Export registry to JSON
   */
  exportRegistry() {
    const exportData = {
      version: 1,
      lastIndexTime: this.lastIndexTime,
      files: Array.from(this.files.entries()),
      directories: Object.fromEntries(
        Array.from(this.directories.entries()).map(([dir, files]) => [dir, Array.from(files)])
      ),
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import registry from JSON
   */
  importRegistry(jsonData) {
    try {
      const data = JSON.parse(jsonData);

      this.files = new Map(data.files);
      this.directories = new Map(
        Object.entries(data.directories).map(([dir, files]) => [dir, new Set(files)])
      );
      this.fileHashes = new Map();

      // Rebuild hash mappings
      for (const [filePath, metadata] of this.files) {
        if (!this.fileHashes.has(metadata.hash)) {
          this.fileHashes.set(metadata.hash, new Set());
        }
        this.fileHashes.get(metadata.hash).add(filePath);
      }

      this.lastIndexTime = data.lastIndexTime;
      this.indexed = true;

      console.error(`[FILE-REGISTRY] Imported registry with ${this.files.size} files`);

      return true;
    } catch (error) {
      console.error(`[FILE-REGISTRY] Error importing registry: ${error.message}`);
      return false;
    }
  }
}

// Global file registry instance
const fileRegistry = new FileRegistry();

/**
 * Get the global file registry instance
 */
export function getFileRegistry() {
  return fileRegistry;
}

/**
 * Initialize file registry
 */
export async function initializeFileRegistry(rootDir, options) {
  return await fileRegistry.indexProject(rootDir, options);
}

/**
 * Check if file exists in registry
 */
export function checkFileExists(filePath) {
  return fileRegistry.fileExists(filePath);
}

/**
 * Get file metadata
 */
export function getFileMetadata(filePath) {
  return fileRegistry.getFileMetadata(filePath);
}

/**
 * Search files
 */
export function searchFiles(pattern, options) {
  return fileRegistry.searchFiles(pattern, options);
}

/**
 * Update file in registry
 */
export async function updateFileInRegistry(filePath, content) {
  return await fileRegistry.updateFile(filePath, content);
}

/**
 * Remove file from registry
 */
export async function removeFileFromRegistry(filePath) {
  return await fileRegistry.removeFile(filePath);
}

/**
 * Get registry statistics
 */
export function getRegistryStatistics() {
  return fileRegistry.getStatistics();
}

// Re-export duplicate detection functions for backward compatibility
export {
  findDuplicateFilesImpl as findDuplicateFiles,
  findSameNameFilesImpl as findSameNameFiles,
  findSimilarFilesImpl as findSimilarFiles,
};
