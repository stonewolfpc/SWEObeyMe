/**
 * Tool Arbitration Engine
 * Decides which tool to use, when to use it, how to use it
 * When to retry, when to fallback, when to ask the user
 * Prevents chaos in multi-tool scenarios
 */

import { getGovernanceManager } from './tool-governance.js';

/**
 * Tool Arbitration Engine
 * Makes intelligent decisions about tool selection and usage
 */
export class ToolArbitrationEngine {
  constructor() {
    this.governanceManager = null;
    this.usageHistory = [];
    this.failureCount = new Map();
    this.maxRetries = 3;
    this.context = {
      previousTool: null,
      taskDescription: null,
      availableTools: new Set()
    };
  }

  /**
   * Initialize the engine
   */
  async initialize() {
    this.governanceManager = await getGovernanceManager();
  }

  /**
   * Set task context
   */
  setContext(context) {
    this.context = {
      ...this.context,
      ...context
    };
  }

  /**
   * Get context
   */
  getContext() {
    return this.context;
  }

  /**
   * Decide which tool to use for a task
   */
  decideTool(taskDescription, availableTools) {
    if (!this.governanceManager) {
      throw new Error('Arbitration engine not initialized. Call initialize() first.');
    }

    // Update context
    this.context.taskDescription = taskDescription;
    this.context.availableTools = new Set(availableTools);

    // Get recommended tools from governance
    const recommendations = this.governanceManager.getRecommendedTools(taskDescription);

    // Filter to only available tools
    const availableRecommendations = recommendations.filter(r => this.context.availableTools.has(r.name));

    if (availableRecommendations.length === 0) {
      // No recommended tools available, use heuristics
      return this._applyHeuristics(taskDescription, availableTools);
    }

    // Return highest priority tool
    const selected = availableRecommendations[0];

    return {
      tool: selected.name,
      priority: selected.priority,
      reason: selected.reason,
      alternatives: availableRecommendations.slice(1).map(r => r.name),
      confidence: this._calculateConfidence(selected, availableRecommendations)
    };
  }

  /**
   * Apply heuristics when no specific recommendations exist
   */
  _applyHeuristics(taskDescription, availableTools) {
    const task = taskDescription.toLowerCase();

    // Heuristic 1: If tool exists for task, use it
    for (const tool of availableTools) {
      const toolData = this.governanceManager.getTool(tool);
      if (toolData && toolData.triggers) {
        for (const trigger of toolData.triggers) {
          if (task.includes(trigger.toLowerCase())) {
            return {
              tool,
              priority: toolData.priority,
              reason: `Heuristic match: task matches trigger "${trigger}"`,
              alternatives: [],
              confidence: 0.7
            };
          }
        }
      }
    }

    // Heuristic 2: Choose highest priority tool
    const toolPriorities = availableTools.map(tool => {
      const toolData = this.governanceManager.getTool(tool);
      return {
        tool,
        priority: toolData?.priority || 10,
        category: toolData?.category || 'unknown'
      };
    });

    toolPriorities.sort((a, b) => b.priority - a.priority);

    const selected = toolPriorities[0];

    return {
      tool: selected.tool,
      priority: selected.priority,
      reason: `Heuristic: highest priority tool (${selected.category})`,
      alternatives: toolPriorities.slice(1, 3).map(t => t.tool),
      confidence: 0.5
    };
  }

  /**
   * Calculate confidence score for tool selection
   */
  _calculateConfidence(selected, alternatives) {
    if (alternatives.length === 0) {
      return 0.9; // High confidence when no alternatives
    }

    const priorityGap = selected.priority - (alternatives[0]?.priority || 0);
    if (priorityGap >= 20) {
      return 0.85; // High confidence when priority gap is large
    } else if (priorityGap >= 10) {
      return 0.7; // Medium confidence
    } else {
      return 0.5; // Low confidence when priorities are close
    }
  }

  /**
   * Decide whether to retry a failed tool
   */
  shouldRetry(toolName, error, attempt) {
    const failures = this.failureCount.get(toolName) || 0;

    if (attempt >= this.maxRetries) {
      return {
        shouldRetry: false,
        reason: `Max retries (${this.maxRetries}) exceeded for ${toolName}`,
        suggestion: 'Use fallback tool or ask user for guidance'
      };
    }

    // Check error type
    if (error.includes('not found') || error.includes('does not exist')) {
      return {
        shouldRetry: false,
        reason: 'Fatal error - retry will not help',
        suggestion: 'Use fallback tool or ask user for guidance'
      };
    }

    if (error.includes('permission') || error.includes('access denied')) {
      return {
        shouldRetry: false,
        reason: 'Permission error - retry will not help',
        suggestion: 'Ask user for permission or use alternative approach'
      };
    }

    return {
      shouldRetry: true,
      reason: `Retry attempt ${attempt + 1}/${this.maxRetries}`,
      suggestion: 'Retry with additional context or parameters'
    };
  }

