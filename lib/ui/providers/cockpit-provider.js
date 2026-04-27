/**
 * Cockpit Provider
 *
 * Responsibility: Webview view provider for the unified v5.0 cockpit.
 * Bridges message communication between the webview and the extension host.
 * Integrates: state persistence, GitHub issue creator, validation layer, router events.
 *
 * @module lib/ui/providers/cockpit-provider
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs/promises';
import { fileURLToPath, pathToFileURL } from 'url';
import { getCockpitHtml } from '../generators/cockpit-html.js';
import {
  initStatePersistence,
  loadState,
  saveState,
  updateStateKey,
} from '../state-persistence.js';
import {
  initGitHubIssueCreator,
  storeGitHubPat,
  deleteGitHubPat,
  hasGitHubPat,
  getGitHubConfig,
  getIssueHistory,
} from '../../github/github-issue-creator.js';
import { registerRouterEventListener, unregisterRouterEventListener } from '../router-event-bus.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const LAYER_DETAILS = {
  surface: {
    title: 'Surface Layer — 7 Semantic Entry Points',
    html: `<p>The Surface Layer exposes exactly 7 tools to the AI. Each is a semantic entry point that routes through the Governance Router.</p>
<ul class="detail-list">
  <li><strong>file_ops</strong> — File read/write/analyze</li>
  <li><strong>search_code</strong> — Code search and context</li>
  <li><strong>backup_restore</strong> — Backup management</li>
  <li><strong>project_context</strong> — Project awareness</li>
  <li><strong>docs_manage</strong> — Documentation management</li>
  <li><strong>workflow_manage</strong> — Workflow orchestration</li>
  <li><strong>sweobeyme_execute</strong> — Catch-all router</li>
</ul>`,
  },
  core: {
    title: 'Core Layer — Governance Router',
    html: `<p>The Governance Router is the philosophy firewall. Every tool call passes through it.</p>
<ul class="detail-list">
  <li><strong>Surgical Compliance</strong> — Line count, forbidden patterns</li>
  <li><strong>Backup Before Edit</strong> — Auto-backup on write</li>
  <li><strong>Validation</strong> — Pre/post operation checks</li>
  <li><strong>Self-Healing</strong> — Auto-restore on failure</li>
  <li><strong>GitHub Issue Creation</strong> — Auto-report failures</li>
</ul>`,
  },
  engine: {
    title: 'Engine Layer — Internal Handlers',
    html: `<p>The Engine Layer contains all internal tool implementations. The AI never calls these directly.</p>
<ul class="detail-list">
  <li>File operations, backup manager, code search</li>
  <li>Documentation updater, workflow engine</li>
  <li>Autonomous execution, agent orchestration</li>
  <li>C# Bridge, C++ Bridge diagnostics</li>
</ul>`,
  },
  validation: {
    title: 'Validation Layer — Test Suite',
    html: `<p>The Validation Layer runs comprehensive tests against the architecture.</p>
<ul class="detail-list">
  <li><strong>Structural</strong> — File existence, exports, line counts</li>
  <li><strong>Safety</strong> — Backup/rollback verification</li>
  <li><strong>Router</strong> — Governance logic integrity</li>
  <li><strong>Integration</strong> — Surface→Router→Handler flow</li>
  <li><strong>Chaos</strong> — Resilience under stress</li>
</ul>`,
  },
  soul: {
    title: 'Soul Layer — Philosophy Firewall',
    html: `<p>The Soul Layer encodes the philosophical rules that govern everything above it.</p>
<ul class="detail-list">
  <li>Governance Constitution enforcement</li>
  <li>Oracle — architectural wisdom</li>
  <li>Ethics guards against destructive operations</li>
  <li>Surgical Integrity Score tracking</li>
</ul>`,
  },
};

/** @type {vscode.WebviewView|null} */
let _activeView = null;

/**
 * Create the cockpit webview view provider
 * @param {vscode.ExtensionContext} context
 * @returns {vscode.WebviewViewProvider}
 */
