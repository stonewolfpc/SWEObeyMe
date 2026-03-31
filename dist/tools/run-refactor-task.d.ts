import { Tool } from '@modelcontextprotocol/sdk/types.js';
/**
 * Run Refactor Task Tool
 *
 * MCP tool that enables ARES to execute coordinated multi-file refactoring
 * with project analysis, cross-file issue detection, coordinated patch generation,
 * validation, and safe application.
 */
export declare function createRunRefactorTaskTool(): Tool;
/**
 * Handle run refactor task tool call
 */
export declare function handleRunRefactorTask(args: {
    task: string;
    maxRetries?: number;
    analysisDepth?: 'shallow' | 'medium' | 'deep';
    confidenceThreshold?: number;
    maxTargets?: number;
    enableBackup?: boolean;
    enableValidation?: boolean;
    enableCorrection?: boolean;
}): Promise<{
    success: boolean;
    task: string;
    plan?: {
        id: string;
        task: string;
        description: string;
        targets: number;
        confidence: number;
        estimatedImpact: string;
        estimatedEffort: number;
        risk: string;
    };
    result?: {
        id: string;
        success: boolean;
        summary: string;
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
        impact: {
            codeQuality: string;
            maintainability: string;
            testCoverage: string;
            performance: string;
        };
        recommendations: string[];
        nextSteps: string[];
    };
    error?: string;
    metadata: {
        timestamp: string;
        processingTime: number;
        version: string;
    };
}>;
//# sourceMappingURL=run-refactor-task.d.ts.map