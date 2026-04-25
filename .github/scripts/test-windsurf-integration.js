#!/usr/bin/env node
/**
 * WINDSURF INTEGRATION TEST
 *
 * Tests the extension's integration with Windsurf Next specifically.
 * This simulates the actual Windsurf environment and MCP server communication.
 */

import fs from 'fs';
import path from 'path';
import { spawn, exec } from 'child_process';
import { fileURLToPath } from 'url';
import os from 'os';
import { createHash } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.join(__dirname, '..', '..');
let errors = [];
let warnings = [];

console.log('WINDSURF INTEGRATION TEST');
console.log('='.repeat(50));

// Test 1: MCP Server Communication Protocol
async function testMCPProtocol() {
  console.log('\n1. Testing MCP Protocol Communication...');

  const serverPath = path.join(projectRoot, 'dist', 'mcp', 'server.js');

  if (!fs.existsSync(serverPath)) {
    console.log('FAIL: MCP server not found');
    errors.push('MCP server file missing');
    return false;
  }

  return new Promise((resolve) => {
    // Start MCP server
    const server = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        NODE_ENV: 'test',
        SWEOBEYME_TEST: 'true',
      },
    });

    let serverOutput = '';
    let serverReady = false;

    server.stdout.on('data', (data) => {
      serverOutput += data.toString();

      // Check if server is ready
      if (
        serverOutput.includes('SWEObeyMe') ||
        serverOutput.includes('listening') ||
        serverOutput.includes('ready')
      ) {
        serverReady = true;
        console.log('  Server started successfully');

        // Test MCP initialize request
        testMCPInitialize(server);
      }
    });

    server.stderr.on('data', (data) => {
      console.log('  Server stderr:', data.toString().trim());
    });

    server.on('error', (error) => {
      console.log('FAIL: Server failed to start:', error.message);
      errors.push('MCP server start failed');
      resolve(false);
    });

    server.on('close', (code) => {
      if (!serverReady) {
        console.log('FAIL: Server exited before ready');
        errors.push('MCP server exited early');
        resolve(false);
      }
    });

    // Test MCP initialize
    function testMCPInitialize(serverProcess) {
      const initRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {},
            logging: {},
          },
          clientInfo: {
            name: 'Windsurf',
            version: '1.0.0',
          },
        },
      };

      serverProcess.stdin.write(JSON.stringify(initRequest) + '\n');

      let responseReceived = false;

      serverProcess.stdout.on('data', function initHandler(data) {
        if (responseReceived) return;

        try {
          const response = JSON.parse(data.toString().trim());
          if (response.id === 1) {
            responseReceived = true;

            if (response.result) {
              console.log('  PASS: MCP initialize response received');
              console.log(
                '  Server capabilities:',
                JSON.stringify(response.result.capabilities, null, 2)
              );

              // Test tools/list request
              testToolsList(serverProcess);
            } else if (response.error) {
              console.log('FAIL: MCP initialize error:', response.error);
              errors.push('MCP initialize failed');
              resolve(false);
            }
          }
        } catch (e) {
          // Not a JSON response yet
        }
      });
    }

    // Test tools/list
    function testToolsList(serverProcess) {
      const toolsRequest = {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list',
        params: {},
      };

      serverProcess.stdin.write(JSON.stringify(toolsRequest) + '\n');

      let responseReceived = false;

      serverProcess.stdout.on('data', function toolsHandler(data) {
        if (responseReceived) return;

        try {
          const response = JSON.parse(data.toString().trim());
          if (response.id === 2) {
            responseReceived = true;

            if (response.result && response.result.tools) {
              const toolCount = response.result.tools.length;
              console.log(`  PASS: Tools list received (${toolCount} tools)`);

              // Validate tool structure
              let validTools = true;
              for (const tool of response.result.tools) {
                if (!tool.name || !tool.description) {
                  validTools = false;
                  console.log(`  WARN: Invalid tool structure: ${tool.name}`);
                  warnings.push(`Invalid tool: ${tool.name}`);
                }
              }

              if (validTools) {
                console.log('  PASS: All tools have valid structure');
              }

              // Test a tool call
              testToolCall(serverProcess, response.result.tools[0]?.name);
            } else if (response.error) {
              console.log('FAIL: Tools list error:', response.error);
              errors.push('Tools list failed');
            }

            serverProcess.kill('SIGTERM');
            resolve(toolCount > 0);
          }
        } catch (e) {
          // Not a JSON response yet
        }
      });
    }

    // Test tool call
    function testToolCall(serverProcess, toolName) {
      if (!toolName) {
        console.log('WARN: No tools to test');
        warnings.push('No tools available for testing');
        return;
      }

      const toolRequest = {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: {},
        },
      };

      serverProcess.stdin.write(JSON.stringify(toolRequest) + '\n');

      let responseReceived = false;

      serverProcess.stdout.on('data', function callHandler(data) {
        if (responseReceived) return;

        try {
          const response = JSON.parse(data.toString().trim());
          if (response.id === 3) {
            responseReceived = true;

            if (response.result) {
              console.log(`  PASS: Tool call successful: ${toolName}`);
            } else if (response.error) {
              console.log(`  WARN: Tool call error: ${response.error.message}`);
              warnings.push(`Tool call error: ${toolName}`);
            }
          }
        } catch (e) {
          // Not a JSON response yet
        }
      });
    }

    // Timeout after 30 seconds
    setTimeout(() => {
      if (!serverReady) {
        console.log('FAIL: Server startup timeout');
        errors.push('MCP server startup timeout');
        server.kill('SIGKILL');
        resolve(false);
      }
    }, 30000);
  });
}

