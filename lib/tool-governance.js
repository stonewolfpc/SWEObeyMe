/**
 * Tool Governance Layer
 * Categorizes tools, clusters by domain, assigns priorities and fallbacks
 * Detects misuse, prevents hallucination, enforces tool usage rules
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_MEMORY_PATH = path.join(__dirname, '..', 'tool-memory.json');

/**
 * Tool Governance Manager
 * Enforces tool usage rules and provides governance
 */
export class ToolGovernanceManager {
  constructor() {
    this.toolMemory = null;
    this.toolCache = new Map();
    this.categoryCache = new Map();
    this.domainCache = new Map();
  }

  /**
   * Load tool memory from JSON file
   */
  async loadToolMemory() {
    try {
      const data = await fs.readFile(TOOL_MEMORY_PATH, 'utf-8');
      this.toolMemory = JSON.parse(data);
      this._buildCaches();
      return this.toolMemory;
    } catch (error) {
      console.warn(`Failed to load tool memory: ${error.message}`);
      return null;
    }
  }

  /**
   * Build internal caches for fast lookup
   */
  _buildCaches() {
    if (!this.toolMemory || !this.toolMemory.tools) return;

    // Cache tools by name
    for (const [name, tool] of Object.entries(this.toolMemory.tools)) {
      this.toolCache.set(name, tool);
    }

    // Cache tools by category
    if (this.toolMemory.categories) {
      for (const [category, config] of Object.entries(this.toolMemory.categories)) {
        const tools = Object.values(this.toolMemory.tools).filter((t) => t.category === category);
        this.categoryCache.set(category, tools);
      }
    }

    // Cache tools by domain
    if (this.toolMemory.domains) {
      for (const [domain, config] of Object.entries(this.toolMemory.domains)) {
        const tools = Object.values(this.toolMemory.tools).filter((t) => t.domain === domain);
        this.domainCache.set(domain, tools);
      }
    }
  }

  /**
   * Get tool metadata by name
   */
  getTool(toolName) {
    return this.toolCache.get(toolName);
  }

  /**
   * Get tools by category
   */
  getToolsByCategory(category) {
    return this.categoryCache.get(category) || [];
  }

  /**
   * Get tools by domain
   */
  getToolsByDomain(domain) {
    return this.domainCache.get(domain) || [];
  }

  /**
   * Get fallback tool for a given tool
   */
  getFallback(toolName) {
    const tool = this.toolCache.get(toolName);
    return tool?.fallback;
  }

  /**
   * Check if tools conflict
   */
  checkConflicts(toolName, otherToolName) {
    const tool = this.toolCache.get(toolName);
    if (!tool || !tool.conflicts) return false;
    return tool.conflicts.includes(otherToolName);
  }

  /**
   * Detect tool misuse
   */
  detectMisuse(operation, context) {
    const violations = [];

    // Check if operation conflicts with available tools
    if (operation === 'manual_edit' || operation === 'direct_write') {
      violations.push({
        type: 'MANUAL_EDIT_DETECTED',
        message: 'Manual editing detected. Use write_file tool instead.',
        suggestedTool: 'write_file',
      });
    }

    if (operation === 'direct_file_access') {
      violations.push({
        type: 'DIRECT_FILE_ACCESS_DETECTED',
        message: 'Direct file access detected. Use read_file tool instead.',
        suggestedTool: 'read_file',
      });
    }

    return violations;
  }

  /**
   * Validate tool usage against heuristics
   */
  validateUsage(toolName, context) {
    const tool = this.toolCache.get(toolName);
    if (!tool) {
      return {
        valid: false,
        reason: `Tool '${toolName}' not found in tool memory. Tool may be hallucinated.`,
        suggestion: 'Use a registered tool from the tool registry.',
      };
    }

    // Check prerequisites
    if (tool.prerequisite && context.previousTool !== tool.prerequisite) {
      return {
        valid: false,
        reason: `Tool '${toolName}' requires prerequisite '${tool.prerequisite}'.`,
        suggestion: `Call ${tool.prerequisite} before using ${toolName}.`,
      };
    }

    return { valid: true };
  }

  /**
   * Get recommended tools for a task
   */
  getRecommendedTools(taskDescription) {
    const recommendations = [];
    const task = taskDescription.toLowerCase();

    // Analyze task and match to tool triggers
    for (const [name, tool] of this.toolCache.entries()) {
      if (tool.triggers) {
        for (const trigger of tool.triggers) {
          if (task.includes(trigger.toLowerCase())) {
            recommendations.push({
              name,
              priority: tool.priority,
              category: tool.category,
              domain: tool.domain,
              reason: `Task matches trigger: "${trigger}"`,
            });
          }
        }
      }
    }

    // Sort by priority (highest first)
    recommendations.sort((a, b) => b.priority - a.priority);

    return recommendations;
  }

  /**
   * Enforce tool usage rules
   */
  enforceRules(toolName, context) {
    const violations = [];

    // Check for hallucinated tools
    if (!this.toolCache.has(toolName)) {
      violations.push({
        severity: 'CRITICAL',
        rule: 'NO_HALLUCINATED_TOOLS',
        message: `Tool '${toolName}' is not registered. Use only tools from the tool registry.`,
        action: 'abort',
      });
    }

    // Check for prerequisite violations
    const tool = this.toolCache.get(toolName);
    if (tool?.prerequisite && context.previousTool !== tool.prerequisite) {
      violations.push({
        severity: 'HIGH',
        rule: 'PREREQUISITE_REQUIRED',
        message: `Tool '${toolName}' requires '${tool.prerequisite}' to be called first.`,
        action: 'redirect',
        redirectTo: tool.prerequisite,
      });
    }

    return violations;
  }

  /**
   * Get governance statistics
   */
  getStatistics() {
    return {
      totalTools: this.toolCache.size,
      totalCategories: this.categoryCache.size,
      totalDomains: this.domainCache.size,
      toolsWithFallbacks: Array.from(this.toolCache.values()).filter((t) => t.fallback).length,
      toolsWithConflicts: Array.from(this.toolCache.values()).filter((t) => t.conflicts?.length > 0)
        .length,
    };
  }
}

/**
 * Global governance manager instance
 */
let globalGovernanceManager = null;

/**
 * Initialize global governance manager
 */
export async function initializeGovernanceManager() {
  if (!globalGovernanceManager) {
    globalGovernanceManager = new ToolGovernanceManager();
    await globalGovernanceManager.loadToolMemory();
  }
  return globalGovernanceManager;
}

/**
 * Get global governance manager
 */
export function getGovernanceManager() {
  return globalGovernanceManager;
}
