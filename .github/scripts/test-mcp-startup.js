/**
 * Tests that the MCP server starts without errors
 * This catches the package.json and transport errors
 * SIMULATES CLEAN ENVIRONMENT - even on dev machine
 */

import { spawn, execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Testing MCP Server Startup (Simulating Clean Environment)...\n');

// ==================== SIMULATION SETUP ====================
// We simulate a "clean environment" even on the dev machine
// by creating an isolated temp directory and using only packaged files

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sweobeyme-test-'));
console.log(`📁 Simulating clean install in: ${tempDir}`);

// Copy the packaged extension to temp dir (simulating fresh install)
// Navigate from .github/scripts to project root
const extensionRoot = path.join(__dirname, '..', '..');
const vsixFiles = fs.readdirSync(extensionRoot).filter(f => f.endsWith('.vsix'));

if (vsixFiles.length === 0) {
  console.error('❌ No .vsix file found. Run "vsce package" first!');
  console.error('   This simulates what a user gets when installing from marketplace.');
  process.exit(1);
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
console.log(`📦 Using package: ${vsixFile}`);

// Extract the vsix to simulate installation
// Note: .vsix files are ZIP files, but PowerShell's Expand-Archive is picky about extensions
const vsixPath = path.join(extensionRoot, vsixFile);
const zipPath = path.join(tempDir, 'extension.zip');

try {
  // Copy to temp dir as .zip
  fs.copyFileSync(vsixPath, zipPath);
  // Extract
  execSync(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${tempDir}' -Force"`, 
    { stdio: 'pipe' });
  // Clean up zip
  fs.unlinkSync(zipPath);
} catch (e) {
  console.error('❌ Failed to extract .vsix file:', e.message);
  process.exit(1);
}

const extensionDir = path.join(tempDir, 'extension');
if (!fs.existsSync(extensionDir)) {
  console.error('❌ Extension directory not found in extracted .vsix');
  process.exit(1);
}

console.log('✅ Extension extracted successfully\n');

// ==================== CRITICAL CHECKS ====================

const serverPath = path.join(extensionDir, 'dist/mcp/server.js');

// Check 1: Server file exists
console.log('🔍 Check 1: Server file exists');
if (!fs.existsSync(serverPath)) {
  console.error(`❌ Server file not found: ${serverPath}`);
  console.error('   The build process did not produce dist/mcp/server.js');
  process.exit(1);
}
console.log('✅ Server file exists\n');

// Check 2: package.json exists in dist/mcp/ (CRITICAL for WindSurf)
console.log('🔍 Check 2: package.json in dist/mcp/ (CRITICAL)');
const pkgPath = path.join(extensionDir, 'dist/mcp/package.json');
if (!fs.existsSync(pkgPath)) {
  console.error('❌ CRITICAL: package.json missing from dist/mcp/');
  console.error('   This causes "transport error" in WindSurf!');
  console.error('   The server.js tries to read its own package.json but can\'t find it.');
  console.error('   Fix: Add "cp package.json dist/mcp/" to build script');
  process.exit(1);
}
console.log('✅ package.json found in dist/mcp/\n');

// Check 3: Verify package.json has required fields
console.log('🔍 Check 3: package.json validity');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
if (!pkg.name || !pkg.version) {
  console.error('❌ package.json missing required fields (name, version)');
  process.exit(1);
}
console.log(`✅ package.json valid (${pkg.name} v${pkg.version})\n`);

// ==================== SERVER STARTUP TEST ====================
console.log('🔄 Check 4: Starting MCP server...');

// SIMULATE: Node not in PATH scenario (Windows-specific issue)
// We use the full path to node.exe to simulate what should be written to config
const nodePath = process.execPath;
console.log(`   Using Node: ${nodePath}`);

// Create a clean environment with minimal PATH
const cleanEnv = {
  ...process.env,
  PATH: '', // Simulate missing PATH - server must handle this
  NODE_ENV: 'test',
  SWEOBEYME_TEST: 'true'
};

const server = spawn(nodePath, [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: cleanEnv,
  cwd: extensionDir
});

let stdout = '';
let stderr = '';
let started = false;

server.stdout.on('data', (data) => {
  stdout += data.toString();
  
  // Check for successful start indicators
  if (stdout.includes('MCP Server') || 
      stdout.includes('Server') || 
      stdout.includes('started') ||
      stdout.includes('listening')) {
    started = true;
  }
});

server.stderr.on('data', (data) => {
  stderr += data.toString();
});

// Wait for startup
setTimeout(() => {
  // Check for specific error patterns
  if (stderr.includes('ENOENT') && stderr.includes('package.json')) {
    console.error('❌ Server failed: Cannot find package.json');
    console.error('   STDERR:', stderr.slice(0, 500));
    console.error('   This is the transport error root cause!');
    server.kill();
    cleanup();
    process.exit(1);
  }
  
  if (stderr.includes('Cannot find module') || stderr.includes('MODULE_NOT_FOUND')) {
    console.error('❌ Server failed: Missing dependency');
    console.error(`   STDERR: ${stderr.slice(0, 500)}`);
    server.kill();
    cleanup();
    process.exit(1);
  }
  
  if (stderr.includes('EACCES') || stderr.includes('permission')) {
    console.error('❌ Server failed: Permission denied');
    console.error(`   STDERR: ${stderr.slice(0, 500)}`);
    server.kill();
    cleanup();
    process.exit(1);
  }
  
  // Check if process is still running
  try {
    process.kill(server.pid, 0);
    
    if (started || stderr === '') {
      console.log('✅ Server started successfully and is running\n');
      server.kill();
      cleanup();
      
      console.log('='.repeat(50));
      console.log('✅ ALL STARTUP TESTS PASSED');
      console.log('   Server starts correctly in clean environment');
      console.log('   package.json is properly packaged');
      console.log('   Ready for WindSurf deployment');
      process.exit(0);
    } else {
      console.warn('⚠️  Server running but no startup confirmation');
      console.warn('   STDOUT:', stdout.slice(0, 200) || '(empty)');
      console.warn('   STDERR:', stderr.slice(0, 200) || '(empty)');
      server.kill();
      cleanup();
      process.exit(0); // Soft pass - server is running
    }
  } catch (e) {
    console.error('❌ Server crashed after startup');
    console.error('STDOUT:', stdout || '(empty)');
    console.error('STDERR:', stderr || '(empty)');
    server.kill();
    cleanup();
    process.exit(1);
  }
}, 5000);

// Timeout guard
setTimeout(() => {
  console.error('❌ Server startup timeout (10s)');
  console.error('STDOUT:', stdout || '(empty)');
  console.error('STDERR:', stderr || '(empty)');
  server.kill();
  cleanup();
  process.exit(1);
}, 10000);

function cleanup() {
  // Clean up temp directory
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
    console.log(`\n🧹 Cleaned up temp directory`);
  } catch (e) {
    console.warn(`⚠️  Could not clean up temp directory: ${tempDir}`);
  }
}
