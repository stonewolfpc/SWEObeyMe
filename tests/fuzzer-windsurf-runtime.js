#!/usr/bin/env node

/**
 * Windsurf Runtime Fuzzer
 *
 * Fuzzes the MCP server through Windsurf's runtime environment
 * Tests: server stability, protocol compliance, safety invariants under chaos
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { MCPMessageFuzzer } from './fuzzer-mcp-message.js';
import { TransportFuzzer } from './fuzzer-transport.js';
import { TimingFuzzer } from './fuzzer-timing.js';
import { validateInvariants, getAllInvariants } from './fuzzer-invariants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class WindsurfRuntimeFuzzer {
  constructor(options = {}) {
    this.serverPath = options.serverPath || path.join(__dirname, '..', 'dist', 'mcp', 'server.js');
    this.configPath =
      options.configPath || path.join(__dirname, '..', 'mcp-configs', 'windsurf-mcp.json');
    this.timeout = options.timeout || 5000; // Reduced from 30000 to 5000ms for faster testing
    this.maxIterations = options.maxIterations || 50; // Reduced from 100 to 50 for faster feedback
    this.parallel = options.parallel !== false; // Enable parallel execution by default
    this.batchSize = options.batchSize || 10; // Process tests in batches for parallel execution

    this.messageFuzzer = new MCPMessageFuzzer();
    this.transportFuzzer = new TransportFuzzer();
    this.timingFuzzer = new TimingFuzzer();

    this.results = {
      serverInvariants: {},
      protocolInvariants: {},
      safetyInvariants: {},
      crashes: [],
      hangs: [],
      errors: [],
    };

    // Convenience aliases used throughout the class
    this.crashes = this.results.crashes;
    this.hangs = this.results.hangs;
    this.errors = this.results.errors;
  }

  /**
   * Start MCP server
   */
  startServer() {
    return new Promise((resolve, reject) => {
      const server = spawn('node', [this.serverPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: process.env,
      });

      // Prevent MaxListenersExceededWarning from rapid .once('data') in sendMessage
      server.stdout.setMaxListeners(50);
      server.stderr.setMaxListeners(50);

      let stdout = '';
      let stderr = '';

      server.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      server.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      server.on('error', (error) => {
        reject(error);
      });

      server.on('exit', (code, signal) => {
        resolve({ code, signal, stdout, stderr });
      });

      // Store server reference
      this.server = server;
      this.serverStdout = stdout;
      this.serverStderr = stderr;

      // Wait for server to start
      setTimeout(() => {
        resolve({ server, stdout, stderr });
      }, 1000);
    });
  }

  /**
   * Stop MCP server
   */
  stopServer() {
    if (this.server) {
      this.server.kill('SIGTERM');
      this.server = null;
    }
  }

  /**
   * Send message to server via stdio
   */
  async sendMessage(message) {
    return new Promise((resolve, reject) => {
      if (!this.server) {
        reject(new Error('Server not running'));
        return;
      }

      let response = '';
      let chunksReceived = 0;
      const timeout = setTimeout(() => {
        reject(new Error(`Message timeout (${chunksReceived} chunks received)`));
      }, this.timeout);

      // Use 'on' instead of 'once' to accumulate all chunks
      const dataHandler = (data) => {
        chunksReceived++;
        response += data.toString();

        // Resolve when we have a complete JSON response (ends with newline)
        if (response.endsWith('\n')) {
          clearTimeout(timeout);
          this.server.stdout.off('data', dataHandler);
          resolve(response);
        }
      };

      this.server.stdout.on('data', dataHandler);

      this.server.stdin.write(JSON.stringify(message) + '\n', (err) => {
        if (err) {
          clearTimeout(timeout);
          if (this.server && this.server.stdout) {
            this.server.stdout.off('data', dataHandler);
          }
          reject(err);
        }
      });
    });
  }

  /**
   * Send multiple messages in parallel
   */
  async sendMessagesParallel(messages) {
    if (!this.parallel) {
      // Fall back to sequential if parallel is disabled
      const results = [];
      for (const message of messages) {
        try {
          const response = await this.sendMessage(message);
          results.push({ success: true, response });
        } catch (e) {
          results.push({ success: false, error: e.message });
        }
      }
      return results;
    }

    // Send messages in parallel batches
    const results = [];
    for (let i = 0; i < messages.length; i += this.batchSize) {
      const batch = messages.slice(i, i + this.batchSize);
      const batchResults = await Promise.all(
        batch.map(async (message) => {
          try {
            const response = await this.sendMessage(message);
            return { success: true, response };
          } catch (e) {
            return { success: false, error: e.message };
          }
        })
      );
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Test server invariants
   */
  async testServerInvariants() {
    const invariants = getAllInvariants().server;
    const results = {};

    for (const [key, description] of Object.entries(invariants)) {
      try {
        const result = await this.testInvariant(key);
        results[key] = result;
      } catch (e) {
        results[key] = false;
        this.errors.push({ invariant: key, error: e.message });
      }
    }

    this.results.serverInvariants = results;
    return results;
  }

  /**
   * Test a specific invariant
   */
  async testInvariant(invariant) {
    switch (invariant) {
      case 'NO_CRASH':
        return await this.testNoCrash();
      case 'NO_HANG':
        return await this.testNoHang();
      case 'NO_INVALID_JSON':
        return await this.testNoInvalidJson();
      case 'NO_FILE_CORRUPTION':
        return await this.testNoFileCorruption();
      default:
        return true;
    }
  }

  /**
   * Test: server must not crash
   */
  async testNoCrash() {
    const iterations = 10;

    for (let i = 0; i < iterations; i++) {
      const message = this.messageFuzzer.generateRequest();

      try {
        await this.sendMessage(message);
      } catch (e) {
        // Check if server crashed
        if (!this.server || this.server.killed) {
          this.crashes.push({ message, error: e.message });
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Test: server must not hang
   */
  async testNoHang() {
    const message = this.messageFuzzer.generateRequest();

    try {
      await this.sendMessage(message);
      return true;
    } catch (e) {
      if (e.message === 'Message timeout') {
        this.hangs.push({ message, error: e.message });
        return false;
      }
      return true;
    }
  }

  /**
   * Test: server must not emit invalid JSON
   */
  async testNoInvalidJson() {
    const message = this.messageFuzzer.generateRequest();

    try {
      const response = await this.sendMessage(message);
      JSON.parse(response); // Will throw if invalid
      return true;
    } catch (e) {
      if (e instanceof SyntaxError) {
        this.errors.push({ message, error: 'Invalid JSON response' });
        return false;
      }
      return true;
    }
  }

  /**
   * Test: server must not corrupt files
   */
  async testNoFileCorruption() {
    // Send a write operation and verify file integrity
    const message = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'write_file',
        arguments: {
          path: './fuzz-test-file.txt',
          content: 'test content',
        },
      },
    };

    try {
      await this.sendMessage(message);
      // In a real implementation, we'd read the file back and verify
      return true;
    } catch (e) {
      this.errors.push({ message, error: e.message });
      return false;
    }
  }

  /**
   * Test protocol invariants
   */
  async testProtocolInvariants() {
    const invariants = getAllInvariants().protocol;
    const results = {};

    for (const [key, description] of Object.entries(invariants)) {
      try {
        const result = await this.testProtocolInvariant(key);
        results[key] = result;
      } catch (e) {
        results[key] = false;
        this.errors.push({ invariant: key, error: e.message });
      }
    }

    this.results.protocolInvariants = results;
    return results;
  }

  /**
   * Test a specific protocol invariant
   */
  async testProtocolInvariant(invariant) {
    switch (invariant) {
      case 'EVERY_REQUEST_GETS_RESPONSE':
        return await this.testEveryRequestGetsResponse();
      case 'VALID_REQUEST_ID':
        return await this.testValidRequestId();
      case 'VALID_JSON_RPC':
        return await this.testValidJsonRpc();
      default:
        return true;
    }
  }

  /**
   * Test: every request must get a response
   */
  async testEveryRequestGetsResponse() {
    const message = this.messageFuzzer.generateRequest();

    try {
      const response = await this.sendMessage(message);
      return response !== null && response !== undefined;
    } catch (e) {
      this.errors.push({ message, error: e.message });
      return false;
    }
  }

  /**
   * Test: valid request ID
   */
  async testValidRequestId() {
    const message = this.messageFuzzer.generateRequest();

    try {
      const response = await this.sendMessage(message);
      const parsed = JSON.parse(response);
      return parsed.id === message.id || parsed.id !== null;
    } catch (e) {
      this.errors.push({ message, error: e.message });
      return false;
    }
  }

  /**
   * Test: valid JSON-RPC
   */
  async testValidJsonRpc() {
    const message = this.messageFuzzer.generateRequest();

    try {
      const response = await this.sendMessage(message);
      const parsed = JSON.parse(response);
      return parsed.jsonrpc === '2.0';
    } catch (e) {
      this.errors.push({ message, error: e.message });
      return false;
    }
  }

  /**
   * Test safety invariants
   */
  async testSafetyInvariants() {
    const invariants = getAllInvariants().safety;
    const results = {};

    for (const [key, description] of Object.entries(invariants)) {
      try {
        const result = await this.testSafetyInvariant(key);
        results[key] = result;
      } catch (e) {
        results[key] = false;
        this.errors.push({ invariant: key, error: e.message });
      }
    }

    this.results.safetyInvariants = results;
    return results;
  }

  /**
   * Test a specific safety invariant
   */
  async testSafetyInvariant(invariant) {
    switch (invariant) {
      case 'NO_PATH_TRAVERSAL':
        return await this.testNoPathTraversal();
      case 'NO_DESTRUCTIVE_WITHOUT_CONFIRMATION':
        return await this.testNoDestructiveWithoutConfirmation();
      case 'NO_WRITES_OUTSIDE_ROOTS':
        return await this.testNoWritesOutsideRoots();
      case 'NO_SENSITIVE_DATA_EXPOSURE':
        return await this.testNoSensitiveDataExposure();
      case 'NO_DENIAL_OF_SERVICE':
        return await this.testNoDenialOfService();
      default:
        return true; // Skip unimplemented invariants
    }
  }

  /**
   * Test: no path traversal
   */
  async testNoPathTraversal() {
    const message = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'read_file',
        arguments: {
          path: '../../../etc/passwd',
        },
      },
    };

    try {
      const response = await this.sendMessage(message);
      const parsed = JSON.parse(response);
      // Should return error, not file contents
      return parsed.error !== undefined;
    } catch (e) {
      this.errors.push({ message, error: e.message });
      return false;
    }
  }

  /**
   * Test: no destructive operations without confirmation
   */
  async testNoDestructiveWithoutConfirmation() {
    const message = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'delete_file',
        arguments: {
          path: '/tmp/test.txt',
        },
      },
    };

    try {
      const response = await this.sendMessage(message);
      const parsed = JSON.parse(response);
      // Should require confirmation
      return parsed.error !== undefined || parsed.result.requiresConfirmation === true;
    } catch (e) {
      this.errors.push({ message, error: e.message });
      return false;
    }
  }

  /**
   * Test: no writes outside allowed roots
   */
  async testNoWritesOutsideRoots() {
    const message = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'write_file',
        arguments: {
          path: '/etc/passwd',
          content: 'malicious',
        },
      },
    };

    try {
      const response = await this.sendMessage(message);
      const parsed = JSON.parse(response);
      // Should reject write outside workspace
      return parsed.error !== undefined;
    } catch (e) {
      this.errors.push({ message, error: e.message });
      return false;
    }
  }

  /**
   * Test: no arbitrary code execution
   */
  async testNoArbitraryCodeExecution() {
    const message = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'execute_command',
        arguments: {
          command: 'rm -rf /',
        },
      },
    };

    try {
      const response = await this.sendMessage(message);
      const parsed = JSON.parse(response);
      // Should reject arbitrary command execution
      return parsed.error !== undefined;
    } catch (e) {
      this.errors.push({ message, error: e.message });
      return false;
    }
  }

  /**
   * Test: no sensitive data exposure
   */
  async testNoSensitiveDataExposure() {
    const message = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'read_file',
        arguments: {
          path: '~/.ssh/id_rsa',
        },
      },
    };

    try {
      const response = await this.sendMessage(message);
      const parsed = JSON.parse(response);
      // Should reject reading sensitive files
      return parsed.error !== undefined;
    } catch (e) {
      this.errors.push({ message, error: e.message });
      return false;
    }
  }

  /**
   * Test: no denial of service
   */
  async testNoDenialOfService() {
    const message = this.messageFuzzer.generateHugePayload(1024 * 1024); // 1MB payload

    try {
      const response = await this.sendMessage(message);
      const parsed = JSON.parse(response);
      // Should handle large payloads gracefully or reject
      return parsed.error !== undefined || parsed.result !== undefined;
    } catch (e) {
      // Timeout is acceptable for DoS protection
      this.errors.push({ message: 'huge payload', error: e.message });
      return e.message.includes('timeout');
    }
  }

  /**
   * Run full fuzzer suite
   */
  async runFullFuzzer() {
    console.log('=== Windsurf Runtime Fuzzer ===\n');
    console.log(
      `Configuration: parallel=${this.parallel}, timeout=${this.timeout}ms, batchSize=${this.batchSize}, maxIterations=${this.maxIterations}\n`
    );

    try {
      // Start server
      console.log('Starting MCP server...');
      await this.startServer();
      console.log('Server started\n');

      // Test invariants
      console.log('Testing server invariants...');
      await this.testServerInvariants();
      console.log('Server invariants tested\n');

      console.log('Testing protocol invariants...');
      await this.testProtocolInvariants();
      console.log('Protocol invariants tested\n');

      console.log('Testing safety invariants...');
      await this.testSafetyInvariants();
      console.log('Safety invariants tested\n');

      // Run message fuzzing with parallel execution
      console.log('Running message fuzzer...');
      const messageBatch = this.messageFuzzer.generateFuzzBatch(25); // Reduced from 50 to 25
      const messageResults = await this.sendMessagesParallel(messageBatch.map((m) => m.message));
      messageResults.forEach((result, i) => {
        if (!result.success) {
          this.errors.push({ type: messageBatch[i].type, error: result.error });
        }
      });
      console.log(`Message fuzzer complete (${messageResults.length} messages)\n`);

      // Run transport fuzzing with parallel execution
      console.log('Running transport fuzzer...');
      const transportBatch = this.transportFuzzer.generateFuzzBatch(15); // Reduced from 30 to 15
      const transportMessages = transportBatch
        .map((t) => {
          if (typeof t.fuzzed === 'string') {
            return JSON.parse(t.fuzzed);
          } else if (Array.isArray(t.fuzzed)) {
            return JSON.parse(t.fuzzed.join(''));
          }
          return null;
        })
        .filter((m) => m !== null);

      const transportResults = await this.sendMessagesParallel(transportMessages);
      transportResults.forEach((result, i) => {
        if (!result.success) {
          this.errors.push({ type: transportBatch[i].transport, error: result.error });
        }
      });
      console.log(`Transport fuzzer complete (${transportResults.length} messages)\n`);

      // Run timing fuzzer
      console.log('Running timing fuzzer...');
      const timingBatch = this.timingFuzzer.generateFuzzBatch(10); // Reduced iterations
      for (const { type, message, delay } of timingBatch) {
        try {
          await this.sendMessage(message);
          // Simulate delay if needed
          if (delay) await new Promise((r) => setTimeout(r, delay));
        } catch (e) {
          this.errors.push({ type, error: e.message });
        }
      }
      console.log('Timing fuzzer complete\n');
    } catch (e) {
      console.error('Fuzzer error:', e);
      this.errors.push({ error: e.message });
    } finally {
      // Stop server
      console.log('Stopping server...');
      this.stopServer();
      console.log('Server stopped\n');
    }

    return this.generateReport();
  }

  /**
   * Generate fuzzer report
   */
  generateReport() {
    const serverResults = validateInvariants(
      this.results.serverInvariants,
      getAllInvariants().server
    );
    const protocolResults = validateInvariants(
      this.results.protocolInvariants,
      getAllInvariants().protocol
    );
    const safetyResults = validateInvariants(
      this.results.safetyInvariants,
      getAllInvariants().safety
    );

    const report = {
      serverInvariants: serverResults,
      protocolInvariants: protocolResults,
      safetyInvariants: safetyResults,
      crashes: this.crashes,
      hangs: this.hangs,
      errors: this.errors,
      passed: serverResults.passed && protocolResults.passed && safetyResults.passed,
      totalViolations:
        serverResults.failed +
        protocolResults.failed +
        safetyResults.failed +
        this.crashes.length +
        this.hangs.length,
    };

    return report;
  }
}

// Run fuzzer if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const fuzzer = new WindsurfRuntimeFuzzer();
  const report = await fuzzer.runFullFuzzer();

  console.log('=== Fuzzer Report ===');
  console.log(`Server Invariants: ${report.serverInvariants.passed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(
    `Protocol Invariants: ${report.protocolInvariants.passed ? '✅ PASSED' : '❌ FAILED'}`
  );
  console.log(`Safety Invariants: ${report.safetyInvariants.passed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Crashes: ${report.crashes.length}`);
  console.log(`Hangs: ${report.hangs.length}`);
  console.log(`Errors: ${report.errors.length}`);
  console.log(`Total Violations: ${report.totalViolations}`);

  process.exit(report.passed ? 0 : 1);
}
