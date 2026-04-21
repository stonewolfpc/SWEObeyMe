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
      name: 'set_project_type',
      priority: 90,
      description:
        'Set the project type to enable project-specific toolsets. This automatically enables relevant tools and disables irrelevant ones. Use this when: starting work on a new project, switching between project types (Godot, C#, C++, Python, Node). Do NOT use this for: general file operations. Example: set_project_type with type="godot" to enable Godot-specific tools.',
      inputSchema: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            description: 'Project type (godot, csharp, cpp, python, node, default)',
            enum: ['godot', 'csharp', 'cpp', 'python', 'node', 'default'],
          },
        },
        required: ['type'],
      },
    },
    {
      name: 'enable_corpus',
      priority: 85,
      description:
        'Enable a specific corpus (documentation source) to make its tools available. Use this when: you need access to specific documentation tools. Do NOT use this for: general file operations. Example: enable_corpus with corpus="docs" to enable documentation tools.',
      inputSchema: {
        type: 'object',
        properties: {
          corpus: {
            type: 'string',
            description: 'Corpus name (docs, patreon, math, fdq, training, unified, godot, csharp)',
            enum: ['docs', 'patreon', 'math', 'fdq', 'training', 'unified', 'godot', 'csharp'],
          },
        },
        required: ['corpus'],
      },
    },
    {
      name: 'disable_corpus',
      priority: 85,
      description:
        'Disable a specific corpus (documentation source) to remove its tools from the available tool surface. Use this when: you want to reduce tool surface by removing unnecessary documentation tools. Do NOT use this for: general file operations. Example: disable_corpus with corpus="patreon" to remove Patreon tools.',
      inputSchema: {
        type: 'object',
        properties: {
          corpus: {
            type: 'string',
            description: 'Corpus name (docs, patreon, math, fdq, training, unified, godot, csharp)',
            enum: ['docs', 'patreon', 'math', 'fdq', 'training', 'unified', 'godot', 'csharp'],
          },
        },
        required: ['corpus'],
      },
    },
    {
      name: 'get_tool_registry_stats',
      priority: 80,
      description:
        'Get statistics about the current tool registry configuration, including total tools, active tools, disabled tools, project type, and enabled corpora. Use this when: you want to understand the current tool surface configuration. Do NOT use this for: modifying tools.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
  ];
}
