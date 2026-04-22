/**
 * Session State Management
 * 
 * Persists session state across MCP server reconnects and new chats.
 * Stores: tool call counter, current task ID, task list snapshot, reminder configuration.
 * Location: ~/.sweobeyme/session-state.json
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

const SESSION_STATE_FILE = path.join(os.homedir(), '.sweobeyme', 'session-state.json');

// Ensure .sweobeyme directory exists
const ensureDir = () => {
  const dir = path.dirname(SESSION_STATE_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Default session state structure
const defaultState = {
  toolCallCounter: 0,
  currentTaskId: null,
  taskListSnapshot: null,
  lastReminderAt: 0,
  reminderInterval: 15,
  createdAt: null,
  updatedAt: null,
};

let sessionState = { ...defaultState };

/**
 * Load session state from disk
 */
export function loadSessionState() {
  try {
    ensureDir();
    if (fs.existsSync(SESSION_STATE_FILE)) {
      const data = fs.readFileSync(SESSION_STATE_FILE, 'utf8');
      Object.assign(sessionState, defaultState, JSON.parse(data));
      console.log('[Session State] Loaded from disk');
    } else {
      Object.assign(sessionState, defaultState);
      sessionState.createdAt = new Date().toISOString();
      saveSessionState();
    }
  } catch (error) {
    console.error('[Session State] Failed to load:', error);
    Object.assign(sessionState, defaultState);
    sessionState.createdAt = new Date().toISOString();
  }
  return sessionState;
}

/**
 * Save session state to disk
 */
export function saveSessionState() {
  try {
    ensureDir();
    sessionState.updatedAt = new Date().toISOString();
    fs.writeFileSync(SESSION_STATE_FILE, JSON.stringify(sessionState, null, 2));
  } catch (error) {
    console.error('[Session State] Failed to save:', error);
  }
}

/**
 * Get current session state
 */
export function getSessionState() {
  return sessionState;
}

/**
 * Increment tool call counter
 */
export function incrementToolCallCounter() {
  sessionState.toolCallCounter++;
  saveSessionState();
  return sessionState.toolCallCounter;
}

/**
 * Set current task ID
 */
export function setCurrentTaskId(taskId) {
  sessionState.currentTaskId = taskId;
  saveSessionState();
}

/**
 * Set task list snapshot
 */
export function setTaskListSnapshot(taskList) {
  sessionState.taskListSnapshot = taskList;
  saveSessionState();
}

/**
 * Set reminder interval
 */
export function setReminderInterval(interval) {
  sessionState.reminderInterval = interval;
  saveSessionState();
}

/**
 * Update last reminder timestamp
 */
export function updateLastReminder(callCount) {
  sessionState.lastReminderAt = callCount;
  saveSessionState();
}

/**
 * Check if reminder should be shown
 */
export function shouldShowReminder() {
  const count = sessionState.toolCallCounter;
  const lastReminder = sessionState.lastReminderAt;
  const interval = sessionState.reminderInterval;
  
  // Show reminder if we've reached the interval threshold
  // and it's been at least 10 calls since the last reminder
  const shouldShow = count % interval === 0 && (count - lastReminder) >= 10;
  
  // Only show if there's an active task list
  if (!sessionState.taskListSnapshot || sessionState.taskListSnapshot.length === 0) {
    return false;
  }
  
  return shouldShow;
}

/**
 * Clear session state (called when task list is archived)
 */
export function clearSessionState() {
  Object.assign(sessionState, defaultState);
  sessionState.createdAt = new Date().toISOString();
  sessionState.updatedAt = new Date().toISOString();
  saveSessionState();
}

/**
 * Reset tool call counter only (keep task state)
 */
export function resetToolCallCounter() {
  sessionState.toolCallCounter = 0;
  sessionState.lastReminderAt = 0;
  saveSessionState();
}
