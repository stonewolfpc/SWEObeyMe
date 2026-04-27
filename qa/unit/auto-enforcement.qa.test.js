/**
 * QA Unit Tests — AutoEnforcementEngine
 * Layer: Unit (pure logic, no I/O, no VS Code API)
 *
 * Tests every rule in AutoEnforcementEngine in isolation:
 *   - file_size_limit (BLOCKING)
 *   - monolithic_file (ERROR)
 *   - forbidden_patterns (ERROR)
 *   - deep_nesting (WARNING)
 *   - fake_implementation (BLOCKING)
 *   - Custom rule registration
 *   - Engine disabled state
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  AutoEnforcementEngine,
  ViolationType,
  Severity,
} from '../../lib/auto-enforcement.js';

function makeLines(n) {
  return Array.from({ length: n }, (_, i) => `const x${i} = ${i};`).join('\n');
}

describe('AutoEnforcementEngine — Unit', () => {
  let engine;

  beforeEach(() => {
    engine = new AutoEnforcementEngine({ maxFileSize: 10 });
  });

  // ─── Engine state ────────────────────────────────────────────────────────

  describe('initialization', () => {
    it('is enabled by default', () => {
      const e = new AutoEnforcementEngine();
      expect(e.enabled).toBe(true);
    });

    it('respects enabled:false option', () => {
      const e = new AutoEnforcementEngine({ enabled: false });
      expect(e.enabled).toBe(false);
    });

    it('validateFile returns valid:true when disabled', () => {
      const e = new AutoEnforcementEngine({ enabled: false });
      const result = e.validateFile('x.js', makeLines(9999));
      expect(result.valid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('registers default rules on construction', () => {
      expect(engine.rules.has('file_size_limit')).toBe(true);
      expect(engine.rules.has('monolithic_file')).toBe(true);
      expect(engine.rules.has('forbidden_patterns')).toBe(true);
      expect(engine.rules.has('deep_nesting')).toBe(true);
      expect(engine.rules.has('fake_implementation')).toBe(true);
    });
  });

  // ─── file_size_limit ─────────────────────────────────────────────────────

  describe('rule: file_size_limit', () => {
    it('does NOT trigger for content within limit', () => {
      const content = makeLines(5);
      const result = engine.validateFile('small.js', content);
      const violation = result.violations.find(v => v.id === 'file_size_limit');
      expect(violation).toBeUndefined();
    });

    it('triggers BLOCKING violation when lines exceed threshold', () => {
      const content = makeLines(20);
      const result = engine.validateFile('big.js', content);
      const violation = result.violations.find(v => v.id === 'file_size_limit');
      expect(violation).toBeDefined();
      expect(violation.severity).toBe(Severity.BLOCKING);
    });

    it('marks result as invalid on blocking violation', () => {
      const content = makeLines(20);
      const result = engine.validateFile('big.js', content);
      expect(result.valid).toBe(false);
    });

    it('sets hasBlockingViolation=true when line limit exceeded', () => {
      const content = makeLines(20);
      const result = engine.validateFile('big.js', content);
      expect(result.hasBlockingViolation).toBe(true);
    });

    it('threshold is respected exactly — line count equal to limit is NOT a violation', () => {
      const content = makeLines(10);
      const result = engine.validateFile('edge.js', content);
      const violation = result.violations.find(v => v.id === 'file_size_limit');
      expect(violation).toBeUndefined();
    });

    it('threshold is respected exactly — line count one over limit IS a violation', () => {
      const content = makeLines(11);
      const result = engine.validateFile('edge.js', content);
      const violation = result.violations.find(v => v.id === 'file_size_limit');
      expect(violation).toBeDefined();
    });
  });

  // ─── forbidden_patterns ──────────────────────────────────────────────────

  describe('rule: forbidden_patterns', () => {
    it('detects console.log(', () => {
      const content = 'console.log("hello");\n';
      const result = engine.validateFile('f.js', content);
      const violation = result.violations.find(v => v.id === 'forbidden_patterns');
      expect(violation).toBeDefined();
    });

    it('detects debugger keyword', () => {
      const content = 'debugger;\n';
      const result = engine.validateFile('f.js', content);
      const violation = result.violations.find(v => v.id === 'forbidden_patterns');
      expect(violation).toBeDefined();
    });

    it('does NOT trigger on clean code', () => {
      const content = 'export function add(a, b) { return a + b; }\n';
      const result = engine.validateFile('clean.js', content);
      const violation = result.violations.find(v => v.id === 'forbidden_patterns');
      expect(violation).toBeUndefined();
    });
  });

  // ─── fake_implementation ─────────────────────────────────────────────────

  describe('rule: fake_implementation', () => {
    const fakeSnippets = [
      ['placeholder comment', '// placeholder value\n'],
      ['not implemented throw', "throw new Error('not implemented');\n"],
      ['TODO comment', '// TODO: fix this\n'],
      ['FIXME comment', '// FIXME: broken\n'],
      ['work in progress', '// work in progress\n'],
    ];

    it.each(fakeSnippets)('detects %s', (_label, content) => {
      const result = engine.validateFile('stub.js', content);
      const violation = result.violations.find(v => v.id === 'fake_implementation');
      expect(violation).toBeDefined();
      expect(violation.severity).toBe(Severity.BLOCKING);
    });

    it('does NOT trigger on real implementation', () => {
      const content = 'export function compute(x) { return x * 2; }\n';
      const result = engine.validateFile('real.js', content);
      const violation = result.violations.find(v => v.id === 'fake_implementation');
      expect(violation).toBeUndefined();
    });
  });

  // ─── monolithic_file ─────────────────────────────────────────────────────

  describe('rule: monolithic_file', () => {
    it('triggers when function count exceeds threshold', () => {
      const fns = Array.from(
        { length: 15 },
        (_, i) => `function fn${i}() { return ${i}; }`
      ).join('\n');
      const engine2 = new AutoEnforcementEngine({ maxFunctionCount: 5 });
      const result = engine2.validateFile('mono.js', fns);
      const violation = result.violations.find(v => v.id === 'monolithic_file');
      expect(violation).toBeDefined();
    });

    it('does NOT trigger for small focused files', () => {
      const content = 'function foo() { return 1; }\nfunction bar() { return 2; }\n';
      const engine2 = new AutoEnforcementEngine({ maxFunctionCount: 10 });
      const result = engine2.validateFile('focused.js', content);
      const violation = result.violations.find(v => v.id === 'monolithic_file');
      expect(violation).toBeUndefined();
    });
  });

  // ─── validateEdit ────────────────────────────────────────────────────────

  describe('validateEdit', () => {
    it('blocks edit that would push file over size limit', () => {
      const old = makeLines(3);
      const next = makeLines(20);
      const result = engine.validateEdit('f.js', old, next);
      expect(result.allowed).toBe(false);
      expect(result.reason).toMatch(/size/i);
    });

    it('blocks edit that would introduce forbidden pattern', () => {
      const old = 'const x = 1;\n';
      const next = 'const x = 1;\nconsole.log(x);\n';
      const result = engine.validateEdit('f.js', old, next);
      expect(result.allowed).toBe(false);
    });

    it('allows clean edit within limits', () => {
      const old = 'const x = 1;\n';
      const next = 'const x = 1;\nconst y = 2;\n';
      const result = engine.validateEdit('f.js', old, next);
      expect(result.allowed).toBe(true);
    });
  });

  // ─── Custom rule registration ─────────────────────────────────────────────

  describe('registerRule', () => {
    it('adds a custom rule that fires on matching content', () => {
      engine.registerRule({
        id: 'no_alert',
        type: ViolationType.FORBIDDEN_PATTERN,
        severity: Severity.ERROR,
        description: 'alert() is not allowed',
        check: (_file, content) => ({
          violated: /\balert\(/.test(content),
          details: {},
        }),
      });

      const result = engine.validateFile('ui.js', 'alert("hi");\n');
      const violation = result.violations.find(v => v.id === 'no_alert');
      expect(violation).toBeDefined();
    });

    it('custom rule does NOT fire on compliant content', () => {
      engine.registerRule({
        id: 'no_alert',
        type: ViolationType.FORBIDDEN_PATTERN,
        severity: Severity.ERROR,
        description: 'alert() is not allowed',
        check: (_file, content) => ({
          violated: /\balert\(/.test(content),
          details: {},
        }),
      });

      const result = engine.validateFile('ui.js', 'const warn = () => {};\n');
      const violation = result.violations.find(v => v.id === 'no_alert');
      expect(violation).toBeUndefined();
    });
  });

  // ─── Return shape contract ────────────────────────────────────────────────

  describe('return shape', () => {
    it('always returns { valid, violations, hasBlockingViolation } shape', () => {
      const result = engine.validateFile('any.js', 'const x = 1;\n');
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('violations');
      expect(result).toHaveProperty('hasBlockingViolation');
      expect(Array.isArray(result.violations)).toBe(true);
    });

    it('each violation has id, severity, type, and description fields', () => {
      const content = makeLines(20);
      const result = engine.validateFile('big.js', content);
      for (const v of result.violations) {
        expect(v).toHaveProperty('id');
        expect(v).toHaveProperty('severity');
        expect(v).toHaveProperty('type');
        expect(v).toHaveProperty('description');
      }
    });
  });
});
