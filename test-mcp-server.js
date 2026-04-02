#!/usr/bin/env node

/**
 * MCP Server Test for SWEObeyMe
 * Tests the MCP server by sending JSON-RPC messages
 */

import { spawn } from 'child_process';
import { createInterface } from 'readline';

const serverProcess = spawn('node', ['index.js'], {
  cwd: process.cwd(),
  stdio: ['pipe', 'pipe', 'inherit']
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
      params: params
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
      const lines = data.toString().split('\n').filter(line => line.trim());
      lines.forEach(line => responseHandler(line));
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
  console.log('?? TESTING SWEObeyMe MCP SERVER\n');
  
  try {
    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 1: Initialize
    console.log('Test 1: Initialize...');
    try {
      const result = await sendRequest('initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
          name: 'test-client',
          version: '1.0.9'
        }
      });
      console.log('? Initialize successful');
      console.log('   Server info:', JSON.stringify(result.serverInfo));
      testsPassed++;
    } catch (error) {
      console.error('? Initialize failed:', error.message);
      testsFailed++;
    }
    
    // Test 2: List tools
    console.log('\nTest 2: List tools...');
    try {
      const result = await sendRequest('tools/list');
      console.log('? List tools successful');
      console.log('   Tools found:', result.tools.length);
      result.tools.slice(0, 5).forEach(tool => {
        console.log('   -', tool.name);
      });
      if (result.tools.length > 5) {
        console.log('   ... and', result.tools.length - 5, 'more');
      }
      testsPassed++;
    } catch (error) {
      console.error('? List tools failed:', error.message);
      testsFailed++;
    }
    
    // Test 3: Obey me status
    console.log('\nTest 3: Obey me status...');
    try {
      const result = await sendRequest('tools/call', {
        name: 'obey_me_status',
        arguments: {}
      });
      console.log('? Obey me status successful');
      console.log('   Response:', result.content[0].text);
      testsPassed++;
    } catch (error) {
      console.error('? Obey me status failed:', error.message);
      testsFailed++;
    }
    
    // Test 4: Surgical plan (should approve)
    console.log('\nTest 4: Surgical plan (valid)...');
    try {
      const result = await sendRequest('tools/call', {
        name: 'obey_surgical_plan',
        arguments: {
          target_file: 'test.js',
          current_line_count: 100,
          estimated_addition: 50,
          action: 'repair'
        }
      });
      console.log('? Surgical plan successful');
      console.log('   Response:', result.content[0].text);
      testsPassed++;
    } catch (error) {
      console.error('? Surgical plan failed:', error.message);
      testsFailed++;
    }
    
    // Test 5: Surgical plan (should reject)
    console.log('\nTest 5: Surgical plan (invalid - exceeds limit)...');
    try {
      const result = await sendRequest('tools/call', {
        name: 'obey_surgical_plan',
        arguments: {
          target_file: 'test.js',
          current_line_count: 650,
          estimated_addition: 100,
          action: 'repair'
        }
      });
      console.error('? Surgical plan should have been rejected but was approved');
      testsFailed++;
    } catch (error) {
      console.log('? Surgical plan correctly rejected');
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
          file_path: 'test.js'
        }
      });
      console.log('? Enforce surgical rules successful');
      console.log('   Response:', result.content[0].text);
      testsPassed++;
    } catch (error) {
      console.error('? Enforce surgical rules failed:', error.message);
      testsFailed++;
    }
    
    // Test 7: Enforce surgical rules (invalid code - console.log)
    console.log('\nTest 7: Enforce surgical rules (invalid - console.log)...');
    try {
      const result = await sendRequest('tools/call', {
        name: 'enforce_surgical_rules',
        arguments: {
          proposed_code: 'console.log("test");',
          file_path: 'test.js'
        }
      });
      console.error('? Enforce surgical rules should have rejected console.log');
      testsFailed++;
    } catch (error) {
      console.log('? Enforce surgical rules correctly rejected console.log');
      console.log('   Error:', error.message);
      testsPassed++;
    }
    
    // Test 8: Auto repair submission (JSON)
    console.log('\nTest 8: Auto repair submission (JSON)...');
    try {
      const result = await sendRequest('tools/call', {
        name: 'auto_repair_submission',
        arguments: {
          raw_content: '{"name": "test",}',
          type: 'json'
        }
      });
      console.log('? Auto repair submission successful');
      console.log('   Repaired:', JSON.stringify(result.content[0].text));
      testsPassed++;
    } catch (error) {
      console.error('? Auto repair submission failed:', error.message);
      testsFailed++;
    }
    
    // Test 9: Get session context
    console.log('\nTest 9: Get session context...');
    try {
      const result = await sendRequest('tools/call', {
        name: 'get_session_context',
        arguments: {}
      });
      console.log('? Get session context successful');
      testsPassed++;
    } catch (error) {
      console.error('? Get session context failed:', error.message);
      testsFailed++;
    }
    
    // Test 10: Query the oracle
    console.log('\nTest 10: Query the oracle...');
    try {
      const result = await sendRequest('tools/call', {
        name: 'query_the_oracle',
        arguments: {}
      });
      console.log('? Query the oracle successful');
      console.log('   Oracle says:', result.content[0].text);
      testsPassed++;
    } catch (error) {
      console.error('? Query the oracle failed:', error.message);
      testsFailed++;
    }

    // Test 11: Check file exists (project integrity)
    console.log('\nTest 11: Check file exists (project integrity)...');
    try {
      const result = await sendRequest('tools/call', {
        name: 'check_file_exists',
        arguments: {
          file_path: 'package.json'
        }
      });
      console.log('? Check file exists successful');
      console.log('   File exists:', result.exists);
      testsPassed++;
    } catch (error) {
      console.error('? Check file exists failed:', error.message);
      testsFailed++;
    }

    // Test 12: Check file duplicates (project integrity)
    console.log('\nTest 12: Check file duplicates (project integrity)...');
    try {
      const result = await sendRequest('tools/call', {
        name: 'check_file_duplicates',
        arguments: {
          file_path: 'unique-test-file.js',
          content: 'console.log("unique content");'
        }
      });
      console.log('? Check file duplicates successful');
      console.log('   Has critical issues:', result.hasCriticalIssues);
      testsPassed++;
    } catch (error) {
      console.error('? Check file duplicates failed:', error.message);
      testsFailed++;
    }

    // Test 13: Validate file references (project integrity)
    console.log('\nTest 13: Validate file references (project integrity)...');
    try {
      const result = await sendRequest('tools/call', {
        name: 'validate_file_references',
        arguments: {
          file_path: 'test.js',
          content: 'import fs from "fs";\nconst x = 1;',
          language: 'javascript'
        }
      });
      console.log('? Validate file references successful');
      console.log('   Valid:', result.valid);
      testsPassed++;
    } catch (error) {
      console.error('? Validate file references failed:', error.message);
      testsFailed++;
    }

    // Test 14: Check recent operations (project integrity)
    console.log('\nTest 14: Check recent operations (project integrity)...');
    try {
      const result = await sendRequest('tools/call', {
        name: 'check_recent_operations',
        arguments: {
          file_path: 'test.js',
          time_window: 30000
        }
      });
      console.log('? Check recent operations successful');
      console.log('   Has recent operation:', result.hasRecentOperation);
      testsPassed++;
    } catch (error) {
      console.error('? Check recent operations failed:', error.message);
      testsFailed++;
    }

    // Test 15: Get registry stats (project integrity)
    console.log('\nTest 15: Get registry stats (project integrity)...');
    try {
      const result = await sendRequest('tools/call', {
        name: 'get_registry_stats',
        arguments: {}
      });
      console.log('? Get registry stats successful');
      console.log('   Response includes statistics');
      testsPassed++;
    } catch (error) {
      console.error('? Get registry stats failed:', error.message);
      testsFailed++;
    }

    // Test 16: Generate audit report (project integrity)
    console.log('\nTest 16: Generate audit report (project integrity)...');
    try {
      const result = await sendRequest('tools/call', {
        name: 'generate_audit_report',
        arguments: {}
      });
      console.log('? Generate audit report successful');
      console.log('   Report generated');
      testsPassed++;
    } catch (error) {
      console.error('? Generate audit report failed:', error.message);
      testsFailed++;
    }

    // Test 17: Validate C# code (C# handlers)
    console.log('\nTest 17: Validate C# code (C# handlers)...');
    try {
      // Create test file first
      await sendRequest('tools/call', {
        name: 'write_file',
        arguments: {
          path: 'test.cs',
          content: 'namespace Test { class Program { void Main() { } } }'
        }
      });

      const result = await sendRequest('tools/call', {
        name: 'validate_csharp_code',
        arguments: {
          path: 'test.cs'
        }
      });
      console.log('? Validate C# code successful');
      console.log('   Valid:', result.content[0].text.includes('VALID: YES'));
      testsPassed++;
    } catch (error) {
      console.error('? Validate C# code failed:', error.message);
      testsFailed++;
    }

    // Test 18: Validate C# brackets (C# handlers)
    console.log('\nTest 18: Validate C# brackets (C# handlers)...');
    try {
      const result = await sendRequest('tools/call', {
        name: 'validate_csharp_brackets',
        arguments: {
          path: 'test.cs'
        }
      });
      console.log('? Validate C# brackets successful');
      console.log('   Brackets valid:', result.content[0].text.includes('YES'));
      testsPassed++;
    } catch (error) {
      console.error('? Validate C# brackets failed:', error.message);
      testsFailed++;
    }

    // Test 19: Analyze C# complexity (C# handlers)
    console.log('\nTest 19: Analyze C# complexity (C# handlers)...');
    try {
      const result = await sendRequest('tools/call', {
        name: 'analyze_csharp_complexity',
        arguments: {
          path: 'test.cs'
        }
      });
      console.log('? Analyze C# complexity successful');
      console.log('   Complexity analysis completed');
      testsPassed++;
    } catch (error) {
      console.error('? Analyze C# complexity failed:', error.message);
      testsFailed++;
    }

    // Test 20: Validate math safety (C# handlers)
    console.log('\nTest 20: Validate math safety (C# handlers)...');
    try {
      const result = await sendRequest('tools/call', {
        name: 'validate_math_safety',
        arguments: {
          path: 'test.cs'
        }
      });
      console.log('? Validate math safety successful');
      console.log('   Math safety validation completed');
      testsPassed++;
    } catch (error) {
      console.error('? Validate math safety failed:', error.message);
      testsFailed++;
    }

    // Test 21: C# health check (C# handlers)
    console.log('\nTest 21: C# health check (C# handlers)...');
    try {
      const result = await sendRequest('tools/call', {
        name: 'csharp_health_check',
        arguments: {
          path: 'test.cs'
        }
      });
      console.log('? C# health check successful');
      console.log('   Health check completed');
      testsPassed++;
    } catch (error) {
      console.error('? C# health check failed:', error.message);
      testsFailed++;
    }

    // Test 22: Search files (project integrity)
    console.log('\nTest 22: Search files (project integrity)...');
    try {
      const result = await sendRequest('tools/call', {
        name: 'search_files',
        arguments: {
          pattern: 'package'
        }
      });
      console.log('? Search files successful');
      console.log('   Search completed');
      testsPassed++;
    } catch (error) {
      console.error('? Search files failed:', error.message);
      testsFailed++;
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('?? TEST RESULTS');
    console.log('='.repeat(50));
    console.log(`? Passed: ${testsPassed}`);
    console.log(`? Failed: ${testsFailed}`);
    console.log(`?? Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
    
    if (testsFailed > 0) {
      console.log('\n??  SOME TESTS FAILED!');
      process.exit(1);
    } else {
      console.log('\n?? ALL TESTS PASSED!');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('?? Critical error:', error);
    process.exit(1);
  } finally {
    // Clean up
    serverProcess.kill();
  }
}

runTests();
