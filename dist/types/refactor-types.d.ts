/**
 * Refactor Types
 *
 * Type definitions for the autonomous multi-file refactor engine that enables
 * SWEObeyMe to analyze entire project structure, detect cross-file issues,
 * generate coordinated multi-file patches, and maintain architectural integrity.
 */
/**
 * Refactor target file with analysis results
 */
export interface RefactorTarget {
    /** Target file path */
    filePath: string;
    /** Reason for refactoring this file */
    reason: string;
    /** Confidence score (0-1) for this target */
    confidence: number;
    /** Type of refactoring needed */
    refactorType: 'structural' | 'import' | 'duplicate' | 'outdated' | 'missing' | 'inconsistent';
    /** Current issues detected */
    issues: string[];
    /** Suggested changes */
    suggestions: string[];
    /** Estimated impact of changes */
    estimatedImpact: 'low' | 'medium' | 'high' | 'critical';
    /** Dependencies on this file */
    dependencies: string[];
    /** Dependents of this file */
    dependents: string[];
    /** Risk assessment */
    risk: 'low' | 'medium' | 'high';
    /** Estimated effort in minutes */
    estimatedEffort: number;
    /** File size and complexity metrics */
    metrics: {
        lines: number;
        complexity: number;
        maintainability: number;
        testCoverage: number;
    };
}
/**
 * Complete refactor plan with all targets and metadata
 */
export interface RefactorPlan {
    /** Plan identifier */
    id: string;
    /** Original task description */
    task: string;
    /** Files targeted for refactoring */
    targets: RefactorTarget[];
    /** Plan description */
    description: string;
    /** Overall estimated impact */
    estimatedImpact: 'low' | 'medium' | 'high' | 'critical';
    /** Overall confidence score */
    confidence: number;
    /** Estimated total effort in minutes */
    estimatedEffort: number;
    /** Risk assessment for the entire plan */
    risk: 'low' | 'medium' | 'high';
    /** Dependencies between targets */
    dependencies: Array<{
        from: string;
        to: string;
        type: 'sequential' | 'parallel';
        reason: string;
    }>;
    /** Prerequisites for the refactor */
    prerequisites: string[];
    /** Expected outcomes */
    expectedOutcomes: string[];
    /** Potential risks */
    risks: string[];
    /** Success criteria */
    successCriteria: string[];
    /** Rollback strategy */
    rollbackStrategy: string;
    /** Plan metadata */
    metadata: {
        timestamp: Date;
        analysisDepth: 'shallow' | 'medium' | 'deep';
        processingTime: number;
        version: string;
    };
}
/**
 * Individual refactor patch for a specific file
 */
export interface RefactorPatch {
    /** Patch identifier */
    id: string;
    /** Target file path */
    filePath: string;
    /** Original file content */
    originalContent: string;
    /** Patched file content */
    patchedContent: string;
    /** Validation result */
    validation: {
        valid: boolean;
        score: number;
        issues: Array<{
            category: string;
            severity: 'error' | 'warning' | 'info';
            description: string;
            location?: {
                line: number;
                column: number;
            };
        }>;
        summary: string;
    };
    /** Success status */
    success: boolean;
    /** Error message if failed */
    error?: string;
    /** Confidence score */
    confidence: number;
    /** Number of retries attempted */
    retries: number;
    /** Backup path if created */
    backupPath?: string;
    /** Timestamp when patch was created */
    timestamp: Date;
    /** Processing time in milliseconds */
    processingTime: number;
}
/**
 * Complete refactor result with all patches and summary
 */
export interface RefactorResult {
    /** Result identifier */
    id: string;
    /** Original task */
    task: string;
    /** Refactor plan used */
    plan: RefactorPlan;
    /** All patches generated and applied */
    patches: RefactorPatch[];
    /** Overall success status */
    success: boolean;
    /** Human-readable summary */
    summary: string;
    /** Failed patches */
    failures: RefactorPatch[];
    /** Statistics */
    statistics: {
        totalTargets: number;
        successfulPatches: number;
        failedPatches: number;
        totalLinesChanged: number;
        totalFilesChanged: number;
        averageConfidence: number;
        totalProcessingTime: number;
        successRate: number;
    };
    /** Impact assessment */
    impact: {
        codeQuality: 'improved' | 'maintained' | 'degraded';
        maintainability: 'improved' | 'maintained' | 'degraded';
        testCoverage: 'improved' | 'maintained' | 'degraded';
        performance: 'improved' | 'maintained' | 'degraded';
    };
    /** Rollback information */
    rollback: {
        available: boolean;
        backupPaths: string[];
        rollbackScript?: string;
    };
    /** Recommendations */
    recommendations: string[];
    /** Next steps */
    nextSteps: string[];
    /** Result metadata */
    metadata: {
        timestamp: Date;
        processingTime: number;
        version: string;
        environment: string;
    };
}
/**
 * Refactor analysis context
 */
