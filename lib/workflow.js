/**
 * Comprehensive Workflow Orchestration Engine
 * Integrates tool governance, arbitration, transparency, and drift detection
 * Enforces surgical coding standards and prevents technical debt
 */

import { initializeGovernanceManager } from './tool-governance.js';
import { initializeArbitrationEngine } from './tool-arbitration.js';
import { initializeHeuristicEnforcer } from './tool-heuristic-enforcer.js';
import { initializeTransparencyLayer } from './tool-transparency.js';
import { initializeDriftDetector } from './tool-drift-detector.js';
import { initializeProjectScanner } from './project-scanner.js';
import { ProjectHealthAnalyzer } from './project-health-analyzer.js';
import { initializeProjectMemory } from './project-memory.js';

export const activeWorkflows = new Map();

/**
 * Comprehensive Surgical Workflow
 * Orchestrates project analysis, tool governance, and enforcement
 */
class SurgicalWorkflow {
  constructor(id, goal, steps, workspacePath) {
    this.id = id;
    this.goal = goal;
    this.workspacePath = workspacePath;
    this.steps = steps.map((s) => ({ ...s, status: 'pending' }));
    this.startTime = Date.now();
    this.governanceManager = null;
    this.arbitrationEngine = null;
    this.heuristicEnforcer = null;
    this.transparencyLayer = null;
    this.driftDetector = null;
    this.projectScanner = null;
    this.projectMemory = null;
    this.enforcementLog = [];
    this.governanceMetrics = {
      toolsUsed: 0,
      violationsDetected: 0,
      correctionsApplied: 0,
      transparencyScore: 0,
      driftPrevented: 0,
    };
  }

  /**
   * Initialize all governance systems
   */
  async initializeGovernance() {
    this.governanceManager = await initializeGovernanceManager();
    this.arbitrationEngine = await initializeArbitrationEngine();
    this.heuristicEnforcer = await initializeHeuristicEnforcer();
    this.transparencyLayer = await initializeTransparencyLayer();
    this.driftDetector = await initializeDriftDetector();
    this.projectScanner = initializeProjectScanner(this.workspacePath);
    this.projectMemory = await initializeProjectMemory(this.workspacePath);
  }

  /**
   * Update step status
   */
  updateStep(stepName, status) {
    const step = this.steps.find((s) => s.name === stepName);
    if (step) {
      step.status = status;
      step.completedAt = status === 'completed' ? new Date().toISOString() : null;
    }
  }

  /**
   * Check if workflow is complete
   */
  isComplete() {
    return this.steps.every((s) => s.status === 'completed');
  }

  /**
   * Enforce tool governance for an operation
   */
  async enforceToolGovernance(operation, context) {
    // Detect drift
    const drift = this.driftDetector.detectBypass(operation.operation, context.availableTools);
    if (drift) {
      const correction = this.driftDetector.correctDrift(drift);
      this.enforcementLog.push({
        type: 'DRIFT_CORRECTION',
        drift,
        correction,
        timestamp: new Date().toISOString(),
      });
      this.governanceMetrics.driftPrevented++;
      return { allowed: false, correction };
    }

    // Check heuristic violations
    const violations = this.heuristicEnforcer.checkViolation(operation, context);
    if (violations.length > 0) {
      this.enforcementLog.push({
        type: 'HEURISTIC_VIOLATION',
        violations,
        timestamp: new Date().toISOString(),
      });
      this.governanceMetrics.violationsDetected++;
      return { allowed: false, violations };
    }

    // Validate tool usage
    if (operation.toolName) {
      const validation = this.heuristicEnforcer.validateToolUsage(
        operation.toolName,
        operation.task,
        context.availableTools
      );
      if (!validation.compliant) {
        this.enforcementLog.push({
          type: 'TOOL_VALIDATION_FAILED',
          validation,
          timestamp: new Date().toISOString(),
        });
        return { allowed: false, validation };
      }
    }

    this.governanceMetrics.toolsUsed++;
    return { allowed: true };
  }

  /**
   * Get tool recommendation with transparency
   */
  async getToolRecommendation(task, availableTools) {
    const decision = this.arbitrationEngine.decideTool(task, availableTools);

    const explanation = this.transparencyLayer.explainDecision(
      decision.tool,
      task,
      decision.alternatives,
      decision.confidence
    );

    return {
      tool: decision.tool,
      explanation,
      formattedExplanation: this.transparencyLayer.formatExplanation(explanation),
    };
  }

