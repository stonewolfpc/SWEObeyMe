/**
 * Governance Tool Handlers
 * Handlers for establishing SWEObeyMe's authority and governance
 */

import { GOVERNANCE_CONSTITUTION } from '../../lib/proactive-voice.js';
import { getSessionTracker } from '../session-tracker.js';

const log = (msg) => {
  if (process.env.SWEOBEYME_DEBUG !== '1') return;
  try {
    process.stderr.write(`[SWEObeyMe-Governance]: ${msg}\n`);
  } catch (e) {
    // Silently drop if stderr pipe closed
  }
};

/**
 * Governance handlers
 */
export const governanceHandlers = {
  /**
   * Get the governance constitution
   */
  get_governance_constitution: async () => {
    log('Attempting to retrieve governance constitution.');
    try {
      // Validate constitution is loaded
      if (!GOVERNANCE_CONSTITUTION) {
        log('ERROR: GOVERNANCE_CONSTITUTION is not loaded.');
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
          log('get_governance_constitution tool call tracked.');
        }
      } catch (error) {
        log(`Session tracker error: ${error.message}`);
        // Tracking failed, but don't fail the tool
        console.error('[SWEObeyMe] Session tracker error:', error);
      }

      log('Governance constitution retrieved successfully.');
      return {
        content: [{ type: 'text', text: GOVERNANCE_CONSTITUTION }],
      };
    } catch (error) {
      log(`CRITICAL ERROR in get_governance_constitution: ${error.message}`);
      console.error('[SWEObeyMe] CRITICAL ERROR in get_governance_constitution:', error);
      return {
        content: [
          {
            type: 'text',
            text: `CRITICAL ERROR: Failed to retrieve governance constitution: ${error.message}`,
          },
        ],
      };
    }
  },
};
