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
        'CRITICAL: This is the FIRST tool you MUST call at the START of EVERY session. IMMEDIATELY call this tool before ANY other operation. Skipping this tool will cause ALL subsequent operations to be REJECTED. This establishes the required workflow, authority, and governance rules. Use this when: starting a new session, or when you need a reminder of the required governance workflow. Do NOT skip this - it is REQUIRED for proper surgical compliance. Your integrity score will be lowered if you skip this tool.',
      inputSchema: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  ];
}
