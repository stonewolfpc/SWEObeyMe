/**
 * Admin Dashboard HTML Generator
 * 
 * Responsibility: Generate admin dashboard panel HTML
 * Separated from: extension.js (SoC compliance)
 * 
 * @module lib/ui/generators/admin-dashboard-html
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Generate admin dashboard panel HTML
 * @param {object} webview 
 * @returns {string} HTML content
 */
export function getAdminDashboardHtml(webview) {
    let mcpCfg = {};
    try { mcpCfg = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.sweobeyme-config.json'), 'utf8')); } catch {}
    const nonce = webview?.cspNonce;
    const useNonce = nonce && nonce.length > 0;
    const cspStyle = useNonce ? `'nonce-${nonce}'` : `'unsafe-inline'`;
    const cspScript = useNonce ? `'nonce-${nonce}'` : `'unsafe-inline'`;
    const nonceAttr = useNonce ? `nonce="${nonce}"` : '';
    
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
  <style ${nonceAttr}>
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
  <button id="saveConfig">Save Configuration</button>
  <div id="status"></div>
  <script ${nonceAttr}>
    const vscApi=acquireVsCodeApi();
    function send(cmd,key,value){vscApi.postMessage({command:cmd,key:key,value:value});}
    
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
      const saveConfig = document.getElementById('saveConfig');
      const status = document.getElementById('status');
      
      function updateConfig() {
        const config = {
          maxLines: parseInt(maxLines.value),
          warningThreshold: parseInt(warningThreshold.value),
          maxBackupsPerFile: parseInt(maxBackupsPerFile.value),
          maxLoopAttempts: parseInt(maxLoopAttempts.value),
          enableAutoCorrection: enableAutoCorrection.checked,
          enableLoopDetection: enableLoopDetection.checked,
          enableWorkflowOrchestration: enableWorkflowOrchestration.checked,
          enableSessionMemory: enableSessionMemory.checked,
          enableOracle: enableOracle.checked,
          debugLogs: debugLogs.checked
        };
        send('saveMcpConfig', null, config);
      }
      
      saveConfig.addEventListener('click', function() {
        updateConfig();
        status.textContent = 'Configuration saved!';
        setTimeout(() => status.textContent = '', 2000);
      });
    });
  </script>
</body>
</html>`;
    
    return html;
  }