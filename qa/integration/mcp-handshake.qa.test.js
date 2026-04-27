/**
 * QA Integration Tests — MCP Server ↔ Client handshake
 * Layer: Integration (real MCP SDK, InMemoryTransport, no VS Code API)
 *
 * Tests that the MCP server correctly:
 *   - Initializes and negotiates capabilities
 *   - Lists all registered tools (tools/list)
 *   - Rejects unknown tool calls with a proper error
 *   - Handles concurrent tool requests without deadlock
 *   - Exposes the correct tool input schema shape (type: object)
 *
 * The server under test is a real connected Server+Client pair via
 * InMemoryTransport — the same primitive the production MCP server uses.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// ─── Minimal representative tool registry ────────────────────────────────────
// Mirrors the real tool set without importing vscode or the full index.js

const TOOL_REGISTRY = [
  {
    name: 'obey_me_status',
    description: 'Get governance system status',
    inputSchema: {
      type: 'object',
      properties: {
        runChecks: { type: 'boolean' },
      },
      required: [],
    },
  },
  {
    name: 'auto_enforce',
    description: 'Validate files against architectural rules',
    inputSchema: {
      type: 'object',
      properties: {
        operation: {
          type: 'string',
          enum: ['validate', 'status', 'update_thresholds', 'toggle', 'stats', 'clear', 'suggest'],
        },
        path: { type: 'string' },
        content: { type: 'string' },
        enabled: { type: 'boolean' },
        thresholds: { type: 'object' },
      },
      required: ['operation'],
    },
  },
  {
    name: 'audit',
    description: 'Run pre-work audit or get status',
    inputSchema: {
      type: 'object',
      properties: {
        operation: { type: 'string', enum: ['pre_work', 'status', 'issues'] },
        taskDescription: { type: 'string' },
      },
      required: ['operation'],
    },
  },
];

const TOOL_HANDLERS = {
  obey_me_status: async () => ({
    content: [{ type: 'text', text: JSON.stringify({ status: 'active', version: '5.0.0-qa' }) }],
  }),
  auto_enforce: async (req) => {
    const { operation } = req.params.arguments;
    if (operation === 'status') {
      return {
        content: [{ type: 'text', text: JSON.stringify({ enabled: true, violations: 0 }) }],
      };
    }
    if (operation === 'validate') {
      return {
        content: [{ type: 'text', text: JSON.stringify({ valid: true, violations: [] }) }],
      };
    }
    return { content: [{ type: 'text', text: '{"ok":true}' }] };
  },
  audit: async (req) => {
    const { operation } = req.params.arguments;
    if (operation === 'status') {
      return { content: [{ type: 'text', text: '{"pending":0,"issues":[]}' }] };
    }
    return { content: [{ type: 'text', text: '{"result":"ok"}' }] };
  },
};

// ─── Server + Client factory ──────────────────────────────────────────────────

async function createConnectedPair() {
  const server = new Server(
    { name: 'swe-obey-me-qa', version: '5.0.0-qa' },
    { capabilities: { tools: {}, prompts: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOL_REGISTRY,
  }));

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const name = req.params.name;
    const handler = TOOL_HANDLERS[name];
    if (!handler) {
      throw new Error(`Unknown tool: ${name}`);
    }
    return handler(req);
  });

  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  const client = new Client(
    { name: 'qa-test-client', version: '1.0.0-qa' },
    { capabilities: {} }
  );

  await server.connect(serverTransport);
  await client.connect(clientTransport);

  return { server, client };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('MCP Server ↔ Client — handshake and tool listing', () => {
  let server, client;

  beforeAll(async () => {
    ({ server, client } = await createConnectedPair());
  });

  afterAll(async () => {
    await client?.close();
    await server?.close();
  });

  it('client connects successfully', () => {
    expect(client).toBeDefined();
  });

  it('server has tool capabilities', () => {
    expect(server._capabilities?.tools).toBeDefined();
  });

  it('tools/list returns a non-empty array', async () => {
    const result = await client.listTools();
    expect(result.tools).toBeInstanceOf(Array);
    expect(result.tools.length).toBeGreaterThan(0);
  });

  it('all registered tools have name, description, and inputSchema', async () => {
    const result = await client.listTools();
    for (const tool of result.tools) {
      expect(tool).toHaveProperty('name');
      expect(typeof tool.name).toBe('string');
      expect(tool).toHaveProperty('description');
      expect(tool).toHaveProperty('inputSchema');
    }
  });

  it('every tool inputSchema has type: object', async () => {
    const result = await client.listTools();
    for (const tool of result.tools) {
      expect(tool.inputSchema.type).toBe('object');
    }
  });

  it('tools/list includes obey_me_status', async () => {
    const result = await client.listTools();
    const names = result.tools.map(t => t.name);
    expect(names).toContain('obey_me_status');
  });
});

describe('MCP Server ↔ Client — tool execution', () => {
  let server, client;

  beforeAll(async () => {
    ({ server, client } = await createConnectedPair());
  });

  afterAll(async () => {
    await client?.close();
    await server?.close();
  });

  it('obey_me_status returns parseable JSON content', async () => {
    const result = await client.callTool({ name: 'obey_me_status', arguments: {} });
    expect(result.content).toBeInstanceOf(Array);
    expect(result.content[0].type).toBe('text');
    const data = JSON.parse(result.content[0].text);
    expect(data).toHaveProperty('status');
  });

  it('auto_enforce validate returns { valid, violations }', async () => {
    const result = await client.callTool({
      name: 'auto_enforce',
      arguments: { operation: 'validate', path: 'test.js', content: 'const x = 1;' },
    });
    const data = JSON.parse(result.content[0].text);
    expect(data).toHaveProperty('valid');
    expect(data).toHaveProperty('violations');
  });

  it('auto_enforce status returns { enabled }', async () => {
    const result = await client.callTool({
      name: 'auto_enforce',
      arguments: { operation: 'status' },
    });
    const data = JSON.parse(result.content[0].text);
    expect(data).toHaveProperty('enabled');
  });

  it('audit status returns { pending, issues }', async () => {
    const result = await client.callTool({
      name: 'audit',
      arguments: { operation: 'status' },
    });
    const data = JSON.parse(result.content[0].text);
    expect(data).toHaveProperty('pending');
    expect(data).toHaveProperty('issues');
  });
});

describe('MCP Server ↔ Client — error handling', () => {
  let server, client;

  beforeAll(async () => {
    ({ server, client } = await createConnectedPair());
  });

  afterAll(async () => {
    await client?.close();
    await server?.close();
  });

  it('throws on unknown tool call', async () => {
    await expect(
      client.callTool({ name: 'nonexistent_tool_xyz', arguments: {} })
    ).rejects.toThrow();
  });

  it('handles concurrent tool calls without deadlock', async () => {
    const calls = Array.from({ length: 5 }, () =>
      client.callTool({ name: 'obey_me_status', arguments: {} })
    );
    const results = await Promise.all(calls);
    expect(results).toHaveLength(5);
    for (const r of results) {
      expect(r.content[0].type).toBe('text');
    }
  });
});
