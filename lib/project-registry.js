/**
 * Project Registry
 *
 * Global registry tracking all known projects with their memory locations and status
 * Detects project deletion/inactivity and triggers auto-archive
 *
 * @module lib/project-registry
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const REGISTRY_DIR = path.join(os.homedir(), '.sweobeyme');
const REGISTRY_FILE = path.join(REGISTRY_DIR, 'project-registry.json');
const INACTIVE_DAYS = 30;

/**
 * Project Registry
 * Tracks all known projects and their status
 */
class ProjectRegistry {
  constructor() {
    this.projects = new Map();
    this.initialized = false;
  }

  async initialize() {
    try {
      await fs.mkdir(REGISTRY_DIR, { recursive: true });
      await this.loadRegistry();
      this.initialized = true;
      console.log('[ProjectRegistry] Initialized');
    } catch (error) {
      console.error('[ProjectRegistry] Failed to initialize:', error);
    }
  }

  async loadRegistry() {
    try {
      const data = await fs.readFile(REGISTRY_FILE, 'utf-8');
      const registry = JSON.parse(data);
      this.projects = new Map(Object.entries(registry));
      await this.checkInactiveProjects();
    } catch (error) {
      this.projects = new Map();
    }
  }

  async saveRegistry() {
    try {
      const registryObj = Object.fromEntries(this.projects);
      await fs.writeFile(REGISTRY_FILE, JSON.stringify(registryObj, null, 2), 'utf-8');
    } catch (error) {
      console.error('[ProjectRegistry] Failed to save registry:', error);
    }
  }

  registerProject(projectName, projectPath, projectType) {
    const project = {
      projectName,
      projectPath,
      projectType,
      memoryDir: path.join(os.homedir(), '.sweobeyme', 'projects', projectName, 'memory'),
      lastActive: new Date().toISOString(),
      status: 'active',
      archived: false,
      registeredAt: new Date().toISOString(),
    };

    this.projects.set(projectName, project);
    this.saveRegistry().catch(() => {});

    return project;
  }

  updateProjectActivity(projectName) {
    const project = this.projects.get(projectName);
    if (project) {
      project.lastActive = new Date().toISOString();
      project.status = 'active';
      this.projects.set(projectName, project);
      this.saveRegistry().catch(() => {});
    }
  }

  getProject(projectName) {
    return this.projects.get(projectName);
  }

  getAllProjects() {
    return Array.from(this.projects.values());
  }

  getActiveProjects() {
    return this.getAllProjects().filter((p) => p.status === 'active' && !p.archived);
  }

  getArchivedProjects() {
    return this.getAllProjects().filter((p) => p.archived);
  }

  async markProjectArchived(projectName) {
    const project = this.projects.get(projectName);
    if (project) {
      project.archived = true;
      project.status = 'archived';
      project.archivedAt = new Date().toISOString();
      this.projects.set(projectName, project);
      await this.saveRegistry();
    }
  }

  async removeProject(projectName) {
    this.projects.delete(projectName);
    await this.saveRegistry();
  }

  async checkInactiveProjects() {
    const now = new Date();
    const inactiveThreshold = new Date(now.getTime() - INACTIVE_DAYS * 24 * 60 * 60 * 1000);

    for (const [projectName, project] of this.projects.entries()) {
      if (project.archived) {
        continue;
      }

      const lastActive = new Date(project.lastActive);
      if (lastActive < inactiveThreshold) {
        console.log(
          `[ProjectRegistry] Project ${projectName} inactive for ${INACTIVE_DAYS} days, marking for archive`
        );
        project.status = 'inactive';
        this.projects.set(projectName, project);
      }
    }

    await this.saveRegistry();
  }

  async checkProjectExists(projectPath) {
    try {
      await fs.access(projectPath);
      return true;
    } catch (error) {
      return false;
    }
  }

  async detectDeletedProjects() {
    const deletedProjects = [];

    for (const [projectName, project] of this.projects.entries()) {
      if (project.archived) {
        continue;
      }

      const exists = await this.checkProjectExists(project.projectPath);
      if (!exists) {
        console.log(`[ProjectRegistry] Project ${projectName} deleted, marking for archive`);
        deletedProjects.push(projectName);
        project.status = 'deleted';
        this.projects.set(projectName, project);
      }
    }

    await this.saveRegistry();
    return deletedProjects;
  }

  getRegistry() {
    return Object.fromEntries(this.projects);
  }
}

let registryInstance = null;

export async function initializeProjectRegistry() {
  if (!registryInstance) {
    registryInstance = new ProjectRegistry();
    await registryInstance.initialize();
  }
  return registryInstance;
}

export function getProjectRegistry() {
  return registryInstance;
}
