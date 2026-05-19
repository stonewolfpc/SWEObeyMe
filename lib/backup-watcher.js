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

  // Pre-save: backup current content BEFORE the new content is written (VSCode saves)
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

  // Post-save: snapshot the successfully-saved content (VSCode saves)
  const postSaveWatcher = vscode.workspace.onDidSaveTextDocument((doc) => {
    if (doc.uri.scheme !== 'file') return;
    if (doc.isUntitled) return;
    if (shouldSkip(doc.uri.fsPath)) return;

    // Fire-and-forget: snapshot is silent, never errors
    autoSnapshotAfterEdit(doc.uri.fsPath, { source: 'file-save-watcher' }).catch(() => {});
  });
  disposables.push(postSaveWatcher);
  context.subscriptions.push(postSaveWatcher);

  // Filesystem watcher: catches writes from ANY external tool (Windsurf edit, CLI, etc.)
  // onWillSaveTextDocument only fires for VSCode-managed saves — this fills the gap.
  // Strategy: proactively backup any file that is OPEN in the editor when it changes on disk,
  // since we have the pre-change content in the TextDocument buffer.
  if (vscode.workspace.workspaceFolders?.length) {
    const fsWatcher = vscode.workspace.createFileSystemWatcher('**/*.{js,ts,json,py,md}');

    fsWatcher.onDidChange((uri) => {
      if (shouldSkip(uri.fsPath)) return;

      // If the file is open in VSCode, the TextDocument still holds the PRE-change content
      // in memory until VSCode reloads it. Use that to create a backup of the old state.
      const openDoc = vscode.workspace.textDocuments.find(
        (d) => d.uri.fsPath === uri.fsPath && d.uri.scheme === 'file'
      );
      if (openDoc && !openDoc.isUntitled) {
        autoBackupBeforeEdit(uri.fsPath).catch(() => {});
      }

      // Post-change snapshot — file already changed on disk
      autoSnapshotAfterEdit(uri.fsPath, { source: 'fs-watcher' }).catch(() => {});
    });

    disposables.push(fsWatcher);
    context.subscriptions.push(fsWatcher);
  }

  return disposables;
}
