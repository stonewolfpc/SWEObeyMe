/**
 * Automated Backup System
 * Creates automatic backups before every file edit
 * Creates automatic snapshots after every successful file edit
 * Critical for preventing data loss during edits
 */

import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import { readFileWithSizeLimit } from './shared/async-utils.js';
import { getDefaultBackupDir } from './utils.js';
import { registerError } from './health/error-registry.js';
import { reportErrorToGitHub } from './health/github-reporter.js';
import crypto from 'crypto';

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
    const err = {
      code: 'ERR-BACKUP-DIR-CREATE',
      message: 'Failed to create backup directory',
      detail: `${BACKUP_DIR}: ${error.message}`,
      source: 'backup-system',
      severity: 'error',
    };
    registerError(err);
    reportErrorToGitHub(err).catch(() => {});
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
    const err = {
      code: 'ERR-SNAPSHOT-DIR-CREATE',
      message: 'Failed to create snapshot directory',
      detail: `${SNAPSHOT_DIR}: ${error.message}`,
      source: 'backup-system',
      severity: 'error',
    };
    registerError(err);
    reportErrorToGitHub(err).catch(() => {});
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
    const content = await readFileWithSizeLimit(filePath);
    const timestamp = Date.now();
    const baseName = path.basename(filePath);

    // Compute SHA-256 checksum of original
    const checksum = crypto.createHash('sha256').update(content).digest('hex').substring(0, 12);
    const backupFileName = `${baseName}.auto-backup-${timestamp}.sha256-${checksum}.readonly`;
    const backupPath = path.join(BACKUP_DIR, backupFileName);

    await fs.writeFile(backupPath, content, 'utf8');

    // Write-back verification: read backup and compare to original
    const backupContent = await fs.readFile(backupPath, 'utf8');
    if (backupContent !== content) {
      const err = {
        code: 'ERR-BACKUP-INTEGRITY-FAILED',
        message: `Backup integrity check failed for ${filePath}`,
        detail: 'Backup file does not match original content',
        source: 'backup-system',
        severity: 'error',
      };
      registerError(err);
      reportErrorToGitHub(err).catch(() => {});
      console.error('[Backup] Integrity check failed for:', filePath);
      // Delete corrupted backup
      await fs.unlink(backupPath).catch(() => {});
      return null;
    }

    // Verify checksum
    const backupChecksum = crypto
      .createHash('sha256')
      .update(backupContent)
      .digest('hex')
      .substring(0, 12);
    if (backupChecksum !== checksum) {
      const err = {
        code: 'ERR-BACKUP-CHECKSUM-MISMATCH',
        message: `Backup checksum mismatch for ${filePath}`,
        detail: `Original: ${checksum}, Backup: ${backupChecksum}`,
        source: 'backup-system',
        severity: 'error',
      };
      registerError(err);
      reportErrorToGitHub(err).catch(() => {});
      console.error('[Backup] Checksum mismatch for:', filePath);
      await fs.unlink(backupPath).catch(() => {});
      return null;
    }

    return backupPath;
  } catch (error) {
    let errorCode = 'ERR-BACKUP-FILE-WRITE';
    if (error.code === 'ENOENT') errorCode = 'ERR-BACKUP-FILE-READ';
    else if (error.code === 'ENOSPC') errorCode = 'ERR-BACKUP-DISK-FULL';
    else if (error.code === 'EACCES' || error.code === 'EPERM')
      errorCode = 'ERR-BACKUP-PERMISSION-DENIED';

    const err = {
      code: errorCode,
      message: `Failed to create backup for ${filePath}`,
      detail: error.message,
      source: 'backup-system',
      severity: 'error',
    };
    registerError(err);
    reportErrorToGitHub(err).catch(() => {});
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
      const tsA = parseInt(a.match(/auto-backup-(\d+)\.sha256-/)[1], 10);
      const tsB = parseInt(b.match(/auto-backup-(\d+)\.sha256-/)[1], 10);
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
  const content = await readFileWithSizeLimit(backupPath);

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
    } catch (error) {
      const err = {
        code: 'ERR-BACKUP-CLEANUP-FAILED',
        message: `Failed to delete old backup: ${backup}`,
        detail: error.message,
        source: 'backup-system',
        severity: 'warning',
      };
      registerError(err);
      reportErrorToGitHub(err).catch(() => {});
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

    const content = await readFileWithSizeLimit(filePath);
    const timestamp = Date.now();
    const baseName = path.basename(filePath);

    // Compute SHA-256 checksum of original
    const checksum = crypto.createHash('sha256').update(content).digest('hex').substring(0, 12);
    const snapshotFileName = `${baseName}.snapshot-${timestamp}.sha256-${checksum}.readonly`;
    const snapshotPath = path.join(SNAPSHOT_DIR, snapshotFileName);

    await fs.writeFile(snapshotPath, content, 'utf8');

    // Write-back verification: read snapshot and compare to original
    const snapshotContent = await fs.readFile(snapshotPath, 'utf8');
    if (snapshotContent !== content) {
      const err = {
        code: 'ERR-SNAPSHOT-INTEGRITY-FAILED',
        message: `Snapshot integrity check failed for ${filePath}`,
        detail: 'Snapshot file does not match original content',
        source: 'backup-system',
        severity: 'warning',
      };
      registerError(err);
      reportErrorToGitHub(err).catch(() => {});
      console.error('[Snapshot] Integrity check failed for:', filePath);
      // Delete corrupted snapshot
      await fs.unlink(snapshotPath).catch(() => {});
      return null;
    }

    // Verify checksum
    const snapshotChecksum = crypto
      .createHash('sha256')
      .update(snapshotContent)
      .digest('hex')
      .substring(0, 12);
    if (snapshotChecksum !== checksum) {
      const err = {
        code: 'ERR-SNAPSHOT-CHECKSUM-MISMATCH',
        message: `Snapshot checksum mismatch for ${filePath}`,
        detail: `Original: ${checksum}, Snapshot: ${snapshotChecksum}`,
        source: 'backup-system',
        severity: 'warning',
      };
      registerError(err);
      reportErrorToGitHub(err).catch(() => {});
      console.error('[Snapshot] Checksum mismatch for:', filePath);
      await fs.unlink(snapshotPath).catch(() => {});
      return null;
    }

    // Cleanup old snapshots (keep last 5 per file)
    await cleanupOldSnapshots(filePath, 5);

    return snapshotPath;
  } catch (error) {
    const err = {
      code: 'ERR-SNAPSHOT-FAILED',
      message: `Failed to create snapshot for ${filePath}`,
      detail: error.message,
      source: 'backup-system',
      severity: 'warning',
    };
    registerError(err);
    reportErrorToGitHub(err).catch(() => {});
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
      const tsA = parseInt(a.match(/snapshot-(\d+)\.sha256-/)[1], 10);
      const tsB = parseInt(b.match(/snapshot-(\d+)\.sha256-/)[1], 10);
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
    } catch (error) {
      const err = {
        code: 'ERR-SNAPSHOT-CLEANUP-FAILED',
        message: `Failed to delete old snapshot: ${snapshot}`,
        detail: error.message,
        source: 'backup-system',
        severity: 'warning',
      };
      registerError(err);
      reportErrorToGitHub(err).catch(() => {});
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

    const content = await readFileWithSizeLimit(sourcePath);
    await fs.writeFile(filePath, content, 'utf8');

    return {
      success: true,
      message: `Restored from ${fromSnapshot ? 'snapshot' : 'backup'}: ${latest}`,
    };
  } catch (error) {
    const err = {
      code: 'ERR-BACKUP-RESTORE-FAILED',
      message: `Failed to restore ${filePath} from ${fromSnapshot ? 'snapshot' : 'backup'}`,
      detail: error.message,
      source: 'backup-system',
      severity: 'error',
    };
    registerError(err);
    reportErrorToGitHub(err).catch(() => {});
    return { success: false, message: `Restore failed: ${error.message}` };
  }
}

