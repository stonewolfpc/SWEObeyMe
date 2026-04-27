/**
 * Global Prompt Registry
 * Loads, validates, and exposes all prompt definitions to the MCP server
 * Ensures metadata consistency and prevents fragmentation
 * Supports dynamic prompt generation and Cascade Skills integration
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROMPTS_DIR = path.join(__dirname, 'definitions');

/**
 * Prompt metadata schema with enhanced fields
 */
export const PROMPT_METADATA_SCHEMA = {
  // Required fields
  name: 'string',
  description: 'string',

  // Enhanced metadata fields
  category: {
    type: 'string',
    enum: [
      'governance',
      'architecture',
      'project-awareness',
      'preflight',
      'rewrite',
      'workflow',
      'debugging',
      'skills',
    ],
  },
  persona: {
    type: 'string',
    default: 'senior-engineer',
    description: 'Swappable personality for the prompt',
  },
  governanceLevel: {
    type: 'string',
    enum: ['strict', 'moderate', 'advisory'],
    default: 'moderate',
    description: 'How aggressively the prompt intervenes',
  },
  contextRequirements: {
    type: 'array',
    items: { type: 'string' },
    description: 'Context that must be reloaded before executing',
  },
  fallbackBehavior: {
    type: 'object',
    properties: {
      reloadContext: { type: 'boolean', default: true },
      proposeInterpretations: { type: 'boolean', default: true },
      neverGuess: { type: 'boolean', default: true },
      neverHideErrors: { type: 'boolean', default: true },
    },
  },
  clarificationTriggers: {
    type: 'array',
    items: {
      type: 'string',
      enum: [
        'ambiguity',
        'hesitation',
        'structural-drift',
        'tool-forgetting',
        'line-limit-violation',
        'monolithic-file-detection',
      ],
    },
  },
  optimality: {
    type: 'string',
    enum: ['prefer-optimal-over-literal', 'literal-only'],
    default: 'prefer-optimal-over-literal',
    description: 'Whether to override user ideas when better implementations exist',
  },

  // Windsurf-Next Cascade Skills integration
  skills: {
    type: 'array',
    items: { type: 'string' },
    description: 'Cascade Skills to integrate with this prompt',
  },
  skillContext: {
    type: 'object',
    description: 'Context for Cascade Skills execution',
  },

  // Dynamic prompt generation
  dynamic: {
    type: 'boolean',
    default: false,
    description: 'Whether this prompt is dynamically generated based on context',
  },
  dynamicGenerator: {
    type: 'string',
    description: 'Function name for dynamic generation',
  },

  // Standard MCP prompt fields
  arguments: {
    type: 'array',
    items: {
      name: 'string',
      description: 'string',
      required: 'boolean',
      type: 'string',
    },
  },
};

/**
 * Global prompt registry
 */
class PromptRegistry {
  constructor() {
    this.prompts = new Map();
    this.categories = new Map();
    this.initialized = false;
  }

  /**
   * Initialize the registry by loading all prompt definitions
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Ensure prompts directory exists
      if (!fs.existsSync(PROMPTS_DIR)) {
        fs.mkdirSync(PROMPTS_DIR, { recursive: true });
      }

      // Load all prompt definitions
      const files = fs.readdirSync(PROMPTS_DIR).filter((f) => f.endsWith('.js'));

      for (const file of files) {
        try {
          const modulePath = path.join(PROMPTS_DIR, file);
          // Convert to file:// URL for Windows compatibility
          const fileUrl = `file://${modulePath.replace(/\\/g, '/')}`;
          const module = await import(fileUrl);

          if (module.promptDefinition) {
            this.registerPrompt(module.promptDefinition);
          }
        } catch (error) {
          console.error(`[Prompt Registry] Failed to load ${file}:`, error.message);
        }
      }

      this.initialized = true;
      // Debug log removed
    } catch (error) {
      console.error('[Prompt Registry] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Register a prompt definition
   */
  registerPrompt(definition) {
    // Validate required fields
    if (!definition.name || !definition.description) {
      throw new Error(`Prompt missing required fields: name or description`);
    }

    // Apply default metadata
    const prompt = {
      ...definition,
      category: definition.category || 'governance',
      persona: definition.persona || 'senior-engineer',
      governanceLevel: definition.governanceLevel || 'moderate',
      contextRequirements: definition.contextRequirements || [],
      fallbackBehavior: definition.fallbackBehavior || {
        reloadContext: true,
        proposeInterpretations: true,
        neverGuess: true,
        neverHideErrors: true,
      },
      clarificationTriggers: definition.clarificationTriggers || [],
      optimality: definition.optimality || 'prefer-optimal-over-literal',
      skills: definition.skills || [],
      skillContext: definition.skillContext || {},
      dynamic: definition.dynamic || false,
      dynamicGenerator: definition.dynamicGenerator || null,
      arguments: definition.arguments || [],
    };

    // Store by name
    this.prompts.set(prompt.name, prompt);

    // Store by category
    if (!this.categories.has(prompt.category)) {
      this.categories.set(prompt.category, []);
    }
    this.categories.get(prompt.category).push(prompt.name);
  }

