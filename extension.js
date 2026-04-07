import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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
          new vscode.Position(endLine, document.lineCount > endLine ? document.lineAt(endLine).text.length : 0),
        );

        const diagnosticSeverity = mapSeverityToDiagnostic(error.severity, error.color);
        const diagnostic = new vscode.Diagnostic(
          range_,
          `[${error.color.toUpperCase()}] ${error.name}: ${error.details || 'See details'}`,
          diagnosticSeverity,
        );

        diagnostic.source = 'C# Bridge';
        diagnostic.code = error.id;
        diagnostics.push(diagnostic);
      }
    }

    diagnosticCollection.set(document.uri, diagnostics);
  } catch (error) {
    console.error(`[C# Bridge] Failed to analyze ${filePath}:`, error);
    const errorMessage = error.message || 'Unknown error occurred';
    const suggestions = [
      '• Ensure C# file is valid and compiles',
      '• Check that file is not too large (>10MB)',
      '• Verify file encoding is UTF-8',
      '• Try closing and reopening the file',
    ];
    vscode.window.showErrorMessage(
      `C# Bridge Analysis Failed: ${errorMessage}\n\nSuggestions:\n${suggestions.join('\n')}`,
      'Open Settings',
      'Dismiss',
    ).then(selection => {
      if (selection === 'Open Settings') {
        vscode.commands.executeCommand('workbench.action.openSettings', 'sweObeyMe.csharpBridge');
      }
    });
  }
}

// Git integration foundation
async function getGitRepositoryPath(workspaceFolder) {
  const gitPath = path.join(workspaceFolder.uri.fsPath, '.git');
  return fs.existsSync(gitPath) ? workspaceFolder.uri.fsPath : null;
}

async function getGitStatus(repoPath) {
  try {
    const { stdout } = await execAsync('git status --porcelain', { cwd: repoPath });
    const changes = stdout.trim().split('\n').filter(line => line.trim());
    return {
      hasChanges: changes.length > 0,
      changedFiles: changes.length,
      isClean: changes.length === 0,
    };
  } catch (error) {
    console.error('[Git Integration] Failed to get git status:', error);
    return { hasChanges: false, changedFiles: 0, isClean: true };
  }
}

async function getCurrentBranch(repoPath) {
  try {
    const { stdout } = await execAsync('git rev-parse --abbrev-ref HEAD', { cwd: repoPath });
    return stdout.trim();
  } catch (error) {
    console.error('[Git Integration] Failed to get current branch:', error);
    return 'unknown';
  }
}

async function getGitBranches(repoPath) {
  try {
    const { stdout } = await execAsync('git branch -a', { cwd: repoPath });
    return stdout.trim().split('\n').map(branch => branch.trim().replace(/^\*\s*/, ''));
  } catch (error) {
    console.error('[Git Integration] Failed to get branches:', error);
    return [];
  }
}

