/**
 * file_ops Surface Tool
 * 
 * AI-facing semantic entry point for file operations.
 * Routes to governance router with domain=files.
 * 
 * Use this when you need to:
 * - Read a file
 * - Write to a file
 * - Get file information
 * - Analyze code in a file
 * - Extract code to a new file
 */

import { governanceRouterHandler } from '../governance-router-handler.js';

/**
 * File operations handler
 * @param {Object} params - Operation parameters
 * @param {string} params.operation - Operation type: 'read', 'write', 'info', 'analyze', 'extract'
 * @param {string} params.path - File path
 * @param {string} [params.content] - Content for write operations
 * @param {number} [params.offset] - Start line for read operations
 * @param {number} [params.limit] - Line count for read operations
 * @returns {Promise<Object>} Operation result
 */
export async function fileOpsHandler(params) {
  const { operation, path, content, offset, limit } = params;

  if (!operation) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'operation parameter is required (read, write, info, analyze, extract)' }],
    };
  }

  if (!path) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'path parameter is required' }],
    };
  }

  // Build payload based on operation
  const payload = { path };

  switch (operation) {
    case 'read':
      if (offset !== undefined) payload.offset = offset;
      if (limit !== undefined) payload.limit = limit;
      break;
    case 'write':
      if (!content) {
        return {
          isError: true,
          content: [{ type: 'text', text: 'content parameter is required for write operation' }],
        };
      }
      payload.content = content;
      break;
    case 'extract':
      if (!content) {
        return {
          isError: true,
          content: [{ type: 'text', text: 'content parameter is required for extract operation' }],
        };
      }
      payload.content = content;
      break;
    case 'info':
    case 'analyze':
      // No additional payload needed
      break;
    default:
      return {
        isError: true,
        content: [{ type: 'text', text: `Unknown operation: ${operation}. Valid: read, write, info, analyze, extract` }],
      };
  }

  // Route through governance router
  const result = await governanceRouterHandler({
    domain: 'files',
    action: operation,
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
