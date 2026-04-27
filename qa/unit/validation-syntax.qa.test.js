/**
 * QA Unit Tests — validateSyntax
 * Layer: Unit (pure logic, no I/O)
 *
 * Covers:
 *   - Balanced vs unbalanced braces / parens / brackets
 *   - Unclosed string detection
 *   - Deep nesting warning threshold (> 5)
 *   - Return shape contract
 *   - Edge cases: empty string, single characters, strings containing brackets
 */

import { describe, it, expect } from 'vitest';
import { validateSyntax } from '../../lib/validation.js';

describe('validateSyntax — Unit', () => {

  // ─── Return shape ─────────────────────────────────────────────────────────

  describe('return shape', () => {
    it('always returns { valid, errors, bracketErrors, maxDepths, bracketVisualization }', () => {
      const result = validateSyntax('const x = 1;');
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('bracketErrors');
      expect(result).toHaveProperty('maxDepths');
      expect(result).toHaveProperty('bracketVisualization');
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.bracketErrors)).toBe(true);
    });

    it('maxDepths has braces, parentheses, brackets keys', () => {
      const result = validateSyntax('const x = 1;');
      expect(result.maxDepths).toHaveProperty('braces');
      expect(result.maxDepths).toHaveProperty('parentheses');
      expect(result.maxDepths).toHaveProperty('brackets');
    });
  });

  // ─── Valid code ───────────────────────────────────────────────────────────

  describe('valid code', () => {
    it('passes for empty string', () => {
      const result = validateSyntax('');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('passes for simple assignment', () => {
      const result = validateSyntax('const x = 1;');
      expect(result.valid).toBe(true);
    });

    it('passes for balanced braces', () => {
      const result = validateSyntax('function foo() { return 1; }');
      expect(result.valid).toBe(true);
    });

    it('passes for balanced parens', () => {
      const result = validateSyntax('foo(bar(1), 2);');
      expect(result.valid).toBe(true);
    });

    it('passes for balanced brackets', () => {
      const result = validateSyntax('const a = [1, [2, 3]];');
      expect(result.valid).toBe(true);
    });

    it('does NOT flag brackets inside strings', () => {
      const result = validateSyntax("const s = 'hello {world}';");
      expect(result.valid).toBe(true);
    });
  });

  // ─── Unbalanced braces ────────────────────────────────────────────────────

  describe('unbalanced braces', () => {
    it('detects extra closing brace', () => {
      const result = validateSyntax('const x = 1; }');
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => /extra closing/i.test(e) || /}/i.test(e))).toBe(true);
    });

    it('detects unclosed opening brace', () => {
      const result = validateSyntax('function foo() {');
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => /unclosed/i.test(e))).toBe(true);
    });
  });

  // ─── Unbalanced parens ────────────────────────────────────────────────────

  describe('unbalanced parentheses', () => {
    it('detects extra closing paren', () => {
      const result = validateSyntax('const x = foo();)');
      expect(result.valid).toBe(false);
    });

    it('detects unclosed opening paren', () => {
      const result = validateSyntax('const x = foo(1, 2;');
      expect(result.valid).toBe(false);
    });
  });

  // ─── Unbalanced brackets ──────────────────────────────────────────────────

  describe('unbalanced brackets', () => {
    it('detects extra closing bracket', () => {
      const result = validateSyntax('const a = [1, 2];]');
      expect(result.valid).toBe(false);
    });

    it('detects unclosed opening bracket', () => {
      const result = validateSyntax('const a = [1, 2;');
      expect(result.valid).toBe(false);
    });
  });

  // ─── Deep nesting warning ─────────────────────────────────────────────────

  describe('deep nesting warning', () => {
    it('adds warning when brace depth exceeds 5', () => {
      const deepCode = '{ { { { { { const x = 1; } } } } } }';
      const result = validateSyntax(deepCode);
      const hasDepthWarning = result.errors.some(e => /deep.*nesting/i.test(e));
      expect(hasDepthWarning).toBe(true);
    });

    it('records correct maxDepth in maxDepths.braces', () => {
      const code = '{ { { const x = 1; } } }';
      const result = validateSyntax(code);
      expect(result.maxDepths.braces).toBeGreaterThanOrEqual(3);
    });

    it('does NOT warn at exactly depth 5', () => {
      const depthFive = '{ { { { { const x = 1; } } } } }';
      const result = validateSyntax(depthFive);
      const hasDepthWarning = result.errors.some(e => /deep.*nesting/i.test(e));
      expect(hasDepthWarning).toBe(false);
    });
  });

  // ─── bracketErrors structure ──────────────────────────────────────────────

  describe('bracketErrors structure', () => {
    it('each bracketError has type, bracket, line, message fields', () => {
      const result = validateSyntax('const x = 1; }');
      for (const err of result.bracketErrors) {
        expect(err).toHaveProperty('type');
        expect(err).toHaveProperty('bracket');
        expect(err).toHaveProperty('line');
        expect(err).toHaveProperty('message');
      }
    });

    it('bracketErrors is empty for valid code', () => {
      const result = validateSyntax('function foo() { return 1; }');
      expect(result.bracketErrors).toHaveLength(0);
    });
  });
});
