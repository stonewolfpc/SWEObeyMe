import { AgentRegistry } from './agent-registry.js';
import { WorkflowOrchestrator } from './workflow-orchestrator.js';
import { ProjectMapper } from './project-mapper.js';
import { ContextMemory } from './context-memory.js';
import { PromptEnforcer } from './prompt-enforcer.js';
import * as fs from 'fs-extra';
/**
 * Agent Planner
 *
 * Coordinates the execution of specialized agents to complete complex
 * software engineering tasks through a structured planning and execution
 * workflow.
 */
export class AgentPlanner {
    registry;
    orchestrator;
    projectMapper;
    contextMemory;
    promptEnforcer;
    constructor() {
        this.registry = new AgentRegistry();
        this.projectMapper = new ProjectMapper();
        this.contextMemory = new ContextMemory();
        this.promptEnforcer = new PromptEnforcer(this.contextMemory, this.projectMapper);
        this.orchestrator = new WorkflowOrchestrator();
    }
    /**
     * Plan a task by breaking it down into executable steps
     *
     * @param task - Task description to plan
     * @returns Execution plan with steps, required files, and expected outcomes
     */
    async planTask(task) {
        console.log(`📋 Planning task: ${task}`);
        try {
            // Create agent context for planning
            const context = await this.createAgentContext(task);
            // Get planner agent
            const plannerAgent = this.registry.getAgent('planner');
            if (!plannerAgent) {
                throw new Error('Planner agent not found');
            }
            // Execute planning
            const output = await plannerAgent.execute(context);
            if (!output.success || !output.data) {
                throw new Error(`Planning failed: ${output.error}`);
            }
            const plan = output.data;
            console.log(`✅ Planning completed: ${plan.steps.length} steps planned`);
            return plan;
        }
        catch (error) {
            console.error(`❌ Planning failed: ${error.message}`);
            throw error;
        }
    }
    /**
     * Execute a single step in the plan
     *
     * @param step - Plan step to execute
     * @param context - Agent execution context
     * @returns Step execution result
     */
    async executeStep(step, context) {
        console.log(`🔧 Executing step ${step.stepNumber}: ${step.description}`);
        try {
            let finalPatch = '';
            let validation = null;
            let success = false;
            let applied = false;
            // Step 1: Generate patch (Coder Agent)
            if (step.agentRole === 'coder') {
                const coderAgent = this.registry.getAgent('coder');
                if (!coderAgent) {
                    throw new Error('Coder agent not found');
                }
                const coderOutput = await coderAgent.execute(context);
                if (!coderOutput.success || !coderOutput.data?.patch) {
                    throw new Error(`Code generation failed: ${coderOutput.error}`);
                }
                finalPatch = coderOutput.data.patch;
                console.log(`✅ Code generated (${finalPatch.length} characters)`);
                // Step 2: Validate patch (Validator Agent)
                const validatorAgent = this.registry.getAgent('validator');
                if (!validatorAgent) {
                    throw new Error('Validator agent not found');
                }
                const validatorContext = {
                    ...context,
                    data: { patch: finalPatch },
                    fileContents: {
                        ...context.fileContents,
                        original: context.fileContents.original || '',
                        patch: finalPatch,
                    },
                    previousOutputs: [...context.previousOutputs, coderOutput],
                };
                const validatorOutput = await validatorAgent.execute(validatorContext);
                validation = validatorOutput.data;
                if (!validatorOutput.success) {
                    throw new Error(`Validation failed: ${validatorOutput.error}`);
                }
                console.log(`🔍 Validation completed: ${validation.valid ? 'PASSED' : 'FAILED'}`);
                console.log(`   Score: ${validation.score}, Issues: ${validation.totalIssues}`);
                // Step 3: Correct if invalid (Corrector Agent)
                if (!validation.valid) {
                    console.log(`🔧 Validation failed, attempting correction...`);
                    const correctorAgent = this.registry.getAgent('corrector');
                    if (!correctorAgent) {
                        throw new Error('Corrector agent not found');
                    }
                    const correctorContext = {
                        ...context,
                        data: {
                            patch: finalPatch,
                            validation: validation
                        },
                        fileContents: {
                            ...context.fileContents,
                            original: context.fileContents.original || '',
                            patch: finalPatch,
                        },
                        previousOutputs: [...context.previousOutputs, coderOutput, validatorOutput],
                    };
                    const correctorOutput = await correctorAgent.execute(correctorContext);
                    if (!correctorOutput.success) {
                        console.log(`❌ Correction failed after ${correctorOutput.data?.attempts || 0} attempts`);
                    }
                    else {
                        finalPatch = correctorOutput.data.finalPatch;
                        validation = correctorOutput.data.finalValidation;
                        console.log(`✅ Correction successful: ${validation.valid ? 'PASSED' : 'FAILED'}`);
                        console.log(`   Final score: ${validation.score}, Issues: ${validation.totalIssues}`);
                    }
                }
                success = validation.valid;
                // Step 4: Apply patch if validation passed
                if (success && context.parameters?.filePath) {
                    console.log(`🔧 Applying patch to ${context.parameters.filePath}...`);
                    const applyResult = await this.orchestrator.applyPatchSafely(context.parameters.filePath, finalPatch);
                    applied = applyResult.success;
                    if (applied) {
                        console.log(`✅ Patch applied successfully`);
                    }
                    else {
                        console.log(`❌ Patch application failed: ${applyResult.error}`);
                    }
                }
                return {
                    finalPatch,
                    validation,
                    success,
                    applied,
                    stepResult: {
                        ...coderOutput,
                        data: {
                            ...coderOutput.data,
                            validation,
                            applied,
                        },
                    },
                };
            }
            // Handle other agent types
            const agent = this.registry.getAgent(step.agentRole);
            if (!agent) {
                throw new Error(`Agent not found for role: ${step.agentRole}`);
            }
            const output = await agent.execute(context);
            return {
                finalPatch: '',
                validation: null,
                success: output.success,
                applied: false,
                stepResult: output,
            };
        }
        catch (error) {
            console.error(`❌ Step execution failed: ${error.message}`);
            return {
                finalPatch: '',
                validation: null,
                success: false,
                applied: false,
                stepResult: {
                    id: this.generateId(),
                    agentRole: step.agentRole,
                    task: context.task || {
                        id: this.generateId(),
                        description: step.description,
                        type: 'execution',
                        priority: 'high',
                        parameters: {},
                        requiredContext: [],
                        expectedOutput: step.expectedOutput,
                        dependencies: [],
                        createdAt: new Date(),
                        estimatedDuration: step.estimatedDuration,
                    },
                    success: false,
                    data: null,
                    duration: 0,
                    error: error.message,
                    warnings: [],
                    metadata: {},
                    timestamp: new Date(),
                },
            };
        }
    }
    /**
     * Run the complete plan from start to finish
     *
     * @param task - Task description to execute
     * @returns Complete execution result with review
     */
    async runPlan(task) {
        console.log(`🚀 Starting multi-agent execution for: ${task}`);
        const startTime = Date.now();
        const executionId = this.generateId();
        try {
            // Step 1: Plan the task
            const plan = await this.planTask(task);
            // Step 2: Execute each step
            const stepResults = [];
            const appliedChanges = [];
            let completedSteps = 0;
            let failedSteps = 0;
            for (const step of plan.steps) {
                console.log(`\n📍 Step ${step.stepNumber}/${plan.steps.length}: ${step.description}`);
                // Create context for this step
                const context = await this.createAgentContext(task, step, stepResults);
                // Execute the step
                const stepResult = await this.executeStep(step, context);
                stepResults.push(stepResult.stepResult);
                // Update metrics
                this.registry.updateMetrics(step.agentRole, stepResult.stepResult);
                if (stepResult.success) {
                    completedSteps++;
                    // Track applied changes
                    if (stepResult.applied && context.parameters?.filePath) {
                        appliedChanges.push({
                            filePath: context.parameters.filePath,
                            changeType: 'update',
                            success: true,
                            backupPath: stepResult.stepResult.data?.backupPath,
                        });
                    }
                    // Update step status
                    step.status = 'completed';
                    step.result = stepResult.stepResult;
                    step.executedAt = new Date();
                }
                else {
                    failedSteps++;
                    // Update step status
                    step.status = 'failed';
                    step.result = stepResult.stepResult;
                    step.executedAt = new Date();
                    console.log(`⚠️ Step failed, stopping execution`);
                    break;
                }
            }
            // Step 3: Generate final review
            console.log(`\n📝 Generating final review...`);
            const reviewerAgent = this.registry.getAgent('reviewer');
            if (!reviewerAgent) {
                throw new Error('Reviewer agent not found');
            }
            const reviewContext = await this.createAgentContext(task, undefined, stepResults);
            const reviewOutput = await reviewerAgent.execute(reviewContext);
            if (!reviewOutput.success) {
                console.warn(`⚠️ Review generation failed: ${reviewOutput.error}`);
            }
            const endTime = Date.now();
            // Step 4: Create execution result
            const result = {
                id: executionId,
                task,
                plan,
                success: failedSteps === 0,
                stepResults,
                reviewOutput: reviewOutput.success ? reviewOutput : undefined,
                summary: {
                    totalSteps: plan.steps.length,
                    completedSteps,
                    failedSteps,
                    totalDuration: endTime - startTime,
                    successRate: (completedSteps / plan.steps.length) * 100,
                },
                appliedChanges,
                executedAt: new Date(),
            };
            console.log(`\n🎉 Multi-agent execution completed:`);
            console.log(`   Success: ${result.success}`);
            console.log(`   Steps completed: ${result.summary.completedSteps}/${result.summary.totalSteps}`);
            console.log(`   Success rate: ${result.summary.successRate.toFixed(1)}%`);
            console.log(`   Total duration: ${result.summary.totalDuration}ms`);
            console.log(`   Changes applied: ${result.appliedChanges.length}`);
            return result;
        }
        catch (error) {
            console.error(`❌ Multi-agent execution failed: ${error.message}`);
            return {
                id: executionId,
                task,
                plan: {
                    id: this.generateId(),
                    task,
                    steps: [],
                    requiredFiles: [],
                    expectedOutcomes: [],
                    createdAt: new Date(),
                    estimatedDuration: 0,
                },
                success: false,
                stepResults: [],
                summary: {
                    totalSteps: 0,
                    completedSteps: 0,
                    failedSteps: 0,
                    totalDuration: Date.now() - startTime,
                    successRate: 0,
                },
                appliedChanges: [],
                executedAt: new Date(),
                error: error.message,
            };
        }
    }
    /**
     * Create agent context for execution
     */
    async createAgentContext(task, step, previousOutputs = []) {
        // Load project context
        const projectContext = await this.projectMapper.getProjectContext(process.cwd(), {
            includeTests: false,
            maxDepth: 10,
            cacheKey: 'agent-planner',
        });
        // Load file contents for relevant files
        const fileContents = {};
        if (step?.agentRole === 'coder' || step?.agentRole === 'validator') {
            // Load original file content if specified
            const filePath = step?.inputRequirements.find(req => req.includes('original-content'));
            if (filePath && typeof filePath === 'string') {
                try {
                    fileContents['original'] = await fs.readFile(filePath, 'utf8');
                }
                catch (error) {
                    console.warn(`Could not read file ${filePath}: ${error}`);
                }
            }
        }
        return {
            id: this.generateId(),
            originalTask: task,
            task: step ? {
                id: this.generateId(),
                description: step.description,
                type: step.agentRole,
                priority: 'high',
                parameters: step?.inputRequirements.includes('file-path') ? {
                    filePath: step?.inputRequirements.find(req => req.includes('file-path'))
                } : {},
                requiredContext: step?.inputRequirements || [],
                expectedOutput: step?.expectedOutput,
                dependencies: step?.dependencies || [],
                createdAt: new Date(),
                estimatedDuration: step?.estimatedDuration || 10000,
            } : undefined,
            workingDirectory: process.cwd(),
            projectContext,
            fileContents,
            previousOutputs,
            data: {},
            parameters: {},
            configuration: {
                maxExecutionTime: 30000,
                enableValidation: true,
                enableCorrection: true,
            },
            session: {
                id: this.generateId(),
                startTime: new Date(),
            },
            availableTools: ['planner', 'coder', 'validator', 'corrector', 'reviewer'],
            constraints: {
                maxExecutionTime: 60000,
                maxFileSize: 1024 * 1024, // 1MB
                allowedFileTypes: ['.ts', '.js', '.jsx', '.tsx'],
                restrictedPaths: ['node_modules', '.git'],
            },
        };
    }
    /**
     * Generate unique ID
     */
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }
    /**
     * Get registry statistics
     */
    getRegistryStats() {
        const agents = this.registry.listAgents();
        const agentsByRole = {};
        for (const agent of agents) {
            agentsByRole[agent.role] = agent.name;
        }
        const metrics = {};
        for (const role of Object.values(agentsByRole)) {
            const agentMetrics = this.registry.getMetrics(role);
            if (agentMetrics) {
                metrics[role] = agentMetrics;
            }
        }
        return {
            totalAgents: agents.length,
            agentsByRole,
            metrics,
        };
    }
}
//# sourceMappingURL=agent-planner.js.map