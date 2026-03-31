import { RefactorPlan, RefactorPatch, RefactorResult, RefactorEngineConfig, RefactorMetrics } from '../types/refactor-types.js';
/**
 * Autonomous Multi-File Refactor Engine
 *
 * Enables SWEObeyMe to analyze entire project structure, detect cross-file issues,
 * generate coordinated multi-file patches, validate each patch, apply changes safely,
 * and maintain architectural integrity.
 */
export declare class RefactorEngine {
    private config;
    private metrics;
    private projectMapper;
    private contextMemory;
    private predictionEngine;
    private astValidator;
    private patchValidator;
    private correctionEngine;
    private promptEnforcer;
    constructor(config?: RefactorEngineConfig);
    /**
     * Analyze entire project structure and identify refactoring targets
     *
     * @param task - Refactor task description
     * @returns Complete refactor plan with targets and metadata
     */
    analyzeProject(task: string): Promise<RefactorPlan>;
    /**
     * Generate coordinated multi-file patches based on refactor plan
     *
     * @param refactorPlan - Refactor plan with targets
     * @returns Array of refactor patches
     */
    generatePatches(refactorPlan: RefactorPlan): Promise<RefactorPatch[]>;
    /**
     * Apply patches safely with validation and rollback
     *
     * @param patches - Array of patches to apply
     * @returns Complete refactor result
     */
    applyPatchesSafely(patches: RefactorPatch[]): Promise<RefactorResult>;
    /**
     * Run complete refactor workflow
     *
     * @param task - Refactor task description
     * @returns Complete refactor result
     */
    run(task: string): Promise<RefactorResult>;
    /**
     * Create refactor context for analysis
     */
    private createRefactorContext;
    /**
     * Identify refactor targets based on analysis
     */
    private identifyRefactorTargets;
    /**
     * Prioritize and filter targets
     */
    private prioritizeTargets;
    /**
     * Calculate overall confidence
     */
    private calculateOverallConfidence;
    /**
     * Calculate overall impact
     */
    private calculateOverallImpact;
    /**
     * Calculate overall risk
     */
    private calculateOverallRisk;
    /**
     * Generate plan description
     */
    private generatePlanDescription;
    /**
     * Generate expected outcomes
     */
    private generateExpectedOutcomes;
    /**
     * Identify risks
     */
    private identifyRisks;
    /**
     * Generate success criteria
     */
    private generateSuccessCriteria;
    /**
     * Generate rollback strategy
     */
    private generateRollbackStrategy;
    /**
     * Generate patch for a specific target
     */
    private generatePatchForTarget;
    /**
     * Generate refactor prompt for SWE
     */
    private generateRefactorPrompt;
    /**
     * Simulate SWE patch generation (MVP implementation)
     */
    private simulateSWEPatchGeneration;
    /**
     * Validate patch content
     */
    private validatePatchContent;
    private applyPatchDirectly;
    /**
     * Sort patches by dependencies
     */
    private sortPatchesByDependencies;
    /**
     * Calculate refactor statistics
     */
    private calculateStatistics;
    /**
     * Generate refactor summary
     */
    private generateRefactorSummary;
    /**
     * Generate recommendations
     */
    private generateRecommendations;
    /**
     * Generate next steps
     */
    private generateNextSteps;
    /**
     * Update refactor metrics
     */
    private updateMetrics;
    /**
     * Get refactor metrics
     */
    getMetrics(): RefactorMetrics;
    /**
     * Generate unique ID
     */
    private generateId;
}
//# sourceMappingURL=refactor-engine.d.ts.map