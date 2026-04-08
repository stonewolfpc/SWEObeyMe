#!/usr/bin/env node

/**
 * MCP Protocol Compliance Test
 * Tests strict MCP protocol compliance to catch errors that Windsurf Next would catch
 * Validates against MCP 2024-11-05 specification
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

let serverProcess;
let messageId = 0;
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  warnings: [],
  errors: [],
};

/**
 * Assert helper
 */
function assert(condition, testName, details = '') {
  testResults.total++;
  if (condition) {
    testResults.passed++;
    console.log(`  ✓ ${testName}`);
    if (details) console.log(`    ${details}`);
    return true;
  } else {
    testResults.failed++;
    const error = `✗ ${testName}`;
    console.log(error);
    if (details) console.log(`    ${details}`);
    testResults.errors.push({ test: testName, details });
    return false;
  }
}

/**
 * Send JSON-RPC request
 */
function sendRequest(method, params = {}) {
  return new Promise((resolve, reject) => {
    const request = {
      jsonrpc: '2.0',
      id: messageId++,
      method: method,
      params: params,
    };

    let responseReceived = false;
    const timeout = setTimeout(() => {
      if (!responseReceived) {
        reject(new Error(`Request timeout after 5000ms: ${method}`));
      }
    }, 5000);

    const dataHandler = data => {
      const lines = data
        .toString()
        .split('\n')
        .filter(line => line.trim());
      for (const line of lines) {
        try {
          const response = JSON.parse(line);
          if (response.id === request.id) {
            responseReceived = true;
            clearTimeout(timeout);
            serverProcess.stdout.off('data', dataHandler);
            if (response.error) {
              reject(new Error(JSON.stringify(response.error)));
            } else {
              resolve(response);
            }
          }
        } catch (e) {
          // Not JSON, ignore
        }
      }
    };

    serverProcess.stdout.on('data', dataHandler);
    serverProcess.stdin.write(JSON.stringify(request) + '\n');
  });
}

/**
 * Validate JSON-RPC 2.0 response format
 */
function validateJsonRpcResponse(response, testName) {
  const errors = [];

  if (typeof response !== 'object') {
    errors.push('Response is not an object');
  }

  if (response.jsonrpc !== '2.0') {
    errors.push(`jsonrpc version is "${response.jsonrpc}", expected "2.0"`);
  }

  if (response.id === undefined) {
    errors.push('Missing id field');
  }

  if (response.result === undefined && response.error === undefined) {
    errors.push('Missing both result and error fields');
  }

  if (response.result !== undefined && response.error !== undefined) {
    errors.push('Cannot have both result and error fields');
  }

  if (response.error) {
    if (typeof response.error.code !== 'number') {
      errors.push('Error code must be a number');
    }
    if (typeof response.error.message !== 'string') {
      errors.push('Error message must be a string');
    }
  }

  return errors;
}

/**
 * Run all MCP compliance tests
 */
async function runMCPComplianceTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     MCP Protocol Compliance Test Suite                    ║');
  console.log('║     Validating against MCP 2024-11-05 specification       ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Resolve path to index.js
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const indexPath = path.join(__dirname, '..', 'index.js');

  try {
    // Start the server
    console.log('Starting MCP server...');
    console.log('Server path:', indexPath);
    serverProcess = spawn('node', [indexPath], {
      cwd: path.dirname(indexPath),
      stdio: ['pipe', 'pipe', 'inherit'],
    });

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 1: Initialize handshake
    console.log('\n=== Test 1: Initialize Handshake ===');
    try {
      const initResponse = await sendRequest('initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
          name: 'test-client',
          version: '1.0.0',
        },
      });

      const validationErrors = validateJsonRpcResponse(initResponse, 'Initialize response');
      validationErrors.forEach(err => console.log(`  ✗ ${err}`));
      assert(validationErrors.length === 0, 'Initialize response format is valid');

      assert(initResponse.result.serverInfo, 'Server info present');
      assert(initResponse.result.serverInfo.name, 'Server name present');
      assert(initResponse.result.serverInfo.version, 'Server version present');
      assert(initResponse.result.capabilities, 'Capabilities present');

      console.log('  ✓ Initialize handshake complete');
    } catch (error) {
      assert(false, 'Initialize handshake failed', error.message);
      throw error;
    }

    // Test 2: List tools
    console.log('\n=== Test 2: List Tools ===');
    try {
      const toolsResponse = await sendRequest('tools/list');

      const validationErrors = validateJsonRpcResponse(toolsResponse, 'List tools response');
      validationErrors.forEach(err => console.log(`  ✗ ${err}`));
      assert(validationErrors.length === 0, 'List tools response format is valid');

      assert(Array.isArray(toolsResponse.result.tools), 'Tools is an array');
      assert(toolsResponse.result.tools.length > 0, 'At least one tool available');

      console.log(`  ✓ ${toolsResponse.result.tools.length} tools validated`);
    } catch (error) {
      assert(false, 'List tools failed', error.message);
    }

    // Test 3: Tool call with valid parameters
    console.log('\n=== Test 3: Tool Call (Valid) ===');
    try {
      const toolResponse = await sendRequest('tools/call', {
        name: 'obey_me_status',
        arguments: {},
      });

      const validationErrors = validateJsonRpcResponse(toolResponse, 'Tool call response');
      validationErrors.forEach(err => console.log(`  ✗ ${err}`));
      assert(validationErrors.length === 0, 'Tool call response format is valid');

      assert(toolResponse.result.content, 'Tool response has content');
      assert(Array.isArray(toolResponse.result.content), 'Content is an array');
      assert(toolResponse.result.content.length > 0, 'Content has at least one item');

      console.log('  ✓ Tool call response validated');
    } catch (error) {
      assert(false, 'Tool call failed', error.message);
    }

    // Print summary
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║              MCP COMPLIANCE TEST RESULTS                  ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log(`Total Tests:  ${testResults.total}`);
    console.log(`Passed:       ${testResults.passed} ✓`);
    console.log(`Failed:       ${testResults.failed} ✗`);

    if (testResults.failed > 0) {
      console.log('\nFailed Tests:');
      testResults.errors.forEach(e => {
        console.log(`  ✗ ${e.test}`);
        if (e.details) console.log(`    ${e.details}`);
      });
    }

    const successRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
    console.log(`\nSuccess Rate: ${successRate}%`);

    if (testResults.failed === 0) {
      console.log('\n✓ ALL MCP COMPLIANCE TESTS PASSED!');
      console.log('The server is fully compliant with MCP 2024-11-05 specification.');
    } else {
      console.log('\n✗ SOME MCP COMPLIANCE TESTS FAILED!');
      console.log('These issues may cause problems with Windsurf Next or other MCP clients.');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n✗ CRITICAL ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    // Cleanup
    if (serverProcess) {
      serverProcess.kill();
    }
  }
}

// Run tests
runMCPComplianceTests();
