/**
 * Persistent Project Memory System
 * Maintains awareness of project structure, conventions, and decisions
 * Integrates with project_map.json as the source of truth
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
 * Initialize project memory for workspace
 */
export async function initializeProjectMemory(workspacePath) {
  if (!globalProjectMemory) {
    globalProjectMemory = new ProjectMemory(workspacePath);
    await globalProjectMemory.load();
  }
  
  return globalProjectMemory;
}

/**
 * Get global project memory instance
 */
export function getProjectMemory() {
  return globalProjectMemory;
}

// Re-export the main class
export { ProjectMemory };
