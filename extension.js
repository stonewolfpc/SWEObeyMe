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
async function loadCheckpointManager() {
  if (!checkpointManager) {
    const { CheckpointManager } = await import(toFileUrl(path.join(__dirname, 'lib', 'checkpoint-manager.js')));
    checkpointManager = new CheckpointManager();
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
    const cpMgr = await loadCheckpointManager();
    if (cpMgr.initialize) {
      await cpMgr.initialize(context);
    }
  } catch (err) {
    console.error('[SWEObeyMe] Checkpoint manager failed to load:', err);
  }

  // Initialize provider manager
  try {
    const pMgr = await loadProviderManager();
    if (pMgr.initialize) {
      await pMgr.initialize(context);
    }
  } catch (err) {
    console.error('[SWEObeyMe] Provider manager failed to load:', err);
  }

  // Initialize diff review manager
  try {
    const drMgr = await loadDiffReviewManager();
    if (drMgr.initialize) {
      await drMgr.initialize(context);
    }
  } catch (err) {
    console.error('[SWEObeyMe] Diff review manager failed to load:', err);
  }

  // Register webview providers
  const { makeWebviewProvider } = await import(toFileUrl(path.join(__dirname, 'lib', 'ui', 'providers', 'webview-provider-factory.js')));
  const { getSettingsHtml } = await import(toFileUrl(path.join(__dirname, 'lib', 'ui', 'generators', 'settings-html.js')));
  const { getCSharpBridgeHtml } = await import(toFileUrl(path.join(__dirname, 'lib', 'ui', 'generators', 'csharp-bridge-html.js')));
  const { getAdminDashboardHtml } = await import(toFileUrl(path.join(__dirname, 'lib', 'ui', 'generators', 'admin-dashboard-html.js')));

  // Settings panel provider
  const settingsProvider = makeWebviewProvider(getSettingsHtml);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('sweObeyMe.settings', settingsProvider)
  );

  // C# Bridge panel provider
  const csharpProvider = makeWebviewProvider(getCSharpBridgeHtml);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('sweObeyMe.csharpBridge', csharpProvider)
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
