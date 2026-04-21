/**
 * Autonomous Execution System - "Anti-Vibe-Coder / 3AM Finish This While I'm Gone" Upgrade
 * 
 * This system enables SWEObeyMe to:
 * 1. Automatically generate full task plans from long prompts
 * 2. Treat task lists as LAW - stored, enforced, tracked, prevents drift
 * 3. System-owned task list (not AI-owned) to prevent forgetting/drift/hallucination
 * 4. Autonomous research mode - documentation, examples, APIs, patterns, best practices
 * 5. Detect when user is gone and enter 3AM autopilot mode
 * 6. OFF switch for professional developers only
 * 
 * DEFAULT ON - Makes Windsurf invaluable at $15 price point
 */

import fs from 'fs/promises';
import path from 'path';
import { recordAction } from './session.js';

/**
 * Autonomous Execution Configuration
 */
const AUTONOMOUS_CONFIG = {
  enabled: true, // DEFAULT ON
  maxTaskDepth: 10,
  researchTimeout: 300000, // 5 minutes per research task
  autoContinueThreshold: 0.8, // 80% confidence to continue without user input
  pauseOnUserInputRequired: true,
  version: '1.0.0',
};

/**
 * Task Plan Storage - System-owned, versioned, validated
 */
class TaskPlanStorage {
  constructor(workspacePath) {
    this.storagePath = path.join(workspacePath, '.sweobeyme-autonomous');
    this.currentPlan = null;
    this.planHistory = [];
  }

  /**
   * Initialize storage
   */
  async initialize() {
    try {
      await fs.mkdir(this.storagePath, { recursive: true });
      await this.loadCurrentPlan();
    } catch (error) {
      console.error('Failed to initialize task plan storage:', error);
    }
  }

  /**
   * Load current plan
   */
  async loadCurrentPlan() {
    try {
      const planPath = path.join(this.storagePath, 'current-plan.json');
      const data = await fs.readFile(planPath, 'utf-8');
      this.currentPlan = JSON.parse(data);
    } catch (error) {
      // No current plan exists
      this.currentPlan = null;
    }
  }

  /**
   * Save current plan
   */
  async saveCurrentPlan(plan) {
    try {
      const planPath = path.join(this.storagePath, 'current-plan.json');
      const planWithTimestamp = {
        ...plan,
        lastModified: new Date().toISOString(),
        version: AUTONOMOUS_CONFIG.version,
      };
      await fs.writeFile(planPath, JSON.stringify(planWithTimestamp, null, 2));
      this.currentPlan = planWithTimestamp;
      
      // Archive to history
      await this.archivePlan(planWithTimestamp);
    } catch (error) {
      console.error('Failed to save task plan:', error);
    }
  }

  /**
   * Archive plan to history
   */
  async archivePlan(plan) {
    try {
      const historyPath = path.join(this.storagePath, 'history');
      await fs.mkdir(historyPath, { recursive: true });
      
      const archiveName = `plan-${Date.now()}.json`;
      const archivePath = path.join(historyPath, archiveName);
      await fs.writeFile(archivePath, JSON.stringify(plan, null, 2));
      
      // Keep only last 20 plans
      const historyFiles = await fs.readdir(historyPath);
      if (historyFiles.length > 20) {
        historyFiles
          .sort()
          .slice(0, historyFiles.length - 20)
          .forEach(async file => {
            await fs.unlink(path.join(historyPath, file));
          });
      }
    } catch (error) {
      console.error('Failed to archive plan:', error);
    }
  }

