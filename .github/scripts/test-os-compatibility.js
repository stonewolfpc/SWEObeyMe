/**
 * OS COMPATIBILITY TESTS
 * Validates path handling, command execution, and OS-specific features
 * Tests Windows, macOS, and Linux compatibility
 */

import os from 'os';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🖥️  OS COMPATIBILITY TESTS\n');

const platform = os.platform();
const projectRoot = path.join(__dirname, '..', '..');
let errors = [];
let warnings = [];

console.log(`Running on: ${platform} (${os.release()})`);
console.log(`Home: ${os.homedir()}\n`);

// Test 1: Path separator handling
console.log('1️⃣  Testing path separator handling...');
const testPaths = [
  'lib/tools/registry.js',
  'lib\\tools\\registry.js',
  path.join('lib', 'tools', 'registry.js'),
];

const normalizedPaths = testPaths.map((p) => path.normalize(p));
const allSame = normalizedPaths.every((p) => p === normalizedPaths[0]);

if (allSame) {
  console.log(`   ✅ Path normalization works correctly`);
  console.log(`   Result: ${normalizedPaths[0]}`);
} else {
  errors.push('Path normalization inconsistent');
  console.error('   ❌ Path normalization failed');
}

// Test 2: Config path for current OS
console.log('\n2️⃣  Testing config path generation...');
const homeDir = os.homedir();
const configPath = path.join(homeDir, '.codeium', 'windsurf', 'mcp_config.json');

// Validate path structure
const pathParts = configPath.split(path.sep);
const hasCodeium = pathParts.includes('.codeium');
const hasWindsurf = pathParts.includes('windsurf');
const endsWithConfig = pathParts[pathParts.length - 1] === 'mcp_config.json';

if (hasCodeium && hasWindsurf && endsWithConfig) {
  console.log('   ✅ Config path valid for current OS');
  console.log(`   Path: ${configPath}`);
} else {
  errors.push(`Invalid config path: ${configPath}`);
  console.error('   ❌ Config path structure incorrect');
}

// Test 3: Check for OS-specific code in extension
console.log('\n3️⃣  Checking OS-specific code handling...');
const extensionJsPath = path.join(projectRoot, 'extension.js');
const extensionJs = fs.readFileSync(extensionJsPath, 'utf8');

// Look for platform checks
const hasWin32Check = extensionJs.includes('win32') || extensionJs.includes("platform === 'win32'");
const hasPlatformCheck =
  extensionJs.includes('process.platform') || extensionJs.includes('os.platform');
const hasPathJoin = extensionJs.includes('path.join') || extensionJs.includes('path.resolve');

if (hasPathJoin) {
  console.log('   ✅ Uses path.join/path.resolve (cross-platform)');
} else {
  warnings.push('Extension may not handle paths cross-platform');
}

if (hasPlatformCheck) {
  console.log('   ✅ Has platform-specific checks');
} else {
  console.log('   ℹ️  No platform checks (may be fine if using universal APIs)');
}

// Test 4: Node path requirements
console.log('\n4️⃣  Testing Node.js path requirements...');
const nodePath = process.execPath;
const isAbsolute = path.isAbsolute(nodePath);
const containsSpaces = nodePath.includes(' ');

if (isAbsolute) {
  console.log('   ✅ Node path is absolute');
  console.log(`   Path: ${nodePath}`);
} else {
  errors.push('Node path is not absolute - will fail on Windows');
  console.error('   ❌ Node path is not absolute');
}

if (containsSpaces) {
  warnings.push('Node path contains spaces - may need special handling');
  console.warn('   ⚠️  Path contains spaces');
}

// Test 5: MCP server path
console.log('\n5️⃣  Testing MCP server path...');
const serverPath = path.join(projectRoot, 'dist', 'mcp', 'server.js');
const serverPathRelative = './dist/mcp/server.js';

