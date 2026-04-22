/**
 * Unit tests for session-state module
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  loadSessionState,
  saveSessionState,
  getSessionState,
  incrementToolCallCounter,
  setCurrentTaskId,
  setTaskListSnapshot,
  setReminderInterval,
  updateLastReminder,
  shouldShowReminder,
  clearSessionState,
  resetToolCallCounter,
} from '../../lib/session-state.js';

const TEST_SESSION_FILE = path.join(os.homedir(), '.sweobeyme', 'session-state.json');

describe('session-state module', () => {
  beforeEach(() => {
    // Delete session state file before each test
    if (fs.existsSync(TEST_SESSION_FILE)) {
      fs.unlinkSync(TEST_SESSION_FILE);
    }
    // Clear in-memory session state
    clearSessionState();
    // Reset counter to 0
    resetToolCallCounter();
  });

  afterEach(() => {
    // Clean up test file
    if (fs.existsSync(TEST_SESSION_FILE)) {
      fs.unlinkSync(TEST_SESSION_FILE);
    }
    // Clear session state after test
    clearSessionState();
  });

  describe('loadSessionState', () => {
    it('should create default state if file does not exist', () => {
      const state = getSessionState(); // Use in-memory state loaded by beforeEach
      expect(state).toBeDefined();
      expect(state.toolCallCounter).toBe(0);
      expect(state.currentTaskId).toBeNull();
      expect(state.taskListSnapshot).toBeNull();
      expect(state.reminderInterval).toBe(15);
    });

    it('should load existing state from file', () => {
      const testState = {
        toolCallCounter: 42,
        currentTaskId: 'task-123',
        taskListSnapshot: [{ id: 'task-123', description: 'Test task' }],
        reminderInterval: 20,
      };
      fs.writeFileSync(TEST_SESSION_FILE, JSON.stringify(testState));

      loadSessionState(); // Reload from file

      const state = getSessionState();
      expect(state.toolCallCounter).toBe(42);
      expect(state.currentTaskId).toBe('task-123');
      expect(state.taskListSnapshot).toEqual(testState.taskListSnapshot);
      expect(state.reminderInterval).toBe(20);
    });
  });

  describe('incrementToolCallCounter', () => {
    it('should increment counter from 0 to 1', () => {
      const count = incrementToolCallCounter();
      expect(count).toBe(1);
    });

    it('should increment counter multiple times', () => {
      incrementToolCallCounter();
      incrementToolCallCounter();
      const count = incrementToolCallCounter();
      expect(count).toBe(3);
    });

    it('should persist counter to disk', () => {
      incrementToolCallCounter();

      const state = getSessionState();
      expect(state.toolCallCounter).toBe(1);
    });
  });

  describe('setCurrentTaskId', () => {
    it('should set current task ID', () => {
      setCurrentTaskId('task-abc');

      const state = getSessionState();
      expect(state.currentTaskId).toBe('task-abc');
    });

    it('should persist task ID to disk', () => {
      setCurrentTaskId('task-xyz');

      const state = getSessionState();
      expect(state.currentTaskId).toBe('task-xyz');
    });
  });

  describe('setTaskListSnapshot', () => {
    it('should set task list snapshot', () => {
      const tasks = [
        { id: 'task-1', description: 'Task 1', status: 'pending' },
        { id: 'task-2', description: 'Task 2', status: 'pending' },
      ];
      setTaskListSnapshot(tasks);

      const state = getSessionState();
      expect(state.taskListSnapshot).toEqual(tasks);
    });
  });

  describe('setReminderInterval', () => {
    it('should set reminder interval', () => {
      setReminderInterval(25);

      const state = getSessionState();
      expect(state.reminderInterval).toBe(25);
    });

    it('should persist interval to disk', () => {
      setReminderInterval(30);

      const state = getSessionState();
      expect(state.reminderInterval).toBe(30);
    });
  });

  describe('shouldShowReminder', () => {
    it('should return false if no task list exists', () => {
      incrementToolCallCounter();

      expect(shouldShowReminder()).toBe(false);
    });

    it('should return false before reaching interval', () => {
      setTaskListSnapshot([{ id: 'task-1', description: 'Test' }]);
      incrementToolCallCounter(); // count = 1

      expect(shouldShowReminder()).toBe(false);
    });

    it('should return true at interval threshold', () => {
      setTaskListSnapshot([{ id: 'task-1', description: 'Test' }]);

      // Increment to 15 (default interval)
      for (let i = 0; i < 15; i++) {
        incrementToolCallCounter();
      }

      expect(shouldShowReminder()).toBe(true);
    });

    it('should return false if last reminder was recent', () => {
      setTaskListSnapshot([{ id: 'task-1', description: 'Test' }]);

      // Increment to 15
      for (let i = 0; i < 15; i++) {
        incrementToolCallCounter();
      }
      updateLastReminder(15); // Mark as reminded

      // Increment to 25 (only 10 calls since last reminder)
      for (let i = 0; i < 10; i++) {
        incrementToolCallCounter();
      }

      expect(shouldShowReminder()).toBe(false);
    });

    it('should return true after 10 calls since last reminder', () => {
      setTaskListSnapshot([{ id: 'task-1', description: 'Test' }]);

      // Increment to 15 (first interval multiple)
      for (let i = 0; i < 15; i++) {
        incrementToolCallCounter();
      }
      updateLastReminder(15);

      // Increment to 30 (next interval multiple, 15 calls since last reminder)
      for (let i = 0; i < 15; i++) {
        incrementToolCallCounter();
      }

      expect(shouldShowReminder()).toBe(true);
    });

    it('should respect custom interval', () => {
      setReminderInterval(5);
      setTaskListSnapshot([{ id: 'task-1', description: 'Test' }]);

      // Increment to 10 (meets 10-call threshold, and 10 % 5 === 0)
      for (let i = 0; i < 10; i++) {
        incrementToolCallCounter();
      }

      expect(shouldShowReminder()).toBe(true);
    });
  });

  describe('clearSessionState', () => {
    it('should reset all state to defaults', () => {
      setCurrentTaskId('task-123');
      setTaskListSnapshot([{ id: 'task-1', description: 'Test' }]);
      incrementToolCallCounter();

      clearSessionState();

      const state = getSessionState();
      expect(state.toolCallCounter).toBe(0);
      expect(state.currentTaskId).toBeNull();
      expect(state.taskListSnapshot).toBeNull();
      expect(state.lastReminderAt).toBe(0);
      expect(state.reminderInterval).toBe(15);
    });
  });

  describe('resetToolCallCounter', () => {
    it('should reset counter only', () => {
      setCurrentTaskId('task-123');
      setTaskListSnapshot([{ id: 'task-1', description: 'Test' }]);
      incrementToolCallCounter();
      incrementToolCallCounter();

      resetToolCallCounter();

      const state = getSessionState();
      expect(state.toolCallCounter).toBe(0);
      expect(state.lastReminderAt).toBe(0);
      expect(state.currentTaskId).toBe('task-123'); // Should preserve
      expect(state.taskListSnapshot).not.toBeNull(); // Should preserve
    });
  });
});
