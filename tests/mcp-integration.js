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

    // Test 2.5: Call constitution first to bypass orientation check
    console.log('\nTest 2.5: Get governance constitution...');
    try {
      const result = await sendRequest('tools/call', {
        name: 'get_governance_constitution',
        arguments: {},
      });
      console.log('✓ Constitution call successful');
      testsPassed++;
    } catch (error) {
      console.error('✗ Constitution call failed:', error.message);
      testsFailed++;
    }

    // Test 3: file_ops - File read operation
    console.log('\nTest 3: file_ops (read)...');
    try {
      const result = await sendRequest('tools/call', {
        name: 'file_ops',
        arguments: {
          operation: 'read',
          path: 'package.json',
        },
      });
      console.log('✓ file_ops read successful');
      console.log('   Response length:', JSON.stringify(result).length);
      testsPassed++;
    } catch (error) {
      console.error('✗ file_ops read failed:', error.message);
      testsFailed++;
    }

    // Test 4: search_code - Search codebase
    console.log('\nTest 4: search_code...');
    try {
      const result = await sendRequest('tools/call', {
        name: 'search_code',
        arguments: {
          operation: 'files',
          query: 'function',
          directory: '.',
          maxResults: 5,
        },
      });
      console.log('✓ search_code successful');
      console.log('   Response:', result.content[0].text.substring(0, 100) + '...');
      testsPassed++;
    } catch (error) {
      console.error('✗ search_code failed:', error.message);
      testsFailed++;
    }

    // Test 5: backup_restore - Backup operation
    console.log('\nTest 5: backup_restore (create)...');
    try {
      const result = await sendRequest('tools/call', {
        name: 'backup_restore',
        arguments: {
          operation: 'create',
          path: 'package.json',
        },
      });
      console.log('✓ backup_restore create successful');
      console.log('   Response:', result.content[0].text.substring(0, 100) + '...');
      testsPassed++;
    } catch (error) {
      console.error('✗ backup_restore create failed:', error.message);
      testsFailed++;
    }

    // Test 6: project_context - Get project context
    console.log('\nTest 6: project_context...');
    try {
      const result = await sendRequest('tools/call', {
        name: 'project_context',
        arguments: {
          operation: 'get_current',
        },
      });
      console.log('✓ project_context successful');
      console.log('   Response:', result.content[0].text.substring(0, 100) + '...');
      testsPassed++;
    } catch (error) {
      console.error('✗ project_context failed:', error.message);
      testsFailed++;
    }

    // Test 7: docs_manage - Documentation lookup
    console.log('\nTest 7: docs_manage (list_corpora)...');
    try {
      const result = await sendRequest('tools/call', {
        name: 'docs_manage',
        arguments: {
          operation: 'list_corpora',
        },
      });
      console.log('✓ docs_manage list_corpora successful');
      console.log('   Response:', result.content[0].text.substring(0, 100) + '...');
      testsPassed++;
    } catch (error) {
      console.error('✗ docs_manage list_corpora failed:', error.message);
      testsFailed++;
    }

    // Test 8: workflow_manage - Workflow operation
    console.log('\nTest 8: workflow_manage...');
    try {
      const result = await sendRequest('tools/call', {
        name: 'workflow_manage',
        arguments: {
          operation: 'context',
        },
      });
      console.log('✓ workflow_manage successful');
      console.log('   Response:', result.content[0].text.substring(0, 100) + '...');
      testsPassed++;
    } catch (error) {
      console.error('✗ workflow_manage failed:', error.message);
      testsFailed++;
    }

    // Test 9: sweobeyme_execute - Governance router
    console.log('\nTest 9: sweobeyme_execute...');
    try {
      const result = await sendRequest('tools/call', {
        name: 'sweobeyme_execute',
        arguments: {
          domain: 'governance',
          action: 'manage',
          payload: {
            operation: 'get_constitution',
          },
        },
      });
      console.log('✓ sweobeyme_execute successful');
      console.log('   Response length:', result.content[0].text.length);
      testsPassed++;
    } catch (error) {
      console.error('✗ sweobeyme_execute failed:', error.message);
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
