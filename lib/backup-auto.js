/**
 * Automated Backup System
 * Creates automatic backups before every file edit
 * Critical for non-coders to prevent "I missed a bracket" issues
 */

import fs from 'fs/promises';
import path from 'path';

const BACKUP_DIR = path.join(process.cwd(), '.swe-backups');

/**
 * Ensure backup directory exists
 */
async function ensureBackupDir() {
  try {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
  } catch (error) {
    console.error('[Backup] Failed to create backup directory:', error.message);
  }
}

/**
 * Create automatic backup before file edit
 * This is called automatically before every write_file operation
 */
export async function autoBackupBeforeEdit(filePath) {
  await ensureBackupDir();

  try {
    // Check if file exists
    await fs.access(filePath);
  } catch {
    // File doesn't exist, no backup needed
    return null;
  }

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const timestamp = Date.now();
    const baseName = path.basename(filePath);
    const backupFileName = `${baseName}.auto-backup-${timestamp}.readonly`;
    const backupPath = path.join(BACKUP_DIR, backupFileName);

    await fs.writeFile(backupPath, content, 'utf-8');

    console.log(`[Backup] Auto-created: ${backupPath}`);
    return backupPath;
  } catch (error) {
    console.error('[Backup] Auto-backup failed:', error.message);
    return null;
  }
}

/**
 * Get list of auto-backups for a file
 */
export async function getAutoBackups(filePath) {
  await ensureBackupDir();

  try {
    const files = await fs.readdir(BACKUP_DIR);
    const baseName = path.basename(filePath);
    const backups = files.filter(f => f.startsWith(baseName + '.auto-backup-') && f.endsWith('.readonly'));

    return backups.sort((a, b) => {
      const tsA = parseInt(a.match(/auto-backup-(\d+)\.readonly$/)[1], 10);
      const tsB = parseInt(b.match(/auto-backup-(\d+)\.readonly$/)[1], 10);
      return tsB - tsA;
    });
  } catch (error) {
    console.error('[Backup] Failed to list backups:', error.message);
    return [];
  }
}

/**
 * Restore from most recent auto-backup
 */
export async function restoreFromAutoBackup(filePath) {
  const backups = await getAutoBackups(filePath);
  
  if (backups.length === 0) {
    throw new Error('No auto-backups found for this file');
  }

  const latestBackup = backups[0];
  const backupPath = path.join(BACKUP_DIR, latestBackup);
  const content = await fs.readFile(backupPath, 'utf-8');

  await fs.writeFile(filePath, content, 'utf-8');
  console.log(`[Backup] Restored ${filePath} from ${latestBackup}`);
  
  return backupPath;
}

/**
 * Clean up old auto-backups (keep last 10 per file)
 */
export async function cleanupOldAutoBackups(filePath, keepCount = 10) {
  const backups = await getAutoBackups(filePath);
  
  if (backups.length <= keepCount) {
    return;
  }

  const toDelete = backups.slice(keepCount);
  
  for (const backup of toDelete) {
    const backupPath = path.join(BACKUP_DIR, backup);
    try {
      await fs.unlink(backupPath);
      console.log(`[Backup] Cleaned up old backup: ${backup}`);
    } catch (error) {
      console.error(`[Backup] Failed to delete ${backup}:`, error.message);
    }
  }
}
