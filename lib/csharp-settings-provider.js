import * as vscode from 'vscode';
import { readFile } from 'fs/promises';
import { join } from 'path';

export class CSharpSettingsProvider {
  constructor(context) {
    this.context = context;
  }

  async resolveWebviewView(webviewView, context, _token) {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri],
    };

    webviewView.webview.html = await this.getWebviewContent(webviewView.webview);

    // Handle messages from the webview
    webviewView.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
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
      }
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

  async getWebviewContent(webview) {
    const templatePath = join(this.context.extensionUri.fsPath, 'lib', 'csharp-settings-template.html');
    return await readFile(templatePath, 'utf-8');
  }
}
