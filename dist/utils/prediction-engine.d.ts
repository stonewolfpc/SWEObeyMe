import { PredictionContext, PredictedAction, PredictionResult, PredictionEngineConfig, PredictionMetrics } from '../types/prediction-types.js';
/**
 * Predictive Coding Engine
 *
 * Enables ARES to anticipate user intent and pre-compute:
 * - likely next steps
 * - required files
 * - potential patches
 * - missing imports
 * - structural fixes
 * - dependency updates
 *
 * This engine uses multiple analysis techniques:
 * - Project context analysis
 * - Context memory analysis
 * - AST analysis
 * - Pattern recognition
 * - Intent classification
 * - Dependency analysis
 */
export declare class PredictionEngine {
    private config;
    private metrics;
    private projectMapper;
    private contextMemory;
    private astValidator;
    constructor(config?: PredictionEngineConfig);
    /**
     * Analyze task and create prediction context
     *
     * @param task - Task description to analyze
     * @returns Comprehensive prediction context
     */
    analyzeTask(task: string): Promise<PredictionContext>;
    /**
     * Generate predicted actions based on analysis
     *
     * @param context - Prediction context
     * @returns Array of predicted actions
     */
    generatePredictedActions(context: PredictionContext): Promise<PredictedAction[]>;
    /**
     * Summarize predicted actions
     *
     * @param actions - Predicted actions to summarize
     * @returns Human-readable summary
     */
    summarize(actions: PredictedAction[]): string;
    /**
     * Run complete prediction workflow
     *
     * @param task - Task description to predict for
     * @returns Complete prediction result
     */
    run(task: string): Promise<PredictionResult>;
    /**
     * Analyze files in the project
     */
    private analyzeFiles;
    /**
     * Perform AST analysis
     */
    private performASTAnalysis;
    /**
     * Analyze context memory
     */
    private analyzeContextMemory;
    /**
     * Classify user intent
     */
    private classifyIntent;
    /**
     * Generate file-based actions
     */
    private generateFileActions;
    /**
     * Generate import-based actions
     */
    private generateImportActions;
    /**
     * Generate structural actions
     */
    private generateStructuralActions;
    /**
     * Generate dependency actions
     */
    private generateDependencyActions;
    /**
     * Generate refactor actions
     */
    private generateRefactorActions;
    /**
     * Get project files
     */
    private getProjectFiles;
    /**
     * Check if file is a source file
     */
    private isSourceFile;
    /**
     * Update prediction metrics
     */
    private updateMetrics;
    /**
     * Get prediction metrics
     */
    getMetrics(): PredictionMetrics;
    /**
     * Generate unique ID
     */
    private generateId;
}
//# sourceMappingURL=prediction-engine.d.ts.map