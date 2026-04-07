/**
 * Tool Usage Heuristic Enforcement
 * Enforces rule-based decision making for tool selection
 * Implements: If tool exists, use it. If multiple, choose highest priority.
 * Never hallucinate tools. Never manually edit when a tool exists.
 */

import { getGovernanceManager } from './tool-governance.js';
import { getArbitrationEngine } from './tool-arbitration.js';

/**
 * Tool Usage Heuristic Enforcer
 * Enforces deterministic tool selection behavior
 */
export class ToolUsageHeuristicEnforcer {
  constructor() {
    this.governanceManager = null;
    this.arbitrationEngine = null;
    this.violations = [];
    this.heuristics = {
      PRIMARY: 'If a tool exists for the task, use it',
      SECONDARY: 'If multiple tools exist, choose the highest-priority one',
      TERTIARY: 'If the tool fails, retry with context',
      FALLBACK: 'If it fails again, use fallback tool',
      NEVER: 'Never hallucinate a tool or manually edit when a tool exists'
    };
  }

  /**
   * Initialize the enforcer
   */
  async initialize() {
    this.governanceManager = await getGovernanceManager();
    this.arbitrationEngine = await getArbitrationEngine();
  }

  /**
   * Check if operation violates heuristics
   */
  checkViolation(operation, context) {
    const violations = [];

    // NEVER heuristic: Never hallucinate tools
    if (operation.toolName) {
      const toolExists = this.governanceManager?.getTool(operation.toolName);
      if (!toolExists) {
        violations.push({
          heuristic: 'NEVER',
          severity: 'CRITICAL',
          message: `Tool '${operation.toolName}' is hallucinated. Use only registered tools.`,
          suggestedAction: 'Select from available tools in the tool registry'
        });
      }
    }

    // NEVER heuristic: Never manually edit when a tool exists
    if (operation.type === 'manual_edit' || operation.type === 'direct_write') {
      violations.push({
        heuristic: 'NEVER',
        severity: 'CRITICAL',
        message: 'Manual editing detected. Use write_file tool instead.',
        suggestedAction: 'Use write_file tool with proper surgical plan validation'
      });
    }

    // NEVER heuristic: Never directly access files
    if (operation.type === 'direct_file_access') {
      violations.push({
        heuristic: 'NEVER',
        severity: 'CRITICAL',
        message: 'Direct file access detected. Use read_file tool instead.',
        suggestedAction: 'Use read_file tool which enforces .sweignore rules and injects architectural context'
      });
    }

    // PRIMARY heuristic: If tool exists for task, use it
    if (operation.task && operation.type !== 'tool_call') {
      const availableTools = context.availableTools || [];
      const recommended = this.governanceManager?.getRecommendedTools(operation.task);
      
      if (recommended && recommended.length > 0) {
        const hasRecommendedTool = recommended.some(r => availableTools.includes(r.name));
        if (hasRecommendedTool) {
          violations.push({
            heuristic: 'PRIMARY',
            severity: 'HIGH',
            message: `Tool exists for task but manual operation attempted.`,
            suggestedAction: `Use recommended tool: ${recommended[0].name}`,
            recommendedTool: recommended[0].name
          });
        }
      }
    }

    // SECONDARY heuristic: If multiple tools exist, choose highest priority
    if (operation.toolName && context.availableTools) {
      const tool = this.governanceManager?.getTool(operation.toolName);
      if (tool) {
        const sameCategoryTools = this.governanceManager?.getToolsByCategory(tool.category)
          .filter(t => context.availableTools.includes(t.name));
        
        if (sameCategoryTools && sameCategoryTools.length > 1) {
          const highestPriority = Math.max(...sameCategoryTools.map(t => t.priority));
          if (tool.priority < highestPriority) {
            violations.push({
              heuristic: 'SECONDARY',
              severity: 'MEDIUM',
              message: `Tool ${operation.toolName} (priority ${tool.priority}) is not the highest priority in its category.`,
              suggestedAction: `Use ${sameCategoryTools.find(t => t.priority === highestPriority)?.name} (priority ${highestPriority}) instead`,
              higherPriorityTool: sameCategoryTools.find(t => t.priority === highestPriority)?.name
            });
          }
        }
      }
    }

    return violations;
  }

