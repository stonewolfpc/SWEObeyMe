/**
 * Webview Provider Factory
 *
 * Responsibility: Create webview view providers with message handling
 * Separated from: extension.js (SoC compliance)
 *
 * @module lib/ui/providers/webview-provider-factory
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { readFile } from 'fs/promises';

/**
 * Creates a webview view provider with message handling
 * @param {Function} getHtml - Function that generates HTML for the webview
 * @returns {Object} WebviewViewProvider compatible object
 */
export const makeWebviewProvider = (getHtml) => {
  return {
    async resolveWebviewView(webviewView, context, _token) {
      webviewView.webview.options = {
        enableScripts: true,
        localResourceRoots: [context.extensionUri],
        retainContextWhenHidden: true,
      };

      // Set HTML content using the provided generator (await in case it is async)
      const htmlResult = getHtml(webviewView.webview);
      webviewView.webview.html = htmlResult instanceof Promise ? await htmlResult : htmlResult;

      // Handle messages from webview
      webviewView.webview.onDidReceiveMessage(async (message) => {
        try {
          if (message.command === 'getConfig') {
            const config = vscode.workspace.getConfiguration('sweObeyMe');
            const localAppData =
              process.env.LOCALAPPDATA ||
              (process.env.USERPROFILE ? path.join(process.env.USERPROFILE, 'AppData', 'Local') : null);
            const defaultBackupDir = path.join(
              localAppData || os.homedir(),
              'SWEObeyMe',
              '.sweobeyme-backups'
            );
            const backupPath = process.env.SWEOBEYME_BACKUP_DIR || defaultBackupDir;
            let mcpConfig = { maxLines: 700, warningThreshold: 600, maxBackupsPerFile: 10,
              enableAutoCorrection: true, enableLoopDetection: true, maxLoopAttempts: 3,
              minDocumentationRatio: 0.1, enableWorkflowOrchestration: true,
              enableSessionMemory: true, enableOracle: true, debugLogs: false };
            try {
              const configPath = path.join(os.homedir(), '.sweobeyme-config.json');
              mcpConfig = JSON.parse(await readFile(configPath, 'utf-8'));
            } catch {}
            let backupStats = { totalBackups: 0, totalSizeMB: '0.00' };
            try {
              const files = await fs.promises.readdir(backupPath);
              const backups = files.filter(f => f.endsWith('.readonly'));
              let totalSize = 0;
              for (const b of backups) {
                const s = await fs.promises.stat(path.join(backupPath, b));
                totalSize += s.size;
              }
              backupStats = { totalBackups: backups.length, totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2) };
            } catch {}
            webviewView.webview.postMessage({
              config: {
                csharpBridge: config.get('csharpBridge'),
                initialization: config.get('initialization'),
              },
              backupPath,
              customBackupPath: process.env.SWEOBEYME_BACKUP_DIR || '',
              mcpConfig,
              backupStats,
            });
          } else if (message.command === 'updateConfig') {
            const parts = message.key.split('.');
            const section = parts.slice(0, -1).join('.');
            const key = parts[parts.length - 1];
            await vscode.workspace.getConfiguration(section).update(key, message.value, true);
            webviewView.webview.postMessage({
              command: 'configUpdated',
              key: message.key,
              value: message.value,
            });
          } else if (message.command === 'saveMcpConfig') {
            // Save to config file in home directory
            const configPath = path.join(os.homedir(), '.sweobeyme-config.json');
            fs.writeFileSync(configPath, JSON.stringify(message.value, null, 2));
            webviewView.webview.postMessage({ command: 'configSaved', success: true });
          } else if (message.command === 'openSettings') {
            // Open VS Code settings for the specified section
            vscode.commands.executeCommand('workbench.action.openSettings', message.section);
          }
        } catch (err) {
          console.error('[SWEObeyMe] Error handling message:', err);
          webviewView.webview.postMessage({ command: 'error', message: err.message });
        }
      });
    },
  };
};
