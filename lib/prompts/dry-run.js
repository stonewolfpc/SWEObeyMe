/**
 * Prompt Dry-Run Simulator
 * Simulates prompt execution before exposure to Windsurf
 * Checks for drift, rule violations, missing context, and ambiguous outputs
 */

import { getPromptRegistry } from './registry.js';
import { getPromptValidator } from './validator.js';

/**
 * Dry-run result
 */
class DryRunResult {
  constructor(promptName) {
    this.promptName = promptName;
    this.passed = true;
    this.issues = [];
    this.warnings = [];
  }

  addIssue(message, severity = 'error') {
    if (severity === 'error') {
      this.passed = false;
    }
    this.issues.push({ message, severity });
  }

  addWarning(message) {
    this.warnings.push(message);
  }

  hasPassed() {
    return this.passed;
  }

  getIssues() {
    return this.issues;
  }

  getWarnings() {
    return this.warnings;
  }

  format() {
    let output = `[Dry-Run] ${this.promptName}: ${this.passed ? 'PASSED' : 'FAILED'}\n`;
    
    if (this.issues.length > 0) {
      output += 'Issues:\n';
      output += this.issues.map(i => `  [${i.severity.toUpperCase()}] ${i.message}`).join('\n');
      output += '\n';
    }
    
    if (this.warnings.length > 0) {
      output += 'Warnings:\n';
      output += this.warnings.map(w => `  [WARNING] ${w}`).join('\n');
    }
    
    return output;
  }
}

/**
 * Prompt Dry-Run Simulator
 */
export class PromptDryRunSimulator {
  constructor() {
    this.registry = null;
    this.validator = null;
  }

  /**
   * Initialize the simulator
   */
  async initialize() {
    this.registry = await getPromptRegistry();
    this.validator = getPromptValidator();
  }

  /**
   * Simulate a single prompt
   */
  async simulate(promptName, context = {}) {
    if (!this.registry) {
      await this.initialize();
    }

    const prompt = this.registry.getPrompt(promptName);
    if (!prompt) {
      const result = new DryRunResult(promptName);
      result.addIssue('Prompt not found in registry');
      return result;
    }

    const result = new DryRunResult(promptName);

    // 1. Validate prompt definition
    const validation = this.validator.validate(prompt);
    if (!validation.isValid()) {
      validation.getErrors().forEach(err => result.addIssue(err));
    }
    validation.getWarnings().forEach(warn => result.addWarning(warn));

    // 2. Check for drift potential
    this.checkDriftPotential(prompt, context, result);

    // 3. Check for rule violations
    this.checkRuleViolations(prompt, context, result);

    // 4. Check for missing context
    this.checkMissingContext(prompt, context, result);

    // 5. Check for ambiguous outputs
    this.checkAmbiguousOutputs(prompt, context, result);

    // 6. Check governance level alignment
    this.checkGovernanceAlignment(prompt, context, result);

    return result;
  }

  /**
   * Check for drift potential
   */
  checkDriftPotential(prompt, context, result) {
    // Check if prompt has context requirements but context is missing
    if (prompt.contextRequirements && prompt.contextRequirements.length > 0) {
      const missing = prompt.contextRequirements.filter(req => !context[req]);
      if (missing.length > 0) {
        result.addIssue(`Missing required context: ${missing.join(', ')}`);
      }
    }

    // Check if prompt has fallback behavior that requires context reload
    if (prompt.fallbackBehavior?.reloadContext && !context.projectType) {
      result.addWarning('Fallback requires context reload but projectType not provided');
    }
  }

  /**
   * Check for rule violations
   */
  checkRuleViolations(prompt, context, result) {
    // Check if prompt violates optimality principle
    if (prompt.optimality === 'literal-only' && prompt.governanceLevel === 'strict') {
      result.addIssue('Strict governance with literal-only optimality may prevent optimal solutions');
    }

    // Check if prompt has no clarification triggers but is strict
    if (prompt.governanceLevel === 'strict' && (!prompt.clarificationTriggers || prompt.clarificationTriggers.length === 0)) {
      result.addWarning('Strict governance level but no clarification triggers defined');
    }
  }

  /**
   * Check for missing context
   */
  checkMissingContext(prompt, context, result) {
    // Check if prompt requires project context
    if (prompt.category === 'project-awareness' || prompt.category === 'architecture') {
      if (!context.projectType && !context.directoryStructure) {
        result.addIssue('Project-awareness prompts require projectType or directoryStructure in context');
      }
    }

    // Check if prompt requires active subsystem
    if (prompt.contextRequirements?.includes('activeSubsystem') && !context.activeSubsystem) {
      result.addWarning('Prompt requires activeSubsystem but not provided in context');
    }
  }

  /**
   * Check for ambiguous outputs
   */
  checkAmbiguousOutputs(prompt, context, result) {
    // Check if prompt has no arguments but expects user input
    if ((!prompt.arguments || prompt.arguments.length === 0) && !prompt.template) {
      result.addWarning('Prompt has no arguments or template - may produce ambiguous outputs');
    }

    // Check if prompt arguments lack descriptions
    if (prompt.arguments) {
      const missingDescriptions = prompt.arguments.filter(arg => !arg.description);
      if (missingDescriptions.length > 0) {
        result.addWarning(`${missingDescriptions.length} arguments lack descriptions`);
      }
    }
  }

  /**
   * Check governance level alignment
   */
  checkGovernanceAlignment(prompt, context, result) {
    // Check if governance level matches category expectations
    const strictCategories = ['governance', 'preflight'];
    if (strictCategories.includes(prompt.category) && prompt.governanceLevel === 'advisory') {
      result.addWarning(`${prompt.category} category with advisory governance level may not enforce discipline`);
    }

    // Check if strict prompts have fallback behavior
    if (prompt.governanceLevel === 'strict' && !prompt.fallbackBehavior) {
      result.addIssue('Strict governance level requires fallback behavior definition');
    }
  }

  /**
   * Simulate all prompts in the registry
   */
  async simulateAll(context = {}) {
    if (!this.registry) {
      await this.initialize();
    }

    const prompts = this.registry.getAllPrompts();
    const results = [];

    for (const prompt of prompts) {
      const result = await this.simulate(prompt.name, context);
      results.push(result);
    }

    return {
      total: results.length,
      passed: results.filter(r => r.hasPassed()).length,
      failed: results.filter(r => !r.hasPassed()).length,
      results,
    };
  }
}

/**
 * Global simulator instance
 */
let globalSimulator = null;

/**
 * Get global prompt dry-run simulator
 */
export async function getPromptSimulator() {
  if (!globalSimulator) {
    globalSimulator = new PromptDryRunSimulator();
    await globalSimulator.initialize();
  }
  return globalSimulator;
}
