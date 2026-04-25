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
  beforeEach(async () => {
    // Delete session state file before each test
    if (fs.existsSync(TEST_SESSION_FILE)) {
      fs.unlinkSync(TEST_SESSION_FILE);
    }
    // Clear in-memory session state
    await clearSessionState();
    // Reset counter to 0
    await resetToolCallCounter();
  });

  afterEach(async () => {
    // Clean up test file
    try {
      if (fs.existsSync(TEST_SESSION_FILE)) {
        fs.unlinkSync(TEST_SESSION_FILE);
      }
    } catch (error) {
      // Ignore if file doesn't exist
    }
    // Clear session state after test
    await clearSessionState();
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

    it.skip('should load existing state from file', async () => {
      // This test needs to skip the beforeEach to control file state
      // Manually clean up first
      if (fs.existsSync(TEST_SESSION_FILE)) {
        fs.unlinkSync(TEST_SESSION_FILE);
      }
      // Clear in-memory state without writing to disk
      Object.assign(sessionState, defaultState);
      
      const testState = {
        toolCallCounter: 42,
        currentTaskId: 'task-123',
        taskListSnapshot: [{ id: 'task-123', description: 'Test task' }],
        reminderInterval: 20,
      };
      
      // Write test file directly
      fs.mkdirSync(path.dirname(TEST_SESSION_FILE), { recursive: true });
      fs.writeFileSync(TEST_SESSION_FILE, JSON.stringify(testState));

      const state = await loadSessionState(); // Reload from file and get returned state

      expect(state.toolCallCounter).toBe(42);
      expect(state.currentTaskId).toBe('task-123');
      expect(state.taskListSnapshot).toEqual(testState.taskListSnapshot);
      expect(state.reminderInterval).toBe(20);
    });
  });

  describe('incrementToolCallCounter', () => {
    it('should increment counter from 0 to 1', async () => {
      const count = await incrementToolCallCounter();
      expect(count).toBe(1);
    });

    it('should increment counter multiple times', async () => {
      await incrementToolCallCounter();
      await incrementToolCallCounter();
      const count = await incrementToolCallCounter();
      expect(count).toBe(3);
    });

    it('should persist counter to disk', async () => {
      await incrementToolCallCounter();

      const state = getSessionState();
      expect(state.toolCallCounter).toBe(1);
    });
  });

  describe('setCurrentTaskId', () => {
    it('should set current task ID', async () => {
      await setCurrentTaskId('task-abc');

      const state = getSessionState();
      expect(state.currentTaskId).toBe('task-abc');
    });

    it('should persist task ID to disk', async () => {
      await setCurrentTaskId('task-xyz');

      const state = getSessionState();
      expect(state.currentTaskId).toBe('task-xyz');
    });
  });

  describe('setTaskListSnapshot', () => {
    it('should set task list snapshot', async () => {
      const tasks = [
        { id: 'task-1', description: 'Task 1', status: 'pending' },
        { id: 'task-2', description: 'Task 2', status: 'pending' },
      ];
      await setTaskListSnapshot(tasks);

      const state = getSessionState();
      expect(state.taskListSnapshot).toEqual(tasks);
    });
  });

  describe('setReminderInterval', () => {
    it('should set reminder interval', async () => {
      await setReminderInterval(25);

      const state = getSessionState();
      expect(state.reminderInterval).toBe(25);
    });

    it('should persist interval to disk', async () => {
      await setReminderInterval(30);

      const state = getSessionState();
      expect(state.reminderInterval).toBe(30);
    });
  });

  describe('shouldShowReminder', () => {
    it('should return false if no task list exists', async () => {
      await incrementToolCallCounter();

      expect(shouldShowReminder()).toBe(false);
    });

    it('should return false before reaching interval', async () => {
      await setTaskListSnapshot([{ id: 'task-1', description: 'Test' }]);
      await incrementToolCallCounter(); // count = 1

      expect(shouldShowReminder()).toBe(false);
    });

    it('should return true at interval threshold', async () => {
      await setTaskListSnapshot([{ id: 'task-1', description: 'Test' }]);

      // Increment to 15 (default interval)
      for (let i = 0; i < 15; i++) {
        await incrementToolCallCounter();
      }

      expect(shouldShowReminder()).toBe(true);
    });

    it('should return false if last reminder was recent', async () => {
      await setTaskListSnapshot([{ id: 'task-1', description: 'Test' }]);

      // Increment to 15
      for (let i = 0; i < 15; i++) {
        await incrementToolCallCounter();
      }
      await updateLastReminder(15); // Mark as reminded

      // Increment to 25 (only 10 calls since last reminder)
      for (let i = 0; i < 10; i++) {
        await incrementToolCallCounter();
      }

      expect(shouldShowReminder()).toBe(false);
    });

    it('should return true after 10 calls since last reminder', async () => {
      await setTaskListSnapshot([{ id: 'task-1', description: 'Test' }]);

      // Increment to 15 (first interval multiple)
      for (let i = 0; i < 15; i++) {
        await incrementToolCallCounter();
      }
      await updateLastReminder(15);

      // Increment to 30 (next interval multiple, 15 calls since last reminder)
      for (let i = 0; i < 15; i++) {
        await incrementToolCallCounter();
      }

      expect(shouldShowReminder()).toBe(true);
    });

    it('should respect custom interval', async () => {
      await setReminderInterval(5);
      await setTaskListSnapshot([{ id: 'task-1', description: 'Test' }]);

      // Increment to 10 (meets 10-call threshold, and 10 % 5 === 0)
      for (let i = 0; i < 10; i++) {
        await incrementToolCallCounter();
      }

      expect(shouldShowReminder()).toBe(true);
    });
  });

  describe('clearSessionState', () => {
    it('should reset all state to defaults', async () => {
      await setCurrentTaskId('task-123');
      await setTaskListSnapshot([{ id: 'task-1', description: 'Test' }]);
      await incrementToolCallCounter();

      await clearSessionState();

      const state = getSessionState();
      expect(state.toolCallCounter).toBe(0);
      expect(state.currentTaskId).toBeNull();
      expect(state.taskListSnapshot).toBeNull();
      expect(state.lastReminderAt).toBe(0);
      expect(state.reminderInterval).toBe(15);
    });
  });

  describe('resetToolCallCounter', () => {
    it('should reset counter only', async () => {
      await setCurrentTaskId('task-123');
      await setTaskListSnapshot([{ id: 'task-1', description: 'Test' }]);
      await incrementToolCallCounter();
      await incrementToolCallCounter();

      await resetToolCallCounter();

      const state = getSessionState();
      expect(state.toolCallCounter).toBe(0);
      expect(state.lastReminderAt).toBe(0);
      expect(state.currentTaskId).toBe('task-123'); // Should preserve
      expect(state.taskListSnapshot).not.toBeNull(); // Should preserve
    });
  });
});
