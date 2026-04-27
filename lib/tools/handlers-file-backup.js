/**
 * File Backup Operations Handler
 * Handles backup creation, restoration, and management
 */

import fs from 'fs/promises';
import path from 'path';
import { createErrorResponse, createSuccessResponse } from '../shared/error-utils.js';
import { withTimeout } from '../shared/async-utils.js';
import { toWindsurfUri, normalizePath } from '../utils.js';
import { createBackup, restoreBackup, BACKUP_DIR } from '../backup.js';
import { internalAudit } from '../enforcement.js';
import { getBackupStatus, quickRestore } from '../backup-auto.js';

/**
 * Create a manual backup of a file
 */
export async function createBackupHandler(args) {
  if (!args.path) {
    return createErrorResponse(
      'create_backup',
      new Error('"path" parameter is REQUIRED.'),
      'Parameter validation'
    );
  }

  try {
    const backupPath = await createBackup(args.path);

    if (!backupPath) {
      return createErrorResponse(
        'create_backup',
        new Error(`Backup failed for ${args.path}. File may not exist or backup directory is not writable.`),
        'Backup creation'
      );
    }

    return createSuccessResponse(`Backup created: ${backupPath}`);
  } catch (error) {
    return createErrorResponse('create_backup', error, `Creating backup for: ${args.path}`);
  }
}

/**
 * Restore a file from backup
 */
export async function restoreBackupHandler(args) {
  if (!args.path) {
    return createErrorResponse(
      'restore_backup',
      new Error('"path" parameter is REQUIRED.'),
      'Parameter validation'
    );
  }

  const backupIndex = args.backup_index || 0;

  try {
    // List available backups
    const files = await withTimeout(fs.readdir(BACKUP_DIR), 10000, 'list backups');
    const baseName = path.basename(args.path);
    const backups = files.filter((f) => f.startsWith(baseName + '.backup-'));

    if (backups.length === 0) {
      return createErrorResponse(
        'restore_backup',
        new Error(`No backups found for ${args.path}`),
        'Backup lookup',
        { expected: true }
      );
    }

    // Sort by timestamp (newest first)
    backups.sort((a, b) => {
      const tsA = parseInt(a.match(/-(\d+)\.readonly$/)?.[1] || 0, 10);
      const tsB = parseInt(b.match(/-(\d+)\.readonly$/)?.[1] || 0, 10);
      return tsB - tsA;
    });

    if (backupIndex >= backups.length) {
      return createErrorResponse(
        'restore_backup',
        new Error(`Invalid backup index ${backupIndex}. Only ${backups.length} backup(s) available (0-${backups.length - 1}).`),
        'Backup index validation'
      );
    }

    const backupFile = backups[backupIndex];
    const backupPath = path.join(BACKUP_DIR, backupFile);

    // Read backup content
    const content = await withTimeout(
      fs.readFile(backupPath, 'utf-8'),
      30000,
      'read backup'
    );

    // Restore the file
    await withTimeout(
      fs.writeFile(args.path, content, 'utf-8'),
      30000,
      'restore file'
    );

    return createSuccessResponse(
      `Restored ${args.path} (URI: ${normalizePath(args.path)}) from backup ${backupFile}`
    );
  } catch (error) {
    return createErrorResponse('restore_backup', error, `Restoring backup for: ${args.path}`);
  }
}

/**
 * List backups for a file
 */
