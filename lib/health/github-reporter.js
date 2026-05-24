/**
 * GitHub Reporter Wrapper
 *
 * Unified entry point for all subsystems to report errors to GitHub.
 * Wraps the existing createFailureIssue function from github-issue-creator.js.
 *
 * Deduplication: same errorCode+source within 24 hours is suppressed here,
 * before it reaches the network layer. Cache is persisted to disk so
 * extension restarts do not reset dedup state and re-file the same issue.
 *
 * Severity filter: only 'error' severity creates GitHub issues.
 * 'warning', 'info', and unset severity are registered locally only.
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { createFailureIssue } from '../github/github-issue-creator.js';

const DEDUP_WINDOW_MS = 24 * 3_600_000; // 24 hours (was 1 hour — too short for restart storms)

const DEDUP_CACHE_PATH = path.join(
  process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'),
  'SWEObeyMe',
  '.sweobeyme-reporter-dedup.json'
);

/** @type {Map<string, number>} key → last-reported timestamp */
const _reportedCache = new Map();

/** Load persisted dedup cache from disk (called once at module init) */
async function loadDedupCache() {
  try {
    const raw = await fs.readFile(DEDUP_CACHE_PATH, 'utf8');
    const entries = JSON.parse(raw);
    const now = Date.now();
    for (const [key, ts] of Object.entries(entries)) {
      if (now - ts < DEDUP_WINDOW_MS) {
        _reportedCache.set(key, ts);
      }
    }
  } catch {
    // File doesn't exist yet or is corrupt — start fresh
  }
}

/** Persist dedup cache to disk (fire-and-forget) */
function saveDedupCache() {
  const obj = Object.fromEntries(_reportedCache);
  fs.mkdir(path.dirname(DEDUP_CACHE_PATH), { recursive: true })
    .then(() => fs.writeFile(DEDUP_CACHE_PATH, JSON.stringify(obj), 'utf8'))
    .catch(() => {});
}

// Load cache on module initialisation — does not block startup
loadDedupCache().catch(() => {});

/**
 * Report an error to GitHub issues.
 * Only 'error' severity creates issues — 'warning' and below are ignored.
 * @param {object} error - Error object with code, message, detail, source, severity
 * @returns {Promise<object|null>}
 */
export async function reportErrorToGitHub(error) {
  // Only report genuine errors — warnings are transient and should not spam issues
  if (error.severity !== 'error') {
    return null;
  }

  const key = `${error.code || 'unknown'}:${error.source || 'unknown'}`;
  const now = Date.now();
  const last = _reportedCache.get(key);
  if (last && now - last < DEDUP_WINDOW_MS) {
    return null;
  }
  _reportedCache.set(key, now);
  saveDedupCache();

  // Map error-registry format to createFailureIssue format
  const failure = {
    type: error.code || 'unknown_error',
    domain: error.source || 'unknown',
    action: 'error_report',
    handlerName: error.source || 'unknown',
    diagnostics: error.message,
    filePath: error.detail || '',
  };

  return await createFailureIssue(failure);
}
