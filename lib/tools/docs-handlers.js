/**
 * Unified documentation handlers
 * Consolidates all corpus lookup functionality into a single, unified interface
 */

import { unifiedHandlers } from './unified-handlers.js';
import { math_lookup_handler, math_verify_handler } from './math-handlers.js';
import { fdq_lookup_handler, fdq_list_categories_handler } from './fdq-handlers.js';
import { training_lookup_handler, training_list_categories_handler } from './training-handlers.js';
import { godot_lookup_handler } from './godot-handlers.js';
import { search_llama_docs, list_llama_docs, search_math_docs, list_math_docs } from './code-search-handlers.js';

/**
 * Corpus registry - maps corpus IDs to their handlers and metadata
 */
const CORPUS_REGISTRY = {
  unified: {
    name: 'Unified Technical Documentation',
    description: 'C#/.NET, Git, Enterprise/Security, TypeScript/JavaScript, VS Code Extension API, Security/CSP, Build/Deployment, Testing/QA, MCP Implementation, Performance/Profiling, Node.js Runtime, Web Development',
    handler: async (args) => {
      const raw = await unifiedHandlers.unified_lookup(args);
      if (!raw.success || !raw.results || raw.results.length === 0) {
        return { content: [{ type: 'text', text: `No results found for "${args.query}" in unified documentation.` }] };
      }
      const lines = raw.results.slice(0, args.maxResults || 10).map(r =>
        `[${r.corpus}] ${r.title}\n  ${r.description || ''}\n  Topics: ${(r.topics || []).join(', ')}\n  File: ${r.filePath}`
      );
      return { content: [{ type: 'text', text: lines.join('\n\n') }] };
    },
    supportsCategories: true,
    listCategoriesHandler: async (args) => {
      const { unifiedHandlers: uh } = await import('./unified-handlers.js');
      const raw = await uh.unified_list_categories(args);
      if (!raw.success) {
        return { content: [{ type: 'text', text: `Error: ${raw.error}` }] };
      }
      const lines = (raw.categories || raw.corpora || []).map(c =>
        `  - ${c.name || c.corpus} (${c.documentCount ?? '?'} docs): ${c.description || ''}`
      );
      return { content: [{ type: 'text', text: lines.join('\n') }] };
    },
  },
  math: {
    name: 'Mathematical Reference',
    description: 'Algorithm complexity, linear algebra, probability/statistics, discrete mathematics',
    handler: async (args) => {
      // Try math_lookup first (corpus-based), fall back to search_math_docs
      const result = await math_lookup_handler(args);
      if (result.content && result.content[0] && result.content[0].text && 
          !result.content[0].text.includes('No results')) {
        return result;
      }
      // Fall back to doc search
      return search_math_docs(args);
    },
    supportsCategories: true,
    listCategoriesHandler: list_math_docs,
  },
  fdq: {
    name: 'FDQ (Foundation Model Deployment & Quantization)',
    description: 'LLM architectures, quantization methods, model formats, GPU/CPU/RAM hardware limits, inference engines',
    handler: async (args) => {
      const raw = await fdq_lookup_handler(args);
      if (!raw.success || !raw.results || raw.results.length === 0) {
        return { content: [{ type: 'text', text: `No results found for "${args.query}" in FDQ documentation.` }] };
      }
      const lines = raw.results.slice(0, args.maxResults || 10).map(r =>
        `[${r.category || 'fdq'}] ${r.title}\n  ${r.description || ''}\n  File: ${r.path || r.filename}`
      );
      return { content: [{ type: 'text', text: lines.join('\n\n') }] };
    },
    supportsCategories: true,
    listCategoriesHandler: async (args) => {
      const raw = await fdq_list_categories_handler(args);
      if (!raw.success) return { content: [{ type: 'text', text: `Error: ${raw.error}` }] };
      const cats = (raw.categories || []).map(c => `  - ${c.name} (${c.documentCount ?? '?'} docs): ${c.description || ''}`);
      return { content: [{ type: 'text', text: cats.join('\n') || 'No categories found.' }] };
    },
  },
  training: {
    name: 'Training Dynamics',
    description: 'How LLMs are trained, training data effects, gradient behavior, representation learning, training dynamics',
    handler: async (args) => {
      const raw = await training_lookup_handler(args);
      if (!raw.success || !raw.results || raw.results.length === 0) {
        return { content: [{ type: 'text', text: `No results found for "${args.query}" in Training documentation.` }] };
      }
      const lines = raw.results.slice(0, args.maxResults || 10).map(r =>
        `[${r.category || 'training'}] ${r.title}\n  ${r.description || ''}\n  File: ${r.path || r.filename}`
      );
      return { content: [{ type: 'text', text: lines.join('\n\n') }] };
    },
    supportsCategories: true,
    listCategoriesHandler: async (args) => {
      const raw = await training_list_categories_handler(args);
      if (!raw.success) return { content: [{ type: 'text', text: `Error: ${raw.error}` }] };
      const cats = (raw.categories || []).map(c => `  - ${c.name} (${c.documentCount ?? '?'} docs): ${c.description || ''}`);
      return { content: [{ type: 'text', text: cats.join('\n') || 'No categories found.' }] };
    },
  },
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

  // If specific corpus requested, route to that handler
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
      const result = await corpusConfig.handler({ query, category, tags, topics, maxResults });
      // Add corpus context to result
      if (result.content && result.content[0]) {
        result.content[0].text = `[CORPUS: ${corpusConfig.name}]\n\n${result.content[0].text}`;
      }
      return result;
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error searching ${corpus} corpus: ${error.message}` }],
        isError: true,
      };
    }
  }

  // Search ALL corpora in parallel
  const searchPromises = Object.entries(CORPUS_REGISTRY).map(async ([corpusId, config]) => {
    try {
      const result = await config.handler({ query, maxResults: Math.ceil(maxResults / 2) });
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

  // List categories for specific corpus
  const corpusConfig = CORPUS_REGISTRY[corpus];
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
 * Consolidated from math_verify with support for multiple verification types
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

  // Delegate to math_verify_handler (it's already comprehensive)
  return math_verify_handler({ formula, algorithm, constraints, properties });
}

// Handlers exported at function definitions above
