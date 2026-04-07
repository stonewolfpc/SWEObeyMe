/**
 * Governance System Integration
 * Initializes and integrates all governance systems
 * Provides unified entry point for tool governance
 */

import { initializeGovernanceManager, getGovernanceManager } from './tool-governance.js';
import { initializeArbitrationEngine, getArbitrationEngine } from './tool-arbitration.js';
import { initializeHeuristicEnforcer, getHeuristicEnforcer } from './tool-heuristic-enforcer.js';
import { initializeTransparencyLayer, getTransparencyLayer } from './tool-transparency.js';
import { initializeDriftDetector, getDriftDetector } from './tool-drift-detector.js';
import { activeWorkflows, SurgicalWorkflow } from './workflow.js';

/**
 * Unified Governance System
 * Integrates all governance components
 */
export class GovernanceSystem {
  constructor() {
    this.initialized = false;
    this.governanceManager = null;
    this.arbitrationEngine = null;
    this.heuristicEnforcer = null;
    this.transparencyLayer = null;
    this.driftDetector = null;
  }

  /**
   * Initialize all governance systems
   */
  async initialize() {
    if (this.initialized) {
      return this;
    }

    try {
      this.governanceManager = await initializeGovernanceManager();
      this.arbitrationEngine = await initializeArbitrationEngine();
      this.heuristicEnforcer = await initializeHeuristicEnforcer();
      this.transparencyLayer = await initializeTransparencyLayer();
      this.driftDetector = await initializeDriftDetector();

      this.initialized = true;
      return this;
    } catch (error) {
      console.error(`Failed to initialize governance system: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if system is initialized
   */
  isInitialized() {
    return this.initialized;
  }

  /**
   * Get governance manager
   */
  getGovernanceManager() {
    return this.governanceManager;
  }

  /**
   * Get arbitration engine
   */
  getArbitrationEngine() {
    return this.arbitrationEngine;
  }

  /**
   * Get heuristic enforcer
   */
  getHeuristicEnforcer() {
    return this.heuristicEnforcer;
  }

  /**
   * Get transparency layer
   */
  getTransparencyLayer() {
    return this.transparencyLayer;
  }

  /**
   * Get drift detector
   */
  getDriftDetector() {
    return this.driftDetector;
  }

  /**
   * Create a new workflow
   */
  createWorkflow(id, goal, steps, workspacePath) {
    const workflow = new SurgicalWorkflow(id, goal, steps, workspacePath);
    activeWorkflows.set(id, workflow);
    return workflow;
  }

  /**
   * Get workflow by ID
   */
  getWorkflow(id) {
    return activeWorkflows.get(id);
  }

  /**
   * Get all active workflows
   */
  getAllWorkflows() {
    return Array.from(activeWorkflows.values());
  }

  /**
   * Generate comprehensive system report
   */
  generateSystemReport() {
    if (!this.initialized) {
      return {
        status: 'NOT_INITIALIZED',
        message: 'Governance system not initialized'
      };
    }

    return {
      status: 'ACTIVE',
      timestamp: new Date().toISOString(),
      governance: this.governanceManager.getStatistics(),
      arbitration: this.arbitrationEngine.getStatistics(),
      heuristics: this.heuristicEnforcer.getStatistics(),
      transparency: this.transparencyLayer.getStatistics(),
      drift: this.driftDetector.getStatistics(),
      workflows: {
        active: activeWorkflows.size,
        details: Array.from(activeWorkflows.entries()).map(([id, wf]) => ({
          id,
          goal: wf.goal,
          complete: wf.isComplete(),
          steps: wf.steps
        }))
      }
    };
  }

  /**
   * Format system report for display
   */
  formatSystemReport(report) {
    let output = '\n';
    output += '='.repeat(60) + '\n';
    output += 'GOVERNANCE SYSTEM REPORT\n';
    output += '='.repeat(60) + '\n\n';

    output += 'Status: ' + report.status + '\n';
    output += 'Timestamp: ' + report.timestamp + '\n\n';

    if (report.status === 'ACTIVE') {
      output += '-'.repeat(40) + '\n';
      output += 'GOVERNANCE MANAGER\n';
      output += '-'.repeat(40) + '\n';
      output += 'Total Tools: ' + report.governance.totalTools + '\n';
      output += 'Categories: ' + report.governance.totalCategories + '\n';
      output += 'Domains: ' + report.governance.totalDomains + '\n';
      output += 'Tools with Fallbacks: ' + report.governance.toolsWithFallbacks + '\n\n';

      output += '-'.repeat(40) + '\n';
      output += 'ARBITRATION ENGINE\n';
      output += '-'.repeat(40) + '\n';
      output += 'Total Usage: ' + report.arbitration.totalUsage + '\n';
      output += 'Success Rate: ' + report.arbitration.successRate + '\n\n';

      output += '-'.repeat(40) + '\n';
      output += 'HEURISTIC ENFORCER\n';
      output += '-'.repeat(40) + '\n';
      output += 'Total Violations: ' + report.heuristics.totalViolations + '\n';
      output += 'By Severity: ' + JSON.stringify(report.heuristics.bySeverity, null, 2) + '\n\n';

      output += '-'.repeat(40) + '\n';
      output += 'TRANSPARENCY LAYER\n';
      output += '-'.repeat(40) + '\n';
      output += 'Total Decisions: ' + report.transparency.totalDecisions + '\n';
      output += 'Average Confidence: ' + report.transparency.averageConfidence + '\n\n';

      output += '-'.repeat(40) + '\n';
      output += 'DRIFT DETECTOR\n';
      output += '-'.repeat(40) + '\n';
      output += 'Total Drift Events: ' + report.drift.totalDriftEvents + '\n';
      output += 'Correction Rate: ' + report.drift.correctionRate + '\n\n';

      output += '-'.repeat(40) + '\n';
      output += 'WORKFLOWS\n';
      output += '-'.repeat(40) + '\n';
      output += 'Active Workflows: ' + report.workflows.active + '\n';
      for (const wf of report.workflows.details) {
        const status = wf.complete ? 'COMPLETE' : 'IN_PROGRESS';
        output += '  - ' + wf.id + ': ' + wf.goal + ' (' + status + ')\n';
      }
      output += '\n';
    }

    output += '='.repeat(60) + '\n';

    return output;
  }

  /**
   * Reset all systems
   */
  async reset() {
    this.governanceManager = null;
    this.arbitrationEngine = null;
    this.heuristicEnforcer = null;
    this.transparencyLayer = null;
    this.driftDetector = null;
    this.initialized = false;

    // Clear global instances
    // (Note: This would require modifying the individual modules to support reset)
  }
}

/**
 * Global governance system instance
 */
let globalGovernanceSystem = null;

/**
 * Initialize global governance system
 */
export async function initializeGovernanceSystem() {
  if (!globalGovernanceSystem) {
    globalGovernanceSystem = new GovernanceSystem();
    await globalGovernanceSystem.initialize();
  }
  return globalGovernanceSystem;
}

/**
 * Get global governance system
 */
export function getGovernanceSystem() {
  return globalGovernanceSystem;
}

/**
 * Quick check if governance system is ready
 */
export function isGovernanceReady() {
  return globalGovernanceSystem?.isInitialized() || false;
}
