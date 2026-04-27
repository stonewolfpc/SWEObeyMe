/**
 * Automated Backup System
 * Creates automatic backups before every file edit
 * Creates automatic snapshots after every successful file edit
 * Silent operation - never errors, always works
 * Critical for preventing data loss during edits
 */

import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import { getDefaultBackupDir } from './utils.js';

const _base = getDefaultBackupDir();
const BACKUP_DIR = _base;
const SNAPSHOT_DIR = path.join(path.dirname(_base), '.sweobeyme-snapshots');

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
 * Ensure snapshot directory exists
 */
async function ensureSnapshotDir() {
  try {
    await fs.mkdir(SNAPSHOT_DIR, { recursive: true });
  } catch (error) {
    console.error('[Snapshot] Failed to create snapshot directory:', error.message);
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

    // Debug log removed
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
    const backups = files.filter(
      (f) => f.startsWith(baseName + '.auto-backup-') && f.endsWith('.readonly')
    );

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
  // Debug log removed

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
      // Debug log removed
    } catch (error) {
      console.error(`[Backup] Failed to delete ${backup}:`, error.message);
    }
  }
}

/**
 * Create automatic snapshot after successful file edit
 * This is called automatically after every write_file operation
 * Silent operation - never errors
 */
export async function autoSnapshotAfterEdit(filePath, editInfo = {}) {
  await ensureSnapshotDir();

  try {
    if (!existsSync(filePath)) {
      return null; // File doesn't exist after edit
    }

    const content = await fs.readFile(filePath, 'utf-8');
    const timestamp = Date.now();
    const baseName = path.basename(filePath);
    const snapshotFileName = `${baseName}.snapshot-${timestamp}.readonly`;
    const snapshotPath = path.join(SNAPSHOT_DIR, snapshotFileName);

    await fs.writeFile(snapshotPath, content, 'utf-8');

    // Cleanup old snapshots (keep last 5 per file)
    await cleanupOldSnapshots(filePath, 5);

    return snapshotPath;
  } catch (error) {
    // Silent fail - snapshot should never break the main operation
    return null;
  }
}

/**
 * Get list of snapshots for a file
 */
export async function getSnapshots(filePath) {
  await ensureSnapshotDir();

  try {
    const files = await fs.readdir(SNAPSHOT_DIR);
    const baseName = path.basename(filePath);
    const snapshots = files.filter(
      (f) => f.startsWith(baseName + '.snapshot-') && f.endsWith('.readonly')
    );

    return snapshots.sort((a, b) => {
      const tsA = parseInt(a.match(/snapshot-(\d+)\.readonly$/)[1], 10);
      const tsB = parseInt(b.match(/snapshot-(\d+)\.readonly$/)[1], 10);
      return tsB - tsA;
    });
  } catch (error) {
    return [];
  }
}

/**
 * Clean up old snapshots (keep last N per file)
 */
async function cleanupOldSnapshots(filePath, keepCount = 5) {
  const snapshots = await getSnapshots(filePath);

  if (snapshots.length <= keepCount) {
    return;
  }

  const toDelete = snapshots.slice(keepCount);

  for (const snapshot of toDelete) {
    const snapshotPath = path.join(SNAPSHOT_DIR, snapshot);
    try {
      await fs.unlink(snapshotPath);
    } catch {
      // Silent fail
    }
  }
}

/**
 * Get backup status for a file
 * Returns info about available backups and snapshots
 */
export async function getBackupStatus(filePath) {
  try {
    const backups = await getAutoBackups(filePath);
    const snapshots = await getSnapshots(filePath);

    if (backups.length === 0 && snapshots.length === 0) {
      return { hasBackup: false, hasSnapshot: false, message: 'No backups or snapshots' };
    }

    let latestBackup = null;
    if (backups.length > 0) {
      const ts = parseInt(backups[0].match(/auto-backup-(\d+)\.readonly$/)[1], 10);
      latestBackup = new Date(ts).toISOString();
    }

    let latestSnapshot = null;
    if (snapshots.length > 0) {
      const ts = parseInt(snapshots[0].match(/snapshot-(\d+)\.readonly$/)[1], 10);
      latestSnapshot = new Date(ts).toISOString();
    }

    return {
      hasBackup: backups.length > 0,
      hasSnapshot: snapshots.length > 0,
      backupCount: backups.length,
      snapshotCount: snapshots.length,
      latestBackup,
      latestSnapshot,
      message: `Found ${backups.length} backup(s), ${snapshots.length} snapshot(s)`,
    };
  } catch (error) {
    return { hasBackup: false, hasSnapshot: false, message: 'Error checking status' };
  }
}

/**
 * Quick restore from most recent backup or snapshot
 * Silent operation - never errors
 */
export async function quickRestore(filePath, fromSnapshot = false) {
  try {
    const items = fromSnapshot ? await getSnapshots(filePath) : await getAutoBackups(filePath);

    if (items.length === 0) {
      return { success: false, message: 'No backups/snapshots found' };
    }

    const latest = items[0];
    const sourcePath = fromSnapshot
      ? path.join(SNAPSHOT_DIR, latest)
      : path.join(BACKUP_DIR, latest);

    const content = await fs.readFile(sourcePath, 'utf-8');
    await fs.writeFile(filePath, content, 'utf-8');

    return {
      success: true,
      message: `Restored from ${fromSnapshot ? 'snapshot' : 'backup'}: ${latest}`,
    };
  } catch (error) {
    return { success: false, message: `Restore failed: ${error.message}` };
  }
}
