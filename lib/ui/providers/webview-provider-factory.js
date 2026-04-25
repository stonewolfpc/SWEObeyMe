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

      // Set HTML content using the provided generator
      webviewView.webview.html = getHtml(webviewView.webview);

      // Handle messages from webview
      webviewView.webview.onDidReceiveMessage(async (message) => {
        try {
          if (message.command === 'updateConfig') {
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
