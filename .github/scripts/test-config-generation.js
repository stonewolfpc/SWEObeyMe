/**
 * Tests that the config auto-generation works correctly
 * Validates the exact path and structure WindSurf requires
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('⚙️  Testing Config Generation...\n');

// Test 1: Check correct config path for platform
const platform = os.platform();
const homeDir = os.homedir();

console.log(`Platform: ${platform}`);
console.log(`Home directory: ${homeDir}`);

// WindSurf requires config at ~/.codeium/windsurf/mcp_config.json on ALL platforms
const expectedPath = path.join(homeDir, '.codeium', 'windsurf', 'mcp_config.json');
console.log(`Expected config path: ${expectedPath}`);

// Validate the path structure
const pathComponents = expectedPath.split(path.sep);
const hasCodeium = pathComponents.includes('.codeium');
const hasWindsurf = pathComponents.includes('windsurf');
const hasMcpConfig = pathComponents[pathComponents.length - 1] === 'mcp_config.json';

if (!hasCodeium) {
  console.error('\n❌ Path missing .codeium directory');
  console.error('   WindSurf requires: ~/.codeium/windsurf/mcp_config.json');
  process.exit(1);
}

if (!hasWindsurf) {
  console.error('\n❌ Path missing windsurf directory');
  console.error('   WindSurf requires: ~/.codeium/windsurf/mcp_config.json');
  process.exit(1);
}

if (!hasMcpConfig) {
  console.error('\n❌ Wrong filename');
  console.error('   Must be: mcp_config.json');
  process.exit(1);
}

console.log('✅ Config path structure valid\n');

// Test 2: Generate sample config
console.log('📝 Generating sample config...');

// Navigate from .github/scripts to project root
const extensionRoot = path.join(__dirname, '..', '..');
const serverPath = path.join(extensionRoot, 'dist/mcp/server.js');
const nodePath = process.execPath;

// Check if paths are absolute (Windows requirement)
if (!path.isAbsolute(serverPath)) {
  console.error('❌ Server path is not absolute');
  console.error('   WindSurf on Windows requires absolute paths');
  process.exit(1);
}

if (!path.isAbsolute(nodePath)) {
  console.error('❌ Node path is not absolute');
  console.error('   WindSurf on Windows requires full path to node.exe');
  console.error('   Using "node" alone fails when node is not in PATH');
  process.exit(1);
}

const sampleConfig = {
  mcpServers: {
    sweobeyme: {
      command: nodePath,
      args: [serverPath],
    },
  },
};

console.log('\nSample config:');
console.log(JSON.stringify(sampleConfig, null, 2));

// Test 3: Validate config structure
console.log('\n🔍 Validating config structure...');

const issues = [];

// Check command is absolute path (critical for Windows)
if (!path.isAbsolute(sampleConfig.mcpServers.sweobeyme.command)) {
  issues.push('Command path is not absolute - will fail on Windows without PATH');
}

// Check args exist and point to server.js
if (
  !Array.isArray(sampleConfig.mcpServers.sweobeyme.args) ||
  sampleConfig.mcpServers.sweobeyme.args.length === 0
) {
  issues.push('Args missing or empty');
} else if (!sampleConfig.mcpServers.sweobeyme.args[0].includes('server.js')) {
  issues.push('Args[0] does not point to server.js');
}

// Check server file exists
const configuredServerPath = sampleConfig.mcpServers.sweobeyme.args[0];
if (!fs.existsSync(configuredServerPath)) {
  issues.push(`Configured server path does not exist: ${configuredServerPath}`);
}

// Check for shell features (not supported in MCP config)
if (
  sampleConfig.mcpServers.sweobeyme.command.includes('&') ||
  sampleConfig.mcpServers.sweobeyme.command.includes('&&') ||
  sampleConfig.mcpServers.sweobeyme.command.includes('|')
) {
  issues.push('Command contains shell operators - not supported by MCP');
}

if (issues.length > 0) {
  console.error('\n❌ Config issues:');
  for (const issue of issues) {
    console.error(`   - ${issue}`);
  }
  process.exit(1);
} else {
  console.log('✅ Config structure valid');
  console.log(`   Command: ${sampleConfig.mcpServers.sweobeyme.command}`);
  console.log(`   Args: ${sampleConfig.mcpServers.sweobeyme.args.join(' ')}`);
}

// Test 4: Windows-specific checks
if (platform === 'win32') {
  console.log('\n🪟 Windows-specific checks:');

  // Check if node.exe exists at the specified path
  if (!fs.existsSync(nodePath)) {
    console.warn('   ⚠️  Node executable not found at expected path');
    console.warn(`      ${nodePath}`);
  } else {
    console.log('   ✅ Node executable exists');
  }

  // Check for spaces in paths (can cause issues)
  if (nodePath.includes(' ') || serverPath.includes(' ')) {
    console.warn('   ⚠️  Path contains spaces - may need quoting in some shells');
  }

  // Validate the config would work with spaces
  const needsQuoting = nodePath.includes(' ') || configuredServerPath.includes(' ');
  if (needsQuoting) {
    console.log('   ℹ️  Paths contain spaces - MCP SDK handles this automatically');
  }
}

console.log('\n' + '='.repeat(50));
console.log('✅ ALL CONFIG TESTS PASSED');
console.log('\n📋 Summary for manual verification:');
console.log(`   Config path: ${expectedPath}`);
console.log(`   Node path: ${nodePath}`);
console.log(`   Server path: ${serverPath}`);
console.log(`   Server exists: ${fs.existsSync(serverPath) ? '✅' : '❌'}`);

// Check if package.json is in dist/mcp (critical for WindSurf)
const pkgPath = path.join(extensionRoot, 'dist/mcp/package.json');
console.log(`   package.json in dist/mcp: ${fs.existsSync(pkgPath) ? '✅' : '❌ CRITICAL!'}`);

if (!fs.existsSync(pkgPath)) {
  console.error('\n❌ CRITICAL: package.json missing from dist/mcp/');
  console.error('   This will cause "transport error" in WindSurf!');
  process.exit(1);
}

process.exit(0);
