import { PromptEnforcer } from './prompt-enforcer.js';
import { ProjectMapper } from './project-mapper.js';
import { ContextMemory } from './context-memory.js';
import { PatchValidator } from './patch-validator.js';
import { CorrectionEngine } from './correction-engine.js';
/**
 * Agent Registry
 *
 * Manages registration and retrieval of specialized agents for the
 * multi-agent planning system. Ensures only one agent per role and
 * provides centralized agent management.
 */
export class AgentRegistry {
    agents = new Map();
    metrics = new Map();
    config;
    constructor(config = {
        maxAgentsPerRole: 1,
        defaultTimeout: 30000,
        enableCaching: true,
        enableMetrics: true,
    }) {
        this.config = config;
        this.initializeDefaultAgents();
    }
    /**
     * Register an agent for a specific role
     *
     * @param agent - Agent definition to register
     * @throws Error if agent role already exists
     */
    registerAgent(agent) {
        if (this.agents.has(agent.role)) {
            throw new Error(`Agent with role '${agent.role}' is already registered`);
        }
        this.agents.set(agent.role, agent);
        if (this.config.enableMetrics) {
            this.metrics.set(agent.role, {
                role: agent.role,
                totalExecutions: 0,
                successfulExecutions: 0,
                averageExecutionTime: 0,
                lastExecution: new Date(),
                errorRate: 0,
                performanceScore: 100,
            });
        }
    }
    /**
     * Get agent by role
     *
     * @param role - Agent role to retrieve
     * @returns Agent definition or undefined if not found
     */
    getAgent(role) {
        return this.agents.get(role);
    }
    /**
     * List all registered agents
     *
     * @returns Array of all registered agent definitions
     */
    listAgents() {
        return Array.from(this.agents.values());
    }
    /**
     * Check if agent role is registered
     *
     * @param role - Agent role to check
     * @returns True if agent is registered
     */
    hasAgent(role) {
        return this.agents.has(role);
    }
    /**
     * Get metrics for an agent role
     *
     * @param role - Agent role
     * @returns Agent metrics or undefined if not found
     */
    getMetrics(role) {
        return this.metrics.get(role);
    }
    /**
     * Update metrics after agent execution
     *
     * @param role - Agent role
     * @param output - Agent execution output
     */
    updateMetrics(role, output) {
        if (!this.config.enableMetrics)
            return;
        const metrics = this.metrics.get(role);
        if (!metrics)
            return;
        metrics.totalExecutions++;
        if (output.success) {
            metrics.successfulExecutions++;
        }
        // Update average execution time
        const totalTime = metrics.averageExecutionTime * (metrics.totalExecutions - 1) + output.duration;
        metrics.averageExecutionTime = totalTime / metrics.totalExecutions;
        // Update error rate
        metrics.errorRate = ((metrics.totalExecutions - metrics.successfulExecutions) / metrics.totalExecutions) * 100;
        // Update performance score
        metrics.performanceScore = Math.max(0, 100 - metrics.errorRate - (metrics.averageExecutionTime / 1000));
        metrics.lastExecution = output.timestamp;
    }
    /**
     * Initialize default agents
     */
    initializeDefaultAgents() {
        // Planner Agent
        this.registerAgent({
            name: 'PlannerAgent',
            role: 'planner',
            description: 'Breaks down tasks into executable steps and defines requirements',
            capabilities: ['task-planning', 'dependency-analysis', 'resource-planning'],
            execute: this.createPlannerAgent(),
            configuration: {
                maxExecutionTime: 10000,
                retryAttempts: 2,
                requiredTools: ['project-analyzer'],
                outputFormat: 'agent-plan',
            },
            metadata: {
                version: '1.0.0',
                author: 'ARES MCP Server',
                createdAt: new Date(),
                lastUpdated: new Date(),
            },
        });
        // Coder Agent
        this.registerAgent({
            name: 'CoderAgent',
            role: 'coder',
            description: 'Generates code patches and implementations',
            capabilities: ['code-generation', 'patch-creation', 'file-modification'],
            execute: this.createCoderAgent(),
            configuration: {
                maxExecutionTime: 30000,
                retryAttempts: 3,
                requiredTools: ['prompt-enforcer', 'project-mapper'],
                outputFormat: 'code-patch',
            },
            metadata: {
                version: '1.0.0',
                author: 'ARES MCP Server',
                createdAt: new Date(),
                lastUpdated: new Date(),
            },
        });
        // Validator Agent
        this.registerAgent({
            name: 'ValidatorAgent',
            role: 'validator',
            description: 'Validates code patches for syntax, structure, and correctness',
            capabilities: ['syntax-validation', 'semantic-analysis', 'patch-validation'],
            execute: this.createValidatorAgent(),
            configuration: {
                maxExecutionTime: 15000,
                retryAttempts: 2,
                requiredTools: ['patch-validator'],
                outputFormat: 'validation-result',
            },
            metadata: {
                version: '1.0.0',
                author: 'ARES MCP Server',
                createdAt: new Date(),
                lastUpdated: new Date(),
            },
        });
        // Corrector Agent
        this.registerAgent({
            name: 'CorrectorAgent',
            role: 'corrector',
            description: 'Automatically fixes validation errors in code patches',
            capabilities: ['error-correction', 'patch-refinement', 'auto-fix'],
            execute: this.createCorrectorAgent(),
            configuration: {
                maxExecutionTime: 20000,
                retryAttempts: 3,
                requiredTools: ['correction-engine'],
                outputFormat: 'corrected-patch',
            },
            metadata: {
                version: '1.0.0',
                author: 'ARES MCP Server',
                createdAt: new Date(),
                lastUpdated: new Date(),
            },
        });
        // Reviewer Agent
        this.registerAgent({
            name: 'ReviewerAgent',
            role: 'reviewer',
            description: 'Reviews and summarizes completed tasks and changes',
            capabilities: ['code-review', 'change-summary', 'report-generation'],
            execute: this.createReviewerAgent(),
            configuration: {
                maxExecutionTime: 10000,
                retryAttempts: 1,
                requiredTools: ['context-memory'],
                outputFormat: 'review-report',
            },
            metadata: {
                version: '1.0.0',
                author: 'ARES MCP Server',
                createdAt: new Date(),
                lastUpdated: new Date(),
            },
        });
    }
    /**
     * Create Planner Agent implementation
     */
    createPlannerAgent() {
        return async (context) => {
            const startTime = Date.now();
            try {
                // Analyze the task and break it down into steps
                const taskAnalysis = await this.analyzeTask(context.originalTask);
                // Generate execution plan
                const plan = {
                    id: this.generateId(),
                    task: context.originalTask,
                    steps: taskAnalysis.steps,
                    requiredFiles: taskAnalysis.requiredFiles,
                    expectedOutcomes: taskAnalysis.expectedOutcomes,
                    createdAt: new Date(),
                    estimatedDuration: taskAnalysis.estimatedDuration,
                };
                return {
                    id: this.generateId(),
                    agentRole: 'planner',
                    task: {
                        id: this.generateId(),
                        description: `Plan execution for: ${context.originalTask}`,
                        type: 'planning',
                        priority: 'high',
                        parameters: { originalTask: context.originalTask },
                        requiredContext: ['project-context'],
                        expectedOutput: 'agent-plan',
                        dependencies: [],
                        createdAt: new Date(),
                        estimatedDuration: 5000,
                    },
                    success: true,
                    data: plan,
                    duration: Date.now() - startTime,
                    warnings: [],
                    metadata: {
                        stepsCount: plan.steps.length,
                        complexity: taskAnalysis.complexity,
                    },
                    timestamp: new Date(),
                };
            }
            catch (error) {
                return {
                    id: this.generateId(),
                    agentRole: 'planner',
                    task: {
                        id: this.generateId(),
                        description: context.originalTask,
                        type: 'planning',
                        priority: 'high',
                        parameters: {},
                        requiredContext: [],
                        expectedOutput: 'agent-plan',
                        dependencies: [],
                        createdAt: new Date(),
                        estimatedDuration: 5000,
                    },
                    success: false,
                    data: null,
                    duration: Date.now() - startTime,
                    error: error.message,
                    warnings: [],
                    metadata: {},
                    timestamp: new Date(),
                };
            }
        };
    }
    /**
     * Create Coder Agent implementation
     */
    createCoderAgent() {
        return async (context) => {
            const startTime = Date.now();
            try {
                // Use PromptEnforcer to generate code
                const promptEnforcer = new PromptEnforcer(new ContextMemory(), new ProjectMapper());
                const enforcedPrompt = await promptEnforcer.enforcePrompt(context.originalTask, 'coder_agent', {
                    fileContents: context.fileContents,
                    projectContext: context.projectContext,
                });
                // Simulate code generation (MVP implementation)
                const generatedPatch = await this.simulateCodeGeneration(enforcedPrompt, context);
                return {
                    id: this.generateId(),
                    agentRole: 'coder',
                    task: context.task || {
                        id: this.generateId(),
                        description: context.originalTask,
                        type: 'coding',
                        priority: 'high',
                        parameters: {},
                        requiredContext: ['project-context'],
                        expectedOutput: 'code-patch',
                        dependencies: [],
                        createdAt: new Date(),
                        estimatedDuration: 10000,
                    },
                    success: true,
                    data: {
                        patch: generatedPatch,
                        enforcedPrompt,
                    },
                    duration: Date.now() - startTime,
                    warnings: [],
                    metadata: {
                        patchSize: generatedPatch.length,
                        promptLength: enforcedPrompt.length,
                    },
                    timestamp: new Date(),
                };
            }
            catch (error) {
                return {
                    id: this.generateId(),
                    agentRole: 'coder',
                    task: context.task || {
                        id: this.generateId(),
                        description: context.originalTask,
                        type: 'coding',
                        priority: 'high',
                        parameters: {},
                        requiredContext: [],
                        expectedOutput: 'code-patch',
                        dependencies: [],
                        createdAt: new Date(),
                        estimatedDuration: 10000,
                    },
                    success: false,
                    data: null,
                    duration: Date.now() - startTime,
                    error: error.message,
                    warnings: [],
                    metadata: {},
                    timestamp: new Date(),
                };
            }
        };
    }
    /**
     * Create Validator Agent implementation
     */
    createValidatorAgent() {
        return async (context) => {
            const startTime = Date.now();
            try {
                const patchValidator = new PatchValidator();
                // Get original content and patch from context
                const originalContent = context.fileContents['original'] || '';
                const patchedContent = context.data?.patch || '';
                const validationResult = await patchValidator.validatePatch(originalContent, patchedContent, {
                    filePath: context.parameters?.filePath,
                    options: {
                        allowNamespaceChanges: false,
                        allowStructuralChanges: false,
                        allowNewImports: false,
                        strict: true,
                    },
                });
                return {
                    id: this.generateId(),
                    agentRole: 'validator',
                    task: context.task || {
                        id: this.generateId(),
                        description: 'Validate generated patch',
                        type: 'validation',
                        priority: 'high',
                        parameters: {},
                        requiredContext: ['original-content', 'patch'],
                        expectedOutput: 'validation-result',
                        dependencies: [],
                        createdAt: new Date(),
                        estimatedDuration: 5000,
                    },
                    success: validationResult.valid,
                    data: validationResult,
                    duration: Date.now() - startTime,
                    warnings: [],
                    metadata: {
                        score: validationResult.score,
                        issuesCount: validationResult.totalIssues,
                    },
                    timestamp: new Date(),
                };
            }
            catch (error) {
                return {
                    id: this.generateId(),
                    agentRole: 'validator',
                    task: context.task || {
                        id: this.generateId(),
                        description: 'Validate generated patch',
                        type: 'validation',
                        priority: 'high',
                        parameters: {},
                        requiredContext: [],
                        expectedOutput: 'validation-result',
                        dependencies: [],
                        createdAt: new Date(),
                        estimatedDuration: 5000,
                    },
                    success: false,
                    data: null,
                    duration: Date.now() - startTime,
                    error: error.message,
                    warnings: [],
                    metadata: {},
                    timestamp: new Date(),
                };
            }
        };
    }
    /**
     * Create Corrector Agent implementation
     */
    createCorrectorAgent() {
        return async (context) => {
            const startTime = Date.now();
            try {
                const promptEnforcer = new PromptEnforcer(new ContextMemory(), new ProjectMapper());
                const correctionEngine = new CorrectionEngine(promptEnforcer, new PatchValidator());
                const originalContent = context.fileContents['original'] || '';
                const patchedContent = context.data?.patch || '';
                const validationResult = context.data?.validation;
                if (!validationResult) {
                    throw new Error('No validation result available for correction');
                }
                const correctionResult = await correctionEngine.runCorrectionLoop(originalContent, patchedContent, 3, context.originalTask);
                return {
                    id: this.generateId(),
                    agentRole: 'corrector',
                    task: context.task || {
                        id: this.generateId(),
                        description: 'Correct validation errors in patch',
                        type: 'correction',
                        priority: 'high',
                        parameters: {},
                        requiredContext: ['original-content', 'patch', 'validation-result'],
                        expectedOutput: 'corrected-patch',
                        dependencies: [],
                        createdAt: new Date(),
                        estimatedDuration: 15000,
                    },
                    success: correctionResult.success,
                    data: correctionResult,
                    duration: Date.now() - startTime,
                    warnings: [],
                    metadata: {
                        attempts: correctionResult.attempts,
                        finalScore: correctionResult.finalValidation.score,
                    },
                    timestamp: new Date(),
                };
            }
            catch (error) {
                return {
                    id: this.generateId(),
                    agentRole: 'corrector',
                    task: context.task || {
                        id: this.generateId(),
                        description: 'Correct validation errors in patch',
                        type: 'correction',
                        priority: 'high',
                        parameters: {},
                        requiredContext: [],
                        expectedOutput: 'corrected-patch',
                        dependencies: [],
                        createdAt: new Date(),
                        estimatedDuration: 15000,
                    },
                    success: false,
                    data: null,
                    duration: Date.now() - startTime,
                    error: error.message,
                    warnings: [],
                    metadata: {},
                    timestamp: new Date(),
                };
            }
        };
    }
    /**
     * Create Reviewer Agent implementation
     */
    createReviewerAgent() {
        return async (context) => {
            const startTime = Date.now();
            try {
                // Generate review report from all previous outputs
                const reviewReport = await this.generateReviewReport(context);
                return {
                    id: this.generateId(),
                    agentRole: 'reviewer',
                    task: context.task || {
                        id: this.generateId(),
                        description: 'Review and summarize task execution',
                        type: 'review',
                        priority: 'medium',
                        parameters: {},
                        requiredContext: ['previous-outputs'],
                        expectedOutput: 'review-report',
                        dependencies: [],
                        createdAt: new Date(),
                        estimatedDuration: 5000,
                    },
                    success: true,
                    data: reviewReport,
                    duration: Date.now() - startTime,
                    warnings: [],
                    metadata: {
                        outputsReviewed: context.previousOutputs.length,
                    },
                    timestamp: new Date(),
                };
            }
            catch (error) {
                return {
                    id: this.generateId(),
                    agentRole: 'reviewer',
                    task: context.task || {
                        id: this.generateId(),
                        description: 'Review and summarize task execution',
                        type: 'review',
                        priority: 'medium',
                        parameters: {},
                        requiredContext: [],
                        expectedOutput: 'review-report',
                        dependencies: [],
                        createdAt: new Date(),
                        estimatedDuration: 5000,
                    },
                    success: false,
                    data: null,
                    duration: Date.now() - startTime,
                    error: error.message,
                    warnings: [],
                    metadata: {},
                    timestamp: new Date(),
                };
            }
        };
    }
    /**
     * Analyze task and create execution plan
     */
    async analyzeTask(task) {
        // Simple task analysis for MVP
        const steps = [
            {
                id: this.generateId(),
                stepNumber: 1,
                agentRole: 'coder',
                description: 'Generate code implementation',
                inputRequirements: ['task-description', 'project-context'],
                expectedOutput: 'code-patch',
                dependencies: [],
                estimatedDuration: 10000,
                status: 'pending',
            },
            {
                id: this.generateId(),
                stepNumber: 2,
                agentRole: 'validator',
                description: 'Validate generated code',
                inputRequirements: ['code-patch', 'original-content'],
                expectedOutput: 'validation-result',
                dependencies: [0],
                estimatedDuration: 5000,
                status: 'pending',
            },
        ];
        // Determine complexity based on task description
        const complexity = task.length > 100 ? 'high' : task.length > 50 ? 'medium' : 'low';
        return {
            steps,
            requiredFiles: this.extractFilesFromTask(task),
            expectedOutcomes: ['Validated code patch'],
            complexity,
            estimatedDuration: steps.reduce((sum, step) => sum + step.estimatedDuration, 0),
        };
    }
    /**
     * Simulate code generation (MVP implementation)
     */
    async simulateCodeGeneration(prompt, context) {
        // Simple code generation simulation
        if (context.originalTask.toLowerCase().includes('add method')) {
            return `
// Generated method for: ${context.originalTask}
public generatedMethod(): string {
  return 'Auto-generated method';
}`;
        }
        if (context.originalTask.toLowerCase().includes('fix')) {
            return `
// Fixed code for: ${context.originalTask}
public fixedMethod(): string {
  return 'Fixed method';
}`;
        }
        return `
// Generated code for: ${context.originalTask}
public autoGeneratedField: string = 'auto-generated';`;
    }
    /**
     * Generate review report
     */
    async generateReviewReport(context) {
        const outputs = context.previousOutputs;
        const successfulOutputs = outputs.filter(o => o.success);
        const failedOutputs = outputs.filter(o => !o.success);
        return {
            summary: `Task execution completed with ${successfulOutputs.length}/${outputs.length} successful steps`,
            changes: outputs.map(o => ({
                agent: o.agentRole,
                success: o.success,
                duration: o.duration,
                data: o.data,
            })),
            recommendations: failedOutputs.length > 0 ? [
                'Review failed steps and retry if necessary',
                'Check error messages for troubleshooting',
            ] : [
                'Task completed successfully',
                'Review generated changes for accuracy',
            ],
            success: failedOutputs.length === 0,
        };
    }
    /**
     * Extract file references from task description
     */
    extractFilesFromTask(task) {
        const filePattern = /\b[\w\-./]+\.(ts|js|jsx|tsx)\b/g;
        const matches = task.match(filePattern) || [];
        return [...new Set(matches)];
    }
    /**
     * Generate unique ID
     */
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }
}
//# sourceMappingURL=agent-registry.js.map