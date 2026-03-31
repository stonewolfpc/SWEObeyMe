import * as fs from 'fs-extra';
import * as path from 'path';
/**
 * File Manager Utility
 *
 * Provides intelligent file operations with safety checks, backups,
 * and context awareness for SWE automation tasks.
 */
export class FileManager {
    backupDir;
    operationLog = [];
    constructor(options) {
        this.backupDir = options?.backupDir || path.join(process.cwd(), '.swe-backups');
        this.ensureBackupDir();
    }
    /**
     * Ensure backup directory exists
     */
    async ensureBackupDir() {
        try {
            await fs.ensureDir(this.backupDir);
        }
        catch (error) {
            console.error('Failed to create backup directory:', error);
        }
    }
    /**
     * Perform intelligent file operation
     */
    async performOperation(options) {
        const { operation, source, destination, content, backup = true } = options;
        const timestamp = new Date();
        try {
            let result;
            switch (operation) {
                case 'create':
                    result = await this.createFile(source, content, backup);
                    break;
                case 'update':
                    result = await this.updateFile(source, content, backup);
                    break;
                case 'delete':
                    result = await this.deleteFile(source, backup);
                    break;
                case 'move':
                    result = await this.moveFile(source, destination, backup);
                    break;
                case 'copy':
                    result = await this.copyFile(source, destination, backup);
                    break;
                default:
                    throw new Error(`Unsupported operation: ${operation}`);
            }
            this.logOperation(operation, source || destination, true, result);
            return result;
        }
        catch (error) {
            this.logOperation(operation, source || destination, false, error);
            throw error;
        }
    }
    /**
     * Create a new file
     */
    async createFile(filePath, content, backup) {
        const absolutePath = path.resolve(filePath);
        // Check if file already exists
        if (await fs.pathExists(absolutePath)) {
            throw new Error(`File already exists: ${filePath}`);
        }
        // Create directory if it doesn't exist
        await fs.ensureDir(path.dirname(absolutePath));
        // Write file
        await fs.writeFile(absolutePath, content, 'utf8');
        return {
            success: true,
            path: absolutePath,
            operation: 'create',
            size: content.length,
            timestamp: new Date(),
        };
    }
    /**
     * Update an existing file
     */
    async updateFile(filePath, content, backup) {
        const absolutePath = path.resolve(filePath);
        // Check if file exists
        if (!await fs.pathExists(absolutePath)) {
            throw new Error(`File does not exist: ${filePath}`);
        }
        // Create backup if requested
        if (backup) {
            await this.createBackup(absolutePath);
        }
        // Read original content for comparison
        const originalContent = await fs.readFile(absolutePath, 'utf8');
        // Write new content
        await fs.writeFile(absolutePath, content, 'utf8');
        return {
            success: true,
            path: absolutePath,
            operation: 'update',
            size: content.length,
            originalSize: originalContent.length,
            timestamp: new Date(),
            backup: backup ? this.getBackupPath(absolutePath) : undefined,
        };
    }
    /**
     * Delete a file
     */
    async deleteFile(filePath, backup) {
        const absolutePath = path.resolve(filePath);
        // Check if file exists
        if (!await fs.pathExists(absolutePath)) {
            throw new Error(`File does not exist: ${filePath}`);
        }
        // Get file stats before deletion
        const stats = await fs.stat(absolutePath);
        // Create backup if requested
        if (backup) {
            await this.createBackup(absolutePath);
        }
        // Delete file
        await fs.remove(absolutePath);
        return {
            success: true,
            path: absolutePath,
            operation: 'delete',
            size: stats.size,
            timestamp: new Date(),
            backup: backup ? this.getBackupPath(absolutePath) : undefined,
        };
    }
    /**
     * Move a file
     */
    async moveFile(sourcePath, destinationPath, backup) {
        const sourceAbsolute = path.resolve(sourcePath);
        const destinationAbsolute = path.resolve(destinationPath);
        // Check if source exists
        if (!await fs.pathExists(sourceAbsolute)) {
            throw new Error(`Source file does not exist: ${sourcePath}`);
        }
        // Check if destination already exists
        if (await fs.pathExists(destinationAbsolute)) {
            throw new Error(`Destination already exists: ${destinationPath}`);
        }
        // Create destination directory if it doesn't exist
        await fs.ensureDir(path.dirname(destinationAbsolute));
        // Create backup if requested
        if (backup) {
            await this.createBackup(sourceAbsolute);
        }
        // Get file stats
        const stats = await fs.stat(sourceAbsolute);
        // Move file
        await fs.move(sourceAbsolute, destinationAbsolute);
        return {
            success: true,
            path: destinationAbsolute,
            originalPath: sourceAbsolute,
            operation: 'move',
            size: stats.size,
            timestamp: new Date(),
            backup: backup ? this.getBackupPath(sourceAbsolute) : undefined,
        };
    }
    /**
     * Copy a file
     */
    async copyFile(sourcePath, destinationPath, backup) {
        const sourceAbsolute = path.resolve(sourcePath);
        const destinationAbsolute = path.resolve(destinationPath);
        // Check if source exists
        if (!await fs.pathExists(sourceAbsolute)) {
            throw new Error(`Source file does not exist: ${sourcePath}`);
        }
        // Check if destination already exists
        if (await fs.pathExists(destinationAbsolute)) {
            throw new Error(`Destination already exists: ${destinationPath}`);
        }
        // Create destination directory if it doesn't exist
        await fs.ensureDir(path.dirname(destinationAbsolute));
        // Copy file
        await fs.copy(sourceAbsolute, destinationAbsolute);
        // Get file stats
        const stats = await fs.stat(sourceAbsolute);
        return {
            success: true,
            path: destinationAbsolute,
            originalPath: sourceAbsolute,
            operation: 'copy',
            size: stats.size,
            timestamp: new Date(),
        };
    }
    /**
     * Create a backup of a file
     */
    async createBackup(filePath) {
        const backupPath = this.getBackupPath(filePath);
        await fs.copy(filePath, backupPath);
        return backupPath;
    }
    /**
     * Get backup path for a file
     */
    getBackupPath(filePath) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = path.basename(filePath);
        const relativePath = path.relative(process.cwd(), filePath);
        const backupRelative = path.join(path.dirname(relativePath), `${fileName}.${timestamp}`);
        return path.join(this.backupDir, backupRelative);
    }
    /**
     * Log file operation
     */
    logOperation(operation, path, success, details) {
        this.operationLog.push({
            timestamp: new Date(),
            operation,
            path: path || '',
            success,
            details,
        });
    }
    /**
     * Get operation history
     */
    getOperationHistory() {
        return [...this.operationLog];
    }
    /**
     * Restore file from backup
     */
    async restoreFromBackup(filePath, backupTimestamp) {
        const backupPath = backupTimestamp
            ? path.join(this.backupDir, `${path.basename(filePath)}.${backupTimestamp}`)
            : this.getLatestBackup(filePath);
        if (!await fs.pathExists(backupPath)) {
            throw new Error(`Backup not found for: ${filePath}`);
        }
        await fs.copy(backupPath, filePath);
    }
    /**
     * Get latest backup for a file
     */
    getLatestBackup(filePath) {
        const fileName = path.basename(filePath);
        const dir = path.join(this.backupDir, path.dirname(path.relative(process.cwd(), filePath)));
        // This is a simplified implementation
        // In practice, you'd want to scan the directory for the latest backup
        return path.join(dir, `${fileName}.latest`);
    }
    /**
     * Cleanup old backups
     */
    async cleanupBackups(maxAge = 7 * 24 * 60 * 60 * 1000) {
        try {
            const files = await fs.readdir(this.backupDir);
            const now = Date.now();
            for (const file of files) {
                const filePath = path.join(this.backupDir, file);
                const stats = await fs.stat(filePath);
                if (now - stats.mtimeMs > maxAge) {
                    await fs.remove(filePath);
                }
            }
        }
        catch (error) {
            console.error('Failed to cleanup backups:', error);
        }
    }
    /**
     * Cleanup resources
     */
    async cleanup() {
        // Perform any necessary cleanup
        await this.cleanupBackups();
    }
}
//# sourceMappingURL=file-manager.js.map