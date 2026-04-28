/**
 * Project-Aware Memory System
 *
 * Per-project memory isolation with automatic archiving and backup integration.
 * Factory functions and registry. Class definition: project-memory-manager.js
 *
 * @module lib/project-memory-system
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { ProjectMemoryManager } from './project-memory-manager.js';

const PROJECTS_DIR = path.join(os.homedir(), '.sweobeyme', 'projects');
const ARCHIVES_DIR = path.join(os.homedir(), '.sweobeyme', 'archives');

const activeManagers = new Map();

export { ProjectMemoryManager };

export async function getProjectMemoryManager(projectName) {
  if (!activeManagers.has(projectName)) {
    const manager = new ProjectMemoryManager(projectName);
    await manager.initialize();
    activeManagers.set(projectName, manager);
  }
  return activeManagers.get(projectName);
}

export function hasActiveManager(projectName) {
  return activeManagers.has(projectName);
}

export async function deactivateProjectMemory(projectName) {
  const manager = activeManagers.get(projectName);
  if (manager) {
    await manager.deactivate();
    activeManagers.delete(projectName);
  }
}

export async function archiveProjectMemory(projectName) {
  const manager = activeManagers.get(projectName);
  if (manager) {
    const success = await manager.archive();
    if (success) await deactivateProjectMemory(projectName);
    return success;
  }
  return false;
}

export async function initializeProjectMemorySystem() {
  try {
    await fs.mkdir(PROJECTS_DIR, { recursive: true });
    await fs.mkdir(ARCHIVES_DIR, { recursive: true });
  } catch (error) {
    console.error('[ProjectMemorySystem] Failed to initialize:', error);
  }
}
