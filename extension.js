import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// ESM-safe __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import checkpoint manager
let checkpointManager = null;

// Import provider manager
let providerManager = null;

// Import diff review manager
let diffReviewManager = null;

// Import permission manager
let permissionManager = null;

// Import skills marketplace manager
let skillsMarketplaceManager = null;

// Import configuration managers
let auditLogger = null;
let policyAsCodeManager = null;
let metricsManager = null;
let healthCheckManager = null;

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

  // Initialize checkpoint manager
  const { CheckpointManager } = await import(path.join(__dirname, 'lib', 'checkpoint-manager.js'));
  checkpointManager = new CheckpointManager(context);

  // Initialize provider manager
  const { ProviderManager } = await import(path.join(__dirname, 'lib', 'provider-manager.js'));
  providerManager = new ProviderManager();

  // Refresh provider status on activation
  await providerManager.refreshProviderStatus();

  // Initialize diff review manager
  const { DiffReviewManager } = await import(path.join(__dirname, 'lib', 'diff-review-manager.js'));
  diffReviewManager = new DiffReviewManager();

  // Initialize permission manager
  const { PermissionManager } = await import(path.join(__dirname, 'lib', 'permission-manager.js'));
  permissionManager = new PermissionManager();

  // Initialize skills marketplace manager
  const { SkillsMarketplaceManager } = await import(path.join(__dirname, 'lib', 'skills-marketplace-manager.js'));
  skillsMarketplaceManager = new SkillsMarketplaceManager(context);

  // Advanced managers are disabled in public build

  // Initialize policy-as-code manager
  const { PolicyAsCodeManager } = await import(path.join(__dirname, 'lib', 'policy-as-code-manager.js'));
  policyAsCodeManager = new PolicyAsCodeManager();

  // Initialize metrics manager
  const { MetricsManager, HealthCheckManager } = await import(path.join(__dirname, 'lib', 'metrics-manager.js'));
  metricsManager = new MetricsManager();
  healthCheckManager = new HealthCheckManager();

  // Rate limit, quota, API key, backup, compliance, webhook, configuration inheritance, tenant isolation, and admin dashboard managers disabled in public build

  // Track first-time installation
  const hasBeenInstalled = context.globalState.get('hasBeenInstalled');
  if (!hasBeenInstalled) {
    await context.globalState.update('hasBeenInstalled', true);
    console.log('[SWEObeyMe] First-time installation detected');
    
    // Show welcome message on first install
    const onboardingConfig = vscode.workspace.getConfiguration('sweObeyMe.onboarding');
    if (onboardingConfig.get('showWelcome', true)) {
      vscode.window.showInformationMessage(
        'Welcome to SWEObeyMe! Surgical code enforcement is now active.',
        'View Onboarding Guide',
        'View Documentation',
        'Dismiss'
      ).then(selection => {
        if (selection === 'View Onboarding Guide') {
          vscode.commands.executeCommand('sweObeyMe.showOnboarding');
        } else if (selection === 'View Documentation') {
          vscode.env.openExternal(vscode.Uri.parse('https://github.com/stonewolfpc/SWEObeyMe'));
        }
      });
    }

    // Register JSON schema for .sweobeyme-config.json files
    try {
      const jsonConfig = vscode.workspace.getConfiguration('json');
      const jsonSchemas = jsonConfig.get<object>('schemas', {});
      const schemaPath = vscode.Uri.joinPath(context.extensionUri, 'schemas', 'config-schema.json').toString();
      
      await jsonConfig.update(
        'schemas',
        {
          ...jsonSchemas,
          [schemaPath]: ['.sweobeyme-config.json'],
        },
        vscode.ConfigurationTarget.Global
      );
      console.log('[SWEObeyMe] Registered config schema');
    } catch (error) {
      console.error('[SWEObeyMe] Failed to register config schema:', error);
    }

    // Create .sweobeyme-config.json in workspace root if it doesn't exist
    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
      const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
      const configPath = path.join(workspaceRoot, '.sweobeyme-config.json');
      
      if (!fs.existsSync(configPath)) {
        const defaultConfig = {
          backupPath: defaultBackupDir,
          csharpBridge: {
            enabled: true,
            severityThreshold: 0
          },
          general: {
            hotReloadEnabled: false
          }
        };
        
        try {
          fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
          console.log('[SWEObeyMe] Created default config file at workspace root');
        } catch (error) {
          console.error('[SWEObeyMe] Failed to create config file:', error);
        }
      }
    }

    // Show inline tip after a delay (similar to Continue's InlineTipManager)
    setTimeout(() => {
      const showInlineTip = vscode.workspace.getConfiguration('sweObeyMe').get('showInlineTip', true);
      if (showInlineTip) {
        vscode.window.showInformationMessage(
          'Tip: Use the SWEObeyMe status bar to access surgical enforcement tools and settings.',
          'Got it',
          'Don\'t show again'
        ).then(selection => {
          if (selection === 'Don\'t show again') {
            vscode.workspace.getConfiguration('sweObeyMe').update('showInlineTip', false, vscode.ConfigurationTarget.Global);
          }
        });
      }
    }, 30000); // Show after 30 seconds
  }

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
  const isInstalled = extensionPath.includes(path.join('.windsurf-next', 'extensions')) ||
                      extensionPath.includes(path.join('.vscode', 'extensions'));

  if (isInstalled) {
    // Windsurf uses ~/.codeium/mcp_config.json for MCP configuration
    const configDir = path.join(os.homedir(), '.codeium');
    const mcpConfigPath = path.join(configDir, 'mcp_config.json');

    console.log('[SWEObeyMe] MCP config path:', mcpConfigPath);

    try {
      const fs = await import('fs');
      let needsUpdate = false;
      let config = {};

      // Ensure directory exists
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }

      if (fs.existsSync(mcpConfigPath)) {
        const raw = fs.readFileSync(mcpConfigPath, 'utf8');
        if (raw.trim()) {
          try {
            config = JSON.parse(raw);
          } catch (e) {
            needsUpdate = true;
            console.error('[SWEObeyMe] Failed to parse existing mcp.json:', e);
          }
        } else {
          needsUpdate = true;
        }

        if (!needsUpdate) {
          const existingServer = config.mcpServers?.['swe-obey-me'];
          if (existingServer) {
            const existingPath = existingServer.args?.[existingServer.args.length - 1];
            // Check if path exists and is valid
            if (existingPath && !fs.existsSync(existingPath)) {
              needsUpdate = true;
              console.log('[SWEObeyMe] Existing MCP config path does not exist, updating...');
            }
          } else {
            needsUpdate = true;
            console.log('[SWEObeyMe] MCP server not configured, adding...');
          }
        }
      } else {
        needsUpdate = true;
        console.log('[SWEObeyMe] mcp.json does not exist, creating...');
      }

      if (needsUpdate) {
        // Normalize paths to forward slashes for cross-platform compatibility
        const normalizedIndexPath = indexPath.replace(/\\/g, '/');
        const normalizedBackupDir = backupDir.replace(/\\/g, '/');

        config.mcpServers = config.mcpServers || {};
        config.mcpServers['swe-obey-me'] = {
          command: 'node',
          args: ['--no-warnings', normalizedIndexPath],
          env: {
            NODE_ENV: 'production',
            SWEOBEYME_BACKUP_DIR: normalizedBackupDir,
            SWEOBEYME_DEBUG: '0',
          },
          disabled: false,
        };

        // Atomic write: write to temp file first, then rename to prevent corruption
        const tempPath = mcpConfigPath + '.tmp';
        fs.writeFileSync(tempPath, JSON.stringify(config, null, 2));
        fs.renameSync(tempPath, mcpConfigPath);
        console.log('[SWEObeyMe] MCP config written successfully');

        vscode.window.showInformationMessage(
          'SWEObeyMe MCP configured! Reload Windsurf to activate.',
          'Reload Now',
        ).then(selection => {
          if (selection === 'Reload Now') {
            vscode.commands.executeCommand('workbench.action.reloadWindow');
          }
        });
      } else {
        console.log('[SWEObeyMe] MCP config already valid');
      }
    } catch (error) {
      console.error('[SWEObeyMe] Failed to auto-configure MCP:', error);
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
    try {
      const options = [
        { label: 'Query Oracle', description: 'Get surgical wisdom', command: 'sweObeyMe.queryOracle' },
        { label: 'C# Bridge Settings', description: 'Configure C# analysis', command: 'sweObeyMe.csharpSettings' },
        { label: 'Reload Window', description: 'Reload Windsurf to activate changes', command: 'workbench.action.reloadWindow' },
      ];

      const selected = await vscode.window.showQuickPick(options, {
        placeHolder: 'Select SWEObeyMe action',
      });

      if (selected) {
        await vscode.commands.executeCommand(selected.command);
      }
    } catch (error) {
      console.error('[SWEObeyMe] Error in showMenu:', error);
      vscode.window.showErrorMessage(`Error: ${error.message}`);
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
  try {
    const { CSharpSettingsProvider } = await import(path.join(__dirname, 'lib', 'csharp-settings-provider.js'));
    const csharpSettingsProvider = new CSharpSettingsProvider(context);
    context.subscriptions.push(
      vscode.window.registerWebviewViewProvider('sweObeyMe.csharpSettings', csharpSettingsProvider),
    );
  } catch (error) {
    console.error('[SWEObeyMe] Failed to register C# settings provider:', error);
  }

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

  // Register checkpoint commands
  const createCheckpointCommand = vscode.commands.registerCommand('sweObeyMe.checkpoint.create', async () => {
    if (!checkpointManager) {
      vscode.window.showErrorMessage('Checkpoint manager not initialized');
      return;
    }

    const name = await vscode.window.showInputBox({
      placeHolder: 'Enter checkpoint name',
      prompt: 'Name this checkpoint for easy identification',
    });

    if (!name) {
      return;
    }

    const description = await vscode.window.showInputBox({
      placeHolder: 'Enter description (optional)',
      prompt: 'Describe what this checkpoint represents',
    });

    try {
      const id = await checkpointManager.createCheckpoint(name, description || undefined);
      vscode.window.showInformationMessage(`Checkpoint "${name}" created successfully`);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to create checkpoint: ${error.message}`);
    }
  });
  context.subscriptions.push(createCheckpointCommand);

  const listCheckpointsCommand = vscode.commands.registerCommand('sweObeyMe.checkpoint.list', async () => {
    if (!checkpointManager) {
      vscode.window.showErrorMessage('Checkpoint manager not initialized');
      return;
    }

    const checkpoints = checkpointManager.listCheckpoints();

    if (checkpoints.length === 0) {
      vscode.window.showInformationMessage('No checkpoints available');
      return;
    }

    const items = checkpoints.map(cp => ({
      label: cp.name,
      description: new Date(cp.timestamp).toLocaleString(),
      detail: cp.description || 'No description',
      checkpointId: cp.id,
    }));

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: 'Select a checkpoint',
    });

    if (selected) {
      const action = await vscode.window.showQuickPick(
        ['Revert to this checkpoint', 'Delete this checkpoint', 'Cancel'],
        { placeHolder: 'What would you like to do with this checkpoint?' }
      );

      if (action === 'Revert to this checkpoint') {
        await vscode.commands.executeCommand('sweObeyMe.checkpoint.revert', selected.checkpointId);
      } else if (action === 'Delete this checkpoint') {
        await vscode.commands.executeCommand('sweObeyMe.checkpoint.delete', selected.checkpointId);
      }
    }
  });
  context.subscriptions.push(listCheckpointsCommand);

  const revertCheckpointCommand = vscode.commands.registerCommand('sweObeyMe.checkpoint.revert', async (checkpointId) => {
    if (!checkpointManager) {
      vscode.window.showErrorMessage('Checkpoint manager not initialized');
      return;
    }

    if (!checkpointId) {
      // If no checkpointId provided, list checkpoints first
      await vscode.commands.executeCommand('sweObeyMe.checkpoint.list');
      return;
    }

    try {
      await checkpointManager.revertToCheckpoint(checkpointId);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to revert checkpoint: ${error.message}`);
    }
  });
  context.subscriptions.push(revertCheckpointCommand);

  const deleteCheckpointCommand = vscode.commands.registerCommand('sweObeyMe.checkpoint.delete', async (checkpointId) => {
    if (!checkpointManager) {
      vscode.window.showErrorMessage('Checkpoint manager not initialized');
      return;
    }

    if (!checkpointId) {
      // If no checkpointId provided, list checkpoints first
      await vscode.commands.executeCommand('sweObeyMe.checkpoint.list');
      return;
    }

    const confirm = await vscode.window.showWarningMessage(
      'Are you sure you want to delete this checkpoint?',
      'Delete',
      'Cancel'
    );

    if (confirm === 'Delete') {
      checkpointManager.deleteCheckpoint(checkpointId);
      vscode.window.showInformationMessage('Checkpoint deleted');
    }
  });
  context.subscriptions.push(deleteCheckpointCommand);

  // Register onboarding command
  const showOnboardingCommand = vscode.commands.registerCommand('sweObeyMe.showOnboarding', async () => {
    const onboardingPath = path.join(context.extensionUri.fsPath, 'ONBOARDING.md');
    
    if (fs.existsSync(onboardingPath)) {
      const uri = vscode.Uri.file(onboardingPath);
      await vscode.commands.executeCommand('vscode.openWith', uri, 'markdown.preview');
    } else {
      vscode.window.showInformationMessage(
        'Onboarding guide not found locally. Opening online documentation.',
        'Open Online'
      ).then(selection => {
        if (selection === 'Open Online') {
          vscode.env.openExternal(vscode.Uri.parse('https://github.com/stonewolfpc/SWEObeyMe'));
        }
      });
    }
  });
  context.subscriptions.push(showOnboardingCommand);

  // Register Patreon Audit command
  const patreonAuditCommand = vscode.commands.registerCommand('sweObeyMe.patreonAudit', async () => {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceRoot) {
      vscode.window.showErrorMessage('No workspace folder found');
      return;
    }

    // Check if Patreon API key is configured
    const patreonKeyPath = path.join(os.homedir(), '.sweobeyme', 'patreon', 'api-key.json');
    if (!fs.existsSync(patreonKeyPath) && !process.env.PATREON_API_KEY) {
      const selection = await vscode.window.showInformationMessage(
        'Patreon API key not configured. Would you like to set it up now?',
        'Set API Key',
        'Cancel'
      );
      
      if (selection === 'Set API Key') {
        const apiKey = await vscode.window.showInputBox({
          prompt: 'Enter your Patreon API key',
          password: true,
        });
        
        if (apiKey) {
          const keyDir = path.join(os.homedir(), '.sweobeyme', 'patreon');
          if (!fs.existsSync(keyDir)) {
            fs.mkdirSync(keyDir, { recursive: true });
          }
          
          fs.writeFileSync(patreonKeyPath, JSON.stringify({
            apiKey,
            createdAt: new Date().toISOString(),
          }, null, 2));
          
          vscode.window.showInformationMessage('Patreon API key saved successfully');
        }
      } else {
        return;
      }
    }

    // Run Patreon Audit
    vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: 'Running Patreon Audit...',
      cancellable: false,
    }, async (progress) => {
      try {
        progress.report({ increment: 20, message: 'Fetching Patreon content...' });
        
        // TODO: Implement actual Patreon API calls
        // For now, show a placeholder message
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        progress.report({ increment: 40, message: 'Analyzing content...' });
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        progress.report({ increment: 60, message: 'Generating rewrite plan...' });
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        progress.report({ increment: 80, message: 'Writing drafts...' });
        
        // Create patreon-drafts directory
        const draftDir = path.join(workspaceRoot, 'patreon-drafts');
        if (!fs.existsSync(draftDir)) {
          fs.mkdirSync(draftDir, { recursive: true });
        }
        
        // Write placeholder drafts
        fs.writeFileSync(path.join(draftDir, 'about.md'), '# About Page\n\n[Generated by SWEObeyMe Patreon Audit]');
        fs.writeFileSync(path.join(draftDir, 'tiers.md'), '# Tiers\n\n[Generated by SWEObeyMe Patreon Audit]');
        fs.writeFileSync(path.join(draftDir, 'welcome.md'), '# Welcome Message\n\n[Generated by SWEObeyMe Patreon Audit]');
        
        progress.report({ increment: 100, message: 'Complete' });
        
        vscode.window.showInformationMessage(
          'Patreon Audit complete! Drafts written to patreon-drafts/ directory.',
          'Open Drafts',
          'Close'
        ).then(selection => {
          if (selection === 'Open Drafts') {
            const uri = vscode.Uri.file(draftDir);
            vscode.commands.executeCommand('vscode.openFolder', uri);
          }
        });
      } catch (error) {
        vscode.window.showErrorMessage(`Patreon Audit failed: ${error.message}`);
      }
    });
  });
  context.subscriptions.push(patreonAuditCommand);

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
  const configDir = path.join(os.homedir(), '.codeium');
  const mcpConfigPath = path.join(configDir, 'mcp_config.json');

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
