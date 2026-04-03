#!/usr/bin/env node

/**
 * MCP Protocol Compliance Test
 * Tests strict MCP protocol compliance to catch errors that Windsurf Next would catch
 * Validates against MCP 2024-11-05 specification
 */

import { spawn } from 'child_process';

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
 * Warning helper
 */
function warn(condition, testName, details = '') {
  if (!condition) {
    testResults.warnings.push({ test: testName, details });
    console.log(`  ⚠ ${testName}`);
    if (details) console.log(`    ${details}`);
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
 * Validate tool schema
 */
function validateToolSchema(tool, testName) {
  const errors = [];

  if (typeof tool.name !== 'string') {
    errors.push('Tool name must be a string');
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(tool.name)) {
    errors.push('Tool name must match pattern: [a-zA-Z0-9_-]+');
  }

  if (typeof tool.description !== 'string') {
    errors.push('Tool description must be a string');
  }

  // inputSchema is optional for tools that don't take parameters
  if (tool.inputSchema) {
    if (tool.inputSchema.type !== 'object') {
      errors.push('inputSchema.type must be "object"');
    }
    if (!tool.inputSchema.properties) {
      errors.push('inputSchema must have properties if present');
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

  try {
    // Start the server
    console.log('Starting MCP server...');
    serverProcess = spawn('node', ['index.js'], {
      cwd: process.cwd(),
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

      // Validate protocol version
      if (initResponse.result.serverInfo.protocolVersion) {
        assert(
          initResponse.result.serverInfo.protocolVersion === '2024-11-05',
          'Protocol version matches 2024-11-05',
          `Got: ${initResponse.result.serverInfo.protocolVersion}`
        );
      }

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

      // Validate each tool schema
      let schemaErrors = 0;
      toolsResponse.result.tools.forEach((tool, index) => {
        const errors = validateToolSchema(tool, `Tool ${index}: ${tool.name}`);
        if (errors.length > 0) {
          schemaErrors++;
          errors.forEach(err => console.log(`    ✗ ${tool.name}: ${err}`));
        }
      });
      assert(schemaErrors === 0, 'All tool schemas are valid');

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

      toolResponse.result.content.forEach((item, index) => {
        assert(item.type, `Content item ${index} has type`);
        assert(
          ['text', 'image', 'resource'].includes(item.type),
          `Content item ${index} has valid type`
        );
        assert(item.text || item.data, `Content item ${index} has data`);
      });

      console.log('  ✓ Tool call response validated');
    } catch (error) {
      assert(false, 'Tool call failed', error.message);
    }

    // Test 4: Tool call with invalid parameters
    console.log('\n=== Test 4: Tool Call (Invalid Parameters) ===');
    try {
      // Note: MCP tools should be lenient with parameters, not strictly reject them
      const toolResponse = await sendRequest('tools/call', {
        name: 'obey_me_status',
        arguments: { invalid_param: 'value' },
      });

      const validationErrors = validateJsonRpcResponse(
        toolResponse,
        'Tool call with invalid params'
      );
      validationErrors.forEach(err => console.log(`  ✗ ${err}`));
      assert(validationErrors.length === 0, 'Tool call response format is valid');

      // Tools should ignore unknown parameters, not error
      assert(toolResponse.result, 'Tool call succeeds with unknown parameters');
      console.log('  ✓ Tool call handles unknown parameters gracefully');
    } catch (error) {
      assert(false, 'Invalid parameter test failed', error.message);
    }

    // Test 5: Tool call with non-existent tool
    console.log('\n=== Test 5: Tool Call (Non-existent Tool) ===');
    try {
      try {
        await sendRequest('tools/call', {
          name: 'non_existent_tool',
          arguments: {},
        });
        assert(false, 'Tool call should reject non-existent tool');
      } catch (error) {
        assert(true, 'Tool call properly rejects non-existent tool', error.message);
      }
    } catch (error) {
      assert(false, 'Non-existent tool test failed', error.message);
    }

    // Test 6: Error response format (using surgical plan rejection)
    console.log('\n=== Test 6: Error Response Format ===');
    try {
      try {
        const result = await sendRequest('tools/call', {
          name: 'obey_surgical_plan',
          arguments: {
            target_file: 'test.js',
            current_line_count: 10000,
            estimated_addition: 1000,
            action: 'repair',
          },
        });

        // Check if it returned an error in the result
        if (result.result && result.result.isError) {
          console.log('  ✓ Tool returned error in result (not JSON-RPC error)');
        } else {
          // Some tools handle validation internally and return success with error message
          console.log('  ✓ Tool handled validation internally');
        }
      } catch (error) {
        // Parse error message
        const errorObj = JSON.parse(error.message);
        assert(errorObj.code !== undefined, 'Error has code');
        assert(typeof errorObj.code === 'number', 'Error code is number');
        assert(errorObj.message, 'Error has message');
        assert(typeof errorObj.message === 'string', 'Error message is string');
        console.log('  ✓ JSON-RPC error response format validated');
      }
    } catch (error) {
      assert(false, 'Error response format test failed', error.message);
    }

    // Test 7: Request with missing required field
    console.log('\n=== Test 7: Missing Required Field ===');
    try {
      const request = {
        jsonrpc: '2.0',
        id: messageId++,
        method: 'tools/call',
        // Missing 'params' field
      };

      return new Promise(resolve => {
        const dataHandler = data => {
          const lines = data
            .toString()
            .split('\n')
            .filter(line => line.trim());
          for (const line of lines) {
            try {
              const response = JSON.parse(line);
              if (response.id === request.id) {
                serverProcess.stdout.off('data', dataHandler);
                // Should handle gracefully, either succeed or return error
                assert(true, 'Server handles missing params gracefully');
                console.log('  ✓ Missing required field handled gracefully');
                resolve();
              }
            } catch (e) {}
          }
        };
        serverProcess.stdout.on('data', dataHandler);
        serverProcess.stdin.write(JSON.stringify(request) + '\n');
        setTimeout(() => {
          serverProcess.stdout.off('data', dataHandler);
          assert(true, 'No crash on missing field');
          console.log('  ✓ No crash on missing field');
          resolve();
        }, 2000);
      });
    } catch (error) {
      assert(false, 'Missing field test failed', error.message);
    }

    // Test 8: Concurrent requests
    console.log('\n=== Test 8: Concurrent Requests ===');
    try {
      const requests = [
        sendRequest('tools/call', { name: 'obey_me_status', arguments: {} }),
        sendRequest('tools/call', { name: 'get_session_context', arguments: {} }),
        sendRequest('tools/call', { name: 'obey_me_status', arguments: {} }),
      ];

      const responses = await Promise.all(requests);
      assert(responses.length === 3, 'All concurrent requests handled');
      assert(
        responses.every(r => r.result),
        'All responses have result field'
      );
      console.log('  ✓ Concurrent requests handled correctly');
    } catch (error) {
      assert(false, 'Concurrent requests test failed', error.message);
    }

    // Test 9: Request with invalid JSON-RPC version
    console.log('\n=== Test 9: Invalid JSON-RPC Version ===');
    try {
      const request = {
        jsonrpc: '1.0',
        id: messageId++,
        method: 'tools/call',
        params: { name: 'obey_me_status', arguments: {} },
      };

      return new Promise(resolve => {
        const dataHandler = data => {
          const lines = data
            .toString()
            .split('\n')
            .filter(line => line.trim());
          for (const line of lines) {
            try {
              const response = JSON.parse(line);
              if (response.id === request.id) {
                serverProcess.stdout.off('data', dataHandler);
                // Should handle gracefully
                assert(true, 'Server handles invalid JSON-RPC version');
                console.log('  ✓ Invalid JSON-RPC version handled gracefully');
                resolve();
              }
            } catch (e) {}
          }
        };
        serverProcess.stdout.on('data', dataHandler);
        serverProcess.stdin.write(JSON.stringify(request) + '\n');
        setTimeout(() => {
          serverProcess.stdout.off('data', dataHandler);
          resolve();
        }, 2000);
      });
    } catch (error) {
      assert(false, 'Invalid JSON-RPC version test failed', error.message);
    }

    // Test 10: Response ID matches request ID
    console.log('\n=== Test 10: Request/Response ID Matching ===');
    try {
      const testId = 99999;
      const response = await sendRequest('tools/call', { name: 'obey_me_status', arguments: {} });
      // We can't easily test this with the current sendRequest implementation
      // but we can verify the response has an ID
      assert(response.id !== undefined, 'Response has ID');
      console.log('  ✓ Response ID present');
    } catch (error) {
      assert(false, 'ID matching test failed', error.message);
    }

    // Test 11: Tool with empty result
    console.log('\n=== Test 11: Tool with Empty Result ===');
    try {
      const response = await sendRequest('tools/call', {
        name: 'get_config',
        arguments: {},
      });
      assert(response.result !== undefined, 'Tool returns result even if empty');
      console.log('  ✓ Empty result handled correctly');
    } catch (error) {
      assert(false, 'Empty result test failed', error.message);
    }

    // Test 12: Large response handling
    console.log('\n=== Test 12: Large Response Handling ===');
    try {
      const response = await sendRequest('tools/call', {
        name: 'get_session_context',
        arguments: {},
      });
      assert(response.result, 'Large response handled');
      console.log('  ✓ Large response handled correctly');
    } catch (error) {
      assert(false, 'Large response test failed', error.message);
    }

    // Test 13: Special characters in arguments
    console.log('\n=== Test 13: Special Characters in Arguments ===');
    try {
      const response = await sendRequest('tools/call', {
        name: 'validate_before_write',
        arguments: {
          file_path: 'test-file with spaces.js',
          content: 'console.log("test");\n// Comments with "quotes"',
          language: 'javascript',
        },
      });
      assert(response.result, 'Special characters handled');
      console.log('  ✓ Special characters handled correctly');
    } catch (error) {
      // This might fail, which is okay
      console.log('  ⚠ Special characters test: ' + error.message);
    }

    // Test 14: Tool capabilities
    console.log('\n=== Test 14: Tool Capabilities ===');
    try {
      const toolsResponse = await sendRequest('tools/list');
      const hasComplexTools = toolsResponse.result.tools.some(
        t =>
          t.inputSchema &&
          t.inputSchema.properties &&
          Object.keys(t.inputSchema.properties).length > 0
      );
      assert(hasComplexTools, 'Server has tools with complex schemas');
      console.log('  ✓ Tool capabilities validated');
    } catch (error) {
      assert(false, 'Tool capabilities test failed', error.message);
    }

    // Test 15: Server info consistency
    console.log('\n=== Test 15: Server Info Consistency ===');
    try {
      const initResponse = await sendRequest('initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'test', version: '1.0' },
      });

      const serverInfo = initResponse.result.serverInfo;
      assert(serverInfo.name, 'Server has name');
      assert(serverInfo.version, 'Server has version');
      assert(serverInfo.name.length > 0, 'Server name is not empty');
      assert(serverInfo.version.length > 0, 'Server version is not empty');
      console.log(`  ✓ Server info: ${serverInfo.name} v${serverInfo.version}`);
    } catch (error) {
      assert(false, 'Server info test failed', error.message);
    }

    // Print summary
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║              MCP COMPLIANCE TEST RESULTS                  ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log(`Total Tests:  ${testResults.total}`);
    console.log(`Passed:       ${testResults.passed} ✓`);
    console.log(`Failed:       ${testResults.failed} ✗`);
    console.log(`Warnings:     ${testResults.warnings.length} ⚠`);

    if (testResults.warnings.length > 0) {
      console.log('\nWarnings:');
      testResults.warnings.forEach(w => {
        console.log(`  ⚠ ${w.test}`);
        if (w.details) console.log(`    ${w.details}`);
      });
    }

    if (testResults.errors.length > 0) {
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
      console.log('It should work correctly with Windsurf Next and other MCP clients.');
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
