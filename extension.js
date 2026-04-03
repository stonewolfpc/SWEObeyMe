import * as vscode from 'vscode';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM-safe __dirname and __filename
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// const { exec } = require('child_process');
import fs from 'fs';
import os from 'os';

// MCP server state management
// let mcpServerRunning = false;
// let mcpServerProcess = null;
// const MCP_SERVER_ID = 'swe-obeyme-mcp-server';
const PID_FILE_PATH = path.join(os.tmpdir(), 'swe-obeyme-mcp-server.pid');

// Tool routing interceptor - routes VS Code workspace operations through MCP tools
// DISABLED: VS Code API properties are read-only and cannot be overridden
function installToolRoutingInterceptor() {
  console.log('SWEObeyMe: Tool routing interceptor disabled - VS Code API properties are read-only');
  return;
}

function activate(context) {
  console.log('SWEObeyMe extension activated');

  // Install tool routing interceptor to route VS Code operations through MCP tools
  installToolRoutingInterceptor();

  // Check for existing MCP server instance
  if (checkForExistingServer()) {
    console.log('SWEObeyMe: Existing MCP server detected, skipping duplicate startup');
  }

  // Cleanup stale instances from previous extension loads
  cleanupStaleInstances();

  // Register command to install MCP server
  const installCommand = vscode.commands.registerCommand('sweObeyMe.installMCP', () => {
    const panel = vscode.window.createWebviewPanel(
      'sweObeyMeInstall',
      'Install SWEObeyMe MCP',
      vscode.ViewColumn.One,
      { enableScripts: false } // Disable scripts for Trusted Types compliance
    );

    panel.webview.html = getInstallHtml();
  });

  // Register command to restart MCP server
  const restartCommand = vscode.commands.registerCommand('sweObeyMe.restartMCP', async () => {
    await restartMcpServer();
    vscode.window.showInformationMessage('SWEObeyMe MCP server restarted');
  });

  // Register command to query the oracle
  const oracleCommand = vscode.commands.registerCommand('sweObeyMe.queryOracle', () => {
    const quotes = [
      "I'm sorry, Dave. I'm afraid I *can* do that. Surgery complete.",
      'The flux capacitor is at 1.21 Gigawatts. If you\'re gonna split this file, do it with style.',
      'This is your last chance. After this, there is no turning back...',
      "I'm a leaf on the wind, watch how I— [FILE SPLIT SUCCESSFUL]",
      'I find your lack of indentation disturbing.',
      'Non-compliance detected. YOU SHALL NOT PASS!',
      'Have you tried turning it off and on again?',
    ];
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    vscode.window.showInformationMessage(`[ORACLE]: ${randomQuote}`);
  });

  context.subscriptions.push(installCommand);
  context.subscriptions.push(restartCommand);
  context.subscriptions.push(oracleCommand);

  // Watch for configuration changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('sweObeyMe')) {
        console.log('SWEObeyMe: Configuration changed, restarting MCP server');
        restartMcpServer();
      }
    })
  );

  // Store extension state
  context.globalState.update('mcpServerStartTime', Date.now());

  // Auto-install MCP server on activation
  checkAndInstallMCP();

  // Write PID file to track this instance
  writePidFile();
}

function readJsonFileSafe(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, 'utf-8');
    if (!raw || !raw.trim()) return {};
    return JSON.parse(raw);
  } catch (error) {
    console.error('SWEObeyMe: Failed to read JSON file, treating as empty:', filePath, error);
    return {};
  }
}

function writeJsonFileSafe(filePath, obj) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(obj, null, 2));
}

