#!/usr/bin/env node

/**
 * MCP Server Integration Test
 * Tests the MCP server by sending JSON-RPC messages
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');
const indexJsPath = path.join(projectRoot, 'index.js');

const serverProcess = spawn('node', [indexJsPath], {
  cwd: projectRoot,
  stdio: ['pipe', 'pipe', 'inherit'],
});

let messageId = 0;
let testsPassed = 0;
let testsFailed = 0;

function sendRequest(method, params = {}) {
  return new Promise((resolve, reject) => {
    const request = {
      jsonrpc: '2.0',
      id: messageId++,
      method: method,
      params: params,
    };

    const responseHandler = (line) => {
      try {
        const response = JSON.parse(line);
        if (response.id === request.id) {
          serverProcess.stdout.off('data', dataHandler);
          if (response.error) {
            reject(new Error(response.error.message));
          } else if (response.result && response.result.isError) {
            reject(new Error(response.result.content[0].text));
          } else {
            resolve(response.result);
          }
        }
      } catch (e) {
        // Not a JSON line, ignore
      }
    };

    const dataHandler = (data) => {
      const lines = data
        .toString()
        .split('\n')
        .filter((line) => line.trim());
      lines.forEach((line) => responseHandler(line));
    };

    serverProcess.stdout.on('data', dataHandler);
    serverProcess.stdin.write(JSON.stringify(request) + '\n');

    // Timeout after 5 seconds
    setTimeout(() => {
      serverProcess.stdout.off('data', dataHandler);
      reject(new Error('Request timeout'));
    }, 5000);
  });
}

async function runTests() {
  console.log('🚀 TESTING SWEObeyMe MCP SERVER\n');

  try {
    // Wait for server to start
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Test 1: Initialize
    console.log('Test 1: Initialize...');
    try {
      const result = await sendRequest('initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
          name: 'test-client',
          version: '1.0.0',
        },
      });
      console.log('✓ Initialize successful');
      console.log('   Server info:', JSON.stringify(result.serverInfo));
      testsPassed++;
    } catch (error) {
      console.error('✗ Initialize failed:', error.message);
      testsFailed++;
    }

    // Test 2: List tools
    console.log('\nTest 2: List tools...');
    try {
      const result = await sendRequest('tools/list');
      console.log('✓ List tools successful');
      console.log('   Tools found:', result.tools.length);
      result.tools.slice(0, 5).forEach((tool) => {
        console.log('   -', tool.name);
      });
      if (result.tools.length > 5) {
        console.log('   ... and', result.tools.length - 5, 'more');
      }
      testsPassed++;
    } catch (error) {
      console.error('✗ List tools failed:', error.message);
      testsFailed++;
    }

    // Test 2.5: Get governance constitution (required for other tools)
    console.log('\nTest 2.5: Get governance constitution (governance requirement)...');
    try {
      const result = await sendRequest('tools/call', {
        name: 'get_governance_constitution',
        arguments: {},
      });
      console.log('✓ Get governance constitution successful');
      console.log('   Response length:', result.content[0].text.length);
      testsPassed++;
    } catch (error) {
      console.error('✗ Get governance constitution failed:', error.message);
      testsFailed++;
    }

    // Test 3: Surgical plan (valid)
    console.log('\nTest 4: Surgical plan (valid)...');
    try {
      const result = await sendRequest('tools/call', {
        name: 'obey_surgical_plan',
        arguments: {
          target_file: 'test.js',
          current_line_count: 100,
          estimated_addition: 50,
        },
      });
      console.log('✓ Surgical plan successful');
      console.log('   Response:', result.content[0].text);
      testsPassed++;
    } catch (error) {
      console.error('✗ Surgical plan failed:', error.message);
      testsFailed++;
    }

    // Test 4: Surgical plan (invalid - exceeds limit)
    console.log('\nTest 5: Surgical plan (invalid - exceeds limit)...');
    try {
      const result = await sendRequest('tools/call', {
        name: 'obey_surgical_plan',
        arguments: {
          target_file: 'test.js',
          current_line_count: 650,
          estimated_addition: 100,
        },
      });
      console.error('✗ Surgical plan should have been rejected but was approved');
      testsFailed++;
    } catch (error) {
      console.log('✓ Surgical plan correctly rejected');
      console.log('   Error:', error.message);
      testsPassed++;
    }

    // Test 5: Auto enforce (validate code)
    console.log('\nTest 5: Auto enforce (validate code)...');
    try {
      const result = await sendRequest('tools/call', {
        name: 'auto_enforce',
        arguments: {
          operation: 'validate',
          content: 'function test() { return true; }',
          path: 'package.json',
        },
      });
      console.log('✓ Auto enforce successful');
      console.log('   Response:', result.content[0].text);
      testsPassed++;
    } catch (error) {
      console.error('✗ Auto enforce failed:', error.message);
      testsFailed++;
    }

    // Test 6: Auto enforce (invalid - console.log)
    console.log('\nTest 6: Auto enforce (invalid - console.log)...');
    try {
      const result = await sendRequest('tools/call', {
        name: 'auto_enforce',
        arguments: {
          operation: 'validate',
          content: 'console.log("test");',
          path: 'package.json',
        },
      });
      console.error('✗ Auto enforce should have rejected console.log');
      testsFailed++;
    } catch (error) {
      console.log('✓ Auto enforce correctly rejected console.log');
      console.log('   Error:', error.message);
      testsPassed++;
    }

    // Test 7: Get server diagnostics
    console.log('\nTest 8: Get server diagnostics...');
    try {
      const result = await sendRequest('tools/call', {
        name: 'get_server_diagnostics',
        arguments: {},
      });
      console.log('✓ Get server diagnostics successful');
      console.log('   Diagnostics length:', result.content[0].text.length);
      testsPassed++;
    } catch (error) {
      console.error('✗ Get server diagnostics failed:', error.message);
      testsFailed++;
    }

    // Test 8: Read file
    console.log('\nTest 9: Read file...');
    try {
      const result = await sendRequest('tools/call', {
        name: 'read_file',
        arguments: {
          path: 'package.json',
        },
      });
      console.log('✓ Read file successful');
      console.log('   File content length:', result.content[0].text.length);
      testsPassed++;
    } catch (error) {
      console.error('✗ Read file failed:', error.message);
      testsFailed++;
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('🧪 TEST RESULTS');
    console.log('='.repeat(50));
    console.log(`✓ Passed: ${testsPassed}`);
    console.log(`✗ Failed: ${testsFailed}`);
    console.log(
      `📊 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`
    );

    if (testsFailed > 0) {
      console.log('\n❌ SOME TESTS FAILED!');
      process.exit(1);
    } else {
      console.log('\n✅ ALL TESTS PASSED!');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Critical error:', error);
    process.exit(1);
  } finally {
    // Clean up
    serverProcess.kill();
  }
}

runTests();