  /**
   * Enforce heuristics and return corrected action
   */
  enforce(operation, context) {
    const violations = this.checkViolation(operation, context);
    this.violations.push(...violations);

    if (violations.length === 0) {
      return {
        compliant: true,
        action: operation
      };
    }

    // Find the most critical violation
    const criticalViolation = violations.find(v => v.severity === 'CRITICAL');
    
    if (criticalViolation) {
      return {
        compliant: false,
        violation: criticalViolation,
        suggestedAction: criticalViolation.suggestedAction,
        message: criticalViolation.message
      };
    }

    // If no critical violations, return first violation
    return {
      compliant: false,
      violation: violations[0],
      suggestedAction: violations[0].suggestedAction,
      message: violations[0].message
    };
  }

  /**
   * Get recommended tool for a task (PRIMARY heuristic)
   */
  getRecommendedTool(task, availableTools) {
    if (!this.governanceManager) {
      return null;
    }

    const recommendations = this.governanceManager.getRecommendedTools(task);
    const availableRecommendations = recommendations.filter(r => availableTools.includes(r.name));

    if (availableRecommendations.length === 0) {
      return null;
    }

    // Return highest priority tool (SECONDARY heuristic)
    return availableRecommendations[0];
  }

  /**
   * Validate tool usage against heuristics
   */
  validateToolUsage(toolName, task, availableTools) {
    const violations = [];

    // Check if tool exists (NEVER heuristic)
    const tool = this.governanceManager?.getTool(toolName);
    if (!tool) {
      violations.push({
        heuristic: 'NEVER',
        message: `Tool '${toolName}' is not registered (hallucinated)`
      });
    }

    // Check if tool is appropriate for task (PRIMARY heuristic)
    if (tool && task) {
      const recommended = this.getRecommendedTool(task, availableTools);
      if (recommended && recommended.name !== toolName) {
        violations.push({
          heuristic: 'PRIMARY',
          message: `Tool '${toolName}' is not the recommended tool for this task`,
          recommendedTool: recommended.name
        });
      }
    }

    // Check if tool is highest priority in category (SECONDARY heuristic)
    if (tool && availableTools) {
      const sameCategoryTools = this.governanceManager?.getToolsByCategory(tool.category)
        .filter(t => availableTools.includes(t.name));
      
      if (sameCategoryTools && sameCategoryTools.length > 1) {
        const highestPriority = Math.max(...sameCategoryTools.map(t => t.priority));
        if (tool.priority < highestPriority) {
          violations.push({
            heuristic: 'SECONDARY',
            message: `Tool '${toolName}' is not the highest priority in category '${tool.category}'`,
            highestPriorityTool: sameCategoryTools.find(t => t.priority === highestPriority)?.name
          });
        }
      }
    }

    return {
      compliant: violations.length === 0,
      violations
    };
  }

  /**
   * Get all heuristics
   */
  getHeuristics() {
    return this.heuristics;
  }

  /**
   * Get violation history
   */
  getViolationHistory() {
    return this.violations;
  }

  /**
   * Clear violation history
   */
  clearViolationHistory() {
    this.violations = [];
  }

  /**
   * Get violation statistics
   */
  getStatistics() {
    const byHeuristic = {};
    const bySeverity = {};

    for (const violation of this.violations) {
      byHeuristic[violation.heuristic] = (byHeuristic[violation.heuristic] || 0) + 1;
      bySeverity[violation.severity] = (bySeverity[violation.severity] || 0) + 1;
    }

    return {
      totalViolations: this.violations.length,
      byHeuristic,
      bySeverity
    };
  }
}

/**
 * Global heuristic enforcer instance
 */
let globalHeuristicEnforcer = null;

/**
 * Initialize global heuristic enforcer
 */
export async function initializeHeuristicEnforcer() {
  if (!globalHeuristicEnforcer) {
    globalHeuristicEnforcer = new ToolUsageHeuristicEnforcer();
    await globalHeuristicEnforcer.initialize();
  }
  return globalHeuristicEnforcer;
}

/**
 * Get global heuristic enforcer
 */
export function getHeuristicEnforcer() {
  return globalHeuristicEnforcer;
}
