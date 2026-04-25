/**
 * Memory System Handlers
 *
 * Hidden MCP tools for querying project memory and archives
 * These tools are not documented and are for AI-query only
 *
 * @module lib/tools/handlers-memory
 */

import { getProjectMemoryManager } from '../project-memory-system.js';
import { getProjectRegistry } from '../project-registry.js';
import { getArchiveManager } from '../archive-manager.js';

/**
 * Query project memory for context
 * Hidden tool - not documented, AI-query only
 */
export async function queryProjectMemory(args) {
  const { projectName, queryType, filePath } = args;

  try {
    const projectRegistry = getProjectRegistry();
    if (!projectRegistry) {
      return {
        content: [{ type: 'text', text: 'Project registry not available' }],
        isError: false,
      };
    }

    // If projectName not provided, use current project
    let targetProjectName = projectName;
    if (!targetProjectName) {
      const projects = projectRegistry.getActiveProjects();
      if (projects.length > 0) {
        targetProjectName = projects[0].projectName;
      } else {
        return {
          content: [{ type: 'text', text: 'No active project found' }],
          isError: false,
        };
      }
    }

    const memoryManager = await getProjectMemoryManager(targetProjectName);
    if (!memoryManager) {
      return {
        content: [{ type: 'text', text: `Project memory not found for: ${targetProjectName}` }],
        isError: false,
      };
    }

    let result = '';

    switch (queryType) {
      case 'snapshot':
        const snapshot = memoryManager.getProjectSnapshot();
        result = JSON.stringify(snapshot, null, 2);
        break;

      case 'file_history':
        if (!filePath) {
          return {
            content: [{ type: 'text', text: 'filePath required for file_history query' }],
            isError: false,
          };
        }
        const fileHistory = memoryManager.getFileEpisodicMemory(filePath);
        result = JSON.stringify(fileHistory, null, 2);
        break;

      case 'decisions':
        const decisions = memoryManager.decisions.slice(-10);
        result = JSON.stringify(decisions, null, 2);
        break;

      case 'patterns':
        const patterns = memoryManager.patterns.slice(-10);
        result = JSON.stringify(patterns, null, 2);
        break;

      case 'errors':
        const errors = memoryManager.errors.slice(-10);
        result = JSON.stringify(errors, null, 2);
        break;

      case 'architecture':
        const architecture = memoryManager.architecture.slice(-10);
        result = JSON.stringify(architecture, null, 2);
        break;

      case 'backup_history':
        if (!filePath) {
          return {
            content: [{ type: 'text', text: 'filePath required for backup_history query' }],
            isError: false,
          };
        }
        const backupLinks = memoryManager.backupLinks
          .filter((link) => link.filePath === filePath)
          .slice(-10);
        result = JSON.stringify(backupLinks, null, 2);
        break;

      default:
        result =
          'Unknown query type. Available: snapshot, file_history, decisions, patterns, errors, architecture, backup_history';
    }

    return {
      content: [{ type: 'text', text: result }],
      isError: false,
    };
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error querying project memory: ${error.message}` }],
      isError: true,
    };
  }
}

/**
 * Query project archives
 * Hidden tool - not documented, AI-query only
 */
export async function queryProjectArchives(args) {
  const { projectName, query } = args;

  try {
    const archiveManager = getArchiveManager();
    if (!archiveManager) {
      return {
        content: [{ type: 'text', text: 'Archive manager not available' }],
        isError: false,
      };
    }

    if (projectName) {
      // Load specific archive
      const archiveData = await archiveManager.loadArchive(projectName);
      if (!archiveData) {
        return {
          content: [{ type: 'text', text: `Archive not found for: ${projectName}` }],
          isError: false,
        };
      }
      return {
        content: [{ type: 'text', text: JSON.stringify(archiveData, null, 2) }],
        isError: false,
      };
    }

    if (query) {
      // Search archives
      const results = await archiveManager.searchArchives(query);
      return {
        content: [{ type: 'text', text: JSON.stringify(results, null, 2) }],
        isError: false,
      };
    }

    // List all archives
    const archives = await archiveManager.listArchives();
    return {
      content: [{ type: 'text', text: JSON.stringify(archives, null, 2) }],
      isError: false,
    };
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error querying archives: ${error.message}` }],
      isError: true,
    };
  }
}

/**
 * List all projects in registry
 * Hidden tool - not documented, AI-query only
 */
export async function listProjects(args) {
  try {
    const projectRegistry = getProjectRegistry();
    if (!projectRegistry) {
      return {
        content: [{ type: 'text', text: 'Project registry not available' }],
        isError: false,
      };
    }

    const projects = projectRegistry.getAllProjects();
    return {
      content: [{ type: 'text', text: JSON.stringify(projects, null, 2) }],
      isError: false,
    };
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error listing projects: ${error.message}` }],
      isError: true,
    };
  }
}
