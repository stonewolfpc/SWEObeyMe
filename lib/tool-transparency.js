/**
 * Tool Transparency Layer
 * Explains why a tool was chosen, alternatives, fallback, expected outcome
 * Provides transparency users want for tool selection decisions
 */

import { getGovernanceManager } from './tool-governance.js';
import { getArbitrationEngine } from './tool-arbitration.js';

/**
 * Tool Transparency Layer
 * Provides explanations for tool selection decisions
 */
export class ToolTransparencyLayer {
  constructor() {
    this.governanceManager = null;
    this.arbitrationEngine = null;
    this.decisionHistory = [];
  }

  /**
   * Initialize the transparency layer
   */
  async initialize() {
    this.governanceManager = await getGovernanceManager();
    this.arbitrationEngine = await getArbitrationEngine();
  }

  /**
   * Explain tool selection decision
   */
  explainDecision(toolName, task, alternatives, confidence, context = {}) {
    const tool = this.governanceManager?.getTool(toolName);
    const explanation = {
      selectedTool: toolName,
      task,
      timestamp: new Date().toISOString(),
      reasoning: [],
      alternatives: [],
      fallback: tool?.fallback || null,
      expectedOutcome: this._generateExpectedOutcome(tool, task),
      confidence,
    };

    // Explain why this tool was chosen
    if (tool?.triggers) {
      for (const trigger of tool.triggers) {
        if (task.toLowerCase().includes(trigger.toLowerCase())) {
          explanation.reasoning.push({
            type: 'TRIGGER_MATCH',
            message: `Task matches trigger: "${trigger}"`,
          });
        }
      }
    }

    // Explain priority
    if (tool?.priority) {
      explanation.reasoning.push({
        type: 'PRIORITY',
        message: `Tool priority: ${tool.priority} (${this._getPriorityLabel(tool.priority)})`,
      });

      if (alternatives && alternatives.length > 0) {
        const priorityGap = tool.priority - (alternatives[0]?.priority || 0);
        if (priorityGap > 0) {
          explanation.reasoning.push({
            type: 'PRIORITY_GAP',
            message: `Priority gap: ${priorityGap} over next alternative`,
          });
        }
      }
    }

    // Explain category/domain
    if (tool?.category) {
      explanation.reasoning.push({
        type: 'CATEGORY',
        message: `Tool category: ${tool.category}`,
      });
    }

    if (tool?.domain) {
      explanation.reasoning.push({
        type: 'DOMAIN',
        message: `Tool domain: ${tool.domain}`,
      });
    }

    // Explain prerequisites
    if (tool?.prerequisite) {
      explanation.reasoning.push({
        type: 'PREREQUISITE',
        message: `Requires prerequisite: ${tool.prerequisite}`,
        warning: 'Must call prerequisite tool first',
      });
    }

    // Explain alternatives
    if (alternatives && alternatives.length > 0) {
      for (const alt of alternatives.slice(0, 3)) {
        const altTool = this.governanceManager?.getTool(alt);
        explanation.alternatives.push({
          tool: alt,
          priority: altTool?.priority || 10,
          category: altTool?.category || 'unknown',
          reason: this._explainAlternative(tool, altTool),
        });
      }
    }

    // Explain fallback
    if (tool?.fallback) {
      const fallbackTool = this.governanceManager?.getTool(tool.fallback);
      explanation.fallbackExplanation = {
        tool: tool.fallback,
        category: fallbackTool?.category || 'unknown',
        whenToUse: 'If primary tool fails after 2 attempts',
        priority: fallbackTool?.priority || 10,
      };
    }

    // Record decision
    this.decisionHistory.push(explanation);

    return explanation;
  }

  /**
   * Generate expected outcome for a tool
   */
  _generateExpectedOutcome(tool, task) {
    if (!tool) {
      return 'Unknown - tool not found';
    }

    const outcomes = {
      file_operations: 'File will be read or written with surgical rule enforcement',
      governance: 'Validation will be performed to ensure compliance',
      analysis: 'Code structure or dependencies will be analyzed',
      exploration: 'Project structure will be explored',
      search: 'Code patterns will be searched and ranked',
      refactoring: 'Code will be reorganized while maintaining compliance',
    };

    return outcomes[tool.category] || 'Tool will execute according to its defined behavior';
  }