export async function listBackupsHandler(args) {
  if (!args.path) {
    return createErrorResponse(
      'list_backups',
      new Error('"path" parameter is REQUIRED.'),
      'Parameter validation'
    );
  }

  try {
    const files = await withTimeout(fs.readdir(BACKUP_DIR), 10000, 'list backups');
    const baseName = path.basename(args.path);
    const backups = files.filter((f) => f.startsWith(baseName + '.backup-'));

    if (backups.length === 0) {
      return createSuccessResponse(`No backups found for ${args.path}`);
    }

    // Sort by timestamp (newest first)
    backups.sort((a, b) => {
      const tsA = parseInt(a.match(/-(\d+)\.readonly$/)?.[1] || 0, 10);
      const tsB = parseInt(b.match(/-(\d+)\.readonly$/)?.[1] || 0, 10);
      return tsB - tsA;
    });

    const formatted = backups.map((f, i) => {
      const ts = parseInt(f.match(/-(\d+)\.readonly$/)?.[1] || 0, 10);
      const date = new Date(ts).toLocaleString();
      return `${i}. ${f} (${date})`;
    }).join('\n');

    return createSuccessResponse(
      `Found ${backups.length} backup(s) for ${args.path}:\n\n${formatted}`
    );
  } catch (error) {
    return createErrorResponse('list_backups', error, `Listing backups for: ${args.path}`);
  }
}

/**
 * Dispatcher: backup_manage swiss-army-knife handler
 * Consolidates all backup operations into single tool
 */
export async function backupManageHandler(params) {
  const { operation, path, backup_index, from_snapshot } = params;

  if (!operation) {
    return createErrorResponse(
      'backup_manage',
      new Error('operation parameter is required (create, restore, list, undo, info, quick_restore)'),
      'Parameter validation'
    );
  }

  switch (operation) {
    case 'create':
      return await createBackupHandler({ path });
    case 'restore':
      return await restoreBackupHandler({ path, backup_index });
    case 'undo':
      return await restoreBackupHandler({ path, backup_index: 0 });
    case 'list':
      return await listBackupsHandler({ path });
    case 'info':
      return await backupStatusHandler({ path });
    case 'quick_restore':
      return await quickRestoreHandler({ path, from_snapshot });
    default:
      return createErrorResponse(
        'backup_manage',
        new Error(`Unknown operation: ${operation}. Valid: create, restore, list, undo, info, quick_restore`),
        'Operation validation'
      );
  }
}

/**
 * Quick restore from most recent backup or snapshot
 * AI uses this to quickly restore after corruption
 */
export async function quickRestoreHandler(args) {
  if (!args.path) {
    return createErrorResponse(
      'quick_restore',
      new Error('"path" parameter is REQUIRED.'),
      'Parameter validation'
    );
  }

  const fromSnapshot = args.from_snapshot === true;

  try {
    const result = await quickRestore(args.path, fromSnapshot);

    if (!result.success) {
      return createErrorResponse('quick_restore', new Error(result.message), 'Restore operation');
    }

    return createSuccessResponse(result.message);
  } catch (error) {
    return createErrorResponse('quick_restore', error, `Quick restore for: ${args.path}`);
  }
}

/**
 * Get backup status for a file
 * AI uses this to check backup availability before edits
 */
export async function backupStatusHandler(args) {
  if (!args.path) {
    return createErrorResponse(
      'backup_status',
      new Error('"path" parameter is REQUIRED.'),
      'Parameter validation'
    );
  }

  try {
    const status = await getBackupStatus(args.path);

    if (!status.hasBackup && !status.hasSnapshot) {
      return createSuccessResponse(
        `No backups or snapshots for ${path.basename(args.path)}\nNext edit will auto-create backup.`
      );
    }

    let message = `Backup Status for ${path.basename(args.path)}:\n\n`;
    message += `Backups: ${status.backupCount}\n`;
    message += `Snapshots: ${status.snapshotCount}\n`;
    if (status.latestBackup) {
      message += `Latest Backup: ${status.latestBackup}\n`;
    }
    if (status.latestSnapshot) {
      message += `Latest Snapshot: ${status.latestSnapshot}\n`;
    }
    message += `\nUse quick_restore to recover from corruption.`;

    return createSuccessResponse(message);
  } catch (error) {
    return createErrorResponse('backup_status', error, `Checking status for: ${args.path}`);
  }
}