/**
 * Periodic self-test of backup integrity
 * Reads recent backups and verifies checksums
 * Returns health status for systemHealth
 */
export async function runBackupSelfTest() {
  const results = {
    timestamp: Date.now(),
    status: 'ok',
    failures: [],
    tested: 0,
    passed: 0,
  };

  try {
    // Test backups
    await ensureBackupDir();
    const backupFiles = await fs.readdir(BACKUP_DIR);
    const recentBackups = backupFiles.filter((f) => f.endsWith('.readonly')).slice(0, 10);

    for (const backupFile of recentBackups) {
      results.tested++;
      const backupPath = path.join(BACKUP_DIR, backupFile);

      try {
        const content = await fs.readFile(backupPath, 'utf8');
        const checksum = crypto.createHash('sha256').update(content).digest('hex').substring(0, 12);

        // Extract checksum from filename
        const match = backupFile.match(/\.sha256-([a-f0-9]+)\.readonly$/);
        if (match) {
          const fileChecksum = match[1];
          if (fileChecksum !== checksum) {
            results.failures.push({
              file: backupFile,
              error: 'ERR-BACKUP-CHECKSUM-MISMATCH',
              detail: `File: ${fileChecksum}, Computed: ${checksum}`,
            });
            results.status = 'error';
          } else {
            results.passed++;
          }
        } else {
          results.passed++;
        }
      } catch (error) {
        results.failures.push({
          file: backupFile,
          error: 'ERR-BACKUP-UNREADABLE',
          detail: error.message,
        });
        results.status = 'error';
      }
    }

    // Test snapshots
    await ensureSnapshotDir();
    const snapshotFiles = await fs.readdir(SNAPSHOT_DIR);
    const recentSnapshots = snapshotFiles.filter((f) => f.endsWith('.readonly')).slice(0, 10);

    for (const snapshotFile of recentSnapshots) {
      results.tested++;
      const snapshotPath = path.join(SNAPSHOT_DIR, snapshotFile);

      try {
        const content = await fs.readFile(snapshotPath, 'utf8');
        const checksum = crypto.createHash('sha256').update(content).digest('hex').substring(0, 12);

        const match = snapshotFile.match(/\.sha256-([a-f0-9]+)\.readonly$/);
        if (match) {
          const fileChecksum = match[1];
          if (fileChecksum !== checksum) {
            results.failures.push({
              file: snapshotFile,
              error: 'ERR-SNAPSHOT-CHECKSUM-MISMATCH',
              detail: `File: ${fileChecksum}, Computed: ${checksum}`,
            });
            results.status = 'error';
          } else {
            results.passed++;
          }
        } else {
          results.passed++;
        }
      } catch (error) {
        results.failures.push({
          file: snapshotFile,
          error: 'ERR-SNAPSHOT-UNREADABLE',
          detail: error.message,
        });
        results.status = 'error';
      }
    }

    if (results.status === 'error') {
      // Register error for failures
      const err = {
        code: 'ERR-BACKUP-SELF-TEST-FAILED',
        message: `Backup self-test failed: ${results.failures.length} failures`,
        detail: JSON.stringify(results.failures),
        source: 'backup-system',
        severity: 'warning',
      };
      registerError(err);
      reportErrorToGitHub(err).catch(() => {});
    }
  } catch (error) {
    results.status = 'error';
    results.failures.push({
      error: 'ERR-BACKUP-SELF-TEST-ERROR',
      detail: error.message,
    });
    const err = {
      code: 'ERR-BACKUP-SELF-TEST-ERROR',
      message: 'Backup self-test encountered an error',
      detail: error.message,
      source: 'backup-system',
      severity: 'error',
    };
    registerError(err);
    reportErrorToGitHub(err).catch(() => {});
  }

  return results;
}
