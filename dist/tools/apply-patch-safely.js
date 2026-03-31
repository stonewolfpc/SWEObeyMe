import * as fs from 'fs-extra';
import * as path from 'path';
/**
 * Apply Patch Safely Tool
 *
 * Safely applies validated patches to files with proper error handling
 * and atomic operations to prevent corruption.
 */
export function createApplyPatchSafelyTool() {
    return {
        name: 'apply_patch_safely',
        description: 'Safely applies a validated patch to a file with proper error handling and atomic operations',
        inputSchema: {
            type: 'object',
            properties: {
                filePath: {
                    type: 'string',
                    description: 'File path to modify',
                },
                patchedContent: {
                    type: 'string',
                    description: 'Patched content to apply',
                },
                createBackup: {
                    type: 'boolean',
                    description: 'Create backup before applying patch',
                    default: true,
                },
                encoding: {
                    type: 'string',
                    description: 'File encoding',
                    default: 'utf8',
                },
            },
            required: ['filePath', 'patchedContent'],
        },
    };
}
/**
 * Handle apply patch safely tool call
 */
export async function handleApplyPatchSafely(args) {
    try {
        const { filePath, patchedContent, createBackup = true, encoding = 'utf8' } = args;
        // Validate inputs
        if (!filePath || typeof filePath !== 'string') {
            throw new Error('Invalid file path provided');
        }
        if (patchedContent === undefined || patchedContent === null) {
            throw new Error('Invalid patched content provided');
        }
        // Resolve file path
        const resolvedPath = path.resolve(filePath);
        // Check if file exists
        const fileExists = await fs.pathExists(resolvedPath);
        if (!fileExists) {
            throw new Error(`File does not exist: ${resolvedPath}`);
        }
        // Check if path is a file (not directory)
        const stats = await fs.stat(resolvedPath);
        if (!stats.isFile()) {
            throw new Error(`Path is not a file: ${resolvedPath}`);
        }
        // Read original content
        let originalContent;
        try {
            originalContent = await fs.readFile(resolvedPath, encoding);
        }
        catch (error) {
            throw new Error(`Failed to read original file: ${error.message}`);
        }
        // Validate patched content is valid UTF-8
        try {
            Buffer.from(patchedContent, encoding);
        }
        catch (error) {
            throw new Error(`Patched content is not valid ${encoding}: ${error.message}`);
        }
        // Create backup if requested
        let backupPath;
        if (createBackup) {
            try {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const backupName = `${path.basename(resolvedPath)}.backup.${timestamp}`;
                backupPath = path.join(path.dirname(resolvedPath), backupName);
                await fs.copyFile(resolvedPath, backupPath);
            }
            catch (error) {
                console.warn(`Warning: Failed to create backup: ${error.message}`);
                // Continue without backup - this is a warning, not a failure
            }
        }
        // Write patched content atomically
        try {
            // Write to temporary file first
            const tempPath = `${resolvedPath}.tmp.${Date.now()}`;
            await fs.writeFile(tempPath, patchedContent, { encoding: encoding });
            // Verify the write
            const writtenContent = await fs.readFile(tempPath, encoding);
            if (writtenContent !== patchedContent) {
                await fs.remove(tempPath);
                throw new Error('File write verification failed');
            }
            // Atomic move
            await fs.move(tempPath, resolvedPath, { overwrite: true });
        }
        catch (error) {
            // Clean up temp file if it exists
            const tempPath = `${resolvedPath}.tmp.${Date.now()}`;
            if (await fs.pathExists(tempPath)) {
                await fs.remove(tempPath).catch(() => { }); // Ignore cleanup errors
            }
            throw new Error(`Failed to write patched content: ${error.message}`);
        }
        // Verify the final result
        try {
            const finalContent = await fs.readFile(resolvedPath, encoding);
            if (finalContent !== patchedContent) {
                throw new Error('Final file verification failed');
            }
        }
        catch (error) {
            // Try to restore from backup if available
            if (backupPath && await fs.pathExists(backupPath)) {
                try {
                    await fs.copyFile(backupPath, resolvedPath);
                }
                catch (restoreError) {
                    console.error('Failed to restore from backup:', restoreError);
                }
            }
            throw new Error(`Final verification failed: ${error.message}`);
        }
        return {
            success: true,
            before: originalContent,
            after: patchedContent,
            filePath: resolvedPath,
            backupPath,
        };
    }
    catch (error) {
        return {
            success: false,
            before: '',
            after: '',
            filePath: args.filePath,
            error: error.message,
        };
    }
}
//# sourceMappingURL=apply-patch-safely.js.map