async function activate(context) {
  console.log('SWEObeyMe extension activated');

  // Create status bar item
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.command = 'sweObeyMe.showMenu';
  statusBarItem.text = '$(check) SWEObeyMe';
  statusBarItem.tooltip = 'SWEObeyMe - Surgical Code Enforcement';
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

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
    '.sweobeyme-backups',
  );

  // Get custom backup path from config if set
  const config = vscode.workspace.getConfiguration('sweObeyMe');
  const customBackupPath = config.get('backupPath', '');
  const backupDir = customBackupPath && customBackupPath.trim() ? customBackupPath : defaultBackupDir;

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
            SWEOBEYME_BACKUP_DIR: backupDir,
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
          'Reload Now',
        ).then(selection => {
          if (selection === 'Reload Now') {
            vscode.commands.executeCommand('workbench.action.reloadWindow');
          }
        });
      }
    } catch (error) {
      console.error('SWEObeyMe: Failed to auto-configure MCP:', error);
      const suggestions = [
        '• Check that Windsurf is properly installed',
        '• Verify you have write permissions for the config directory',
        '• Try manually configuring MCP in Windsurf settings',
        '• Restart Windsurf and try again',
      ];
      vscode.window.showWarningMessage(
        `Failed to auto-configure SWEObeyMe MCP server.\n\nSuggestions:\n${suggestions.join('\n')}`,
        'Open Documentation',
        'Dismiss',
      ).then(selection => {
        if (selection === 'Open Documentation') {
          vscode.env.openExternal(vscode.Uri.parse('https://github.com/stonewolfpc/SWEObeyMe#quickstart'));
        }
      });
    }
  }

  // Register command to show menu from status bar
  const showMenuCommand = vscode.commands.registerCommand('sweObeyMe.showMenu', async () => {
    const options = [
      { label: 'Query Oracle', description: 'Get surgical wisdom', command: 'sweObeyMe.queryOracle' },
      { label: 'C# Bridge Settings', description: 'Configure C# analysis', command: 'sweObeyMe.csharpSettings' },
      { label: 'Reload Window', description: 'Reload Windsurf to activate changes', command: 'workbench.action.reloadWindow' },
    ];

    const selected = await vscode.window.showQuickPick(options, {
      placeHolder: 'Select SWEObeyMe action',
    });

    if (selected) {
      vscode.commands.executeCommand(selected.command);
    }
  });
  context.subscriptions.push(showMenuCommand);

  // Register command to query the oracle
  const oracleCommand = vscode.commands.registerCommand('sweObeyMe.queryOracle', () => {
    const quotes = [
      'I\'m sorry, Dave. I\'m afraid I *can* do that. Surgery complete.',
      'The flux capacitor is at 1.21 Gigawatts. If you\'re gonna split this file, do it with style.',
      'Your last chance. After this, there is no turning back...',
      'I\'m a leaf on the wind, watch how I— [FILE SPLIT SUCCESSFUL]',
      'I find your lack of indentation disturbing.',
      'Non-compliance detected. YOU SHALL NOT PASS!',
      'Have you tried turning it off and on again?',
    ];
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    vscode.window.showInformationMessage(`[ORACLE]: ${randomQuote}`);
  });

  context.subscriptions.push(oracleCommand);

  // Register command to show C# Bridge Settings
  const csharpSettingsCommand = vscode.commands.registerCommand('sweObeyMe.csharpSettings', () => {
    vscode.commands.executeCommand('sweObeyMe.csharpSettings.focus');
  });
  context.subscriptions.push(csharpSettingsCommand);

  // Register C# Bridge settings webview provider
  const { CSharpSettingsProvider } = await import(path.join(__dirname, 'lib', 'csharp-settings-provider.js'));
  const csharpSettingsProvider = new CSharpSettingsProvider(context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('sweObeyMe.csharpSettings', csharpSettingsProvider),
  );

  // Register CodeLens provider for C# files
  const csharpCodeLensProvider = vscode.languages.registerCodeLensProvider('csharp', {
    provideCodeLenses: async (document) => {
      const lenses = [];

      // Add CodeLens for analyzing current file
      const analyzeRange = new vscode.Range(0, 0, 0, 0);
      lenses.push(new vscode.CodeLens(
        analyzeRange,
        {
          title: '🔍 Analyze with C# Bridge',
          command: 'sweObeyMe.analyzeCSharp',
          arguments: [document],
        },
      ));

      // Add CodeLens for showing diagnostics
      lenses.push(new vscode.CodeLens(
        analyzeRange,
        {
          title: '⚠️ Show Diagnostics',
          command: 'sweObeyMe.showDiagnostics',
          arguments: [document],
        },
      ));

      return lenses;
    },
  });
  context.subscriptions.push(csharpCodeLensProvider);

  // Register command to analyze C# file
  const analyzeCSharpCommand = vscode.commands.registerCommand('sweObeyMe.analyzeCSharp', async (document) => {
    await updateCSharpDiagnostics(document, csharpDiagnosticCollection);
    vscode.window.showInformationMessage('C# file analyzed. Check Problems panel for results.');
  });
  context.subscriptions.push(analyzeCSharpCommand);

  // Register command to show diagnostics
  const showDiagnosticsCommand = vscode.commands.registerCommand('sweObeyMe.showDiagnostics', async (document) => {
    vscode.commands.executeCommand('workbench.actions.view.problems');
  });
  context.subscriptions.push(showDiagnosticsCommand);

  // Hot-reload capability: watch for extension file changes
  const hotReloadConfig = vscode.workspace.getConfiguration('sweObeyMe');
  if (hotReloadConfig.get('general.hotReloadEnabled')) {
    const fs = await import('fs');
    const extensionWatcher = vscode.workspace.createFileSystemWatcher('**/*.{js,json}', false, true, false);

    let reloadTimeout = null;
    extensionWatcher.onDidChange(async (uri) => {
      // Ignore node_modules and test files
      if (uri.fsPath.includes('node_modules') || uri.fsPath.includes('test')) {
        return;
      }

      // Debounce reload requests
      if (reloadTimeout) {
        clearTimeout(reloadTimeout);
      }

      reloadTimeout = setTimeout(() => {
        vscode.window.showInformationMessage(
          'SWEObeyMe extension files changed. Reload to apply changes?',
          'Reload Now',
          'Later',
        ).then(selection => {
          if (selection === 'Reload Now') {
            vscode.commands.executeCommand('workbench.action.reloadWindow');
          }
        });
      }, 2000);
    });

    context.subscriptions.push(extensionWatcher);
  }

  // Git integration foundation: Register Git commands
  const gitStatusCommand = vscode.commands.registerCommand('sweObeyMe.gitStatus', async () => {
    if (!vscode.workspace.workspaceFolders) {
      vscode.window.showWarningMessage('No workspace folder found');
      return;
    }

    const repoPath = await getGitRepositoryPath(vscode.workspace.workspaceFolders[0]);
    if (!repoPath) {
      vscode.window.showWarningMessage('Not a Git repository');
      return;
    }

    const status = await getGitStatus(repoPath);
    const branch = await getCurrentBranch(repoPath);

    const message = status.isClean
      ? `Git Status: Clean (Branch: ${branch})`
      : `Git Status: ${status.changedFiles} changed files (Branch: ${branch})`;

    vscode.window.showInformationMessage(message);
  });
  context.subscriptions.push(gitStatusCommand);

  const gitBranchCommand = vscode.commands.registerCommand('sweObeyMe.gitBranch', async () => {
    if (!vscode.workspace.workspaceFolders) {
      vscode.window.showWarningMessage('No workspace folder found');
      return;
    }

    const repoPath = await getGitRepositoryPath(vscode.workspace.workspaceFolders[0]);
    if (!repoPath) {
      vscode.window.showWarningMessage('Not a Git repository');
      return;
    }

    const branches = await getGitBranches(repoPath);
    const currentBranch = await getCurrentBranch(repoPath);

    const selected = await vscode.window.showQuickPick(branches, {
      placeHolder: `Current branch: ${currentBranch}. Select branch to switch:`,
    });

    if (selected && selected !== currentBranch) {
      try {
        await execAsync(`git checkout ${selected}`, { cwd: repoPath });
        vscode.window.showInformationMessage(`Switched to branch: ${selected}`);
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to switch branch: ${error.message}`);
      }
    }
  });
  context.subscriptions.push(gitBranchCommand);

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
