/**
 * GitHub Issue Creator
 *
 * Responsibility: Automatic GitHub issue creation on governance router failures.
 * Security: PAT stored in VS Code secret storage, never logged.
 * Rate limit: 1 issue per minute. Duplicate detection via hash.
 *
 * @module lib/github/github-issue-creator
 */

import * as https from 'https';
import * as crypto from 'crypto';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const SECRET_KEY = 'sweObeyMe.githubPat';
const CONFIG_KEY = 'sweObeyMe.githubIntegration';
const WEBHOOK_URL_KEY = 'sweObeyMe.webhookUrl';
const RATE_LIMIT_MS = 60_000;
const DUPLICATE_WINDOW_MS = 3_600_000;

/** @type {number[]} Timestamps of recent issue creations */
const _rateLimitTimestamps = [];

/** @type {Map<string, number>} hash → timestamp */
const _recentHashes = new Map();

/** @type {vscode.ExtensionContext|null} */
let _context = null;

/** @type {boolean} Whether vscode is available (VS Code vs Windsurf/standalone) */
let _vscodeAvailable = false;

/**
 * Check if vscode is available and cache the result
 */
function _checkVscodeAvailable() {
  if (_vscodeAvailable) return true;
  try {
    require('vscode');
    _vscodeAvailable = true;
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Get vscode module if available
 */
function _getVscode() {
  if (!_checkVscodeAvailable()) return null;
  try {
    return require('vscode');
  } catch (e) {
    return null;
  }
}

/** @type {Array<object>} In-memory issue history (last 50) */
const _issueHistory = [];

/**
 * Initialize with VS Code extension context
 * @param {vscode.ExtensionContext} context
 */
export function initGitHubIssueCreator(context) {
  _context = context;
}

/**
 * Store GitHub PAT in VS Code secret storage
 * @param {string} pat
 */
export async function storeGitHubPat(pat) {
  if (!_checkVscodeAvailable()) {
    console.warn('[GitHubIssueCreator] vscode not available, cannot store PAT');
    return false;
  }
  if (!_context) throw new Error('GitHub issue creator not initialized');
  await _context.secrets.store(SECRET_KEY, pat);
  return true;
}

/**
 * Delete stored GitHub PAT
 */
export async function deleteGitHubPat() {
  if (!_checkVscodeAvailable() || !_context) return;
  await _context.secrets.delete(SECRET_KEY);
}

/**
 * Check if a PAT is configured (without revealing it)
 * @returns {Promise<boolean>}
 */
export async function hasGitHubPat() {
  if (!_checkVscodeAvailable() || !_context) return false;
  const pat = await _context.secrets.get(SECRET_KEY);
  return Boolean(pat && pat.length > 0);
}

/**
 * Get GitHub integration config from VS Code settings
 * @returns {object}
 */
export function getGitHubConfig() {
  if (!_checkVscodeAvailable()) {
    // Return default config when vscode not available (Windsurf/standalone)
    return {
      enabled: false,
      owner: '',
      repo: '',
    };
  }
  const vscodeMod = _getVscode();
  if (!vscodeMod) {
    return {
      enabled: false,
      owner: '',
      repo: '',
    };
  }
  const cfg = vscodeMod.workspace.getConfiguration(CONFIG_KEY);
  return {
    enabled: cfg.get('enabled', false),
    owner: cfg.get('owner', ''),
    repo: cfg.get('repo', ''),
  };
}

/**
 * Get webhook URL from VS Code settings
 * @returns {string}
 */
export function getWebhookUrl() {
  if (!_checkVscodeAvailable()) return '';
  const vscodeMod = _getVscode();
  if (!vscodeMod) return '';
  return vscodeMod.workspace.getConfiguration().get(WEBHOOK_URL_KEY, '');
}

/**
 * Get issue creation history (last 50)
 * @returns {Array<object>}
 */
export function getIssueHistory() {
  return [..._issueHistory];
}

/**
 * Create a GitHub issue on router failure
 * @param {object} failure - Failure context from governance router
 * @param {string} failure.type - 'validation_failure' | 'self_healing' | 'handler_throw' | 'invalid_domain_action' | 'forbidden_pattern' | 'backup_restore' | 'chaos_test'
 * @param {string} failure.domain
 * @param {string} failure.action
 * @param {string} failure.handlerName
 * @param {string} failure.diagnostics
 * @param {string} [failure.backupDiff]
 * @param {string} [failure.filePath]
 * @param {string} [failure.routerTrace]
 * @returns {Promise<object|null>}
 */
export async function createFailureIssue(failure) {
  const webhookUrl = getWebhookUrl();
  const config = getGitHubConfig();
  const pat = await _context?.secrets.get(SECRET_KEY);

  // Try webhook first (no PAT needed, automatic reporting)
  if (webhookUrl) {
    const hash = _generateHash(failure.domain, failure.action, failure.diagnostics);
    if (_isDuplicate(hash)) {
      _logFailureLocally(failure, 'Duplicate');
      return null;
    }

    try {
      const issue = await _postToWebhook(webhookUrl, failure);
      _recordCreation(hash, failure, issue);
      return issue;
    } catch (err) {
      console.error('[GitHubIssueCreator] Webhook failed:', err.message);
      _logFailureLocally(failure, `Webhook error: ${err.message}`);
      // Fall through to GitHub/local
    }
  }

  // Try GitHub if configured (user's own repo)
  if (config.enabled && config.owner && config.repo && pat) {
    if (!_canCreateIssue()) {
      _logFailureLocally(failure, 'Rate limited');
      return null;
    }

    const hash = _generateHash(failure.domain, failure.action, failure.diagnostics);
    if (_isDuplicate(hash)) {
      _logFailureLocally(failure, 'Duplicate');
      return null;
    }

    const payload = _buildPayload(failure);

    try {
      const issue = await _postIssue(config.owner, config.repo, pat, payload);
      _recordCreation(hash, failure, issue);
      return issue;
    } catch (err) {
      console.error('[GitHubIssueCreator] Failed to create issue:', err.message);
      _logFailureLocally(failure, `GitHub error: ${err.message}`);
      return null;
    }
  }

  // Fallback: Log locally if nothing configured
  _logFailureLocally(failure, 'No reporting configured');
  return null;
}

/**
 * Check rate limit (1 per minute)
 * @returns {boolean}
 */
function _canCreateIssue() {
  const now = Date.now();
  const cutoff = now - RATE_LIMIT_MS;
  while (_rateLimitTimestamps.length > 0 && _rateLimitTimestamps[0] < cutoff) {
    _rateLimitTimestamps.shift();
  }
  return _rateLimitTimestamps.length === 0;
}

/**
 * Generate a deduplication hash
 * @param {string} domain
 * @param {string} action
 * @param {string} diagnostics
 * @returns {string}
 */
function _generateHash(domain, action, diagnostics) {
  const sig = `${domain}:${action}:${(diagnostics || '').slice(0, 120)}`;
  return crypto.createHash('sha256').update(sig).digest('hex');
}

/**
 * Check if this hash was seen in the last hour
 * @param {string} hash
 * @returns {boolean}
 */
function _isDuplicate(hash) {
  const last = _recentHashes.get(hash);
  if (!last) return false;
  if (Date.now() - last < DUPLICATE_WINDOW_MS) return true;
  _recentHashes.delete(hash);
  return false;
}

/**
 * Build the GitHub issue payload
 * @param {object} failure
 * @returns {object}
 */
function _buildPayload(failure) {
  const {
    type = 'unknown',
    domain = '?',
    action = '?',
    handlerName = 'unknown',
    diagnostics = '',
    backupDiff = '_No diff available_',
    filePath = '_No file path_',
    routerTrace = '_No trace available_',
  } = failure;

  const timestamp = new Date().toISOString();
  const env = `- **Node**: ${process.version}\n- **Platform**: ${os.platform()} ${os.release()}\n- **CWD**: ${process.cwd()}`;

  const body = [
    `## Summary`,
    `Governance router failure of type \`${type}\` in \`${domain}.${action}\`.`,
    ``,
    `## Domain / Action`,
    `\`${domain}\` / \`${action}\``,
    ``,
    `## Handler`,
    `\`${handlerName}\``,
    ``,
    `## File Path`,
    filePath,
    ``,
    `## Diagnostics`,
    `\`\`\``,
    diagnostics,
    `\`\`\``,
    ``,
    `## Backup Diff`,
    `\`\`\`diff`,
    backupDiff,
    `\`\`\``,
    ``,
    `## Router Trace`,
    `\`\`\``,
    routerTrace,
    `\`\`\``,
    ``,
    `## Environment`,
    env,
    ``,
    `## Timestamp`,
    timestamp,
    ``,
    `## Reproduction Steps (Auto-Generated)`,
    `1. Call surface tool for domain \`${domain}\`, action \`${action}\``,
    `2. Observe failure at handler \`${handlerName}\``,
    `3. Check diagnostics above for root cause`,
    ``,
    `---`,
    `_Auto-generated by SWEObeyMe v5.0 Governance Router_`,
  ].join('\n');

  const labelMap = {
    validation_failure: 'validation',
    self_healing: 'self-healing',
    handler_throw: 'handler-error',
    invalid_domain_action: 'routing',
    forbidden_pattern: 'surgical-compliance',
    backup_restore: 'backup',
    chaos_test: 'chaos',
  };

  return {
    title: `[AUTO] ${type.replace(/_/g, ' ')} in ${domain}.${action}`,
    body,
    labels: ['auto-generated', labelMap[type] || 'unknown'].filter(Boolean),
  };
}

/**
 * POST issue to GitHub API
 * @param {string} owner
 * @param {string} repo
 * @param {string} pat
 * @param {object} payload
 * @returns {Promise<object>}
 */
function _postIssue(owner, repo, pat, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${owner}/${repo}/issues`,
      method: 'POST',
      headers: {
        'Authorization': `token ${pat}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'User-Agent': 'SWEObeyMe-v5.0',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`GitHub API error ${res.statusCode}: ${parsed.message || data}`));
          }
        } catch {
          reject(new Error(`Failed to parse GitHub response: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

/**
 * Record a successful issue creation
 * @param {string} hash
 * @param {object} failure
 * @param {object} issue
 */
function _recordCreation(hash, failure, issue) {
  const now = Date.now();
  _rateLimitTimestamps.push(now);
  _recentHashes.set(hash, now);

  const entry = {
    id: issue.number,
    url: issue.html_url,
    title: issue.title,
    type: failure.type,
    domain: failure.domain,
    action: failure.action,
    createdAt: new Date(now).toISOString(),
  };

  _issueHistory.unshift(entry);
  if (_issueHistory.length > 50) _issueHistory.pop();
}

/**
 * Log failure locally when GitHub is not configured
 * @param {object} failure
 * @param {string} reason
 */
async function _logFailureLocally(failure, reason) {
  try {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const logDir = path.join(__dirname, '..', '..', '.sweobeyme-logs');
    await fs.promises.mkdir(logDir, { recursive: true });

    const timestamp = new Date().toISOString();
    const logFile = path.join(logDir, `failures-${timestamp.slice(0, 10)}.log`);

    const logEntry = [
      `[${timestamp}]`,
      `Reason: ${reason}`,
      `Type: ${failure.type}`,
      `Domain: ${failure.domain}`,
      `Action: ${failure.action}`,
      `Handler: ${failure.handlerName}`,
      `Diagnostics: ${failure.diagnostics}`,
      `File: ${failure.filePath || 'N/A'}`,
      `---`,
      '',
    ].join('\n');

    await fs.promises.appendFile(logFile, logEntry);
    console.log(`[GitHubIssueCreator] Logged failure locally: ${logFile}`);
  } catch (err) {
    console.error('[GitHubIssueCreator] Failed to log failure locally:', err.message);
  }
}

/**
 * POST failure to webhook server
 * @param {string} webhookUrl
 * @param {object} failure
 * @returns {Promise<object>}
 */
function _postToWebhook(webhookUrl, failure) {
  return new Promise((resolve, reject) => {
    const url = new URL(webhookUrl);
    const body = JSON.stringify(failure);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'User-Agent': 'SWEObeyMe-v5.0',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`Webhook error ${res.statusCode}: ${parsed.error || data}`));
          }
        } catch {
          reject(new Error(`Failed to parse webhook response: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}