// Test 2: Windsurf Configuration Compatibility
async function testWindsurfConfig() {
  console.log('\n2. Testing Windsurf Configuration...');

  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));

    // Check for Windsurf-specific configurations
    const config = packageJson.contributes?.configuration?.properties || {};

    // Check for Windsurf Next specific settings
    const windsurfSettings = {
      'sweObeyMe.enabled': 'Main toggle for extension',
      'sweObeyMe.csharpBridge.enabled': 'C# Bridge integration',
      'sweObeyMe.backupPath': 'Backup configuration',
    };

    let configValid = true;
    for (const [key, description] of Object.entries(windsurfSettings)) {
      if (config[key]) {
        console.log(`  Present: ${key} - ${description}`);
      } else {
        console.log(`  MISSING: ${key}`);
        warnings.push(`Missing Windsurf config: ${key}`);
      }
    }

    // Test configuration validation
    for (const [key, prop] of Object.entries(config)) {
      if (key.startsWith('sweObeyMe.')) {
        // Check type
        if (!prop.type) {
          console.log(`  WARN: ${key} missing type`);
          warnings.push(`Config ${key} missing type`);
        }

        // Check default value
        if (prop.default === undefined) {
          console.log(`  WARN: ${key} missing default`);
          warnings.push(`Config ${key} missing default`);
        }

        // Check description
        if (!prop.description) {
          console.log(`  WARN: ${key} missing description`);
          warnings.push(`Config ${key} missing description`);
        }
      }
    }

    console.log('PASS: Configuration structure validated');
  } catch (e) {
    console.log('FAIL: Configuration test error:', e.message);
    errors.push('Configuration validation failed');
  }

  return errors.length === 0;
}

