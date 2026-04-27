/**
 * TaskPlanStorage — System-owned, versioned task plan persistence.
 */

import fs from 'fs/promises';
import path from 'path';
import { AUTONOMOUS_CONFIG } from './autonomous-config.js';

export class TaskPlanStorage {
  constructor(workspacePath) {
    this.storagePath = path.join(workspacePath, '.sweobeyme-autonomous');
    this.currentPlan = null;
    this.planHistory = [];
  }

  async initialize() {
    try {
      await fs.mkdir(this.storagePath, { recursive: true });
      await this.loadCurrentPlan();
    } catch (error) {
      console.error('Failed to initialize task plan storage:', error);
    }
  }

  async loadCurrentPlan() {
    try {
      const planPath = path.join(this.storagePath, 'current-plan.json');
      const data = await fs.readFile(planPath, 'utf-8');
      this.currentPlan = JSON.parse(data);
    } catch (_error) {
      this.currentPlan = null;
    }
  }

  async saveCurrentPlan(plan) {
    try {
      const planPath = path.join(this.storagePath, 'current-plan.json');
      const planWithTimestamp = {
        ...plan,
        lastModified: new Date().toISOString(),
        version: AUTONOMOUS_CONFIG.version,
      };
      await fs.writeFile(planPath, JSON.stringify(planWithTimestamp, null, 2));
      this.currentPlan = planWithTimestamp;
      await this.archivePlan(planWithTimestamp);
    } catch (error) {
      console.error('Failed to save task plan:', error);
    }
  }

  async archivePlan(plan) {
    try {
      const historyPath = path.join(this.storagePath, 'history');
      await fs.mkdir(historyPath, { recursive: true });
      const archiveName = `plan-${Date.now()}.json`;
      const archivePath = path.join(historyPath, archiveName);
      await fs.writeFile(archivePath, JSON.stringify(plan, null, 2));
      const historyFiles = await fs.readdir(historyPath);
      if (historyFiles.length > 20) {
        historyFiles
          .sort()
          .slice(0, historyFiles.length - 20)
          .forEach(async (file) => {
            await fs.unlink(path.join(historyPath, file));
          });
      }
    } catch (error) {
      console.error('Failed to archive plan:', error);
    }
  }

  validatePlan(plan) {
    const errors = [];
    if (!plan.id) errors.push('Missing plan ID');
    if (!plan.goal) errors.push('Missing plan goal');
    if (!plan.tasks || !Array.isArray(plan.tasks)) errors.push('Missing or invalid tasks array');
    if (plan.tasks && plan.tasks.length === 0) errors.push('Empty tasks array');

    if (plan.tasks) {
      plan.tasks.forEach((task, index) => {
        if (!task.id) errors.push(`Task ${index}: Missing task ID`);
        if (!task.description) errors.push(`Task ${index}: Missing description`);
        if (!task.status) errors.push(`Task ${index}: Missing status`);
        if (!['pending', 'in_progress', 'completed', 'blocked', 'failed'].includes(task.status)) {
          errors.push(`Task ${index}: Invalid status "${task.status}"`);
        }
      });
    }

    if (plan.tasks) {
      const taskIds = new Set(plan.tasks.map((t) => t.id));
      plan.tasks.forEach((task) => {
        if (task.dependencies) {
          task.dependencies.forEach((depId) => {
            if (!taskIds.has(depId)) {
              errors.push(`Task ${task.id}: Dependency "${depId}" not found in plan`);
            }
          });
        }
      });
    }

    return { valid: errors.length === 0, errors };
  }

  getCurrentPlan() {
    return this.currentPlan;
  }

  async clearCurrentPlan() {
    try {
      const planPath = path.join(this.storagePath, 'current-plan.json');
      await fs.unlink(planPath);
      this.currentPlan = null;
    } catch (_error) {
    }
  }
}
