/**
 * Governance Tool Handlers
 * Handlers for establishing SWEObeyMe's authority and governance
 */

import { GOVERNANCE_CONSTITUTION } from '../../lib/proactive-voice.js';
import { getSessionTracker } from '../session-tracker.js';

/**
 * Governance handlers
 */
export const governanceHandlers = {
  /**
   * Get the governance constitution
   */
  get_governance_constitution: async () => {
    // Track this tool call
    const sessionTracker = getSessionTracker();
    if (sessionTracker) {
      const sessionId = 'default-session';
      sessionTracker.trackToolCall(sessionId, 'get_governance_constitution');
    }
    
    return {
      content: [{ type: 'text', text: GOVERNANCE_CONSTITUTION }],
    };
  },
};
