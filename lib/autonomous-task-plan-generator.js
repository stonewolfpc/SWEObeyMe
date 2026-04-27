/**
 * TaskPlanGenerator — Breaks long prompts into ordered, atomic tasks.
 */

export class TaskPlanGenerator {
  constructor(workspacePath) {
    this.workspacePath = workspacePath;
  }

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

    const analysis = this.analyzePrompt(prompt, context);
    plan.metadata.complexity = analysis.complexity;
    plan.metadata.risks = analysis.risks;
    plan.metadata.prerequisites = analysis.prerequisites;
    plan.metadata.missingInformation = analysis.missingInformation;
    plan.tasks = this.generateAtomicTasks(prompt, analysis, context);
    plan.phases = this.groupIntoPhases(plan.tasks);
    plan.tasks = this.orderTasksByDependency(plan.tasks);
    return plan;
  }

  extractGoal(prompt) {
    const sentences = prompt.split(/[.!?]+/);
    const firstSentence = sentences[0]?.trim() || prompt.substring(0, 100);
    return firstSentence;
  }

  analyzePrompt(prompt, context) {
    const analysis = {
      complexity: 'medium',
      risks: [],
      prerequisites: [],
      missingInformation: [],
    };

    const complexityIndicators = [
      { pattern: /build|create|implement|develop/gi, weight: 1 },
      { pattern: /refactor|restructure|reorganize/gi, weight: 2 },
      { pattern: /integration|connect|combine/gi, weight: 2 },
      { pattern: /api|database|backend|frontend/gi, weight: 1 },
      { pattern: /test|validate|verify/gi, weight: 1 },
      { pattern: /optimize|improve|enhance/gi, weight: 1 },
    ];

    let complexityScore = 0;
    complexityIndicators.forEach((indicator) => {
      const matches = prompt.match(indicator.pattern);
      if (matches) complexityScore += matches.length * indicator.weight;
    });

    if (complexityScore > 10) analysis.complexity = 'high';
    else if (complexityScore < 3) analysis.complexity = 'low';

    if (prompt.includes('delete') || prompt.includes('remove')) {
      analysis.risks.push('Data loss risk - backup recommended');
    }
    if (prompt.includes('rewrite') || prompt.includes('replace')) {
      analysis.risks.push('Breaking changes risk - version control recommended');
    }
    if (prompt.includes('api') || prompt.includes('integration')) {
      analysis.risks.push('Integration complexity - API compatibility verification needed');
    }
    if (prompt.includes('database')) analysis.prerequisites.push('Database connection and schema');
    if (prompt.includes('api')) analysis.prerequisites.push('API documentation and endpoints');
    if (prompt.includes('test')) analysis.prerequisites.push('Test framework setup');
    if (!context.projectType) analysis.missingInformation.push('Project type not specified');
    if (!context.framework) analysis.missingInformation.push('Framework not specified');

    return analysis;
  }

  generateAtomicTasks(prompt, analysis, context) {
    const tasks = [];
    let taskId = 1;

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

    analysis.prerequisites.forEach((prereq) => {
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

    const implementationTasks = this.extractImplementationTasks(prompt, context);
    implementationTasks.forEach((implTask) => {
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

    tasks.push({
      id: `task-${taskId++}`,
      description: 'Validate implementation against requirements',
      type: 'validation',
      status: 'pending',
      priority: 'high',
      dependencies: tasks.filter((t) => t.type === 'implementation').map((t) => t.id),
      estimatedDuration: '15-30 minutes',
    });

    tasks.push({
      id: `task-${taskId++}`,
      description: 'Test implementation',
      type: 'testing',
      status: 'pending',
      priority: 'high',
      dependencies: tasks.filter((t) => t.type === 'validation').map((t) => t.id),
      estimatedDuration: '20-40 minutes',
    });

    return tasks;
  }

  extractImplementationTasks(prompt, _context) {
    const tasks = [];
    const keywords = {
      create: { type: 'creation', priority: 'high' },
      build: { type: 'creation', priority: 'high' },
      implement: { type: 'implementation', priority: 'high' },
      add: { type: 'addition', priority: 'medium' },
      update: { type: 'modification', priority: 'medium' },
      modify: { type: 'modification', priority: 'medium' },
      refactor: { type: 'refactoring', priority: 'high' },
      fix: { type: 'fix', priority: 'high' },
      remove: { type: 'deletion', priority: 'medium' },
      delete: { type: 'deletion', priority: 'medium' },
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

  groupIntoPhases(tasks) {
    const phases = [
      { name: 'Research & Planning', tasks: tasks.filter((t) => t.type === 'research') },
      { name: 'Setup & Configuration', tasks: tasks.filter((t) => t.type === 'setup') },
      {
        name: 'Implementation',
        tasks: tasks.filter((t) =>
          ['implementation', 'creation', 'addition', 'modification', 'refactoring', 'fix', 'deletion'].includes(t.type)
        ),
      },
      { name: 'Validation', tasks: tasks.filter((t) => t.type === 'validation') },
      { name: 'Testing', tasks: tasks.filter((t) => t.type === 'testing') },
    ];
    return phases.filter((phase) => phase.tasks.length > 0);
  }

  orderTasksByDependency(tasks) {
    const ordered = [];
    const remaining = [...tasks];
    const completed = new Set();

    while (remaining.length > 0) {
      const ready = remaining.filter((task) => {
        if (!task.dependencies || task.dependencies.length === 0) return true;
        return task.dependencies.every((depId) => completed.has(depId));
      });

      if (ready.length === 0) {
        ordered.push(...remaining);
        break;
      }

      ready.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

      ready.forEach((task) => {
        ordered.push(task);
        completed.add(task.id);
        remaining.splice(remaining.indexOf(task), 1);
      });
    }

    return ordered;
  }
}
