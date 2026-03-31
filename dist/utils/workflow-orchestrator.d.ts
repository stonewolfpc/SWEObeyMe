import { PatchValidationResult } from '../types/patch-validation.js';
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
export declare class WorkflowOrchestrator {
    private projectMapper;
    private contextMemory;
    private promptEnforcer;
    private correctionEngine;
    private patchValidator;
    private agentPlanner;
    private predictionEngine;
    private refactorEngine;
    constructor();
    /**
     * Run a task with automatic correction loop
     *
     * @param task - Task description
     * @param filePath - Target file path
     * @param maxRetries - Maximum number of retry attempts
     * @returns Task execution result with correction history
     */
    runTaskWithCorrections(task: string, filePath: string, maxRetries?: number): Promise<{
        success: boolean;
        finalPatch: string;
        validation: PatchValidationResult;
        attempts: number;
        correctionHistory: Array<{
            attempt: number;
            patch: string;
            validation: PatchValidationResult;
            success: boolean;
            error?: string;
        }>;
        applied: boolean;
        backupPath?: string;
    }>;
    /**
     * Run a task using the multi-agent planning system
     *
     * @param task - Task description to execute
     * @returns Complete multi-agent execution result
     */
    runMultiAgentTask(task: string): Promise<any>;
    /**
     * Run a task using the autonomous multi-file refactor system
     *
     * @param task - Refactor task description to execute
     * @returns Complete refactor result
     */
    runRefactorTask(task: string): Promise<any>;
    /**
     * Get predictions for a task
     *
     * @param task - Task description to predict for
     * @returns Prediction result with actions and confidence
     */
    getPredictions(task: string): Promise<any>;
    /**
     * Apply patch safely with backup and rollback
     *
     * @param filePath - Target file path
     * @param patchedContent - Patched content to apply
     * @returns Apply result
     */
    applyPatchSafely(filePath: string, patchedContent: string): Promise<{
        success: boolean;
        before: string;
        after: string;
        filePath: string;
        backupPath?: string;
        error?: string;
    }>;
    /**
     * Validate a patch against original content
     *
     * @param originalContent - Original file content
     * @param patchedContent - Patched file content
     * @param filePath - File path for context
     * @returns Validation result
     */
    validatePatch(originalContent: string, patchedContent: string, filePath: string): Promise<PatchValidationResult>;
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
    runCorrectionLoop(originalContent: string, initialPatch: string, filePath: string, task: string, maxRetries: number): Promise<{
        success: boolean;
        finalPatch: string;
        validation: PatchValidationResult;
        attempts: number;
        correctionHistory: Array<{
            attempt: number;
            patch: string;
            validation: PatchValidationResult;
            success: boolean;
            error?: string;
        }>;
        applied: boolean;
        backupPath?: string;
    }>;
    /**
     * Simulate SWE patch generation (MVP implementation)
     */
    private simulateSWEPatchGeneration;
    /**
     * Prepare pre-flight prompt with mandatory pre-flight injection
     */
    private preparePrompt;
    /**
     * Generate unique ID for context tracking
     */
    private generateId;
    /**
     * Get workflow statistics
     */
    getWorkflowStats(): Promise<{
        totalCommands: number;
        totalValidations: number;
        totalFileStates: number;
        lastActivity: number;
    }>;
}
//# sourceMappingURL=workflow-orchestrator.d.ts.map