/**
 * Prediction Types
 *
 * Type definitions for the predictive coding engine that enables ARES
 * to anticipate user intent and pre-compute likely actions, files, and changes.
 */
/**
 * Context for prediction analysis
 */
export interface PredictionContext {
    /** Context identifier */
    id: string;
    /** Original task description */
    task: string;
    /** Current working directory */
    workingDirectory: string;
    /** Project context information */
    projectContext: any;
    /** File contents analysis */
    fileAnalysis: {
        totalFiles: number;
        fileTypes: Record<string, number>;
        largestFiles: Array<{
            path: string;
            size: number;
            lines: number;
        }>;
        recentFiles: Array<{
            path: string;
            modified: Date;
            size: number;
        }>;
    };
    /** AST analysis results */
    astAnalysis: {
        classes: Array<{
            name: string;
            filePath: string;
            methods: number;
            properties: number;
        }>;
        interfaces: Array<{
            name: string;
            filePath: string;
            methods: number;
        }>;
        imports: Array<{
            source: string;
            filePath: string;
            identifiers: string[];
        }>;
        exports: Array<{
            name: string;
            filePath: string;
            identifiers: string[];
        }>;
    };
    /** Context memory analysis */
    contextMemory: {
        recentTasks: Array<{
            task: string;
            timestamp: Date;
            success: boolean;
            filesModified: string[];
        }>;
        recentPatches: Array<{
            filePath: string;
            timestamp: Date;
            success: boolean;
            issues: number;
        }>;
        activeSession: {
            id: string;
            startTime: Date;
            taskCount: number;
        };
    };
    /** Prediction metadata */
    metadata: {
        timestamp: Date;
        confidence: number;
        analysisDepth: 'shallow' | 'medium' | 'deep';
        processingTime: number;
    };
}
/**
 * Predicted action that ARES can take
 */
export interface PredictedAction {
    /** Action identifier */
    id: string;
    /** Action type */
    type: "edit" | "create" | "fix" | "refactor" | "import" | "dependency";
    /** Target file path */
    filePath: string;
    /** Action description */
    description: string;
    /** Confidence score (0-1) */
    confidence: number;
    /** Estimated impact */
    impact: "low" | "medium" | "high" | "critical";
    /** Required context */
    requiredContext: string[];
    /** Dependencies */
    dependencies: string[];
    /** Suggested implementation */
    suggestion: string;
    /** Priority */
    priority: "low" | "medium" | "high" | "critical";
    /** Predicted outcome */
    outcome: string;
    /** Risk assessment */
    risk: "low" | "medium" | "high";
    /** Time estimate */
    estimatedTime: number;
}
/**
 * Complete prediction result
 */
export interface PredictionResult {
    /** Result identifier */
    id: string;
    /** Original task */
    task: string;
    /** Predicted actions */
    actions: PredictedAction[];
    /** Human-readable summary */
    summary: string;
    /** Overall confidence score */
    confidence: number;
    /** Prediction metadata */
    metadata: {
        timestamp: Date;
        processingTime: number;
        analysisDepth: 'shallow' | 'medium' | 'deep';
        totalActions: number;
        highConfidenceActions: number;
        criticalActions: number;
    };
}
/**
 * Prediction engine configuration
 */
export interface PredictionEngineConfig {
    /** Analysis depth */
    analysisDepth: 'shallow' | 'medium' | 'deep';
    /** Confidence threshold */
    confidenceThreshold: number;
    /** Maximum actions to predict */
    maxActions: number;
    /** Enable file analysis */
    enableFileAnalysis: boolean;
    /** Enable AST analysis */
    enableASTAnalysis: boolean;
    /** Enable context memory analysis */
    enableContextMemoryAnalysis: boolean;
    /** Enable dependency analysis */
    enableDependencyAnalysis: boolean;
    /** Performance tracking */
    enableMetrics: boolean;
}
/**
 * Prediction metrics for performance tracking
 */
