import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { getDefaultBackupDir } from './utils.js';
import { MAX_BACKUPS_PER_FILE } from './config.js';

const BACKUP_DIR = process.env.SWEOBEYME_BACKUP_DIR
  ? path.resolve(process.env.SWEOBEYME_BACKUP_DIR)
  : getDefaultBackupDir();
let backupCounter = 0;

// Configuration
const BACKUP_LOCK_TIMEOUT = 30000; // 30 seconds

// State management
const activeBackups = new Map(); // Track in-progress backups
const writeLocks = new Map(); // Track write locks

const DEBUG_LOGS = process.env.SWEOBEYME_DEBUG === '1';
const log = msg => {
  if (!DEBUG_LOGS) return;
  process.stderr.write(`[SWEObeyMe-Audit]: ${msg}\n`);
};

/**
 * Ensure backup directory exists
 */
export async function ensureBackupDir() {
  try {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    log(`Backup directory ready: ${BACKUP_DIR}`);
  } catch (error) {
    process.stderr.write(`[CRITICAL] Failed to create backup directory: ${error.message}\n`);
  }
}

/**
 * Calculate SHA-256 hash of content
 */
function calculateHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Verify backup integrity
 */
async function verifyBackup(backupPath, originalContent, originalHash) {
  try {
    const backupContent = await fs.readFile(backupPath, 'utf-8');
    const backupHash = calculateHash(backupContent);

    if (originalHash !== backupHash) {
      throw new Error('Backup content hash mismatch');
    }

    if (backupContent !== originalContent) {
      throw new Error('Backup content mismatch');
    }

    return true;
  } catch (error) {
    process.stderr.write(`[BACKUP VERIFICATION FAILED] ${backupPath}: ${error.message}\n`);
    return false;
  }
}

/**
 * Clean up old backups for a file
 */
async function cleanupOldBackups(filePath) {
  try {
    const baseName = path.basename(filePath);
    const files = await fs.readdir(BACKUP_DIR);
    const backups = files
      .filter(f => f.startsWith(baseName + '.backup-') && f.endsWith('.readonly'))
      .sort((a, b) => {
        // Sort by timestamp (newest first)
        const tsA = parseInt(a.match(/-(\d+)\.readonly$/)[1], 10);
        const tsB = parseInt(b.match(/-(\d+)\.readonly$/)[1], 10);
        return tsB - tsA;
      });

    // Delete old backups beyond limit
    for (let i = MAX_BACKUPS_PER_FILE(); i < backups.length; i++) {
      const oldBackup = path.join(BACKUP_DIR, backups[i]);
      await fs.unlink(oldBackup).catch(() => {});
      log(`Cleaned up old backup: ${backups[i]}`);
    }
  } catch (error) {
    process.stderr.write(`[BACKUP CLEANUP WARNING] ${filePath}: ${error.message}\n`);
  }
}

/**
 * Acquire write lock for a file
 */
function acquireWriteLock(filePath) {
  const fullPath = path.resolve(filePath);

  if (writeLocks.has(fullPath)) {
    const lockTime = writeLocks.get(fullPath);
    const age = Date.now() - lockTime;

    // Lock expired?
    if (age > BACKUP_LOCK_TIMEOUT) {
      writeLocks.delete(fullPath);
      process.stderr.write(`[BACKUP WARNING] Expired write lock removed for ${filePath}\n`);
    } else {
      throw new Error(
        `File ${filePath} is being written by another operation (lock age: ${age}ms)`
      );
    }
  }

  writeLocks.set(fullPath, Date.now());
  return () => writeLocks.delete(fullPath); // Return release function
}

/**
 * Creates a numbered backup of a file with atomic operations and verification.
 * @param {string} filePath - Path to the file to backup.
 * @returns {string|null} - The backup file path or null if failed.
 */
export async function createBackup(filePath) {
  const fullPath = path.resolve(filePath);

  try {
    // Check if backup already in progress
    if (activeBackups.has(fullPath)) {
      const existingBackup = await activeBackups.get(fullPath);
      if (existingBackup) {
        log(`Using existing in-progress backup for ${filePath}`);
        return existingBackup;
      }
    }

    // Acquire write lock
    const releaseLock = await acquireWriteLock(filePath);

    const backupPromise = performBackup(filePath, fullPath);
    activeBackups.set(fullPath, backupPromise);

    try {
      const backupPath = await backupPromise;
      releaseLock();
      return backupPath;
    } catch (error) {
      releaseLock();
      throw error;
    } finally {
      activeBackups.delete(fullPath);
    }
  } catch (error) {
    process.stderr.write(`[BACKUP FAILED] ${filePath}: ${error.message}\n`);
    return null;
  }
}

