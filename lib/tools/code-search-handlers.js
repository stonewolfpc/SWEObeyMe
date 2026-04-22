import {
  searchCode,
  getLanguageStats,
  searchByPattern,
  detectLanguage,
  findCodeFiles,
} from '../code-search.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * Search code files for a pattern with language-aware ranking
 */
export async function search_code_files(args) {
  const { query, directory, languages, caseSensitive, maxResults, excludeDirs } = args;

  if (!query) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: query parameter is required. Example: search for "class" or "function"',
        },
      ],
    };
  }

  if (!directory) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: directory parameter is required. Provide the root directory to search in.',
        },
      ],
    };
  }

  try {
    const results = await searchCode(directory, query, {
      languages,
      caseSensitive,
      maxResults,
      excludeDirs,
    });

    if (results.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `No matches found for "${query}" in ${directory}`,
          },
        ],
      };
    }

    const formattedResults = results.map(
      (result, index) =>
        `${index + 1}. ${result.filepath} (line ${result.line}, col ${result.column})\n` +
        `   Language: ${result.language || 'unknown'}\n` +
        `   Score: ${result.score.toFixed(2)}\n` +
        `   Snippet:\n${result.snippet}\n`,
    ).join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `Found ${results.length} matches for "${query}":\n\n${formattedResults}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error searching code: ${error.message}`,
        },
      ],
    };
  }
}

/**
 * Get language statistics for a directory
 */
export async function get_code_language_stats(args) {
  const { directory, excludeDirs } = args;

  if (!directory) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: directory parameter is required.',
        },
      ],
    };
  }

  try {
    const stats = await getLanguageStats(directory, excludeDirs);

    if (Object.keys(stats).length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `No code files found in ${directory}`,
          },
        ],
      };
    }

    const formattedStats = Object.entries(stats)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([lang, data]) => `${lang}: ${data.count} files`)
      .join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `Language statistics for ${directory}:\n\n${formattedStats}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error getting language stats: ${error.message}`,
        },
      ],
    };
  }
}

/**
 * Search by language-specific regex pattern
 */
export async function search_code_pattern(args) {
  const { pattern, language, directory, maxResults, excludeDirs } = args;

  if (!pattern) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: pattern parameter is required. Provide a regex pattern to search for.',
        },
      ],
    };
  }

  if (!language) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: language parameter is required. Provide the language to search in (e.g., cpp, python, java).',
        },
      ],
    };
  }

  if (!directory) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: directory parameter is required.',
        },
      ],
    };
  }

  try {
    const results = await searchByPattern(directory, pattern, language, {
      maxResults,
      excludeDirs,
    });

    if (results.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `No matches found for pattern "${pattern}" in ${language} files`,
          },
        ],
      };
    }

    const formattedResults = results.map(
      (result, index) =>
        `${index + 1}. ${result.filepath} (line ${result.line}, col ${result.column})\n` +
        `   Snippet:\n${result.snippet}\n`,
    ).join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `Found ${results.length} matches for pattern "${pattern}" in ${language}:\n\n${formattedResults}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error searching pattern: ${error.message}`,
        },
      ],
    };
  }
}

/**
 * Detect language from file path
 */
export async function detect_file_language(args) {
  const { filepath } = args;

  if (!filepath) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: filepath parameter is required.',
        },
      ],
    };
  }

  const language = detectLanguage(filepath);

  return {
    content: [
      {
        type: 'text',
        text: language
          ? `Detected language: ${language}`
          : `Could not detect language for ${filepath}`,
      },
    ],
  };
}

/**
 * Find code files in a directory
 */
export async function find_code_files(args) {
  const { directory, languages, excludeDirs } = args;

  if (!directory) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: directory parameter is required.',
        },
      ],
    };
  }

  try {
    const files = await findCodeFiles(directory, languages, excludeDirs);

    if (files.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `No code files found in ${directory}`,
          },
        ],
      };
    }

    const formattedFiles = files
      .map((file, index) => `${index + 1}. ${file}`)
      .join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `Found ${files.length} code files:\n\n${formattedFiles}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error finding code files: ${error.message}`,
        },
      ],
    };
  }
}

/**
 * Search llama documentation specifically
 */