  /**
   * Get a prompt by name
   */
  getPrompt(name) {
    return this.prompts.get(name);
  }

  /**
   * Get all prompts
   */
  getAllPrompts() {
    return Array.from(this.prompts.values());
  }

  /**
   * Get prompts by category
   */
  getPromptsByCategory(category) {
    const promptNames = this.categories.get(category) || [];
    return promptNames.map((name) => this.prompts.get(name)).filter(Boolean);
  }

  /**
   * Get all categories
   */
  getCategories() {
    return Array.from(this.categories.keys());
  }

  /**
   * Get prompts that match specific triggers
   */
  getPromptsByTrigger(trigger) {
    return Array.from(this.prompts.values()).filter((prompt) =>
      prompt.clarificationTriggers.includes(trigger)
    );
  }

  /**
   * Check if registry is initialized
   */
  isInitialized() {
    return this.initialized;
  }

  /**
   * Get statistics
   */
  getStatistics() {
    return {
      totalPrompts: this.prompts.size,
      totalCategories: this.categories.size,
      categories: Object.fromEntries(
        Array.from(this.categories.entries()).map(([cat, names]) => [cat, names.length])
      ),
      dynamicPrompts: Array.from(this.prompts.values()).filter((p) => p.dynamic).length,
      skillIntegratedPrompts: Array.from(this.prompts.values()).filter(
        (p) => p.skills && p.skills.length > 0
      ).length,
    };
  }

  /**
   * Get prompts that have Cascade Skills integration
   */
  getSkillIntegratedPrompts() {
    return Array.from(this.prompts.values()).filter(
      (prompt) => prompt.skills && prompt.skills.length > 0
    );
  }

  /**
   * Get prompts that support dynamic generation
   */
  getDynamicPrompts() {
    return Array.from(this.prompts.values()).filter((prompt) => prompt.dynamic);
  }

  /**
   * Generate dynamic prompt based on project context
   */
  generateDynamicPrompt(promptName, context) {
    const prompt = this.getPrompt(promptName);
    if (!prompt) {
      throw new Error(`Prompt not found: ${promptName}`);
    }

    if (!prompt.dynamic || !prompt.dynamicGenerator) {
      throw new Error(`Prompt ${promptName} does not support dynamic generation`);
    }

    // Dynamic generation would call the generator function with context
    // For now, return the template with context interpolation
    return this.interpolateTemplate(prompt.template, context);
  }

  /**
   * Interpolate template variables with context
   */
  interpolateTemplate(template, context) {
    let result = template;

    // Simple variable interpolation {{variable}}
    for (const [key, value] of Object.entries(context)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value);
    }

    // Handle Handlebars-style conditionals {{#if variable}}
    result = result.replace(/{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g, (match, varName, content) => {
      return context[varName] ? content : '';
    });

    // Handle Handlebars-style loops {{#each array}}
    result = result.replace(/{{#each\s+(\w+)}}([\s\S]*?){{\/each}}/g, (match, varName, content) => {
      const array = context[varName] || [];
      if (!Array.isArray(array)) return '';
      return array.map((item) => content.replace(/{{this}}/g, item)).join('\n');
    });

    // Handle negated conditionals {{#if (not variable)}}
    result = result.replace(
      /{{#if\s+\(not\s+(\w+)\)}}([\s\S]*?){{\/if}}/g,
      (match, varName, content) => {
        return !context[varName] ? content : '';
      }
    );

    return result;
  }

  /**
   * Get prompts with Cascade Skills for a specific skill
   */
  getPromptsBySkill(skillName) {
    return Array.from(this.prompts.values()).filter(
      (prompt) => prompt.skills && prompt.skills.includes(skillName)
    );
  }
}

/**
 * Global registry instance
 */
let globalRegistry = null;

/**
 * Initialize global prompt registry
 */
export async function initializePromptRegistry() {
  if (!globalRegistry) {
    globalRegistry = new PromptRegistry();
    await globalRegistry.initialize();
  }
  return globalRegistry;
}

/**
 * Get global prompt registry
 */
export function getPromptRegistry() {
  return globalRegistry;
}
