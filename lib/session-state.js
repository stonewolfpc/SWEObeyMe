/**
 * Session State Management
 * 
 * Persists session state across MCP server reconnects and new chats.
 * Stores: tool call counter, current task ID, task list snapshot, reminder configuration.
 * Location: ~/.sweobeyme/session-state.json
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { readFileSafe, writeFileSafe, existsSafe } from './shared/async-utils.js';

const SESSION_STATE_FILE = path.join(os.homedir(), '.sweobeyme', 'session-state.json');

// Ensure .sweobeyme directory exists (async)
const ensureDir = async () => {
  const dir = path.dirname(SESSION_STATE_FILE);
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
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
 * Load session state from disk (async with timeout)
 */
export async function loadSessionState() {
  try {
    await ensureDir();
    if (await existsSafe(SESSION_STATE_FILE, 1000, 'loadSessionState exists')) {
      const data = await readFileSafe(SESSION_STATE_FILE, 10000, 'loadSessionState read');
      const loadedState = JSON.parse(data);
      // Merge loaded state with defaults (loaded state takes precedence)
      Object.assign(sessionState, { ...defaultState, ...loadedState });
      console.log('[Session State] Loaded from disk');
    } else {
      Object.assign(sessionState, defaultState);
      sessionState.createdAt = new Date().toISOString();
      await saveSessionState();
    }
  } catch (error) {
    console.error('[Session State] Failed to load:', error);
    Object.assign(sessionState, defaultState);
    sessionState.createdAt = new Date().toISOString();
  }
  return sessionState;
}

/**
 * Save session state to disk (async with timeout)
 */
export async function saveSessionState() {
  try {
    await ensureDir();
    sessionState.updatedAt = new Date().toISOString();
    await writeFileSafe(SESSION_STATE_FILE, JSON.stringify(sessionState, null, 2), 10000, 'saveSessionState write');
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
 * Increment tool call counter (async)
 */
export async function incrementToolCallCounter() {
  sessionState.toolCallCounter++;
  await saveSessionState();
  return sessionState.toolCallCounter;
}

/**
 * Set current task ID (async)
 */
export async function setCurrentTaskId(taskId) {
  sessionState.currentTaskId = taskId;
  await saveSessionState();
}

/**
 * Set task list snapshot (async)
 */
export async function setTaskListSnapshot(taskList) {
  sessionState.taskListSnapshot = taskList;
  await saveSessionState();
}

/**
 * Set reminder interval (async)
 */
export async function setReminderInterval(interval) {
  sessionState.reminderInterval = interval;
  await saveSessionState();
}

/**
 * Update last reminder timestamp (async)
 */
export async function updateLastReminder(callCount) {
  sessionState.lastReminderAt = callCount;
  await saveSessionState();
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
export async function clearSessionState() {
  Object.assign(sessionState, defaultState);
  sessionState.createdAt = new Date().toISOString();
  sessionState.updatedAt = new Date().toISOString();
  await saveSessionState();
}

/**
 * Reset tool call counter only (keep task state)
 */
export async function resetToolCallCounter() {
  sessionState.toolCallCounter = 0;
  sessionState.lastReminderAt = 0;
  await saveSessionState();
}
