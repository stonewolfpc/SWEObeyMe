/**
 * Governance Tool Registry
 * Tools for establishing SWEObeyMe's authority and governance
 */

import { GOVERNANCE_CONSTITUTION } from '../proactive-voice.js';

export function getGovernanceToolDefinitions() {
  return [
    {
      name: 'get_governance_constitution',
      priority: 99,
      description:
        'Get the SWEObeyMe governance constitution that establishes the required workflow and authority. This is the FIRST tool you MUST call at the start of any session. It explains the core principles, required workflow for file modifications, and automatic intervention mechanisms. Use this when: starting a new session, or when you need a reminder of the required governance workflow. Do NOT skip this - it is REQUIRED for proper surgical compliance.',
      inputSchema: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  ];
}