export interface PredictionMetrics {
    /** Total predictions made */
    totalPredictions: number;
    /** Successful predictions */
    successfulPredictions: number;
    /** Average confidence */
    averageConfidence: number;
    /** Average processing time */
    averageProcessingTime: number;
    /** Last prediction timestamp */
    lastPrediction: Date;
    /** Action type distribution */
    actionDistribution: Record<string, number>;
    /** Confidence distribution */
    confidenceDistribution: {
        high: number;
        medium: number;
        low: number;
    };
    /** File type predictions */
    fileTypePredictions: Record<string, number>;
}
/**
 * File analysis result
 */
export interface FileAnalysisResult {
    /** File path */
    path: string;
    /** File size in bytes */
    size: number;
    /** Line count */
    lines: number;
    /** File type */
    type: string;
    /** Last modified timestamp */
    lastModified: Date;
    /** AST analysis */
    astAnalysis?: {
        classes: number;
        interfaces: number;
        functions: number;
        imports: number;
        exports: number;
        complexity: number;
    };
    /** Content analysis */
    contentAnalysis?: {
        imports: string[];
        exports: string[];
        dependencies: string[];
        TODOs: number;
        comments: number;
        documentation: number;
    };
    /** Quality metrics */
    qualityMetrics?: {
        maintainabilityIndex: number;
        complexity: number;
        duplication: number;
        testCoverage: number;
    };
}
/**
 * Dependency analysis result
 */
export interface DependencyAnalysisResult {
    /** Source file */
    source: string;
    /** Dependencies */
    dependencies: Array<{
        name: string;
        type: 'import' | 'require' | 'dynamic';
        source: string;
        confidence: number;
        used: boolean;
    }>;
    /** Dependents */
    dependents: Array<{
        file: string;
        type: 'import' | 'require' | 'dynamic';
        confidence: number;
    }>;
    /** Circular dependencies */
    circularDependencies: Array<{
        path: string[];
        severity: 'low' | 'medium' | 'high';
        confidence: number;
    }>;
    /** Dependency graph metrics */
    metrics: {
        totalDependencies: number;
        totalDependents: number;
        fanIn: number;
        fanOut: number;
        density: number;
    };
}
/**
 * Pattern recognition result
 */
export interface PatternRecognitionResult {
    /** Pattern type */
    pattern: string;
    /** Pattern description */
    description: string;
    /** Confidence score */
    confidence: number;
    /** Files involved */
    files: string[];
    /** Suggested actions */
    suggestions: Array<{
        action: string;
        description: string;
        confidence: number;
        priority: string;
    }>;
    /** Risk assessment */
    risk: "low" | "medium" | "high";
    /** Implementation complexity */
    complexity: "low" | "medium" | "high";
}
/**
 * Intent classification result
 */
export interface IntentClassificationResult {
    /** Primary intent */
    intent: string;
    /** Secondary intents */
    secondaryIntents: string[];
    /** Confidence scores */
    confidence: Record<string, number>;
    /** Keywords extracted */
    keywords: string[];
    /** Entities mentioned */
    entities: Array<{
        type: string;
        value: string;
        confidence: number;
    }>;
    /** Suggested actions */
    suggestedActions: Array<{
        action: string;
        description: string;
        confidence: number;
        priority: string;
    }>;
}
/**
 * Predictive coding workflow result
 */
export interface PredictiveWorkflowResult {
    /** Workflow identifier */
    id: string;
    /** Original task */
    task: string;
    /** Predicted actions */
    actions: PredictedAction[];
    /** Intent classification */
    intent: IntentClassificationResult;
    /** File analysis results */
    fileAnalysis: FileAnalysisResult[];
    /** Dependency analysis */
    dependencyAnalysis: DependencyAnalysisResult;
    /** Pattern recognition */
    patterns: PatternRecognitionResult[];
    /** Workflow recommendations */
    recommendations: string[];
    /** Risk assessment */
    riskAssessment: {
        overall: "low" | "medium" | "high";
        technical: "low" | "medium" | "high";
        business: "low" | "medium" | "high";
    };
    /** Success probability */
    successProbability: number;
    /** Estimated effort */
    estimatedEffort: {
        hours: number;
        complexity: "low" | "medium" | "high";
        confidence: number;
    };
    /** Metadata */
    metadata: {
        timestamp: Date;
        processingTime: number;
        confidence: number;
        version: string;
    };
}
//# sourceMappingURL=prediction-types.d.ts.map