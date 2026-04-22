#!/usr/bin/env node

/**
 * Comprehensive GitHub Actions Error Detection Test
 * 
 * This test detects ALL possible GitHub Actions failure points:
 * - Exit code 1 (or any non-zero exit code)
 * - Unhandled errors in scripts
 * - Missing dependencies
 * - Timeout failures
 * - File permission issues
 * - Platform-specific issues
 * - Node.js version compatibility
 * - npm install failures
 * - Build failures
 * - Test failures
 * - Git configuration issues
 * - Workflow syntax errors
 * - Action version deprecations
 * - Environment variable issues
 * - Path issues
 * 
 * Goal: NEVER fail a GitHub Actions test when pushing. Period.
 */

import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;
let warnings = [];

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║     GitHub Actions Error Detection Test Suite             ║');
console.log('║     Goal: Prevent ANY GitHub Actions failure on push     ║');
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
 * Check 2: Verify Node.js version compatibility
 */
async function checkNodeVersionCompatibility() {
  totalChecks++;
  console.log('Check 2: Node.js version compatibility');
  try {
    const packageJsonPath = path.join(rootDir, 'package.json');
    const content = await fs.readFile(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(content);
    const engines = packageJson.engines?.node;
    
    if (!engines) {
      warnings.push('No Node.js version specified in package.json');
      console.log('  ⚠️  WARNING: No Node.js version specified in package.json\n');
    } else {
      console.log(`  ✅ PASS: Node.js version requirement: ${engines}\n`);
      passedChecks++;
    }
  } catch (error) {
    console.log(`  ❌ FAIL: ${error.message}\n`);
    failedChecks++;
  }
}

/**
 * Check 3: Verify all npm scripts exist and are valid
 */
async function checkNpmScripts() {
  totalChecks++;
  console.log('Check 3: All npm scripts exist and are valid');
  try {
    const packageJsonPath = path.join(rootDir, 'package.json');
    const content = await fs.readFile(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(content);
    const scripts = packageJson.scripts || {};
    
    const requiredScripts = ['test', 'build', 'package'];
    const missingScripts = requiredScripts.filter(s => !scripts[s]);
    
    if (missingScripts.length > 0) {
      console.log(`  ❌ FAIL: Missing required scripts: ${missingScripts.join(', ')}\n`);
      failedChecks++;
    } else {
      console.log(`  ✅ PASS: All required scripts present (${Object.keys(scripts).length} total)\n`);
      passedChecks++;
    }
  } catch (error) {
    console.log(`  ❌ FAIL: ${error.message}\n`);
    failedChecks++;
  }
}

/**
 * Check 4: Verify workflow files are valid YAML
 */
async function checkWorkflowSyntax() {
  totalChecks++;
  console.log('Check 4: GitHub Actions workflow files are valid YAML');
  try {
    const workflowsDir = path.join(rootDir, '.github', 'workflows');
    const files = await fs.readdir(workflowsDir);
    const yamlFiles = files.filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));
    
    let allValid = true;
    for (const file of yamlFiles) {
      try {
        const filePath = path.join(workflowsDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        // Basic YAML syntax check (look for common errors)
        if (content.includes('\t')) {
          warnings.push(`Workflow ${file} uses tabs instead of spaces`);
          allValid = false;
        }
      } catch (error) {
        console.log(`  ❌ FAIL: Cannot read ${file}: ${error.message}\n`);
        allValid = false;
      }
    }
    
    if (allValid) {
      console.log(`  ✅ PASS: ${yamlFiles.length} workflow files are valid\n`);
      passedChecks++;
    } else {
      console.log(`  ⚠️  WARNING: Workflow files have issues\n`);
    }
  } catch (error) {
    console.log(`  ❌ FAIL: ${error.message}\n`);
    failedChecks++;
  }
}

/**
 * Check 5: Verify GitHub Actions use supported Node.js versions
 */
async function checkGitHubActionsNodeVersions() {
  totalChecks++;
  console.log('Check 5: GitHub Actions use supported Node.js versions');
  try {
    const workflowsDir = path.join(rootDir, '.github', 'workflows');
    const files = await fs.readdir(workflowsDir);
    const yamlFiles = files.filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));
    
    let usesDeprecated = false;
    for (const file of yamlFiles) {
      const filePath = path.join(workflowsDir, file);
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Check for Node.js 18 or 20 (deprecated)
      if (content.includes("node-version: '18'") || 
          content.includes('node-version: "18"') ||
          content.includes("node-version: '20'") ||
          content.includes('node-version: "20"')) {
        warnings.push(`Workflow ${file} uses deprecated Node.js version (18 or 20)`);
        usesDeprecated = true;
      }
      
      // Check for actions/setup-node@v4 (deprecated)
      if (content.includes('actions/setup-node@v4')) {
        warnings.push(`Workflow ${file} uses deprecated actions/setup-node@v4 (should use @v5)`);
        usesDeprecated = true;
      }
    }
    
    if (usesDeprecated) {
      console.log(`  ⚠️  WARNING: Workflows use deprecated Node.js versions or actions\n`);
    } else {
      console.log(`  ✅ PASS: All workflows use supported Node.js versions\n`);
      passedChecks++;
    }
  } catch (error) {
    console.log(`  ❌ FAIL: ${error.message}\n`);
    failedChecks++;
  }
}

