/**
 * Test Script for SWE Automation MCP Server
 * 
 * This script tests the get_project_context tool by simulating
 * MCP tool calls and verifying the responses.
 */

import { spawn } from 'child_process';
import { createInterface } from 'readline';

// Start the MCP server
const serverProcess = spawn('node', ['dist/index.js'], {
  stdio: ['pipe', 'pipe', 'inherit'],
  cwd: process.cwd()
});

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

let requestId = 0;

// Helper function to send MCP requests
function sendRequest(method, params = {}) {
  const request = {
    jsonrpc: '2.0',
    id: ++requestId,
    method,
    params
  };
  
  console.log('📤 Sending:', JSON.stringify(request, null, 2));
  serverProcess.stdin.write(JSON.stringify(request) + '\n');
}

// Helper function to test get_project_context
function testGetProjectContext() {
  console.log('\n🧪 Testing get_project_context tool...\n');
  
  // Test 1: Basic project context
  sendRequest('tools/call', {
    name: 'get_project_context',
    arguments: {
      projectPath: process.cwd(),
      includeTests: false,
      maxDepth: 5,
      useCache: true
    }
  });
}

// Helper function to list available tools
function listTools() {
  console.log('\n🔍 Listing available tools...\n');
  sendRequest('tools/list');
}

// Handle server responses
serverProcess.stdout.on('data', (data) => {
  const lines = data.toString().trim().split('\n');
  
  for (const line of lines) {
    if (line.trim()) {
      try {
        const response = JSON.parse(line);
        console.log('📥 Received:', JSON.stringify(response, null, 2));
        
        // Handle different response types
        if (response.method === 'tools/list') {
          console.log('\n✅ Tools list received');
          console.log('Available tools:', response.result.tools.map(t => t.name).join(', '));
        } else if (response.result && response.result.metadata) {
          console.log('\n✅ Project context received successfully!');
          console.log(`📊 Project: ${response.result.metadata.type}`);
          console.log(`🌐 Language: ${response.result.metadata.language}`);
          console.log(`📁 Total Files: ${response.result.metadata.totalFiles}`);
          console.log(`📝 Total Lines: ${response.result.metadata.totalLines}`);
          console.log(`🏗️  Namespaces: ${response.result.namespaces.size}`);
          console.log(`📦 Classes: ${response.result.classes.size}`);
          console.log(`⚙️  Methods: ${response.result.methods.size}`);
          console.log(`🔗 Dependencies: ${response.result.dependencies.bySource.size}`);
          
          if (response.result.patterns.length > 0) {
            console.log(`🎨 Patterns: ${response.result.patterns.map(p => p.name).join(', ')}`);
          }
          
          if (response.result.conventions.length > 0) {
            console.log(`📋 Conventions: ${response.result.conventions.map(c => c.name).join(', ')}`);
          }
        } else if (response.error) {
          console.log('\n❌ Error:', response.error.message);
        }
      } catch (error) {
        console.log('📥 Raw response:', line);
      }
    }
  }
});

serverProcess.on('error', (error) => {
  console.error('❌ Server error:', error);
});

serverProcess.on('close', (code) => {
  console.log(`\n🔚 Server exited with code: ${code}`);
  process.exit(code);
});

// Interactive testing interface
console.log('🚀 SWE Automation MCP Server Test Interface');
console.log('==========================================');
console.log('Available commands:');
console.log('  tools     - List all available tools');
console.log('  context   - Test get_project_context tool');
console.log('  help      - Show this help');
console.log('  exit      - Exit testing');
console.log('==========================================\n');

rl.on('line', (input) => {
  const command = input.trim().toLowerCase();
  
  switch (command) {
    case 'tools':
      listTools();
      break;
    case 'context':
      testGetProjectContext();
      break;
    case 'help':
      console.log('\n🚀 Available commands:');
      console.log('  tools     - List all available tools');
      console.log('  context   - Test get_project_context tool');
      console.log('  help      - Show this help');
      console.log('  exit      - Exit testing\n');
      break;
    case 'exit':
      console.log('\n👋 Shutting down test server...');
      serverProcess.kill();
      break;
    default:
      console.log(`\n❓ Unknown command: ${input}`);
      console.log('Type "help" for available commands\n');
  }
});

// Initialize with tools list
setTimeout(() => {
  listTools();
}, 1000);
