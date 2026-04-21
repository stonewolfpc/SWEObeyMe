/**
 * SWEObeyMe Settings HTML Generator
 * 
 * Responsibility: Generate settings panel HTML only
 * Separated from: extension.js (SoC compliance)
 * 
 * @module lib/ui/generators/settings-html
 */

import * as vscode from 'vscode';

/**
 * Generate settings panel HTML
 * @param {vscode.Webview} webview 
 * @returns {string} HTML content
 */
export function getSettingsHtml(webview) {
    const cfg = vscode.workspace.getConfiguration('sweObeyMe');
    const extension = vscode.extensions.getExtension('stonewolfpc.swe-obey-me');
    const version = extension?.packageJSON?.version || '3.0.3';
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
  <style ${nonceAttr}>
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
  <script ${nonceAttr}>
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