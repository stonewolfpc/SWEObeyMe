// Session Memory Store - tracks actions for accountability
export const sessionMemory = {
  history: [],
  lastAction: null,
  pendingSplits: [],
  violationCount: 0,
  maxHistory: 20,
};

/**
 * Helper to push to memory
 */
export function recordAction(action, details, status = 'success') {
  sessionMemory.history.unshift({
    timestamp: new Date().toISOString(),
    action,
    details,
    status,
  });
  if (sessionMemory.history.length > sessionMemory.maxHistory) {
    sessionMemory.history.pop();
  }
  sessionMemory.lastAction = action;
}
