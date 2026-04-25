/**
 * Consolidated documentation registry
 * Replaces: unified, math, fdq, training, godot, llama, math-docs corpus tools
 * Reduces 14 tools to 4 unified documentation tools
 */

import {
  docs_lookup_handler,
  docs_list_corpora_handler,
  docs_list_categories_handler,
  docs_verify_handler,
} from './docs-handlers.js';

/**
 * Get consolidated documentation tool definitions
 * @returns {Array<Object>} Array of documentation tool definitions
 */
export function getDocsToolDefinitions() {
  return [
    {
      name: 'docs_lookup',
      priority: 85,
      description:
        'Search across ALL documentation corpora or a specific corpus. Access Unified Technical Documentation (C#/.NET, Git, TypeScript, etc.), Mathematical Reference, FDQ (LLM/Quantization), Training Dynamics, Godot Engine, and Llama.cpp/GGML documentation. Automatically searches all corpora unless a specific one is specified. Returns comprehensive results with corpus attribution.',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query to find relevant documentation across all corpora',
          },
          corpus: {
            type: 'string',
            description:
              'Optional: Specific corpus to search (unified, math, fdq, training, godot, llama). If omitted, searches ALL corpora.',
          },
          category: {
            type: 'string',
            description: 'Optional: Category within the corpus to filter by (corpus-specific)',
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Optional: Tags to filter results (unified/math corpus only)',
          },
          topics: {
            type: 'array',
            items: { type: 'string' },
            description: 'Optional: Topics to filter by (fdq/training corpus only)',
          },
          maxResults: {
            type: 'number',
            description: 'Maximum results per corpus (default: 10)',
          },
        },
        required: ['query'],
      },
    },
    {
      name: 'docs_list_corpora',
      priority: 84,
      description:
        'List all documentation corpora available. Shows Unified Technical, Math, FDQ, Training, Godot, and Llama.cpp collections with descriptions and capabilities. Use this before docs_lookup to understand what documentation is accessible.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'docs_list_categories',
      priority: 83,
      description:
        'List available categories within documentation corpora. Shows category hierarchies for corpora that support them (unified, math, fdq, training). Use this to understand the structure before searching with docs_lookup.',
      inputSchema: {
        type: 'object',
        properties: {
          corpus: {
            type: 'string',
            description:
              'Optional: Specific corpus to list categories for. If omitted, lists categories for ALL corpora.',
          },
        },
      },
    },
    {
      name: 'docs_verify',
      priority: 88,
      description:
        'Verify mathematical formulas, algorithms, and technical claims BEFORE finalizing code. Performs symbolic checks, numerical tests, domain/range validation, invariants, and complexity analysis. Consolidates math verification and can be extended for other verification types. Returns pass/fail with detailed reasoning and counterexamples.',
      inputSchema: {
        type: 'object',
        properties: {
          formula: {
            type: 'string',
            description: 'Mathematical formula to verify (optional)',
          },
          algorithm: {
            type: 'string',
            description: 'Algorithm steps or pseudocode to verify (optional)',
          },
          constraints: {
            type: 'object',
            description: 'Expected constraints with domain and/or range',
            properties: {
              domain: { type: 'string', description: 'Expected domain constraint' },
              range: { type: 'string', description: 'Expected range constraint' },
            },
          },
          properties: {
            type: 'array',
            items: { type: 'string' },
            description: 'Expected properties to verify (e.g., "monotonic", "idempotent")',
          },
        },
      },
    },
  ];
}

/**
 * Map of tool names to handlers
 */
export const docsToolHandlers = {
  docs_lookup: docs_lookup_handler,
  docs_list_corpora: docs_list_corpora_handler,
  docs_list_categories: docs_list_categories_handler,
  docs_verify: docs_verify_handler,
};
