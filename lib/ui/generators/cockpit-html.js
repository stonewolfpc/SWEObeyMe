/**
 * Cockpit HTML Generator
 *
 * Responsibility: Generate the unified v5.0 governance cockpit HTML.
 * Includes Simple/Advanced mode toggle, all tab content, custom CSS.
 *
 * @module lib/ui/generators/cockpit-html
 */

import { getCockpitCss } from './cockpit-css.js';
import { getClientScript } from './cockpit-client-script.js';

/**
 * Generate cockpit HTML for the webview
 * @param {import('vscode').Webview} webview
 * @param {object} initialState - State from state-persistence
 * @returns {string}
 */
export function getCockpitHtml(webview, initialState = {}) {
  const nonce = _generateNonce();
  const cspSource = webview?.cspSource ?? '';
  const safeState = initialState || {};
  const stateJson = JSON.stringify(safeState);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}' ${cspSource}; style-src 'nonce-${nonce}' ${cspSource}; img-src ${cspSource} data:;">
  <title>SWEObeyMe v5.0.22 Cockpit</title>
  <style nonce="${nonce}">${_getCss()}</style>
</head>
<body>
  <div id="cockpit">
    <!-- Header -->
    <header class="cockpit-header">
      <div class="header-brand">
        <span class="brand-icon">⬡</span>
        <span class="brand-name">SWEObeyMe</span>
        <span class="brand-version">v5.0.22</span>
      </div>
      <div class="header-controls">
        <div class="mode-toggle" id="modeToggle" title="Toggle Simple/Advanced mode">
          <span class="mode-label" id="modeLabel">Simple</span>
          <span class="mode-caret">▾</span>
        </div>
        <div class="status-dot" id="systemStatusDot" title="System status"></div>
      </div>
    </header>

    <!-- Simple Mode Panel -->
    <div id="simplePanel" class="panel">
      <div class="health-indicator" id="healthIndicator">
        <div class="health-bar">
          <div class="health-fill" id="healthFill"></div>
        </div>
        <span class="health-label" id="healthLabel">System Healthy</span>
      </div>

      <div class="status-grid">
        <div class="status-card">
          <span class="status-icon">💾</span>
          <div class="status-content">
            <div class="status-title">Last Backup</div>
            <div class="status-value" id="simpleLastBackup">—</div>
          </div>
        </div>
        <div class="status-card">
          <span class="status-icon">✅</span>
          <div class="status-content">
            <div class="status-title">Validation</div>
            <div class="status-value" id="simpleLastValidation">—</div>
          </div>
        </div>
        <div class="status-card">
          <span class="status-icon">⚡</span>
          <div class="status-content">
            <div class="status-title">Last Router Event</div>
            <div class="status-value" id="simpleLastEvent">—</div>
          </div>
        </div>
        <div class="status-card" id="githubStatusCard">
          <span class="status-icon">🐙</span>
          <div class="status-content">
            <div class="status-title">GitHub</div>
            <div class="status-value" id="simpleGitHubStatus">Not configured</div>
          </div>
        </div>
      </div>

      <div class="layer-diagram-simple" id="layerDiagramSimple">
        <div class="layer-label">5-Layer Architecture</div>
        <svg id="archSvgSimple" viewBox="0 0 320 260" xmlns="http://www.w3.org/2000/svg">
          ${_getSimpleLayersSvg()}
        </svg>
      </div>

      <div class="tool-counts">
        <span class="tool-count">Surface Tools: <strong id="simpleSurfaceCount">7/7</strong></span>
        <span class="tool-count">Handlers: <strong id="simpleHandlerCount">—</strong></span>
      </div>

      <div class="community-links">
        <a class="community-link" href="https://github.com/stonewolfpc" data-url="https://github.com/stonewolfpc">
          <span class="community-icon">⌥</span>
          <div class="community-info">
            <span class="community-name">GitHub</span>
            <span class="community-desc">Source, releases &amp; issues</span>
          </div>
        </a>
        <a class="community-link" href="https://discord.gg/WHvc2EGe" data-url="https://discord.gg/WHvc2EGe">
          <span class="community-icon">💬</span>
          <div class="community-info">
            <span class="community-name">Discord</span>
            <span class="community-desc">Community &amp; support</span>
          </div>
        </a>
        <a class="community-link" href="https://www.patreon.com/c/StoneWolfSystems" data-url="https://www.patreon.com/c/StoneWolfSystems">
          <span class="community-icon">🎖</span>
          <div class="community-info">
            <span class="community-name">Patreon</span>
            <span class="community-desc">Support &amp; early access</span>
          </div>
        </a>
        <a class="community-link" href="https://ko-fi.com/stonewolfsystems" data-url="https://ko-fi.com/stonewolfsystems">
          <span class="community-icon">☕</span>
          <div class="community-info">
            <span class="community-name">Ko-Fi</span>
            <span class="community-desc">Buy me a coffee</span>
          </div>
        </a>
      </div>
    </div>

    <!-- Advanced Mode Panel -->
    <div id="advancedPanel" class="panel hidden">
      <nav class="tab-nav">
        <button class="tab-btn active" data-tab="architecture">Architecture</button>
        <button class="tab-btn" data-tab="monitor">Monitor</button>
        <button class="tab-btn" data-tab="validation">Validation</button>
        <button class="tab-btn" data-tab="history">History</button>
        <button class="tab-btn" data-tab="github">GitHub</button>
        <button class="tab-btn" data-tab="settings">Settings</button>
      </nav>

      <!-- Architecture Tab -->
      <div class="tab-panel active" id="tab-architecture">
        <div class="arch-controls">
          <button class="ctrl-btn" id="zoomIn" title="Zoom in">+</button>
          <button class="ctrl-btn" id="zoomOut" title="Zoom out">−</button>
          <button class="ctrl-btn" id="resetView" title="Reset view">⌂</button>
        </div>
        <div class="arch-container" id="archContainer">
          <svg id="archSvg" viewBox="0 0 600 480" xmlns="http://www.w3.org/2000/svg">
            ${_getFullLayersSvg()}
          </svg>
        </div>
        <div class="layer-detail" id="layerDetail">
          <h4 id="layerDetailTitle">Select a layer</h4>
          <div id="layerDetailBody" class="layer-detail-body">Click any layer in the diagram to see details.</div>
        </div>
      </div>

      <!-- Monitor Tab -->
      <div class="tab-panel hidden" id="tab-monitor">
        <div class="monitor-controls">
          <button class="ctrl-btn" id="pauseMonitor">⏸ Pause</button>
          <button class="ctrl-btn" id="clearMonitor">✕ Clear</button>
          <select id="monitorFilter" class="filter-select">
            <option value="all">All Events</option>
            <option value="router">Router</option>
            <option value="backup">Backup</option>
            <option value="validation">Validation</option>
            <option value="error">Errors</option>
          </select>
        </div>
        <div class="event-stream" id="eventStream">
          <div class="event-placeholder">Waiting for governance router events...</div>
        </div>
      </div>

      <!-- Validation Tab -->
      <div class="tab-panel hidden" id="tab-validation">
        <div class="validation-controls">
          <button class="ctrl-btn primary" id="runAllTests">▶ Run All Tests</button>
          <select id="testCategory" class="filter-select">
            <option value="all">All Categories</option>
            <option value="structural">Structural</option>
            <option value="safety">Safety</option>
            <option value="router">Router</option>
            <option value="integration">Integration</option>
            <option value="chaos">Chaos</option>
          </select>
        </div>
        <div class="test-summary" id="testSummary"></div>
        <div class="test-results" id="testResults">
          <div class="test-placeholder">Run tests to see results.</div>
        </div>
      </div>

      <!-- History Tab -->
      <div class="tab-panel hidden" id="tab-history">
        <div class="history-controls">
          <input type="search" id="historySearch" class="search-input" placeholder="Search events…">
          <select id="historyFilter" class="filter-select">
            <option value="all">All Types</option>
            <option value="router">Router</option>
            <option value="backup">Backup</option>
            <option value="validation">Validation</option>
            <option value="error">Errors</option>
          </select>
          <button class="ctrl-btn" id="exportHistory">⬇ Export</button>
        </div>
        <div class="history-list" id="historyList">
          <div class="history-placeholder">No events recorded yet.</div>
        </div>
      </div>

      <!-- GitHub Tab -->
      <div class="tab-panel hidden" id="tab-github">
        <div class="github-config">
          <h3 class="section-title">GitHub Integration</h3>
          <div class="config-row">
            <label class="config-label">Enable</label>
            <label class="toggle-switch">
              <input type="checkbox" id="githubEnabled">
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div class="config-row">
            <label class="config-label">Repository Owner</label>
            <input type="text" id="githubOwner" class="config-input" placeholder="e.g. stonewolfpc">
          </div>
          <div class="config-row">
            <label class="config-label">Repository Name</label>
            <input type="text" id="githubRepo" class="config-input" placeholder="e.g. SWEObeyMe">
          </div>
          <div class="config-row">
            <label class="config-label">Personal Access Token</label>
            <div class="pat-row">
              <input type="password" id="githubPat" class="config-input" placeholder="ghp_…">
              <button class="ctrl-btn" id="savePat">Save</button>
              <button class="ctrl-btn danger" id="deletePat">Delete</button>
            </div>
          </div>
          <div class="config-row">
            <label class="config-label">PAT Status</label>
            <span class="config-status" id="patStatus">Not configured</span>
          </div>
          <div class="rate-limit-bar">
            <span class="rate-label">Rate limit: 1 issue/min</span>
            <span class="rate-status" id="rateLimitStatus">Ready</span>
          </div>
          <button class="ctrl-btn primary" id="testGitHubConnection">Test Connection</button>
        </div>
        <div class="github-history">
          <h3 class="section-title">Issue History</h3>
          <div class="issue-list" id="issueList">
            <div class="history-placeholder">No issues created yet.</div>
          </div>
        </div>
      </div>

      <!-- Settings Tab -->
      <div class="tab-panel hidden" id="tab-settings">
        <div class="settings-section">
          <div class="settings-group-title">General</div>
          <div class="setting-row">
            <div class="setting-label">Extension Enabled<div class="setting-desc">Master on/off for SWEObeyMe</div></div>
            <div class="setting-control"><label class="toggle-switch"><input type="checkbox" id="cfg-enabled"><span class="toggle-slider"></span></label></div>
          </div>
          <div class="setting-row">
            <div class="setting-label">Show Inline Tips<div class="setting-desc">Show first-run guidance tips</div></div>
            <div class="setting-control"><label class="toggle-switch"><input type="checkbox" id="cfg-tips"><span class="toggle-slider"></span></label></div>
          </div>
          <div class="setting-row">
            <div class="setting-label">Notifications<div class="setting-desc">Show toast notifications</div></div>
            <div class="setting-control"><label class="toggle-switch"><input type="checkbox" id="cfg-notifications"><span class="toggle-slider"></span></label></div>
          </div>
        </div>
        <div class="settings-section">
          <div class="settings-group-title">Tool Access Controls</div>
          <div class="setting-row">
            <div class="setting-label">Per-Agent Permissions<div class="setting-desc">Track permissions per AI agent</div></div>
            <div class="setting-control"><label class="toggle-switch"><input type="checkbox" id="cfg-perAgent"><span class="toggle-slider"></span></label></div>
          </div>
          <div class="setting-row">
            <div class="setting-label">File Access</div>
            <div class="setting-control"><select class="setting-select" id="cfg-fileAccess"><option value="allow">Allow</option><option value="ask">Ask</option><option value="deny">Deny</option></select></div>
          </div>
          <div class="setting-row">
            <div class="setting-label">Terminal Access</div>
            <div class="setting-control"><select class="setting-select" id="cfg-terminalAccess"><option value="allow">Allow</option><option value="ask">Ask</option><option value="deny">Deny</option></select></div>
          </div>
          <div class="setting-row">
            <div class="setting-label">Network Access</div>
            <div class="setting-control"><select class="setting-select" id="cfg-networkAccess"><option value="allow">Allow</option><option value="ask">Ask</option><option value="deny">Deny</option></select></div>
          </div>
        </div>
        <div class="settings-section">
          <div class="settings-group-title">C# Bridge</div>
          <div class="setting-row">
            <div class="setting-label">C# Bridge Enabled<div class="setting-desc">Real-time C# error detection</div></div>
            <div class="setting-control"><label class="toggle-switch"><input type="checkbox" id="cfg-csharpEnabled"><span class="toggle-slider"></span></label></div>
          </div>
          <div class="setting-row">
            <div class="setting-label">Keep AI Informed<div class="setting-desc">Auto-inject errors into AI context</div></div>
            <div class="setting-control"><label class="toggle-switch"><input type="checkbox" id="cfg-keepAiInformed"><span class="toggle-slider"></span></label></div>
          </div>
          <div class="setting-row">
            <div class="setting-label">Deduplicate Alerts<div class="setting-desc">Group repeated warnings</div></div>
            <div class="setting-control"><label class="toggle-switch"><input type="checkbox" id="cfg-deduplicateAlerts"><span class="toggle-slider"></span></label></div>
          </div>
        </div>
        <div class="settings-section">
          <div class="settings-group-title">Diff Review</div>
          <div class="setting-row">
            <div class="setting-label">Diff Review Enabled</div>
            <div class="setting-control"><label class="toggle-switch"><input type="checkbox" id="cfg-diffReview"><span class="toggle-slider"></span></label></div>
          </div>
          <div class="setting-row">
            <div class="setting-label">Require Approval<div class="setting-desc">Block changes until approved</div></div>
            <div class="setting-control"><label class="toggle-switch"><input type="checkbox" id="cfg-requireApproval"><span class="toggle-slider"></span></label></div>
          </div>
        </div>
        <button class="ctrl-btn primary open-settings-btn" id="openFullSettings">Open Full Settings in VS Code</button>
      </div>
    </div>
  </div>
  <script nonce="${nonce}">
    (function() {
      let vscode;
      try { vscode = acquireVsCodeApi(); } catch(e) { vscode = window.__vscodeApi; }
      if (!vscode) { document.body.textContent = 'Error: acquireVsCodeApi unavailable'; return; }
      window.__vscodeApi = vscode;
      const state = ${stateJson};
      ${getClientScript()}
    })();
  </script>
