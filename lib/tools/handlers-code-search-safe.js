/**
 * Safe Code Search Handlers
 * Refactored from code-search-handlers.js with proper error handling and safe file operations
 */

import {
  searchCode,
  getLanguageStats,
  searchByPattern,
  detectLanguage,
  findCodeFiles,
} from '../code-search.js';
import { StreamingFileReader, searchFileUnlimited } from '../shared/streaming-utils.js';
import { createErrorResponse, createSuccessResponse } from '../shared/error-utils.js';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Search code files for a pattern with language-aware ranking
 */
export async function searchCodeFilesHandler(args) {
  const { query, directory, languages, caseSensitive, maxResults, excludeDirs } = args;

  if (!query) {
    return createErrorResponse(
      'search_code_files',
      new Error('query parameter is required. Example: search for "class" or "function"'),
      'Parameter validation'
    );
  }

  if (!directory) {
    return createErrorResponse(
      'search_code_files',
      new Error('directory parameter is required. Provide the root directory to search in.'),
      'Parameter validation'
    );
  }

  try {
    const results = await searchCode(directory, query, {
      languages,
      caseSensitive,
      maxResults,
      excludeDirs,
    });

    if (results.length === 0) {
      return createSuccessResponse(`No matches found for "${query}" in ${directory}`);
    }

    const formattedResults = results
      .map(
        (result, index) =>
          `${index + 1}. ${result.filepath} (line ${result.line}, col ${result.column})\n` +
          `   Language: ${result.language || 'unknown'}\n` +
          `   Score: ${result.score.toFixed(2)}\n` +
          `   Snippet:\n${result.snippet}\n`
      )
      .join('\n');

    return createSuccessResponse(
      `Found ${results.length} matches for "${query}":\n\n${formattedResults}`
    );
  } catch (error) {
    return createErrorResponse('search_code_files', error, `Searching for: "${query}"`);
  }
}

/**
 * Get language statistics for a directory
 */
export async function getCodeLanguageStatsHandler(args) {
  const { directory, excludeDirs } = args;

  if (!directory) {
    return createErrorResponse(
      'get_code_language_stats',
      new Error('directory parameter is required.'),
      'Parameter validation'
    );
  }

  try {
    const stats = await getLanguageStats(directory, excludeDirs);

    if (Object.keys(stats).length === 0) {
      return createSuccessResponse(`No code files found in ${directory}`);
    }

    const formattedStats = Object.entries(stats)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([lang, data]) => `${lang}: ${data.count} files`)
      .join('\n');

    return createSuccessResponse(`Language statistics for ${directory}:\n\n${formattedStats}`);
  } catch (error) {
    return createErrorResponse('get_code_language_stats', error, `Getting stats for: ${directory}`);
  }
}

/**
 * Search by language-specific regex pattern
 */
export async function searchCodePatternHandler(args) {
  const { pattern, language, directory, maxResults, excludeDirs } = args;

  if (!pattern) {
    return createErrorResponse(
      'search_code_pattern',
      new Error('pattern parameter is required. Provide a regex pattern to search for.'),
      'Parameter validation'
    );
  }

  if (!language) {
    return createErrorResponse(
      'search_code_pattern',
      new Error(
        'language parameter is required. Provide the language to search in (e.g., cpp, python, java).'
      ),
      'Parameter validation'
    );
  }

  if (!directory) {
    return createErrorResponse(
      'search_code_pattern',
      new Error('directory parameter is required.'),
      'Parameter validation'
    );
  }

  try {
    const results = await searchByPattern(directory, pattern, language, {
      maxResults,
      excludeDirs,
    });

    if (results.length === 0) {
      return createSuccessResponse(
        `No matches found for pattern "${pattern}" in ${language} files`
      );
    }

    const formattedResults = results
      .map(
        (result, index) =>
          `${index + 1}. ${result.filepath} (line ${result.line}, col ${result.column})\n` +
          `   Snippet:\n${result.snippet}\n`
      )
      .join('\n');

    return createSuccessResponse(
      `Found ${results.length} matches for pattern "${pattern}" in ${language}:\n\n${formattedResults}`
    );
  } catch (error) {
    return createErrorResponse('search_code_pattern', error, `Searching pattern: "${pattern}"`);
  }
}

