/**
 * Archive Manager
 * 
 * Manages project archives with compression and on-demand access
 * Archives contain minimal content (decisions, patterns, errors, architecture)
 * NOT full file history or raw events
 * 
 * @module lib/archive-manager
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import zlib from 'zlib';
import { promisify } from 'util';

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

const ARCHIVES_DIR = path.join(os.homedir(), '.sweobeyme', 'archives');

/**
 * Archive Manager
 * Handles project archiving, compression, and retrieval
 */
class ArchiveManager {
  constructor() {
    this.initialized = false;
  }

  async initialize() {
    try {
      await fs.mkdir(ARCHIVES_DIR, { recursive: true });
      this.initialized = true;
      console.log('[ArchiveManager] Initialized');
    } catch (error) {
      console.error('[ArchiveManager] Failed to initialize:', error);
    }
  }

  async createArchive(projectName, memoryData) {
    const archiveContent = {
      projectName,
      archivedAt: new Date().toISOString(),
      metadata: {
        name: projectName,
        type: memoryData.projectType || 'unknown',
        techStack: memoryData.techStack || [],
      },
      decisions: memoryData.decisions || [],
      patterns: memoryData.patterns || [],
      errors: memoryData.errors || [],
      architecture: memoryData.architecture || [],
    };

    try {
      await fs.mkdir(ARCHIVES_DIR, { recursive: true });
      const archivePath = path.join(ARCHIVES_DIR, `${projectName}.json.gz`);
      const compressed = await gzip(JSON.stringify(archiveContent, null, 2));
      await fs.writeFile(archivePath, compressed);
      console.log(`[ArchiveManager] Created archive for: ${projectName}`);
      return true;
    } catch (error) {
      console.error(`[ArchiveManager] Failed to create archive for ${projectName}:`, error);
      return false;
    }
  }

  async loadArchive(projectName) {
    try {
      const archivePath = path.join(ARCHIVES_DIR, `${projectName}.json.gz`);
      const compressed = await fs.readFile(archivePath);
      const decompressed = await gunzip(compressed);
      const archiveData = JSON.parse(decompressed.toString('utf-8'));
      return archiveData;
    } catch (error) {
      console.error(`[ArchiveManager] Failed to load archive for ${projectName}:`, error);
      return null;
    }
  }

  async archiveExists(projectName) {
    try {
      const archivePath = path.join(ARCHIVES_DIR, `${projectName}.json.gz`);
      await fs.access(archivePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  async listArchives() {
    try {
      const files = await fs.readdir(ARCHIVES_DIR);
      const archives = [];

      for (const file of files) {
        if (file.endsWith('.json.gz')) {
          const projectName = file.replace('.json.gz', '');
          const archivePath = path.join(ARCHIVES_DIR, file);
          const stats = await fs.stat(archivePath);
          const archiveData = await this.loadArchive(projectName);

          archives.push({
            projectName,
            archivedAt: archiveData?.archivedAt || stats.mtime.toISOString(),
            size: stats.size,
            metadata: archiveData?.metadata || {},
          });
        }
      }

      return archives.sort((a, b) => new Date(b.archivedAt) - new Date(a.archivedAt));
    } catch (error) {
      console.error('[ArchiveManager] Failed to list archives:', error);
      return [];
    }
  }

  async deleteArchive(projectName) {
    try {
      const archivePath = path.join(ARCHIVES_DIR, `${projectName}.json.gz`);
      await fs.unlink(archivePath);
      console.log(`[ArchiveManager] Deleted archive for: ${projectName}`);
      return true;
    } catch (error) {
      console.error(`[ArchiveManager] Failed to delete archive for ${projectName}:`, error);
      return false;
    }
  }

  async searchArchives(query) {
    const archives = await this.listArchives();
    const results = [];

    for (const archive of archives) {
      const archiveData = await this.loadArchive(archive.projectName);
      if (!archiveData) continue;

      const matches = {
        projectName: archive.projectName,
        archivedAt: archive.archivedAt,
        decisions: [],
        patterns: [],
        errors: [],
        architecture: [],
      };

      for (const decision of archiveData.decisions) {
        if (this.matchesQuery(decision, query)) {
          matches.decisions.push(decision);
        }
      }

      for (const pattern of archiveData.patterns) {
        if (this.matchesQuery(pattern, query)) {
          matches.patterns.push(pattern);
        }
      }

      for (const error of archiveData.errors) {
        if (this.matchesQuery(error, query)) {
          matches.errors.push(error);
        }
      }

      for (const arch of archiveData.architecture) {
        if (this.matchesQuery(arch, query)) {
          matches.architecture.push(arch);
        }
      }

      if (matches.decisions.length > 0 || 
          matches.patterns.length > 0 || 
          matches.errors.length > 0 || 
          matches.architecture.length > 0) {
        results.push(matches);
      }
    }

    return results;
  }

  matchesQuery(item, query) {
    const queryLower = query.toLowerCase();
    const itemStr = JSON.stringify(item).toLowerCase();
    return itemStr.includes(queryLower);
  }

  async restoreArchive(projectName, targetMemoryManager) {
    const archiveData = await this.loadArchive(projectName);
    if (!archiveData) {
      return false;
    }

    try {
      for (const decision of archiveData.decisions) {
        targetMemoryManager.recordDecision(decision);
      }

      for (const pattern of archiveData.patterns) {
        targetMemoryManager.recordPattern(pattern);
      }

      for (const error of archiveData.errors) {
        targetMemoryManager.recordError(error);
      }

      for (const arch of archiveData.architecture) {
        targetMemoryManager.recordArchitecture(arch);
      }

      console.log(`[ArchiveManager] Restored archive for: ${projectName}`);
      return true;
    } catch (error) {
      console.error(`[ArchiveManager] Failed to restore archive for ${projectName}:`, error);
      return false;
    }
  }
}

let archiveManagerInstance = null;

export async function initializeArchiveManager() {
  if (!archiveManagerInstance) {
    archiveManagerInstance = new ArchiveManager();
    await archiveManagerInstance.initialize();
  }
  return archiveManagerInstance;
}

export function getArchiveManager() {
  return archiveManagerInstance;
}
