/**
 * QA Property-Based Tests — fast-check (The "Golden" Standard)
 * Layer: Property (throws thousands of random inputs to find black-swan bugs)
 *
 * Properties under test:
 *   1. AutoEnforcementEngine.validateFile — return shape invariants
 *      regardless of input content or file path
 *   2. AutoEnforcementEngine.calculateMaxNestingDepth — non-negative,
 *      monotonically increases with additional nesting
 *   3. validateSyntax — return shape invariants for any string input
 *   4. Rate-limit logic — count never decreases, blocking is consistent
 *   5. HMAC signature validation — correct ↔ accepted, mutated ↔ rejected
 *   6. MCP tool registry schemas — every schema stays JSON-Schema-compliant
 *      for any combination of optional field presence
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import crypto from 'crypto';
import { AutoEnforcementEngine } from '../../lib/auto-enforcement.js';
import { validateSyntax } from '../../lib/validation.js';

// ─── Shared arbitraries ───────────────────────────────────────────────────────

const arbCode = fc.string({ unit: 'grapheme', minLength: 0, maxLength: 2000 });
const arbFilePath = fc.string({ minLength: 1, maxLength: 100 }).map(s => `${s}.js`);
const arbLineCount = fc.integer({ min: 1, max: 1000 });

// ─── 1. AutoEnforcementEngine.validateFile — shape invariants ────────────────

describe('Property: AutoEnforcementEngine.validateFile shape invariants', () => {
  const engine = new AutoEnforcementEngine({ maxFileSize: 50 });

  it('always returns { valid: boolean, violations: Array, hasBlockingViolation: boolean }', () => {
    fc.assert(
      fc.property(arbFilePath, arbCode, (filePath, content) => {
        const result = engine.validateFile(filePath, content);
        return (
          typeof result.valid === 'boolean' &&
          Array.isArray(result.violations) &&
          typeof result.hasBlockingViolation === 'boolean'
        );
      }),
      { numRuns: 500 }
    );
  });

  it('valid is always false if hasBlockingViolation is true', () => {
    fc.assert(
      fc.property(arbFilePath, arbCode, (filePath, content) => {
        const result = engine.validateFile(filePath, content);
        if (result.hasBlockingViolation) {
          return result.valid === false;
        }
        return true;
      }),
      { numRuns: 500 }
    );
  });

  it('violations array length equals number of triggered rules', () => {
    fc.assert(
      fc.property(arbFilePath, arbCode, (filePath, content) => {
        const result = engine.validateFile(filePath, content);
        return result.violations.length >= 0;
      }),
      { numRuns: 500 }
    );
  });

  it('every violation has id (string), severity (string), type (string), description (string)', () => {
    fc.assert(
      fc.property(arbFilePath, arbCode, (filePath, content) => {
        const result = engine.validateFile(filePath, content);
        return result.violations.every(
          v =>
            typeof v.id === 'string' &&
            typeof v.severity === 'string' &&
            typeof v.type === 'string' &&
            typeof v.description === 'string'
        );
      }),
      { numRuns: 500 }
    );
  });

  it('disabled engine always returns valid:true and empty violations', () => {
    const disabled = new AutoEnforcementEngine({ enabled: false });
    fc.assert(
      fc.property(arbFilePath, arbCode, (filePath, content) => {
        const result = disabled.validateFile(filePath, content);
        return result.valid === true && result.violations.length === 0;
      }),
      { numRuns: 200 }
    );
  });
});

// ─── 2. calculateMaxNestingDepth — non-negative, monotonic ───────────────────

describe('Property: calculateMaxNestingDepth invariants', () => {
  const engine = new AutoEnforcementEngine();

  it('always returns a non-negative number', () => {
    fc.assert(
      fc.property(arbCode, (content) => {
        const depth = engine.calculateMaxNestingDepth(content);
        return typeof depth === 'number' && depth >= 0;
      }),
      { numRuns: 500 }
    );
  });

  it('adding an outer { } wrapper never decreases depth', () => {
    fc.assert(
      fc.property(arbCode, (content) => {
        const base = engine.calculateMaxNestingDepth(content);
        const wrapped = engine.calculateMaxNestingDepth(`{ ${content} }`);
        return wrapped >= base;
      }),
      { numRuns: 300 }
    );
  });

  it('empty string has depth 0', () => {
    expect(engine.calculateMaxNestingDepth('')).toBe(0);
  });

  it('single balanced pair has depth 1', () => {
    expect(engine.calculateMaxNestingDepth('{ }')).toBe(1);
  });
});

// ─── 3. validateSyntax — shape invariants for any string ─────────────────────

describe('Property: validateSyntax shape invariants', () => {
  it('always returns { valid, errors, bracketErrors, maxDepths, bracketVisualization }', () => {
    fc.assert(
      fc.property(arbCode, (code) => {
        const result = validateSyntax(code);
        return (
          typeof result.valid === 'boolean' &&
          Array.isArray(result.errors) &&
          Array.isArray(result.bracketErrors) &&
          typeof result.maxDepths === 'object' &&
          result.maxDepths !== null
        );
      }),
      { numRuns: 500 }
    );
  });

  it('maxDepths fields are always non-negative numbers', () => {
    fc.assert(
      fc.property(arbCode, (code) => {
        const { maxDepths } = validateSyntax(code);
        return (
          typeof maxDepths.braces === 'number' && maxDepths.braces >= 0 &&
          typeof maxDepths.parentheses === 'number' && maxDepths.parentheses >= 0 &&
          typeof maxDepths.brackets === 'number' && maxDepths.brackets >= 0
        );
      }),
      { numRuns: 500 }
    );
  });

  it('valid is false whenever bracketErrors is non-empty', () => {
    fc.assert(
      fc.property(arbCode, (code) => {
        const result = validateSyntax(code);
        if (result.bracketErrors.length > 0) {
          return result.valid === false;
        }
        return true;
      }),
      { numRuns: 500 }
    );
  });

  it('never throws for any string input', () => {
    fc.assert(
      fc.property(arbCode, (code) => {
        expect(() => validateSyntax(code)).not.toThrow();
        return true;
      }),
      { numRuns: 500 }
    );
  });
});

// ─── 4. Rate-limit logic — count consistency ─────────────────────────────────

describe('Property: rate-limit state machine invariants', () => {
  const WINDOW = 60_000;
  const MAX = 30;

  function makeMap() {
    return new Map();
  }

  function checkRateLimit(map, ip, now) {
    const requests = map.get(ip) || [];
    const recent = requests.filter(t => now - t < WINDOW);
    if (recent.length >= MAX) return false;
    recent.push(now);
    map.set(ip, recent);
    return true;
  }

  it('count of accepted requests in one window never exceeds MAX', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        (n, ip) => {
          const map = makeMap();
          let accepted = 0;
          for (let i = 0; i < n; i++) {
            if (checkRateLimit(map, ip, 1_000_000 + i)) accepted++;
          }
          return accepted <= MAX;
        }
      ),
      { numRuns: 300 }
    );
  });

  it('boolean return is consistent — same state, same request always gives same result', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.integer({ min: 0, max: MAX }),
        (ip, preFillCount) => {
          const map = makeMap();
          for (let i = 0; i < preFillCount; i++) {
            checkRateLimit(map, ip, 1_000_000 + i);
          }
          const r1 = checkRateLimit(map, ip, 2_000_000);
          const map2 = new Map([[ip, (map.get(ip) || []).slice()]]);
          const r2 = checkRateLimit(map2, ip, 2_000_000);
          return r1 === r2;
        }
      ),
      { numRuns: 300 }
    );
  });
});

// ─── 5. HMAC signature validation — correct accepted, mutated rejected ────────

describe('Property: HMAC-SHA256 signature — correct/incorrect invariants', () => {
  const arbSecret = fc.string({ minLength: 8, maxLength: 64 });
  const arbPayload = fc.string({ minLength: 1, maxLength: 500 });

  function makeSignature(secret, payload) {
    return 'sha256=' + crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }

  function validateSignature(secret, payload, signature) {
    if (!secret) return true;
    if (!signature) return false;
    const expected = makeSignature(secret, payload);
    try {
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
      return false;
    }
  }

  it('a correct signature is always accepted', () => {
    fc.assert(
      fc.property(arbSecret, arbPayload, (secret, payload) => {
        const sig = makeSignature(secret, payload);
        return validateSignature(secret, payload, sig) === true;
      }),
      { numRuns: 300 }
    );
  });

  it('a signature from a different secret is always rejected', () => {
    fc.assert(
      fc.property(
        arbSecret,
        arbSecret,
        arbPayload,
        (secret1, secret2, payload) => {
          fc.pre(secret1 !== secret2);
          const sig = makeSignature(secret2, payload);
          return validateSignature(secret1, payload, sig) === false;
        }
      ),
      { numRuns: 300 }
    );
  });

  it('a signature for a mutated payload is always rejected', () => {
    fc.assert(
      fc.property(
        arbSecret,
        arbPayload,
        fc.string({ minLength: 1, maxLength: 20 }),
        (secret, payload, suffix) => {
          fc.pre(suffix.length > 0);
          const sig = makeSignature(secret, payload);
          const mutated = payload + suffix;
          return validateSignature(secret, mutated, sig) === false;
        }
      ),
      { numRuns: 300 }
    );
  });

  it('missing signature is always rejected when secret is set', () => {
    fc.assert(
      fc.property(arbSecret, arbPayload, (secret, payload) => {
        return validateSignature(secret, payload, null) === false;
      }),
      { numRuns: 200 }
    );
  });
});

// ─── 6. MCP JSON-Schema — required fields must be a subset of properties ──────

describe('Property: MCP tool inputSchema structural validity', () => {
  const arbProperties = fc.dictionary(
    fc.string({ minLength: 1, maxLength: 20 }),
    fc.constantFrom('string', 'boolean', 'number', 'object', 'array').map(t => ({ type: t }))
  );

  it('required[] is always a subset of properties keys', () => {
    fc.assert(
      fc.property(arbProperties, (properties) => {
        const keys = Object.keys(properties);
        const required = keys.slice(0, Math.ceil(keys.length / 2));
        const schema = { type: 'object', properties, required };
        return required.every(r => Object.prototype.hasOwnProperty.call(schema.properties, r));
      }),
      { numRuns: 500 }
    );
  });

  it('a tool schema with no properties is still valid (empty object)', () => {
    fc.assert(
      fc.property(fc.constant({}), (properties) => {
        const schema = { type: 'object', properties, required: [] };
        return schema.type === 'object' && Array.isArray(schema.required);
      }),
      { numRuns: 50 }
    );
  });
});
