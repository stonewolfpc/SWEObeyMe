/**
 * Session Tracker
 * Tracks tool calls, errors, and integrity scores for each session
 * Used to enforce workflow and provide feedback on compliance
 */

class SessionTracker {
  constructor() {
    // Map: sessionId -> { toolsCalled: Set(), errors: number, integrityScore: number, startTime: number }
    this.sessions = new Map();
    this.maxSessionAge = 3600000; // 1 hour in milliseconds
  }

  /**
   * Get or create a session
   */
  getSession(sessionId) {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, {
        toolsCalled: new Set(),
        errors: 0,
        integrityScore: 100,
        startTime: Date.now(),
      });
    }
    return this.sessions.get(sessionId);
  }

  /**
   * Track a tool call
   */
  trackToolCall(sessionId, toolName) {
    const session = this.getSession(sessionId);
    session.toolsCalled.add(toolName);

    // Clean up old sessions periodically
    this.cleanupOldSessions();
  }

  /**
   * Check if a tool has been called in the session
   */
  hasCalledTool(sessionId, toolName) {
    const session = this.sessions.get(sessionId);
    return session?.toolsCalled.has(toolName) || false;
  }

  /**
   * Record an error
   */
  recordError(sessionId, severity = 'medium') {
    const session = this.getSession(sessionId);
    session.errors++;

    // Lower integrity score based on severity
    const penalty = severity === 'high' ? 20 : severity === 'medium' ? 10 : 5;
    session.integrityScore = Math.max(0, session.integrityScore - penalty);
  }

  /**
   * Record a success
   */
  recordSuccess(sessionId) {
    const session = this.getSession(sessionId);
    session.integrityScore = Math.min(100, session.integrityScore + 2);
  }

  /**
   * Get session status
   */
  getSessionStatus(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return {
        toolsCalled: [],
        errors: 0,
        integrityScore: 100,
        hasCalledGovernanceConstitution: false,
      };
    }

    return {
      toolsCalled: Array.from(session.toolsCalled),
      errors: session.errors,
      integrityScore: session.integrityScore,
      hasCalledGovernanceConstitution: session.toolsCalled.has('get_governance_constitution'),
      hasCalledObeySurgicalPlan: session.toolsCalled.has('obey_surgical_plan'),
      hasCalledGetFileContext: session.toolsCalled.has('get_file_context'),
      sessionAge: Date.now() - session.startTime,
    };
  }

  /**
   * Clean up old sessions
   */
  cleanupOldSessions() {
    const now = Date.now();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.startTime > this.maxSessionAge) {
        this.sessions.delete(sessionId);
      }
    }
  }

  /**
   * Reset a session (for testing or manual reset)
   */
  resetSession(sessionId) {
    this.sessions.delete(sessionId);
  }

  /**
   * Get all sessions (for debugging)
   */
  getAllSessions() {
    return Object.fromEntries(
      Array.from(this.sessions.entries()).map(([id, session]) => [
        id,
        {
          toolsCalled: Array.from(session.toolsCalled),
          errors: session.errors,
          integrityScore: session.integrityScore,
          sessionAge: Date.now() - session.startTime,
        },
      ])
    );
  }
}

// Global instance
let globalTracker = null;

/**
 * Initialize global session tracker
 */
export function initializeSessionTracker() {
  if (!globalTracker) {
    globalTracker = new SessionTracker();
  }
  return globalTracker;
}

/**
 * Get global session tracker
 */
export function getSessionTracker() {
  return globalTracker;
}