  /**
   * Decide whether to use fallback tool
   */
  shouldUseFallback(toolName, attempt) {
    if (!this.governanceManager) {
      return { shouldFallback: false };
    }

    const fallback = this.governanceManager.getFallback(toolName);

    if (!fallback) {
      return {
        shouldFallback: false,
        reason: `No fallback tool defined for ${toolName}`
      };
    }

    const failures = this.failureCount.get(toolName) || 0;

    // Use fallback after 2 failures
    if (failures >= 2) {
      return {
        shouldFallback: true,
        fallbackTool: fallback,
        reason: `Primary tool failed ${failures} times, using fallback`
      };
    }

    return {
      shouldFallback: false,
      reason: `Failure count (${failures}) below fallback threshold (2)`
    };
  }

  /**
   * Decide whether to ask user for guidance
   */
  shouldAskUser(toolName, error, attempt) {
    // Ask user if:
    // 1. Max retries exceeded AND no fallback available
    // 2. Error is ambiguous or requires human decision
    // 3. Multiple viable alternatives exist with similar priority

    const failures = this.failureCount.get(toolName) || 0;

    if (attempt >= this.maxRetries) {
      const fallback = this.governanceManager?.getFallback(toolName);
      if (!fallback) {
        return {
          shouldAsk: true,
          reason: `Max retries exceeded and no fallback available for ${toolName}`,
          question: `Tool ${toolName} failed after ${attempt} attempts. How would you like to proceed?`
        };
      }
    }

    // Check for ambiguous errors
    if (error.includes('ambiguous') || error.includes('multiple') || error.includes('conflict')) {
      return {
        shouldAsk: true,
        reason: 'Ambiguous error requires human decision',
        question: `Encountered ambiguous error: ${error}. Please provide guidance.`
      };
    }

    return {
      shouldAsk: false,
      reason: 'No user intervention required at this time'
    };
  }

  /**
   * Record tool usage
   */
  recordUsage(toolName, success, error = null) {
    this.usageHistory.push({
      tool: toolName,
      success,
      error,
      timestamp: new Date().toISOString(),
      context: { ...this.context }
    });

    // Update failure count
    if (!success) {
      const failures = this.failureCount.get(toolName) || 0;
      this.failureCount.set(toolName, failures + 1);
    } else {
      this.failureCount.delete(toolName);
    }

    // Update context
    this.context.previousTool = toolName;
  }

  /**
   * Get usage statistics
   */
  getStatistics() {
    const totalUsage = this.usageHistory.length;
    const successfulUsage = this.usageHistory.filter(u => u.success).length;
    const failedUsage = totalUsage - successfulUsage;

    const toolUsage = new Map();
    for (const usage of this.usageHistory) {
      const count = toolUsage.get(usage.tool) || { success: 0, failure: 0 };
      if (usage.success) {
        count.success++;
      } else {
        count.failure++;
      }
      toolUsage.set(usage.tool, count);
    }

    return {
      totalUsage,
      successfulUsage,
      failedUsage,
      successRate: totalUsage > 0 ? (successfulUsage / totalUsage * 100).toFixed(2) + '%' : '0%',
      toolUsage: Object.fromEntries(toolUsage),
      currentFailures: Object.fromEntries(this.failureCount)
    };
  }

  /**
   * Reset state
   */
  reset() {
    this.usageHistory = [];
    this.failureCount.clear();
    this.context = {
      previousTool: null,
      taskDescription: null,
      availableTools: new Set()
    };
  }
}

/**
 * Global arbitration engine instance
 */
let globalArbitrationEngine = null;

/**
 * Initialize global arbitration engine
 */
export async function initializeArbitrationEngine() {
  if (!globalArbitrationEngine) {
    globalArbitrationEngine = new ToolArbitrationEngine();
    await globalArbitrationEngine.initialize();
  }
  return globalArbitrationEngine;
}

/**
 * Get global arbitration engine
 */
export function getArbitrationEngine() {
  return globalArbitrationEngine;
}
