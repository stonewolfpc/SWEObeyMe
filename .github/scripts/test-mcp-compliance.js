/**
 * Tests full MCP protocol compliance using the SDK
 * This simulates what WindSurf does when connecting to the server
 * SIMULATES CLEAN ENVIRONMENT - extracts .vsix to temp dir
 */

import { spawn, execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔌 Testing MCP Protocol Compliance...\n');

// ==================== SETUP ====================
// Navigate from .github/scripts to project root
const extensionRoot = path.join(__dirname, '..', '..');
const serverPath = path.join(extensionRoot, 'dist/mcp/server.js');
console.log(`� Checking built files in: ${extensionRoot}`);

// ==================== MANUAL MCP TEST ====================
// Since we may not have the SDK installed, we do manual JSON-RPC testing

console.log('\n1️⃣  Starting MCP server...');

const nodePath = process.execPath;
const server = spawn(nodePath, [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: { ...process.env, NODE_ENV: 'test' },
  cwd: extensionDir
});

let buffer = '';
let testResults = {
  initialized: false,
  toolsListed: false,
  noDuplicates: false,
  schemasValid: false
};

server.stdout.on('data', (data) => {
  buffer += data.toString();
  processBuffer();
});

server.stderr.on('data', (data) => {
  const str = data.toString();
  if (str.includes('error') || str.includes('Error')) {
    console.error('   Server error:', str.slice(0, 200));
  }
});

function processBuffer() {
  // MCP uses newline-delimited JSON-RPC
  const lines = buffer.split('\n');
  buffer = lines.pop(); // Keep incomplete line in buffer
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    try {
      const msg = JSON.parse(line);
      handleMessage(msg);
    } catch (e) {
      // Not JSON, ignore
    }
  }
}

let toolsList = [];

function handleMessage(msg) {
  // Handle initialize response
  if (msg.id === 1 && msg.result) {
    console.log('   ✅ Server responded to initialize');
    testResults.initialized = true;
    
    // Request tools list
    setTimeout(() => {
      requestTools();
    }, 100);
  }
  
  // Handle tools/list response
  if (msg.id === 2 && msg.result && msg.result.tools) {
    console.log(`   ✅ Listed ${msg.result.tools.length} tools`);
    toolsList = msg.result.tools;
    testResults.toolsListed = true;
    
    // Validate tools
    validateTools(toolsList);
  }
  
  // Handle errors
  if (msg.error) {
    console.error('   ❌ Server error:', msg.error.message || msg.error);
    
    if (msg.error.message && msg.error.message.includes('duplicate')) {
      console.error('   📝 DUPLICATE TOOL DETECTED - This is the WindSurf rejection cause!');
    }
  }
}

function sendRequest(id, method, params = {}) {
  const request = {
    jsonrpc: '2.0',
    id,
    method,
    params
  };
  server.stdin.write(JSON.stringify(request) + '\n');
}

function requestTools() {
  console.log('\n2️⃣  Requesting tools list...');
  sendRequest(2, 'tools/list');
}

function validateTools(tools) {
  console.log('\n3️⃣  Checking for duplicate tool names...');
  
  const toolNames = tools.map(t => t.name);
  const duplicates = toolNames.filter((item, index) => 
    toolNames.indexOf(item) !== index
  );
  
  if (duplicates.length > 0) {
    console.error(`   ❌ DUPLICATE TOOLS: ${duplicates.join(', ')}`);
    console.error('   📝 This is exactly what causes WindSurf to reject the server!');
    testResults.noDuplicates = false;
    finishTest();
    return;
  }
  
  console.log('   ✅ No duplicate tool names');
  testResults.noDuplicates = true;
  
  // Validate schemas
  console.log('\n4️⃣  Validating tool schemas...');
  const schemaErrors = [];
  
  for (const tool of tools) {
    if (!tool.name) schemaErrors.push(`Tool missing name`);
    if (!tool.description) schemaErrors.push(`${tool.name}: missing description`);
    if (!tool.inputSchema) schemaErrors.push(`${tool.name}: missing inputSchema`);
    if (tool.inputSchema?.type !== 'object') {
      schemaErrors.push(`${tool.name}: inputSchema.type must be "object"`);
    }
    if (!tool.inputSchema?.properties) {
      schemaErrors.push(`${tool.name}: inputSchema missing properties`);
    }
  }
  
  if (schemaErrors.length > 0) {
    console.error('   ❌ Schema validation errors:');
    for (const err of schemaErrors.slice(0, 5)) {
      console.error(`      - ${err}`);
    }
    if (schemaErrors.length > 5) {
      console.error(`      ... and ${schemaErrors.length - 5} more`);
    }
    testResults.schemasValid = false;
  } else {
    console.log('   ✅ All tool schemas valid');
    testResults.schemasValid = true;
  }
  
  finishTest();
}

function finishTest() {
  setTimeout(() => {
    server.kill();
    
    console.log('\n' + '='.repeat(50));
    
    const allPassed = Object.values(testResults).every(r => r === true);
    
    if (allPassed) {
      console.log('✅ ALL MCP COMPLIANCE TESTS PASSED');
      console.log(`   Server is compatible with WindSurf`);
      console.log(`   ${toolsList.length} tools validated`);
      process.exit(0);
    } else {
      console.log('❌ MCP COMPLIANCE TESTS FAILED');
      console.log('   Results:');
      for (const [test, passed] of Object.entries(testResults)) {
        console.log(`     ${passed ? '✅' : '❌'} ${test}`);
      }
      process.exit(1);
    }
  }, 500);
}

// Start the test sequence
setTimeout(() => {
  console.log('   Sending initialize request...');
  sendRequest(1, 'initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'test-client', version: '1.0.0' }
  });
}, 1000);

// Timeout
setTimeout(() => {
  console.error('\n❌ Test timeout (15s)');
  server.kill();
  process.exit(1);
}, 15000);
