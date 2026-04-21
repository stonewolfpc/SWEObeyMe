/**
 * Corpus Management Handlers
 * Handlers for corpus management tools (set_project_type, enable_corpus, disable_corpus, get_tool_registry_stats)
 */

import { getDynamicToolRegistry } from './registry-dynamic.js';

/**
 * Corpus management handlers
 */
export const corpusManagementHandlers = {
  /**
   * Set project type to enable project-specific toolsets
   */
  set_project_type: async args => {
    const registry = getDynamicToolRegistry();
    
    if (!args.type) {
      return {
        isError: true,
        content: [{ type: 'text', text: 'ERROR: "type" parameter is REQUIRED. Provide the project type (godot, csharp, cpp, python, node, default).' }],
      };
    }
    
    const validTypes = ['godot', 'csharp', 'cpp', 'python', 'node', 'default'];
    if (!validTypes.includes(args.type)) {
      return {
        isError: true,
        content: [{ type: 'text', text: `ERROR: Invalid project type "${args.type}". Must be one of: ${validTypes.join(', ')}.` }],
      };
    }
    
    registry.setProjectType(args.type);
    
    const stats = registry.getStatistics();
    return {
      content: [
        {
          type: 'text',
          text: `Project type set to "${args.type}". Active tools: ${stats.activeTools}/${stats.totalTools}. Excluded corpora: ${stats.excludedCorpora.join(', ') || 'none'}.`,
        },
      ],
    };
  },

  /**
   * Enable a specific corpus
   */
  enable_corpus: async args => {
    const registry = getDynamicToolRegistry();
    
    if (!args.corpus) {
      return {
        isError: true,
        content: [{ type: 'text', text: 'ERROR: "corpus" parameter is REQUIRED. Provide the corpus name (docs, patreon, math, fdq, training, unified, godot, csharp).' }],
      };
    }
    
    const validCorpora = ['docs', 'patreon', 'math', 'fdq', 'training', 'unified', 'godot', 'csharp'];
    if (!validCorpora.includes(args.corpus)) {
      return {
        isError: true,
        content: [{ type: 'text', text: `ERROR: Invalid corpus "${args.corpus}". Must be one of: ${validCorpora.join(', ')}.` }],
      };
    }
    
    registry.enableCorpus(args.corpus);
    
    const stats = registry.getStatistics();
    return {
      content: [
        {
          type: 'text',
          text: `Corpus "${args.corpus}" enabled. Active tools: ${stats.activeTools}/${stats.totalTools}. Enabled corpora: ${stats.enabledCorpora.join(', ')}.`,
        },
      ],
    };
  },

  /**
   * Disable a specific corpus
   */
  disable_corpus: async args => {
    const registry = getDynamicToolRegistry();
    
    if (!args.corpus) {
      return {
        isError: true,
        content: [{ type: 'text', text: 'ERROR: "corpus" parameter is REQUIRED. Provide the corpus name (docs, patreon, math, fdq, training, unified, godot, csharp).' }],
      };
    }
    
    const validCorpora = ['docs', 'patreon', 'math', 'fdq', 'training', 'unified', 'godot', 'csharp'];
    if (!validCorpora.includes(args.corpus)) {
      return {
        isError: true,
        content: [{ type: 'text', text: `ERROR: Invalid corpus "${args.corpus}". Must be one of: ${validCorpora.join(', ')}.` }],
      };
    }
    
    registry.disableCorpus(args.corpus);
    
    const stats = registry.getStatistics();
    return {
      content: [
        {
          type: 'text',
          text: `Corpus "${args.corpus}" disabled. Active tools: ${stats.activeTools}/${stats.totalTools}. Enabled corpora: ${stats.enabledCorpora.join(', ')}.`,
        },
      ],
    };
  },

  /**
   * Get tool registry statistics
   */
  get_tool_registry_stats: async args => {
    const registry = getDynamicToolRegistry();
    const stats = registry.getStatistics();
    
    return {
      content: [
        {
          type: 'text',
          text: `=== TOOL REGISTRY STATISTICS ===\nTotal Tools: ${stats.totalTools}\nActive Tools: ${stats.activeTools}\nDisabled Tools: ${stats.disabledTools}\nProject Type: ${stats.projectType}\nEnabled Corpora: ${stats.enabledCorpora.join(', ') || 'none'}\nExcluded Corpora: ${stats.excludedCorpora.join(', ') || 'none'}\n=== END STATISTICS ===`,
        },
      ],
    };
  },
};
