/**
 * Unified documentation handlers
 * Consolidates all corpus lookup functionality into a single, unified interface
 */

import { godot_lookup_handler } from './godot-handlers.js';
import { search_llama_docs, list_llama_docs } from './code-search-handlers.js';

/**
 * Corpus registry - maps corpus IDs to their handlers and metadata
 */
const CORPUS_REGISTRY = {
  godot: {
    name: 'Godot Engine',
    description: 'Godot best practices, scene organization, autoloads, GDScript, project structure',
    handler: godot_lookup_handler,
    supportsCategories: false,
    listCategoriesHandler: async () => ({
      content: [{ type: 'text', text: 'Godot corpus does not use categories. Use docs_lookup with godot corpus and query instead.' }]
    }),
  },
  llama: {
    name: 'Llama.cpp / GGML',
    description: 'LlamaCpp.net, LlamaCppUnity, model loading, inference, quantization, GGUF format',
    handler: search_llama_docs,
    supportsCategories: false,
    listCategoriesHandler: list_llama_docs,
  },
};

/**
 * Unified documentation lookup - searches across all corpora or a specific one
 */
export async function docs_lookup_handler(args) {
  const { query, corpus, category, tags, topics, maxResults = 10 } = args;

  if (!query) {
    return {
      content: [{
        type: 'text',
        text: 'Error: query parameter is required.\n\nUsage: docs_lookup({\n  query: "search terms",\n  corpus: "optional_specific_corpus",\n  category: "optional_category",\n  maxResults: 10\n})',
      }],
      isError: true,
    };
  }

  // If specific corpus requested, route to that handler with timeout protection
  if (corpus) {
    const corpusConfig = CORPUS_REGISTRY[corpus];
    if (!corpusConfig) {
      const availableCorpora = Object.keys(CORPUS_REGISTRY).join(', ');
      return {
        content: [{
          type: 'text',
          text: `Error: Unknown corpus "${corpus}".\n\nAvailable corpora: ${availableCorpora}\n\nUse docs_list_corpora() to see all available documentation collections.`,
        }],
        isError: true,
      };
    }

    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Corpus search timeout')), 5000)
      );
      const result = await Promise.race([
        corpusConfig.handler({ query, category, tags, topics, maxResults }),
        timeoutPromise
      ]);
      // Add corpus context to result
      if (result.content && result.content[0]) {
        result.content[0].text = `[CORPUS: ${corpusConfig.name}]\n\n${result.content[0].text}`;
      }
      return result;
    } catch (error) {
      // Handle directory not found errors gracefully
      if (error.message.includes('ENOENT') || error.message.includes('no such file or directory') || error.message.includes('not found')) {
        return {
          content: [{ type: 'text', text: `[CORPUS: ${corpusConfig.name}]\n\nCorpus directory not found. This corpus is not available in the current workspace.` }],
          isError: false, // Not a real error, just unavailable
        };
      }
      return {
        content: [{ type: 'text', text: `Error searching ${corpus} corpus: ${error.message}` }],
        isError: true,
      };
    }
  }

  // Search ALL corpora in parallel with timeout protection
  const searchPromises = Object.entries(CORPUS_REGISTRY).map(async ([corpusId, config]) => {
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Corpus search timeout')), 5000)
      );
      const result = await Promise.race([
        config.handler({ query, maxResults: Math.ceil(maxResults / 2) }),
        timeoutPromise
      ]);
      return { corpus: corpusId, name: config.name, result, success: true };
    } catch (error) {
      return { corpus: corpusId, name: config.name, error: error.message, success: false };
    }
  });

  const results = await Promise.all(searchPromises);

  // Compile results from all corpora
  let combinedText = `=== Documentation Search Results for: "${query}" ===\n\n`;
  let hasAnyResults = false;

  for (const { corpus, name, result, success, error } of results) {
    if (!success) {
      combinedText += `\n--- ${name} ---\nError: ${error}\n`;
      continue;
    }

    if (result.content && result.content[0]) {
      const text = result.content[0].text;
      // Check if result actually has content (not just "No results found")
      if (!text.includes('No results') && !text.includes('not found') && text.trim().length > 50) {
        hasAnyResults = true;
        combinedText += `\n--- ${name} ---\n${text}\n`;
      }
    }
  }

  if (!hasAnyResults) {
    combinedText += `\nNo results found in any corpus for "${query}".\n\nTry:\n- Using different keywords\n- Searching a specific corpus with the 'corpus' parameter\n- Using docs_list_corpora() to see what's available`;
  }

  combinedText += `\n\n---\nTip: To search a specific corpus only, use: docs_lookup({ query: "${query}", corpus: "CORPUS_NAME" })`;

  return {
    content: [{ type: 'text', text: combinedText }],
  };
}

