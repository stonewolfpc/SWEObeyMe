/**
 * Safe File Operations Tool Registry
 * Tools for safe file operations with timeout protection and chunked reading
 */

export function getSafeFileOperationsToolDefinitions() {
  return [
    {
      name: 'check_file_stats',
      priority: 95,
      description:
        'Check file statistics (size, line count, category) without reading content. Use this BEFORE read_file to prevent hangs on large files. Returns: exists, size, lineCount, category (small/medium/large/huge), estimatedReadTime. Use this when: you want to check if a file is safe to read, or estimate read time. Do NOT use this for: reading file content. Example: check_file_stats to see if handlers-file-ops.js is too large to read at once.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to check' },
        },
        required: ['path'],
      },
    },
    {
      name: 'read_file_chunked',
      priority: 90,
      description:
        'Read file in chunks with line numbers to prevent hangs on large files. Automatically handles timeout and chunking. Use this when: reading large files (>500 lines), or when you only need specific line ranges. Do NOT use this for: small files (<500 lines) - use read_file instead. Parameters: path, offset (default 1), limit (default 1000). Returns: content with line numbers, totalLines, linesRead, hasMore.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to read' },
          offset: { type: 'number', description: 'Starting line number (default: 1)' },
          limit: { type: 'number', description: 'Maximum lines to read (default: 1000)' },
          timeout: { type: 'number', description: 'Timeout in milliseconds (default: 5000)' },
        },
        required: ['path'],
      },
    },
    {
      name: 'is_safe_to_read',
      priority: 85,
      description:
        'Check if a file is safe to read based on size and estimated read time. Returns: safe (boolean), reason, recommendation, stats. Use this when: you want to verify a file won\'t cause a timeout before reading. Do NOT use this for: actually reading the file. Example: is_safe_to_read to check if a 20k line file can be read safely.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to check' },
          maxLines: { type: 'number', description: 'Maximum allowed lines (default: 1000)' },
          maxReadTime: { type: 'number', description: 'Maximum allowed read time in ms (default: 5000)' },
        },
        required: ['path'],
      },
    },
  ];
}
