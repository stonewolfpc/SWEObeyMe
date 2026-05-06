/**
 * MCP Client (Stdio Transport)
 *
 * Minimal stdio transport client (no SDK dependency to avoid SDK bugs).
 * Sends JSON-RPC 2.0 frames over stdin.
 * Reads JSON-RPC 2.0 frames from stdout.
 * Implements: initialize, list_tools, call_tool, shutdown.
 * Protocol version: 2024-11-05.
 */

import { Readable } from 'stream';

class MCPClient {
  constructor(stdin, stdout, logger) {
    this.stdin = stdin;
    this.stdout = stdout;
    this.logger = logger;
    this.requestId = 1;
    this.pendingRequests = new Map();
    this.buffer = '';
    this.metrics = {
      requestsSent: 0,
      responsesReceived: 0,
      bytesWritten: 0,
      bytesRead: 0,
      frameCount: 0,
    };

    // Set up stdout reader
    this.stdout.setEncoding('utf8');
    this.stdout.on('data', (chunk) => {
      this.buffer += chunk;
      this.metrics.bytesRead += chunk.length;
      this._processBuffer();
    });
  }

  /**
   * Process buffered data for JSON-RPC frames
   */
  _processBuffer() {
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop(); // Keep incomplete line in buffer

    for (const line of lines) {
      if (line.trim() === '') continue;

      try {
        const frame = JSON.parse(line);
        this.metrics.frameCount++;
        this._handleFrame(frame);
      } catch (error) {
        this.logger.error('client', 'parse_error', {
          line: line.substring(0, 100),
          error: error.message,
        });
      }
    }
  }

  /**
   * Handle a JSON-RPC frame
   */
  _handleFrame(frame) {
    if (frame.id !== undefined) {
      // Response to a request
      const pending = this.pendingRequests.get(frame.id);
      if (pending) {
        this.pendingRequests.delete(frame.id);

        if (frame.error) {
          pending.reject(new Error('MCP error: ' + JSON.stringify(frame.error)));
        } else {
          pending.resolve(frame.result);
        }
      }
    }
  }

  /**
   * Send a JSON-RPC request
   */
  async sendRequest(method, params = {}, timeout = 30000) {
    const id = this.requestId++;
    const request = {
      jsonrpc: '2.0',
      id,
      method,
      params,
    };

    const jsonStr = JSON.stringify(request) + '\n';

    this.logger.debug('client', 'send_request', {
      id,
      method,
      paramsKeys: Object.keys(params),
    });

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error('Request timeout: ' + method + ' (id: ' + id + ')'));
      }, timeout);

      this.pendingRequests.set(id, { resolve, reject, timeoutId });

      // Send request
      try {
        this.stdin.write(jsonStr, (error) => {
          if (error) {
            this.pendingRequests.delete(id);
            clearTimeout(timeoutId);
            reject(error);
          } else {
            this.metrics.requestsSent++;
            this.metrics.bytesWritten += jsonStr.length;
          }
        });
      } catch (error) {
        this.pendingRequests.delete(id);
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  /**
   * Initialize MCP connection
   */
  async initialize() {
    this.logger.info('client', 'initialize_start', {});

    const result = await this.sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'mcp-harness',
        version: '1.0.0',
      },
    });

    this.logger.info('client', 'initialize_success', {
      protocolVersion: result.protocolVersion,
      serverInfo: result.serverInfo,
    });

    return result;
  }

  /**
   * List available tools
   */
  async listTools() {
    this.logger.info('client', 'list_tools_start', {});

    const result = await this.sendRequest('tools/list', {});

    this.logger.info('client', 'list_tools_success', {
      toolCount: result.tools ? result.tools.length : 0,
    });

    return result;
  }

  /**
   * Call a tool
   */
  async callTool(name, args = {}) {
    this.logger.info('client', 'call_tool_start', {
      tool: name,
      argsKeys: Object.keys(args),
    });

    const result = await this.sendRequest('tools/call', {
      name,
      arguments: args,
    });

    this.logger.info('client', 'call_tool_success', {
      tool: name,
      isError: result.isError || false,
    });

    return result;
  }

  /**
   * Shutdown the connection
   */
  async shutdown() {
    this.logger.info('client', 'shutdown_start', {});

    try {
      await this.sendRequest('shutdown', {});
      this.logger.info('client', 'shutdown_success', {});
    } catch (error) {
      this.logger.warn('client', 'shutdown_failed', {
        error: error.message,
      });
    }
  }

  /**
   * Get client metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      pendingRequests: this.pendingRequests.size,
    };
  }
}

export default MCPClient;