  /**
   * Run project scan step
   */
  async runProjectScan() {
    this.updateStep('project_scan', 'in_progress');

    try {
      const scanResults = await this.projectScanner.scan();
      this.updateStep('project_scan', 'completed');
      return scanResults;
    } catch (error) {
      this.updateStep('project_scan', 'failed');
      throw error;
    }
  }

  /**
   * Build project map step
   */
  async buildProjectMap(scanResults) {
    this.updateStep('build_project_map', 'in_progress');

    try {
      await this.projectMemory.indexStructure();
      await this.projectMemory.analyzeConventions();
      await this.projectMemory.save();
      this.updateStep('build_project_map', 'completed');
      return this.projectMemory.projectMap;
    } catch (error) {
      this.updateStep('build_project_map', 'failed');
      throw error;
    }
  }

  /**
   * Evaluate digital debt step
   */
  async evaluateDigitalDebt(scanResults) {
    this.updateStep('evaluate_digital_debt', 'in_progress');

    try {
      const analyzer = new ProjectHealthAnalyzer(scanResults);
      const analysis = analyzer.analyze();
      this.updateStep('evaluate_digital_debt', 'completed');
      return analysis;
    } catch (error) {
      this.updateStep('evaluate_digital_debt', 'failed');
      throw error;
    }
  }

  /**
   * Generate governance report
   */
  generateGovernanceReport() {
    const governanceStats = this.governanceManager.getStatistics();
    const arbitrationStats = this.arbitrationEngine.getStatistics();
    const heuristicStats = this.heuristicEnforcer.getStatistics();
    const transparencyStats = this.transparencyLayer.getStatistics();
    const driftStats = this.driftDetector.getStatistics();

    return {
      timestamp: new Date().toISOString(),
      workflowId: this.id,
      goal: this.goal,
      governance: governanceStats,
      arbitration: arbitrationStats,
      heuristics: heuristicStats,
      transparency: transparencyStats,
      drift: driftStats,
      enforcement: this.enforcementLog,
      metrics: this.governanceMetrics,
    };
  }

  /**
   * Format comprehensive report
   */
  formatReport(governanceReport, healthAnalysis) {
    let output = '\n';
    output += '='.repeat(60) + '\n';
    output += 'COMPREHENSIVE GOVERNANCE REPORT\n';
    output += '='.repeat(60) + '\n\n';

    output += 'Workflow ID: ' + this.id + '\n';
    output += 'Goal: ' + this.goal + '\n';
    output += 'Started: ' + new Date(this.startTime).toISOString() + '\n\n';

    output += '-'.repeat(40) + '\n';
    output += 'GOVERNANCE METRICS\n';
    output += '-'.repeat(40) + '\n';
    output += 'Tools Used: ' + this.governanceMetrics.toolsUsed + '\n';
    output += 'Violations Detected: ' + this.governanceMetrics.violationsDetected + '\n';
    output += 'Corrections Applied: ' + this.governanceMetrics.correctionsApplied + '\n';
    output += 'Drift Prevented: ' + this.governanceMetrics.driftPrevented + '\n\n';

    if (healthAnalysis) {
      output += '-'.repeat(40) + '\n';
      output += 'PROJECT HEALTH\n';
      output += '-'.repeat(40) + '\n';
      output += 'Health Score: ' + healthAnalysis.healthScore + '/100\n';
      output += 'Grade: ' + healthAnalysis.grade + '\n';
      output += 'Code Smells: ' + healthAnalysis.summary.issues.codeSmells + '\n';
      output += 'Digital Debt: ' + healthAnalysis.summary.issues.digitalDebt + '\n\n';
    }

    output += '-'.repeat(40) + '\n';
    output += 'ENFORCEMENT LOG\n';
    output += '-'.repeat(40) + '\n';
    for (const log of this.enforcementLog.slice(-5)) {
      output += '[' + log.type + '] ' + new Date(log.timestamp).toISOString() + '\n';
    }
    output += '\n';

    output += '='.repeat(60) + '\n';

    return output;
  }
}

export { SurgicalWorkflow };