/**
 * Detect language from file path
 */
export async function detectFileLanguageHandler(args) {
  const { filepath } = args;

  if (!filepath) {
    return createErrorResponse(
      'detect_file_language',
      new Error('filepath parameter is required.'),
      'Parameter validation'
    );
  }

  const language = detectLanguage(filepath);

  if (language) {
    return createSuccessResponse(`Detected language: ${language}`);
  } else {
    return createSuccessResponse(`Could not detect language for ${filepath}`);
  }
}

/**
 * Find code files in a directory
 */
export async function findCodeFilesHandler(args) {
  const { directory, languages, excludeDirs } = args;

  if (!directory) {
    return createErrorResponse(
      'find_code_files',
      new Error('directory parameter is required.'),
      'Parameter validation'
    );
  }

  try {
    const files = await findCodeFiles(directory, languages, excludeDirs);

    if (files.length === 0) {
      return createSuccessResponse(`No code files found in ${directory}`);
    }

    const formattedFiles = files.map((file, index) => `${index + 1}. ${file}`).join('\n');

    return createSuccessResponse(`Found ${files.length} code files:\n\n${formattedFiles}`);
  } catch (error) {
    return createErrorResponse('find_code_files', error, `Finding files in: ${directory}`);
  }
}

/**
 * Search documentation with streaming for unlimited file sizes
 * Can handle 10-line or 10,000-line documentation files
 */
