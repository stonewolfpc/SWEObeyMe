import { PatchValidationResult } from '../types/patch-validation.js';
import { PromptEnforcer } from './prompt-enforcer.js';
import { PatchValidator } from './patch-validator.js';
/**
 * Correction Engine
 *
 * Enables autonomous correction of failed patches by analyzing validation
 * errors and generating improved versions through iterative refinement.
 *
 * This engine implements a retry loop that:
 * 1. Validates the initial patch
 * 2. If invalid, generates correction prompts
 * 3. Calls SWE to produce corrected patches
 * 4. Revalidates and repeats until success or retry limit
 */
export declare class CorrectionEngine {
    private promptEnforcer;
    private patchValidator;
    constructor(promptEnforcer: PromptEnforcer, patchValidator: PatchValidator);
    /**
     * Generate a correction prompt based on validation errors
     *
     * @param validationResult - The validation result showing errors
     * @param originalPatch - The original patch that failed
     * @param fileContent - The original file content
     * @param taskDescription - The original task description
     * @returns Correction prompt for SWE
     */
    generateCorrectionPrompt(validationResult: PatchValidationResult, originalPatch: string, fileContent: string, taskDescription: string): Promise<string>;
    /**
     * Attempt to correct a patch by calling SWE with correction prompt
     *
     * @param taskContext - Context for the correction attempt
     * @returns Correction attempt result
     */
    attemptCorrection(taskContext: {
        validationResult: PatchValidationResult;
        originalPatch: string;
        fileContent: string;
        taskDescription: string;
        attemptNumber: number;
    }): Promise<{
        correctedPatch: string;
        success: boolean;
        validation: PatchValidationResult;
        error?: string;
    }>;
    /**
     * Run the complete correction loop
     *
     * @param originalContent - Original file content
     * @param initialPatch - Initial patch that failed validation
     * @param maxRetries - Maximum number of correction attempts
     * @param taskDescription - Original task description
     * @returns Final correction result
     */
    runCorrectionLoop(originalContent: string, initialPatch: string, maxRetries?: number, taskDescription?: string): Promise<{
        finalPatch: string;
        finalValidation: PatchValidationResult;
        attempts: number;
        success: boolean;
        correctionHistory: Array<{
            attempt: number;
            success: boolean;
            issues: number;
            score: number;
            error?: string;
        }>;
    }>;
    /**
     * Build a summary of validation errors
     */
    private buildErrorSummary;
    /**
     * Build specific correction instructions based on issue types
     */
    private buildCorrectionInstructions;
    /**
     * Simulate SWE correction (MVP implementation)
     * In a real implementation, this would call the actual SWE model
     */
    private simulateSWECorrection;
    /**
     * Get correction engine statistics
     */
    getCorrectionStats(): {
        totalCorrections: number;
        successRate: number;
        averageAttempts: number;
    };
}
//# sourceMappingURL=correction-engine.d.ts.map