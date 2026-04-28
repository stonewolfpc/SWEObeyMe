/**
 * Cockpit Client Script
 * JavaScript that runs inside the VS Code webview sandbox.
 * Extracted from cockpit-html.js for SoC compliance.
 */
/** Client-side script (runs inside webview sandbox) */
export function getClientScript() {
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
    let backupStatus = {
      lastAttempt: null,
      lastSuccess: null,
      lastFailure: null,
      recentEvents: [],
      status: 'unknown'
    };

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
      if (ev.type === 'backup') {
        const el = document.getElementById('simpleLastBackup');
        if (!el) return;
        if (ev.success) {
          el.textContent = _relTime(ev.timestamp);
          el.classList.remove('failed');
        } else {
          el.textContent = 'FAILED ' + _relTime(ev.timestamp);
          el.classList.add('failed');
        }
      }
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
        case 'errorStatus': handleErrorResponse(msg); break;
        case 'clearErrors': clearErrorsModal(); break;
        case 'backupStatus': handleBackupStatus(msg); break;
      }
    }

    function clearErrorsModal() {
      const modalBody = document.getElementById('errorModalBody');
      if (modalBody) {
        modalBody.innerHTML = '<p>No errors reported.</p>';
      }
      const dot = document.getElementById('systemStatusDot');
      if (dot) {
        dot.style.backgroundColor = '#00e676';
        dot.style.boxShadow = '0 0 8px #00e676';
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

    function handleErrorResponse(data) {
      const dot = document.getElementById('systemStatusDot');
      if (!dot) return;

      // Update status dot color based on severity using CSS classes
      dot.classList.remove('green', 'yellow', 'red');
      if (data.worstSeverity === 'critical' || data.worstSeverity === 'error') {
        dot.classList.add('red');
      } else if (data.worstSeverity === 'warning') {
        dot.classList.add('yellow');
      } else {
        dot.classList.add('green');
      }

      // Update modal body with error details
      const modalBody = document.getElementById('errorModalBody');
      if (modalBody && data.errors.length > 0) {
        modalBody.innerHTML = data.errors.map(e => {
          const severityClass = 'severity-' + e.severity;
          return '<div class="error-item ' + severityClass + '">' +
            '<div class="error-code">' + _esc(e.code) + '</div>' +
            '<div class="error-message">' + _esc(e.message) + '</div>' +
            '<div class="error-detail">' + _esc(e.detail || '') + '</div>' +
            '<div class="error-source">Source: ' + _esc(e.source) + ' · ' + _relTime(e.timestamp) + '</div>' +
            '</div>';
        }).join('');
      } else if (modalBody) {
        modalBody.innerHTML = '<p>No errors reported.</p>';
      }
    }

    function handleBackupStatus(data) {
      if (!data || !data.backup) return;
      backupStatus = data.backup;
      updateBackupIndicator();
      updateBackupActivity();
    }

    function updateBackupIndicator() {
      const statusEl = document.getElementById('backupStatus');
      const lastBackupEl = document.getElementById('simpleLastBackup');
      const statusDot = document.getElementById('backupStatusDot');
      if (!statusEl) return;

      const status = backupStatus.status || 'unknown';
      let statusText = 'UNKNOWN';
      let statusClass = 'gray';

      if (status === 'healthy') {
        statusText = 'HEALTHY';
        statusClass = 'green';
      } else if (status === 'degraded') {
        statusText = 'DEGRADED';
        statusClass = 'yellow';
      } else if (status === 'critical') {
        statusText = 'CRITICAL';
        statusClass = 'red';
      }

      statusEl.textContent = 'Backup Status: ' + statusText;
      statusEl.className = 'status-value backup-' + statusClass;

      // Update status dot
      if (statusDot) {
        statusDot.className = 'backup-status-dot backup-dot-' + statusClass;
      }

      // Update last backup display with dual time
      if (backupStatus.lastAttempt) {
        const relTime = _relTime(backupStatus.lastAttempt.timestamp);
        const absTime = _absTime(backupStatus.lastAttempt.timestamp);
        const success = backupStatus.lastAttempt.success;

        if (lastBackupEl) {
          if (success) {
            lastBackupEl.textContent = relTime;
            lastBackupEl.classList.remove('failed');
          } else {
            lastBackupEl.textContent = 'FAILED ' + relTime;
            lastBackupEl.classList.add('failed');
          }
        }

        // Add absolute time tooltip with failure detail
        let title = success ? absTime : 'FAILED ' + absTime;
        if (backupStatus.lastFailure && backupStatus.lastFailure.detail) {
          title += ' - ' + backupStatus.lastFailure.detail;
        }
        if (lastBackupEl) lastBackupEl.title = title;
      } else if (lastBackupEl) {
        lastBackupEl.textContent = 'Never';
        lastBackupEl.title = 'No backup attempts recorded';
      }
    }

    function updateBackupActivity() {
      const activityEl = document.getElementById('backupActivity');
      if (!activityEl || !backupStatus.recentEvents || backupStatus.recentEvents.length === 0) {
        if (activityEl) activityEl.innerHTML = '<p>No backup activity recorded.</p>';
        return;
      }

      activityEl.innerHTML = backupStatus.recentEvents.map(ev => {
        const time = new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const status = ev.success ? 'SUCCESS' : 'FAILED';
        const file = ev.file ? _esc(path.basename(ev.file)) : 'unknown';
        const subtype = ev.subtype || 'unknown';
        const detail = ev.detail ? ' (' + _esc(ev.detail) + ')' : '';
        return '<div class="backup-activity-item"><span class="backup-time">' + time + '</span><span class="backup-status ' + (ev.success ? 'success' : 'failed') + '">' + status + '</span><span class="backup-subtype">' + _esc(subtype) + '</span><span class="backup-file">' + file + '</span>' + detail + '</div>';
      }).join('');
    }

    function _absTime(ts) {
      const d = new Date(ts);
      return d.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    }

    function setupErrorModal() {
      const modal = document.getElementById('errorModal');
      const dot = document.getElementById('systemStatusDot');
      const closeBtn = document.getElementById('errorModalClose');
      const clearBtn = document.getElementById('clearErrors');

      if (dot && modal) {
        dot.addEventListener('click', () => {
          modal.style.display = 'flex';
        });
      }

      if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => {
          modal.style.display = 'none';
        });
      }

      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          vscode.postMessage({ command: 'clearErrors' });
        });
      }

      // Close modal on outside click
      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            modal.style.display = 'none';
          }
        });
      }
    }

    try {
      window.addEventListener('message', e => handleMessage(e.data));
      applyMode();
      switchTab(currentTab);
      renderArchDiagram();
      setupArchInteraction();
      setupControls();
      setupSettings();
      setupErrorModal();
      vscode.postMessage({ command: 'cockpitReady' });
    } catch (err) {
      document.body.innerHTML = '<div style="color:#ff3d71;padding:16px;font-family:monospace"><strong>Cockpit init error:</strong><br>' + err.message + '<br><pre>' + (err.stack || '') + '</pre></div>';
    }
  `;
}
