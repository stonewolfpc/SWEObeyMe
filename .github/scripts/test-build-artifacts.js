/**
 * BUILD ARTIFACT VALIDATION
 * Ensures all required files are present in the built extension
 * Validates the .vsix package contents
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('📦 BUILD ARTIFACT VALIDATION\n');

const projectRoot = path.join(__dirname, '..', '..');
let errors = [];
let warnings = [];

// Test 1: Check dist directory exists
console.log('1️⃣  Checking dist directory...');
const distPath = path.join(projectRoot, 'dist');
if (!fs.existsSync(distPath)) {
  errors.push('dist/ directory not found - run "npm run build" first');
  console.error('   ❌ dist/ directory missing');
  console.error('   Run: npm run build');
  process.exit(1);
}
console.log('   ✅ dist/ directory exists');

// Test 2: Check required files in dist/
console.log('\n2️⃣  Checking required build artifacts...');
const requiredFiles = [
  'extension.js',
  'mcp/server.js',
  'mcp/package.json', // CRITICAL for WindSurf
];

const foundFiles = [];
const missingFiles = [];

for (const file of requiredFiles) {
  const filePath = path.join(distPath, file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    foundFiles.push({ path: file, size: stats.size });
    console.log(`   ✅ ${file} (${(stats.size / 1024).toFixed(1)} KB)`);
  } else {
    missingFiles.push(file);
    errors.push(`Missing: ${file}`);
    console.error(`   ❌ ${file} MISSING`);
  }
}

if (missingFiles.length > 0) {
  console.error('\n   Build is incomplete. Run: npm run build');
}

// Test 3: Check lib directory exists (for development)
console.log('\n3️⃣  Checking lib/ directory...');
const libPath = path.join(projectRoot, 'lib');
if (fs.existsSync(libPath)) {
  const libFiles = fs.readdirSync(libPath).filter((f) => f.endsWith('.js'));
  console.log(`   ✅ lib/ directory has ${libFiles.length} JS files`);
} else {
  warnings.push('lib/ directory not found');
  console.warn('   ⚠️  lib/ directory missing');
}

// Test 4: Validate package.json in dist/mcp/
console.log('\n4️⃣  Validating dist/mcp/package.json (CRITICAL)...');
const mcpPackageJsonPath = path.join(distPath, 'mcp', 'package.json');
if (fs.existsSync(mcpPackageJsonPath)) {
  try {
    const mcpPkg = JSON.parse(fs.readFileSync(mcpPackageJsonPath, 'utf8'));

    const hasName = !!mcpPkg.name;
    const hasVersion = !!mcpPkg.version;
    const hasMain = !!mcpPkg.main || !!mcpPkg.module;

    if (hasName && hasVersion) {
      console.log(`   ✅ package.json valid (${mcpPkg.name} v${mcpPkg.version})`);
    } else {
      errors.push('dist/mcp/package.json missing required fields');
      console.error('   ❌ package.json missing name or version');
    }

    // Compare with root package.json
    const rootPkg = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
    if (mcpPkg.name === rootPkg.name && mcpPkg.version === rootPkg.version) {
      console.log('   ✅ Versions match root package.json');
    } else {
      warnings.push('dist/mcp/package.json version mismatch with root');
      console.warn('   ⚠️  Version mismatch with root package.json');
    }
  } catch (e) {
    errors.push('Invalid dist/mcp/package.json: ' + e.message);
    console.error('   ❌ Invalid package.json:', e.message);
  }
} else {
  errors.push('CRITICAL: dist/mcp/package.json missing - WindSurf will fail!');
  console.error('   ❌ CRITICAL: dist/mcp/package.json missing');
  console.error('   This causes "transport error" in WindSurf!');
}

// Test 5: Check .vsix file exists
console.log('\n5️⃣  Checking .vsix package...');
const vsixFiles = fs.readdirSync(projectRoot).filter((f) => f.endsWith('.vsix'));

if (vsixFiles.length > 0) {
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
  const vsixPath = path.join(projectRoot, vsixFile);
  const vsixStats = fs.statSync(vsixPath);

  console.log(`   ✅ ${vsixFile} found (${(vsixStats.size / 1024 / 1024).toFixed(2)} MB)`);

  // Validate .vsix contents
  console.log('\n6️⃣  Validating .vsix contents...');
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vsix-check-'));

  const zipPath = path.join(tempDir, 'extension.zip');

  try {
    // Extract and check contents
    if (os.platform() === 'win32') {
      // Copy and rename to .zip for PowerShell compatibility
      fs.copyFileSync(vsixPath, zipPath);
      execSync(
        `powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${tempDir}' -Force"`,
        { stdio: 'pipe' }
      );
      fs.unlinkSync(zipPath);
    } else {
      execSync(`unzip -q "${vsixPath}" -d "${tempDir}"`, { stdio: 'pipe' });
    }

    const extensionDir = path.join(tempDir, 'extension');

    // Check critical files in .vsix
    const vsixChecks = [
      { file: 'package.json', critical: true },
      { file: 'dist/extension.js', critical: true },
      { file: 'dist/mcp/server.js', critical: true },
      { file: 'dist/mcp/package.json', critical: true },
      { file: 'icon.png', critical: false },
    ];

    let vsixValid = true;
    for (const check of vsixChecks) {
      const checkPath = path.join(extensionDir, check.file);
      if (fs.existsSync(checkPath)) {
        console.log(`   ✅ ${check.file} in .vsix`);
      } else if (check.critical) {
        errors.push(`CRITICAL: ${check.file} missing from .vsix`);
        console.error(`   ❌ ${check.file} MISSING from .vsix`);
        vsixValid = false;
      } else {
        warnings.push(`${check.file} missing from .vsix`);
        console.warn(`   ⚠️  ${check.file} missing`);
      }
    }

    if (vsixValid) {
      console.log('   ✅ All critical files present in .vsix');
    }

    // Cleanup
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch (e) {
    warnings.push('Could not validate .vsix contents: ' + e.message);
    console.warn('   ⚠️  Could not validate .vsix:', e.message);
  }
} else {
  warnings.push('No .vsix file found - run "vsce package"');
  console.warn('   ⚠️  No .vsix file (run: vsce package)');
}

// Test 7: Check file sizes (sanity check)
console.log('\n7️⃣  Checking file sizes...');
const sizeChecks = [
  { file: 'dist/extension.js', minSize: 1000, maxSize: 10 * 1024 * 1024 }, // 1KB - 10MB
  { file: 'dist/mcp/server.js', minSize: 1000, maxSize: 5 * 1024 * 1024 }, // 1KB - 5MB
];

for (const check of sizeChecks) {
  const filePath = path.join(projectRoot, check.file);
  if (fs.existsSync(filePath)) {
    const size = fs.statSync(filePath).size;
    if (size < check.minSize) {
      warnings.push(`${check.file} suspiciously small (${size} bytes)`);
      console.warn(`   ⚠️  ${check.file} very small (${size} bytes)`);
    } else if (size > check.maxSize) {
      warnings.push(`${check.file} very large (${(size / 1024 / 1024).toFixed(1)} MB)`);
      console.warn(`   ⚠️  ${check.file} very large (${(size / 1024 / 1024).toFixed(1)} MB)`);
    } else {
      console.log(`   ✅ ${check.file} size OK (${(size / 1024).toFixed(1)} KB)`);
    }
  }
}

// Test 8: Check for source maps (optional)
console.log('\n8️⃣  Checking source maps...');
const sourceMaps = ['dist/extension.js.map', 'dist/mcp/server.js.map'];

const hasSourceMaps = sourceMaps.every((f) => fs.existsSync(path.join(projectRoot, f)));
if (hasSourceMaps) {
  console.log('   ✅ Source maps present (good for debugging)');
} else {
  console.log('   ℹ️  No source maps (production builds may omit them)');
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 BUILD ARTIFACT VALIDATION SUMMARY');
console.log('='.repeat(60));
console.log(`   Required files: ${foundFiles.length}/${requiredFiles.length}`);
console.log(`   Errors: ${errors.length}`);
console.log(`   Warnings: ${warnings.length}`);

if (errors.length > 0) {
  console.error('\n❌ BUILD ARTIFACT VALIDATION FAILED');
  console.error('   Critical issues:');
  errors.forEach((e) => console.error(`      - ${e}`));
  console.error('\n   FIX: Run "npm run build" and "vsce package"');
  process.exit(1);
} else if (warnings.length > 0) {
  console.warn('\n⚠️  BUILD VALIDATION PASSED WITH WARNINGS');
  console.warn('   Review warnings before release');
  process.exit(0);
} else {
  console.log('\n✅ BUILD ARTIFACTS VALID');
  console.log('   All required files present');
  console.log('   Ready for packaging and release');
  process.exit(0);
}
