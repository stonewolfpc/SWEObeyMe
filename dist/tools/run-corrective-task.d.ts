import { Tool } from '@modelcontextprotocol/sdk/types.js';
/**
 * Run Corrective Task Tool
 *
 * Executes a task with autonomous correction and retry logic.
 * This tool combines the workflow orchestrator with the correction
 * engine to automatically fix failed patches through iterative refinement.
 */
export declare function createRunCorrectiveTaskTool(): Tool;
/**
 * Handle run corrective task tool call
 */
export declare function handleRunCorrectiveTask(args: {
    filePath: string;
    taskDescription: string;
    maxRetries?: number;
    applyPatch?: boolean;
    createBackup?: boolean;
}): Promise<{
    success: boolean;
    taskDescription: string;
    filePath: string;
    finalPatch: string;
    validation: any;
    attempts: number;
    correctionHistory: Array<{
        attempt: number;
        success: boolean;
        issues: number;
        score: number;
        error?: string;
    }>;
    applied: boolean;
    backupPath?: string;
    error?: string;
}>;
//# sourceMappingURL=run-corrective-task.d.ts.map