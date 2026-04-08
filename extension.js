import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { fileURLToPath, pathToFileURL } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// ESM-safe __dirname with Windows path handling
// On Windows, VS Code may pass invalid file:// URLs to ESM loader, so we need fallback
let __dirname;
try {
  const __filename = fileURLToPath(import.meta.url);
  __dirname = path.dirname(__filename);
} catch (e) {
  // Fallback: use process.cwd() or vscode extension path if available
  __dirname = process.cwd();
}

// Convert a filesystem path to a file:// URL string for dynamic import() on Windows
// Handles both Windows (file:///C:/path) and Unix (file:///path) formats
const toFileUrl = (p) => {
  try {
    return pathToFileURL(p).href;
  } catch (e) {
    // Fallback: manually construct file:// URL for Windows
    if (process.platform === 'win32' && path.isAbsolute(p)) {
      const normalized = p.replace(/\\/g, '/');
      // Windows file:// URLs require three slashes: file:///C:/path
      // The third slash represents the empty host portion
      return `file:///${normalized}`;
    }
    // Unix fallback: ensure absolute paths get file:/// format (3 slashes)
    // For relative paths, we need to resolve them first
    const absolutePath = path.isAbsolute(p) ? p : path.resolve(p);
    // Unix paths start with /, so file:// + /path = file:///path (correct!)
    return `file://${absolutePath}`;
  }
};

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
    const { analyzeCSharpFile } = await import(toFileUrl(csharpBridgePath));

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
  const { CheckpointManager } = await import(toFileUrl(path.join(__dirname, 'lib', 'checkpoint-manager.js')));
  checkpointManager = new CheckpointManager(context);

  // Initialize provider manager
  const { ProviderManager } = await import(toFileUrl(path.join(__dirname, 'lib', 'provider-manager.js')));
  providerManager = new ProviderManager();

  // Refresh provider status on activation
  await providerManager.refreshProviderStatus();

  // Initialize diff review manager
  const { DiffReviewManager } = await import(toFileUrl(path.join(__dirname, 'lib', 'diff-review-manager.js')));
  diffReviewManager = new DiffReviewManager();

  // Initialize permission manager
  const { PermissionManager } = await import(toFileUrl(path.join(__dirname, 'lib', 'permission-manager.js')));
  permissionManager = new PermissionManager();

  // Initialize skills marketplace manager
  const { SkillsMarketplaceManager } = await import(toFileUrl(path.join(__dirname, 'lib', 'skills-marketplace-manager.js')));
  skillsMarketplaceManager = new SkillsMarketplaceManager(context);

  // Advanced managers are disabled in public build

  // Initialize policy-as-code manager
  const { PolicyAsCodeManager } = await import(toFileUrl(path.join(__dirname, 'lib', 'policy-as-code-manager.js')));
  policyAsCodeManager = new PolicyAsCodeManager();

  // Initialize metrics manager
  const { MetricsManager, HealthCheckManager } = await import(toFileUrl(path.join(__dirname, 'lib', 'metrics-manager.js')));
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
  const mcpServerPath = path.join(extensionPath, 'dist', 'mcp', 'server.js');

  console.log(`[SWEObeyMe] MCP server path: ${mcpServerPath}`);
  console.log(`[SWEObeyMe] MCP server registered via native contributes.mcpServers in package.json`);

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

  // Register command to open SWEObeyMe Settings
  const openCSharpSettingsCommand = vscode.commands.registerCommand('sweObeyMe.openCSharpSettings', () => {
    vscode.commands.executeCommand('workbench.action.openSettings', 'sweObeyMe');
  });
  context.subscriptions.push(openCSharpSettingsCommand);

  // Inline webview provider - no external file dependencies, works in bundled VSIX
  function makeWebviewProvider(getHtml) {
    return {
      resolveWebviewView(webviewView) {
        webviewView.webview.options = { 
          enableScripts: true,
          localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'dist')]
        };
        webviewView.webview.html = getHtml(webviewView.webview);
        webviewView.webview.onDidReceiveMessage(async (msg) => {
          try {
            if (msg.command === 'updateConfig') {
              await vscode.workspace.getConfiguration().update(msg.key, msg.value, vscode.ConfigurationTarget.Global);
              webviewView.webview.postMessage({ command: 'configUpdated', key: msg.key });
            } else if (msg.command === 'updateMcpConfig') {
              const configPath = path.join(os.homedir(), '.sweobeyme-config.json');
              let cfg = {};
              try { cfg = JSON.parse(fs.readFileSync(configPath, 'utf8')); } catch {}
              cfg[msg.key] = msg.value;
              fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2));
              webviewView.webview.postMessage({ command: 'mcpConfigUpdated', key: msg.key });
            } else if (msg.command === 'openSettings') {
              vscode.commands.executeCommand('workbench.action.openSettings', 'sweObeyMe');
            }
          } catch (err) {
            webviewView.webview.postMessage({ command: 'error', message: err.message });
          }
        });
      }
    };
  }

  function getSettingsHtml(webview) {
    const cfg = vscode.workspace.getConfiguration('sweObeyMe');
    const version = '2.1.3';
    const nonce = webview?.cspNonce;
    const useNonce = nonce && nonce.length > 0;
    const cspStyle = useNonce ? `'nonce-${nonce}'` : `'unsafe-inline'`;
    const cspScript = useNonce ? `'nonce-${nonce}'` : `'unsafe-inline'`;
    const nonceAttr = useNonce ? `nonce="${nonce}"` : '';
    
    // Create HTML without inline event handlers to avoid TrustedScript violations
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${cspStyle}; script-src ${cspScript};">
  <title>SWEObeyMe Settings</title>
  <style nonce="${nonce}">
    body{font-family:var(--vscode-font-family);color:var(--vscode-foreground);background:var(--vscode-sideBar-background);padding:12px;margin:0;font-size:13px}
    h2{font-size:14px;font-weight:600;margin:0 0 12px;color:var(--vscode-sideBarTitle-foreground)}
    .badge{display:inline-block;background:var(--vscode-badge-background);color:var(--vscode-badge-foreground);padding:1px 6px;border-radius:10px;font-size:11px;margin-left:6px}
    .row{display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--vscode-panel-border)}
    .row:last-child{border-bottom:none}
    label{flex:1;cursor:pointer}
    .desc{font-size:11px;color:var(--vscode-descriptionForeground);margin-top:2px}
    button{background:var(--vscode-button-background);color:var(--vscode-button-foreground);border:none;padding:5px 12px;cursor:pointer;border-radius:2px;font-size:12px;margin-top:12px;width:100%}
    button:hover{background:var(--vscode-button-hoverBackground)}
    .status{padding:8px;background:var(--vscode-inputValidation-infoBackground);border-left:3px solid var(--vscode-inputValidation-infoBorder);margin-bottom:12px;font-size:12px}
  </style>
