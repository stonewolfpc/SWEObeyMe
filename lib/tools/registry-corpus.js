/**
 * Corpus Management Tool Registry
 * Tools for enabling/disabling corpora and managing project-specific toolsets
 */

import { getDynamicToolRegistry } from './registry-dynamic.js';

/**
 * Corpus management tool definitions
 */
export function getCorpusManagementToolDefinitions() {
  return [
    {
      name: 'corpus_manage',
      priority: 85,
      description: 'Swiss-army-knife for managing tool surface. Set project type, enable/disable corpora, or get tool registry stats. Use this when: starting work on a new project, switching project types, enabling documentation tools, or understanding current tool configuration.',
      inputSchema: {
        type: 'object',
        properties: {
          operation: {
            type: 'string',
            enum: ['set_type', 'enable', 'disable', 'stats'],
            description: 'Operation to perform',
          },
          type: {
            type: 'string',
            description: 'Project type (for "set_type" operation)',
            enum: ['godot', 'csharp', 'cpp', 'python', 'node', 'default'],
          },
          corpus: {
            type: 'string',
            description: 'Corpus name (for "enable" or "disable" operations)',
            enum: ['docs', 'patreon', 'math', 'fdq', 'training', 'unified', 'godot', 'csharp'],
          },
        },
        required: ['operation'],
      },
    },
  ];
}
