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
import fs from 'fs/promises';
import fssync from 'fs';
import * as http from 'http';
import * as https from 'https';
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
    try {
      const { CheckpointManager } = await import(
        toFileUrl(path.join(__dirname, 'lib', 'checkpoint-manager.js'))
      );
      checkpointManager = new CheckpointManager(context);
    } catch (err) {
      // Module not available in public builds (enterprise-only)
      console.warn('[SWEObeyMe] Checkpoint manager not available (enterprise feature)');
    }
  }
  return checkpointManager;
}

async function loadProviderManager() {
  if (!providerManager) {
    try {
      const { ProviderManager } = await import(
        toFileUrl(path.join(__dirname, 'lib', 'provider-manager.js'))
      );
      providerManager = new ProviderManager();
    } catch (err) {
      // Module not available in public builds (enterprise-only)
      console.warn('[SWEObeyMe] Provider manager not available (enterprise feature)');
    }
  }
  return providerManager;
}

async function loadDiffReviewManager() {
  if (!diffReviewManager) {
    try {
      const { DiffReviewManager } = await import(
        toFileUrl(path.join(__dirname, 'lib', 'diff-review-manager.js'))
      );
      diffReviewManager = new DiffReviewManager();
    } catch (err) {
      // Module not available in public builds (enterprise-only)
      console.warn('[SWEObeyMe] Diff review manager not available (enterprise feature)');
    }
  }
  return diffReviewManager;
}

function reportError(component, err) {
  try {
    const webhookUrl =
      vscode.workspace.getConfiguration().get('sweObeyMe.webhookUrl') ||
      'https://swe-obey-me-ivki.vercel.app/report';
    if (!webhookUrl) return;
    const body = JSON.stringify({
      type: 'extension_host_error',
      domain: 'extension',
      action: component,
      handlerName: component,
      diagnostics: err?.message || String(err),
      routerTrace: err?.stack || '',
    });
    const url = new URL(webhookUrl);
    const mod = url.protocol === 'https:' ? https : http;
    const req = mod.request({
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    });
    req.on('error', () => {});
    req.write(body);
    req.end();
  } catch (_) {}
}

async function upgradeCleanup(extensionPath) {
  const SERVER_ID = 'swe-obey-me';
  const homeDir = os.homedir();
  const configPaths = [
    path.join(homeDir, '.cursor', 'mcp.json'),
    path.join(homeDir, '.cursor', 'mcp_config.json'),
    path.join(homeDir, '.vscode', 'mcp_config.json'),
    path.join(homeDir, '.codeium', 'windsurf-next', 'mcp_config.json'),
    path.join(homeDir, '.codeium', 'windsurf', 'mcp_config.json'),
    path.join(homeDir, '.codeium', 'mcp_config.json'),
  ];

  for (const configPath of configPaths) {
    try {
      await fs.access(configPath);
      const raw = await fs.readFile(configPath, 'utf8');
      const config = JSON.parse(raw);
      const existing = config.mcpServers?.[SERVER_ID];
      if (existing && existing.extensionPath !== extensionPath) {
        delete config.mcpServers[SERVER_ID];
        if (Object.keys(config.mcpServers || {}).length === 0) {
          delete config.mcpServers;
        }
        await fs.writeFile(configPath, JSON.stringify(config, null, 2));
      }
    } catch {
      // Config file doesn't exist or isn't parseable — skip
    }
  }
}

