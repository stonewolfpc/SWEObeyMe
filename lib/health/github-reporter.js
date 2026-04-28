/**
 * GitHub Reporter Wrapper
 *
 * Unified entry point for all subsystems to report errors to GitHub.
 * Wraps the existing createFailureIssue function from github-issue-creator.js.
 */

import { createFailureIssue } from '../github/github-issue-creator.js';

/**
 * Report an error to GitHub issues
 * @param {object} error - Error object with code, message, detail, source, severity
 * @returns {Promise<object|null>}
 */
export async function reportErrorToGitHub(error) {
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
