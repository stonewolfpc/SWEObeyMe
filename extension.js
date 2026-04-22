/**
 * SWEObeyMe VS Code Extension - Entry Point
 * 
 * Responsibility: Extension lifecycle management only
 * Follows SoC: Delegates all UI and business logic to extracted modules
 * 
 * @module extension
 * @version 3.0.0
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';
import { fileURLToPath, pathToFileURL } from 'url';

// ESM-safe __dirname with Windows path handling
let __dirname;
try {
  const __filename = fileURLToPath(import.meta.url);
  __dirname = path.dirname(__filename);
} catch (e) {
  __dirname = process.cwd();
}

// Convert filesystem path to file:// URL for dynamic imports
const toFileUrl = (p) => {
  try {
    return pathToFileURL(p).href;
  } catch (e) {
    if (process.platform === 'win32' && path.isAbsolute(p)) {
      return `file:///${p.replace(/\\/g, '/')}`;
    }
    return `file://${path.isAbsolute(p) ? p : path.resolve(p)}`;
  }
};

// Import managers (lazy-loaded)
let checkpointManager = null;
let providerManager = null;
let diffReviewManager = null;

// Lazy load modules to reduce startup time
async function loadCheckpointManager(context) {
  if (!checkpointManager) {
    const { CheckpointManager } = await import(toFileUrl(path.join(__dirname, 'lib', 'checkpoint-manager.js')));
    checkpointManager = new CheckpointManager(context);
  }
  return checkpointManager;
}

async function loadProviderManager() {
  if (!providerManager) {
    const { ProviderManager } = await import(toFileUrl(path.join(__dirname, 'lib', 'provider-manager.js')));
    providerManager = new ProviderManager();
  }
  return providerManager;
}

async function loadDiffReviewManager() {
  if (!diffReviewManager) {
    const { DiffReviewManager } = await import(toFileUrl(path.join(__dirname, 'lib', 'diff-review-manager.js')));
    diffReviewManager = new DiffReviewManager();
  }
  return diffReviewManager;
}

/**
 * Extension activation - Entry point
 * @param {vscode.ExtensionContext} context 
 */