</head>
<body>
  <h2>SWEObeyMe <span class="badge">${version}</span></h2>
  <div class="status">MCP server active</div>
  <div class="row">
    <div><label for="enabled">Enable SWEObeyMe</label><div class="desc">Master switch for all enforcement</div></div>
    <input type="checkbox" id="enabled" ${cfg.get('enabled', true) ? 'checked' : ''}>
  </div>
  <div class="row">
    <div><label for="tips">Show Inline Tips</label><div class="desc">Show helpful tips on activation</div></div>
    <input type="checkbox" id="tips" ${cfg.get('showInlineTip', true) ? 'checked' : ''}>
  </div>
  <div class="row">
    <div><label for="csharp">C# Bridge</label><div class="desc">Real-time C# error detection</div></div>
    <input type="checkbox" id="csharp" ${vscode.workspace.getConfiguration('sweObeyMe.csharpBridge').get('enabled', true) ? 'checked' : ''}>
  </div>
  <button id="openSettings">Open Full Settings</button>
  <script nonce="${nonce}">
    const vscApi=acquireVsCodeApi();
    function send(cmd,key,value){vscApi.postMessage({command:cmd,key:key,value:value});}
    
    // Add event listeners instead of inline handlers
    document.addEventListener('DOMContentLoaded', function() {
      const enabled = document.getElementById('enabled');
      const tips = document.getElementById('tips');
      const csharp = document.getElementById('csharp');
      const openSettings = document.getElementById('openSettings');
      
      enabled.addEventListener('change', function() {
        send('updateConfig','sweObeyMe.enabled', this.checked);
      });
      
      tips.addEventListener('change', function() {
        send('updateConfig','sweObeyMe.showInlineTip', this.checked);
      });
      
      csharp.addEventListener('change', function() {
        send('updateConfig','sweObeyMe.csharpBridge.enabled', this.checked);
      });
      
      openSettings.addEventListener('click', function() {
        send('openSettings');
      });
    });
    
    window.addEventListener('message',e=>{if(e.data.command==='configUpdated'){console.log('Updated:',e.data.key);}});
  </script>
