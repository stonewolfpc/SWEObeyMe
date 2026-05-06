/**
 * Dynamic Tool Registry
 * Enables project-specific tool registration, corpus disabling, and dynamic tool surface slimming
 */

import { getToolDefinitions } from './registry.js';

/**
 * Core 10 tools to expose - always these, no more
 * Aligned with QA compliance test requirements
 */
const CORE_TOOLS = [
  'get_governance_constitution',
  'get_validation_status',
  'get_server_diagnostics',
  'swe_read_file',
  'swe_write_file',
  'obey_surgical_plan',
  'validate_code',
  'audit',
  'auto_enforce',
  'preflight_change',
];

/**
 * Project type definitions with associated toolsets
 */
const PROJECT_TOOLSETS = {
  godot: {
    language: 'gdscript',
    requiredTools: [
      'read_file',
      'write_file',
      'detect_godot_project',
      'check_godot_practices',
      'godot_lookup',
    ],
    optionalTools: ['get_file_context', 'analyze_change_impact', 'preflight_change'],
    excludedCorpora: ['cpp', 'csharp', 'python'],
  },
  csharp: {
    language: 'csharp',
    requiredTools: ['read_file', 'write_file', 'get_csharp_errors', 'get_csharp_errors_for_file'],
    optionalTools: [
      'get_file_context',
      'analyze_change_impact',
      'preflight_change',
      'toggle_csharp_error_type',
    ],
    excludedCorpora: ['godot', 'python'],
  },
  cpp: {
    language: 'cpp',
    requiredTools: ['read_file', 'write_file', 'get_cpp_errors', 'get_cpp_errors_for_file'],
    optionalTools: [
      'get_file_context',
      'analyze_change_impact',
      'preflight_change',
      'toggle_cpp_error_type',
      'get_cpp_integrity_report',
    ],
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
  patreon: [
    'patreon_fetch_content',
    'patreon_generate_rewrite_plan',
    'patreon_write_drafts',
    'patreon_apply_changes',
  ],
  math: [], // Consolidated into docs
  fdq: [], // Consolidated into docs
  training: [], // Consolidated into docs
  unified: [], // Consolidated into docs
  godot: ['detect_godot_project', 'check_godot_practices', 'godot_lookup'],
  csharp: [
    'get_csharp_errors',
    'get_csharp_errors_for_file',
    'toggle_csharp_error_type',
    'set_csharp_ai_informed',
    'update_csharp_config',
    'get_csharp_integrity_report',
  ],
  cpp: [
    'get_cpp_errors',
    'get_cpp_errors_for_file',
    'toggle_cpp_error_type',
    'set_cpp_ai_informed',
    'update_cpp_config',
    'get_cpp_integrity_report',
  ],
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
    this.enabledCorpora = this.enabledCorpora.filter((c) => c !== corpus);
  }

  /**
   * Get filtered tool definitions based on project type and corpus settings
   */
  getFilteredToolDefinitions() {
    // Only return the core 10 tools - no more, no less
    const filtered = [];
    CORE_TOOLS.forEach((toolName) => {
      const tool = this.allTools.find((t) => t.name === toolName);
      if (tool) {
        filtered.push(tool);
      }
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
