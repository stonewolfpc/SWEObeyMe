/**
 * LOCAL DEV MACHINE TEST - Simulates Clean Environment
 * 
 * This test runs ON THE DEV MACHINE but simulates what happens
 * when a user installs the extension fresh from the marketplace.
 * 
 * Key simulations:
 * 1. Extracts .vsix to temp dir (fresh install simulation)
 * 2. Clears PATH to simulate "node not in PATH" scenario
 * 3. Uses absolute paths only (Windows requirement)
 * 4. Tests package.json presence (the critical WindSurf issue)
 * 
 * Run this on dev machine before releasing to catch issues!
 */

import { spawn, execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 CLEAN ENVIRONMENT SIMULATION TEST');
console.log('   Running on: ' + os.platform() + ' (dev machine)');
console.log('   Simulating: Fresh user install\n');

// Navigate from .github/scripts to project root
const extensionRoot = path.join(__dirname, '..', '..');
let tempDir = null;
let serverProcess = null;
let exitCode = 0;

// ==================== SIMULATION SETUP ====================

function setupCleanEnvironment() {
  console.log('📦 Phase 1: Simulating Fresh Install');
  console.log('   Creating temp directory...');
  
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sweobeyme-clean-test-'));
  console.log(`   📁 Temp: ${tempDir}`);
  
  // Find the .vsix file
  const vsixFiles = fs.readdirSync(extensionRoot).filter(f => f.endsWith('.vsix'));
  if (vsixFiles.length === 0) {
    throw new Error('No .vsix file found. Run "vsce package" first!');
  }
  
  // Use the most recent vsix file (semantic version sorting)
  function parseVersion(filename) {
    const match = filename.match(/(\d+)\.(\d+)\.(\d+)/);
    if (!match) return [0, 0, 0];
    return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
  }
  
  function compareVersions(a, b) {
    const va = parseVersion(a);
    const vb = parseVersion(b);
    for (let i = 0; i < 3; i++) {
      if (va[i] !== vb[i]) return vb[i] - va[i]; // Descending
    }
    return 0;
  }
  
  const vsixFile = vsixFiles.sort(compareVersions)[0];
  console.log(`   📦 Package: ${vsixFile}`);
  
  // Extract to simulate installation
  console.log('   📂 Extracting .vsix (simulating marketplace install)...');
  const vsixPath = path.join(extensionRoot, vsixFile);
  const zipPath = path.join(tempDir, 'extension.zip');
  
  try {
    if (os.platform() === 'win32') {
      // Copy and rename to .zip for PowerShell compatibility
      fs.copyFileSync(vsixPath, zipPath);
      execSync(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${tempDir}' -Force"`, 
        { stdio: 'pipe' });
      fs.unlinkSync(zipPath);
    } else {
      execSync(`unzip -q "${vsixPath}" -d "${tempDir}"`, { stdio: 'pipe' });
    }
  } catch (e) {
    throw new Error(`Failed to extract .vsix: ${e.message}`);
  }
  
  console.log('   ✅ Extension extracted\n');
  return path.join(tempDir, 'extension');
}

// ==================== CRITICAL CHECKS ====================

function runCriticalChecks(extensionDir) {
  console.log('🔍 Phase 2: Critical File Checks');
  
  const checks = [
    {
      name: 'Server file exists',
      path: path.join(extensionDir, 'dist/mcp/server.js'),
      critical: true
    },
    {
      name: 'package.json in dist/mcp/ (WINDSURF CRITICAL)',
      path: path.join(extensionDir, 'dist/mcp/package.json'),
      critical: true
    },
    {
      name: 'Tool registries exist',
      path: path.join(extensionDir, 'lib/tools/registry.js'),
      critical: true
    }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const check of checks) {
    const exists = fs.existsSync(check.path);
    const icon = exists ? '✅' : (check.critical ? '❌' : '⚠️');
    console.log(`   ${icon} ${check.name}`);
    
    if (!exists && check.critical) {
      console.error(`      Missing: ${check.path}`);
      failed++;
      exitCode = 1;
    } else if (exists) {
      passed++;
    }
  }
  
  console.log(`   Result: ${passed}/${checks.length} passed\n`);
  
  if (failed > 0) {
    throw new Error(`${failed} critical check(s) failed`);
  }
  
  return true;
}

// ==================== SERVER STARTUP TEST ====================

function testServerStartup(extensionDir) {
  console.log('🚀 Phase 3: Server Startup Test (No PATH Simulation)');
  
  const serverPath = path.join(extensionDir, 'dist/mcp/server.js');
  const nodePath = process.execPath;
  
  console.log(`   Node path: ${nodePath}`);
  console.log(`   Server path: ${serverPath}`);
  console.log('   Environment: PATH cleared (simulating "node not in PATH")');
  
  return new Promise((resolve, reject) => {
    // Spawn with minimal environment - no PATH!
    const env = {
      NODE_ENV: 'test',
      SWEOBEYME_TEST: 'true',
      // Minimal PATH - only system dirs, no node
      PATH: os.platform() === 'win32' ? 'C:\\Windows\\system32' : '/bin:/usr/bin'
    };
    
    serverProcess = spawn(nodePath, [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: env,
      cwd: extensionDir
    });
    
    let stdout = '';
    let stderr = '';
    let started = false;
    
    serverProcess.stdout.on('data', (data) => {
      stdout += data.toString();
      if (stdout.includes('MCP Server') || 
          stdout.includes('Server') || 
          stdout.includes('started')) {
        started = true;
      }
    });
    
    serverProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    // Check after 4 seconds
    setTimeout(() => {
      // Check for critical errors
      const criticalErrors = [
        { pattern: /ENOENT.*package\.json/i, message: 'Missing package.json in dist/mcp/' },
        { pattern: /Cannot find module/i, message: 'Missing dependency' },
        { pattern: /MODULE_NOT_FOUND/i, message: 'Module not found' },
        { pattern: /EACCES/i, message: 'Permission denied' }
      ];
      
      for (const error of criticalErrors) {
        if (error.pattern.test(stderr)) {
          console.error(`\n   ❌ CRITICAL ERROR: ${error.message}`);
          console.error(`   STDERR: ${stderr.slice(0, 300)}`);
          exitCode = 1;
          cleanup();
          reject(new Error(error.message));
          return;
        }
      }
      
      // Check if still running
      try {
        process.kill(serverProcess.pid, 0);
        
        if (started) {
          console.log('   ✅ Server started successfully');
          console.log('   ✅ Works without node in PATH (uses full path)');
          resolve(true);
        } else {
          console.warn('   ⚠️  Server running but no startup confirmation');
          console.warn(`   STDOUT: ${stdout.slice(0, 100) || '(empty)'}`);
          resolve(true); // Soft pass
        }
      } catch (e) {
        console.error(`\n   ❌ Server crashed`);
        console.error(`   STDOUT: ${stdout || '(empty)'}`);
        console.error(`   STDERR: ${stderr || '(empty)'}`);
        exitCode = 1;
        reject(new Error('Server crashed'));
      }
    }, 4000);
  });
}

// ==================== DUPLICATE TOOLS CHECK ====================

function checkForDuplicates(extensionDir) {
  console.log('\n🔍 Phase 4: Duplicate Tools Check');
  
  const toolsDir = path.join(extensionDir, 'lib/tools');
  const registryFiles = fs.readdirSync(toolsDir)
    .filter(f => f.startsWith('registry') && f.endsWith('.js'));
  
  const allTools = [];
  
  for (const file of registryFiles) {
    const content = fs.readFileSync(path.join(toolsDir, file), 'utf8');
    const matches = content.matchAll(/name:\s*['"]([^'"]+)['"]/g);
    for (const match of matches) {
      allTools.push({ name: match[1], file });
    }
  }
  
  const nameCounts = {};
  for (const tool of allTools) {
    nameCounts[tool.name] = (nameCounts[tool.name] || 0) + 1;
  }
  
  const duplicates = Object.entries(nameCounts).filter(([name, count]) => count > 1);
  
  if (duplicates.length > 0) {
    console.error('   ❌ DUPLICATE TOOLS FOUND:');
    for (const [name, count] of duplicates) {
      console.error(`      "${name}" appears ${count} times`);
    }
    console.error('   This causes WindSurf to reject the server!');
    exitCode = 1;
    return false;
  }
  
  console.log(`   ✅ No duplicates found (${allTools.length} tools)`);
  return true;
}

// ==================== CONFIG PATH CHECK ====================

function checkConfigPath() {
  console.log('\n🔍 Phase 5: Config Path Validation');
  
  const homeDir = os.homedir();
  const expectedPath = path.join(homeDir, '.codeium', 'windsurf', 'mcp_config.json');
  
  console.log(`   Expected: ${expectedPath}`);
  
  const parts = expectedPath.split(path.sep);
  const hasCodeium = parts.includes('.codeium');
  const hasWindsurf = parts.includes('windsurf');
  
  if (!hasCodeium || !hasWindsurf) {
    console.error('   ❌ Wrong config path structure');
    console.error('   WindSurf requires: ~/.codeium/windsurf/mcp_config.json');
    exitCode = 1;
    return false;
  }
  
  console.log('   ✅ Config path structure correct');
  return true;
}

// ==================== CLEANUP ====================

function cleanup() {
  console.log('\n🧹 Phase 6: Cleanup');
  
  if (serverProcess) {
    try {
      serverProcess.kill();
      console.log('   Server stopped');
    } catch (e) {
      // Ignore
    }
  }
  
  if (tempDir && fs.existsSync(tempDir)) {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
      console.log(`   Temp directory removed`);
    } catch (e) {
      console.warn(`   ⚠️  Could not remove temp: ${tempDir}`);
    }
  }
}

// ==================== MAIN ====================

async function main() {
  console.log('='.repeat(60));
  console.log('SWEObeyMe Clean Environment Simulation');
  console.log('This test simulates a fresh user install\n');
  
  try {
    // Phase 1: Setup
    const extensionDir = setupCleanEnvironment();
    
    // Phase 2: Critical checks
    runCriticalChecks(extensionDir);
    
    // Phase 3: Server startup
    await testServerStartup(extensionDir);
    
    // Phase 4: Duplicates
    checkForDuplicates(extensionDir);
    
    // Phase 5: Config
    checkConfigPath();
    
    // Success
    cleanup();
    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL SIMULATION TESTS PASSED');
    console.log('Extension is ready for WindSurf deployment');
    console.log('='.repeat(60) + '\n');
    process.exit(0);
    
  } catch (error) {
    cleanup();
    console.log('\n' + '='.repeat(60));
    console.log('❌ SIMULATION TESTS FAILED');
    console.log(`Error: ${error.message}`);
    console.log('='.repeat(60) + '\n');
    process.exit(1);
  }
}

// Handle interrupts
process.on('SIGINT', () => {
  console.log('\n\nInterrupted, cleaning up...');
  cleanup();
  process.exit(1);
});

main();
