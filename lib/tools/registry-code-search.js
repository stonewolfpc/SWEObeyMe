/**
 * Code search tool definitions
 */

export function getCodeSearchToolDefinitions() {
  return [
    {
      name: 'search_code_files',
      priority: 10,
      description: 'Search code files for a pattern with language-aware ranking. Provides importance scoring based on language weight and context relevance. Example: Search for "class" to find class definitions across all supported languages.',
      inputSchema: {
        type: 'object',
        properties: {
          caseSensitive: { type: 'boolean', description: 'Enable case-sensitive search' },
          directory: { type: 'string', description: 'Root directory to search in' },
          excludeDirs: {
            items: { type: 'string' },
            type: 'array',
          },
          languages: {
            items: { type: 'string' },
            type: 'array',
          },
          maxResults: { type: 'number', description: 'Maximum number of results to return' },
          query: { type: 'string', description: 'Search query or pattern to find in code' },
        },
        required: ['query', 'directory'],
      },
    },
    {
      name: 'get_code_language_stats',
      priority: 10,
      description: 'Get language statistics for a directory. Shows file counts per programming language. Example: Get stats to understand project language distribution.',
      inputSchema: {
        type: 'object',
        properties: {
          directory: { type: 'string', description: 'Directory to analyze' },
          excludeDirs: {
            items: { type: 'string' },
            type: 'array',
          },
        },
        required: ['directory'],
      },
    },
    {
      name: 'search_code_pattern',
      priority: 10,
      description: 'Search by language-specific regex pattern. Allows complex pattern matching within specific languages. Example: Search for "classs+w+" in cpp to find class definitions.',
      inputSchema: {
        type: 'object',
        properties: {
          directory: { type: 'string', description: 'Root directory to search in' },
          excludeDirs: {
            items: { type: 'string' },
            type: 'array',
          },
          language: { type: 'string', description: 'Language to search in (e.g., cpp, python, java)' },
          maxResults: { type: 'number', description: 'Maximum number of results to return' },
          pattern: { type: 'string', description: 'Regex pattern to search for' },
        },
        required: ['pattern', 'language', 'directory'],
      },
    },
    {
      name: 'detect_file_language',
      priority: 10,
      description: 'Detect programming language from file extension. Identifies language based on file extension mapping. Example: Detect language for "main.py" returns "python".',
      inputSchema: {
        type: 'object',
        properties: {
          filepath: { type: 'string', description: 'File path to detect language from' },
        },
        required: ['filepath'],
      },
    },
    {
      name: 'find_code_files',
      priority: 10,
      description: 'Find all code files in a directory by language. Returns list of file paths for specified languages. Example: Find all Python files in a project directory.',
      inputSchema: {
        type: 'object',
        properties: {
          directory: { type: 'string', description: 'Directory to search in' },
          excludeDirs: {
            items: { type: 'string' },
            type: 'array',
          },
          languages: {
            items: { type: 'string' },
            type: 'array',
          },
        },
        required: ['directory'],
      },
    },
    {
      name: 'search_llama_docs',
      priority: 10,
      description: 'Search llama.cpp documentation for specific terms. Provides offline access to llama documentation without requiring internet. Documentation includes LlamaCpp.net .NET bindings and LlamaCppUnity for Unity. Example: Search for "Unity" or "model" to find relevant documentation.',
      inputSchema: {
        type: 'object',
        properties: {
          maxResults: { type: 'number', description: 'Maximum number of results to return (default: 10)' },
          query: { type: 'string', description: 'Search term to find in llama documentation' },
        },
        required: ['query'],
      },
    },
    {
      name: 'list_llama_docs',
      priority: 10,
      description: 'List all available llama.cpp documentation files. Shows documentation files for LlamaCpp.net and LlamaCppUnity. Example: List available docs to see what llama documentation is available offline.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'search_math_docs',
      priority: 10,
      description: 'Search mathematical documentation for specific terms. Provides offline access to mathematical concepts for AI/ML programming. Documentation includes algorithm complexity, linear algebra, probability/statistics, and discrete mathematics. Example: Search for "matrix" or "probability" to find relevant mathematical concepts.',
      inputSchema: {
        type: 'object',
        properties: {
          maxResults: { type: 'number', description: 'Maximum number of results to return (default: 10)' },
          query: { type: 'string', description: 'Search term to find in mathematical documentation' },
        },
        required: ['query'],
      },
    },
    {
      name: 'list_math_docs',
      priority: 10,
      description: 'List all available mathematical documentation files. Shows mathematical reference documentation for algorithm complexity, linear algebra, probability/statistics, and discrete mathematics. Example: List available math docs to see what mathematical documentation is available offline.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
  ];
}
