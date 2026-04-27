/**
 * Code Search Handlers - REFACTORED
 * This file now re-exports from handlers-code-search-safe.js for proper error handling
 * and safe file operations with chunked reading for large files.
 */

import { safeCodeSearchHandlers } from './handlers-code-search-safe.js';

// Re-export all handlers from the safe implementation
export const {
  search_code,
  search_code_files,
  get_code_language_stats,
  search_code_pattern,
  detect_file_language,
  find_code_files,
  search_llama_docs,
  list_llama_docs,
  search_math_docs,
  list_math_docs,
} = safeCodeSearchHandlers;

// Also export as codeSearchHandlers for compatibility
export const codeSearchHandlers = safeCodeSearchHandlers;
