import { FileManagerOptions, FileOperationResult } from '../types/index.js';
/**
 * File Manager Utility
 *
 * Provides intelligent file operations with safety checks, backups,
 * and context awareness for SWE automation tasks.
 */
export declare class FileManager {
    private backupDir;
    private operationLog;
    constructor(options?: FileManagerOptions);
    /**
     * Ensure backup directory exists
     */
    private ensureBackupDir;
    /**
     * Perform intelligent file operation
     */
    performOperation(options: {
        operation: 'create' | 'update' | 'delete' | 'move' | 'copy';
        source?: string;
        destination?: string;
        content?: string;
        backup?: boolean;
    }): Promise<FileOperationResult>;
    /**
     * Create a new file
     */
    private createFile;
    /**
     * Update an existing file
     */
    private updateFile;
    /**
     * Delete a file
     */
    private deleteFile;
    /**
     * Move a file
     */
    private moveFile;
    /**
     * Copy a file
     */
    private copyFile;
    /**
     * Create a backup of a file
     */
    private createBackup;
    /**
     * Get backup path for a file
     */
    private getBackupPath;
    /**
     * Log file operation
     */
    private logOperation;
    /**
     * Get operation history
     */
    getOperationHistory(): Array<{
        timestamp: Date;
        operation: string;
        path: string;
        success: boolean;
        details?: any;
    }>;
    /**
     * Restore file from backup
     */
    restoreFromBackup(filePath: string, backupTimestamp?: string): Promise<void>;
    /**
     * Get latest backup for a file
     */
    private getLatestBackup;
    /**
     * Cleanup old backups
     */
    cleanupBackups(maxAge?: number): Promise<void>;
    /**
     * Cleanup resources
     */
    cleanup(): Promise<void>;
}
//# sourceMappingURL=file-manager.d.ts.map