/**
 * Error Registry
 *
 * Centralized error tracking for all monitoring systems.
 * Collects errors from dependency checker, config validator, watchdogs, etc.
 * Provides API for UI to subscribe to error state.
 */

const errors = [];
const listeners = new Set();

/**
 * Register an error
 * @param {object} error - Error object with code, message, detail, source, severity
 */
export function registerError(error) {
  const errorEntry = {
    code: error.code,
    message: error.message,
    detail: error.detail || '',
    source: error.source || 'unknown',
    severity: error.severity || 'error',
    timestamp: Date.now(),
  };
  errors.push(errorEntry);
  notifyListeners();
}

/**
 * Get all errors
 * @returns {Array<object>} All registered errors
 */
export function getErrors() {
  return [...errors];
}

/**
 * Clear all errors
 */
export function clearErrors() {
  errors.length = 0;
  notifyListeners();
}

/**
 * Get worst severity level
 * @returns {string} 'info' | 'warning' | 'error' | 'critical'
 */
export function getWorstSeverity() {
  if (errors.length === 0) return 'info';

  const severityOrder = { info: 0, warning: 1, error: 2, critical: 3 };
  let worst = 'info';

  for (const error of errors) {
    const order = severityOrder[error.severity] || 0;
    const worstOrder = severityOrder[worst] || 0;
    if (order > worstOrder) worst = error.severity;
  }

  return worst;
}

/**
 * Get error count by severity
 * @returns {object} Counts by severity level
 */
export function getErrorCounts() {
  const counts = { info: 0, warning: 0, error: 0, critical: 0 };
  for (const error of errors) {
    const severity = error.severity || 'error';
    if (counts[severity] !== undefined) counts[severity]++;
  }
  return counts;
}

/**
 * Subscribe to error changes
 * @param {function} listener - Callback function called on error changes
 * @returns {function} Unsubscribe function
 */
export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Notify all listeners of error changes
 */
function notifyListeners() {
  for (const listener of listeners) {
    try {
      listener({
        errors: getErrors(),
        worstSeverity: getWorstSeverity(),
        counts: getErrorCounts(),
      });
    } catch (e) {
      // Ignore listener errors
    }
  }
}

/**
 * Get summary for UI
 * @returns {object} Summary object with status, counts, recent errors
 */
export function getSummary() {
  const counts = getErrorCounts();
  const worst = getWorstSeverity();
  const total = errors.length;

  let status = 'healthy';
  if (total > 0) {
    if (worst === 'critical') status = 'critical';
    else if (worst === 'error') status = 'degraded';
    else if (worst === 'warning') status = 'warning';
  }

  return {
    status,
    worstSeverity: worst,
    total,
    counts,
    recentErrors: errors.slice(-5),
  };
}