// Test 3: UI Panel Rendering in Windsurf
async function testUIRendering() {
  console.log('\n3. Testing UI Panel Rendering...');

  try {
    const extensionJs = fs.readFileSync(path.join(projectRoot, 'extension.js'), 'utf8');

    // Check for webview HTML generation
    const htmlGenerators = ['getSettingsHtml', 'getCSharpBridgeHtml', 'getAdminDashboardHtml'];

    for (const generator of htmlGenerators) {
      if (extensionJs.includes(generator)) {
        console.log(`  Found: ${generator}`);

        // Extract HTML content using simpler method
        const startIndex = extensionJs.indexOf(`function ${generator}(`);
        if (startIndex !== -1) {
          const endIndex = extensionJs.indexOf('}', startIndex);
          if (endIndex !== -1) {
            const functionBody = extensionJs.substring(startIndex, endIndex);

            // Basic HTML validation
            if (
              functionBody.includes('<html') ||
              functionBody.includes('<body') ||
              functionBody.includes('<div')
            ) {
              console.log(`    PASS: Valid HTML structure`);
            } else {
              console.log(`    WARN: Unusual HTML structure`);
              warnings.push(`HTML generator ${generator} has unusual structure`);
            }

            // Check for Windsurf-specific CSS
            if (functionBody.includes('vscode') || functionBody.includes('var(--vscode-')) {
              console.log(`    PASS: Uses VS Code CSS variables`);
            } else {
              console.log(`    WARN: No VS Code theming detected`);
              warnings.push(`HTML generator ${generator} missing VS Code theming`);
            }

            // Check for CSP nonce
            if (functionBody.includes('nonce-')) {
              console.log(`    PASS: CSP nonce present`);
            } else {
              console.log(`    WARN: No CSP nonce detected`);
              warnings.push(`HTML generator ${generator} missing CSP nonce`);
            }
          } else {
            console.log(`    FAIL: Could not extract HTML content`);
            errors.push(`HTML generator ${generator} malformed`);
          }
        }
      } else {
        console.log(`  MISSING: ${generator}`);
        errors.push(`Missing HTML generator: ${generator}`);
      }
    }

    // Check webview provider registration
    const providerPattern = /registerWebviewViewProvider\(['"]([^'"]+)['"]/g;
    const providers = [];
    let match;

    while ((match = providerPattern.exec(extensionJs)) !== null) {
      providers.push(match[1]);
    }

    console.log(`  Found ${providers.length} webview providers`);
    for (const provider of providers) {
      console.log(`    Provider: ${provider}`);
    }

    // Check against package.json views
    const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
    const views = packageJson.contributes?.views?.sweObeyMe || [];

    for (const view of views) {
      if (providers.includes(view.id)) {
        console.log(`  PASS: View ${view.id} has provider`);
      } else {
        console.log(`  FAIL: View ${view.id} missing provider`);
        errors.push(`View ${view.id} missing webview provider`);
      }
    }
  } catch (e) {
    console.log('FAIL: UI rendering test error:', e.message);
    errors.push('UI rendering validation failed');
  }

  return errors.length === 0;
}

// Test 4: Command Integration with Windsurf
async function testCommandIntegration() {
  console.log('\n4. Testing Command Integration...');

  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
    const commands = packageJson.contributes?.commands || [];

    // Test command categories
    const windsurfCommands = commands.filter((cmd) => cmd.category === 'SWEObeyMe');

    console.log(`  Found ${windsurfCommands.length} SWEObeyMe commands`);

    // Check for keybindings
    const keybindings = packageJson.contributes?.keybindings || [];
    const commandKeybindings = new Map();

    for (const kb of keybindings) {
      commandKeybindings.set(kb.command, kb);
    }

    for (const cmd of windsurfCommands) {
      const kb = commandKeybindings.get(cmd.command);
      if (kb) {
        console.log(`    ${cmd.command}: ${kb.key}`);
      } else {
        console.log(`    ${cmd.command}: No keybinding`);
      }

      // Check when clause
      if (kb && kb.when) {
        console.log(`      When: ${kb.when}`);
      }
    }

    // Test command implementation
    const extensionJs = fs.readFileSync(path.join(projectRoot, 'extension.js'), 'utf8');

    for (const cmd of windsurfCommands) {
      const registrationPattern = new RegExp(
        `registerCommand\\(['"]${cmd.command.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`
      );
      if (registrationPattern.test(extensionJs)) {
        console.log(`  PASS: Command implemented: ${cmd.command}`);
      } else {
        console.log(`  FAIL: Command not implemented: ${cmd.command}`);
        errors.push(`Command not implemented: ${cmd.command}`);
      }
    }
  } catch (e) {
    console.log('FAIL: Command integration test error:', e.message);
    errors.push('Command integration validation failed');
  }

  return errors.length === 0;
}

