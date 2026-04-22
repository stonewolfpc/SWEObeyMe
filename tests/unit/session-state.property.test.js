/**
 * Property-based tests for session-state module
 * Uses fast-check to generate thousands of random inputs
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  loadSessionState,
  incrementToolCallCounter,
  setReminderInterval,
  shouldShowReminder,
  clearSessionState,
  getSessionState,
  saveSessionState,
} from '../../lib/session-state.js';

const TEST_SESSION_FILE = path.join(os.homedir(), '.sweobeyme', 'session-state.json');

describe('session-state property-based tests', () => {
  beforeEach(() => {
    clearSessionState();
  });

  afterEach(() => {
    if (fs.existsSync(TEST_SESSION_FILE)) {
      fs.unlinkSync(TEST_SESSION_FILE);
    }
  });

  describe('incrementToolCallCounter', () => {
    it('should increment counter monotonically', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 100 }), (n) => {
          clearSessionState();
          
          for (let i = 0; i < n; i++) {
            incrementToolCallCounter();
          }
          
          const state = getSessionState();
          return state.toolCallCounter === n;
        })
      );
    });

    it('should never decrease counter', () => {
      fc.assert(
        fc.property(fc.array(fc.integer({ min: 0, max: 5 })), (increments) => {
          clearSessionState();
          
          let previous = 0;
          for (const inc of increments) {
            for (let i = 0; i < inc; i++) {
              incrementToolCallCounter();
            }
            const current = getSessionState().toolCallCounter;
            if (current < previous) return false;
            previous = current;
          }
          
          return true;
        })
      );
    });
  });

  describe('setReminderInterval', () => {
    it('should accept positive integers', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 100 }), (interval) => {
          clearSessionState();
          loadSessionState();
          
          setReminderInterval(interval);
          
          const state = loadSessionState();
          return state.reminderInterval === interval;
        })
      );
    });

    it('should persist interval across loads', () => {
      fc.assert(
        fc.property(fc.integer({ min: 5, max: 50 }), (interval) => {
          clearSessionState();
          loadSessionState();
          
          setReminderInterval(interval);
          
          // Reload state
          const state = loadSessionState();
          return state.reminderInterval === interval;
        })
      );
    });
  });

  describe('shouldShowReminder', () => {
    it('should show reminder at interval multiples', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 5, max: 30 }), // interval
          fc.integer({ min: 1, max: 100 }), // call count
          (interval, callCount) => {
            clearSessionState();
            loadSessionState();
            
            setReminderInterval(interval);
            // Mock task list
            const state = loadSessionState();
            state.taskListSnapshot = [{ id: 'task-1', description: 'Test' }];
            
            // Increment to call count
            for (let i = 0; i < callCount; i++) {
              incrementToolCallCounter();
            }
            
            const shouldShow = shouldShowReminder();
            
            // Should show if callCount is a multiple of interval and >= 10 calls since last reminder
            const isMultiple = callCount % interval === 0;
            const isPastThreshold = callCount >= 10;
            
            return isMultiple && isPastThreshold ? shouldShow : !shouldShow;
          }
        )
      );
    });

    it('should not show reminder without task list', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 100 }), (callCount) => {
          clearSessionState();
          loadSessionState();
          
          for (let i = 0; i < callCount; i++) {
            incrementToolCallCounter();
          }
          
          return !shouldShowReminder();
        })
      );
    });
  });

  describe('state persistence', () => {
    it('should preserve all state fields across reloads', async () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }), // toolCallCounter
          fc.uuid(), // currentTaskId
          fc.array(fc.object({ id: fc.uuid(), description: fc.string() })), // taskListSnapshot
          fc.integer({ min: 5, max: 50 }), // reminderInterval
          (counter, taskId, taskList, interval) => {
            clearSessionState();
            loadSessionState();
            
            // Set state directly
            const state = getSessionState();
            state.toolCallCounter = counter;
            state.currentTaskId = taskId;
            state.taskListSnapshot = taskList;
            state.reminderInterval = interval;
            
            // Save to disk
            saveSessionState();
            
            // Reload
            const reloaded = loadSessionState();
            
            return (
              reloaded.toolCallCounter === counter &&
              reloaded.currentTaskId === taskId &&
              JSON.stringify(reloaded.taskListSnapshot) === JSON.stringify(taskList) &&
              reloaded.reminderInterval === interval
            );
          }
        )
      );
    });
  });
});
