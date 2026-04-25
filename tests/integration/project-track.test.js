/**
 * Integration tests for project-track tool
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getProjectAwarenessManager } from '../../lib/project-awareness.js';

describe('project-track integration tests', () => {
  let manager;

  beforeEach(() => {
    manager = getProjectAwarenessManager();
    // Initialize current project for tests
    manager.currentProject = {
      projectName: 'Test Project',
      projectPath: '/test/path',
      projectType: 'javascript',
      pendingTasks: [],
      warnings: [],
      errors: [],
    };
  });

  afterEach(() => {
    // Clean up after tests
    if (manager && manager.currentProject) {
      manager.clearPendingTasks();
    }
  });

  describe('addPendingTask', () => {
    it('should add task with auto-generated ID', async () => {
      const result = await manager.addPendingTask('Test task');

      expect(result).toBeDefined();
      expect(result.taskId).toBeDefined();
      expect(result.taskId).toMatch(/^[a-f0-9-]{36}$/); // UUID format
    });

    it('should add task with custom ID', async () => {
      const customId = 'task-123';
      const result = await manager.addPendingTask('Test task', customId);

      expect(result.taskId).toBe(customId);
    });

    it('should add task with status', async () => {
      const result = await manager.addPendingTask('Test task', null, 'in_progress');

      const project = manager.getCurrentProject();
      const task = project.pendingTasks.find((t) => t.id === result.taskId);
      expect(task.status).toBe('in_progress');
    });

    it('should convert string task to object format', async () => {
      const result = await manager.addPendingTask('String task');

      const project = manager.getCurrentProject();
      const task = project.pendingTasks.find((t) => t.id === result.taskId);
      expect(task.description).toBe('String task');
      expect(task.status).toBe('pending');
      expect(task.createdAt).toBeDefined();
    });

    it('should handle object task format', async () => {
      const taskObj = { description: 'Object task', customField: 'value' };
      const result = await manager.addPendingTask(taskObj);

      const project = manager.getCurrentProject();
      const task = project.pendingTasks.find((t) => t.id === result.taskId);
      expect(task.description).toBe('Object task');
      expect(task.customField).toBe('value');
    });
  });

  describe('setCurrentTask', () => {
    it('should mark task as current and in_progress', async () => {
      const result = await manager.addPendingTask('Task 1');
      await manager.addPendingTask('Task 2');

      await manager.setCurrentTask(result.taskId);

      const project = manager.getCurrentProject();
      const task = project.pendingTasks.find((t) => t.id === result.taskId);
      expect(task.isCurrent).toBe(true);
      expect(task.status).toBe('in_progress');
    });

    it('should unset isCurrent for other tasks', async () => {
      const result1 = await manager.addPendingTask('Task 1');
      const result2 = await manager.addPendingTask('Task 2');

      await manager.setCurrentTask(result1.taskId);
      await manager.setCurrentTask(result2.taskId);

      const project = manager.getCurrentProject();
      const task1 = project.pendingTasks.find((t) => t.id === result1.taskId);
      const task2 = project.pendingTasks.find((t) => t.id === result2.taskId);

      expect(task1.isCurrent).toBe(false);
      expect(task2.isCurrent).toBe(true);
    });
  });

  describe('advanceToNextTask', () => {
    it('should mark current task as completed', async () => {
      const result1 = await manager.addPendingTask('Task 1');
      await manager.addPendingTask('Task 2');

      await manager.setCurrentTask(result1.taskId);
      await manager.advanceToNextTask();

      const project = manager.getCurrentProject();
      const task1 = project.pendingTasks.find((t) => t.id === result1.taskId);
      expect(task1.status).toBe('completed');
      expect(task1.completedAt).toBeDefined();
    });

    it('should advance to next pending task', async () => {
      const result1 = await manager.addPendingTask('Task 1');
      const result2 = await manager.addPendingTask('Task 2');

      await manager.setCurrentTask(result1.taskId);
      const advanceResult = await manager.advanceToNextTask();

      expect(advanceResult.nextTaskId).toBe(result2.taskId);

      const project = manager.getCurrentProject();
      const task2 = project.pendingTasks.find((t) => t.id === result2.taskId);
      expect(task2.isCurrent).toBe(true);
      expect(task2.status).toBe('in_progress');
    });

    it('should return message when all tasks completed', async () => {
      const result1 = await manager.addPendingTask('Task 1');
      await manager.addPendingTask('Task 2');

      await manager.setCurrentTask(result1.taskId);
      await manager.advanceToNextTask();
      const finalResult = await manager.advanceToNextTask();

      expect(finalResult.message).toContain('All tasks completed');
      expect(finalResult.nextTaskId).toBeNull();
    });
  });

  describe('auditTasks', () => {
    it('should return task statistics', async () => {
      await manager.addPendingTask('Task 1');
      await manager.addPendingTask('Task 2');
      await manager.addPendingTask('Task 3');

      const audit = await manager.auditTasks();

      expect(audit.totalTasks).toBe(3);
      expect(audit.pending).toBe(3);
      expect(audit.inProgress).toBe(0);
      expect(audit.completed).toBe(0);
    });

    it('should count completed tasks', async () => {
      const result1 = await manager.addPendingTask('Task 1');
      await manager.addPendingTask('Task 2');

      await manager.setCurrentTask(result1.taskId);
      await manager.advanceToNextTask();

      const audit = await manager.auditTasks();

      expect(audit.completed).toBe(1);
      expect(audit.inProgress).toBe(1);
    });

    it('should return task details', async () => {
      const result = await manager.addPendingTask('Test task');

      const audit = await manager.auditTasks();

      expect(audit.tasks).toHaveLength(1);
      expect(audit.tasks[0].id).toBe(result.taskId);
      expect(audit.tasks[0].description).toBe('Test task');
      expect(audit.tasks[0].status).toBe('pending');
      expect(audit.tasks[0].createdAt).toBeDefined();
    });
  });

  describe('archiveTasks', () => {
    it('should clear task list', async () => {
      await manager.addPendingTask('Task 1');
      await manager.addPendingTask('Task 2');

      await manager.archiveTasks();

      const project = manager.getCurrentProject();
      expect(project.pendingTasks).toHaveLength(0);
    });
  });
});
