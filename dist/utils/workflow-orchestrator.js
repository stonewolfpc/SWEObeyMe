import { ProjectMapper } from './project-mapper.js';
import { ContextMemory } from './context-memory.js';
import { PromptEnforcer } from './prompt-enforcer.js';
import { CorrectionEngine } from './correction-engine.js';
import { PatchValidator } from './patch-validator.js';
import { AgentPlanner } from './agent-planner.js';
import { PredictionEngine } from './prediction-engine.js';
import { RefactorEngine } from './refactor-engine.js';
import * as fs from 'fs-extra';
/**
 * Workflow Orchestrator
 *
 * Orchestrates the complete SWE workflow by integrating:
 * - Project Context (Phase 1)
 * - Context Memory (Phase 2)
 * Patch Validator (Phase 3)
 * - Safe patch application
 * - Multi-agent planning (Phase 7)
 * Predictive coding (Phase 8)
 * Autonomous refactor (Phase 9)
 *
 * Features:
 * - Coordinated multi-agent execution
 * - AST-powered validation
 * - Predictive coding capabilities
 * Autonomous multi-file refactoring
 * Safe atomic patch application
 * Comprehensive error handling and recovery
 */
export class WorkflowOrchestrator {
    projectMapper;
    contextMemory;
    promptEnforcer;
    correctionEngine;
    patchValidator;
    agentPlanner;
    predictionEngine;
    refactorEngine;
    constructor() {
        this.projectMapper = new ProjectMapper();
        this.contextMemory = new ContextMemory();
        this.promptEnforcer = new PromptEnforcer(this.contextMemory, this.projectMapper);
        this.patchValidator = new PatchValidator();
        this.correctionEngine = new CorrectionEngine(this.promptEnforcer, this.patchValidator);
        this.agentPlanner = new AgentPlanner();
        this.predictionEngine = new PredictionEngine();
        this.refactorEngine = new RefactorEngine();
    }
    /**
     * Run a task with automatic correction loop
     *
     * @param task - Task description
     * @param filePath - Target file path
     * @param maxRetries - Maximum number of retry attempts
     * @returns Task execution result with correction history
     */
    async runTaskWithCorrections(task, filePath, maxRetries = 3) {
        console.log(`🚀 Starting task with corrections: ${task}`);
        console.log(`📁 Target file: ${filePath}`);
        console.log(`🔄 Max retries: ${maxRetries}`);
        try {
            // Step 1: Pre-flight prompt assembly
            const prompt = await this.preparePrompt(task);
            console.log(`📝 Prompt prepared (${prompt.length} characters)`);
            // Step 1.5: Get predictions (new predictive enhancement)
            const predictions = await this.getPredictions(task);
            // Store predictions in context memory
            await this.contextMemory.storeContext('command', {
                id: this.generateId(),
                tool: 'prediction_engine',
                arguments: { task },
                result: predictions,
                timestamp: new Date(),
            });
            console.log(`📝 Prompt prepared (${prompt.length} characters)`);
            console.log(`🔮 Predictions generated: ${predictions.actions?.length || 0} actions`);
            // Step 2: Read file content
            const fileContent = await fs.readFile(filePath, 'utf8');
            console.log(`📖 File content loaded (${fileContent.length} characters)`);
            // Step 3: Simulate SWE generating initial patch
            // In a real implementation, this would call the actual SWE model
            const initialPatch = await this.simulateSWEPatchGeneration(prompt, task);
            console.log(`🔧 Initial patch generated (${initialPatch.length} characters)`);
            // Step 4: Validate initial patch
            const validation = await this.validatePatch(fileContent, initialPatch, filePath);
            console.log(`🔍 Initial validation: ${validation.valid ? 'PASSED' : 'FAILED'}`);
            console.log(`   Score: ${validation.score}, Issues: ${validation.totalIssues}`);
            // Step 5: If valid → apply patch safely
            if (validation.valid) {
                console.log(`✅ Initial patch is valid, applying...`);
                const applyResult = await this.applyPatchSafely(filePath, initialPatch);
                return {
                    success: true,
                    finalPatch: applyResult.after,
                    validation,
                    attempts: 1,
                    correctionHistory: [{
                            attempt: 1,
                            patch: initialPatch,
                            validation,
                            success: true,
                        }],
                    applied: applyResult.success,
                    backupPath: applyResult.backupPath,
                };
            }
            // Step 6: If invalid → start correction loop
            return await this.runCorrectionLoop(fileContent, initialPatch, filePath, task, maxRetries);
        }
        catch (error) {
            console.error(`❌ Task execution failed: ${error.message}`);
            return {
                success: false,
                finalPatch: '',
                validation: {
                    valid: false,
                    score: 0,
                    issues: [],
                    totalIssues: 0,
                    issuesBySeverity: { error: 0, warning: 0, info: 0 },
                    duration: 0,
                    recommendations: [],
                    approved: false,
                    summary: `Task failed: ${error.message}`,
                },
                attempts: 0,
                correctionHistory: [],
                applied: false,
            };
        }
    }
    /**
     * Run a task using the multi-agent planning system
     *
     * @param task - Task description to execute
     * @returns Complete multi-agent execution result
     */
    async runMultiAgentTask(task) {
        console.log(`🤖 Starting multi-agent task: ${task}`);
        try {
            const planner = new AgentPlanner();
            const result = await planner.runPlan(task);
            console.log(`✅ Multi-agent task completed`);
            console.log(`   Success: ${result.success}`);
            console.log(`   Steps: ${result.summary.completedSteps}/${result.summary.totalSteps}`);
            console.log(`   Duration: ${result.summary.totalDuration}ms`);
            return result;
        }
        catch (error) {
            console.error(`❌ Multi-agent task failed: ${error.message}`);
            return {
                success: false,
                error: error.message,
                summary: {
                    totalSteps: 0,
                    completedSteps: 0,
                    failedSteps: 0,
                    totalDuration: 0,
                    successRate: 0,
                },
            };
        }
    }
    /**
     * Run a task using the autonomous multi-file refactor system
     *
     * @param task - Refactor task description to execute
     * @returns Complete refactor result
     */
    async runRefactorTask(task) {
        console.log(`🔧 Starting refactor task: ${task}`);
        try {
            const refactorEngine = new RefactorEngine();
            const result = await refactorEngine.run(task);
            console.log(`✅ Refactor task completed`);
            console.log(`   Success: ${result.success}`);
            console.log(`   Total patches: ${result.patches.length}`);
            console.log(`   Applied: ${result.statistics.successfulPatches}`);
            console.log(`   Failed: ${result.statistics.failedPatches}`);
            console.log(`   Duration: ${result.metadata.processingTime}ms`);
            return result;
        }
        catch (error) {
            console.error(`❌ Refactor task failed: ${error.message}`);
            return {
                success: false,
                error: error.message,
                summary: `Refactor failed: ${error.message}`,
                statistics: {
                    totalTargets: 0,
                    successfulPatches: 0,
                    failedPatches: 0,
                    totalLinesChanged: 0,
                    totalFilesChanged: 0,
                    averageConfidence: 0,
                    totalProcessingTime: 0,
                    successRate: 0,
                },
            };
        }
    }
    /**
     * Get predictions for a task
     *
     * @param task - Task description to predict for
     * @returns Prediction result with actions and confidence
     */
    async getPredictions(task) {
        console.log(`🔮 Getting predictions for task: ${task}`);
        try {
            const predictionEngine = new PredictionEngine();
            const result = await predictionEngine.run(task);
            console.log(`✅ Predictions generated: ${result.actions.length} actions`);
            console.log(`   Overall confidence: ${(result.confidence * 100).toFixed(1)}%`);
            return result;
        }
        catch (error) {
            console.error(`❌ Prediction generation failed: ${error.message}`);
            return {
                success: false,
                task,
                actions: [],
                summary: `Prediction failed: ${error.message}`,
                confidence: 0,
                metadata: {
                    timestamp: new Date(),
                    processingTime: 0,
                    analysisDepth: 'medium',
                    totalActions: 0,
                    highConfidenceActions: 0,
                    criticalActions: 0,
                },
                error: error.message,
            };
        }
    }
    /**
     * Apply patch safely with backup and rollback
     *
     * @param filePath - Target file path
     * @param patchedContent - Patched content to apply
     * @returns Apply result
     */
    async applyPatchSafely(filePath, patchedContent) {
        // Create backup if enabled
        let backupPath;
        if (true) { // enableBackup is hardcoded to true for now
            backupPath = `${filePath}.backup.${Date.now()}`;
        }
        try {
            if (backupPath) {
                await fs.copyFile(filePath, backupPath);
            }
            // Write patched content
            await fs.writeFile(filePath, patchedContent, 'utf8');
            // Verify write
            const writtenContent = await fs.readFile(filePath, 'utf8');
            if (writtenContent === patchedContent) {
                return {
                    success: true,
                    before: await fs.readFile(filePath, 'utf8'),
                    after: patchedContent,
                    filePath,
                    backupPath,
                };
            }
            else {
                throw new Error('Write verification failed');
            }
        }
        catch (error) {
            // Try to restore from backup if available
            if (backupPath && await fs.pathExists(backupPath)) {
                try {
                    await fs.copyFile(backupPath, filePath);
                }
                catch (restoreError) {
                    console.error('Failed to restore from backup:', restoreError);
                }
            }
            throw new Error(`Patch application failed: ${error.message}`);
        }
    }
    /**
     * Validate a patch against original content
     *
     * @param originalContent - Original file content
     * @param patchedContent - Patched file content
     * @param filePath - File path for context
     * @returns Validation result
     */
    async validatePatch(originalContent, patchedContent, filePath) {
        try {
            return await this.patchValidator.validatePatch(originalContent, patchedContent, {
                filePath,
                options: {
                    allowNamespaceChanges: false,
                    allowStructuralChanges: false,
                    allowNewImports: false,
                    strict: true,
                },
            });
        }
        catch (error) {
            return {
                valid: false,
                score: 0,
                issues: [],
                totalIssues: 0,
                issuesBySeverity: { error: 0, warning: 0, info: 0 },
                duration: 0,
                recommendations: [],
                approved: false,
                summary: `Validation error: ${error.message}`,
            };
        }
    }
    /**
     * Run correction loop for failed patches
     *
     * @param originalContent - Original file content
     * @param initialPatch - Initial failed patch
     * @param filePath - Target file path
     * @param task - Task description
     * @param maxRetries - Maximum retry attempts
     * @returns Correction result
     */
    async runCorrectionLoop(originalContent, initialPatch, filePath, task, maxRetries) {
        let currentPatch = initialPatch;
        let attempts = 0;
        const correctionHistory = [];
        while (attempts < maxRetries) {
            attempts++;
            console.log(`🔧 Correction attempt ${attempts}/${maxRetries}`);
            try {
                // Generate enforced prompt for correction
                const correctionPrompt = await this.promptEnforcer.enforcePrompt(`Fix validation errors in patch for: ${task}`, 'correction_engine', {
                    originalContent,
                    currentPatch,
                    filePath,
                    task,
                    validation: correctionHistory.length > 0 ? correctionHistory[correctionHistory.length - 1].validation : null,
                });
                // Simulate SWE generating corrected patch
                const correctedPatch = await this.simulateSWEPatchGeneration(correctionPrompt, task);
                // Validate corrected patch
                const validation = await this.validatePatch(originalContent, correctedPatch, filePath);
                correctionHistory.push({
                    attempt: attempts,
                    patch: correctedPatch,
                    validation,
                    success: validation.valid,
                });
                if (validation.valid) {
                    console.log(`✅ Correction successful after ${attempts} attempts`);
                    // Apply corrected patch
                    const applyResult = await this.applyPatchSafely(filePath, correctedPatch);
                    return {
                        success: true,
                        finalPatch: correctedPatch,
                        validation,
                        attempts,
                        correctionHistory,
                        applied: applyResult.success,
                        backupPath: applyResult.backupPath,
                    };
                }
                console.log(`⚠️ Correction attempt ${attempts} failed, score: ${validation.score}`);
            }
            catch (error) {
                console.error(`❌ Correction attempt ${attempts} failed: ${error.message}`);
                correctionHistory.push({
                    attempt: attempts,
                    patch: currentPatch,
                    validation: {
                        valid: false,
                        score: 0,
                        issues: [],
                        totalIssues: 0,
                        issuesBySeverity: { error: 0, warning: 0, info: 0 },
                        duration: 0,
                        recommendations: [],
                        approved: false,
                        summary: `Correction failed: ${error.message}`,
                    },
                    success: false,
                    error: error.message,
                });
                currentPatch = initialPatch;
            }
        }
        return {
            success: false,
            finalPatch: initialPatch,
            validation: {
                valid: false,
                score: 0,
                issues: [],
                totalIssues: 0,
                issuesBySeverity: { error: 0, warning: 0, info: 0 },
                duration: 0,
                recommendations: [],
                approved: false,
                summary: `All ${maxRetries} correction attempts failed`,
            },
            attempts,
            correctionHistory,
            applied: false,
        };
    }
    /**
     * Simulate SWE patch generation (MVP implementation)
     */
    async simulateSWEPatchGeneration(prompt, task) {
        // Simple patch generation simulation
        if (task.toLowerCase().includes('add method')) {
            return `
// Generated method for: ${task}
public generatedMethod(): string {
  return 'Auto-generated method';
}`;
        }
        if (task.toLowerCase().includes('fix')) {
            return `
// Fixed code for: ${task}
public fixedMethod(): string {
  return 'Fixed method';
}`;
        }
        if (task.toLowerCase().includes('refactor')) {
            return `
// Refactored code for: ${task}
public refactoredField: string = 'refactored';
}`;
        }
        // Default: return a simple modification
        return `${prompt}

// Generated modification for: ${task}
public generatedField: string = 'auto-generated';`;
    }
    /**
     * Prepare pre-flight prompt with mandatory pre-flight injection
     */
    async preparePrompt(task) {
        // Load current project and last context
        const projectContext = await this.projectMapper.getProjectContext(process.cwd(), {
            includeTests: false,
            maxDepth: 10,
            cacheKey: 'workflow-orchestrator',
        });
        const lastContext = await this.contextMemory.getContext('last');
        // Assemble enforced prompt
        const enforcedPrompt = `
# SWE-1.5 AUTOMATION TASK

## GLOBAL RULES
- ALWAYS preserve existing functionality
- NEVER break backward compatibility
- Follow TypeScript best practices
- Include proper error handling
- Add comprehensive tests
- Document all changes

## PROJECT CONTEXT
${JSON.stringify(projectContext, null, 2)}

## LAST CONTEXT
${JSON.stringify(lastContext, null, 2)}

## TASK
${task}

## EXECUTION REQUIREMENTS
1. Generate a patch that addresses the task
2. Ensure the patch is syntactically valid TypeScript
3. Maintain existing functionality
4. Add proper error handling
5. Include necessary imports
6. Follow established coding standards

## OUTPUT FORMAT
Provide the complete patched file content - no explanations, no apologies, just the code.
`;
        return enforcedPrompt;
    }
    /**
     * Generate unique ID for context tracking
     */
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }
    /**
     * Get workflow statistics
     */
    async getWorkflowStats() {
        try {
            const allContext = await this.contextMemory.getContext('all');
            return {
                totalCommands: 0,
                totalValidations: 0,
                totalFileStates: 0,
                lastActivity: Date.now(),
            };
        }
        catch (error) {
            console.error('Error getting workflow stats:', error);
            return {
                totalCommands: 0,
                totalValidations: 0,
                totalFileStates: 0,
                lastActivity: 0,
            };
        }
    }
}
//# sourceMappingURL=workflow-orchestrator.js.map