/**
 * Internal backup implementation with atomic operations
 */
async function performBackup(filePath, fullPath) {
  try {
    // Read original file
    const content = await fs.readFile(fullPath, 'utf-8');
    const originalHash = calculateHash(content);

    // Generate backup filename
    const timestamp = Date.now();
    const backupFileName = `${path.basename(filePath)}.backup-${backupCounter++}-${timestamp}.readonly`;
    const backupPath = path.join(BACKUP_DIR, backupFileName);

    // Atomic write: write to temp file first
    const tempPath = `${backupPath}.tmp`;
    await fs.writeFile(tempPath, content, { encoding: 'utf-8', mode: 0o444 });

    // Atomic rename (atomic on Unix, Windows with proper flags)
    await fs.rename(tempPath, backupPath);

    // Set read-only permission (Unix)
    if (process.platform !== 'win32') {
      await fs.chmod(backupPath, 0o444);
    }

    // Verify backup integrity
    const verified = await verifyBackup(backupPath, content, originalHash);
    if (!verified) {
      // Cleanup failed backup
      await fs.unlink(backupPath).catch(() => {});
      throw new Error('Backup verification failed');
    }

    // Clean up old backups
    await cleanupOldBackups(filePath);

    log(
      `Backup created and verified: ${backupFileName} (hash: ${originalHash.substring(0, 8)}...)`
    );
    return backupPath;
  } catch (error) {
    process.stderr.write(`[BACKUP ERROR] ${filePath}: ${error.message}\n`);
    throw error;
  }
}

/**
 * List all backups for a file
 */
export async function listBackups(filePath) {
  try {
    const baseName = path.basename(filePath);
    const files = await fs.readdir(BACKUP_DIR);
    const backups = files
      .filter(f => f.startsWith(baseName + '.backup-') && f.endsWith('.readonly'))
      .map(f => {
        const match = f.match(/-(\d+)\.readonly$/);
        return match ? { name: f, timestamp: parseInt(match[1], 10) } : null;
      })
      .filter(f => f !== null) // Filter out malformed filenames
      .sort((a, b) => b.timestamp - a.timestamp); // Newest first

    return backups.map(({ name, timestamp }) => ({
      name,
      path: path.join(BACKUP_DIR, name),
      timestamp,
    }));
  } catch (error) {
    process.stderr.write(`[BACKUP LIST ERROR] ${filePath}: ${error.message}\n`);
    return [];
  }
}

/**
 * Get backup statistics
 */
export async function getBackupStats() {
  try {
    const files = await fs.readdir(BACKUP_DIR);
    const backups = files.filter(f => f.endsWith('.readonly'));

    // Calculate total size
    let totalSize = 0;
    for (const backup of backups) {
      const backupPath = path.join(BACKUP_DIR, backup);
      const stats = await fs.stat(backupPath);
      totalSize += stats.size;
    }

    // Group by original file
    const byFile = {};
    for (const backup of backups) {
      const originalFile = backup.replace(/\.backup-\d+-\d+\.readonly$/, '');
      byFile[originalFile] = (byFile[originalFile] || 0) + 1;
    }

    return {
      totalBackups: backups.length,
      totalSize,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
      byFile,
      backupDir: BACKUP_DIR,
    };
  } catch (error) {
    process.stderr.write(`[BACKUP STATS ERROR]: ${error.message}\n`);
    return null;
  }
}

/**
 * Restore file from backup
 * @param {string} filePath - Path to restore
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function restoreBackup(filePath) {
  const fullPath = path.resolve(filePath);

  try {
    const backups = await listBackups(filePath);
    if (backups.length === 0) {
      return { success: false, error: 'No backups found for this file' };
    }

    // Get the most recent backup
    const latestBackup = backups[0];
    const backupContent = await fs.readFile(latestBackup.path, 'utf-8');

    // Write the backup content back to the original file
    await fs.writeFile(fullPath, backupContent, 'utf-8');

    log(`Restored ${filePath} from backup: ${latestBackup.name}`);
    return { success: true };
  } catch (error) {
    process.stderr.write(`[RESTORE FAILED] ${filePath}: ${error.message}\n`);
    return { success: false, error: error.message };
  }
}

export { BACKUP_DIR };