async function activate(context) {
  // [REMOVED BY SWEObeyMe]: Forbidden Pattern('SWEObeyMe extension activated');

  // Initialize checkpoint manager
  try {
    await loadCheckpointManager(context);
  } catch (err) {
    console.error('[SWEObeyMe] Checkpoint manager failed to load:', err);
  }

  // Initialize provider manager
  try {
    await loadProviderManager();
  } catch (err) {
    console.error('[SWEObeyMe] Provider manager failed to load:', err);
  }

  // Initialize diff review manager
  try {
    await loadDiffReviewManager();
  } catch (err) {
    console.error('[SWEObeyMe] Diff review manager failed to load:', err);
  }

  // Register all commands declared in package.json
  context.subscriptions.push(
    vscode.commands.registerCommand('sweObeyMe.checkpoint.create', async () => {
      const name = await vscode.window.showInputBox({ prompt: 'Checkpoint name' });
      if (name) {
        const cpMgr = await loadCheckpointManager(context);
        const id = await cpMgr.createCheckpoint(name, '');
        vscode.window.showInformationMessage(`Checkpoint created: ${name} (${id})`);
      }
    }),
    vscode.commands.registerCommand('sweObeyMe.checkpoint.list', async () => {
      const cpMgr = await loadCheckpointManager(context);
      const list = cpMgr.listCheckpoints();
      if (list.length === 0) {
        vscode.window.showInformationMessage('No checkpoints found.');
        return;
      }
      const pick = await vscode.window.showQuickPick(
        list.map(c => ({ label: c.name, description: new Date(c.timestamp).toLocaleString(), id: c.id })),
        { placeHolder: 'Select a checkpoint' }
      );
      if (pick) vscode.window.showInformationMessage(`Checkpoint: ${pick.label} — ${pick.id}`);
    }),
    vscode.commands.registerCommand('sweObeyMe.checkpoint.revert', async () => {
      const cpMgr = await loadCheckpointManager(context);
      const list = cpMgr.listCheckpoints();
      if (list.length === 0) { vscode.window.showInformationMessage('No checkpoints found.'); return; }
      const pick = await vscode.window.showQuickPick(
        list.map(c => ({ label: c.name, description: new Date(c.timestamp).toLocaleString(), id: c.id })),
        { placeHolder: 'Revert to checkpoint' }
      );
      if (pick) await cpMgr.revertToCheckpoint(pick.id);
    }),
    vscode.commands.registerCommand('sweObeyMe.checkpoint.delete', async () => {
      const cpMgr = await loadCheckpointManager(context);
      const list = cpMgr.listCheckpoints();
      if (list.length === 0) { vscode.window.showInformationMessage('No checkpoints found.'); return; }
      const pick = await vscode.window.showQuickPick(
        list.map(c => ({ label: c.name, description: new Date(c.timestamp).toLocaleString(), id: c.id })),
        { placeHolder: 'Delete checkpoint' }
      );
      if (pick) { cpMgr.deleteCheckpoint(pick.id); vscode.window.showInformationMessage(`Deleted: ${pick.label}`); }
    }),
    vscode.commands.registerCommand('sweObeyMe.showMenu', () => {
      vscode.commands.executeCommand('workbench.view.extension.sweObeyMe');
    }),
    vscode.commands.registerCommand('sweObeyMe.csharpSettings', () => {
      vscode.commands.executeCommand('workbench.action.openSettings', 'sweObeyMe.csharpBridge');
    }),
    vscode.commands.registerCommand('sweObeyMe.openCSharpSettings', () => {
      vscode.commands.executeCommand('workbench.action.openSettings', 'sweObeyMe.csharpBridge');
    }),
    vscode.commands.registerCommand('sweObeyMe.analyzeCSharp', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || editor.document.languageId !== 'csharp') {
        vscode.window.showWarningMessage('Open a C# file first.');
        return;
      }
      vscode.window.showInformationMessage('[SWEObeyMe] Analyzing C# file...');
    }),
    vscode.commands.registerCommand('sweObeyMe.analyzeCpp', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || !['cpp', 'c'].includes(editor.document.languageId)) {
        vscode.window.showWarningMessage('Open a C or C++ file first.');
        return;
      }
      vscode.window.showInformationMessage('[SWEObeyMe] Analyzing C++ file...');
    }),
    vscode.commands.registerCommand('sweObeyMe.showDiagnostics', () => {
      vscode.commands.executeCommand('workbench.actions.view.problems');
    }),
    vscode.commands.registerCommand('sweObeyMe.gitStatus', async () => {
      const terminal = vscode.window.createTerminal('SWEObeyMe Git');
      terminal.show();
      terminal.sendText('git status');
    }),
    vscode.commands.registerCommand('sweObeyMe.gitBranch', async () => {
      const terminal = vscode.window.createTerminal('SWEObeyMe Git');
      terminal.show();
      terminal.sendText('git branch -a');
    }),
    vscode.commands.registerCommand('sweObeyMe.queryOracle', () => {
      vscode.window.showInformationMessage('[Oracle] The path is clear. The code is ready.');
    }),
    vscode.commands.registerCommand('sweObeyMe.showOnboarding', () => {
      vscode.window.showInformationMessage('SWEObeyMe v3.0.0 — Surgical Governance Active. Use the sidebar to access Settings, C# Bridge, and Admin Dashboard.');
    }),
    vscode.commands.registerCommand('sweObeyMe.patreonAudit', () => {
      vscode.commands.executeCommand('workbench.action.openSettings', 'sweObeyMe');
    }),
  );

  // Wire up C# and C++ Monaco diagnostics
  try {
    const { setupLanguageBridges } = await import(toFileUrl(path.join(__dirname, 'lib', 'language-bridge-manager.js')));
    setupLanguageBridges(context, __dirname);
  } catch (err) {
    console.error('[SWEObeyMe] Language bridges failed to load:', err);
  }

  // Register webview providers
  const { makeWebviewProvider } = await import(toFileUrl(path.join(__dirname, 'lib', 'ui', 'providers', 'webview-provider-factory.js')));
  const { getSettingsHtml } = await import(toFileUrl(path.join(__dirname, 'lib', 'ui', 'generators', 'settings-html.js')));
  const { getCSharpBridgeHtml } = await import(toFileUrl(path.join(__dirname, 'lib', 'ui', 'generators', 'csharp-bridge-html.js')));
  const { getAdminDashboardHtml } = await import(toFileUrl(path.join(__dirname, 'lib', 'ui', 'generators', 'admin-dashboard-html.js')));

  // Settings panel provider
  const settingsProvider = makeWebviewProvider(getSettingsHtml);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('sweObeyMe.csharpSettings', settingsProvider)
  );

  // C# Bridge panel provider (async wrapper for template loading)
  const csharpProvider = makeWebviewProvider(async (webview) => {
    return await getCSharpBridgeHtml(webview);
  });
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('sweObeyMe.csharpSettingsView', csharpProvider)
  );

  // Admin Dashboard panel provider
  const adminProvider = makeWebviewProvider(getAdminDashboardHtml);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('sweObeyMe.adminDashboard', adminProvider)
  );

  // [REMOVED BY SWEObeyMe]: Forbidden Pattern('SWEObeyMe providers registered');
}

/**
 * Extension deactivation - Cleanup
 */
function deactivate() {
  // [REMOVED BY SWEObeyMe]: Forbidden Pattern('SWEObeyMe extension deactivated');
  
  // Clean up managers
  if (checkpointManager?.dispose) checkpointManager.dispose();
  if (providerManager?.dispose) providerManager.dispose();
  if (diffReviewManager?.dispose) diffReviewManager.dispose();
  
  checkpointManager = null;
  providerManager = null;
  diffReviewManager = null;
}

export { activate, deactivate };
