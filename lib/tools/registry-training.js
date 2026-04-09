/**
 * Training tool definitions registry
 *
 * Registers training lookup and category listing tools for the SWEObeyMe MCP server.
 * These tools enable searching the training corpus for resources related to how LLMs are trained,
 * training data effects, gradient behavior, representation learning, and training dynamics.
 *
 * @module registry-training
 */

import { training_lookup_handler } from './training-handlers.js';
import { training_list_categories_handler } from './training-handlers.js';

/**
 * Get training tool definitions
 *
 * @returns {Array<Object>} Array of training tool definitions
 */
export function getTrainingToolDefinitions() {
  return [
    {
      name: 'training_lookup',
      description: 'MUST use this tool BEFORE implementing training-related analysis or working with model training dynamics. Searches the training corpus for resources related to how LLMs are trained, training data effects, gradient behavior, representation learning, and training dynamics. Returns relevant documents, file paths, descriptions, and technical details for understanding training geometry.',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query (keywords, topic, method name, training concept, etc.)',
          },
          category: {
            type: 'string',
            description: 'Optional category to filter by (e.g., training_data_theory, training_math, optimization_theory, representation_learning, training_pipelines, training_runs, data_quality_distribution)',
          },
          topics: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'Optional topics to filter by (e.g., scaling laws, backpropagation, Adam, superposition, etc.)',
          },
        },
        required: ['query'],
      },
      handler: training_lookup_handler,
      priority: 83,
    },
    {
      name: 'training_list_categories',
      description: 'Lists all categories in the training corpus with document counts and document metadata. Use this to understand the available training resources before searching.',
      inputSchema: {
        type: 'object',
        properties: {},
        required: [],
      },
      handler: training_list_categories_handler,
      priority: 82,
    },
  ];
}
