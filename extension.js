import * as vscode from 'vscode';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

// ESM-safe __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function activate(context) {
  console.log('SWEObeyMe extension activated');

  // Get the installed extension path dynamically
  const extensionPath = context.extensionUri.fsPath;
  const indexPath = path.join(extensionPath, 'index.js');

  const localAppData =
    process.env.LOCALAPPDATA ||
    (process.env.USERPROFILE ? path.join(process.env.USERPROFILE, 'AppData', 'Local') : null);
  const defaultBackupDir = path.join(
    localAppData || extensionPath,
    'SWEObeyMe',
    '.sweobeyme-backups'
  );

  // Only auto-configure if running from installed location (not workspace)
  const isInstalled = extensionPath.includes('.windsurf-next\\extensions') || 
                      extensionPath.includes('.vscode\\extensions');
  
  if (isInstalled) {
    // Use os.homedir() for cross-platform compatibility
    const configDir = path.join(os.homedir(), '.codeium', 'windsurf-next');
    const mcpConfigPath = path.resolve(path.join(configDir, 'mcp_config.json'));
    
    console.log('[SWEObeyMe] MCP config path (absolute):', mcpConfigPath);

    try {
      const fs = await import('fs');
      let needsUpdate = false;
      let config = {};

      if (fs.existsSync(mcpConfigPath)) {
        const raw = fs.readFileSync(mcpConfigPath, 'utf8');
        if (raw.trim()) {
          try {
            config = JSON.parse(raw);
          } catch (e) {
            needsUpdate = true;
          }
        } else {
          needsUpdate = true;
        }
        
        if (!needsUpdate) {
          const existingServer = config.mcpServers?.['swe-obey-me'];
          if (existingServer) {
            const existingPath = existingServer.args?.[existingServer.args.length - 1];
            const configuredPath = existingPath?.replace(/\//g, '\\');
            if (configuredPath && !fs.existsSync(configuredPath)) {
              needsUpdate = true;
            }
          } else {
            needsUpdate = true;
          }
        }
      } else {
        needsUpdate = true;
      }

      if (needsUpdate) {
        config.mcpServers = config.mcpServers || {};
        config.mcpServers['swe-obey-me'] = {
          command: 'node',
          args: ['--no-warnings', indexPath],
          env: {
            NODE_ENV: 'production',
            SWEOBEYME_BACKUP_DIR: defaultBackupDir,
            SWEOBEYME_DEBUG: '0',
          },
          disabled: false,
        };
        
        const dir = path.dirname(mcpConfigPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(mcpConfigPath, JSON.stringify(config, null, 2));
        
        vscode.window.showInformationMessage(
          'SWEObeyMe MCP configured! Reload Windsurf to activate.',
          'Reload Now'
        ).then(selection => {
          if (selection === 'Reload Now') {
            vscode.commands.executeCommand('workbench.action.reloadWindow');
          }
        });
      }
    } catch (error) {
      console.error('SWEObeyMe: Failed to auto-configure MCP:', error);
    }
  }

  // Register command to query the oracle
  const oracleCommand = vscode.commands.registerCommand('sweObeyMe.queryOracle', () => {
    const quotes = [
      "I'm sorry, Dave. I'm afraid I *can* do that. Surgery complete.",
      'The flux capacitor is at 1.21 Gigawatts. If you\'re gonna split this file, do it with style.',
      'Your last chance. After this, there is no turning back...',
      "I'm a leaf on the wind, watch how I— [FILE SPLIT SUCCESSFUL]",
      'I find your lack of indentation disturbing.',
      'Non-compliance detected. YOU SHALL NOT PASS!',
      'Have you tried turning it off and on again?',
    ];
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    vscode.window.showInformationMessage(`[ORACLE]: ${randomQuote}`);
  });

  context.subscriptions.push(oracleCommand);
}

function deactivate() {
  console.log('SWEObeyMe extension deactivated');
  
  // Surgical uninstall: remove only our server key from MCP config
  const configDir = path.join(os.homedir(), '.codeium', 'windsurf-next');
  const mcpConfigPath = path.resolve(path.join(configDir, 'mcp_config.json'));
  
  console.log('[SWEObeyMe] Cleanup MCP config path:', mcpConfigPath);
  
  try {
    const fs = require('fs');
    if (fs.existsSync(mcpConfigPath)) {
      const raw = fs.readFileSync(mcpConfigPath, 'utf8');
      if (raw.trim()) {
        const config = JSON.parse(raw);
        if (config.mcpServers && config.mcpServers['swe-obey-me']) {
          // Remove only our server key, preserve others
          delete config.mcpServers['swe-obey-me'];
          
          // If no servers left, we can delete the file or keep empty object
          if (Object.keys(config.mcpServers).length === 0) {
            delete config.mcpServers;
          }
          
          fs.writeFileSync(mcpConfigPath, JSON.stringify(config, null, 2));
          console.log('SWEObeyMe: Removed MCP server from config');
        }
      }
    }
  } catch (error) {
    console.error('SWEObeyMe: Failed to cleanup MCP config:', error);
  }
}

export { activate, deactivate };
