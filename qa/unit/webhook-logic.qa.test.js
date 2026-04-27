/**
 * QA Unit Tests — Webhook server logic
 * Layer: Unit (pure function extraction — no server startup required)
 *
 * The webhook server exposes two testable pure functions:
 *   - checkRateLimit(ip)     → bool
 *   - validateSignature(payload, signature) → bool
 *
 * Because server.js doesn't export them, we replicate the exact logic here
 * and test the business rules. If the implementation ever diverges from these
 * rules, the integration tests (webhook-server.qa.test.js) will catch it.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import crypto from 'crypto';

// ─── Replicated rate-limit logic (mirrors webhook-server/server.js) ─────────

const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = 30;

function makeRateLimitState() {
  return new Map();
}

function checkRateLimit(map, ip, now = Date.now()) {
  const requests = map.get(ip) || [];
  const recent = requests.filter(t => now - t < RATE_LIMIT_WINDOW);
  if (recent.length >= RATE_LIMIT_MAX) return false;
  recent.push(now);
  map.set(ip, recent);
  return true;
}

// ─── Replicated signature validation logic ───────────────────────────────────

function validateSignature(secret, payload, signature) {
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

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Webhook server — rate limiting logic', () => {
  let map;
  const IP = '127.0.0.1';
  const T0 = 1_000_000;

  beforeEach(() => {
    map = makeRateLimitState();
  });

  it('allows the first request from a new IP', () => {
    expect(checkRateLimit(map, IP, T0)).toBe(true);
  });

  it('allows up to RATE_LIMIT_MAX requests in one window', () => {
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      expect(checkRateLimit(map, IP, T0 + i)).toBe(true);
    }
  });

  it('blocks the (RATE_LIMIT_MAX + 1)th request in one window', () => {
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      checkRateLimit(map, IP, T0 + i);
    }
    expect(checkRateLimit(map, IP, T0 + RATE_LIMIT_MAX)).toBe(false);
  });

  it('allows requests again after window expires', () => {
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      checkRateLimit(map, IP, T0 + i);
    }
    const afterWindow = T0 + RATE_LIMIT_WINDOW + 1;
    expect(checkRateLimit(map, IP, afterWindow)).toBe(true);
  });

  it('tracks different IPs independently', () => {
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      checkRateLimit(map, '1.1.1.1', T0 + i);
    }
    expect(checkRateLimit(map, '2.2.2.2', T0)).toBe(true);
  });

  it('does NOT persist requests from a different IP into another IP bucket', () => {
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      checkRateLimit(map, '1.1.1.1', T0 + i);
    }
    expect(checkRateLimit(map, '1.1.1.1', T0 + RATE_LIMIT_MAX)).toBe(false);
    expect(checkRateLimit(map, '2.2.2.2', T0 + RATE_LIMIT_MAX)).toBe(true);
  });
});

describe('Webhook server — signature validation logic', () => {
  const SECRET = 'test-secret-abc';
  const PAYLOAD = JSON.stringify({ type: 'validation_failure', domain: 'file', action: 'write' });

  function makeSignature(secret, payload) {
    return 'sha256=' + crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }

  it('returns true when no secret is configured (open endpoint)', () => {
    expect(validateSignature('', PAYLOAD, null)).toBe(true);
    expect(validateSignature(null, PAYLOAD, null)).toBe(true);
  });

  it('returns false when secret is set but no signature provided', () => {
    expect(validateSignature(SECRET, PAYLOAD, null)).toBe(false);
    expect(validateSignature(SECRET, PAYLOAD, undefined)).toBe(false);
  });

  it('returns true for a correct HMAC-SHA256 signature', () => {
    const sig = makeSignature(SECRET, PAYLOAD);
    expect(validateSignature(SECRET, PAYLOAD, sig)).toBe(true);
  });

  it('returns false for a tampered payload', () => {
    const sig = makeSignature(SECRET, PAYLOAD);
    const tampered = PAYLOAD + ' extra';
    expect(validateSignature(SECRET, tampered, sig)).toBe(false);
  });

  it('returns false for a signature signed with wrong secret', () => {
    const sig = makeSignature('wrong-secret', PAYLOAD);
    expect(validateSignature(SECRET, PAYLOAD, sig)).toBe(false);
  });

  it('returns false for a malformed signature string', () => {
    expect(validateSignature(SECRET, PAYLOAD, 'sha256=notahex')).toBe(false);
  });

  it('returns false for a signature with wrong prefix', () => {
    const hash = crypto.createHmac('sha256', SECRET).update(PAYLOAD).digest('hex');
    expect(validateSignature(SECRET, PAYLOAD, `sha512=${hash}`)).toBe(false);
  });
});
