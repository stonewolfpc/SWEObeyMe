/**
 * Persistent Project Memory System
 * Maintains awareness of project structure, conventions, and decisions
 * Integrates with project_map.json as the source of truth
 * Added initialization caching to prevent repeated expensive operations
 */

import { ProjectMemory } from './project-memory-core.js';
import './project-memory-structure.js';
import './project-memory-conventions.js';
import './project-memory-detection.js';
import './project-memory-validation.js';
import './project-memory-location.js';

/**
 * Global project memory instance
 */
let globalProjectMemory = null;

/**
 * Initialization state to prevent repeated expensive operations
 */
let initializationInProgress = false;
let initializationPromise = null;

/**
 * Initialize project memory for workspace
 * Added caching to prevent repeated initialization
 */
export async function initializeProjectMemory(workspacePath) {
  if (globalProjectMemory) {
    return globalProjectMemory;
  }
  
  if (initializationInProgress) {
    return initializationPromise;
  }
  
  initializationInProgress = true;
  initializationPromise = (async () => {
    try {
      globalProjectMemory = new ProjectMemory(workspacePath);
      await globalProjectMemory.load();
      return globalProjectMemory;
    } finally {
      initializationInProgress = false;
    }
  })();
  
  return initializationPromise;
}

/**
 * Get global project memory instance
 */
export function getProjectMemory() {
  return globalProjectMemory;
}

// Re-export the main class
export { ProjectMemory };
