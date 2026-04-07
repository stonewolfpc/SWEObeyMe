/**
 * Math tool definitions registry
 * 
 * Registers math lookup and math verification tools for the SWEObeyMe MCP server.
 * 
 * @module registry-math
 */

import { math_lookup_handler } from './math-handlers.js';
import { math_verify_handler } from './math-handlers.js';

/**
 * Get math tool definitions
 * 
 * @returns {Array<Object>} Array of math tool definitions
 */
export function getMathToolDefinitions() {
  return [
    {
      name: 'math_lookup',
      description: 'MUST use this tool BEFORE writing any math-heavy code. Searches the math corpus for mathematical references, formulas, algorithms, and definitions based on keywords, formulas, algorithm names, math topics, or tags. Returns relevant excerpts, file paths, summaries, definitions, formulas, and derivations if available.',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query (keywords, formula, algorithm name, math topic, etc.)'
          },
          category: {
            type: 'string',
            description: 'Optional category to filter by (e.g., calculus, linear_algebra, statistics, etc.)'
          },
          tags: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Optional tags to filter by'
          }
        },
        required: ['query']
      },
      handler: math_lookup_handler,
      priority: 90
    },
    {
      name: 'math_verify',
      description: 'MUST use this tool to verify all formulas and algorithms BEFORE finalizing code. Performs symbolic checks, numerical tests, brute-force small-input validation, domain/range checks, invariants, monotonicity checks, and complexity sanity checks. Returns pass/fail status with detailed reasoning and counterexamples if any.',
      inputSchema: {
        type: 'object',
        properties: {
          formula: {
            type: 'string',
            description: 'Mathematical formula to verify (optional)'
          },
          algorithm: {
            type: 'string',
            description: 'Algorithm steps to verify (optional)'
          },
          constraints: {
            type: 'object',
            properties: {
              domain: {
                type: 'string',
                description: 'Expected domain constraint'
              },
              range: {
                type: 'string',
                description: 'Expected range constraint'
              }
            },
            description: 'Expected constraints (optional)'
          },
          properties: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Expected properties to verify (optional)'
          }
        }
      },
      handler: math_verify_handler,
      priority: 89
    }
  ];
}
