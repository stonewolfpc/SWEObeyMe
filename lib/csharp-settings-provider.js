import * as vscode from 'vscode';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { randomBytes } from 'crypto';
import os from 'os';

// Generate a nonce for CSP
function getNonce() {
  return randomBytes(16).toString('base64');
}

export class CSharpSettingsProvider {
  constructor(context) {
    this.context = context;
    this.isDevelopment = context.extensionMode === vscode.ExtensionMode.Development;
  }

  async resolveWebviewView(webviewView, context, _token) {
    try {
      const nonce = getNonce();

      webviewView.webview.options = {
        enableScripts: true,
        localResourceRoots: [this.context.extensionUri],
      };

      webviewView.webview.html = await this.getWebviewContent(webviewView.webview, nonce);

      // Handle messages from the webview
      webviewView.webview.onDidReceiveMessage(async (message) => {
        try {
          switch (message.command) {
            case 'getConfig':
              await this.sendConfig(webviewView.webview);
              break;
            case 'toggleEnabled':
              await this.updateConfig('sweObeyMe.csharpBridge.enabled', message.value);
              break;
            case 'toggleKeepAiInformed':
              await this.updateConfig('sweObeyMe.csharpBridge.keepAiInformed', message.value);
              break;
            case 'setSeverityThreshold':
              await this.updateConfig('sweObeyMe.csharpBridge.severityThreshold', message.value);
              break;
            case 'setConfidenceThreshold':
              await this.updateConfig('sweObeyMe.csharpBridge.confidenceThreshold', message.value);
              break;
            case 'toggleDeduplicate':
              await this.updateConfig('sweObeyMe.csharpBridge.deduplicateAlerts', message.value);
              break;
            case 'setAlertCooldown':
              await this.updateConfig('sweObeyMe.csharpBridge.alertCooldown', message.value);
              break;
            case 'setLogVerbosity':
              await this.updateConfig('sweObeyMe.csharpBridge.logVerbosity', message.value);
              break;
            case 'toggleDetector':
              await this.updateDetector(message.detector, message.value);
              break;
            case 'updateConfig':
              await this.updateConfig(message.key, message.value);
              break;
            case 'setBackupPath':
              await this.setBackupPath(message.path);
              break;
            case 'updateMcpConfig':
              await this.updateMcpConfig(message.key, message.value);
              break;
          }
        } catch (error) {
          console.error('[CSharpSettingsProvider] Error handling message:', error);
          webviewView.webview.postMessage({ error: error.message });
        }
      });
    } catch (error) {
      console.error('[CSharpSettingsProvider] Error resolving webview:', error);
      webviewView.webview.html = this.getErrorHtml(error);
    }
  }

  async sendConfig(webview) {
    const config = vscode.workspace.getConfiguration('sweObeyMe');

    // Get backup directory from environment or default
    const localAppData =
      process.env.LOCALAPPDATA ||
      (process.env.USERPROFILE ? join(process.env.USERPROFILE, 'AppData', 'Local') : null);
    const defaultBackupDir = join(
      localAppData || this.context.extensionUri.fsPath,
      'SWEObeyMe',
      '.sweobeyme-backups'
    );
    const backupPath = process.env.SWEOBEYME_BACKUP_DIR || defaultBackupDir;

    // Try to read MCP config from .sweobeyme-config.json
    let mcpConfig = {};
    try {
      const fs = await import('fs/promises');
      const os = await import('os');
      const configPath = join(os.homedir(), '.sweobeyme-config.json');
      const configData = await fs.readFile(configPath, 'utf-8');
      mcpConfig = JSON.parse(configData);
    } catch (error) {
      // Config file doesn't exist or can't be read, use defaults
      mcpConfig = {
        maxLines: 700,
        warningThreshold: 600,
        maxBackupsPerFile: 10,
        enableAutoCorrection: true,
        enableLoopDetection: true,
        maxLoopAttempts: 3,
        minDocumentationRatio: 0.1,
        enableWorkflowOrchestration: true,
        enableSessionMemory: true,
        enableOracle: true,
        debugLogs: false,
      };
    }

    // Get backup statistics
    let backupStats = { totalBackups: 0, totalSizeMB: '0.00' };
    try {
      const fs = await import('fs/promises');
      if (
        await fs
          .access(backupPath)
          .then(() => true)
          .catch(() => false)
      ) {
        const files = await fs.readdir(backupPath);
        const backups = files.filter((f) => f.endsWith('.readonly'));

        let totalSize = 0;
        for (const backup of backups) {
          const backupFilePath = join(backupPath, backup);
          const stats = await fs.stat(backupFilePath);
          totalSize += stats.size;
        }

        backupStats = {
          totalBackups: backups.length,
          totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
        };
      }
    } catch (error) {
      // Backup directory doesn't exist or can't be read
    }

    webview.postMessage({
      config: {
        csharpBridge: config.get('csharpBridge'),
        initialization: config.get('initialization'),
      },
      backupPath,
      customBackupPath: process.env.SWEOBEYME_BACKUP_DIR || '',
      mcpConfig,
      backupStats,
    });
  }

