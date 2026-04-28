/**
 * Cockpit CSS
 * @module lib/ui/generators/cockpit-css
 */
export function getCockpitCss() {
  return `
    :root {
      --bg: #0d0d12;
      --surface: #13131c;
      --border: #1e1e2e;
      --text: #e0e0e0;
      --text-dim: #777;
      --accent-cyan: #00d4ff;
      --accent-purple: #7b2fff;
      --accent-orange: #ff6b2b;
      --accent-green: #00e676;
      --accent-red: #ff3d71;
      --accent-yellow: #ffd600;
      --font-mono: 'JetBrains Mono', 'Cascadia Code', 'Consolas', monospace;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: var(--bg); color: var(--text); font-family: var(--font-mono); font-size: 12px; overflow-y: auto; }
    #cockpit { display: flex; flex-direction: column; min-height: 100vh; }
    .cockpit-header { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: var(--surface); border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 100; }
    .header-brand { display: flex; align-items: center; gap: 6px; }
    .brand-icon { color: var(--accent-cyan); font-size: 18px; line-height: 1; }
    .brand-name { font-weight: 700; font-size: 13px; color: var(--text); letter-spacing: 0.5px; }
    .brand-version { font-size: 10px; color: var(--accent-purple); background: #7b2fff22; border: 1px solid #7b2fff44; border-radius: 4px; padding: 1px 5px; }
    .header-controls { display: flex; align-items: center; gap: 10px; }
    .mode-toggle { display: flex; align-items: center; gap: 4px; cursor: pointer; background: var(--border); border: 1px solid #333; border-radius: 6px; padding: 4px 10px; user-select: none; transition: background 0.2s; }
    .mode-toggle:hover { background: #232335; }
    .mode-label { font-size: 11px; font-weight: 600; }
    .mode-caret { font-size: 10px; color: var(--text-dim); }
    .status-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--accent-green); box-shadow: 0 0 6px var(--accent-green); animation: pulse 2s infinite; }
    .status-dot.error { background: var(--accent-red); box-shadow: 0 0 6px var(--accent-red); }
    .status-dot.green { background: #3fb950; box-shadow: 0 0 8px #3fb950; }
    .status-dot.yellow { background: #f1c40f; box-shadow: 0 0 8px #f1c40f; }
    .status-dot.red { background: #e74c3c; box-shadow: 0 0 8px #e74c3c; }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
    .panel { padding: 12px; flex: 1; }
    .hidden { display: none !important; }
    .health-indicator { margin-bottom: 16px; }
    .health-bar { height: 6px; background: var(--border); border-radius: 3px; overflow: hidden; margin-bottom: 6px; }
    .health-fill { height: 100%; width: 100%; background: linear-gradient(90deg, var(--accent-green), var(--accent-cyan)); border-radius: 3px; transition: width 0.5s; }
    .health-label { font-size: 11px; color: var(--accent-green); font-weight: 600; letter-spacing: 0.5px; }
    .status-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px; }
    .status-card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 10px; display: flex; align-items: center; gap: 8px; }
    .status-icon { font-size: 16px; }
    .status-title { font-size: 9px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
    .status-value { font-size: 11px; color: var(--text-dim); }
    .status-value.failed { color: var(--accent-red); font-weight: 600; }
    .status-value.backup-green { color: var(--accent-green); font-weight: 600; }
    .status-value.backup-yellow { color: var(--accent-yellow); font-weight: 600; }
    .status-value.backup-red { color: var(--accent-red); font-weight: 600; }
    .status-value.backup-gray { color: var(--text-dim); font-weight: 600; font-size: 9px; margin-top: 2px; }
    .backup-status-dot { width: 8px; height: 8px; border-radius: 50%; margin-top: 4px; }
    .backup-dot-green { background: var(--accent-green); box-shadow: 0 0 4px var(--accent-green); }
    .backup-dot-yellow { background: var(--accent-yellow); box-shadow: 0 0 4px var(--accent-yellow); }
    .backup-dot-red { background: var(--accent-red); box-shadow: 0 0 4px var(--accent-red); }
    .backup-dot-gray { background: var(--text-dim); }
    .layer-diagram-simple { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 12px; margin-bottom: 12px; }
    .layer-label { font-size: 9px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
    #archSvgSimple { width: 100%; height: auto; }
    .tool-counts { display: flex; gap: 16px; font-size: 11px; color: var(--text-dim); }
    .tool-count strong { color: var(--accent-cyan); }
    .tab-nav { display: flex; gap: 2px; margin-bottom: 12px; background: var(--surface); border-radius: 8px; padding: 4px; border: 1px solid var(--border); flex-wrap: wrap; }
    .tab-btn { flex: 1; padding: 6px 4px; font-size: 10px; font-family: var(--font-mono); background: transparent; border: none; color: var(--text-dim); border-radius: 6px; cursor: pointer; transition: all 0.2s; }
    .tab-btn:hover { color: var(--text); background: var(--border); }
    .tab-btn.active { background: var(--accent-purple); color: #fff; font-weight: 600; }
    .tab-panel { display: none; }
    .tab-panel.active { display: block; }
    .arch-controls, .monitor-controls, .validation-controls, .history-controls { display: flex; gap: 6px; margin-bottom: 10px; align-items: center; flex-wrap: wrap; }
    .ctrl-btn { padding: 4px 10px; font-size: 11px; font-family: var(--font-mono); background: var(--surface); border: 1px solid var(--border); color: var(--text); border-radius: 6px; cursor: pointer; transition: all 0.2s; }
    .ctrl-btn:hover { border-color: var(--accent-cyan); color: var(--accent-cyan); }
    .ctrl-btn.primary { border-color: var(--accent-purple); color: var(--accent-purple); }
    .ctrl-btn.primary:hover { background: var(--accent-purple); color: #fff; }
    .ctrl-btn.danger { border-color: var(--accent-red); color: var(--accent-red); }
    .ctrl-btn.danger:hover { background: var(--accent-red); color: #fff; }
    .filter-select, .search-input, .config-input { background: var(--surface); border: 1px solid var(--border); color: var(--text); border-radius: 6px; padding: 4px 8px; font-family: var(--font-mono); font-size: 11px; }
    .filter-select:focus, .search-input:focus, .config-input:focus { outline: none; border-color: var(--accent-purple); }
    .search-input { flex: 1; }
    .arch-container { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 10px; overflow: auto; cursor: grab; max-height: 320px; }
    .arch-container:active { cursor: grabbing; }
    #archSvg { width: 100%; min-height: 480px; }
    .layer-node rect { transition: fill 0.2s; }
    .layer-node:hover rect:first-child { fill-opacity: 0.25; }
    .layer-node.selected rect:first-child { fill-opacity: 0.3; stroke-width: 2.5; }
    .layer-detail { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 12px; margin-top: 10px; min-height: 60px; }
    .layer-detail h4 { font-size: 12px; color: var(--accent-cyan); margin-bottom: 6px; }
    .layer-detail-body { font-size: 11px; color: var(--text-dim); line-height: 1.6; }
    .event-stream { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 10px; max-height: 380px; overflow-y: auto; font-family: var(--font-mono); }
    .event-item { padding: 5px 8px; border-bottom: 1px solid var(--border); display: flex; gap: 8px; align-items: flex-start; animation: fadeIn 0.3s; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
    .event-time { color: var(--text-dim); font-size: 9px; min-width: 56px; padding-top: 1px; }
    .event-badge { font-size: 9px; padding: 1px 5px; border-radius: 4px; white-space: nowrap; }
    .event-badge.router { background: #7b2fff33; color: var(--accent-purple); }
    .event-badge.backup { background: #00d4ff22; color: var(--accent-cyan); }
    .event-badge.validation { background: #00e67622; color: var(--accent-green); }
    .event-badge.error { background: #ff3d7122; color: var(--accent-red); }
    .event-badge.info { background: #ffd60022; color: var(--accent-yellow); }
    .event-text { font-size: 11px; color: var(--text); flex: 1; }
    .event-placeholder, .test-placeholder, .history-placeholder { color: var(--text-dim); font-size: 11px; padding: 20px; text-align: center; }
    .test-summary { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; }
    .test-badge { padding: 3px 8px; border-radius: 6px; font-size: 10px; font-weight: 600; }
    .test-badge.pass { background: #00e67622; color: var(--accent-green); }
    .test-badge.fail { background: #ff3d7122; color: var(--accent-red); }
    .test-badge.skip { background: #ffd60022; color: var(--accent-yellow); }
    .test-results { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 10px; max-height: 340px; overflow-y: auto; }
    .test-item { padding: 6px 8px; border-bottom: 1px solid var(--border); display: flex; gap: 8px; align-items: center; }
    .test-icon { width: 16px; text-align: center; }
    .test-name { font-size: 11px; flex: 1; }
    .test-duration { font-size: 10px; color: var(--text-dim); }
    .test-rerun { font-size: 10px; cursor: pointer; color: var(--accent-purple); }
    .test-detail { font-size: 10px; color: var(--accent-red); padding: 4px 8px 6px 28px; background: #ff3d7108; border-radius: 4px; }
    .history-list { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; max-height: 360px; overflow-y: auto; }
    .history-item { padding: 6px 12px; border-bottom: 1px solid var(--border); display: flex; gap: 8px; align-items: center; }
    .history-time { font-size: 9px; color: var(--text-dim); min-width: 80px; }
    .history-text { font-size: 11px; flex: 1; }
    .github-config { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 14px; margin-bottom: 14px; }
    .section-title { font-size: 11px; font-weight: 700; color: var(--accent-cyan); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
    .config-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; flex-wrap: wrap; }
    .config-label { font-size: 10px; color: var(--text-dim); min-width: 120px; }
    .config-input { flex: 1; min-width: 140px; }
    .pat-row { display: flex; gap: 6px; flex: 1; flex-wrap: wrap; }
    .config-status { font-size: 11px; color: var(--accent-green); }
    .config-status.unconfigured { color: var(--text-dim); }
    .rate-limit-bar { display: flex; justify-content: space-between; font-size: 10px; color: var(--text-dim); margin: 10px 0; padding: 6px 0; border-top: 1px solid var(--border); }
    .rate-status { color: var(--accent-green); }
    .toggle-switch { position: relative; display: inline-block; width: 36px; height: 20px; }
    .toggle-switch input { opacity: 0; width: 0; height: 0; }
    .toggle-slider { position: absolute; cursor: pointer; inset: 0; background: var(--border); border-radius: 20px; transition: 0.3s; }
    .toggle-slider:before { position: absolute; content: ""; height: 14px; width: 14px; left: 3px; bottom: 3px; background: var(--text-dim); border-radius: 50%; transition: 0.3s; }
    .toggle-switch input:checked + .toggle-slider { background: var(--accent-purple); }
    .toggle-switch input:checked + .toggle-slider:before { transform: translateX(16px); background: #fff; }
    .github-history { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 14px; }
    .issue-list { max-height: 220px; overflow-y: auto; margin-top: 8px; }
    .issue-item { padding: 6px; border-bottom: 1px solid var(--border); display: flex; gap: 8px; align-items: center; }
    .issue-number { font-size: 10px; color: var(--accent-purple); min-width: 32px; }
    .issue-title { font-size: 11px; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .issue-link { font-size: 10px; color: var(--accent-cyan); text-decoration: none; }
    .issue-link:hover { text-decoration: underline; }
    .issue-time { font-size: 9px; color: var(--text-dim); }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: var(--bg); }
    ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: #333; }
    .icon-pass { color: var(--accent-green); }
    .icon-fail { color: var(--accent-red); }
    .icon-skip { color: var(--accent-yellow); }
    .layer-node { cursor: pointer; }
    .detail-list { margin: 8px 0 0 16px; line-height: 2; }
    .settings-section { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 12px; margin-bottom: 12px; }
    .settings-group-title { font-size: 10px; font-weight: 700; color: var(--accent-cyan); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
    .setting-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 6px 0; border-bottom: 1px solid var(--border); flex-wrap: wrap; }
    .setting-row:last-child { border-bottom: none; }
    .setting-label { font-size: 10px; color: var(--text); flex: 1; }
    .setting-desc { font-size: 9px; color: var(--text-dim); margin-top: 2px; }
    .setting-control { display: flex; align-items: center; gap: 6px; }
    select.setting-select { background: var(--bg); border: 1px solid var(--border); color: var(--text); border-radius: 4px; padding: 2px 6px; font-family: var(--font-mono); font-size: 10px; }
    .open-settings-btn { margin-top: 10px; width: 100%; }
    .community-links { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 14px; }
    .community-link { display: flex; align-items: center; gap: 8px; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 9px 10px; text-decoration: none; color: var(--text); transition: border-color 0.2s, background 0.2s; cursor: pointer; }
    .modal { display: none; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); align-items: center; justify-content: center; }
    .modal-content { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; width: 90%; max-width: 600px; max-height: 80vh; overflow: hidden; display: flex; flex-direction: column; }
    .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid var(--border); }
    .modal-header h2 { font-size: 13px; font-weight: 700; color: var(--accent-cyan); }
    .modal-close { background: none; border: none; color: var(--text-dim); font-size: 20px; cursor: pointer; padding: 0; line-height: 1; }
    .modal-close:hover { color: var(--text); }
    .modal-body { padding: 16px; overflow-y: auto; flex: 1; }
    .modal-section { border-top: 1px solid var(--border); }
    .modal-section h3 { font-size: 12px; font-weight: 600; color: var(--accent-cyan); padding: 12px 16px; margin: 0; }
    .modal-footer { padding: 12px 16px; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; }
    .modal-btn { background: var(--accent-purple); border: none; color: #fff; border-radius: 6px; padding: 6px 14px; font-size: 11px; font-weight: 600; cursor: pointer; font-family: var(--font-mono); }
    .modal-btn:hover { background: #8c3fff; }
    .error-item { background: var(--bg); border: 1px solid var(--border); border-radius: 6px; padding: 10px; margin-bottom: 8px; }
    .error-item:last-child { margin-bottom: 0; }
    .error-item.severity-critical { border-left: 3px solid var(--accent-red); }
    .error-item.severity-error { border-left: 3px solid var(--accent-orange); }
    .error-item.severity-warning { border-left: 3px solid var(--accent-yellow); }
    .error-item.severity-info { border-left: 3px solid var(--accent-cyan); }
    .error-code { font-size: 10px; color: var(--accent-purple); font-weight: 700; margin-bottom: 4px; }
    .backup-activity-item { display: grid; grid-template-columns: 70px 80px 100px 1fr; gap: 8px; padding: 8px; border-bottom: 1px solid var(--border); font-size: 10px; align-items: center; }
    .backup-activity-item:last-child { border-bottom: none; }
    .backup-time { color: var(--text-dim); font-family: var(--font-mono); }
    .backup-status { font-weight: 600; font-size: 9px; text-transform: uppercase; }
    .backup-status.success { color: var(--accent-green); }
    .backup-status.failed { color: var(--accent-red); }
    .backup-subtype { color: var(--accent-cyan); font-size: 9px; }
    .backup-file { color: var(--text); font-family: var(--font-mono); }
    .error-message { font-size: 11px; color: var(--text); margin-bottom: 4px; }
    .error-detail { font-size: 10px; color: var(--text-dim); margin-bottom: 4px; white-space: pre-wrap; }
    .error-source { font-size: 9px; color: var(--text-dim); }
    .community-link:hover { border-color: var(--accent-cyan); background: #00d4ff0a; }
    .community-icon { font-size: 18px; line-height: 1; flex-shrink: 0; }
    .community-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .community-name { font-size: 11px; font-weight: 700; color: var(--text); }
    .community-desc { font-size: 9px; color: var(--text-dim); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  `;
}
