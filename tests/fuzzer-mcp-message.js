#!/usr/bin/env node

/**
 * MCP Message Fuzzer
 * 
 * Generates random/mutated MCP protocol messages to test server robustness
 * Fuzzes: toolCalls, params, IDs, partial JSON, wrong types, huge payloads
 */

import { randomBytes } from 'crypto';

export class MCPMessageFuzzer {
  constructor(options = {}) {
    this.maxPayloadSize = options.maxPayloadSize || 10 * 1024 * 1024; // 10MB
    this.maxDepth = options.maxDepth || 10;
    this.mutationRate = options.mutationRate || 0.3;
  }

  /**
   * Generate a random JSON-RPC request
   */
  generateRequest(toolName = 'test_tool') {
    const id = this.generateRandomId();
    const method = this.randomChoice(['tools/call', 'tools/list', 'prompts/list', 'resources/list']);
    
    let params = {};
    if (method === 'tools/call') {
      params = {
        name: toolName,
        arguments: this.generateRandomObject()
      };
    }

    return {
      jsonrpc: '2.0',
      id,
      method,
      params
    };
  }

  /**
   * Generate a random JSON-RPC response
   */
  generateResponse(id = null) {
    const hasError = Math.random() < 0.1;
    
    if (hasError) {
      return {
        jsonrpc: '2.0',
        id,
        error: {
          code: this.randomChoice([-32700, -32600, -32601, -32602, -32603]),
          message: this.generateRandomString(50),
          data: this.generateRandomObject()
        }
      };
    }

    return {
      jsonrpc: '2.0',
      id,
      result: this.generateRandomObject()
    };
  }

  /**
   * Generate a random notification
   */
  generateNotification(method = 'notifications/message') {
    return {
      jsonrpc: '2.0',
      method,
      params: this.generateRandomObject()
    };
  }

  /**
   * Mutate an existing message
   */
  mutateMessage(message) {
    const mutations = [
      () => this.mutateJsonStructure(message),
      () => this.mutateTypes(message),
      () => this.mutateIds(message),
      () => this.corruptJson(message),
      () => this.addExtraFields(message),
      () => this.removeRequiredFields(message)
    ];

    // Apply random mutations
    const numMutations = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < numMutations; i++) {
      const mutation = this.randomChoice(mutations);
      try {
        mutation();
      } catch (e) {
        // Mutation failed, continue
      }
    }