export interface RefactorContext {
    /** Context identifier */
    id: string;
    /** Original task description */
    task: string;
    /** Current working directory */
    workingDirectory: string;
    /** Project context information */
    projectContext: any;
    /** File system analysis */
    fileSystemAnalysis: {
        totalFiles: number;
        fileTypes: Record<string, number>;
        directoryStructure: Array<{
            path: string;
            type: 'file' | 'directory';
            size: number;
            depth: number;
        }>;
        largestFiles: Array<{
            path: string;
            size: number;
            lines: number;
            complexity: number;
        }>;
    };
    /** AST analysis results */
    astAnalysis: {
        classes: Array<{
            name: string;
            filePath: string;
            methods: number;
            properties: number;
            complexity: number;
            dependencies: string[];
        }>;
        interfaces: Array<{
            name: string;
            filePath: string;
            methods: number;
            dependencies: string[];
        }>;
        imports: Array<{
            source: string;
            filePath: string;
            identifiers: string[];
            used: boolean;
        }>;
        exports: Array<{
            name: string;
            filePath: string;
            identifiers: string[];
            used: boolean;
        }>;
    };
    /** Code quality metrics */
    qualityMetrics: {
        maintainabilityIndex: number;
        cyclomaticComplexity: number;
        codeDuplication: number;
        testCoverage: number;
        technicalDebt: number;
    };
    /** Refactor metadata */
    metadata: {
        timestamp: Date;
        analysisDepth: 'shallow' | 'medium' | 'deep';
        processingTime: number;
        confidence: number;
    };
}
/**
 * Refactor engine configuration
 */
export interface RefactorEngineConfig {
    /** Analysis depth */
    analysisDepth: 'shallow' | 'medium' | 'deep';
    /** Confidence threshold for targets */
    confidenceThreshold: number;
    /** Maximum number of targets */
    maxTargets: number;
    /** Maximum retries per patch */
    maxRetries: number;
    /** Enable automatic rollback */
    enableRollback: boolean;
    /** Enable backup creation */
    enableBackup: boolean;
    /** Enable validation */
    enableValidation: boolean;
    /** Enable correction engine */
    enableCorrection: boolean;
    /** Performance tracking */
    enableMetrics: boolean;
}
/**
 * Refactor metrics for performance tracking
 */
export interface RefactorMetrics {
    /** Total refactors completed */
    totalRefactors: number;
    /** Successful refactors */
    successfulRefactors: number;
    /** Average confidence score */
    averageConfidence: number;
    /** Average processing time */
    averageProcessingTime: number;
    /** Last refactor timestamp */
    lastRefactor: Date;
    /** Target type distribution */
    targetDistribution: Record<string, number>;
    /** Success rate by refactor type */
    successRateByType: Record<string, number>;
    /** Average effort by refactor type */
    averageEffortByType: Record<string, number>;
    /** File type distribution */
    fileTypeDistribution: Record<string, number>;
}
/**
 * Cross-file dependency analysis result
 */
export interface CrossFileDependencyAnalysis {
    /** Source file */
    source: string;
    /** Dependencies */
    dependencies: Array<{
        target: string;
        type: 'import' | 'export' | 'function-call' | 'class-instantiation';
        strength: 'strong' | 'medium' | 'weak';
        confidence: number;
        location: {
            line: number;
            column: number;
        };
    }>;
    /** Dependents */
    dependents: Array<{
        source: string;
        type: 'import' | 'export' | 'function-call' | 'class-instantiation';
        strength: 'strong' | 'medium' | 'weak';
        confidence: number;
        location: {
            line: number;
            column: number;
        };
    }>;
    /** Circular dependencies */
    circularDependencies: Array<{
        path: string[];
        severity: 'low' | 'medium' | 'high';
        confidence: number;
        description: string;
    }>;
    /** Dependency graph metrics */
    metrics: {
        totalDependencies: number;
        totalDependents: number;
        fanIn: number;
        fanOut: number;
        density: number;
        clustering: number;
    };
}
/**
 * Code pattern analysis result
 */
export interface CodePatternAnalysis {
    /** Pattern type */
    pattern: string;
    /** Pattern description */
    description: string;
    /** Confidence score */
    confidence: number;
    /** Files where pattern is found */
    files: Array<{
        path: string;
        locations: Array<{
            line: number;
            column: number;
            description: string;
        }>;
    }>;
    /** Pattern category */
    category: 'good' | 'bad' | 'neutral';
    /** Suggested actions */
    suggestions: Array<{
        action: string;
        description: string;
        priority: 'low' | 'medium' | 'high';
        confidence: number;
    }>;
    /** Refactoring recommendations */
    refactorRecommendations: Array<{
        type: string;
        description: string;
        files: string[];
        confidence: number;
        effort: number;
    }>;
}
/**
 * Architectural integrity analysis result
 */
export interface ArchitecturalIntegrityAnalysis {
    /** Overall integrity score */
    integrityScore: number;
    /** Architectural layers */
    layers: Array<{
        name: string;
        files: string[];
        violations: Array<{
            type: string;
            description: string;
            severity: 'low' | 'medium' | 'high';
            files: string[];
        }>;
    }>;
    /** Layer violations */
    layerViolations: Array<{
        from: string;
        to: string;
        type: string;
        description: string;
        severity: 'low' | 'medium' | 'high';
    }>;
    /** Architectural debt */
    architecturalDebt: Array<{
        type: string;
        description: string;
        impact: 'low' | 'medium' | 'high';
        files: string[];
        estimatedEffort: number;
    }>;
    /** Recommendations */
    recommendations: Array<{
        type: string;
        description: string;
        priority: 'low' | 'medium' | 'high';
        files: string[];
        estimatedEffort: number;
    }>;
}
//# sourceMappingURL=refactor-types.d.ts.map