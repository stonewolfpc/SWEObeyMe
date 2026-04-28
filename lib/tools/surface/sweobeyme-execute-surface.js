/**
 * sweobeyme_execute Surface Tool
 *
 * AI-facing semantic entry point for advanced operations and catch-all routing.
 * Directly accepts domain/action/payload for any SWEObeyMe operation.
 *
 * Use this when you need to:
 * - Perform operations not covered by other surface tools
 * - Access internal handlers directly
 * - Execute complex multi-domain operations
 * - Handle edge cases and advanced scenarios
 */

import { governanceRouterHandler } from '../governance-router-handler.js';

/**
 * SWEObeyMe execute handler - catch-all router
 * @param {Object} params - Operation parameters
 * @param {string} params.domain - Domain for operation (files, backup, search, docs, memory, project, validation, context, safety, config, workflow, refactor, autonomous, agent, csharp, cpp, governance, error, spec, codebase, godot, patreon)
 * @param {string} params.action - Action within the domain
 * @param {Object} [params.payload={}] - Operation-specific payload
 * @returns {Promise<Object>} Operation result
 */
export async function sweobeymeExecuteHandler(params) {
  const { domain, action, payload = {} } = params;

  if (!domain) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'domain parameter is required (files, backup, search, docs, memory, project, validation, context, safety, config, workflow, refactor, autonomous, agent, csharp, cpp, governance, error, spec, codebase, godot, patreon)' }],
    };
  }

  if (!action) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'action parameter is required for the specified domain' }],
    };
  }

  // Route directly through governance router
  const result = await governanceRouterHandler({
    domain,
    action,
    payload,
  });

  // Transform governance response to MCP response format
  if (result.status === 'error') {
    return {
      isError: true,
      content: [{ type: 'text', text: result.diagnostics }],
    };
  }

  return result.result;
}