export async function search_llama_docs(args) {
  const { query, maxResults = 10 } = args;

  if (!query) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: query parameter is required. Example: search for "Unity" or "model"',
        },
      ],
    };
  }

  try {
    const docsDir = path.join(process.cwd(), 'docs');
    const files = await findCodeFiles(docsDir, ['markdown'], []);

    if (files.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No llama documentation found in the docs directory.',
          },
        ],
      };
    }

    const results = [];

    for (const filepath of files) {
      const content = await fs.readFile(filepath, 'utf-8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.toLowerCase().includes(query.toLowerCase())) {
          const contextStart = Math.max(0, i - 2);
          const contextEnd = Math.min(lines.length - 1, i + 2);
          const snippet = lines.slice(contextStart, contextEnd + 1).join('\n');

          results.push({
            filepath: path.basename(filepath),
            line: i + 1,
            snippet,
          });
        }
      }
    }

    if (results.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `No matches found for "${query}" in llama documentation.`,
          },
        ],
      };
    }

    const formattedResults = results
      .slice(0, maxResults)
      .map(
        (result, index) =>
          `${index + 1}. ${result.filepath} (line ${result.line})\n   Snippet:\n${result.snippet}\n`,
      )
      .join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `Found ${Math.min(results.length, maxResults)} matches for "${query}" in llama documentation:\n\n${formattedResults}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error searching llama documentation: ${error.message}`,
        },
      ],
    };
  }
}

/**
 * Search mathematical documentation specifically
 */
export async function search_math_docs(args) {
  const { query, maxResults = 10 } = args;

  if (!query) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: query parameter is required. Example: search for "matrix" or "probability"',
        },
      ],
    };
  }

  try {
    const mathDir = path.join(process.cwd(), 'docs', 'math');
    const files = await findCodeFiles(mathDir, ['markdown'], []);

    if (files.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No mathematical documentation found in the docs/math directory.',
          },
        ],
      };
    }

    const results = [];

    for (const filepath of files) {
      const content = await fs.readFile(filepath, 'utf-8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.toLowerCase().includes(query.toLowerCase())) {
          const contextStart = Math.max(0, i - 2);
          const contextEnd = Math.min(lines.length - 1, i + 2);
          const snippet = lines.slice(contextStart, contextEnd + 1).join('\n');

          results.push({
            filepath: path.basename(filepath),
            line: i + 1,
            snippet,
          });
        }
      }
    }

    if (results.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `No matches found for "${query}" in mathematical documentation.`,
          },
        ],
      };
    }

    const formattedResults = results
      .slice(0, maxResults)
      .map(
        (result, index) =>
          `${index + 1}. ${result.filepath} (line ${result.line})\n   Snippet:\n${result.snippet}\n`,
      )
      .join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `Found ${Math.min(results.length, maxResults)} matches for "${query}" in mathematical documentation:\n\n${formattedResults}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error searching mathematical documentation: ${error.message}`,
        },
      ],
    };
  }
}

/**
 * List available llama documentation files
 */
export async function list_llama_docs() {
  try {
    const docsDir = path.join(process.cwd(), 'docs');
    const files = await findCodeFiles(docsDir, ['markdown'], []);

    if (files.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No llama documentation found in the docs directory.',
          },
        ],
      };
    }

    const formattedFiles = files
      .map((file, index) => {
        const basename = path.basename(file);
        return `${index + 1}. ${basename}`;
      })
      .join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `Available llama documentation files:\n\n${formattedFiles}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error listing llama documentation: ${error.message}`,
        },
      ],
    };
  }
}

/**
 * List available mathematical documentation files
 */
export async function list_math_docs() {
  try {
    const mathDir = path.join(process.cwd(), 'docs', 'math');
    const files = await findCodeFiles(mathDir, ['markdown'], []);

    if (files.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No mathematical documentation found in the docs/math directory.',
          },
        ],
      };
    }

    const formattedFiles = files
      .map((file, index) => {
        const basename = path.basename(file);
        return `${index + 1}. ${basename}`;
      })
      .join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `Available mathematical documentation files:\n\n${formattedFiles}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error listing mathematical documentation: ${error.message}`,
        },
      ],
    };
  }
}

/**
 * Dispatcher: search_code swiss-army-knife handler
 * Routes to appropriate handler based on operation parameter
 */
export async function search_code_handler(params) {
  const { operation, query, pattern, directory, language, languages, filepath, caseSensitive, excludeDirs, maxResults } = params;

  if (!operation) {
    return {
      content: [{ type: 'text', text: 'operation parameter is required' }],
    };
  }

  switch (operation) {
    case 'files':
      return await search_code_files({ query, directory, languages, caseSensitive, maxResults, excludeDirs });
    case 'pattern':
      return await search_code_pattern({ pattern, language, directory, maxResults, excludeDirs });
    case 'language_stats':
      return await get_code_language_stats({ directory, excludeDirs });
    case 'detect_language':
      return await detect_file_language({ filepath });
    case 'find_by_language':
      return await find_code_files({ directory, languages, excludeDirs });
    default:
      return {
        content: [{ type: 'text', text: `Unknown operation: ${operation}` }],
      };
  }
}

export const codeSearchHandlers = {
  search_code: search_code_handler,
  search_code_files,
  get_code_language_stats,
  search_code_pattern,
  detect_file_language,
  find_code_files,
  search_llama_docs,
  list_llama_docs,
  search_math_docs,
  list_math_docs,
};
