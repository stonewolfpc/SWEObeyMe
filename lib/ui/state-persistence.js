/**
 * State Persistence Manager
 *
 * Responsibility: Persist and restore UI state across VS Code sessions
 * Storage: VS Code globalState (workspace-independent)
 *
 * @module lib/ui/state-persistence
 */

import * as vscode from 'vscode';

const STATE_KEY = 'sweObeyMe.cockpit.state';

const DEFAULT_STATE = {
  mode: 'simple',
  activeTab: 'architecture',
  architecture: {
    zoom: 1.0,
    panX: 0,
    panY: 0,
    selectedLayer: null,
  },
  monitor: {
    paused: false,
    maxEvents: 200,
    filter: 'all',
  },
  validation: {
    lastRun: null,
    selectedCategory: 'all',
    results: null,
  },
  history: {
    search: '',
    filterType: 'all',
  },
  github: {
    enabled: false,
    owner: '',
    repo: '',
    issueCount24h: 0,
    lastIssueAt: null,
  },
};

/** @type {vscode.ExtensionContext|null} */
let _context = null;

/**
 * Initialize with VS Code extension context
 * @param {vscode.ExtensionContext} context
 */
export function initStatePersistence(context) {
  _context = context;
}

/**
 * Load persisted state, merging with defaults
 * @returns {object}
 */
export function loadState() {
  if (!_context) return { ...DEFAULT_STATE };
  try {
    const saved = _context.globalState.get(STATE_KEY, {});
    return deepMerge({ ...DEFAULT_STATE }, saved);
  } catch {
    return { ...DEFAULT_STATE };
  }
}

/**
 * Save state to VS Code globalState
 * @param {object} state
 */
export async function saveState(state) {
  if (!_context) return;
  try {
    await _context.globalState.update(STATE_KEY, state);
  } catch (err) {
    console.error('[StatePersistence] Failed to save state:', err.message);
  }
}

/**
 * Update a specific state key (dot-notation supported)
 * @param {string} keyPath - e.g. 'architecture.zoom'
 * @param {*} value
 */
export async function updateStateKey(keyPath, value) {
  const state = loadState();
  const parts = keyPath.split('.');
  let obj = state;
  for (let i = 0; i < parts.length - 1; i++) {
    if (typeof obj[parts[i]] !== 'object' || obj[parts[i]] === null) {
      obj[parts[i]] = {};
    }
    obj = obj[parts[i]];
  }
  obj[parts[parts.length - 1]] = value;
  await saveState(state);
  return state;
}

/**
 * Deep merge source into target (returns new object)
 * @param {object} target
 * @param {object} source
 * @returns {object}
 */
function deepMerge(target, source) {
  if (!source || typeof source !== 'object') return target;
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}
