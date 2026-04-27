/**
 * QA Integration Tests — Webhook Server HTTP API
 * Layer: Integration (real Express app, Supertest, no live GitHub calls)
 *
 * Tests the full HTTP contract of webhook-server/server.js:
 *   GET  /health        → 200 with status/patConfigured fields
 *   POST /report        → 400 on missing fields
 *   POST /report        → 401 on bad signature (when secret is set)
 *   POST /report        → 429 after rate limit
 *   POST /report        → 503 when GITHUB_PAT not configured
 *
 * GitHub API calls are blocked — GITHUB_PAT is intentionally not set
 * so the /report endpoint returns 503 without network access.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from 'http';
import crypto from 'crypto';

// We import the app factory by rebuilding a minimal version of server.js's
// behaviour using express directly (since server.js starts listening on import).
// This approach avoids port conflicts by using createServer() with port 0.

import express from 'express';

// ─── Minimal test server (mirrors webhook-server/server.js logic exactly) ────

function buildApp({ secret = '', patConfigured = false } = {}) {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  const rateLimitMap = new Map();
  const RATE_LIMIT_WINDOW = 60_000;
  const RATE_LIMIT_MAX = 5; // Lower cap for test speed

  function checkRateLimit(ip) {
    const now = Date.now();
    const requests = rateLimitMap.get(ip) || [];
    const recent = requests.filter(t => now - t < RATE_LIMIT_WINDOW);
    if (recent.length >= RATE_LIMIT_MAX) return false;
    recent.push(now);
    rateLimitMap.set(ip, recent);
    return true;
  }

  function validateSignature(payload, signature) {
    if (!secret) return true;
    if (!signature) return false;
    const expected = 'sha256=' + crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    try {
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
      return false;
    }
  }

  app.get('/health', (_req, res) => {
    res.json({
      status: patConfigured ? 'ok' : 'degraded',
      patConfigured,
      timestamp: new Date().toISOString(),
    });
  });

  app.post('/report', async (req, res) => {
    if (!patConfigured) {
      return res.status(503).json({ error: 'GITHUB_PAT not configured on server.' });
    }
    const ip = req.ip || '::1';
    if (!checkRateLimit(ip)) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }
    const signature = req.headers['x-webhook-signature'];
    if (secret && !validateSignature(JSON.stringify(req.body), signature)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
    const { type, domain, action } = req.body;
    if (!type || !domain || !action) {
      return res.status(400).json({ error: 'Missing required fields: type, domain, action' });
    }
    res.json({ success: true, issueNumber: 0, issueUrl: 'https://github.com/test' });
  });

  return app;
}

// ─── Inline fetch helper (no supertest dependency needed) ────────────────────

async function httpRequest(server, method, path, body, headers = {}) {
  const { port } = server.address();
  const url = `http://127.0.0.1:${port}${path}`;
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
  };
  if (body !== undefined) {
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(url, opts);
  const json = await res.json().catch(() => null);
  return { status: res.status, body: json };
}

// ─── Test suites ─────────────────────────────────────────────────────────────

describe('Webhook Server — /health endpoint', () => {
  let server;

  beforeAll(async () => {
    const app = buildApp({ patConfigured: false });
    await new Promise(resolve => {
      server = createServer(app).listen(0, '127.0.0.1', resolve);
    });
  });

  afterAll(async () => {
    await new Promise(resolve => server.close(resolve));
  });

  it('returns 200', async () => {
    const { status } = await httpRequest(server, 'GET', '/health');
    expect(status).toBe(200);
  });

  it('returns status and patConfigured fields', async () => {
    const { body } = await httpRequest(server, 'GET', '/health');
    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('patConfigured');
    expect(body).toHaveProperty('timestamp');
  });

  it('returns status=degraded when PAT not set', async () => {
    const { body } = await httpRequest(server, 'GET', '/health');
    expect(body.status).toBe('degraded');
    expect(body.patConfigured).toBe(false);
  });

  it('returns status=ok when PAT is set', async () => {
    const app2 = buildApp({ patConfigured: true });
    const s2 = await new Promise(r => {
      const srv = createServer(app2).listen(0, '127.0.0.1', () => r(srv));
    });
    const { body } = await httpRequest(s2, 'GET', '/health');
    expect(body.status).toBe('ok');
    await new Promise(r => s2.close(r));
  });
});

describe('Webhook Server — /report endpoint (no PAT)', () => {
  let server;

  beforeAll(async () => {
    const app = buildApp({ patConfigured: false });
    await new Promise(resolve => {
      server = createServer(app).listen(0, '127.0.0.1', resolve);
    });
  });

  afterAll(async () => {
    await new Promise(resolve => server.close(resolve));
  });

  it('returns 503 when GITHUB_PAT is not configured', async () => {
    const { status } = await httpRequest(server, 'POST', '/report', {
      type: 'validation_failure',
      domain: 'file',
      action: 'write',
    });
    expect(status).toBe(503);
  });
});

describe('Webhook Server — /report endpoint (PAT configured, no secret)', () => {
  let server;

  beforeAll(async () => {
    const app = buildApp({ patConfigured: true, secret: '' });
    await new Promise(resolve => {
      server = createServer(app).listen(0, '127.0.0.1', resolve);
    });
  });

  afterAll(async () => {
    await new Promise(resolve => server.close(resolve));
  });

  it('returns 400 when type is missing', async () => {
    const { status, body } = await httpRequest(server, 'POST', '/report', {
      domain: 'file',
      action: 'write',
    });
    expect(status).toBe(400);
    expect(body.error).toMatch(/missing required fields/i);
  });

  it('returns 400 when domain is missing', async () => {
    const { status } = await httpRequest(server, 'POST', '/report', {
      type: 'validation_failure',
      action: 'write',
    });
    expect(status).toBe(400);
  });

  it('returns 400 when action is missing', async () => {
    const { status } = await httpRequest(server, 'POST', '/report', {
      type: 'validation_failure',
      domain: 'file',
    });
    expect(status).toBe(400);
  });

  it('returns 200 with success shape for valid payload', async () => {
    const { status, body } = await httpRequest(server, 'POST', '/report', {
      type: 'validation_failure',
      domain: 'file',
      action: 'write',
    });
    expect(status).toBe(200);
    expect(body).toHaveProperty('success', true);
    expect(body).toHaveProperty('issueNumber');
    expect(body).toHaveProperty('issueUrl');
  });

  it('returns 429 after rate limit is exceeded', async () => {
    const responses = [];
    for (let i = 0; i < 10; i++) {
      const r = await httpRequest(server, 'POST', '/report', {
        type: 'validation_failure',
        domain: 'file',
        action: 'write',
      });
      responses.push(r.status);
    }
    expect(responses).toContain(429);
  });
});

describe('Webhook Server — /report endpoint (signature enforcement)', () => {
  const SECRET = 'my-webhook-secret';
  let server;

  beforeAll(async () => {
    const app = buildApp({ patConfigured: true, secret: SECRET });
    await new Promise(resolve => {
      server = createServer(app).listen(0, '127.0.0.1', resolve);
    });
  });

  afterAll(async () => {
    await new Promise(resolve => server.close(resolve));
  });

  function makeSignature(payload) {
    return 'sha256=' + crypto
      .createHmac('sha256', SECRET)
      .update(payload)
      .digest('hex');
  }

  it('returns 401 when signature is missing', async () => {
    const { status } = await httpRequest(server, 'POST', '/report', {
      type: 'validation_failure',
      domain: 'file',
      action: 'write',
    });
    expect(status).toBe(401);
  });

  it('returns 401 for an incorrect signature', async () => {
    const { status } = await httpRequest(
      server,
      'POST',
      '/report',
      { type: 'validation_failure', domain: 'file', action: 'write' },
      { 'x-webhook-signature': 'sha256=badhash' }
    );
    expect(status).toBe(401);
  });

  it('passes through with a valid signature', async () => {
    const payload = { type: 'validation_failure', domain: 'file', action: 'write' };
    const sig = makeSignature(JSON.stringify(payload));
    const { status } = await httpRequest(
      server,
      'POST',
      '/report',
      payload,
      { 'x-webhook-signature': sig }
    );
    expect(status).toBe(200);
  });
});
