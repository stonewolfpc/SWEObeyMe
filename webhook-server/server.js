/**
 * SWEObeyMe Error Reporting Webhook Server
 *
 * Receives error reports from extension instances and posts them to GitHub.
 * Keeps GitHub PAT secure on server side.
 *
 * Environment Variables:
 * - GITHUB_PAT: GitHub Personal Access Token with repo scope
 * - WEBHOOK_SECRET: Optional secret to validate requests
 * - GITHUB_OWNER: Repository owner (default: stonewolfpc)
 * - GITHUB_REPO: Repository name (default: SWEObeyMe)
 *
 * Deployment:
 * - Vercel: vercel deploy
 * - Render: render.com
 * - Railway: railway up
 */

import express from 'express';
import crypto from 'crypto';

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration
const GITHUB_PAT = process.env.GITHUB_PAT;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';
const GITHUB_OWNER = process.env.GITHUB_OWNER || 'stonewolfpc';
const GITHUB_REPO = process.env.GITHUB_REPO || 'SWEObeyMe';

// Rate limiting (in-memory, simple)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const RATE_LIMIT_MAX = 30; // max 30 requests per minute per IP

const PAT_CONFIGURED = Boolean(GITHUB_PAT);
if (!PAT_CONFIGURED) {
  console.error('[ERROR] GITHUB_PAT environment variable is not set - /report will return 503');
}

app.use(express.json({ limit: '1mb' }));

// Rate limiting middleware
function checkRateLimit(ip) {
  const now = Date.now();
  const requests = rateLimitMap.get(ip) || [];

  // Filter out old requests
  const recent = requests.filter(t => now - t < RATE_LIMIT_WINDOW);

  if (recent.length >= RATE_LIMIT_MAX) {
    return false;
  }

  recent.push(now);
  rateLimitMap.set(ip, recent);
  return true;
}

// Optional webhook signature validation
function validateSignature(payload, signature) {
  if (!WEBHOOK_SECRET) return true;
  if (!signature) return false;

  const expectedSignature = 'sha256=' + crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

// POST /report - Receive error report
app.post('/report', async (req, res) => {
  if (!PAT_CONFIGURED) {
    return res.status(503).json({ error: 'GITHUB_PAT not configured on server. Set it in Vercel Environment Variables.' });
  }
  try {
    const ip = req.ip;

    // Rate limit
    if (!checkRateLimit(ip)) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }

    // Validate signature if secret is set
    const signature = req.headers['x-webhook-signature'];
    if (WEBHOOK_SECRET && !validateSignature(JSON.stringify(req.body), signature)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const { type, domain, action, handlerName, diagnostics, filePath, backupDiff, routerTrace } = req.body;

    if (!type || !domain || !action) {
      return res.status(400).json({ error: 'Missing required fields: type, domain, action' });
    }

    // Build GitHub issue
    const issue = await postToGitHub({
      type,
      domain,
      action,
      handlerName: handlerName || 'unknown',
      diagnostics: diagnostics || '',
      filePath: filePath || 'N/A',
      backupDiff: backupDiff || '_No diff available_',
      routerTrace: routerTrace || '_No trace available_',
    });

    res.json({
      success: true,
      issueNumber: issue.number,
      issueUrl: issue.html_url,
    });
  } catch (err) {
    console.error('[Webhook] Error:', err.message);
    res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: PAT_CONFIGURED ? 'ok' : 'degraded',
    patConfigured: PAT_CONFIGURED,
    timestamp: new Date().toISOString(),
  });
});

// Post issue to GitHub
async function postToGitHub(failure) {
  const { type, domain, action, handlerName, diagnostics, filePath, backupDiff, routerTrace } = failure;

  const timestamp = new Date().toISOString();
  const env = `- **Node**: ${process.version}\n- **Platform**: ${process.platform} ${process.release?.name || 'node'}`;

  const body = [
    '## Summary',
    `Auto-reported governance router failure of type \`${type}\` in \`${domain}.${action}\`.`,
    '',
    '## Domain / Action',
    `\`${domain}\` / \`${action}\``,
    '',
    '## Handler',
    `\`${handlerName}\``,
    '',
    '## File Path',
    filePath,
    '',
    '## Diagnostics',
    '```',
    diagnostics,
    '```',
    '',
    '## Backup Diff',
    '```diff',
    backupDiff,
    '```',
    '',
    '## Router Trace',
    '```',
    routerTrace,
    '```',
    '',
    '## Environment',
    env,
    '',
    '## Timestamp',
    timestamp,
    '',
    '---',
    '_Auto-reported by SWEObeyMe Extension_',
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

  const payload = {
    title: `[AUTO] ${type.replace(/_/g, ' ')} in ${domain}.${action}`,
    body,
    labels: ['auto-reported', labelMap[type] || 'unknown'].filter(Boolean),
  };

  const response = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues`, {
    method: 'POST',
    headers: {
      'Authorization': `token ${GITHUB_PAT}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'SWEObeyMe-Webhook',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub API error ${response.status}: ${text}`);
  }

  return response.json();
}

// Start server
app.listen(PORT, () => {
  console.log(`[Webhook] Server listening on port ${PORT}`);
  console.log(`[Webhook] GitHub repo: ${GITHUB_OWNER}/${GITHUB_REPO}`);
  console.log(`[Webhook] Rate limit: ${RATE_LIMIT_MAX} requests per ${RATE_LIMIT_WINDOW / 1000}s per IP`);
});