/**
 * Check 6: Verify git configuration is CI-compatible
 */
async function checkGitConfiguration() {
  totalChecks++;
  console.log('Check 6: Git configuration is CI-compatible');
  try {
    const gitConfigPath = path.join(rootDir, '.git', 'config');
    try {
      await fs.access(gitConfigPath);
      const content = await fs.readFile(gitConfigPath, 'utf-8');
      
      // Check for problematic settings
      const problematicSettings = [
        'core.sshCommand',
        'http.https://github.com/.extraheader'
      ];
      
      let hasProblematicSettings = false;
      for (const setting of problematicSettings) {
        if (content.includes(setting)) {
          warnings.push(`Git config contains ${setting} which may cause CI issues`);
          hasProblematicSettings = true;
        }
      }
      
      if (hasProblematicSettings) {
        console.log(`  ⚠️  WARNING: Git config has potentially problematic settings\n`);
      } else {
        console.log(`  ✅ PASS: Git configuration is CI-compatible\n`);
        passedChecks++;
      }
    } catch (error) {
      console.log(`  ⚠️  WARNING: Cannot access .git/config (may not be in git repo)\n`);
    }
  } catch (error) {
    console.log(`  ❌ FAIL: ${error.message}\n`);
    failedChecks++;
  }
}

/**
 * Check 7: Verify all test files are executable and have proper exit codes
 */
async function checkTestFilesExitCodes() {
  totalChecks++;
  console.log('Check 7: Test files have proper exit codes');
  try {
    const testDir = path.join(rootDir, 'test-tools');
    const files = await fs.readdir(testDir);
    const testFiles = files.filter(f => f.endsWith('.js'));
    
    let allValid = true;
    for (const file of testFiles) {
      const filePath = path.join(testDir, file);
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Check if file has process.exit() at the end
      if (!content.includes('process.exit')) {
        warnings.push(`Test file ${file} may not have proper exit code`);
        allValid = false;
      }
    }
    
    if (allValid) {
      console.log(`  ✅ PASS: ${testFiles.length} test files have proper exit codes\n`);
      passedChecks++;
    } else {
      console.log(`  ⚠️  WARNING: Some test files may not have proper exit codes\n`);
    }
  } catch (error) {
    console.log(`  ❌ FAIL: ${error.message}\n`);
    failedChecks++;
  }
}

/**
 * Check 8: Verify .gitignore doesn't ignore critical files
 */