/**
 * List all available corpora
 */
export async function docs_list_corpora_handler() {
  let text = '=== Available Documentation Corpora ===\n\n';

  for (const [id, config] of Object.entries(CORPUS_REGISTRY)) {
    text += `[${id}] ${config.name}\n`;
    text += `  ${config.description}\n`;
    text += `  Categories: ${config.supportsCategories ? 'Yes' : 'No'}\n\n`;
  }

  text += '---\nUsage:\n';
  text += '- docs_lookup({ query: "search terms" }) - Search all corpora\n';
  text += '- docs_lookup({ query: "search", corpus: "math" }) - Search specific corpus\n';
  text += '- docs_list_categories({ corpus: "unified" }) - List categories in a corpus\n';

  return {
    content: [{ type: 'text', text }],
  };
}

/**
 * List categories in a specific corpus
 */
export async function docs_list_categories_handler(args) {
  const { corpus } = args;

  if (!corpus) {
    // List categories for ALL corpora that support them
    let text = '=== Categories Across All Corpora ===\n\n';

    for (const [corpusId, config] of Object.entries(CORPUS_REGISTRY)) {
      if (!config.supportsCategories) {
        text += `[${corpusId}] ${config.name}\n  (No categories - use direct lookup)\n\n`;
        continue;
      }

      try {
        const result = await config.listCategoriesHandler({ corpus: corpusId });
        if (result.content && result.content[0]) {
          text += `[${corpusId}] ${config.name}\n${result.content[0].text}\n\n`;
        }
      } catch (error) {
        text += `[${corpusId}] ${config.name}\n  Error listing categories: ${error.message}\n\n`;
      }
    }

    return { content: [{ type: 'text', text }] };
  }

  // Map 'unified' to the actual unified corpus handler
  const corpusId = corpus === 'unified' ? 'unified' : corpus;
  
  // List categories for specific corpus
  const corpusConfig = CORPUS_REGISTRY[corpusId];
  if (!corpusConfig) {
    const available = Object.keys(CORPUS_REGISTRY).join(', ');
    return {
      content: [{
        type: 'text',
        text: `Error: Unknown corpus "${corpus}".\n\nAvailable: ${available}`,
      }],
      isError: true,
    };
  }

  if (!corpusConfig.supportsCategories) {
    return {
      content: [{
        type: 'text',
        text: `The "${corpus}" corpus (${corpusConfig.name}) does not use categories.\n\nUse docs_lookup({ query: "...", corpus: "${corpus}" }) to search directly.`,
      }],
    };
  }

  try {
    return await corpusConfig.listCategoriesHandler({ corpus });
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error: ${error.message}` }],
      isError: true,
    };
  }
}

/**
 * Verify documentation claims (math, algorithms, formulas)
 * Note: Math verification handler removed - this returns a placeholder message
 */
export async function docs_verify_handler(args) {
  const { formula, algorithm, constraints, properties } = args;

  if (!formula && !algorithm) {
    return {
      content: [{
        type: 'text',
        text: 'Error: Either formula or algorithm parameter is required.\n\nUsage:\n- docs_verify({ formula: "x^2 + 2x + 1" })\n- docs_verify({ algorithm: "sorting steps" })\n- docs_verify({ formula: "...", constraints: { domain: "x > 0" } })',
      }],
      isError: true,
    };
  }

  // Math verification handler removed - return placeholder
  return {
    content: [{
      type: 'text',
      text: 'Math verification is currently unavailable. The dedicated math verification handler has been consolidated. Please verify mathematical claims manually or use the documentation lookup tools to find relevant references.',
    }],
  };
}

// Handlers exported at function definitions above
