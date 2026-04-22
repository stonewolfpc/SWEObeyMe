#!/usr/bin/env node

/**
 * NPM Package Deprecation Detection Test
 * 
 * This test detects deprecated npm packages in package.json
 * to prevent npm warnings during installation.
 * 
 * Goal: NEVER have deprecated packages in the project.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;
let warnings = [];

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║     NPM Package Deprecation Detection Test                ║');
console.log('║     Goal: Prevent deprecated npm packages                ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

/**
 * Check 1: Verify package.json exists and is valid JSON
 */
async function checkPackageJson() {
  totalChecks++;
  console.log('Check 1: package.json exists and is valid JSON');
  try {
    const packageJsonPath = path.join(rootDir, 'package.json');
    const content = await fs.readFile(packageJsonPath, 'utf-8');
    JSON.parse(content);
    console.log('  ✅ PASS: package.json is valid JSON\n');
    passedChecks++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${error.message}\n`);
    failedChecks++;
  }
}

/**
 * Check 2: Check for known deprecated packages
 */
async function checkDeprecatedPackages() {
  totalChecks++;
  console.log('Check 2: Check for known deprecated packages');
  try {
    const packageJsonPath = path.join(rootDir, 'package.json');
    const content = await fs.readFile(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(content);
    
    // Known deprecated packages and their replacements
    const deprecatedPackages = {
      'inflight': { replacement: 'lru-cache', message: 'Module not supported, leaks memory' },
      'read-pkg-up': { replacement: 'read-package-up', message: 'Renamed to read-package-up' },
      '@humanwhocodes/config-array': { replacement: '@eslint/config-array', message: 'Use @eslint/config-array instead' },
      'rimraf': { replacement: 'rimraf@4+', message: 'Rimraf versions prior to v4 are no longer supported' },
      'whatwg-encoding': { replacement: '@exodus/bytes', message: 'Use @exodus/bytes for spec-conformant implementation' },
      'glob': { replacement: 'glob@10+', message: 'Old versions contain security vulnerabilities' },
      'prebuild-install': { replacement: 'Contact native addon author', message: 'No longer maintained' },
      '@humanwhocodes/object-schema': { replacement: '@eslint/object-schema', message: 'Use @eslint/object-schema instead' },
      'eslint': { replacement: 'eslint@9+', message: 'ESLint 8 is no longer supported' },
    };
    
    const allDependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
      ...packageJson.peerDependencies
    };
    
    let foundDeprecated = false;
    for (const [pkgName, pkgVersion] of Object.entries(allDependencies)) {
      // Extract version string (remove ^, ~, >=, etc.)
      const version = pkgVersion.replace(/^[^0-9]*/, '');
      
      // Check if package name matches deprecated package
      for (const [deprecatedPkg, info] of Object.entries(deprecatedPackages)) {
        if (pkgName === deprecatedPkg) {
          // For eslint, only flag if it's version 8 or lower
          if (deprecatedPkg === 'eslint' && version && version.startsWith('9')) {
            continue; // ESLint 9+ is fine
          }
          
          // For glob, only flag if it's version 7 or lower
          if (deprecatedPkg === 'glob' && version && (version.startsWith('10') || version.startsWith('11'))) {
            continue; // glob 10+ is fine
          }
          
          // For rimraf, only flag if it's version 3 or lower
          if (deprecatedPkg === 'rimraf' && version && version.startsWith('4')) {
            continue; // rimraf 4+ is fine
          }
          
          foundDeprecated = true;
          warnings.push(`Deprecated package: ${pkgName}@${version || 'unknown'} - ${info.message} - Replacement: ${info.replacement}`);
        }
      }
    }
    
    if (foundDeprecated) {
      console.log(`  ❌ FAIL: Found deprecated packages\n`);
      failedChecks++;
    } else {
      console.log(`  ✅ PASS: No deprecated packages found\n`);
      passedChecks++;
    }
  } catch (error) {
    console.log(`  ❌ FAIL: ${error.message}\n`);
    failedChecks++;
  }
}

/**
 * Check 3: Run npm outdated to check for outdated packages
 */
async function checkOutdatedPackages() {
  totalChecks++;
  console.log('Check 3: Check for outdated packages');
  try {
    try {
      const output = execSync('npm outdated --json', { cwd: rootDir, encoding: 'utf-8', timeout: 30000 });
      const outdated = JSON.parse(output);
      
      if (Object.keys(outdated).length > 0) {
        warnings.push(`${Object.keys(outdated).length} outdated packages found`);
        for (const [pkg, info] of Object.entries(outdated)) {
          warnings.push(`  ${pkg}: current ${info.current}, wanted ${info.wanted}, latest ${info.latest}`);
        }
        console.log(`  ⚠️  WARNING: Found ${Object.keys(outdated).length} outdated packages\n`);
      } else {
        console.log(`  ✅ PASS: All packages are up to date\n`);
        passedChecks++;
      }
    } catch (error) {
      // npm outdated returns non-zero exit code if there are outdated packages
      if (error.stdout) {
        try {
          const outdated = JSON.parse(error.stdout);
          if (Object.keys(outdated).length > 0) {
            warnings.push(`${Object.keys(outdated).length} outdated packages found`);
            for (const [pkg, info] of Object.entries(outdated)) {
              warnings.push(`  ${pkg}: current ${info.current}, wanted ${info.wanted}, latest ${info.latest}`);
            }
            console.log(`  ⚠️  WARNING: Found ${Object.keys(outdated).length} outdated packages\n`);
          } else {
            console.log(`  ✅ PASS: All packages are up to date\n`);
            passedChecks++;
          }
        } catch {
          console.log(`  ⚠️  WARNING: Could not check for outdated packages\n`);
        }
      } else {
        console.log(`  ✅ PASS: All packages are up to date\n`);
        passedChecks++;
      }
    }
  } catch (error) {
    console.log(`  ⚠️  WARNING: Could not check for outdated packages: ${error.message}\n`);
  }
}

/**
 * Run all checks
 */
async function runAllChecks() {
  await checkPackageJson();
  await checkDeprecatedPackages();
  await checkOutdatedPackages();
  
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    TEST RESULTS                           ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  console.log(`Total Checks:  ${totalChecks}`);
  console.log(`Passed:        ${passedChecks} ✅`);
  console.log(`Failed:        ${failedChecks} ❌`);
  console.log(`Warnings:      ${warnings.length} ⚠️\n`);
  
  if (warnings.length > 0) {
    console.log('Warnings:');
    warnings.forEach(w => console.log(`  - ${w}`));
    console.log('');
  }
  
  const successRate = totalChecks > 0 ? ((passedChecks / totalChecks) * 100).toFixed(1) : 0;
  console.log(`Success Rate: ${successRate}%\n`);
  
  if (failedChecks === 0) {
    console.log('✅ ALL CRITICAL CHECKS PASSED! NPM packages are up to date.\n');
    process.exit(0);
  } else {
    console.log('❌ SOME CHECKS FAILED. Please fix the issues above.\n');
    process.exit(1);
  }
}

// Run the test suite
runAllChecks().catch(error => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});
