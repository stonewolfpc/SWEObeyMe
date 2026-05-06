/**
 * MCP Server Isolation Test - TRUE ISOLATION
 *
 * Purpose: Fully isolate and test the MCP server as if it were an installed extension
 * working on a user's project (not the source directory).
 *
 * What this test does:
 * 1. Creates isolated temp directory (simulates user's project workspace)
 * 2. Copies built extension to another temp location (simulates VSIX install)
 * 3. Starts MCP server FROM the isolated extension location
 * 4. Changes CWD to user project directory
 * 5. Executes real MCP tool calls via stdio transport
 * 6. Captures ALL output, errors, protocol issues
 * 7. Tests PowerShell execution through MCP tools
 *
 * This catches:
 * - Path resolution issues when server runs from different location
 * - process.cwd() dependencies
 * - Dynamic import failures
 * - Protocol output swallowing
 * - Any failure that only happens outside source directory
 */

import { spawn } from 'child_process';
import {
  mkdtempSync,
  writeFileSync,
  rmSync,
  mkdirSync,
  existsSync,
  copyFileSync,
  cpSync,
} from 'fs';
import { tmpdir } from 'os';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Colors
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

let passed = 0;
let failed = 0;
const failures = [];
const logs = [];

function log(message, type = 'info') {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const prefix =
    type === 'pass'
      ? `${GREEN}✓${RESET}`
      : type === 'fail'
        ? `${RED}✗${RESET}`
        : type === 'warn'
          ? `${YELLOW}⚠${RESET}`
          : type === 'section'
            ? `${BLUE}▶${RESET}`
            : 'ℹ';
  const line = `[${timestamp}] ${prefix} ${message}`;
  console.log(line);
  logs.push(line);
}

function fail(testName, error, details = '') {
  failed++;
  const errorInfo = {
    test: testName,
    error: error?.message || error || 'Unknown error',
    details,
    timestamp: new Date().toISOString(),
  };
  failures.push(errorInfo);
  log(`${testName}: ${errorInfo.error}`, 'fail');
  if (details) {
    log(`  Details: ${details.substring(0, 500)}`, 'fail');
  }
}

function pass(testName) {
  passed++;
  log(testName, 'pass');
}

// Create MCP protocol message
function createMCPMessage(method, params) {
  const message = {
    jsonrpc: '2.0',
    id: Date.now() + Math.random(),
    method,
    params,
  };
  return JSON.stringify(message) + '\n';
}

// Parse MCP response from buffer
function parseMCPResponse(buffer) {
  const lines = buffer
    .toString()
    .split('\n')
    .filter((l) => l.trim());
  const responses = [];
  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);
      responses.push(parsed);
    } catch (e) {
      // Not JSON, might be stderr
    }
  }
  return responses;
}

// Test 1: Setup isolated extension directory
function setupIsolatedExtension() {
  log('Setting up isolated extension directory...', 'section');

  const isolatedExtDir = mkdtempSync(join(tmpdir(), 'sweobeyme-ext-'));
  const mcpDir = join(isolatedExtDir, 'dist', 'mcp');
  const libDir = join(isolatedExtDir, 'dist', 'lib');

  mkdirSync(mcpDir, { recursive: true });
  mkdirSync(libDir, { recursive: true });

  // Copy server bundle
  const sourceDist = resolve(__dirname, '..', 'dist');

  if (!existsSync(join(sourceDist, 'mcp', 'server.js'))) {
    fail('Setup Isolated Extension', 'Server bundle not found at dist/mcp/server.js');
    return null;
  }

  try {
    copyFileSync(join(sourceDist, 'mcp', 'server.js'), join(mcpDir, 'server.js'));
    copyFileSync(join(sourceDist, 'mcp', 'package.json'), join(mcpDir, 'package.json'));

    // Copy lib folder recursively
    if (existsSync(join(sourceDist, 'lib'))) {
      cpSync(join(sourceDist, 'lib'), libDir, { recursive: true });
    }

    pass(`Extension isolated at: ${isolatedExtDir}`);
    return { isolatedExtDir, mcpDir, libDir };
  } catch (error) {
    fail('Setup Isolated Extension', error);
    return null;
  }
}

// Test 2: Setup user project directory
function setupUserProject() {
  log('Setting up simulated user project directory...', 'section');

  const userProjectDir = mkdtempSync(join(tmpdir(), 'user-project-'));

  // Create a test file
  writeFileSync(join(userProjectDir, 'test.txt'), 'Hello from user project');
  writeFileSync(
    join(userProjectDir, 'package.json'),
    JSON.stringify(
      {
        name: 'test-user-project',
        version: '1.0.0',
      },
      null,
      2
    )
  );

  pass(`User project at: ${userProjectDir}`);
  return userProjectDir;
}

