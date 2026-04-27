/**
 * Cockpit HTML Generator
 *
 * Responsibility: Generate the unified v5.0 governance cockpit HTML.
 * Includes Simple/Advanced mode toggle, all tab content, custom CSS.
 *
 * @module lib/ui/generators/cockpit-html
 */

import { getCockpitCss } from './cockpit-css.js';

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
  <title>SWEObeyMe v5.0 Cockpit</title>
  <style nonce="${nonce}">${_getCss()}</style>
</head>
<body>
  <div id="cockpit">
    <!-- Header -->
    <header class="cockpit-header">
      <div class="header-brand">
        <span class="brand-icon">⬡</span>
        <span class="brand-name">SWEObeyMe</span>
        <span class="brand-version">v5.0</span>
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
      ${_getClientScript()}
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

/** Client-side script (runs inside webview sandbox) */
function _getClientScript() {
  return `
    let currentMode = state.mode || 'simple';
    let currentTab = state.activeTab || 'architecture';
    let monitorPaused = state.monitor?.paused || false;
    let monitorFilter = state.monitor?.filter || 'all';
    let historyFilter = state.history?.filterType || 'all';
    let archZoom = state.architecture?.zoom || 1.0;
    let archPanX = state.architecture?.panX || 0;
    let archPanY = state.architecture?.panY || 0;
    let isDragging = false;
    let lastMouse = { x: 0, y: 0 };
    const eventHistory = [];

    function applyMode() {
      const simple = document.getElementById('simplePanel');
      const advanced = document.getElementById('advancedPanel');
      const label = document.getElementById('modeLabel');
      if (currentMode === 'advanced') {
        simple.classList.add('hidden');
        advanced.classList.remove('hidden');
        label.textContent = 'Advanced';
      } else {
        simple.classList.remove('hidden');
        advanced.classList.add('hidden');
        label.textContent = 'Simple';
      }
      vscode.postMessage({ command: 'saveState', key: 'mode', value: currentMode });
    }

    function switchTab(tab) {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => { p.classList.add('hidden'); p.classList.remove('active'); });
      document.querySelector('.tab-btn[data-tab="' + tab + '"]').classList.add('active');
      const panel = document.getElementById('tab-' + tab);
      if (panel) { panel.classList.remove('hidden'); panel.classList.add('active'); }
      currentTab = tab;
      vscode.postMessage({ command: 'saveState', key: 'activeTab', value: tab });
    }

    function addEvent(ev) {
      eventHistory.unshift(ev);
      if (eventHistory.length > 500) eventHistory.pop();
      if (!monitorPaused) renderMonitor();
      renderHistory();
      updateSimpleStatus(ev);
    }

    function renderMonitor() {
      const stream = document.getElementById('eventStream');
      const filtered = monitorFilter === 'all' ? eventHistory : eventHistory.filter(e => e.type === monitorFilter);
      if (filtered.length === 0) { stream.innerHTML = '<div class="event-placeholder">No events match filter.</div>'; return; }
      stream.innerHTML = filtered.slice(0, 100).map(e => {
        const time = new Date(e.timestamp).toLocaleTimeString();
        return '<div class="event-item"><span class="event-time">' + time + '</span><span class="event-badge ' + (e.type||'info') + '">' + (e.type||'info') + '</span><span class="event-text">' + _esc(e.message||'') + '</span></div>';
      }).join('');
    }

    function renderHistory() {
      const list = document.getElementById('historyList');
      const search = (document.getElementById('historySearch')?.value || '').toLowerCase();
      let filtered = historyFilter === 'all' ? eventHistory : eventHistory.filter(e => e.type === historyFilter);
      if (search) filtered = filtered.filter(e => (e.message||'').toLowerCase().includes(search));
      if (filtered.length === 0) { list.innerHTML = '<div class="history-placeholder">No events match.</div>'; return; }
      list.innerHTML = filtered.slice(0, 200).map(e => {
        const time = new Date(e.timestamp).toLocaleTimeString();
        return '<div class="history-item"><span class="history-time">' + time + '</span><span class="event-badge ' + (e.type||'info') + '">' + (e.type||'info') + '</span><span class="history-text">' + _esc(e.message||'') + '</span></div>';
      }).join('');
    }

    function updateSimpleStatus(ev) {
      if (ev.type === 'backup') document.getElementById('simpleLastBackup').textContent = _relTime(ev.timestamp);
      if (ev.type === 'validation') document.getElementById('simpleLastValidation').textContent = ev.summary || 'Ran';
      if (ev.type === 'router') document.getElementById('simpleLastEvent').textContent = ev.message ? ev.message.slice(0,40) : '—';
    }

    function renderArchDiagram() {
      const svg = document.getElementById('archSvg');
      if (!svg) return;
      svg.style.transform = 'translate(' + archPanX + 'px,' + archPanY + 'px) scale(' + archZoom + ')';
      svg.style.transformOrigin = '0 0';
    }

    function setupArchInteraction() {
      const container = document.getElementById('archContainer');
      if (!container) return;
      container.addEventListener('mousedown', e => { isDragging = true; lastMouse = { x: e.clientX, y: e.clientY }; });
      document.addEventListener('mousemove', e => {
        if (!isDragging) return;
        archPanX += e.clientX - lastMouse.x;
        archPanY += e.clientY - lastMouse.y;
        lastMouse = { x: e.clientX, y: e.clientY };
        renderArchDiagram();
      });
      document.addEventListener('mouseup', () => {
        if (isDragging) { isDragging = false; vscode.postMessage({ command: 'saveState', key: 'architecture.panX', value: archPanX }); vscode.postMessage({ command: 'saveState', key: 'architecture.panY', value: archPanY }); }
      });
      container.addEventListener('wheel', e => {
        if (!e.ctrlKey) return;
        e.preventDefault();
        archZoom = Math.max(0.4, Math.min(3.0, archZoom - e.deltaY * 0.001));
        renderArchDiagram();
        vscode.postMessage({ command: 'saveState', key: 'architecture.zoom', value: archZoom });
      }, { passive: false });
      document.querySelectorAll('.layer-node').forEach(node => {
        node.addEventListener('click', () => {
          document.querySelectorAll('.layer-node').forEach(n => n.classList.remove('selected'));
          node.classList.add('selected');
          const layerId = node.dataset.layer;
          vscode.postMessage({ command: 'getLayerDetail', layerId });
          vscode.postMessage({ command: 'saveState', key: 'architecture.selectedLayer', value: layerId });
        });
      });
    }

    function setupControls() {
      document.getElementById('modeToggle')?.addEventListener('click', () => {
        currentMode = currentMode === 'simple' ? 'advanced' : 'simple';
        applyMode();
      });
      document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
      });
      document.getElementById('zoomIn')?.addEventListener('click', () => { archZoom = Math.min(3.0, archZoom + 0.2); renderArchDiagram(); });
      document.getElementById('zoomOut')?.addEventListener('click', () => { archZoom = Math.max(0.4, archZoom - 0.2); renderArchDiagram(); });
      document.getElementById('resetView')?.addEventListener('click', () => { archZoom = 1; archPanX = 0; archPanY = 0; renderArchDiagram(); });
      document.getElementById('pauseMonitor')?.addEventListener('click', function() {
        monitorPaused = !monitorPaused;
        this.textContent = monitorPaused ? '▶ Resume' : '⏸ Pause';
      });
      document.getElementById('clearMonitor')?.addEventListener('click', () => { eventHistory.length = 0; renderMonitor(); renderHistory(); });
      document.getElementById('monitorFilter')?.addEventListener('change', function() { monitorFilter = this.value; renderMonitor(); });
      document.getElementById('historySearch')?.addEventListener('input', () => renderHistory());
      document.getElementById('historyFilter')?.addEventListener('change', function() { historyFilter = this.value; renderHistory(); });
      document.getElementById('exportHistory')?.addEventListener('click', () => {
        vscode.postMessage({ command: 'exportHistory', data: eventHistory });
      });
      document.getElementById('testResults')?.addEventListener('click', e => {
        const btn = e.target.closest('.test-rerun');
        if (btn) vscode.postMessage({ command: 'rerunTest', test: btn.dataset.test });
      });
      document.getElementById('runAllTests')?.addEventListener('click', () => {
        const cat = document.getElementById('testCategory')?.value || 'all';
        document.getElementById('testResults').innerHTML = '<div class="test-placeholder">Running tests…</div>';
        vscode.postMessage({ command: 'runValidationTests', category: cat });
      });
      document.getElementById('savePat')?.addEventListener('click', () => {
        const pat = document.getElementById('githubPat')?.value;
        if (!pat) return;
        vscode.postMessage({ command: 'storeGitHubPat', pat });
        document.getElementById('githubPat').value = '';
      });
      document.getElementById('deletePat')?.addEventListener('click', () => {
        vscode.postMessage({ command: 'deleteGitHubPat' });
      });
      document.getElementById('githubEnabled')?.addEventListener('change', function() {
        vscode.postMessage({ command: 'updateGitHubConfig', key: 'enabled', value: this.checked });
      });
      document.getElementById('githubOwner')?.addEventListener('change', function() {
        vscode.postMessage({ command: 'updateGitHubConfig', key: 'owner', value: this.value });
      });
      document.getElementById('githubRepo')?.addEventListener('change', function() {
        vscode.postMessage({ command: 'updateGitHubConfig', key: 'repo', value: this.value });
      });
      document.getElementById('testGitHubConnection')?.addEventListener('click', () => {
        vscode.postMessage({ command: 'testGitHubConnection' });
      });
      document.getElementById('issueList')?.addEventListener('click', e => {
        const link = e.target.closest('.issue-link');
        if (link) { e.preventDefault(); vscode.postMessage({ command: 'openUrl', url: link.dataset.url }); }
      });
      document.querySelectorAll('.community-link').forEach(a => {
        a.addEventListener('click', e => {
          e.preventDefault();
          vscode.postMessage({ command: 'openUrl', url: a.dataset.url });
        });
      });
    }

    function handleMessage(msg) {
      switch(msg.command) {
        case 'routerEvent': addEvent(msg.event); break;
        case 'systemStatus': updateSystemStatus(msg); break;
        case 'validationResults': renderTestResults(msg.results); break;
        case 'layerDetail': renderLayerDetail(msg); break;
        case 'githubStatus': updateGitHubStatus(msg); break;
        case 'issueHistory': renderIssueHistory(msg.issues); break;
        case 'settingsLoaded': applySettings(msg.cfg); break;
        case 'error': addEvent({ type: 'error', message: msg.message, timestamp: Date.now() }); break;
      }
    }

    function updateSystemStatus(msg) {
      const healthy = msg.healthy !== false;
      document.getElementById('healthFill').style.width = healthy ? '100%' : '40%';
      document.getElementById('healthLabel').textContent = healthy ? 'System Healthy' : 'Issues Detected';
      document.getElementById('healthLabel').style.color = healthy ? 'var(--accent-green)' : 'var(--accent-red)';
      document.getElementById('systemStatusDot').className = 'status-dot' + (healthy ? '' : ' error');
      if (msg.surfaceCount != null) document.getElementById('simpleSurfaceCount').textContent = msg.surfaceCount + '/7';
      if (msg.handlerCount != null) document.getElementById('simpleHandlerCount').textContent = msg.handlerCount;
    }

    function renderTestResults(results) {
      if (!results || !results.tests) return;
      const summary = document.getElementById('testSummary');
      const list = document.getElementById('testResults');
      const pass = results.tests.filter(t => t.status === 'pass').length;
      const fail = results.tests.filter(t => t.status === 'fail').length;
      const skip = results.tests.filter(t => t.status === 'skip').length;
      summary.innerHTML = '<span class="test-badge pass">✓ ' + pass + ' Pass</span><span class="test-badge fail">✗ ' + fail + ' Fail</span>' + (skip ? '<span class="test-badge skip">⚡ ' + skip + ' Skip</span>' : '');
      list.innerHTML = results.tests.map(t => {
        const icon = t.status === 'pass' ? '<span class="icon-pass">✓</span>' : t.status === 'fail' ? '<span class="icon-fail">✗</span>' : '<span class="icon-skip">⚡</span>';
        const detail = t.error ? '<div class="test-detail">' + _esc(t.error) + '</div>' : '';
        return '<div class="test-item"><span class="test-icon">' + icon + '</span><span class="test-name">' + _esc(t.name) + '</span><span class="test-duration">' + (t.duration||0) + 'ms</span><span class="test-rerun" data-test="' + _esc(t.name) + '">↺</span></div>' + detail;
      }).join('');
    }

    function renderLayerDetail(msg) {
      document.getElementById('layerDetailTitle').textContent = msg.title || 'Layer';
      document.getElementById('layerDetailBody').innerHTML = msg.html || '';
    }

    function updateGitHubStatus(msg) {
      const patStatus = document.getElementById('patStatus');
      if (patStatus) { patStatus.textContent = msg.hasPat ? 'Configured ✓' : 'Not configured'; patStatus.className = 'config-status' + (msg.hasPat ? '' : ' unconfigured'); }
      if (document.getElementById('githubEnabled')) document.getElementById('githubEnabled').checked = msg.enabled || false;
      if (document.getElementById('githubOwner')) document.getElementById('githubOwner').value = msg.owner || '';
      if (document.getElementById('githubRepo')) document.getElementById('githubRepo').value = msg.repo || '';
      const simpleStatus = document.getElementById('simpleGitHubStatus');
      if (simpleStatus) simpleStatus.textContent = msg.hasPat && msg.enabled ? '✓ Connected' : msg.hasPat ? 'Configured (disabled)' : 'Not configured';
    }

    function renderIssueHistory(issues) {
      const list = document.getElementById('issueList');
      if (!issues || issues.length === 0) { list.innerHTML = '<div class="history-placeholder">No issues created yet.</div>'; return; }
      list.innerHTML = issues.map(i => {
        return '<div class="issue-item"><span class="issue-number">#' + i.id + '</span><span class="issue-title">' + _esc(i.title) + '</span><a class="issue-link" data-url="' + _esc(i.url) + '" href="#">Open</a><span class="issue-time">' + _relTime(i.createdAt) + '</span></div>';
      }).join('');
    }

    function applySettings(cfg) {
      const set = (id, val) => { const el = document.getElementById(id); if (!el) return; if (el.type === 'checkbox') el.checked = !!val; else el.value = val ?? ''; };
      set('cfg-enabled', cfg.enabled);
      set('cfg-tips', cfg.showInlineTip);
      set('cfg-notifications', cfg.notifications_enabled);
      set('cfg-perAgent', cfg.toolControls_perAgent);
      set('cfg-fileAccess', cfg.toolControls_fileAccess);
      set('cfg-terminalAccess', cfg.toolControls_terminalAccess);
      set('cfg-networkAccess', cfg.toolControls_networkAccess);
      set('cfg-csharpEnabled', cfg.csharpBridge_enabled);
      set('cfg-keepAiInformed', cfg.csharpBridge_keepAiInformed);
      set('cfg-deduplicateAlerts', cfg.csharpBridge_deduplicateAlerts);
      set('cfg-diffReview', cfg.diffReview_enabled);
      set('cfg-requireApproval', cfg.diffReview_requireApproval);
    }

    function setupSettings() {
      const send = (key, val) => vscode.postMessage({ command: 'updateConfig', key, value: val });
      const onToggle = (id, key) => { const el = document.getElementById(id); if (el) el.addEventListener('change', () => send(key, el.checked)); };
      const onSelect = (id, key) => { const el = document.getElementById(id); if (el) el.addEventListener('change', () => send(key, el.value)); };
      onToggle('cfg-enabled', 'sweObeyMe.enabled');
      onToggle('cfg-tips', 'sweObeyMe.showInlineTip');
      onToggle('cfg-notifications', 'sweObeyMe.notifications.enabled');
      onToggle('cfg-perAgent', 'sweObeyMe.toolControls.perAgent');
      onSelect('cfg-fileAccess', 'sweObeyMe.toolControls.fileAccess');
      onSelect('cfg-terminalAccess', 'sweObeyMe.toolControls.terminalAccess');
      onSelect('cfg-networkAccess', 'sweObeyMe.toolControls.networkAccess');
      onToggle('cfg-csharpEnabled', 'sweObeyMe.csharpBridge.enabled');
      onToggle('cfg-keepAiInformed', 'sweObeyMe.csharpBridge.keepAiInformed');
      onToggle('cfg-deduplicateAlerts', 'sweObeyMe.csharpBridge.deduplicateAlerts');
      onToggle('cfg-diffReview', 'sweObeyMe.diffReview.enabled');
      onToggle('cfg-requireApproval', 'sweObeyMe.diffReview.requireApproval');
      const full = document.getElementById('openFullSettings');
      if (full) full.addEventListener('click', () => {
        // Save current mode and tab state before opening Settings
        vscode.postMessage({ command: 'saveState', key: 'mode', value: currentMode });
        vscode.postMessage({ command: 'saveState', key: 'activeTab', value: currentTab });
        // Small delay to ensure state is saved before opening Settings
        setTimeout(() => vscode.postMessage({ command: 'openFullSettings' }), 50);
      });
    }

    function _esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
    function _relTime(ts) {
      const d = Date.now() - new Date(ts).getTime();
      if (d < 60000) return 'just now';
      if (d < 3600000) return Math.floor(d/60000) + 'm ago';
      if (d < 86400000) return Math.floor(d/3600000) + 'h ago';
      return Math.floor(d/86400000) + 'd ago';
    }

    try {
      console.log('[SWEObeyMe Cockpit] Script executing, acquireVsCodeApi:', typeof acquireVsCodeApi);
      window.addEventListener('message', e => handleMessage(e.data));
      applyMode();
      switchTab(currentTab);
      renderArchDiagram();
      setupArchInteraction();
      setupControls();
      setupSettings();
      vscode.postMessage({ command: 'cockpitReady' });
    } catch (err) {
      document.body.innerHTML = '<div style="color:#ff3d71;padding:16px;font-family:monospace"><strong>Cockpit init error:</strong><br>' + err.message + '<br><pre>' + (err.stack || '') + '</pre></div>';
    }
  `;
}
