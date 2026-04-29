/**
 * backup_restore Surface Tool
 *
 * AI-facing semantic entry point for backup and restore operations.
 * Routes to governance router with domain=backup.
 *
 * Use this when you need to:
 * - Create a backup before making changes
 * - Restore a file from backup
 * - List available backups
 * - Get backup information
 * - Quick restore from snapshot
 */

import { governanceRouterHandler } from '../governance-router-handler.js';

/**
 * Backup and restore operations handler
 * @param {Object} params - Operation parameters
 * @param {string} params.operation - Operation type: 'create', 'restore', 'list', 'info', 'quick_restore'
 * @param {string} params.path - File path
 * @param {number} [params.backup_index] - Backup index for restore operations
 * @param {boolean} [params.from_snapshot] - Whether to restore from snapshot
 * @returns {Promise<Object>} Operation result
 */
export async function backupRestoreHandler(params) {
  const { operation, path, backup_index, from_snapshot } = params;

  if (!operation) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: 'operation parameter is required (create, restore, list, info, quick_restore)',
        },
      ],
    };
  }

  // Build payload based on operation
  const payload = {};

  switch (operation) {
    case 'create':
    case 'restore':
    case 'list':
    case 'info':
    case 'quick_restore':
      if (!path) {
        return {
          isError: true,
          content: [{ type: 'text', text: 'path parameter is required for this operation' }],
        };
      }
      payload.path = path;
      if (backup_index !== undefined) payload.backup_index = backup_index;
      if (from_snapshot !== undefined) payload.from_snapshot = from_snapshot;
      break;
    default:
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Unknown operation: ${operation}. Valid: create, restore, list, info, quick_restore`,
          },
        ],
      };
  }

  // Route through governance router (with timeout to prevent hangs)
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('backup_restore governance router timeout (30s)')), 30000)
  );
  const result = await Promise.race([
    governanceRouterHandler({
      domain: 'backup',
      action: 'manage',
      payload: { ...payload, operation },
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