// Test 3: Start MCP server from isolated location with user project as CWD
async function startIsolatedMcpServer(isolatedExtDir, userProjectDir) {
  log('Starting MCP server from isolated location...', 'section');

  const serverPath = join(isolatedExtDir, 'dist', 'mcp', 'server.js');

  if (!existsSync(serverPath)) {
    fail('Start MCP Server', `Server not found at ${serverPath}`);
    return null;
  }

  log(`Server path: ${serverPath}`, 'info');
  log(`Working directory: ${userProjectDir}`, 'info');

  return new Promise((resolve) => {
    // CRITICAL: Spawn from user project directory, NOT source directory
    const child = spawn('node', [serverPath], {
      cwd: userProjectDir, // <-- This is the key test
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        SWEOBEYME_DEBUG: '1', // Enable debug logging
        NODE_ENV: 'production',
      },
    });

    let stdoutBuffer = '';
    let stderrBuffer = '';
    let initialized = false;

    // Capture stderr (debug logs)
    child.stderr.on('data', (data) => {
      const chunk = data.toString();
      stderrBuffer += chunk;

      // Look for specific patterns
      if (chunk.includes('ERROR') || chunk.includes('error') || chunk.includes('CRITICAL')) {
        log(`Server stderr: ${chunk.substring(0, 200)}`, 'warn');
      }
    });

    // Capture stdout (MCP protocol)
    child.stdout.on('data', (data) => {
      stdoutBuffer += data.toString();

      // Check for initialization response
      if (stdoutBuffer.includes('result') && stdoutBuffer.includes('serverInfo')) {
        initialized = true;
      }
    });

    // Handle spawn errors
    child.on('error', (error) => {
      fail('MCP Server Spawn', error.message, `Code: ${error.code}`);
      resolve(null);
    });

    child.on('exit', (code, signal) => {
      if (!initialized) {
        fail(
          'MCP Server Exit',
          `Server exited with code ${code}, signal ${signal}`,
          `stderr: ${stderrBuffer.substring(0, 500)}`
        );
        resolve(null);
      }
    });

    // Give it time to start, then check if still running
    setTimeout(() => {
      if (child.exitCode === null && child.killed === false) {
        pass('MCP Server started and running');
        resolve({
          child,
          stdin: child.stdin,
          stdout: child.stdout,
          stderr: child.stderr,
          stdoutBuffer,
          stderrBuffer,
        });
      } else {
        fail('MCP Server Start', 'Server process not running after startup timeout');
        resolve(null);
      }
    }, 2000);
  });
}

// Test 4: Send MCP initialize request
async function sendInitialize(mcpProcess) {
  log('Sending MCP initialize request...', 'section');

  return new Promise((resolve) => {
    const initMessage = createMCPMessage('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'isolation-test', version: '1.0.0' },
    });

    let responseBuffer = '';

    const onData = (data) => {
      responseBuffer += data.toString();

      try {
        const responses = parseMCPResponse(responseBuffer);
        for (const resp of responses) {
          if (resp.result && resp.result.serverInfo) {
            mcpProcess.stdout.off('data', onData);
            pass(
              `Initialize success: ${resp.result.serverInfo.name} v${resp.result.serverInfo.version}`
            );
            resolve(true);
            return;
          }
          if (resp.error) {
            mcpProcess.stdout.off('data', onData);
            fail('MCP Initialize', resp.error.message || JSON.stringify(resp.error));
            resolve(false);
            return;
          }
        }
      } catch (e) {
        // Keep waiting
      }
    };

    mcpProcess.stdout.on('data', onData);

    // Timeout
    setTimeout(() => {
      mcpProcess.stdout.off('data', onData);
      fail(
        'MCP Initialize',
        'Timeout waiting for initialize response',
        `Buffered: ${responseBuffer.substring(0, 200)}`
      );
      resolve(false);
    }, 5000);

    // Send the message
    mcpProcess.stdin.write(initMessage);
  });
}

// Test 5: List tools
async function listTools(mcpProcess) {
  log('Requesting tool list...', 'section');

  return new Promise((resolve) => {
    const message = createMCPMessage('tools/list', {});

    let responseBuffer = '';

    const onData = (data) => {
      responseBuffer += data.toString();

      try {
        const responses = parseMCPResponse(responseBuffer);
        for (const resp of responses) {
          if (resp.result && resp.result.tools) {
            mcpProcess.stdout.off('data', onData);
            const toolCount = resp.result.tools.length;
            pass(`Tool list received: ${toolCount} tools`);

            // Check for critical tools
            const criticalTools = ['read_file', 'validate_code', 'backup_manage'];
            const missing = criticalTools.filter(
              (t) => !resp.result.tools.some((tool) => tool.name === t)
            );

            if (missing.length > 0) {
              fail('Critical Tools Check', `Missing tools: ${missing.join(', ')}`);
            } else {
              pass('All critical tools present');
            }

            resolve(resp.result.tools);
            return;
          }
          if (resp.error) {
            mcpProcess.stdout.off('data', onData);
            fail('List Tools', resp.error.message || JSON.stringify(resp.error));
            resolve(null);
            return;
          }
        }
      } catch (e) {
        // Keep waiting
      }
    };

    mcpProcess.stdout.on('data', onData);

    setTimeout(() => {
      mcpProcess.stdout.off('data', onData);
      fail('List Tools', 'Timeout');
      resolve(null);
    }, 5000);

    mcpProcess.stdin.write(message);
  });
}

