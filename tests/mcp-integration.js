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

    // Test 3: Obey me status
    console.log('\nTest 3: Obey me status...');
    try {
      const result = await sendRequest('tools/call', {
        name: 'obey_me_status',
        arguments: {},
      });
      console.log('✓ Obey me status successful');
      console.log('   Response:', result.content[0].text);
      testsPassed++;
    } catch (error) {
      console.error('✗ Obey me status failed:', error.message);
      testsFailed++;
    }

    // Test 4: Surgical plan (valid)
    console.log('\nTest 4: Surgical plan (valid)...');
    try {
      const result = await sendRequest('tools/call', {
        name: 'obey_surgical_plan',
        arguments: {
          target_file: 'test.js',
          current_line_count: 100,
          estimated_addition: 50,
          action: 'repair',
        },
      });
      console.log('✓ Surgical plan successful');
      console.log('   Response:', result.content[0].text);
      testsPassed++;
    } catch (error) {
      console.error('✗ Surgical plan failed:', error.message);
      testsFailed++;
    }

    // Test 5: Surgical plan (invalid - exceeds limit)
    console.log('\nTest 5: Surgical plan (invalid - exceeds limit)...');
    try {
      const result = await sendRequest('tools/call', {
        name: 'obey_surgical_plan',
        arguments: {
          target_file: 'test.js',
          current_line_count: 650,
          estimated_addition: 100,
          action: 'repair',
        },
      });
      console.error('✗ Surgical plan should have been rejected but was approved');
      testsFailed++;
    } catch (error) {
      console.log('✓ Surgical plan correctly rejected');
      console.log('   Error:', error.message);
      testsPassed++;
    }

    // Test 6: Enforce surgical rules (valid code)
    console.log('\nTest 6: Enforce surgical rules (valid code)...');
    try {
      const result = await sendRequest('tools/call', {
        name: 'enforce_surgical_rules',
        arguments: {
          proposed_code: 'function test() { return true; }',
          file_path: 'test.js',
        },
      });
      console.log('✓ Enforce surgical rules successful');
      console.log('   Response:', result.content[0].text);
      testsPassed++;
    } catch (error) {
      console.error('✗ Enforce surgical rules failed:', error.message);
      testsFailed++;
    }

    // Test 7: Enforce surgical rules (invalid - console.log)
    console.log('\nTest 7: Enforce surgical rules (invalid - console.log)...');
    try {
      const result = await sendRequest('tools/call', {
        name: 'enforce_surgical_rules',
        arguments: {
          proposed_code: 'console.log("test");',
          file_path: 'test.js',
        },
      });
      console.error('✗ Enforce surgical rules should have rejected console.log');
      testsFailed++;
    } catch (error) {
      console.log('✓ Enforce surgical rules correctly rejected console.log');
      console.log('   Error:', error.message);
      testsPassed++;
    }

    // Test 8: Get session context
    console.log('\nTest 8: Get session context...');
    try {
      const result = await sendRequest('tools/call', {
        name: 'get_session_context',
        arguments: {},
      });
      console.log('✓ Get session context successful');
      testsPassed++;
    } catch (error) {
      console.error('✗ Get session context failed:', error.message);
      testsFailed++;
    }

    // Test 9: Query the oracle
    console.log('\nTest 9: Query the oracle...');
    try {
      const result = await sendRequest('tools/call', {
        name: 'query_the_oracle',
        arguments: {},
      });
      console.log('✓ Query the oracle successful');
      console.log('   Oracle says:', result.content[0].text);
      testsPassed++;
    } catch (error) {
      console.error('✗ Query the oracle failed:', error.message);
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
