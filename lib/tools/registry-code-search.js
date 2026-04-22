/**
 * Code search tool definitions
 */

export function getCodeSearchToolDefinitions() {
  return [
    {
      name: 'search_code',
      priority: 70,
      description: 'Swiss-army-knife for code discovery. Search files, patterns, or languages. Get language statistics, detect file types, or find all files by language. Use this when: searching for code patterns, finding files by language, getting project language stats, or detecting file types.',
      inputSchema: {
        type: 'object',
        properties: {
          operation: {
            type: 'string',
            enum: ['files', 'pattern', 'language_stats', 'detect_language', 'find_by_language'],
            description: 'Operation to perform',
          },
          query: { type: 'string', description: 'Search query (for "files" operation)' },
          pattern: { type: 'string', description: 'Regex pattern (for "pattern" operation)' },
          directory: { type: 'string', description: 'Root directory to search in' },
          language: { type: 'string', description: 'Language to search in (for "pattern" or "find_by_language" operations)' },
          languages: {
            items: { type: 'string' },
            type: 'array',
            description: 'Languages to filter (for "files" or "find_by_language" operations)',
          },
          filepath: { type: 'string', description: 'File path to detect language from (for "detect_language" operation)' },
          caseSensitive: { type: 'boolean', description: 'Enable case-sensitive search' },
          excludeDirs: {
            items: { type: 'string' },
            type: 'array',
            description: 'Directories to exclude',
          },
          maxResults: { type: 'number', description: 'Maximum results to return' },
        },
        required: ['operation', 'directory'],
      },
    },
  ];
}