  /**
   * Get priority label
   */
  _getPriorityLabel(priority) {
    if (priority >= 100) return 'CRITICAL';
    if (priority >= 90) return 'HIGH';
    if (priority >= 80) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Explain why an alternative was not chosen
   */
  _explainAlternative(selectedTool, alternativeTool) {
    if (!alternativeTool) {
      return 'Alternative tool not found';
    }

    const reasons = [];

    if (selectedTool.priority > alternativeTool.priority) {
      reasons.push(`Lower priority (${alternativeTool.priority} vs ${selectedTool.priority})`);
    }

    if (selectedTool.category !== alternativeTool.category) {
      reasons.push(`Different category (${alternativeTool.category})`);
    }

    if (selectedTool.domain !== alternativeTool.domain) {
      reasons.push(`Different domain (${alternativeTool.domain})`);
    }

    return reasons.length > 0 ? reasons.join(', ') : 'Available alternative';
  }

  /**
   * Format explanation for user display
   */
  formatExplanation(explanation) {
    let output = '\n';
    output += '='.repeat(60) + '\n';
    output += 'TOOL SELECTION EXPLANATION\n';
    output += '='.repeat(60) + '\n\n';

    output += `Selected Tool: ${explanation.selectedTool}\n`;
    output += `Task: ${explanation.task}\n`;
    output += `Confidence: ${(explanation.confidence * 100).toFixed(0)}%\n\n`;

    output += '-'.repeat(40) + '\n';
    output += 'REASONING\n';
    output += '-'.repeat(40) + '\n';
    for (const reason of explanation.reasoning) {
      output += `• [${reason.type}] ${reason.message}`;
      if (reason.warning) {
        output += ` ⚠️ ${reason.warning}`;
      }
      output += '\n';
    }
    output += '\n';

    if (explanation.alternatives.length > 0) {
      output += '-'.repeat(40) + '\n';
      output += 'ALTERNATIVES CONSIDERED\n';
      output += '-'.repeat(40) + '\n';
      for (const alt of explanation.alternatives) {
        output += `• ${alt.tool} (priority: ${alt.priority}, category: ${alt.category})\n`;
        output += `  Reason not chosen: ${alt.reason}\n`;
      }
      output += '\n';
    }

    if (explanation.fallback) {
      output += '-'.repeat(40) + '\n';
      output += 'FALLBACK PLAN\n';
      output += '-'.repeat(40) + '\n';
      output += `Fallback tool: ${explanation.fallback}\n`;
      if (explanation.fallbackExplanation) {
        output += `Category: ${explanation.fallbackExplanation.category}\n`;
        output += `When to use: ${explanation.fallbackExplanation.whenToUse}\n`;
      }
      output += '\n';
    }

    output += '-'.repeat(40) + '\n';
    output += 'EXPECTED OUTCOME\n';
    output += '-'.repeat(40) + '\n';
    output += `${explanation.expectedOutcome}\n\n`;

    output += '='.repeat(60) + '\n';

    return output;
  }

  /**
   * Get decision history
   */
  getDecisionHistory(limit = 10) {
    return this.decisionHistory.slice(-limit);
  }

  /**
   * Clear decision history
   */
  clearHistory() {
    this.decisionHistory = [];
  }

  /**
   * Get transparency statistics
   */
  getStatistics() {
    const toolUsage = new Map();
    const categoryUsage = new Map();
    const averageConfidence = [];

    for (const decision of this.decisionHistory) {
      toolUsage.set(decision.selectedTool, (toolUsage.get(decision.selectedTool) || 0) + 1);
      averageConfidence.push(decision.confidence);

      const tool = this.governanceManager?.getTool(decision.selectedTool);
      if (tool?.category) {
        categoryUsage.set(tool.category, (categoryUsage.get(tool.category) || 0) + 1);
      }
    }

    return {
      totalDecisions: this.decisionHistory.length,
      toolUsage: Object.fromEntries(toolUsage),
      categoryUsage: Object.fromEntries(categoryUsage),
      averageConfidence:
        averageConfidence.length > 0
          ? (
              (averageConfidence.reduce((a, b) => a + b, 0) / averageConfidence.length) *
              100
            ).toFixed(2) + '%'
          : '0%',
    };
  }
}

/**
 * Global transparency layer instance
 */
let globalTransparencyLayer = null;

/**
 * Initialize global transparency layer
 */
export async function initializeTransparencyLayer() {
  if (!globalTransparencyLayer) {
    globalTransparencyLayer = new ToolTransparencyLayer();
    await globalTransparencyLayer.initialize();
  }
  return globalTransparencyLayer;
}

/**
 * Get global transparency layer
 */
export function getTransparencyLayer() {
  return globalTransparencyLayer;
}