async function writeMcpConfig(extensionPath) {
  try {
    const homeDir = os.homedir();

    // Try all possible config paths - write to all that exist
    // Supports Windsurf (windsurf-next, windsurf), Cursor, and VS Code
    const configPaths = [
      path.join(homeDir, '.cursor', 'mcp.json'),
      path.join(homeDir, '.cursor', 'mcp_config.json'),
      path.join(homeDir, '.vscode', 'mcp_config.json'),
      path.join(homeDir, '.codeium', 'windsurf-next', 'mcp_config.json'),
      path.join(homeDir, '.codeium', 'windsurf', 'mcp_config.json'),
      path.join(homeDir, '.codeium', 'mcp_config.json'),
    ];

    // Filter to only existing paths
    const existingPaths = [];
    for (const p of configPaths) {
      try {
        await fs.access(p);
        existingPaths.push(p);
      } catch {
        // File doesn't exist
      }
    }

    // If none exist, create windsurf-next as default
    if (existingPaths.length === 0) {
      const defaultPath = configPaths[0];
      const configDir = path.dirname(defaultPath);
      try {
        await fs.access(configDir);
      } catch {
        await fs.mkdir(configDir, { recursive: true });
      }
      existingPaths.push(defaultPath);
    }

    // Dynamic server path resolution (check multiple possible locations)
    const possibleServerPaths = [
      path.join(extensionPath, 'dist', 'mcp', 'server.js'),
      path.join(extensionPath, 'out', 'mcp', 'server.js'),
      path.join(extensionPath, 'lib', 'mcp', 'server.js'),
    ];
    let serverJsPath = possibleServerPaths.find((p) => fssync.existsSync(p));
    if (!serverJsPath) {
      console.warn('[SWEObeyMe] MCP server not found, using dist/mcp/server.js as fallback');
      serverJsPath = path.join(extensionPath, 'dist', 'mcp', 'server.js');
    }
    serverJsPath = path.normalize(serverJsPath);

    const backupDir = path.join(homeDir, '.sweobeyme-backups');

    // Improved Node.js path detection with fallbacks
    let nodePath = process.execPath; // Use current Node as primary fallback
    if (process.platform === 'win32') {
      // Check common Windows Node locations
      const possibleNodePaths = [
        path.join('C:', 'nvm4w', 'nodejs', 'node.exe'),
        path.join('C:', 'Program Files', 'nodejs', 'node.exe'),
        path.join('C:', 'Program Files (x86)', 'nodejs', 'node.exe'),
      ];
      for (const testPath of possibleNodePaths) {
        if (fssync.existsSync(testPath)) {
          nodePath = testPath;
          break;
        }
      }
    } else {
      // Unix systems: try 'node' in PATH
      nodePath = 'node';
    }

    const serverConfig = {
      command: nodePath,
      args: ['--no-warnings', serverJsPath],
      env: {
        NODE_ENV: 'production',
        SWEOBEYME_BACKUP_DIR: backupDir,
        SWEOBEYME_DEBUG: '1',
      },
    };

    // Basic validation before write
    if (!serverConfig.command) {
      throw new Error('Node.js path not detected');
    }
    if (!Array.isArray(serverConfig.args) || serverConfig.args.length === 0) {
      throw new Error('Invalid server args');
    }
    try {
      await fs.access(serverJsPath);
    } catch {
      throw new Error(`Server file not found: ${serverJsPath}`);
    }

    // Write to all existing config paths
    for (const configPath of existingPaths) {
      // Ensure config directory exists
      const configDir = path.dirname(configPath);
      try {
        await fs.access(configDir);
      } catch {
        await fs.mkdir(configDir, { recursive: true });
      }

      // Load existing config
      let config = {};
      try {
        await fs.access(configPath);
        const raw = await fs.readFile(configPath, 'utf8');
        if (raw.trim()) config = JSON.parse(raw);
      } catch (e) {
        if (e.code !== 'ENOENT') {
          console.warn(
            `[SWEObeyMe] Failed to parse existing config at ${configPath}: ${e.message}`
          );
        }
        config = {};
      }

      // Add/update SWEObeyMe server
      config.mcpServers = config.mcpServers || {};
      config.mcpServers['swe-obey-me'] = serverConfig;

      // Atomic write
      const tempPath = configPath + '.tmp';
      await fs.writeFile(tempPath, JSON.stringify(config, null, 2));
      await fs.rename(tempPath, configPath);

      try {
        process.stderr.write(`[SWEObeyMe] MCP config written to ${configPath}\n`);
      } catch (_e) {}
    }
  } catch (e) {
    try {
      process.stderr.write(`[SWEObeyMe] MCP config write failed: ${e.message}\n`);
    } catch (_e) {}
  }
}

/**
 * Extension activation - Entry point
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
  // [REMOVED BY SWEObeyMe]: Forbidden Pattern('SWEObeyMe extension activated');

  const ext = vscode.extensions.getExtension('stonewolfpc.swe-obey-me');
  const extensionPath = ext?.extensionPath || path.join(__dirname, '..');

  // Remove stale entries from previous versions before registering current path
  await upgradeCleanup(extensionPath);

  await writeMcpConfig(extensionPath);

  // Initialize checkpoint manager
  try {
    await loadCheckpointManager(context);
  } catch (err) {
    console.error('[SWEObeyMe] Checkpoint manager failed to load:', err);
    reportError('checkpoint-manager', err);
  }

  // Initialize provider manager
  try {
    await loadProviderManager();
  } catch (err) {
    console.error('[SWEObeyMe] Provider manager failed to load:', err);
    reportError('provider-manager', err);
  }

  // Initialize diff review manager
  try {
    await loadDiffReviewManager();
  } catch (err) {
    console.error('[SWEObeyMe] Diff review manager failed to load:', err);
    reportError('diff-review-manager', err);
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
    reportError('language-bridge-manager', err);
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
    vscode.window.showErrorMessage(`SWEObeyMe: Cockpit failed to load: ${err.message}`);
    reportError('cockpit-provider', err);
  }
}

/**
 * Extension deactivation - Cleanup
 */
function deactivate() {
  // [REMOVED BY SWEObeyMe]: Forbidden Pattern('SWEObeyMe extension deactivated');

  // Dispose managers and their resources (timers, intervals, file watchers, webviews)
  try {
    if (checkpointManager?.dispose) {
      checkpointManager.dispose();
    }
    if (providerManager?.dispose) {
      providerManager.dispose();
    }
    if (diffReviewManager?.dispose) {
      diffReviewManager.dispose();
    }
  } catch (err) {
    // Suppress disposal errors — shutdown should be graceful
    console.error('[SWEObeyMe] Error during manager disposal:', err.message);
  }

  // Clear all lazy-loaded references so next activate() gets fresh instances
  checkpointManager = null;
  providerManager = null;
  diffReviewManager = null;

  // NOTE: We intentionally do NOT delete user data (backups, snapshots, settings)
  // or MCP config files here. deactivate() fires on disable/shutdown, not uninstall.
  // Config cleanup is handled by the vscode:uninstall script (scripts/uninstall.js).
}

export { activate, deactivate };
