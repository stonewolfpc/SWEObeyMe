/**
 * Governance Tool Handlers
 * Handlers for establishing SWEObeyMe's authority and governance
 */

import { GOVERNANCE_CONSTITUTION } from '../../lib/proactive-voice.js';

/**
 * Governance handlers
 */
export const governanceHandlers = {
  /**
   * Get the governance constitution
   */
  get_governance_constitution: async () => {
    return {
      content: [{ type: 'text', text: GOVERNANCE_CONSTITUTION }],
    };
  },
};