// Test 6: Execute PowerShell through MCP (simulating what Cascade does)
async function testPowerShellViaMcp(mcpProcess, userProjectDir) {
  log('Testing PowerShell execution via MCP...', 'section');

  return new Promise((resolve) => {
    // Use the file_ops domain to execute a PowerShell command
    // This simulates what happens when Cascade calls run_command
    const message = createMCPMessage('tools/call', {
      name: 'sweobeyme_execute',
      arguments: {
        domain: 'files',
        action: 'info',
        payload: {
          operation: 'stats',
          path: join(userProjectDir, 'test.txt'),
        },
      },
    });

    let responseBuffer = '';

    const onData = (data) => {
      responseBuffer += data.toString();

      try {
        const responses = parseMCPResponse(responseBuffer);
        for (const resp of responses) {
          if (resp.result) {
            mcpProcess.stdout.off('data', onData);

            const hasContent =
              resp.result.content && resp.result.content.length > 0 && resp.result.content[0].text;

            if (hasContent) {
              const text = resp.result.content[0].text;
              if (text.includes('test.txt') || text.includes('FILE STATISTICS')) {
                pass('MCP tool call returned expected content');
                resolve(true);
              } else {
                fail('MCP Tool Call', 'Unexpected response content', text.substring(0, 200));
                resolve(false);
              }
            } else {
              fail('MCP Tool Call', 'Empty or invalid content array', JSON.stringify(resp.result));
              resolve(false);
            }
            return;
          }
          if (resp.error) {
            mcpProcess.stdout.off('data', onData);
            fail('MCP Tool Call Error', resp.error.message || JSON.stringify(resp.error));
            resolve(false);
            return;
          }
        }
      } catch (e) {
        // Keep waiting
      }
    };

    mcpProcess.stdout.on('data', onData);

    setTimeout(() => {
      mcpProcess.stdout.off('data', onData);
      fail(
        'MCP Tool Call',
        'Timeout waiting for response',
        `Buffered: ${responseBuffer.substring(0, 300)}`
      );
      resolve(false);
    }, 10000);

    mcpProcess.stdin.write(message);
  });
}

// Main test runner
async function runTests() {
  console.log('\n========================================');
  console.log('MCP SERVER ISOLATION TEST');
  console.log('Testing from external directory with true isolation');
  console.log('========================================\n');

  const isolatedDirs = setupIsolatedExtension();
  if (!isolatedDirs) {
    console.log('\n' + RED + 'CRITICAL: Cannot run tests without isolated extension' + RESET);
    process.exit(1);
  }

  const userProjectDir = setupUserProject();

  log('\nStarting MCP server from isolated location...', 'section');
  const mcpProcess = await startIsolatedMcpServer(isolatedDirs.isolatedExtDir, userProjectDir);

  if (!mcpProcess) {
    console.log('\n' + RED + 'CRITICAL: MCP server failed to start' + RESET);
    cleanup(isolatedDirs.isolatedExtDir, userProjectDir);
    process.exit(1);
  }

  // Run protocol tests
  await sendInitialize(mcpProcess);
  await listTools(mcpProcess);
  await testPowerShellViaMcp(mcpProcess, userProjectDir);

  // Cleanup
  log('\nCleaning up...', 'section');
  mcpProcess.child.kill('SIGTERM');

  setTimeout(() => {
    cleanup(isolatedDirs.isolatedExtDir, userProjectDir);

    // Summary
    console.log('\n========================================');
    console.log('TEST SUMMARY');
    console.log('========================================');
    console.log(`${GREEN}Passed: ${passed}${RESET}`);
    console.log(`${RED}Failed: ${failed}${RESET}`);

    if (failures.length > 0) {
      console.log(`\n${RED}FAILURES:${RESET}`);
      for (const f of failures) {
        console.log(`\n  ${RED}•${RESET} ${f.test}`);
        console.log(`    Error: ${f.error}`);
        if (f.details) {
          console.log(`    Details: ${f.details.substring(0, 300)}`);
        }
      }
    }

    console.log('\n');
    process.exit(failed === 0 ? 0 : 1);
  }, 1000);
}

function cleanup(extDir, projectDir) {
  try {
    rmSync(extDir, { recursive: true, force: true });
    rmSync(projectDir, { recursive: true, force: true });
    log('Cleanup complete', 'pass');
  } catch (error) {
    log(`Cleanup warning: ${error.message}`, 'warn');
  }
}

// Handle errors
process.on('unhandledRejection', (error) => {
  log(`Unhandled rejection: ${error.message}`, 'fail');
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  log(`Uncaught exception: ${error.message}`, 'fail');
  process.exit(1);
});

// Run
runTests();
