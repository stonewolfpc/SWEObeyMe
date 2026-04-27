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
import * as fs from 'fs';
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
    const { CheckpointManager } = await import(
      toFileUrl(path.join(__dirname, 'lib', 'checkpoint-manager.js'))
    );
    checkpointManager = new CheckpointManager(context);
  }
  return checkpointManager;
}

async function loadProviderManager() {
  if (!providerManager) {
    const { ProviderManager } = await import(
      toFileUrl(path.join(__dirname, 'lib', 'provider-manager.js'))
    );
    providerManager = new ProviderManager();
  }
  return providerManager;
}

async function loadDiffReviewManager() {
  if (!diffReviewManager) {
    const { DiffReviewManager } = await import(
      toFileUrl(path.join(__dirname, 'lib', 'diff-review-manager.js'))
    );
    diffReviewManager = new DiffReviewManager();
  }
  return diffReviewManager;
}

function cleanupOldVersions(currentVersion) {
  try {
    const extBase = path.join(os.homedir(), '.windsurf-next', 'extensions');
    if (!fs.existsSync(extBase)) return;
    const prefix = 'stonewolfpc.swe-obey-me-';
    const current = `${prefix}${currentVersion}`;
    fs.readdirSync(extBase)
      .filter(n => n.startsWith(prefix) && n !== current)
      .forEach(old => {
        try {
          fs.rmSync(path.join(extBase, old), { recursive: true, force: true });
          console.log(`[SWEObeyMe] Removed old version: ${old}`);
        } catch (e) {
          console.warn(`[SWEObeyMe] Could not remove ${old}: ${e.message}`);
        }
      });
  } catch (e) {
    console.warn('[SWEObeyMe] Old version cleanup failed:', e.message);
  }
}

/**
 * Extension activation - Entry point
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
  // [REMOVED BY SWEObeyMe]: Forbidden Pattern('SWEObeyMe extension activated');

  const ext = vscode.extensions.getExtension('stonewolfpc.swe-obey-me');
  const currentVersion = ext?.packageJSON?.version || '5.0.0';
  cleanupOldVersions(currentVersion);

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
        list.map((c) => ({
          label: c.name,
          description: new Date(c.timestamp).toLocaleString(),
          id: c.id,
        })),
        { placeHolder: 'Select a checkpoint' }
      );
      if (pick) vscode.window.showInformationMessage(`Checkpoint: ${pick.label} — ${pick.id}`);
    }),
    vscode.commands.registerCommand('sweObeyMe.checkpoint.revert', async () => {
      const cpMgr = await loadCheckpointManager(context);
      const list = cpMgr.listCheckpoints();
      if (list.length === 0) {
        vscode.window.showInformationMessage('No checkpoints found.');
        return;
      }
      const pick = await vscode.window.showQuickPick(
        list.map((c) => ({
          label: c.name,
          description: new Date(c.timestamp).toLocaleString(),
          id: c.id,
        })),
        { placeHolder: 'Revert to checkpoint' }
      );
      if (pick) await cpMgr.revertToCheckpoint(pick.id);
    }),
    vscode.commands.registerCommand('sweObeyMe.checkpoint.delete', async () => {
      const cpMgr = await loadCheckpointManager(context);
      const list = cpMgr.listCheckpoints();
      if (list.length === 0) {
        vscode.window.showInformationMessage('No checkpoints found.');
        return;
      }
      const pick = await vscode.window.showQuickPick(
        list.map((c) => ({
          label: c.name,
          description: new Date(c.timestamp).toLocaleString(),
          id: c.id,
        })),
        { placeHolder: 'Delete checkpoint' }
      );
      if (pick) {
        cpMgr.deleteCheckpoint(pick.id);
        vscode.window.showInformationMessage(`Deleted: ${pick.label}`);
      }
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
      vscode.window.showInformationMessage(
        'SWEObeyMe v3.0.0 — Surgical Governance Active. Use the sidebar to access Settings, C# Bridge, and Admin Dashboard.'
      );
    }),
    vscode.commands.registerCommand('sweObeyMe.patreonAudit', () => {
      vscode.commands.executeCommand('workbench.action.openSettings', 'sweObeyMe');
    })
  );

  // Wire up C# and C++ Monaco diagnostics
  try {
    const { setupLanguageBridges } = await import(
      toFileUrl(path.join(__dirname, 'lib', 'language-bridge-manager.js'))
    );
    setupLanguageBridges(context, __dirname);
  } catch (err) {
    console.error('[SWEObeyMe] Language bridges failed to load:', err);
  }

  // Register unified v5.0 cockpit provider
  try {
    const { makeCockpitProvider } = await import(
      toFileUrl(path.join(__dirname, 'lib', 'ui', 'providers', 'cockpit-provider.js'))
    );
    const cockpitProvider = makeCockpitProvider(context);
    context.subscriptions.push(
      vscode.window.registerWebviewViewProvider('sweObeyMe.cockpit', cockpitProvider)
    );
  } catch (err) {
    console.error('[SWEObeyMe] Cockpit provider failed to load:', err);
  }
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
