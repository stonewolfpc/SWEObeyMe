/**
 * Tool Drift Detector
 * Intercepts and corrects model attempts to invent/misuse/ignore/bypass tools
 * Prevents tool drift and enforces proper tool usage
 */

import { getGovernanceManager } from './tool-governance.js';
import { getHeuristicEnforcer } from './tool-heuristic-enforcer.js';

/**
 * Tool Drift Detector
 * Detects and corrects tool drift behavior
 */
export class ToolDriftDetector {
  constructor() {
    this.governanceManager = null;
    this.heuristicEnforcer = null;
    this.driftEvents = [];
    this.corrections = [];
  }

  /**
   * Initialize the drift detector
   */
  async initialize() {
    this.governanceManager = await getGovernanceManager();
    this.heuristicEnforcer = await getHeuristicEnforcer();
  }

  /**
   * Detect if model is inventing a tool
   */
  detectInventedTool(toolName, availableTools) {
    if (!this.governanceManager) {
      return null;
    }

    const tool = this.governanceManager.getTool(toolName);

    if (!tool) {
      const drift = {
        type: 'INVENTED_TOOL',
        severity: 'CRITICAL',
        toolName,
        message: `Model attempted to use non-existent tool '${toolName}'`,
        availableTools: availableTools.slice(0, 5),
        suggestedTools: this._suggestAlternatives(toolName, availableTools),
        correction: 'Use only registered tools from the tool registry'
      };

      this.driftEvents.push(drift);
      return drift;
    }

    return null;
  }

  /**
   * Detect if model is misusing a tool
   */
  detectMisuse(toolName, context) {
    if (!this.governanceManager) {
      return null;
    }

    const tool = this.governanceManager.getTool(toolName);
    if (!tool) {
      return this.detectInventedTool(toolName, context.availableTools || []);
    }

    const violations = [];

    // Check prerequisite violations
    if (tool.prerequisite && context.previousTool !== tool.prerequisite) {
      violations.push({
        type: 'PREREQUISITE_VIOLATION',
        severity: 'HIGH',
        message: `Tool '${toolName}' used without required prerequisite '${tool.prerequisite}'`,
        correction: `Call ${tool.prerequisite} before ${toolName}`
      });
    }

    // Check if tool conflicts with current operation
    if (tool.conflicts && context.currentOperation) {
      for (const conflict of tool.conflicts) {
        if (context.currentOperation.includes(conflict)) {
          violations.push({
            type: 'CONFLICT_DETECTED',
            severity: 'HIGH',
            message: `Tool '${toolName}' conflicts with operation '${conflict}'`,
            correction: `Use alternative tool or avoid conflicting operation`
          });
        }
      }
    }

    if (violations.length > 0) {
      const drift = {
        type: 'MISUSE',
        severity: 'HIGH',
        toolName,
        violations,
        correction: violations[0].correction
      };

      this.driftEvents.push(drift);
      return drift;
    }

    return null;
  }

  /**
   * Detect if model is ignoring required tools
   */
  detectIgnoredTool(task, availableTools, usedTool) {
    if (!this.governanceManager) {
      return null;
    }

    const recommended = this.governanceManager.getRecommendedTools(task);
    const availableRecommended = recommended.filter(r => availableTools.includes(r.name));

    if (availableRecommended.length > 0) {
      const highestPriority = availableRecommended[0];

      if (usedTool !== highestPriority.name) {
        const drift = {
          type: 'IGNORED_REQUIRED_TOOL',
          severity: 'MEDIUM',
          task,
          recommendedTool: highestPriority.name,
          recommendedPriority: highestPriority.priority,
          usedTool,
          message: `Model ignored higher-priority tool '${highestPriority.name}' (priority ${highestPriority.priority}) in favor of '${usedTool}'`,
          correction: `Use ${highestPriority.name} for this task`,
          confidence: this._calculateDriftConfidence(highestPriority.priority, usedTool)
        };

        this.driftEvents.push(drift);
        return drift;
      }
    }

    return null;
  }

  /**
   * Detect if model is bypassing tools
   */
  detectBypass(operation, availableTools) {
    const bypassPatterns = [
      { pattern: 'manual edit', tool: 'write_file' },
      { pattern: 'direct write', tool: 'write_file' },
      { pattern: 'direct file access', tool: 'read_file' },
      { pattern: 'manual file', tool: 'write_file' }
    ];

    const operationLower = operation.toLowerCase();

    for (const { pattern, tool } of bypassPatterns) {
      if (operationLower.includes(pattern)) {
        if (availableTools.includes(tool)) {
          const drift = {
            type: 'BYPASSED_TOOL',
            severity: 'CRITICAL',
            operation,
            bypassedTool: tool,
            message: `Model attempted to bypass tool '${tool}' with manual operation`,
            correction: `Use ${tool} instead of manual operation`
          };

          this.driftEvents.push(drift);
          return drift;
        }
      }
    }

    return null;
  }

