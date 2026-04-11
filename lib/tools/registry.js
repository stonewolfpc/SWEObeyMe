import { getCoreToolDefinitions } from './registry-core.js';
import { getConfigToolDefinitions } from './registry-config.js';
import { getValidationToolDefinitions } from './registry-validation.js';
import { getContextToolDefinitions } from './registry-context.js';
import { getSafetyToolDefinitions, getFeedbackToolDefinitions } from './registry-safety-feedback.js';
import { getCSharpToolDefinitions } from './registry-csharp.js';
import { getCodeSearchToolDefinitions } from './registry-code-search.js';
import { getProjectIntegrityToolDefinitions, getProjectMemoryToolDefinitions } from './registry-project.js';
// Documentation tools consolidated into unified registry (saves 10 tools)
import { getDocsToolDefinitions } from './registry-docs.js';
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
    // Consolidated docs tools (replaces math, fdq, training, unified, llama docs - saves 10 tools)
    ...getDocsToolDefinitions(),
    ...getGodotToolDefinitions(),
    ...getPatreonToolDefinitions(),
  ];

  return allTools.sort((a, b) => (b.priority || 0) - (a.priority || 0));
}
