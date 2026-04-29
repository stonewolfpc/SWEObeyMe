/**
 * QA Integration Tests — Governance Handler
 * Layer: Integration (real handler, no MCP transport)
 *
 * Tests that the governance handler works correctly when called directly,
 * bypassing the MCP transport layer to isolate handler logic.
 */

import { describe, it, expect, beforeAll } from 'vitest';

// Import the actual governance handler
import { governanceHandlers } from '../../lib/tools/handlers-governance.js';

describe('Governance Handler — direct execution', () => {
  it('get_governance_constitution returns content with text type', async () => {
    const result = await governanceHandlers.get_governance_constitution();

    expect(result).toBeDefined();
    expect(result.content).toBeInstanceOf(Array);
    expect(result.content.length).toBeGreaterThan(0);
    expect(result.content[0].type).toBe('text');
  });

  it('get_governance_constitution returns non-empty text', async () => {
    const result = await governanceHandlers.get_governance_constitution();

    const text = result.content[0].text;
    expect(text).toBeDefined();
    expect(typeof text).toBe('string');
    expect(text.length).toBeGreaterThan(0);
  });

  it('get_governance_constitution does not throw errors', async () => {
    await expect(governanceHandlers.get_governance_constitution()).resolves.toBeDefined();
  });
});
