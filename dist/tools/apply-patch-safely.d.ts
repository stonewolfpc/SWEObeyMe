import { Tool } from '@modelcontextprotocol/sdk/types.js';
/**
 * Apply Patch Safely Tool
 *
 * Safely applies validated patches to files with proper error handling
 * and atomic operations to prevent corruption.
 */
export declare function createApplyPatchSafelyTool(): Tool;
/**
 * Handle apply patch safely tool call
 */
export declare function handleApplyPatchSafely(args: {
    filePath: string;
    patchedContent: string;
    createBackup?: boolean;
    encoding?: string;
}): Promise<{
    success: boolean;
    before: string;
    after: string;
    filePath: string;
    backupPath?: string;
    error?: string;
}>;
//# sourceMappingURL=apply-patch-safely.d.ts.map