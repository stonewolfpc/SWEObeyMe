/**
 * Safe File Operations Tool Registry
 * Tools for safe file operations with timeout protection and chunked reading
 */

export function getSafeFileOperationsToolDefinitions() {
  return [
    {
      name: 'file_info',
      priority: 90,
      description:
        'Swiss-army-knife for safe file operations. Check file stats, verify safe to read, or read file in chunks. Use this BEFORE read_file to prevent hangs on large files. Returns size, line count, category, safe status, and chunked content.',
      inputSchema: {
        type: 'object',
        properties: {
          operation: {
            type: 'string',
            enum: ['stats', 'safe_check', 'read_chunked'],
            description: 'Operation to perform',
          },
          path: { type: 'string', description: 'File path to check/read' },
          maxLines: {
            type: 'number',
            description: 'Maximum allowed lines (for "safe_check" operation)',
          },
          maxReadTime: {
            type: 'number',
            description: 'Maximum allowed read time in ms (for "safe_check" operation)',
          },
          offset: {
            type: 'number',
            description: 'Starting line number (for "read_chunked" operation)',
          },
          limit: {
            type: 'number',
            description: 'Maximum lines to read (for "read_chunked" operation)',
          },
          timeout: {
            type: 'number',
            description: 'Timeout in milliseconds (for "read_chunked" operation)',
          },
        },
        required: ['operation', 'path'],
      },
    },
  ];
}
