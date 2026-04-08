import { getCoreToolDefinitions } from './registry-core.js';
import { getConfigToolDefinitions } from './registry-config.js';
import { getValidationToolDefinitions } from './registry-validation.js';
import { getContextToolDefinitions } from './registry-context.js';
import { getSafetyToolDefinitions, getFeedbackToolDefinitions } from './registry-safety-feedback.js';
import { getCSharpToolDefinitions } from './registry-csharp.js';
import { getCodeSearchToolDefinitions } from './registry-code-search.js';
import { getProjectIntegrityToolDefinitions, getProjectMemoryToolDefinitions } from './registry-project.js';
import { getMathToolDefinitions } from './registry-math.js';
import { getGodotToolDefinitions } from './registry-godot.js';
import { getProjectAwarenessToolDefinitions } from './registry-project-awareness.js';
import { getPatreonToolDefinitions } from './registry-patreon.js';

/**
 * Main tool definitions registry
 * This file imports and exports all tool definitions to maintain the 700-line surgical limit
 */
export function getToolDefinitions() {
  const allTools = [
    ...getProjectAwarenessToolDefinitions(),
    ...getCoreToolDefinitions(),
    ...getConfigToolDefinitions(),
    ...getValidationToolDefinitions(),
    ...getContextToolDefinitions(),
    ...getSafetyToolDefinitions(),
    ...getFeedbackToolDefinitions(),
    ...getCSharpToolDefinitions(),
    ...getCodeSearchToolDefinitions(),
    ...getProjectIntegrityToolDefinitions(),
    ...getProjectMemoryToolDefinitions(),
    ...getMathToolDefinitions(),
    ...getGodotToolDefinitions(),
    ...getPatreonToolDefinitions(),
  ];

  return allTools.sort((a, b) => (b.priority || 0) - (a.priority || 0));
}
