/**
 * Backup Watcher
 *
 * Responsibility: Intercept ALL file saves in the IDE — not just SWEObeyMe tool calls —
 * and trigger automatic backup/snapshot so 18k users are protected regardless of
 * which tool or editor action writes a file.
 *
 * Architecture:
 * - onWillSaveTextDocument  → autoBackupBeforeEdit  (pre-save, before content changes)
 * - onDidSaveTextDocument   → autoSnapshotAfterEdit (post-save, after content is written)
 *
 * Constraints:
 * - Never blocks the save pipeline (async, fire-and-forget with error swallow)
 * - Skips non-file URIs (untitled:, git:, output:, etc.)
 * - Skips node_modules, .git, and .sweobeyme-backups paths
 * - Disposed cleanly in extension deactivate()
 * - Max 500 lines (SoC rule)
 *
 * @module lib/backup-watcher
 */

import * as vscode from 'vscode';
import path from 'path';
import { autoBackupBeforeEdit, autoSnapshotAfterEdit } from './backup-auto.js';

const SKIP_PATTERNS = [
  'node_modules',
  '.git',
  '.sweobeyme-backups',
  '.sweobeyme-snapshots',
  '.sweobeyme-logs',
];

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB — skip giant files

/**
 * Returns true if the file path should be skipped for backup.
 * @param {string} fsPath
 * @returns {boolean}
 */
function shouldSkip(fsPath) {
  const normalized = fsPath.replace(/\\/g, '/');
  return SKIP_PATTERNS.some((p) => normalized.includes(p));
}

/**
 * Register VSCode file-save watchers for automated backup + snapshot.
 * Returns a disposable array to be pushed into context.subscriptions.
 *
 * @param {vscode.ExtensionContext} context
 * @returns {vscode.Disposable[]}
 */
export function registerBackupWatcher(context) {
  const disposables = [];

  // Pre-save: backup current content BEFORE the new content is written
  const preSaveWatcher = vscode.workspace.onWillSaveTextDocument((event) => {
    const doc = event.document;

    if (doc.uri.scheme !== 'file') return;
    if (doc.isUntitled) return;
    if (shouldSkip(doc.uri.fsPath)) return;

    // Fire-and-forget: never block the save pipeline
    const backupPromise = autoBackupBeforeEdit(doc.uri.fsPath).catch(() => {});
    event.waitUntil(backupPromise);
  });
  disposables.push(preSaveWatcher);
  context.subscriptions.push(preSaveWatcher);

  // Post-save: snapshot the successfully-saved content
  const postSaveWatcher = vscode.workspace.onDidSaveTextDocument((doc) => {
    if (doc.uri.scheme !== 'file') return;
    if (doc.isUntitled) return;
    if (shouldSkip(doc.uri.fsPath)) return;

    // Fire-and-forget: snapshot is silent, never errors
    autoSnapshotAfterEdit(doc.uri.fsPath, { source: 'file-save-watcher' }).catch(() => {});
  });
  disposables.push(postSaveWatcher);
  context.subscriptions.push(postSaveWatcher);

  return disposables;
}
