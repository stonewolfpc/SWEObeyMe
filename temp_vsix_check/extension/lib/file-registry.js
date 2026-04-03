/**
 * File Registry System
 * Tracks all files in the project to prevent duplication and ensure proper auditing
 * Critical for massive projects with thousands of files
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

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
   * Calculate file hash for content comparison
   */
  calculateHash(content) {
    return crypto.createHash('md5').update(content).digest('hex');
  }

  /**
   * Index a single file
   */
  async indexFile(filePath) {
    try {
      const stats = await fs.stat(filePath);
      const content = await fs.readFile(filePath, 'utf-8');
      const hash = this.calculateHash(content);
      const dir = path.dirname(filePath);

      const metadata = {
        path: filePath,
        hash,
        size: stats.size,
        modified: stats.mtime,
        indexed: Date.now(),
        directory: dir,
        basename: path.basename(filePath),
        extension: path.extname(filePath),
      };

      // Store file metadata
      this.files.set(filePath, metadata);

      // Store hash mapping for duplicate detection
      if (!this.fileHashes.has(hash)) {
        this.fileHashes.set(hash, new Set());
      }
      this.fileHashes.get(hash).add(filePath);

      // Store directory mapping
      if (!this.directories.has(dir)) {
        this.directories.set(dir, new Set());
      }
      this.directories.get(dir).add(filePath);

      return metadata;
    } catch (error) {
      // File might not exist or be inaccessible
      return null;
    }
  }

  /**
   * Index entire project directory
   */
  async indexProject(rootDir, options = {}) {
    const {
      ignorePatterns = ['node_modules', '.git', 'dist', 'build', 'bin', 'obj'],
      maxDepth = 20,
      onProgress = null,
    } = options;

    this.files.clear();
    this.fileHashes.clear();
    this.directories.clear();
    this.lastIndexTime = Date.now();

    let indexedCount = 0;
    let skippedCount = 0;

    const indexDirectory = async (dir, depth = 0) => {
      if (depth > maxDepth) return;

      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          // Skip ignored patterns
          if (ignorePatterns.some(pattern => fullPath.includes(pattern))) {
            skippedCount++;
            continue;
          }

          if (entry.isDirectory()) {
            await indexDirectory(fullPath, depth + 1);
          } else if (entry.isFile()) {
            const metadata = await this.indexFile(fullPath);
            if (metadata) {
              indexedCount++;
              if (onProgress && indexedCount % 100 === 0) {
                onProgress(indexedCount, fullPath);
              }
            }
          }
        }
      } catch (error) {
        // Directory might be inaccessible
        console.error(`[FILE-REGISTRY] Error indexing directory ${dir}: ${error.message}`);
      }
    };

    await indexDirectory(rootDir);
    this.indexed = true;

    console.error(`[FILE-REGISTRY] Indexed ${indexedCount} files, skipped ${skippedCount} files`);

    return {
      indexedCount,
      skippedCount,
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
    const hash = this.calculateHash(content);
    const duplicates = this.fileHashes.get(hash);

    if (!duplicates) {
      return [];
    }

    // Return all files with same hash except the current one
    return Array.from(duplicates).filter(p => p !== filePath);
  }

  /**
   * Check if file with same name exists in directory
   */
  findSameNameFiles(filePath) {
    const dir = path.dirname(filePath);
    const basename = path.basename(filePath);
    const filesInDir = this.directories.get(dir);

    if (!filesInDir) {
      return [];
    }

    return Array.from(filesInDir).filter(p => {
      const otherBasename = path.basename(p);
      return otherBasename === basename && p !== filePath;
    });
  }

  /**
   * Check if similar file exists (by name similarity)
   */
  findSimilarFiles(filePath, threshold = 0.7) {
    const basename = path.basename(filePath, path.extname(filePath));
    const similarFiles = [];

    for (const [otherPath] of this.files) {
      if (otherPath === filePath) continue;

      const otherBasename = path.basename(otherPath, path.extname(otherPath));
      const similarity = this.calculateStringSimilarity(basename, otherBasename);

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

  /**
   * Calculate string similarity (Levenshtein distance based)
   */
  calculateStringSimilarity(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix = [];

    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }

    const distance = matrix[len1][len2];
    const maxLength = Math.max(len1, len2);
    return 1 - distance / maxLength;
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
      // Count by extension
      const ext = metadata.extension || 'no-extension';
      stats.fileTypes[ext] = (stats.fileTypes[ext] || 0) + 1;

      // Calculate total size
      stats.totalSize += metadata.size;
    }

    // Count duplicates
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
 * Find duplicate files
 */
export function findDuplicateFiles(filePath, content) {
  return fileRegistry.findDuplicateFiles(filePath, content);
}

/**
 * Find similar files
 */
export function findSimilarFiles(filePath, threshold) {
  return fileRegistry.findSimilarFiles(filePath, threshold);
}

/**
 * Find files with same name
 */
export function findSameNameFiles(filePath) {
  return fileRegistry.findSameNameFiles(filePath);
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
