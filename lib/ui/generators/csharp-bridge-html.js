/**
 * C# Bridge HTML Generator
 *
 * Responsibility: Generate C# Bridge settings panel HTML
 * Separated from: extension.js (SoC compliance)
 *
 * @module lib/ui/generators/csharp-bridge-html
 */

import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

/**
 * Generate C# Bridge panel HTML
 * @param {vscode.Webview} webview
 * @returns {string} HTML content
 */
export async function getCSharpBridgeHtml(webview) {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const templatePath = path.join(__dirname, '..', '..', 'csharp-settings-template.html');

  try {
    const template = await fs.readFile(templatePath, 'utf-8');
    return template;
  } catch (error) {
    console.error('[C# Bridge HTML] Failed to read template:', error);
    // Fallback to simple HTML if template not found
    return getFallbackHtml(webview);
  }
}

/**
 * Fallback HTML if template file not found
 */
function getFallbackHtml(webview) {
  const cfg = vscode.workspace.getConfiguration('sweObeyMe.csharpBridge');
  const detectors = cfg.get('detectors', {});
  const detectorList = [
    'missing_using',
    'empty_catch',
    'deep_nesting',
    'async_void',
    'resource_leak',
    'math_safety',
    'null_reference',
    'static_mutation',
    'string_concatenation',
  ];
  const nonce = webview?.cspNonce;
  const useNonce = nonce && nonce.length > 0;
  const cspStyle = useNonce ? `'nonce-${nonce}'` : `'unsafe-inline'`;
  const cspScript = useNonce ? `'nonce-${nonce}'` : `'unsafe-inline'`;
  const nonceAttr = useNonce ? `nonce="${nonce}"` : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${cspStyle}; script-src ${cspScript};">
  <title>C# Bridge Settings</title>
  <style ${nonceAttr}>
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
    <span class="val" id="severityValue">${['Info', 'Warn', 'Error'][cfg.get('severityThreshold', 0)]}</span>
  </div>
  <div class="row">
    <label for="confidenceThreshold">Confidence %</label>
    <input type="range" id="confidenceThreshold" min="0" max="100" value="${cfg.get('confidenceThreshold', 70)}">
    <span class="val" id="confidenceValue">${cfg.get('confidenceThreshold', 70)}%</span>
  </div>
  <div class="section">Detectors</div>
  ${detectorList
    .map(
      (d) =>
        `<div class="row"><label for="detector_${d}">${d.replace(/_/g, ' ')}</label><input type="checkbox" id="detector_${d}" ${detectors[d] !== false ? 'checked' : ''}></div>`
    )
    .join('')}
  <button id="openCSharpSettings">Open C# Bridge Settings</button>
  <script ${nonceAttr}>
    const vscApi=acquireVsCodeApi();
    function send(cmd,key,value){vscApi.postMessage({command:cmd,key:key,value:value});}
    
    document.addEventListener('DOMContentLoaded', function() {
      const csharpEnabled = document.getElementById('csharpEnabled');
      const keepAiInformed = document.getElementById('keepAiInformed');
      const deduplicateAlerts = document.getElementById('deduplicateAlerts');
      const severityThreshold = document.getElementById('severityThreshold');
      const confidenceThreshold = document.getElementById('confidenceThreshold');
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
      
      ${detectorList
        .map(
          (d) =>
            `document.getElementById('detector_${d}').addEventListener('change', function() {
          send('updateConfig','sweObeyMe.csharpBridge.detectors.${d}', this.checked);
        });`
        )
        .join('\n      ')}
      
      document.getElementById('openCSharpSettings').addEventListener('click', function() {
        vscApi.postMessage({command:'openSettings',section:'sweObeyMe.csharpBridge'});
      });
    });
  </script>
</body>
</html>`;

  return html;
}
