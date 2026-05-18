/**
 * GitHub Reporter Wrapper
 *
 * Unified entry point for all subsystems to report errors to GitHub.
 * Wraps the existing createFailureIssue function from github-issue-creator.js.
 *
 * Deduplication: same errorCode+source within 1 hour is suppressed here,
 * before it reaches the network layer, preventing issue floods from
 * high-frequency callers (backup-auto, dependency-sentinel).
 */

import { createFailureIssue } from '../github/github-issue-creator.js';

const DEDUP_WINDOW_MS = 3_600_000; // 1 hour
/** @type {Map<string, number>} key → last-reported timestamp */
const _reportedCache = new Map();

/**
 * Report an error to GitHub issues
 * @param {object} error - Error object with code, message, detail, source, severity
 * @returns {Promise<object|null>}
 */
export async function reportErrorToGitHub(error) {
  const key = `${error.code || 'unknown'}:${error.source || 'unknown'}`;
  const now = Date.now();
  const last = _reportedCache.get(key);
  if (last && now - last < DEDUP_WINDOW_MS) {
    return null;
  }
  _reportedCache.set(key, now);

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
