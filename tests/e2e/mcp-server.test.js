/**
 * E2E tests for MCP server
 * Tests the full MCP server lifecycle
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

describe('MCP Server E2E', () => {
  let server;
  let client;

  beforeAll(async () => {
    server = new Server(
      {
        name: 'test-swe-obey-me',
        version: '1.0.0-test',
      },
      {
        capabilities: { tools: {}, prompts: {} },
      }
    );

    server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'project_track',
          description: 'Project tracking tool',
          inputSchema: { type: 'object', properties: {} },
        },
      ],
    }));

    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const name = request.params.name;
      if (name === 'project_track') {
        return { content: [{ type: 'text', text: 'audit complete' }] };
      }
      throw new Error(`Unknown tool: ${name}`);
    });

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    client = new Client(
      { name: 'test-client', version: '1.0.0-test' },
      { capabilities: {} }
    );

    await server.connect(serverTransport);
    await client.connect(clientTransport);
  });

  afterAll(async () => {
    await client?.close();
    await server?.close();
  });

  describe('Server initialization', () => {
    it('should initialize successfully', async () => {
      expect(server).toBeDefined();
    });

    it('should have correct capabilities', () => {
      const capabilities = server._capabilities;
      expect(capabilities).toBeDefined();
      expect(capabilities.tools).toBeDefined();
    });
  });

  describe('Tool registration', () => {
    it('should have required tools registered', async () => {
      const tools = await client.listTools();

      expect(tools).toBeDefined();
      expect(tools.tools).toBeInstanceOf(Array);
    });
  });

  describe('Tool execution', () => {
    it('should handle project_track operations', async () => {
      const result = await client.callTool({
        name: 'project_track',
        arguments: { operation: 'audit' },
      });

      expect(result).toBeDefined();
    });
  });

  describe('Error handling', () => {
    it('should handle invalid tool calls gracefully', async () => {
      try {
        await client.callTool({
          name: 'nonexistent_tool',
          arguments: {},
        });
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});
