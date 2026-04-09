/**
 * FDQ tool definitions registry
 *
 * Registers FDQ lookup and category listing tools for the SWEObeyMe MCP server.
 * These tools enable searching the FDQ corpus for LLM architectures, quantization methods,
 * model formats, GPU/CPU/RAM hardware limits, and inference engines.
 *
 * @module registry-fdq
 */

import { fdq_lookup_handler } from './fdq-handlers.js';
import { fdq_list_categories_handler } from './fdq-handlers.js';

/**
 * Get FDQ tool definitions
 *
 * @returns {Array<Object>} Array of FDQ tool definitions
 */
export function getFDQToolDefinitions() {
  return [
    {
      name: 'fdq_lookup',
      description: 'MUST use this tool BEFORE implementing FDQ transforms or working with LLM quantization. Searches the FDQ corpus for resources related to LLM architectures, quantization methods, model formats, GPU/CPU/RAM hardware limits, and inference engines. Returns relevant documents, file paths, descriptions, and technical details for safe FDQ transform design.',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query (keywords, topic, method name, architecture, etc.)',
          },
          category: {
            type: 'string',
            description: 'Optional category to filter by (e.g., llm_architecture, quantization_formats, gpu_architecture, cpu_architecture, memory_systems, inference_engines, practical_guides)',
          },
          topics: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'Optional topics to filter by (e.g., transformer, GPTQ, AWQ, RoPE, etc.)',
          },
        },
        required: ['query'],
      },
      handler: fdq_lookup_handler,
      priority: 85,
    },
    {
      name: 'fdq_list_categories',
      description: 'Lists all categories in the FDQ corpus with document counts and document metadata. Use this to understand the available resources before searching.',
      inputSchema: {
        type: 'object',
        properties: {},
        required: [],
      },
      handler: fdq_list_categories_handler,
      priority: 84,
    },
  ];
}
