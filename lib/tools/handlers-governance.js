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
    // Validate constitution is loaded
    if (!GOVERNANCE_CONSTITUTION) {
      return {
        content: [
          {
            type: 'text',
            text: 'ERROR: Governance constitution not loaded. This is a critical error.',
          },
        ],
      };
    }

    // Track this tool call (non-critical, don't fail if it errors)
    try {
      const sessionTracker = getSessionTracker();
      if (sessionTracker) {
        const sessionId = 'default-session';
        sessionTracker.trackToolCall(sessionId, 'get_governance_constitution');
      }
    } catch (error) {
      // Tracking failed, but don't fail the tool
      console.error('[SWEObeyMe] Session tracker error:', error);
    }

    return {
      content: [{ type: 'text', text: GOVERNANCE_CONSTITUTION }],
    };
  },
};