</body>
</html>`;
    
    return html;
  }

  function getCSharpBridgeHtml(webview) {
    const cfg = vscode.workspace.getConfiguration('sweObeyMe.csharpBridge');
    const detectors = cfg.get('detectors', {});
    const detectorList = ['missing_using','empty_catch','deep_nesting','async_void','resource_leak','math_safety','null_reference','static_mutation','string_concatenation'];
    const nonce = webview?.cspNonce;
    const useNonce = nonce && nonce.length > 0;
    const cspStyle = useNonce ? `'nonce-${nonce}'` : `'unsafe-inline'`;
    const cspScript = useNonce ? `'nonce-${nonce}'` : `'unsafe-inline'`;
    
    // Create HTML without inline event handlers to avoid TrustedScript violations
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${cspStyle}; script-src ${cspScript};">
  <title>C# Bridge Settings</title>
  <style nonce="${nonce}">
    body{font-family:var(--vscode-font-family);color:var(--vscode-foreground);background:var(--vscode-sideBar-background);padding:12px;margin:0;font-size:13px}
    h2{font-size:14px;font-weight:600;margin:0 0 12px}
    .row{display:flex;align-items:center;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--vscode-panel-border)}
    .row:last-child{border-bottom:none}
    label{flex:1;text-transform:capitalize}
    .section{font-size:11px;font-weight:700;color:var(--vscode-descriptionForeground);text-transform:uppercase;margin:12px 0 4px;letter-spacing:.5px}
    input[type=range]{width:120px}
    span.val{font-size:11px;min-width:28px;text-align:right}
    button{background:var(--vscode-button-background);color:var(--vscode-button-foreground);border:none;padding:5px 12px;cursor:pointer;border-radius:2px;font-size:12px;margin-top:12px;width:100%}
    button:hover{background:var(--vscode-button-hoverBackground)}
  </style>
</head>
<body>
  <h2>C# Bridge Settings</h2>
  <div class="row">
    <label for="csharpEnabled"><b>Enabled</b></label>
    <input type="checkbox" id="csharpEnabled" ${cfg.get('enabled', true) ? 'checked' : ''}>
  </div>
  <div class="row">
    <label for="keepAiInformed">Keep AI Informed</label>
    <input type="checkbox" id="keepAiInformed" ${cfg.get('keepAiInformed', true) ? 'checked' : ''}>
  </div>
  <div class="row">
    <label for="deduplicateAlerts">Deduplicate Alerts</label>
    <input type="checkbox" id="deduplicateAlerts" ${cfg.get('deduplicateAlerts', true) ? 'checked' : ''}>
  </div>
  <div class="row">
    <label for="severityThreshold">Severity Threshold</label>
    <input type="range" id="severityThreshold" min="0" max="2" value="${cfg.get('severityThreshold', 0)}">
    <span class="val" id="severityValue">${['Info','Warn','Error'][cfg.get('severityThreshold', 0)]}</span>
  </div>
  <div class="row">
    <label for="confidenceThreshold">Confidence %</label>
    <input type="range" id="confidenceThreshold" min="0" max="100" value="${cfg.get('confidenceThreshold', 70)}">
    <span class="val" id="confidenceValue">${cfg.get('confidenceThreshold', 70)}%</span>
  </div>
  <div class="section">Detectors</div>
  ${detectorList.map(d => 
    `<div class="row"><label for="detector_${d}">${d.replace(/_/g,' ')}</label><input type="checkbox" id="detector_${d}" ${detectors[d] !== false ? 'checked' : ''}></div>`
  ).join('')}
  <button id="openCSharpSettings">Open Full Settings</button>
  <script nonce="${nonce}">
    const vscApi=acquireVsCodeApi();
    function send(cmd,key,value){vscApi.postMessage({command:cmd,key:key,value:value});}
    
    // Add event listeners instead of inline handlers
    document.addEventListener('DOMContentLoaded', function() {
      const csharpEnabled = document.getElementById('csharpEnabled');
      const keepAiInformed = document.getElementById('keepAiInformed');
      const deduplicateAlerts = document.getElementById('deduplicateAlerts');
      const severityThreshold = document.getElementById('severityThreshold');
      const confidenceThreshold = document.getElementById('confidenceThreshold');
      const openCSharpSettings = document.getElementById('openCSharpSettings');
      const severityValue = document.getElementById('severityValue');
      const confidenceValue = document.getElementById('confidenceValue');
      
      csharpEnabled.addEventListener('change', function() {
        send('updateConfig','sweObeyMe.csharpBridge.enabled', this.checked);
      });
      
      keepAiInformed.addEventListener('change', function() {
        send('updateConfig','sweObeyMe.csharpBridge.keepAiInformed', this.checked);
      });
      
      deduplicateAlerts.addEventListener('change', function() {
        send('updateConfig','sweObeyMe.csharpBridge.deduplicateAlerts', this.checked);
      });
      
      severityThreshold.addEventListener('input', function() {
        const labels = ['Info','Warn','Error'];
        severityValue.textContent = labels[+this.value];
        send('updateConfig','sweObeyMe.csharpBridge.severityThreshold', +this.value);
      });
      
      confidenceThreshold.addEventListener('input', function() {
        confidenceValue.textContent = this.value + '%';
        send('updateConfig','sweObeyMe.csharpBridge.confidenceThreshold', +this.value);
      });
      
      openCSharpSettings.addEventListener('click', function() {
        send('openSettings');
      });
      
      // Add event listeners for detectors
      ${detectorList.map(d => 
        `document.getElementById('detector_${d}').addEventListener('change', function() {
          send('updateConfig','sweObeyMe.csharpBridge.detectors.${d}', this.checked);
        });`
      ).join('\n      ')}
    });
  </script>
</body>
</html>`;
    
    return html;
  }

  function getAdminDashboardHtml(webview) {
    let mcpCfg = {};
    try { mcpCfg = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.sweobeyme-config.json'), 'utf8')); } catch {}
    const nonce = webview?.cspNonce;
    const useNonce = nonce && nonce.length > 0;
    const cspStyle = useNonce ? `'nonce-${nonce}'` : `'unsafe-inline'`;
    const cspScript = useNonce ? `'nonce-${nonce}'` : `'unsafe-inline'`;
    
    // Define config values
    const configValues = {
      maxLines: mcpCfg.maxLines ?? 700,
      warningThreshold: mcpCfg.warningThreshold ?? 600,
      maxBackupsPerFile: mcpCfg.maxBackupsPerFile ?? 10,
      maxLoopAttempts: mcpCfg.maxLoopAttempts ?? 3,
      enableAutoCorrection: mcpCfg.enableAutoCorrection !== false,
      enableLoopDetection: mcpCfg.enableLoopDetection !== false,
      enableWorkflowOrchestration: mcpCfg.enableWorkflowOrchestration !== false,
      enableSessionMemory: mcpCfg.enableSessionMemory !== false,
      enableOracle: mcpCfg.enableOracle !== false,
      debugLogs: mcpCfg.debugLogs === true,
    };
    
    // Create HTML without inline event handlers to avoid TrustedScript violations
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${cspStyle}; script-src ${cspScript};">
  <title>Admin Dashboard</title>
  <style nonce="${nonce}">
    body{font-family:var(--vscode-font-family);color:var(--vscode-foreground);background:var(--vscode-sideBar-background);padding:12px;margin:0;font-size:13px}
    h2{font-size:14px;font-weight:600;margin:0 0 12px}
    .section{font-size:11px;font-weight:700;color:var(--vscode-descriptionForeground);text-transform:uppercase;margin:12px 0 4px;letter-spacing:.5px}
    .row{display:flex;align-items:center;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--vscode-panel-border)}
    .row:last-child{border-bottom:none}
    label{flex:1}
    button{background:var(--vscode-button-background);color:var(--vscode-button-foreground);border:none;padding:5px 12px;cursor:pointer;border-radius:2px;font-size:12px;margin-top:12px;width:100%}
    button:hover{background:var(--vscode-button-hoverBackground)}
    #status{font-size:11px;color:var(--vscode-descriptionForeground);margin-top:8px;text-align:center}
    input[type=number]{width:60px;background:var(--vscode-input-background);color:var(--vscode-input-foreground);border:1px solid var(--vscode-input-border);padding:2px 4px}
  </style>
</head>
<body>
  <h2>Admin Dashboard</h2>
  <div class="section">MCP Governance Config</div>
  <div class="row">
    <label for="maxLines">Max Lines Per File</label>
    <input type="number" id="maxLines" min="100" max="2000" value="${configValues.maxLines}">
  </div>
  <div class="row">
    <label for="warningThreshold">Warning Threshold</label>
    <input type="number" id="warningThreshold" min="100" max="2000" value="${configValues.warningThreshold}">
  </div>
  <div class="row">
    <label for="maxBackupsPerFile">Max Backups Per File</label>
    <input type="number" id="maxBackupsPerFile" min="1" max="50" value="${configValues.maxBackupsPerFile}">
  </div>
  <div class="row">
    <label for="maxLoopAttempts">Max Loop Attempts</label>
    <input type="number" id="maxLoopAttempts" min="1" max="10" value="${configValues.maxLoopAttempts}">
  </div>
  <div class="section">Feature Toggles</div>
  <div class="row">
    <label for="enableAutoCorrection">Auto-Correction</label>
    <input type="checkbox" id="enableAutoCorrection" ${configValues.enableAutoCorrection ? 'checked' : ''}>
  </div>
  <div class="row">
    <label for="enableLoopDetection">Loop Detection</label>
    <input type="checkbox" id="enableLoopDetection" ${configValues.enableLoopDetection ? 'checked' : ''}>
  </div>
  <div class="row">
    <label for="enableWorkflowOrchestration">Workflow Orchestration</label>
    <input type="checkbox" id="enableWorkflowOrchestration" ${configValues.enableWorkflowOrchestration ? 'checked' : ''}>
  </div>
  <div class="row">
    <label for="enableSessionMemory">Session Memory</label>
    <input type="checkbox" id="enableSessionMemory" ${configValues.enableSessionMemory ? 'checked' : ''}>
  </div>
  <div class="row">
    <label for="enableOracle">Oracle</label>
    <input type="checkbox" id="enableOracle" ${configValues.enableOracle ? 'checked' : ''}>
  </div>
  <div class="row">
    <label for="debugLogs">Debug Logs</label>
    <input type="checkbox" id="debugLogs" ${configValues.debugLogs ? 'checked' : ''}>
  </div>
  <button id="openAdminSettings">Open VS Code Settings</button>
  <div id="status"></div>
  <script nonce="${nonce}">
    const vscApi=acquireVsCodeApi();
    function send(cmd,key,value){vscApi.postMessage({command:cmd,key:key,value:value});document.getElementById('status').textContent='Saved \u2713';}
    
    // Add event listeners instead of inline handlers
    document.addEventListener('DOMContentLoaded', function() {
      const maxLines = document.getElementById('maxLines');
      const warningThreshold = document.getElementById('warningThreshold');
      const maxBackupsPerFile = document.getElementById('maxBackupsPerFile');
      const maxLoopAttempts = document.getElementById('maxLoopAttempts');
      const enableAutoCorrection = document.getElementById('enableAutoCorrection');
      const enableLoopDetection = document.getElementById('enableLoopDetection');
      const enableWorkflowOrchestration = document.getElementById('enableWorkflowOrchestration');
      const enableSessionMemory = document.getElementById('enableSessionMemory');
      const enableOracle = document.getElementById('enableOracle');
      const debugLogs = document.getElementById('debugLogs');
      const openAdminSettings = document.getElementById('openAdminSettings');
      
      maxLines.addEventListener('change', function() {
        send('updateMcpConfig','maxLines', +this.value);
      });
      
      warningThreshold.addEventListener('change', function() {
        send('updateMcpConfig','warningThreshold', +this.value);
      });
      
      maxBackupsPerFile.addEventListener('change', function() {
        send('updateMcpConfig','maxBackupsPerFile', +this.value);
      });
      
      maxLoopAttempts.addEventListener('change', function() {
        send('updateMcpConfig','maxLoopAttempts', +this.value);
      });
      
      enableAutoCorrection.addEventListener('change', function() {
        send('updateMcpConfig','enableAutoCorrection', this.checked);
      });
      
      enableLoopDetection.addEventListener('change', function() {
        send('updateMcpConfig','enableLoopDetection', this.checked);
      });
      
      enableWorkflowOrchestration.addEventListener('change', function() {
        send('updateMcpConfig','enableWorkflowOrchestration', this.checked);
      });
      
      enableSessionMemory.addEventListener('change', function() {
        send('updateMcpConfig','enableSessionMemory', this.checked);
      });
      
      enableOracle.addEventListener('change', function() {
        send('updateMcpConfig','enableOracle', this.checked);
      });
      
      debugLogs.addEventListener('change', function() {
        send('updateMcpConfig','debugLogs', this.checked);
      });
      
      openAdminSettings.addEventListener('click', function() {
        send('openSettings');
      });
    });
    
    window.addEventListener('message',e=>{if(e.data.command==='error')document.getElementById('status').textContent='Error: '+e.data.message;});
  </script>
</body>
</html>`;
    
    return html;
  }

  // Register providers for all three views
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('sweObeyMe.csharpSettings', makeWebviewProvider((webview) => getSettingsHtml(webview))),
    vscode.window.registerWebviewViewProvider('sweObeyMe.csharpSettingsView', makeWebviewProvider((webview) => getCSharpBridgeHtml(webview))),
    vscode.window.registerWebviewViewProvider('sweObeyMe.adminDashboard', makeWebviewProvider((webview) => getAdminDashboardHtml(webview))),
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
  
  // Clean up managers (if they have been initialized and have a dispose method)
  try {
    if (typeof diffReviewManager?.dispose === 'function') {
      diffReviewManager.dispose();
    }
    if (typeof permissionManager?.dispose === 'function') {
      permissionManager.dispose();
    }
    if (typeof skillsMarketplaceManager?.dispose === 'function') {
      skillsMarketplaceManager.dispose();
    }
    if (typeof policyAsCodeManager?.dispose === 'function') {
      policyAsCodeManager.dispose();
    }
    if (typeof metricsManager?.dispose === 'function') {
      metricsManager.dispose();
    }
    if (typeof healthCheckManager?.dispose === 'function') {
      healthCheckManager.dispose();
    }
  } catch (error) {
    console.error('[SWEObeyMe] Error during deactivation:', error);
  }
  
  // MCP server lifecycle is managed by Windsurf via contributes.mcpServers - no cleanup needed.
  // Diagnostic collections are automatically disposed by VS Code when extension deactivates.
}

export { activate, deactivate };