// Both should resolve correctly
const absoluteServer = path.resolve(serverPath);
const relativeServer = path.resolve(projectRoot, serverPathRelative);

if (path.normalize(absoluteServer) === path.normalize(relativeServer)) {
  console.log('   ✅ Server path resolves correctly');
} else {
  warnings.push('Server path resolution inconsistent');
}

// Test 6: Line ending compatibility
console.log('\n6️⃣  Checking line ending compatibility...');
const indexPath = path.join(projectRoot, 'index.js');
if (fs.existsSync(indexPath)) {
  const content = fs.readFileSync(indexPath);
  const hasCRLF = content.includes('\r\n');
  const hasLF = content.includes('\n') && !hasCRLF;

  if (hasCRLF) {
    console.log('   ℹ️  Files use CRLF (Windows style)');
  } else if (hasLF) {
    console.log('   ℹ️  Files use LF (Unix style)');
  }

  // Git should handle this, but warn if mixed
  const mixed =
    content.toString().includes('\r\n') && content.toString().replace(/\r\n/g, '').includes('\n');
  if (mixed) {
    warnings.push('Mixed line endings detected');
    console.warn('   ⚠️  Mixed line endings in files');
  } else {
    console.log('   ✅ Consistent line endings');
  }
}

// Test 7: Check file permissions (Unix-like systems)
if (platform !== 'win32') {
  console.log('\n7️⃣  Testing file permissions...');
  try {
    const serverStat = fs.statSync(serverPath);
    const isExecutable = (serverStat.mode & 0o111) !== 0;

    if (isExecutable) {
      console.log('   ✅ Server file is executable');
    } else {
      console.log('   ℹ️  Server file not executable (may be fine for stdio transport)');
    }
  } catch (e) {
    console.log('   ℹ️  Server file not built yet');
  }
}

// Test 8: Environment variable handling
console.log('\n8️⃣  Testing environment handling...');
const envVars = ['PATH', 'HOME', 'USERPROFILE'];
const foundVars = envVars.filter((v) => process.env[v] !== undefined);

if (foundVars.length >= 2) {
  console.log(`   ✅ Environment variables accessible (${foundVars.join(', ')})`);
} else {
  warnings.push('Limited environment variables available');
  console.warn('   ⚠️  Few environment variables found');
}

// OS-specific recommendations
console.log('\n📋 OS-SPECIFIC RECOMMENDATIONS');
if (platform === 'win32') {
  console.log('   Windows:');
  console.log('   - Use full path to node.exe in MCP config');
  console.log('   - Quote paths with spaces');
  console.log('   - Use forward slashes in JSON configs');
  console.log('   - Test with Node NOT in PATH');
} else if (platform === 'darwin') {
  console.log('   macOS:');
  console.log('   - Check for code signing requirements');
  console.log('   - Verify Gatekeeper compatibility');
  console.log('   - Test on both Intel and Apple Silicon');
} else {
  console.log('   Linux:');
  console.log('   - Check file permissions');
  console.log('   - Test on multiple distros');
  console.log('   - Verify snap/flatpak compatibility');
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 OS COMPATIBILITY SUMMARY');
console.log('='.repeat(60));
console.log(`   Platform: ${platform}`);
console.log(`   Errors: ${errors.length}`);
console.log(`   Warnings: ${warnings.length}`);

if (errors.length > 0) {
  console.error('\n❌ OS COMPATIBILITY TESTS FAILED');
  console.error('   Critical issues found:');
  errors.forEach((e) => console.error(`      - ${e}`));
  process.exit(1);
} else if (warnings.length > 0) {
  console.warn('\n⚠️  OS COMPATIBILITY PASSED WITH WARNINGS');
  console.warn('   Review warnings before release');
  process.exit(0);
} else {
  console.log('\n✅ OS COMPATIBILITY VERIFIED');
  console.log(`   Ready for ${platform} deployment`);
  process.exit(0);
}
