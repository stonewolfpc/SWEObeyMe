import { Tool } from '@modelcontextprotocol/sdk/types.js';
/**
 * Get Predicted Actions Tool
 *
 * MCP tool that enables ARES to predict likely next steps, file edits,
 * and structural changes based on user intent and project context.
 */
export declare function createGetPredictedActionsTool(): Tool;
/**
 * Handle get predicted actions tool call
 */
export declare function handleGetPredictedActions(args: {
    task: string;
    analysisDepth?: 'shallow' | 'medium' | 'deep';
    maxActions?: number;
    confidenceThreshold?: number;
}): Promise<{
    success: boolean;
    task: string;
    actions: Array<{
        id: string;
        type: string;
        filePath: string;
        description: string;
        confidence: number;
        impact: string;
        priority: string;
        suggestion: string;
        outcome: string;
        risk: string;
        estimatedTime: number;
    }>;
    summary: string;
    confidence: number;
    metadata: {
        timestamp: string;
        processingTime: number;
        analysisDepth: string;
        totalActions: number;
        highConfidenceActions: number;
        criticalActions: number;
    };
    error?: string;
}>;
//# sourceMappingURL=get-predicted-actions.d.ts.map