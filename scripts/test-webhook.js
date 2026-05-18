/**
 * Webhook End-to-End Test
 *
 * Fires a synthetic governance router failure to the deployed webhook server.
 * On success the webhook creates a real GitHub issue, proving the full pipeline:
 *   extension error → webhook → GitHub issue
 *
 * Usage:
 *   node scripts/test-webhook.js --url https://sweobeyme-webhook.vercel.app
 *   node scripts/test-webhook.js --url https://sweobeyme-webhook.vercel.app --secret mySecret
 *   node scripts/test-webhook.js --url https://sweobeyme-webhook.vercel.app --dry-run
 *
 * IMPORTANT: This script creates REAL GitHub issues. Never run it in automated pipelines
 * without explicit intent. Use --dry-run to verify payload shape without sending.
 * Set SWEOBEYME_TEST_MODE=1 to enable live sends in CI environments.
 */

import https from 'https';
import crypto from 'crypto';

const args = process.argv.slice(2);
const urlIndex = args.indexOf('--url');
const secretIndex = args.indexOf('--secret');

if (urlIndex === -1 || !args[urlIndex + 1]) {
  console.error(
    'Usage: node scripts/test-webhook.js --url <webhook-url> [--secret <webhook-secret>]'
  );
  process.exit(1);
}

const WEBHOOK_URL = args[urlIndex + 1].replace(/\/$/, '') + '/report';
const WEBHOOK_SECRET = secretIndex !== -1 ? args[secretIndex + 1] : '';
const DRY_RUN = args.includes('--dry-run') || process.env.SWEOBEYME_TEST_MODE !== '1';

const payload = {
  type: 'handler_throw',
  domain: 'test',
  action: 'e2e_pipeline_check',
  handlerName: 'test-webhook.js',
  diagnostics: 'Synthetic e2e test: verifying webhook → GitHub issue pipeline is operational.',
  filePath: 'scripts/test-webhook.js',
  backupDiff: '_No diff — synthetic test_',
  routerTrace: 'test-webhook.js → _postToWebhook → webhook-server/server.js → GitHub API',
};

const body = JSON.stringify(payload);

function buildHeaders(body, secret) {
  const headers = {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
    'User-Agent': 'SWEObeyMe-test-webhook',
  };
  if (secret) {
    headers['x-webhook-signature'] =
      'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex');
  }
  return headers;
}

function post(urlStr, body, headers) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'POST',
      headers,
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (c) => {
        data += c;
      });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

console.log(`[test-webhook] Target: ${WEBHOOK_URL}`);
console.log(
  `[test-webhook] Payload type: ${payload.type} | domain: ${payload.domain}.${payload.action}`
);

if (DRY_RUN) {
  console.log('\n[DRY RUN] Payload that would be sent:');
  console.log(JSON.stringify(payload, null, 2));
  console.log('\n[DRY RUN] No request sent. Set SWEOBEYME_TEST_MODE=1 to send live.');
  process.exit(0);
}

try {
  const headers = buildHeaders(body, WEBHOOK_SECRET);
  const response = await post(WEBHOOK_URL, body, headers);

  if (response.status >= 200 && response.status < 300) {
    console.log(`\n✅ SUCCESS — HTTP ${response.status}`);
    console.log(`   Issue #${response.body.issueNumber}: ${response.body.issueUrl}`);
  } else {
    console.error(`\n❌ FAILED — HTTP ${response.status}`);
    console.error('   Response:', JSON.stringify(response.body, null, 2));
    process.exit(1);
  }
} catch (err) {
  console.error(`\n❌ REQUEST ERROR: ${err.message}`);
  process.exit(1);
}