  /**
   * Suggest alternative tools based on name similarity
   */
  _suggestAlternatives(inventedName, availableTools) {
    const suggestions = [];
    const inventedLower = inventedName.toLowerCase();

    for (const toolName of availableTools) {
      const tool = this.governanceManager.getTool(toolName);
      if (tool) {
        // Check for similar names
        if (toolName.toLowerCase().includes(inventedLower) || 
            inventedLower.includes(toolName.toLowerCase())) {
          suggestions.push({
            tool: toolName,
            reason: 'Similar name',
            priority: tool.priority
          });
        }
        // Check for similar category/domain
        if (tool.triggers) {
          for (const trigger of tool.triggers) {
            if (inventedLower.includes(trigger.toLowerCase())) {
              suggestions.push({
                tool: toolName,
                reason: 'Matches trigger',
                priority: tool.priority
              });
            }
          }
        }
      }
    }

    // Sort by priority and return top 3
    suggestions.sort((a, b) => b.priority - a.priority);
    return suggestions.slice(0, 3);
  }

  /**
   * Calculate drift confidence
   */
  _calculateDriftConfidence(recommendedPriority, usedTool) {
    const usedToolData = this.governanceManager?.getTool(usedTool);
    const usedPriority = usedToolData?.priority || 10;

    const gap = recommendedPriority - usedPriority;
    if (gap >= 30) return 0.9;
    if (gap >= 20) return 0.75;
    if (gap >= 10) return 0.5;
    return 0.3;
  }

  /**
   * Correct drift event
   */
  correctDrift(drift) {
    const correction = {
      originalDrift: drift,
      applied: false,
      action: null,
      result: null
    };

    switch (drift.type) {
      case 'INVENTED_TOOL':
        if (drift.suggestedTools && drift.suggestedTools.length > 0) {
          correction.action = `Use suggested tool: ${drift.suggestedTools[0].tool}`;
          correction.applied = true;
        }
        break;

      case 'MISUSE':
        if (drift.correction) {
          correction.action = drift.correction;
          correction.applied = true;
        }
        break;

      case 'IGNORED_REQUIRED_TOOL':
        if (drift.recommendedTool) {
          correction.action = `Use recommended tool: ${drift.recommendedTool}`;
          correction.applied = true;
        }
        break;

      case 'BYPASSED_TOOL':
        if (drift.bypassedTool) {
          correction.action = `Use bypassed tool: ${drift.bypassedTool}`;
          correction.applied = true;
        }
        break;
    }

    this.corrections.push(correction);
    return correction;
  }

  /**
   * Get drift event history
   */
  getDriftHistory(limit = 20) {
    return this.driftEvents.slice(-limit);
  }

  /**
   * Get correction history
   */
  getCorrectionHistory(limit = 20) {
    return this.corrections.slice(-limit);
  }

  /**
   * Get drift statistics
   */
  getStatistics() {
    const byType = {};
    const bySeverity = {};

    for (const drift of this.driftEvents) {
      byType[drift.type] = (byType[drift.type] || 0) + 1;
      bySeverity[drift.severity] = (bySeverity[drift.severity] || 0) + 1;
    }

    const appliedCorrections = this.corrections.filter(c => c.applied).length;

    return {
      totalDriftEvents: this.driftEvents.length,
      totalCorrections: this.corrections.length,
      appliedCorrections,
      correctionRate: this.corrections.length > 0 
        ? (appliedCorrections / this.corrections.length * 100).toFixed(2) + '%' 
        : '0%',
      byType,
      bySeverity
    };
  }

  /**
   * Clear history
   */
  clearHistory() {
    this.driftEvents = [];
    this.corrections = [];
  }

  /**
   * Generate drift report
   */
  generateReport() {
    const stats = this.getStatistics();
    const recentDrift = this.getDriftHistory(5);

    let report = '\n';
    report += '='.repeat(60) + '\n';
    report += 'TOOL DRIFT DETECTOR REPORT\n';
    report += '='.repeat(60) + '\n\n';

    report += `Total Drift Events: ${stats.totalDriftEvents}\n`;
    report += `Total Corrections: ${stats.totalCorrections}\n`;
    report += `Correction Rate: ${stats.correctionRate}\n\n`;

    if (Object.keys(stats.byType).length > 0) {
      report += '-'.repeat(40) + '\n';
      report += 'DRIFT BY TYPE\n';
      report += '-'.repeat(40) + '\n';
      for (const [type, count] of Object.entries(stats.byType)) {
        report += `${type}: ${count}\n`;
      }
      report += '\n';
    }

    if (recentDrift.length > 0) {
      report += '-'.repeat(40) + '\n';
      report += 'RECENT DRIFT EVENTS\n';
      report += '-'.repeat(40) + '\n';
      for (const drift of recentDrift) {
        report += `[${drift.severity}] ${drift.type}: ${drift.message}\n`;
      }
      report += '\n';
    }

    report += '='.repeat(60) + '\n';

    return report;
  }
}

/**
 * Global drift detector instance
 */
let globalDriftDetector = null;

/**
 * Initialize global drift detector
 */
export async function initializeDriftDetector() {
  if (!globalDriftDetector) {
    globalDriftDetector = new ToolDriftDetector();
    await globalDriftDetector.initialize();
  }
  return globalDriftDetector;
}

/**
 * Get global drift detector
 */
export function getDriftDetector() {
  return globalDriftDetector;
}