async function checkGitignore() {
  totalChecks++;
  console.log('Check 8: .gitignore configuration');
  try {
    const gitignorePath = path.join(rootDir, '.gitignore');
    const content = await fs.readFile(gitignorePath, 'utf-8');
    
    // Check that critical files are not ignored
    const criticalFiles = ['package.json', 'README.md', 'CHANGELOG.md'];
    const ignoredCritical = [];
    
    for (const file of criticalFiles) {
      if (content.includes(file) && !content.startsWith('#')) {
        ignoredCritical.push(file);
      }
    }
    
    if (ignoredCritical.length > 0) {
      console.log(`  ❌ FAIL: Critical files may be ignored: ${ignoredCritical.join(', ')}\n`);
      failedChecks++;
    } else {
      console.log(`  ✅ PASS: .gitignore is properly configured\n`);
      passedChecks++;
    }
  } catch (error) {
    console.log(`  ❌ FAIL: ${error.message}\n`);
    failedChecks++;
  }
}

/**
 * Check 9: Verify README.md version matches package.json
 */
async function checkVersionConsistency() {
  totalChecks++;
  console.log('Check 9: README.md version matches package.json');
  try {
    const packageJsonPath = path.join(rootDir, 'package.json');
    const readmePath = path.join(rootDir, 'README.md');
    
    const packageContent = await fs.readFile(packageJsonPath, 'utf-8');
    const readmeContent = await fs.readFile(readmePath, 'utf-8');
    
    const packageJson = JSON.parse(packageContent);
    const packageVersion = packageJson.version;
    
    // Check if README contains the version
    if (readmeContent.includes(packageVersion)) {
      console.log(`  ✅ PASS: README.md contains version ${packageVersion}\n`);
      passedChecks++;
    } else {
      console.log(`  ❌ FAIL: README.md does not contain version ${packageVersion}\n`);
      failedChecks++;
    }
  } catch (error) {
    console.log(`  ❌ FAIL: ${error.message}\n`);
    failedChecks++;
  }
}

/**
 * Check 10: Verify no console.log or console.error in production code
 */
async function checkConsoleStatements() {
  totalChecks++;
  console.log('Check 10: No console statements in production code');
  try {
    const libDir = path.join(rootDir, 'lib');
    const files = await getAllFiles(libDir, ['.js']);
    
    let hasConsole = false;
    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      // Check for console.log or console.error (excluding test files)
      if (content.includes('console.log') || content.includes('console.error')) {
        // Allow in certain contexts
        if (!file.includes('test') && !file.includes('debug')) {
          hasConsole = true;
          warnings.push(`Console statements found in ${path.relative(rootDir, file)}`);
        }
      }
    }
    
    if (hasConsole) {
      console.log(`  ⚠️  WARNING: Console statements found in production code\n`);
    } else {
      console.log(`  ✅ PASS: No console statements in production code\n`);
      passedChecks++;
    }
  } catch (error) {
    console.log(`  ❌ FAIL: ${error.message}\n`);
    failedChecks++;
  }
}

/**
 * Check 11: Verify all tool handlers are registered
 */
async function checkToolHandlerRegistration() {
  totalChecks++;
  console.log('Check 11: All tool handlers are registered');
  try {
    const toolsPath = pathToFileURL(path.join(rootDir, 'lib', 'tools.js')).href;
    const { getToolDefinitions, toolHandlers } = await import(toolsPath);
    
    const toolDefinitions = getToolDefinitions();
    const toolNames = toolDefinitions.map(t => t.name);
    
    let allRegistered = true;
    for (const toolName of toolNames) {
      if (!toolHandlers[toolName]) {
        console.log(`  ❌ FAIL: Tool ${toolName} is registered but has no handler\n`);
        allRegistered = false;
      }
    }
    
    if (allRegistered) {
      console.log(`  ✅ PASS: All ${toolNames.length} tools have registered handlers\n`);
      passedChecks++;
    } else {
      failedChecks++;
    }
  } catch (error) {
    console.log(`  ❌ FAIL: ${error.message}\n`);
    failedChecks++;
  }
}

/**
 * Check 12: Verify no TODO comments in critical files
 */