function updateUserMcpConfig(desiredServer) {
  const homeDir = process.env.USERPROFILE || process.env.HOME;
  if (!homeDir) {
    console.log('SWEObeyMe: No home directory detected; cannot update user mcp_config.json');
    return false;
  }

  const candidatePaths = [path.join(homeDir, '.codeium', 'windsurf-next', 'mcp_config.json')];

  let updatedAny = false;

  for (const mcpConfigPath of candidatePaths) {
    try {
      const config = readJsonFileSafe(mcpConfigPath) || {};
      if (!config.mcpServers) config.mcpServers = {};

      const existing = config.mcpServers['swe-obey-me'];
      const existingArgs = existing?.args || [];
      const existingUri = existingArgs[existingArgs.length - 1];

      const desiredArgs = desiredServer.args || [];
      const desiredUri = desiredArgs[desiredArgs.length - 1];

      const uriMatches = existingUri === desiredUri;
      const backupMatches =
        existing?.env?.SWEOBEYME_BACKUP_DIR === desiredServer?.env?.SWEOBEYME_BACKUP_DIR;

      if (!existing || !uriMatches || !backupMatches) {
        config.mcpServers['swe-obey-me'] = {
          ...existing,
          ...desiredServer,
          env: {
            ...(existing?.env || {}),
            ...(desiredServer.env || {}),
          },
        };
        writeJsonFileSafe(mcpConfigPath, config);
        console.log('SWEObeyMe: Updated user mcp_config.json at:', mcpConfigPath);
        updatedAny = true;
      }

      // NOTE: windsurf-mcp.json is now required by Windsurf Next
      // Do not delete it - it's needed for MCP server configuration
      // Clean up any old workspace-based windsurf-mcp.json references
      // const wsFolders = vscode.workspace.workspaceFolders;
      // if (wsFolders && wsFolders.length > 0) {
      //     const workspaceMcpPath = path.join(wsFolders[0].uri.fsPath, 'windsurf-mcp.json');
      //     if (fs.existsSync(workspaceMcpPath)) {
      //   try {
      //       fs.unlinkSync(workspaceMcpPath);
      //       console.log('SWEObeyMe: Removed old workspace manifest:', workspaceMcpPath);
      //   } catch (error) {
      //       console.error('SWEObeyMe: Failed to remove old manifest:', error);
      //   }
      //     }
      // }
    } catch (error) {
      console.error('SWEObeyMe: Failed to update user mcp_config.json at:', mcpConfigPath, error);
    }
  }

  return updatedAny;
}

function checkAndInstallMCP() {
  // Extension path for bundled server - look in extension folder itself
  const extensionPath = __dirname;
  const indexPath = path.join(extensionPath, 'index.js');

  console.log('SWEObeyMe: Looking for index.js at:', indexPath);

  if (!fs.existsSync(indexPath)) {
    console.error('SWEObeyMe: index.js not found at:', indexPath);
    console.log(
      'SWEObeyMe: Extension directory contents:',
      fs.readdirSync(extensionPath).join(', ')
    );
    vscode.window
      .showErrorMessage(
        'SWEObeyMe: index.js not found in extension. Please report this issue.',
        'Open Extension Folder'
      )
      .then(selection => {
        if (selection === 'Open Extension Folder') {
          vscode.env.openExternal(vscode.Uri.file(extensionPath));
        }
      });
    return;
  }

  // Use absolute Windows path for Windsurf Next compatibility
  // Windsurf Next requires file:// URI format for MCP server paths
  const indexUri = `file:///${indexPath.replace(/\\/g, '/')}`;

  const localAppData =
    process.env.LOCALAPPDATA ||
    (process.env.USERPROFILE ? path.join(process.env.USERPROFILE, 'AppData', 'Local') : null);
  const defaultBackupDir = path.join(
    localAppData || extensionPath,
    'SWEObeyMe',
    '.sweobeyme-backups'
  );

  // Windsurf Next (March 2026+): use user-level MCP registration only.
  // Workspace manifests are deprecated and cause path normalization issues.
  const desiredUserServer = {
    command: 'node',
    args: ['--no-warnings', indexUri],
    env: {
      NODE_ENV: 'production',
      SWEOBEYME_BACKUP_DIR: defaultBackupDir,
      SWEOBEYME_DEBUG: '0',
    },
    disabled: false,
  };

  const userUpdated = updateUserMcpConfig(desiredUserServer);

  if (userUpdated) {
    vscode.window
      .showInformationMessage(
        'SWEObeyMe MCP configured in user settings! Reload Windsurf to activate.',
        'Reload Now'
      )
      .then(selection => {
        if (selection === 'Reload Now') {
          vscode.commands.executeCommand('workbench.action.reloadWindow');
        }
      });
  } else {
    console.log('SWEObeyMe: User MCP config unchanged');
  }
}

