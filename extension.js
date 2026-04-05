import * as vscode from 'vscode';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

// ESM-safe __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Map C# Bridge severity to VS Code diagnostic severity
function mapSeverityToDiagnostic(severity, color) {
  // C# Bridge severity: 0=Info, 1=Warning, 2=Error
  // Colors: red=critical, orange=warning, cyan=info, magenta=environmental_drift, purple=memory_leak, silver=ternary_state
  if (severity === 2 || color === 'red') {
    return vscode.DiagnosticSeverity.Error;
  } else if (severity === 1 || color === 'orange' || color === 'magenta' || color === 'purple') {
    return vscode.DiagnosticSeverity.Warning;
  } else {
    return vscode.DiagnosticSeverity.Information;
  }
}

// Analyze C# file and update diagnostics
async function updateCSharpDiagnostics(document, diagnosticCollection) {
  const filePath = document.uri.fsPath;
  const config = vscode.workspace.getConfiguration('sweObeyMe.csharpBridge');

  if (!config.get('enabled')) {
    diagnosticCollection.delete(document.uri);
    return;
  }

  try {
    // Import C# bridge analysis
    const csharpBridgePath = path.join(__dirname, 'lib', 'csharp-bridge.js');
    const { analyzeCSharpFile } = await import(csharpBridgePath);

    const analysis = await analyzeCSharpFile(filePath);
    const severityThreshold = config.get('severityThreshold', 0);

    if (!analysis || !analysis.errors) {
      diagnosticCollection.delete(document.uri);
      return;
    }

    const diagnostics = [];
    for (const error of analysis.errors) {
      if (error.severity < severityThreshold) continue;

      // Convert line ranges to VS Code ranges
      const lineRanges = error.lineRanges || [{ startLine: 1, endLine: 1 }];
      for (const range of lineRanges) {
        const startLine = Math.max(0, range.startLine - 1);
        const endLine = Math.max(0, range.endLine - 1);

        const range_ = new vscode.Range(
          new vscode.Position(startLine, 0),
          new vscode.Position(endLine, document.lineCount > endLine ? document.lineAt(endLine).text.length : 0)
        );

        const diagnosticSeverity = mapSeverityToDiagnostic(error.severity, error.color);
        const diagnostic = new vscode.Diagnostic(
          range_,
          `[${error.color.toUpperCase()}] ${error.name}: ${error.details || 'See details'}`,
          diagnosticSeverity
        );

        diagnostic.source = 'C# Bridge';
        diagnostic.code = error.id;
        diagnostics.push(diagnostic);
      }
    }

    diagnosticCollection.set(document.uri, diagnostics);
  } catch (error) {
    console.error(`[C# Bridge] Failed to analyze ${filePath}:`, error);
  }
}

async function activate(context) {
  console.log('SWEObeyMe extension activated');

  // Create diagnostic collection for C# errors
  const csharpDiagnosticCollection = vscode.languages.createDiagnosticCollection('csharp-bridge');
  context.subscriptions.push(csharpDiagnosticCollection);

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

  // Register C# Bridge settings webview provider
  const { CSharpSettingsProvider } = await import(path.join(__dirname, 'lib', 'csharp-settings-provider.js'));
  const csharpSettingsProvider = new CSharpSettingsProvider(context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('sweObeyMe.csharpSettings', csharpSettingsProvider)
  );

  // Watch for C# file changes and update diagnostics
  const csharpFileWatcher = vscode.workspace.onDidSaveTextDocument(async (document) => {
    if (document.languageId === 'csharp' && document.uri.scheme === 'file') {
      await updateCSharpDiagnostics(document, csharpDiagnosticCollection);
    }
  });
  context.subscriptions.push(csharpFileWatcher);

  // Analyze existing C# files on activation
  if (vscode.workspace.workspaceFolders) {
    for (const folder of vscode.workspace.workspaceFolders) {
      const csharpFiles = await vscode.workspace.findFiles('**/*.cs', null);
      for (const file of csharpFiles) {
        const document = await vscode.workspace.openTextDocument(file);
        await updateCSharpDiagnostics(document, csharpDiagnosticCollection);
      }
    }
  }
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