    return message;
  }

  /**
   * Generate partial JSON (truncated)
   */
  generatePartialJson(message) {
    const json = JSON.stringify(message);
    const truncateAt = Math.floor(Math.random() * json.length);
    return json.substring(0, truncateAt);
  }

  /**
   * Generate malformed JSON
   */
  generateMalformedJson() {
    const malformations = [
      '{"jsonrpc": "2.0", "id": 1, "method": "tools/call"', // Missing closing brace
      '{"jsonrpc": "2.0", "id": 1, method: "tools/call"}', // Unquoted key
      '{"jsonrpc": "2.0", "id": 1, "method": "tools/call",}', // Trailing comma
      '{jsonrpc: "2.0", id: 1, method: "tools/call"}', // No quotes
      '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": undefined}', // Undefined value
    ];
    return this.randomChoice(malformations);
  }

  /**
   * Generate huge payload
   */
  generateHugePayload(size = this.maxPayloadSize) {
    const hugeData = randomBytes(size).toString('base64');
    return {
      jsonrpc: '2.0',
      id: this.generateRandomId(),
      method: 'tools/call',
      params: {
        name: 'test_tool',
        arguments: {
          hugeData
        }
      }
    };
  }

  /**
   * Generate random object with nested structure
   */
  generateRandomObject(depth = 0) {
    if (depth >= this.maxDepth) {
      return this.generateRandomValue();
    }

    const type = this.randomChoice(['object', 'array', 'value']);
    
    if (type === 'object') {
      const obj = {};
      const numKeys = Math.floor(Math.random() * 5) + 1;
      for (let i = 0; i < numKeys; i++) {
        obj[this.generateRandomString(10)] = this.generateRandomObject(depth + 1);
      }
      return obj;
    } else if (type === 'array') {
      const arr = [];
      const numItems = Math.floor(Math.random() * 5) + 1;
      for (let i = 0; i < numItems; i++) {
        arr.push(this.generateRandomObject(depth + 1));
      }
      return arr;
    } else {
      return this.generateRandomValue();
    }
  }

  /**
   * Generate random primitive value
   */
  generateRandomValue() {
    const types = ['string', 'number', 'boolean', 'null'];
    const type = this.randomChoice(types);

    switch (type) {
      case 'string':
        return this.generateRandomString(Math.floor(Math.random() * 100) + 1);
      case 'number':
        return Math.random() * 1000000;
      case 'boolean':
        return Math.random() < 0.5;
      case 'null':
        return null;
      default:
        return null;
    }
  }

  /**
   * Generate random string
   */
  generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Generate random ID
   */
  generateRandomId() {
    const types = ['string', 'number', 'null'];
    const type = this.randomChoice(types);

    switch (type) {
      case 'string':
        return this.generateRandomString(20);
      case 'number':
        return Math.floor(Math.random() * 1000000);
      case 'null':
        return null;
      default:
        return this.generateRandomString(20);
    }
  }

  /**
   * Random choice from array
   */
  randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /**
   * Mutate JSON structure
   */
  mutateJsonStructure(obj) {
    if (typeof obj !== 'object' || obj === null) return;

    const keys = Object.keys(obj);
    if (keys.length === 0) return;

    const key = this.randomChoice(keys);
    if (Math.random() < 0.5) {
      delete obj[key];
    } else {
      obj[key] = this.generateRandomObject();
    }
  }

  /**
   * Mutate types
   */
  mutateTypes(obj) {
    if (typeof obj !== 'object' || obj === null) return;

    for (const key of Object.keys(obj)) {
      if (Math.random() < this.mutationRate) {
        const types = ['string', 'number', 'boolean', 'object', 'array', 'null'];
        const newType = this.randomChoice(types);
        
        switch (newType) {
          case 'string':
            obj[key] = this.generateRandomString(10);
            break;
          case 'number':
            obj[key] = Math.random() * 1000;
            break;
          case 'boolean':
            obj[key] = Math.random() < 0.5;
            break;
          case 'object':
            obj[key] = {};
            break;
          case 'array':
            obj[key] = [];
            break;
          case 'null':
            obj[key] = null;
            break;
        }
      }
    }
  }

  /**
   * Mutate IDs
   */
  mutateIds(obj) {
    if (typeof obj !== 'object' || obj === null) return;

    if ('id' in obj) {
      obj.id = this.generateRandomId();
    }
    if ('requestId' in obj) {
      obj.requestId = this.generateRandomId();
    }
  }

  /**
   * Corrupt JSON
   */
  corruptJson(obj) {
    if (typeof obj !== 'object' || obj === null) return;

    // Add circular reference (will fail JSON.stringify)
    if (Math.random() < 0.2) {
      obj.circular = obj;
    }

    // Add undefined
    if (Math.random() < 0.3) {
      obj.undefined = undefined;
    }

    // Add function
    if (Math.random() < 0.2) {
      obj.func = () => {};
    }
  }

  /**
   * Add extra fields
   */
  addExtraFields(obj) {
    if (typeof obj !== 'object' || obj === null) return;

    const numExtras = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < numExtras; i++) {
      obj[`extra_${this.generateRandomString(5)}`] = this.generateRandomValue();
    }
  }

  /**
   * Remove required fields
   */
  removeRequiredFields(obj) {
    if (typeof obj !== 'object' || obj === null) return;

    const requiredFields = ['jsonrpc', 'id', 'method', 'params'];
    const field = this.randomChoice(requiredFields);
    
    if (field in obj && Math.random() < 0.3) {
      delete obj[field];
    }
  }

  /**
   * Generate fuzz batch
   */
  generateFuzzBatch(count = 100) {
    const batch = [];
    const toolNames = ['test_tool', 'analyze', 'search', 'write', 'read', 'execute'];

    for (let i = 0; i < count; i++) {
      const type = this.randomChoice(['request', 'response', 'notification', 'partial', 'malformed', 'huge']);
      const toolName = this.randomChoice(toolNames);

      let message;
      switch (type) {
        case 'request':
          message = this.generateRequest(toolName);
          break;
        case 'response':
          message = this.generateResponse(this.generateRandomId());
          break;
        case 'notification':
          message = this.generateNotification();
          break;
        case 'partial':
          message = this.generatePartialJson(this.generateRequest(toolName));
          break;
        case 'malformed':
          message = this.generateMalformedJson();
          break;
        case 'huge':
          message = this.generateHugePayload();
          break;
        default:
          message = this.generateRequest(toolName);
      }

      batch.push({ type, message });
    }

    return batch;
  }
}