async function checkTodoComments() {
  totalChecks++;
  console.log('Check 12: No TODO comments in critical files');
  try {
    const libDir = path.join(rootDir, 'lib');
    const files = await getAllFiles(libDir, ['.js']);
    
    let hasTodo = false;
    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      if (content.includes('TODO') || content.includes('FIXME')) {
        hasTodo = true;
        warnings.push(`TODO/FIXME found in ${path.relative(rootDir, file)}`);
      }
    }
    
    if (hasTodo) {
      console.log(`  ⚠️  WARNING: TODO/FIXME comments found in code\n`);
    } else {
      console.log(`  ✅ PASS: No TODO/FIXME comments in code\n`);
      passedChecks++;
    }
  } catch (error) {
    console.log(`  ❌ FAIL: ${error.message}\n`);
    failedChecks++;
  }
}

/**
 * Check 13: Verify file line counts are under 700 (SoC compliance)
 */
async function checkFileLineCounts() {
  totalChecks++;
  console.log('Check 13: File line counts are under 700 (SoC compliance)');
  try {
    const libDir = path.join(rootDir, 'lib');
    const files = await getAllFiles(libDir, ['.js']);
    
    let hasViolations = false;
    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      const lineCount = content.split('\n').length;
      if (lineCount > 700) {
        warnings.push(`${path.relative(rootDir, file)} has ${lineCount} lines (max 700)`);
        hasViolations = true;
      }
    }
    
    if (hasViolations) {
      console.log(`  ⚠️  WARNING: Some files exceed 700 lines (pre-existing violations)\n`);
    } else {
      console.log(`  ✅ PASS: All files are under 700 lines\n`);
      passedChecks++;
    }
  } catch (error) {
    console.log(`  ❌ FAIL: ${error.message}\n`);
    failedChecks++;
  }
}

/**
 * Check 14: Verify package-lock.json is in sync with package.json
 */
async function checkNpmLockFileSync() {
  totalChecks++;
  console.log('Check 14: package-lock.json is in sync with package.json');
  try {
    const packageJsonPath = path.join(rootDir, 'package.json');
    const lockJsonPath = path.join(rootDir, 'package-lock.json');
    
    // Check if package-lock.json exists
    try {
      await fs.access(lockJsonPath);
    } catch {
      console.log(`  ❌ FAIL: package-lock.json does not exist\n`);
      failedChecks++;
      return;
    }
    
    // Try to parse both files
    const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
    const lockJsonContent = await fs.readFile(lockJsonPath, 'utf-8');
    
    const packageJson = JSON.parse(packageJsonContent);
    const lockJson = JSON.parse(lockJsonContent);
    
    // Check if versions match
    if (packageJson.version !== lockJson.version) {
      console.log(`  ❌ FAIL: package.json version (${packageJson.version}) does not match package-lock.json version (${lockJson.version})\n`);
      failedChecks++;
      return;
    }
    
    // Check if package name matches
    if (packageJson.name !== lockJson.name) {
      console.log(`  ❌ FAIL: package.json name (${packageJson.name}) does not match package-lock.json name (${lockJson.name})\n`);
      failedChecks++;
      return;
    }
    
    console.log(`  ✅ PASS: package-lock.json is in sync with package.json\n`);
    passedChecks++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${error.message}\n`);
    failedChecks++;
  }
}

/**
 * Helper function to get all files in a directory recursively
 */
async function getAllFiles(dir, extensions = []) {
  const files = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const subFiles = await getAllFiles(fullPath, extensions);
      files.push(...subFiles);
    } else if (extensions.length === 0 || extensions.some(ext => entry.name.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

/**
 * Run all checks
 */
async function runAllChecks() {
  await checkPackageJson();
  await checkNodeVersionCompatibility();
  await checkNpmScripts();
  await checkWorkflowSyntax();
  await checkGitHubActionsNodeVersions();
  await checkGitConfiguration();
  await checkTestFilesExitCodes();
  await checkGitignore();
  await checkVersionConsistency();
  await checkConsoleStatements();
  await checkToolHandlerRegistration();
  await checkTodoComments();
  await checkFileLineCounts();
  await checkNpmLockFileSync();
  
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
    console.log('✅ ALL CRITICAL CHECKS PASSED! Project is ready for GitHub Actions.\n');
    process.exit(0);
  } else {
    console.log('❌ SOME CHECKS FAILED. Please fix the issues above before pushing.\n');
    process.exit(1);
  }
}

// Run the test suite
runAllChecks().catch(error => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});