</body>
</html>`;
}

/** Generate a random nonce */
function _generateNonce() {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

/** Simple SVG for Simple Mode */
function _getSimpleLayersSvg() {
  const layers = [
    { y: 10,  h: 36, color: '#00d4ff', label: 'Surface Layer', sublabel: '7 semantic entry points' },
    { y: 56,  h: 36, color: '#7b2fff', label: 'Core Layer', sublabel: 'Governance Router' },
    { y: 102, h: 36, color: '#ff6b2b', label: 'Engine Layer', sublabel: 'Internal Handlers' },
    { y: 148, h: 36, color: '#00e676', label: 'Validation Layer', sublabel: 'Test Suite' },
    { y: 194, h: 36, color: '#ff3d71', label: 'Soul Layer', sublabel: 'Philosophy Firewall' },
  ];
  return layers.map(l => `
    <rect x="10" y="${l.y}" width="300" height="${l.h}" rx="6" fill="${l.color}22" stroke="${l.color}" stroke-width="1.5"/>
    <text x="20" y="${l.y + 14}" fill="${l.color}" font-size="10" font-weight="600" font-family="monospace">${l.label}</text>
    <text x="20" y="${l.y + 28}" fill="#888" font-size="9" font-family="monospace">${l.sublabel}</text>
  `).join('');
}

/** Full interactive SVG for Advanced Mode */
function _getFullLayersSvg() {
  const layers = [
    { id: 'surface',    y: 10,  color: '#00d4ff', label: 'Surface Layer',    sub: 'file_ops · search_code · backup_restore · project_context · docs_manage · workflow_manage · sweobeyme_execute' },
    { id: 'core',       y: 106, color: '#7b2fff', label: 'Core Layer',       sub: 'Governance Router · Philosophy Enforcement · Self-Healing · Surgical Compliance' },
    { id: 'engine',     y: 202, color: '#ff6b2b', label: 'Engine Layer',     sub: 'Internal Handlers · Tool Arbitration · Rule Engine · Config Manager' },
    { id: 'validation', y: 298, color: '#00e676', label: 'Validation Layer', sub: 'Structural · Safety · Router · Integration · Chaos Tests' },
    { id: 'soul',       y: 394, color: '#ff3d71', label: 'Soul Layer',       sub: 'Philosophy Firewall · Oracle · Ethics Guards · Governance Constitution' },
  ];

  const arrows = `
    <defs>
      <marker id="arrowHead" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
        <path d="M0,0 L8,4 L0,8 Z" fill="#555"/>
      </marker>
    </defs>
    <line x1="300" y1="96" x2="300" y2="106" stroke="#555" stroke-width="1.5" marker-end="url(#arrowHead)"/>
    <line x1="300" y1="192" x2="300" y2="202" stroke="#555" stroke-width="1.5" marker-end="url(#arrowHead)"/>
    <line x1="300" y1="288" x2="300" y2="298" stroke="#555" stroke-width="1.5" marker-end="url(#arrowHead)"/>
    <line x1="300" y1="384" x2="300" y2="394" stroke="#555" stroke-width="1.5" marker-end="url(#arrowHead)"/>
  `;

  const rects = layers.map(l => `
    <g class="layer-node" data-layer="${l.id}">
      <rect x="10" y="${l.y}" width="580" height="86" rx="8" fill="${l.color}18" stroke="${l.color}" stroke-width="1.5"/>
      <rect x="10" y="${l.y}" width="6" height="86" rx="3" fill="${l.color}"/>
      <text x="30" y="${l.y + 26}" fill="${l.color}" font-size="13" font-weight="700" font-family="monospace">${l.label}</text>
      <text x="30" y="${l.y + 48}" fill="#aaa" font-size="10" font-family="monospace">${l.sub}</text>
    </g>
  `).join('');

  return arrows + rects;
}

/** Inline CSS for the cockpit */
function _getCss() { return getCockpitCss(); }