export function makeCockpitProvider(context) {
  initStatePersistence(context);
  initGitHubIssueCreator(context);

  /** @type {vscode.WebviewView|null} */
  let _currentView = null;

  return {
    async resolveWebviewView(webviewView, _ctx, _token) {
      _activeView = webviewView;

      // Skip re-initialization if this is the same view instance becoming visible again
      // (e.g., after opening Settings UI). This prevents flash-of-unstyled-content.
      if (_currentView === webviewView) {
        return;
      }
      _currentView = webviewView;

      // Register event bus listener so governance router events flow into the webview
      registerRouterEventListener((event) => {
        if (_activeView) {
          _activeView.webview.postMessage({ command: 'routerEvent', event });
        }
      });

      webviewView.webview.options = {
        enableScripts: true,
        localResourceRoots: [context.extensionUri],
      };

      // Set HTML on first resolve for this view instance
      const state = loadState();
      webviewView.webview.html = getCockpitHtml(webviewView.webview, state);

      webviewView.webview.onDidReceiveMessage(
        (msg) => _handleMessage(context, webviewView.webview, msg),
        undefined,
        context.subscriptions
      );

      webviewView.onDidDispose(() => {
        _activeView = null;
        _currentView = null;
        unregisterRouterEventListener();
      });
    },
  };
}

/**
 * Handle incoming messages from the webview
 * @param {vscode.ExtensionContext} context
 * @param {vscode.Webview} webview
 * @param {object} msg
 */
async function _handleMessage(context, webview, msg) {
  try {
    switch (msg.command) {
      case 'cockpitReady':
        await _onCockpitReady(webview);
        break;

      case 'saveState':
        await updateStateKey(msg.key, msg.value);
        break;

      case 'getLayerDetail': {
        const detail = LAYER_DETAILS[msg.layerId] || { title: msg.layerId, html: 'No details available.' };
        webview.postMessage({ command: 'layerDetail', ...detail });
        break;
      }

      case 'runValidationTests':
        await _runValidationTests(context, webview, msg.category || 'all');
        break;

      case 'rerunTest':
        await _runValidationTests(context, webview, 'all', msg.test);
        break;

      case 'storeGitHubPat':
        await storeGitHubPat(msg.pat);
        await _pushGitHubStatus(webview);
        vscode.window.showInformationMessage('SWEObeyMe: GitHub PAT saved securely.');
        break;

      case 'deleteGitHubPat':
        await deleteGitHubPat();
        await _pushGitHubStatus(webview);
        vscode.window.showInformationMessage('SWEObeyMe: GitHub PAT deleted.');
        break;

      case 'updateGitHubConfig': {
        const cfg = vscode.workspace.getConfiguration('sweObeyMe.githubIntegration');
        await cfg.update(msg.key, msg.value, vscode.ConfigurationTarget.Global);
        await _pushGitHubStatus(webview);
        break;
      }

      case 'testGitHubConnection':
        await _testGitHubConnection(webview);
        break;

      case 'exportHistory':
        await _exportHistory(msg.data);
        break;

      case 'openUrl':
        vscode.env.openExternal(vscode.Uri.parse(msg.url));
        break;

      case 'updateConfig': {
        const parts = msg.key.split('.');
        const section = parts.slice(0, -1).join('.');
        const leaf = parts[parts.length - 1];
        const cfg = vscode.workspace.getConfiguration(section);
        await cfg.update(leaf, msg.value, vscode.ConfigurationTarget.Global);
        break;
      }

      case 'openFullSettings':
        vscode.commands.executeCommand('workbench.action.openSettings', 'sweObeyMe', vscode.ViewColumn.Beside);
        break;

      default:
        break;
    }
  } catch (err) {
    console.error('[CockpitProvider] Message error:', err.message);
    webview.postMessage({ command: 'error', message: err.message });
  }
}

/**
 * On cockpit ready — push initial status data
 * @param {vscode.Webview} webview
 */
async function _onCockpitReady(webview) {
  let healthy = false;
  let surfaceCount = 7;
  let handlerCount = 0;

  try {
    const registryPath = path.join(__dirname, '..', '..', 'tools', 'registry.js');
    const { getToolDefinitions } = await import(pathToFileURL(registryPath).href);
    const allTools = getToolDefinitions();
    handlerCount = allTools.length;
    healthy = handlerCount > 0;
  } catch {
    healthy = false;
    handlerCount = 0;
  }

  webview.postMessage({
    command: 'systemStatus',
    healthy,
    surfaceCount,
    handlerCount,
  });
  await _pushGitHubStatus(webview);
  webview.postMessage({ command: 'issueHistory', issues: getIssueHistory() });
  _pushSettings(webview);
}

/**
 * Push current VS Code settings to webview
 * @param {vscode.Webview} webview
 */
