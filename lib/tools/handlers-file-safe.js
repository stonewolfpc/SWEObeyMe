/**
 * Safe File Operations Handlers
 * Handlers for safe file operations with timeout protection and chunked reading
 */

import {
  getFileStats,
  readFileChunked,
  isSafeToRead,
  THRESHOLDS,
} from '../../lib/file-operations-safe.js';

/**
 * Safe file operations handlers
 */
export const safeFileOperationsHandlers = {
  /**
   * Check file statistics without reading content
   */
  check_file_stats: async (args) => {
    if (!args.path) {
      return {
        isError: true,
        content: [{ type: 'text', text: 'ERROR: "path" parameter is REQUIRED.' }],
      };
    }

    try {
      const stats = await getFileStats(args.path);

      if (!stats.exists) {
        return {
          content: [
            {
              type: 'text',
              text: `File does not exist: ${args.path}`,
            },
          ],
        };
      }

      let message = `=== FILE STATISTICS ===\n`;
      message += `Path: ${args.path}\n`;
      message += `Size: ${stats.size} bytes\n`;
      message += `Line Count: ${stats.lineCount}\n`;
      message += `Category: ${stats.category}\n`;
      message += `Estimated Read Time: ${stats.estimatedReadTime}ms\n`;
      message += `=== END STATISTICS ===\n\n`;
      message += `RECOMMENDATION: `;

      if (stats.lineCount <= THRESHOLDS.MEDIUM) {
        message += `File is small (${stats.lineCount} lines). Safe to read with read_file.`;
      } else if (stats.lineCount <= THRESHOLDS.LARGE) {
        message += `File is medium (${stats.lineCount} lines). Use read_file_chunked with limit=${stats.lineCount}.`;
      } else {
        message += `File is large (${stats.lineCount} lines). Use read_file_chunked with limit=1000 or smaller.`;
      }

      return {
        content: [{ type: 'text', text: message }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `ERROR: ${error.message}` }],
      };
    }
  },

  /**
   * Read file in chunks with line numbers
   */
  read_file_chunked: async (args) => {
    if (!args.path) {
      return {
        isError: true,
        content: [{ type: 'text', text: 'ERROR: "path" parameter is REQUIRED.' }],
      };
    }

    try {
      const offset = args.offset || 1;
      const limit = args.limit || 1000;
      const timeout = args.timeout || 5000;

      const result = await readFileChunked(args.path, offset, limit, timeout);

      let message = `=== CHUNKED FILE READ ===\n`;
      message += `Path: ${args.path}\n`;
      message += `Total Lines: ${result.totalLines}\n`;
      message += `Lines Read: ${result.linesRead}\n`;
      message += `Offset: ${result.offset}\n`;
      message += `Limit: ${result.limit}\n`;
      message += `Has More: ${result.hasMore ? 'Yes' : 'No'}\n`;
      message += `=== END METADATA ===\n\n`;
      message += result.content;

      if (result.hasMore) {
        message += `\n\n[INFO] More lines available. Use offset=${offset + limit} to read next chunk.`;
      }

      return {
        content: [{ type: 'text', text: message }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `ERROR: ${error.message}` }],
      };
    }
  },

  /**
   * Check if file is safe to read
   */
  is_safe_to_read: async (args) => {
    if (!args.path) {
      return {
        isError: true,
        content: [{ type: 'text', text: 'ERROR: "path" parameter is REQUIRED.' }],
      };
    }

    try {
      const maxLines = args.maxLines || 1000;
      const maxReadTime = args.maxReadTime || 5000;

      const result = await isSafeToRead(args.path, { maxLines, maxReadTime });

      let message = `=== FILE SAFETY CHECK ===\n`;
      message += `Path: ${args.path}\n`;
      message += `Safe: ${result.safe ? 'Yes' : 'No'}\n`;

      if (result.reason) {
        message += `Reason: ${result.reason}\n`;
      }

      if (result.recommendation) {
        message += `Recommendation: ${result.recommendation}\n`;
      }

      if (result.stats) {
        message += `\nStatistics:\n`;
        message += `  Size: ${result.stats.size} bytes\n`;
        message += `  Line Count: ${result.stats.lineCount}\n`;
        message += `  Category: ${result.stats.category}\n`;
        message += `  Estimated Read Time: ${result.stats.estimatedReadTime}ms\n`;
      }

      message += `=== END SAFETY CHECK ===`;

      return {
        content: [{ type: 'text', text: message }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `ERROR: ${error.message}` }],
      };
    }
  },

  /**
   * Dispatcher: file_info swiss-army-knife handler
   * Routes to appropriate handler based on operation parameter
   */
  file_info: async (params) => {
    const { operation, path, maxLines, maxReadTime, offset, limit, timeout } = params;

    if (!operation) {
      return {
        isError: true,
        content: [{ type: 'text', text: 'operation parameter is required' }],
      };
    }

    switch (operation) {
      case 'stats':
        return await safeFileOperationsHandlers.check_file_stats({ path });
      case 'safe_check':
        return await safeFileOperationsHandlers.is_safe_to_read({ path, maxLines, maxReadTime });
      case 'read_chunked':
        return await safeFileOperationsHandlers.read_file_chunked({ path, offset, limit, timeout });
      default:
        return {
          isError: true,
          content: [{ type: 'text', text: `Unknown operation: ${operation}` }],
        };
    }
  },
};
