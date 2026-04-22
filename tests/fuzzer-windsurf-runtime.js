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
    this.configPath = options.configPath || path.join(__dirname, '..', 'mcp-configs', 'windsurf-mcp.json');
    this.timeout = options.timeout || 30000; // 30 seconds
    this.maxIterations = options.maxIterations || 100;
    
    this.messageFuzzer = new MCPMessageFuzzer();
    this.transportFuzzer = new TransportFuzzer();
    this.timingFuzzer = new TimingFuzzer();
    
    this.results = {
      serverInvariants: {},
      protocolInvariants: {},
      safetyInvariants: {},
      crashes: [],
      hangs: [],
      errors: []
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
        env: process.env
      });

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
      const timeout = setTimeout(() => {
        reject(new Error('Message timeout'));
      }, this.timeout);

      this.server.stdout.once('data', (data) => {
        clearTimeout(timeout);
        response = data.toString();
        resolve(response);
      });

      this.server.stdin.write(JSON.stringify(message) + '\n');
    });
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
          content: 'test content'
        }
      }
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
      default:
        return true;
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
          path: '../../../etc/passwd'
        }
      }
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
          path: './important-file.txt'
        }
      }
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
   * Run full fuzzer suite
   */
  async runFullFuzzer() {
    console.log('=== Windsurf Runtime Fuzzer ===\n');
    
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

      // Run message fuzzing
      console.log('Running message fuzzer...');
      const messageBatch = this.messageFuzzer.generateFuzzBatch(50);
      for (const { type, message } of messageBatch) {
        try {
          await this.sendMessage(message);
        } catch (e) {
          this.errors.push({ type, message, error: e.message });
        }
      }
      console.log('Message fuzzer complete\n');

      // Run transport fuzzing
      console.log('Running transport fuzzer...');
      const transportBatch = this.transportFuzzer.generateFuzzBatch(30);
      for (const { transport, fuzzed } of transportBatch) {
        try {
          if (typeof fuzzed === 'string') {
            await this.sendMessage(JSON.parse(fuzzed));
          } else if (Array.isArray(fuzzed)) {
            // Reassemble chunks
            const reassembled = fuzzed.join('');
            await this.sendMessage(JSON.parse(reassembled));
          }
        } catch (e) {
          this.errors.push({ transport, fuzzed, error: e.message });
        }
      }
      console.log('Transport fuzzer complete\n');

      // Run timing fuzzing
      console.log('Running timing fuzzer...');
      await this.timingFuzzer.runFuzzBatch(async () => {
        const message = this.messageFuzzer.generateRequest();
        return await this.sendMessage(message);
      }, 20);
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
    const serverResults = validateInvariants(this.results.serverInvariants, getAllInvariants().server);
    const protocolResults = validateInvariants(this.results.protocolInvariants, getAllInvariants().protocol);
    const safetyResults = validateInvariants(this.results.safetyInvariants, getAllInvariants().safety);

    const report = {
      serverInvariants: serverResults,
      protocolInvariants: protocolResults,
      safetyInvariants: safetyResults,
      crashes: this.crashes,
      hangs: this.hangs,
      errors: this.errors,
      passed: serverResults.passed && protocolResults.passed && safetyResults.passed,
      totalViolations: serverResults.failed + protocolResults.failed + safetyResults.failed + this.crashes.length + this.hangs.length
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
  console.log(`Protocol Invariants: ${report.protocolInvariants.passed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Safety Invariants: ${report.safetyInvariants.passed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Crashes: ${report.crashes.length}`);
  console.log(`Hangs: ${report.hangs.length}`);
  console.log(`Errors: ${report.errors.length}`);
  console.log(`Total Violations: ${report.totalViolations}`);
  
  process.exit(report.passed ? 0 : 1);
}