async function searchDocsSafe(docsDir, query, maxResults = 10) {
  try {
    const files = await findCodeFiles(docsDir, ['markdown'], []);

    if (files.length === 0) {
      return { success: false, message: 'No documentation found.' };
    }

    const results = [];
    const searchRegex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    for (const filepath of files) {
      try {
        // Use streaming reader for unlimited file size support
        const reader = new StreamingFileReader(filepath, { chunkSize: 1000 });
        const init = await reader.initialize();

        if (!init.success) {
          continue; // Skip unreadable files
        }

        // Search through all chunks
        for await (const chunk of reader.readAllChunks()) {
          for (let i = 0; i < chunk.lines.length; i++) {
            const line = chunk.lines[i];
            if (searchRegex.test(line)) {
              const contextStart = Math.max(0, i - 2);
              const contextEnd = Math.min(chunk.lines.length - 1, i + 2);
              const snippet = chunk.lines.slice(contextStart, contextEnd + 1).join('\n');

              results.push({
                filepath: path.basename(filepath),
                line: chunk.startLine + i,
                snippet,
              });

              // Early exit if we have enough results
              if (results.length >= maxResults * 2) {
                break;
              }
            }
          }

          if (results.length >= maxResults * 2) {
            break;
          }
        }
      } catch (fileError) {
        // Skip files that can't be read
        continue;
      }
    }

    if (results.length === 0) {
      return { success: false, message: `No matches found for "${query}".` };
    }

    return { success: true, results };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * Search llama documentation specifically
 */
export async function searchLlamaDocsHandler(args) {
  const { query, maxResults = 10 } = args;

  if (!query) {
    return createErrorResponse(
      'search_llama_docs',
      new Error('query parameter is required. Example: search for "Unity" or "model"'),
      'Parameter validation'
    );
  }

  const docsDirPath = path.join(path.join(__dirname, '..', '..'), 'ide_mcp_corpus');
  const docsDir = pathToFileURL(docsDirPath).href;
  const result = await searchDocsSafe(docsDir, query, maxResults);

  if (!result.success) {
    return createSuccessResponse(result.message);
  }

  const formattedResults = result.results
    .slice(0, maxResults)
    .map(
      (item, index) =>
        `${index + 1}. ${item.filepath} (line ${item.line})\n   Snippet:\n${item.snippet}\n`
    )
    .join('\n');

  return createSuccessResponse(
    `Found ${Math.min(result.results.length, maxResults)} matches for "${query}" in llama documentation:\n\n${formattedResults}`
  );
}

/**
 * Search mathematical documentation specifically
 */
export async function searchMathDocsHandler(args) {
  const { query, maxResults = 10 } = args;

  if (!query) {
    return createErrorResponse(
      'search_math_docs',
      new Error('query parameter is required. Example: search for "matrix" or "probability"'),
      'Parameter validation'
    );
  }

  const mathDirPath = path.join(path.join(__dirname, '..', '..'), 'ide_mcp_corpus', 'math');
  const mathDir = pathToFileURL(mathDirPath).href;
  const result = await searchDocsSafe(mathDir, query, maxResults);

  if (!result.success) {
    return createSuccessResponse(result.message);
  }

  const formattedResults = result.results
    .slice(0, maxResults)
    .map(
      (item, index) =>
        `${index + 1}. ${item.filepath} (line ${item.line})\n   Snippet:\n${item.snippet}\n`
    )
    .join('\n');

  return createSuccessResponse(
    `Found ${Math.min(result.results.length, maxResults)} matches for "${query}" in mathematical documentation:\n\n${formattedResults}`
  );
}

/**
 * List available llama documentation files
 */
export async function listLlamaDocsHandler() {
  const docsDirPath = path.join(path.join(__dirname, '..', '..'), 'ide_mcp_corpus');
  const docsDir = pathToFileURL(docsDirPath).href;

  try {
    const files = await findCodeFiles(docsDir, ['markdown'], []);

    if (files.length === 0) {
      return createSuccessResponse('No llama documentation found in the docs directory.');
    }

    const formattedFiles = files
      .map((file, index) => `${index + 1}. ${path.basename(file)}`)
      .join('\n');

    return createSuccessResponse(`Available llama documentation files:\n\n${formattedFiles}`);
  } catch (error) {
    return createErrorResponse('list_llama_docs', error, 'Listing llama documentation');
  }
}

/**
 * List available mathematical documentation files
 */
export async function listMathDocsHandler() {
  const mathDirPath = path.join(path.join(__dirname, '..', '..'), 'ide_mcp_corpus', 'math');
  const mathDir = pathToFileURL(mathDirPath).href;

  try {
    const files = await findCodeFiles(mathDir, ['markdown'], []);

    if (files.length === 0) {
      return createSuccessResponse(
        'No mathematical documentation found in the docs/math directory.'
      );
    }

    const formattedFiles = files
      .map((file, index) => `${index + 1}. ${path.basename(file)}`)
      .join('\n');

    return createSuccessResponse(
      `Available mathematical documentation files:\n\n${formattedFiles}`
    );
  } catch (error) {
    return createErrorResponse('list_math_docs', error, 'Listing mathematical documentation');
  }
}

/**
 * Dispatcher: search_code swiss-army-knife handler
 */
export async function searchCodeHandler(params) {
  const {
    operation,
    query,
    pattern,
    directory,
    language,
    languages,
    filepath,
    caseSensitive,
    excludeDirs,
    maxResults,
  } = params;

  if (!operation) {
    return createErrorResponse(
      'search_code',
      new Error(
        'operation parameter is required (files, pattern, language_stats, detect_language, find_by_language)'
      ),
      'Parameter validation'
    );
  }

  switch (operation) {
    case 'files':
      return await searchCodeFilesHandler({
        query,
        directory,
        languages,
        caseSensitive,
        maxResults,
        excludeDirs,
      });
    case 'pattern':
      return await searchCodePatternHandler({
        pattern,
        language,
        directory,
        maxResults,
        excludeDirs,
      });
    case 'language_stats':
      return await getCodeLanguageStatsHandler({ directory, excludeDirs });
    case 'detect_language':
      return await detectFileLanguageHandler({ filepath });
    case 'find_by_language':
      return await findCodeFilesHandler({ directory, languages, excludeDirs });
    default:
      return createErrorResponse(
        'search_code',
        new Error(
          `Unknown operation: ${operation}. Valid: files, pattern, language_stats, detect_language, find_by_language`
        ),
        'Operation validation'
      );
  }
}

export const safeCodeSearchHandlers = {
  swe_search_code: searchCodeHandler,
  swe_search_code_files: searchCodeFilesHandler,
  get_code_language_stats: getCodeLanguageStatsHandler,
  search_code_pattern: searchCodePatternHandler,
  detect_file_language: detectFileLanguageHandler,
  find_code_files: findCodeFilesHandler,
  search_llama_docs: searchLlamaDocsHandler,
  list_llama_docs: listLlamaDocsHandler,
  search_math_docs: searchMathDocsHandler,
  list_math_docs: listMathDocsHandler,
};