  async updateConfig(key, value) {
    await vscode.workspace.getConfiguration().update(key, value, vscode.ConfigurationTarget.Global);
  }

  async updateDetector(detector, value) {
    const config = vscode.workspace.getConfiguration('sweObeyMe.csharpBridge');
    const detectors = config.get('detectors', {});
    detectors[detector] = value;
    await this.updateConfig('sweObeyMe.csharpBridge.detectors', detectors);
  }

  async setBackupPath(path) {
    if (!path || path.trim() === '') {
      // Clear custom path, use default
      const config = vscode.workspace.getConfiguration('sweObeyMe');
      await config.update('backupPath', undefined, vscode.ConfigurationTarget.Global);
      return;
    }

    await vscode.workspace
      .getConfiguration('sweObeyMe')
      .update('backupPath', path, vscode.ConfigurationTarget.Global);
  }

  async updateMcpConfig(key, value) {
    try {
      const fs = await import('fs/promises');
      const osModule = await import('os');
      const configPath = join(osModule.homedir(), '.sweobeyme-config.json');

      let config = {};
      try {
        const configData = await fs.readFile(configPath, 'utf-8');
        config = JSON.parse(configData);
      } catch (error) {
        // Config doesn't exist yet, will create new
      }

      config[key] = value;
      await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to update MCP config: ${error.message}`);
    }
  }

  async getWebviewContent(webview, nonce) {
    try {
      const templatePath = join(
        this.context.extensionUri.fsPath,
        'lib',
        'csharp-settings-template.html'
      );
      let html = await readFile(templatePath, 'utf8');

      // Add CSP with nonce
      const csp = `default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';`;

      // Inject CSP and nonce into HTML
      html = html.replace(
        '<head>',
        `<head><meta http-equiv="Content-Security-Policy" content="${csp}">`
      );

      // Add nonce to script tag for CSP compliance
      html = html.replace('<script>', `<script nonce="${nonce}">`);

      // In development mode, add hot-reload script
      if (this.isDevelopment) {
        const devScript = `
        <script nonce="${nonce}">
          // Development mode: enable hot-reload
          if (window.vscode) {
            console.log('[SWEObeyMe] Development mode active');
          }
        </script>
        `;
        html = html.replace('</head>', `${devScript}</head>`);
      }

      return html;
    } catch (error) {
      console.error('[CSharpSettingsProvider] Error reading template:', error);
      return this.getErrorHtml(error);
    }
  }

  getErrorHtml(error) {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SWEObeyMe Settings Error</title>
  <style>
    body {
      font-family: var(--vscode-font-family);
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
      padding: 20px;
      max-width: 600px;
      margin: 0 auto;
    }
    h1 { color: var(--vscode-errorForeground); }
    .error { background: var(--vscode-errorBackground); padding: 15px; border-radius: 4px; margin: 20px 0; }
    .suggestions { margin-top: 20px; }
    .suggestions ul { margin: 10px 0; padding-left: 20px; }
    button {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      padding: 8px 16px;
      cursor: pointer;
      margin-top: 10px;
    }
    button:hover { background: var(--vscode-button-hoverBackground); }
  </style>
</head>
<body>
  <h1>⚠️ Error Loading Settings</h1>
  <div class="error">
    <strong>${error.message}</strong>
  </div>
  <div class="suggestions">
    <h3>Suggestions:</h3>
    <ul>
      <li>Reload the window to try again</li>
      <li>Check the developer console for more details</li>
      <li>Ensure the extension is properly installed</li>
    </ul>
  </div>
  <button onclick="vscode.commands.executeCommand('workbench.action.reloadWindow')">Reload Window</button>
</body>
</html>`;
  }
}
