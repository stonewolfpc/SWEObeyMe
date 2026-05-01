/**
 * project_context Surface Tool
 *
 * AI-facing semantic entry point for project context operations.
 * Routes to governance router with domain=project.
 *
 * Use this when you need to:
 * - Get project context and information
 * - Track project changes
 * - Detect project type
 * - Switch between projects
 * - Get current project status
 */

import { governanceRouterHandler } from '../governance-router-handler.js';

/**
 * Project context operations handler
 * @param {Object} params - Operation parameters
 * @param {string} params.operation - Operation type: 'context', 'track', 'detect_type', 'detect_switch', 'get_current', 'switch'
 * @param {string} [params.file_path] - File path for detection operations
 * @param {string} [params.project_path] - Project path for switch operations
 * @param {string} [params.operation_type] - Operation type for tracking
 * @returns {Promise<Object>} Operation result
 */
export async function projectContextHandler(params) {
  const { operation, file_path, project_path, operation_type } = params;

  if (!operation) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: 'operation parameter is required (context, track, detect_type, detect_switch, get_current, switch)',
        },
      ],
    };
  }

  // Build payload based on operation
  const payload = {};

  switch (operation) {
    case 'context':
      // No additional payload needed
      break;
    case 'track':
      if (operation_type) payload.operation_type = operation_type;
      break;
    case 'detect_type':
    case 'detect_switch':
      if (!file_path) {
        return {
          isError: true,
          content: [
            { type: 'text', text: 'file_path parameter is required for detection operations' },
          ],
        };
      }
      payload.file_path = file_path;
      break;
    case 'get_current':
      // No additional payload needed
      break;
    case 'switch':
      if (!project_path) {
        return {
          isError: true,
          content: [
            { type: 'text', text: 'project_path parameter is required for switch operation' },
          ],
        };
      }
      payload.project_path = project_path;
      break;
    default:
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Unknown operation: ${operation}. Valid: context, track, detect_type, detect_switch, get_current, switch`,
          },
        ],
      };
  }

  // Route through governance router (with timeout to prevent hangs)
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('project_context governance router timeout (30s)')), 30000)
  );
  const result = await Promise.race([
    governanceRouterHandler({
      domain: 'project',
      action: 'manage',
      payload: { operation, ...payload },
    }),
    timeoutPromise,
  ]);

  // Transform governance response to MCP response format
  if (result.status === 'error') {
    return {
      isError: true,
      content: [{ type: 'text', text: result.diagnostics }],
    };
  }

  return result.result;
}
