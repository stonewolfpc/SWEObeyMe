/**
 * Dynamic Tool Registry
 * Enables project-specific tool registration, corpus disabling, and dynamic tool surface slimming
 */

import { getToolDefinitions } from './registry.js';

/**
 * Project type definitions with associated toolsets
 */
const PROJECT_TOOLSETS = {
  godot: {
    language: 'gdscript',
    requiredTools: ['read_file', 'write_file', 'detect_godot_project', 'check_godot_practices', 'godot_lookup'],
    optionalTools: ['get_file_context', 'analyze_change_impact', 'preflight_change'],
    excludedCorpora: ['cpp', 'csharp', 'python'],
  },
  csharp: {
    language: 'csharp',
    requiredTools: ['read_file', 'write_file', 'get_csharp_errors', 'get_csharp_errors_for_file'],
    optionalTools: ['get_file_context', 'analyze_change_impact', 'preflight_change', 'toggle_csharp_error_type'],
    excludedCorpora: ['godot', 'python'],
  },
  cpp: {
    language: 'cpp',
    requiredTools: ['read_file', 'write_file'],
    optionalTools: ['get_file_context', 'analyze_change_impact', 'preflight_change'],
    excludedCorpora: ['godot', 'csharp', 'python'],
  },
  python: {
    language: 'python',
    requiredTools: ['read_file', 'write_file'],
    optionalTools: ['get_file_context', 'analyze_change_impact', 'preflight_change'],
    excludedCorpora: ['godot', 'csharp'],
  },
  node: {
    language: 'javascript',
    requiredTools: ['read_file', 'write_file'],
    optionalTools: ['get_file_context', 'analyze_change_impact', 'preflight_change'],
    excludedCorpora: ['godot', 'csharp', 'cpp'],
  },
  default: {
    language: 'unknown',
    requiredTools: ['read_file', 'write_file'],
    optionalTools: ['get_file_context', 'analyze_change_impact', 'preflight_change'],
    excludedCorpora: [],
  },
};

/**
 * Corpus tool mappings
 */
const CORPUS_TOOLS = {
  docs: ['docs_verify', 'docs_lookup', 'docs_list_corpora', 'docs_list_categories'],
  patreon: ['patreon_fetch_content', 'patreon_generate_rewrite_plan', 'patreon_write_drafts', 'patreon_apply_changes'],
  math: [], // Consolidated into docs
  fdq: [], // Consolidated into docs
  training: [], // Consolidated into docs
  unified: [], // Consolidated into docs
  godot: ['detect_godot_project', 'check_godot_practices', 'godot_lookup'],
  csharp: ['get_csharp_errors', 'get_csharp_errors_for_file', 'toggle_csharp_error_type', 'set_csharp_ai_informed', 'update_csharp_config'],
  cpp: [],
  python: [],
};

/**
 * Dynamic Tool Registry
 */
export class DynamicToolRegistry {
  constructor() {
    this.allTools = getToolDefinitions();
    this.currentProjectType = 'default';
    this.enabledCorpora = ['docs', 'patreon']; // Default enabled corpora
    this.projectToolset = PROJECT_TOOLSETS.default;
  }

  /**
   * Set project type and update toolset
   */
  setProjectType(projectType) {
    if (PROJECT_TOOLSETS[projectType]) {
      this.currentProjectType = projectType;
      this.projectToolset = PROJECT_TOOLSETS[projectType];
    } else {
      this.currentProjectType = 'default';
      this.projectToolset = PROJECT_TOOLSETS.default;
    }
  }

  /**
   * Enable specific corpus
   */
  enableCorpus(corpus) {
    if (!this.enabledCorpora.includes(corpus)) {
      this.enabledCorpora.push(corpus);
    }
  }

  /**
   * Disable specific corpus
   */
  disableCorpus(corpus) {
    this.enabledCorpora = this.enabledCorpora.filter(c => c !== corpus);
  }

  /**
   * Get filtered tool definitions based on project type and corpus settings
   */
  getFilteredToolDefinitions() {
    // Start with all critical tools (priority ≥ 95) - these are always included
    const filtered = this.allTools.filter(tool => (tool.priority || 0) >= 95);

    // Add project-specific required tools
    const requiredTools = this.projectToolset.requiredTools || [];
    requiredTools.forEach(toolName => {
      const tool = this.allTools.find(t => t.name === toolName);
      if (tool && !filtered.find(f => f.name === toolName)) {
        filtered.push(tool);
      }
    });

    // Add project-specific optional tools if they meet priority threshold
    const optionalTools = this.projectToolset.optionalTools || [];
    optionalTools.forEach(toolName => {
      const tool = this.allTools.find(t => t.name === toolName);
      if (tool && !filtered.find(f => f.name === toolName)) {
        filtered.push(tool);
      }
    });

    // Add corpus-specific tools only if corpus is enabled
    Object.keys(CORPUS_TOOLS).forEach(corpus => {
      if (this.enabledCorpora.includes(corpus)) {
        const corpusTools = CORPUS_TOOLS[corpus];
        corpusTools.forEach(toolName => {
          const tool = this.allTools.find(t => t.name === toolName);
          if (tool && !filtered.find(f => f.name === toolName)) {
            filtered.push(tool);
          }
        });
      }
    });

    // Exclude tools from excluded corpora
    const excludedCorpora = this.projectToolset.excludedCorpora || [];
    excludedCorpora.forEach(corpus => {
      const corpusTools = CORPUS_TOOLS[corpus] || [];
      const toRemove = corpusTools.map(toolName => filtered.findIndex(f => f.name === toolName)).filter(i => i >= 0);
      // Remove in reverse order to maintain indices
      toRemove.sort((a, b) => b - a).forEach(index => filtered.splice(index, 1));
    });

    return filtered.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }

  /**
   * Get statistics about current tool configuration
   */
  getStatistics() {
    const filtered = this.getFilteredToolDefinitions();
    return {
      totalTools: this.allTools.length,
      activeTools: filtered.length,
      disabledTools: this.allTools.length - filtered.length,
      projectType: this.currentProjectType,
      enabledCorpora: [...this.enabledCorpora],
      excludedCorpora: this.projectToolset.excludedCorpora || [],
    };
  }
}

/**
 * Global dynamic registry instance
 */
let globalDynamicRegistry = null;

/**
 * Get global dynamic tool registry
 */
export function getDynamicToolRegistry() {
  if (!globalDynamicRegistry) {
    globalDynamicRegistry = new DynamicToolRegistry();
  }
  return globalDynamicRegistry;
}