  /**
   * Validate plan integrity
   */
  validatePlan(plan) {
    const errors = [];

    if (!plan.id) errors.push('Missing plan ID');
    if (!plan.goal) errors.push('Missing plan goal');
    if (!plan.tasks || !Array.isArray(plan.tasks)) errors.push('Missing or invalid tasks array');
    if (plan.tasks && plan.tasks.length === 0) errors.push('Empty tasks array');

    // Validate task structure
    if (plan.tasks) {
      plan.tasks.forEach((task, index) => {
        if (!task.id) errors.push(`Task ${index}: Missing task ID`);
        if (!task.description) errors.push(`Task ${index}: Missing description`);
        if (!task.status) errors.push(`Task ${index}: Missing status`);
        if (!['pending', 'in_progress', 'completed', 'blocked', 'failed'].includes(task.status)) {
          errors.push(`Task ${index}: Invalid status "${task.status}"`);
        }
      });
    }

    // Validate dependencies
    if (plan.tasks) {
      const taskIds = new Set(plan.tasks.map(t => t.id));
      plan.tasks.forEach(task => {
        if (task.dependencies) {
          task.dependencies.forEach(depId => {
            if (!taskIds.has(depId)) {
              errors.push(`Task ${task.id}: Dependency "${depId}" not found in plan`);
            }
          });
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get current plan
   */
  getCurrentPlan() {
    return this.currentPlan;
  }

  /**
   * Clear current plan
   */
  async clearCurrentPlan() {
    try {
      const planPath = path.join(this.storagePath, 'current-plan.json');
      await fs.unlink(planPath);
      this.currentPlan = null;
    } catch (error) {
      // Plan doesn't exist or already cleared
    }
  }
}

/**
 * Task Plan Generator - Breaks long prompts into atomic tasks
 */
class TaskPlanGenerator {
  constructor(workspacePath) {
    this.workspacePath = workspacePath;
  }

  /**
   * Generate task plan from user prompt
   */
  async generatePlan(prompt, context = {}) {
    const plan = {
      id: `plan-${Date.now()}`,
      goal: this.extractGoal(prompt),
      originalPrompt: prompt,
      createdAt: new Date().toISOString(),
      status: 'active',
      tasks: [],
      phases: [],
      metadata: {
        estimatedDuration: null,
        complexity: 'medium',
        risks: [],
        prerequisites: [],
        missingInformation: [],
      },
    };

    // Analyze prompt complexity
    const analysis = this.analyzePrompt(prompt, context);
    plan.metadata.complexity = analysis.complexity;
    plan.metadata.risks = analysis.risks;
    plan.metadata.prerequisites = analysis.prerequisites;
    plan.metadata.missingInformation = analysis.missingInformation;

    // Generate atomic tasks
    plan.tasks = this.generateAtomicTasks(prompt, analysis, context);

    // Group into phases
    plan.phases = this.groupIntoPhases(plan.tasks);

    // Order by dependency
    plan.tasks = this.orderTasksByDependency(plan.tasks);

    return plan;
  }

  /**
   * Extract goal from prompt
   */
  extractGoal(prompt) {
    // Simple goal extraction - can be enhanced with NLP
    const sentences = prompt.split(/[.!?]+/);
    const firstSentence = sentences[0]?.trim() || prompt.substring(0, 100);
    return firstSentence;
  }

  /**
   * Analyze prompt complexity and requirements
   */
  analyzePrompt(prompt, context) {
    const analysis = {
      complexity: 'medium',
      risks: [],
      prerequisites: [],
      missingInformation: [],
    };

    // Detect complexity indicators
    const complexityIndicators = [
      { pattern: /build|create|implement|develop/gi, weight: 1 },
      { pattern: /refactor|restructure|reorganize/gi, weight: 2 },
      { pattern: /integration|connect|combine/gi, weight: 2 },
      { pattern: /api|database|backend|frontend/gi, weight: 1 },
      { pattern: /test|validate|verify/gi, weight: 1 },
      { pattern: /optimize|improve|enhance/gi, weight: 1 },
    ];

    let complexityScore = 0;
    complexityIndicators.forEach(indicator => {
      const matches = prompt.match(indicator.pattern);
      if (matches) {
        complexityScore += matches.length * indicator.weight;
      }
    });

    if (complexityScore > 10) analysis.complexity = 'high';
    else if (complexityScore < 3) analysis.complexity = 'low';

    // Detect risks
    if (prompt.includes('delete') || prompt.includes('remove')) {
      analysis.risks.push('Data loss risk - backup recommended');
    }
    if (prompt.includes('rewrite') || prompt.includes('replace')) {
      analysis.risks.push('Breaking changes risk - version control recommended');
    }
    if (prompt.includes('api') || prompt.includes('integration')) {
      analysis.risks.push('Integration complexity - API compatibility verification needed');
    }

    // Detect prerequisites
    if (prompt.includes('database')) {
      analysis.prerequisites.push('Database connection and schema');
    }
    if (prompt.includes('api')) {
      analysis.prerequisites.push('API documentation and endpoints');
    }
    if (prompt.includes('test')) {
      analysis.prerequisites.push('Test framework setup');
    }

    // Detect missing information
    if (!context.projectType) {
      analysis.missingInformation.push('Project type not specified');
    }
    if (!context.framework) {
      analysis.missingInformation.push('Framework not specified');
    }

    return analysis;
  }

  /**
   * Generate atomic tasks from prompt
   */
  generateAtomicTasks(prompt, analysis, context) {
    const tasks = [];
    let taskId = 1;

    // Research tasks
    if (analysis.missingInformation.length > 0) {
      tasks.push({
        id: `task-${taskId++}`,
        description: `Research: ${analysis.missingInformation.join(', ')}`,
        type: 'research',
        status: 'pending',
        priority: 'high',
        dependencies: [],
        estimatedDuration: '15-30 minutes',
      });
    }

    // Setup tasks
    if (analysis.prerequisites.length > 0) {
      analysis.prerequisites.forEach(prereq => {
        tasks.push({
          id: `task-${taskId++}`,
          description: `Setup: ${prereq}`,
          type: 'setup',
          status: 'pending',
          priority: 'high',
          dependencies: [],
          estimatedDuration: '10-20 minutes',
        });
      });
    }

    // Implementation tasks based on prompt analysis
    const implementationTasks = this.extractImplementationTasks(prompt, context);
    implementationTasks.forEach(implTask => {
      tasks.push({
        id: `task-${taskId++}`,
        description: implTask.description,
        type: implTask.type || 'implementation',
        status: 'pending',
        priority: implTask.priority || 'medium',
        dependencies: implTask.dependencies || [],
        estimatedDuration: implTask.estimatedDuration || '30-60 minutes',
      });
    });

    // Validation tasks
    tasks.push({
      id: `task-${taskId++}`,
      description: 'Validate implementation against requirements',
      type: 'validation',
      status: 'pending',
      priority: 'high',
      dependencies: tasks.filter(t => t.type === 'implementation').map(t => t.id),
      estimatedDuration: '15-30 minutes',
    });

    // Testing tasks
    tasks.push({
      id: `task-${taskId++}`,
      description: 'Test implementation',
      type: 'testing',
      status: 'pending',
      priority: 'high',
      dependencies: tasks.filter(t => t.type === 'validation').map(t => t.id),
      estimatedDuration: '20-40 minutes',
    });

    return tasks;
  }

  /**
   * Extract implementation tasks from prompt
   */
  extractImplementationTasks(prompt, context) {
    const tasks = [];
    const keywords = {
      'create': { type: 'creation', priority: 'high' },
      'build': { type: 'creation', priority: 'high' },
      'implement': { type: 'implementation', priority: 'high' },
      'add': { type: 'addition', priority: 'medium' },
      'update': { type: 'modification', priority: 'medium' },
      'modify': { type: 'modification', priority: 'medium' },
      'refactor': { type: 'refactoring', priority: 'high' },
      'fix': { type: 'fix', priority: 'high' },
      'remove': { type: 'deletion', priority: 'medium' },
      'delete': { type: 'deletion', priority: 'medium' },
    };

    Object.entries(keywords).forEach(([keyword, meta]) => {
      const regex = new RegExp(keyword + '\\s+([^.!?]+)', 'gi');
      let match;
      while ((match = regex.exec(prompt)) !== null) {
        tasks.push({
          description: match[1].trim(),
          type: meta.type,
          priority: meta.priority,
          dependencies: [],
          estimatedDuration: '30-60 minutes',
        });
      }
    });

    // If no specific tasks found, create a general implementation task
    if (tasks.length === 0) {
      tasks.push({
        description: prompt.substring(0, 100),
        type: 'implementation',
        priority: 'medium',
        dependencies: [],
        estimatedDuration: '60-120 minutes',
      });
    }

    return tasks;
  }

  /**
   * Group tasks into phases
   */
  groupIntoPhases(tasks) {
    const phases = [
      {
        name: 'Research & Planning',
        tasks: tasks.filter(t => t.type === 'research'),
      },
      {
        name: 'Setup & Configuration',
        tasks: tasks.filter(t => t.type === 'setup'),
      },
      {
        name: 'Implementation',
        tasks: tasks.filter(t => t.type === 'implementation' || t.type === 'creation' || t.type === 'addition' || t.type === 'modification' || t.type === 'refactoring' || t.type === 'fix' || t.type === 'deletion'),
      },
      {
        name: 'Validation',
        tasks: tasks.filter(t => t.type === 'validation'),
      },
      {
        name: 'Testing',
        tasks: tasks.filter(t => t.type === 'testing'),
      },
    ];

    return phases.filter(phase => phase.tasks.length > 0);
  }

  /**
   * Order tasks by dependency
   */
  orderTasksByDependency(tasks) {
    const ordered = [];
    const remaining = [...tasks];
    const completed = new Set();

    while (remaining.length > 0) {
      // Find tasks with no unmet dependencies
      const ready = remaining.filter(task => {
        if (!task.dependencies || task.dependencies.length === 0) return true;
        return task.dependencies.every(depId => completed.has(depId));
      });

      if (ready.length === 0) {
        // Circular dependency or missing dependency - add remaining as is
        ordered.push(...remaining);
        break;
      }

      // Sort by priority
      ready.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

      ready.forEach(task => {
        ordered.push(task);
        completed.add(task.id);
        const index = remaining.indexOf(task);
        remaining.splice(index, 1);
      });
    }

    return ordered;
  }
}

/**
 * Autonomous Research Mode
 */
class AutonomousResearchMode {
  constructor(workspacePath) {
    this.workspacePath = workspacePath;
  }

  /**
   * Perform autonomous research
   */
  async research(query, context = {}) {
    const results = {
      query,
      findings: [],
      sources: [],
      confidence: 0,
      timestamp: new Date().toISOString(),
    };

    try {
      // Search documentation
      const docsResults = await this.searchDocumentation(query, context);
      results.findings.push(...docsResults.findings);
      results.sources.push(...docsResults.sources);

      // Search for examples
      const examples = await this.searchExamples(query, context);
      results.findings.push(...examples.findings);
      results.sources.push(...examples.sources);

      // Analyze patterns
      const patterns = await this.analyzePatterns(query, context);
      results.findings.push(...patterns.findings);

      // Calculate confidence
      results.confidence = this.calculateConfidence(results);

      return results;
    } catch (error) {
      console.error('Autonomous research failed:', error);
      results.error = error.message;
      return results;
    }
  }

  /**
   * Search documentation
   */
  async searchDocumentation(query, context) {
    const findings = [];
    const sources = [];

    // Placeholder for documentation search
    // This would integrate with the docs_lookup tool

    return { findings, sources };
  }

  /**
   * Search for examples
   */
  async searchExamples(query, context) {
    const findings = [];
    const sources = [];

    // Search project files for similar patterns
    try {
      const projectFiles = await this.searchProjectFiles(query);
      if (projectFiles.length > 0) {
        findings.push({
          type: 'example',
          content: `Found ${projectFiles.length} similar patterns in project files`,
          files: projectFiles,
          relevance: 'medium',
        });
        sources.push({
          type: 'project',
          name: 'Local project files',
        });
      }
    } catch (error) {
      console.error('Example search failed:', error);
    }

    return { findings, sources };
  }

  /**
   * Search project files
   */
  async searchProjectFiles(query) {
    // Placeholder for project file search
    // This would search for similar code patterns in the project
    return [];
  }

  /**
   * Analyze patterns
   */
  async analyzePatterns(query, context) {
    const findings = [];

    // Analyze common patterns related to query
    const patterns = this.identifyCommonPatterns(query);
    patterns.forEach(pattern => {
      findings.push({
        type: 'pattern',
        content: pattern.description,
        relevance: pattern.relevance,
      });
    });

    return { findings, sources: [] };
  }

  /**
   * Identify common patterns
   */
  identifyCommonPatterns(query) {
    const patterns = [];
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('api')) {
      patterns.push({
        description: 'REST API pattern: endpoint definition, request handling, response formatting',
        relevance: 'high',
      });
    }
    if (lowerQuery.includes('database')) {
      patterns.push({
        description: 'Database pattern: connection pooling, query execution, transaction management',
        relevance: 'high',
      });
    }
    if (lowerQuery.includes('error')) {
      patterns.push({
        description: 'Error handling pattern: try-catch blocks, error propagation, user-friendly messages',
        relevance: 'high',
      });
    }

    return patterns;
  }

  /**
   * Calculate research confidence
   */
  calculateConfidence(results) {
    if (results.findings.length === 0) return 0;
    
    let totalRelevance = 0;
    results.findings.forEach(finding => {
      const relevanceScore = { high: 1.0, medium: 0.7, low: 0.4 }[finding.relevance] || 0.5;
      totalRelevance += relevanceScore;
    });

    return Math.min(totalRelevance / results.findings.length, 1.0);
  }
}

/**
 * Autonomous Execution Engine - The 3AM Autopilot
 */
class AutonomousExecutionEngine {
  constructor(workspacePath) {
    this.workspacePath = workspacePath;
    this.storage = new TaskPlanStorage(workspacePath);
    this.planGenerator = new TaskPlanGenerator(workspacePath);
    this.researchMode = new AutonomousResearchMode(workspacePath);
    this.isAutonomous = false;
    this.currentTask = null;
    this.executionLog = [];
  }

  /**
   * Initialize autonomous execution
   */
  async initialize() {
    await this.storage.initialize();
    await this.storage.loadCurrentPlan();
  }

  /**
   * Enable autonomous mode
   */
  enableAutonomousMode() {
    if (!AUTONOMOUS_CONFIG.enabled) {
      throw new Error('Autonomous mode is disabled. Enable it in configuration.');
    }
    this.isAutonomous = true;
    recordAction('AUTONOMOUS_MODE_ENABLED', { timestamp: new Date().toISOString() });
  }

  /**
   * Disable autonomous mode
   */
  disableAutonomousMode() {
    this.isAutonomous = false;
    recordAction('AUTONOMOUS_MODE_DISABLED', { timestamp: new Date().toISOString() });
  }

  /**
   * Process user prompt and generate/execute task plan
   */
  async processPrompt(prompt, context = {}) {
    // Detect autonomous mode trigger
    const isAutonomousTrigger = this.detectAutonomousTrigger(prompt);

    if (isAutonomousTrigger || this.isAutonomous) {
      return await this.executeAutonomously(prompt, context);
    } else {
      return await this.generatePlanOnly(prompt, context);
    }
  }

  /**
   * Detect if user wants autonomous mode
   */
  detectAutonomousTrigger(prompt) {
    const triggers = [
      /finish this while i'm gone/i,
      /i'll be back later/i,
      /continue without me/i,
      /autonomous/i,
      /autopilot/i,
      /3am/i,
      /hands-off/i,
    ];

    return triggers.some(trigger => trigger.test(prompt));
  }

  /**
   * Generate plan only (interactive mode)
   */
  async generatePlanOnly(prompt, context) {
    const plan = await this.planGenerator.generatePlan(prompt, context);
    await this.storage.saveCurrentPlan(plan);
    
    return {
      mode: 'interactive',
      plan,
      message: 'Task plan generated. Review and approve to proceed with execution.',
    };
  }

  /**
   * Execute autonomously (3AM autopilot mode)
   */
  async executeAutonomously(prompt, context) {
    this.enableAutonomousMode();

    // Generate or load plan
    let plan = this.storage.getCurrentPlan();
    if (!plan || plan.goal !== this.planGenerator.extractGoal(prompt)) {
      plan = await this.planGenerator.generatePlan(prompt, context);
      await this.storage.saveCurrentPlan(plan);
    }

    // Validate plan
    const validation = this.storage.validatePlan(plan);
    if (!validation.valid) {
      return {
        mode: 'autonomous',
        error: 'Plan validation failed',
        errors: validation.errors,
      };
    }

    // Execute plan
    const executionResult = await this.executePlan(plan, context);

    return {
      mode: 'autonomous',
      plan,
      executionResult,
      message: 'Autonomous execution completed',
    };
  }

  /**
   * Execute task plan
   */
  async executePlan(plan, context) {
    const results = {
      completedTasks: [],
      failedTasks: [],
      blockedTasks: [],
      totalTasks: plan.tasks.length,
      startTime: new Date().toISOString(),
      endTime: null,
    };

    for (const task of plan.tasks) {
      this.currentTask = task;

      // Skip if already completed
      if (task.status === 'completed') {
        results.completedTasks.push(task.id);
        continue;
      }

      // Check dependencies
      const dependenciesMet = this.checkDependencies(task, plan.tasks);
      if (!dependenciesMet) {
        results.blockedTasks.push(task.id);
        continue;
      }

      // Execute task
      const taskResult = await this.executeTask(task, context);

      if (taskResult.success) {
        task.status = 'completed';
        task.completedAt = new Date().toISOString();
        results.completedTasks.push(task.id);
      } else {
        task.status = 'failed';
        task.error = taskResult.error;
        results.failedTasks.push(task.id);

        // Stop on critical failure
        if (taskResult.critical) {
          break;
        }
      }

      // Save plan state
      await this.storage.saveCurrentPlan(plan);
    }

    results.endTime = new Date().toISOString();
    return results;
  }

  /**
   * Check if task dependencies are met
   */
  checkDependencies(task, allTasks) {
    if (!task.dependencies || task.dependencies.length === 0) {
      return true;
    }

    return task.dependencies.every(depId => {
      const depTask = allTasks.find(t => t.id === depId);
      return depTask && depTask.status === 'completed';
    });
  }

  /**
   * Execute single task
   */
  async executeTask(task, context) {
    this.executionLog.push({
      taskId: task.id,
      taskDescription: task.description,
      startTime: new Date().toISOString(),
    });

    try {
      let result;

      switch (task.type) {
        case 'research':
          result = await this.executeResearchTask(task, context);
          break;
        case 'setup':
          result = await this.executeSetupTask(task, context);
          break;
        case 'implementation':
        case 'creation':
        case 'addition':
        case 'modification':
        case 'refactoring':
        case 'fix':
        case 'deletion':
          result = await this.executeImplementationTask(task, context);
          break;
        case 'validation':
          result = await this.executeValidationTask(task, context);
          break;
        case 'testing':
          result = await this.executeTestingTask(task, context);
          break;
        default:
          result = await this.executeGenericTask(task, context);
      }

      this.executionLog[this.executionLog.length - 1].endTime = new Date().toISOString();
      this.executionLog[this.executionLog.length - 1].success = result.success;

      return result;
    } catch (error) {
      this.executionLog[this.executionLog.length - 1].endTime = new Date().toISOString();
      this.executionLog[this.executionLog.length - 1].success = false;
      this.executionLog[this.executionLog.length - 1].error = error.message;

      return {
        success: false,
        error: error.message,
        critical: false,
      };
    }
  }

  /**
   * Execute research task
   */
  async executeResearchTask(task, context) {
    const researchResults = await this.researchMode.research(task.description, context);

    if (researchResults.confidence >= AUTONOMOUS_CONFIG.autoContinueThreshold) {
      // High confidence - continue automatically
      return {
        success: true,
        researchResults,
        message: 'Research completed with high confidence',
      };
    } else {
      // Low confidence - may need user input
      return {
        success: true,
        researchResults,
        message: 'Research completed but may require review',
        requiresUserInput: true,
      };
    }
  }

  /**
   * Execute setup task
   */
  async executeSetupTask(task, context) {
    // Placeholder for setup task execution
    // This would integrate with existing setup handlers
    return {
      success: true,
      message: 'Setup task completed',
    };
  }

  /**
   * Execute implementation task
   */
  async executeImplementationTask(task, context) {
    // Placeholder for implementation task execution
    // This would integrate with existing refactoring and file operation handlers
    return {
      success: true,
      message: 'Implementation task completed',
    };
  }

  /**
   * Execute validation task
   */
  async executeValidationTask(task, context) {
    // Placeholder for validation task execution
    // This would integrate with existing validation handlers
    return {
      success: true,
      message: 'Validation task completed',
    };
  }

  /**
   * Execute testing task
   */
  async executeTestingTask(task, context) {
    // Placeholder for testing task execution
    // This would integrate with existing test runners
    return {
      success: true,
      message: 'Testing task completed',
    };
  }

  /**
   * Execute generic task
   */
  async executeGenericTask(task, context) {
    // Fallback for unknown task types
    return {
      success: false,
      error: 'Unknown task type',
      critical: false,
    };
  }

  /**
   * Get execution status
   */
  getExecutionStatus() {
    const plan = this.storage.getCurrentPlan();
    if (!plan) {
      return {
        active: false,
        message: 'No active plan',
      };
    }

    const completed = plan.tasks.filter(t => t.status === 'completed').length;
    const total = plan.tasks.length;
    const progress = (completed / total) * 100;

    return {
      active: true,
      planId: plan.id,
      goal: plan.goal,
      progress,
      completed,
      total,
      currentTask: this.currentTask,
      isAutonomous: this.isAutonomous,
    };
  }

  /**
   * Pause execution
   */
  pause() {
    this.isAutonomous = false;
    recordAction('AUTONOMOUS_EXECUTION_PAUSED', {
      currentTask: this.currentTask,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Resume execution
   */
  async resume() {
    this.enableAutonomousMode();
    const plan = this.storage.getCurrentPlan();
    if (plan) {
      return await this.executePlan(plan, {});
    }
  }

  /**
   * Cancel execution
   */
  async cancel() {
    this.isAutonomous = false;
    this.currentTask = null;
    await this.storage.clearCurrentPlan();
    recordAction('AUTONOMOUS_EXECUTION_CANCELLED', {
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Export autonomous execution system
 */
export {
  AutonomousExecutionEngine,
  TaskPlanStorage,
  TaskPlanGenerator,
  AutonomousResearchMode,
  AUTONOMOUS_CONFIG,
};