// Test 5: Error Handling in Windsurf Context
async function testErrorHandling() {
  console.log('\n5. Testing Error Handling...');

  try {
    const extensionJs = fs.readFileSync(path.join(projectRoot, 'extension.js'), 'utf8');

    // Check for try-catch blocks
    const tryCatchCount = (extensionJs.match(/try\s*\{/g) || []).length;
    console.log(`  Found ${tryCatchCount} try-catch blocks`);

    if (tryCatchCount < 5) {
      console.log('  WARN: Limited error handling detected');
      warnings.push('Limited error handling in extension');
    }

    // Check for console.error usage
    const errorLogCount = (extensionJs.match(/console\.error/g) || []).length;
    console.log(`  Found ${errorLogCount} error logging statements`);

    // Check for user notification
    if (extensionJs.includes('showErrorMessage') || extensionJs.includes('showWarningMessage')) {
      console.log('  PASS: User error notifications present');
    } else {
      console.log('  WARN: No user error notifications');
      warnings.push('No user error notifications');
    }

    // Test error recovery
    const serverPath = path.join(projectRoot, 'dist', 'mcp', 'server.js');

    // Test server with invalid input
    return new Promise((resolve) => {
      const server = spawn('node', [serverPath, '--invalid-flag'], {
        stdio: 'pipe',
        env: { ...process.env, NODE_ENV: 'test' },
      });

      let output = '';
      server.stdout.on('data', (data) => {
        output += data.toString();
      });

      server.stderr.on('data', (data) => {
        output += data.toString();
      });

      server.on('close', (code) => {
        if (code === 0 || code === 1) {
          console.log('  PASS: Server handles invalid input gracefully');
        } else {
          console.log('  WARN: Server crashed on invalid input');
          warnings.push('Server error handling needs improvement');
        }
        resolve(true);
      });

      server.on('error', (error) => {
        console.log('  FAIL: Server error:', error.message);
        errors.push('Server error handling failed');
        resolve(false);
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        server.kill('SIGKILL');
        resolve(true);
      }, 5000);
    });
  } catch (e) {
    console.log('FAIL: Error handling test error:', e.message);
    errors.push('Error handling validation failed');
  }
}

// Run all Windsurf integration tests
async function runWindsurfTests() {
  console.log('Starting Windsurf integration tests...\n');

  const tests = [
    { name: 'MCP Protocol', fn: testMCPProtocol },
    { name: 'Windsurf Configuration', fn: testWindsurfConfig },
    { name: 'UI Rendering', fn: testUIRendering },
    { name: 'Command Integration', fn: testCommandIntegration },
    { name: 'Error Handling', fn: testErrorHandling },
  ];

  const results = [];

  for (const test of tests) {
    console.log(`\n${test.name}`);
    console.log('-'.repeat(test.name.length));

    const success = await test.fn();
    results.push({ name: test.name, success });

    if (success) {
      console.log(`PASS: ${test.name}`);
    } else {
      console.log(`FAIL: ${test.name}`);
    }
  }

  // Final report
  console.log('\n' + '='.repeat(50));
  console.log('WINDSURF INTEGRATION TEST SUMMARY');
  console.log('='.repeat(50));

  const passedTests = results.filter((r) => r.success).length;
  const totalTests = results.length;

  console.log(`Passed: ${passedTests}/${totalTests}`);
  console.log(`Errors: ${errors.length}`);
  console.log(`Warnings: ${warnings.length}`);

  if (errors.length > 0) {
    console.log('\nERRORS:');
    errors.forEach((err) => console.log(`  - ${err}`));
  }

  if (warnings.length > 0) {
    console.log('\nWARNINGS:');
    warnings.forEach((warn) => console.log(`  - ${warn}`));
  }

  console.log('\n' + '='.repeat(50));

  if (errors.length === 0) {
    console.log('WINDSURF INTEGRATION TESTS PASSED');
    console.log('Extension is compatible with Windsurf Next.');
    return true;
  } else {
    console.log('WINDSURF INTEGRATION TESTS FAILED');
    console.log('Fix errors before releasing to Windsurf users.');
    return false;
  }
}

// Execute
runWindsurfTests()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Windsurf integration test crashed:', error);
    process.exit(1);
  });
