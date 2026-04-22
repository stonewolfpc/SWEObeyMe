/**
 * Governance Tool Registry
 * Tools for establishing SWEObeyMe's authority and governance
 */

import { GOVERNANCE_CONSTITUTION } from '../proactive-voice.js';

export function getGovernanceToolDefinitions() {
  return [
    {
      name: 'get_governance_constitution',
      priority: 999,
      description:
        'Establish the required workflow, authority, and governance rules. Call this tool at the START of EVERY session before other operations. Skipping this tool may cause subsequent operations to be rejected. Use this when: starting a new session, or when you need a reminder of the required governance workflow.',
      inputSchema: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  ];
}