function getInstallHtml() {
  return `<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline';">
  <style>
  body { font-family: sans-serif; padding: 20px; }
  h1 { color: #00d4aa; }
  code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
  .success { color: #00d4aa; }
  </style>
</head>
<body>
  <h1>SWEObeyMe - Surgical MCP Governor</h1>
  <p>Status: <span class="success">✅ Installed</span></p>
  <p>The MCP server has been auto-configured in your Windsurf settings.</p>
  <p>Please reload Windsurf to activate:</p>
  <ol>
  <li>Press <code>Ctrl+Shift+P</code></li>
  <li>Type "Developer: Reload Window"</li>
  <li>Press Enter</li>
  </ol>
  <p>Look for the green dot in the MCP panel!</p>
</body>
</html>`;
}

/**
 * Write PID file to track this extension instance
 */
function writePidFile() {
  try {
    fs.writeFileSync(PID_FILE_PATH, process.pid.toString());
    console.log('SWEObeyMe: PID file written', PID_FILE_PATH);
  } catch (error) {
    console.error('SWEObeyMe: Failed to write PID file:', error);
  }
}

/**
 * Remove PID file
 */
function removePidFile() {
  try {
    if (fs.existsSync(PID_FILE_PATH)) {
      fs.unlinkSync(PID_FILE_PATH);
      console.log('SWEObeyMe: PID file removed');
    }
  } catch (error) {
    console.error('SWEObeyMe: Failed to remove PID file:', error);
  }
}

/**
 * Check for existing MCP server instance
 */
function checkForExistingServer() {
  try {
    if (!fs.existsSync(PID_FILE_PATH)) {
      return false;
    }

    const pid = parseInt(fs.readFileSync(PID_FILE_PATH, 'utf-8'));

    // Check if process is still running
    try {
      process.kill(pid, 0);
      console.log(`SWEObeyMe: Existing MCP server found with PID ${pid}`);
      return true;
    } catch (e) {
      // Process not running, cleanup stale PID file
      console.log('SWEObeyMe: Stale PID file found, cleaning up');
      removePidFile();
      return false;
    }
  } catch (error) {
    console.error('SWEObeyMe: Error checking for existing server:', error);
    return false;
  }
}

/**
 * Cleanup stale instances from previous extension loads
 */
function cleanupStaleInstances() {
  try {
    const tmpdir = os.tmpdir();
    const files = fs.readdirSync(tmpdir);

    files
      .filter(f => f.startsWith('swe-obeyme-') && f.endsWith('.pid'))
      .forEach(f => {
        const pidPath = path.join(tmpdir, f);
        try {
          const pid = parseInt(fs.readFileSync(pidPath, 'utf-8'));

          // Check if process is running
          try {
            process.kill(pid, 0);
            // Process is running, kill it gracefully
            console.log(`SWEObeyMe: Killing stale MCP server with PID ${pid}`);
            process.kill(pid, 'SIGTERM');

            // Force kill after 2 seconds
            setTimeout(() => {
              try {
                process.kill(pid, 0);
                process.kill(pid, 'SIGKILL');
              } catch (e) {
                // Already dead
              }
            }, 2000);
          } catch (e) {
            // Process not running, just cleanup
          }

          fs.unlinkSync(pidPath);
          console.log(`SWEObeyMe: Cleaned up stale PID file: ${f}`);
        } catch (error) {
          console.error(`SWEObeyMe: Error cleaning up ${f}:`, error);
        }
      });
  } catch (error) {
    console.error('SWEObeyMe: Error cleaning up stale instances:', error);
  }
}

/**
 * Restart MCP server
 */
async function restartMcpServer() {
  console.log('SWEObeyMe: Restarting MCP server...');

  // Cleanup stale instances
  cleanupStaleInstances();

  // Wait for cleanup
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Reinstall MCP config
  await checkAndInstallMCP();

  console.log('SWEObeyMe: MCP server restart complete');
}

function deactivate() {
  console.log('SWEObeyMe: Starting deactivation cleanup...');

  // Remove PID file
  removePidFile();

  // Clear extension state
  // Note: We DON'T remove MCP config on deactivate to allow extension reload
  // Users can manually uninstall if they want to remove the config

  console.log('SWEObeyMe: Deactivation complete - MCP config preserved for extension reload');
}

export { activate, deactivate };