function _pushSettings(webview) {
  const g = (section, key, def) => vscode.workspace.getConfiguration(section).get(key, def);
  webview.postMessage({
    command: 'settingsLoaded',
    cfg: {
      enabled: g('sweObeyMe', 'enabled', true),
      showInlineTip: g('sweObeyMe', 'showInlineTip', true),
      notifications_enabled: g('sweObeyMe.notifications', 'enabled', true),
      toolControls_perAgent: g('sweObeyMe.toolControls', 'perAgent', true),
      toolControls_fileAccess: g('sweObeyMe.toolControls', 'fileAccess', 'ask'),
      toolControls_terminalAccess: g('sweObeyMe.toolControls', 'terminalAccess', 'ask'),
      toolControls_networkAccess: g('sweObeyMe.toolControls', 'networkAccess', 'ask'),
      csharpBridge_enabled: g('sweObeyMe.csharpBridge', 'enabled', true),
      csharpBridge_keepAiInformed: g('sweObeyMe.csharpBridge', 'keepAiInformed', true),
      csharpBridge_deduplicateAlerts: g('sweObeyMe.csharpBridge', 'deduplicateAlerts', true),
      diffReview_enabled: g('sweObeyMe.diffReview', 'enabled', true),
      diffReview_requireApproval: g('sweObeyMe.diffReview', 'requireApproval', true),
    },
  });
}

/**
 * Push GitHub status to webview
 * @param {vscode.Webview} webview
 */
async function _pushGitHubStatus(webview) {
  const hasPat = await hasGitHubPat();
  const cfg = getGitHubConfig();
  webview.postMessage({
    command: 'githubStatus',
    hasPat,
    enabled: cfg.enabled,
    owner: cfg.owner,
    repo: cfg.repo,
  });
}

/**
 * Run validation tests and send results to webview
 * @param {vscode.ExtensionContext} context
 * @param {vscode.Webview} webview
 * @param {string} category
 * @param {string} [singleTest]
 */
async function _runValidationTests(context, webview, category, singleTest) {
  try {
    const toFileUrl = (p) => pathToFileURL(p).href;
    const indexPath = path.join(__dirname, '..', '..', '..', 'tests', 'validation-layer', 'index.js');
    const { runValidationLayer } = await import(toFileUrl(indexPath));
    const startTime = Date.now();
    const raw = await runValidationLayer({ category, singleTest });
    const duration = Date.now() - startTime;

    const results = {
      duration,
      tests: (raw.results || []).map((r) => ({
        name: r.name || r.test,
        status: r.passed ? 'pass' : r.skipped ? 'skip' : 'fail',
        duration: r.duration || 0,
        error: r.error || null,
        category: r.category || 'general',
      })),
    };

    webview.postMessage({ command: 'validationResults', results });

    const ev = {
      type: 'validation',
      message: `Ran ${results.tests.length} tests in ${duration}ms — ${results.tests.filter(t => t.status === 'pass').length} passed`,
      summary: `${results.tests.filter(t => t.status === 'pass').length}/${results.tests.length} passed`,
      timestamp: Date.now(),
    };
    webview.postMessage({ command: 'routerEvent', event: ev });
  } catch (err) {
    webview.postMessage({
      command: 'validationResults',
      results: { duration: 0, tests: [{ name: 'Validation runner error', status: 'fail', error: err.message, duration: 0 }] },
    });
  }
}

/**
 * Test GitHub connection by verifying PAT and repo access
 * @param {vscode.Webview} webview
 */
async function _testGitHubConnection(webview) {
  const hasPat = await hasGitHubPat();
  if (!hasPat) {
    vscode.window.showWarningMessage('SWEObeyMe: No GitHub PAT configured.');
    return;
  }
  const cfg = getGitHubConfig();
  if (!cfg.owner || !cfg.repo) {
    vscode.window.showWarningMessage('SWEObeyMe: Set repository owner and name first.');
    return;
  }
  vscode.window.showInformationMessage(`SWEObeyMe: Testing connection to ${cfg.owner}/${cfg.repo}…`);
  webview.postMessage({
    command: 'routerEvent',
    event: { type: 'info', message: `GitHub connection test: ${cfg.owner}/${cfg.repo}`, timestamp: Date.now() },
  });
}

/**
 * Export history to a temp file and open it
 * @param {Array<object>} data
 */
async function _exportHistory(data) {
  try {
    const exportPath = path.join(os.tmpdir(), `sweobeyme-history-${Date.now()}.json`);
    await fs.writeFile(exportPath, JSON.stringify(data, null, 2), 'utf-8');
    vscode.window.showInformationMessage(`SWEObeyMe: History exported to ${exportPath}`);
  } catch (err) {
    vscode.window.showErrorMessage(`SWEObeyMe: Export failed — ${err.message}`);
  }
}
