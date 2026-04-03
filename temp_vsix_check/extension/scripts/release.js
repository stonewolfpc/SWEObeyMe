#!/usr/bin/env node

/**
 * Automated Release Script for SWEObeyMe
 * Usage: node scripts/release.js <version> [options]
 * Options:
 *   --dry-run: Test the release without actually publishing
 *   --skip-tests: Skip running tests
 *   --skip-build: Skip building packages
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function error(message) {
  log(`✗ ${message}`, colors.red);
}

function success(message) {
  log(`✓ ${message}`, colors.green);
}

function info(message) {
  log(`ℹ ${message}`, colors.blue);
}

function warning(message) {
  log(`⚠ ${message}`, colors.yellow);
}

// Parse command line arguments
const args = process.argv.slice(2);
const version = args[0];
const options = {
  dryRun: args.includes('--dry-run'),
  skipTests: args.includes('--skip-tests'),
  skipBuild: args.includes('--skip-build'),
};

if (!version) {
  error('Version is required');
  console.log('Usage: node scripts/release.js <version> [options]');
  console.log('Options:');
  console.log('  --dry-run: Test the release without actually publishing');
  console.log('  --skip-tests: Skip running tests');
  console.log('  --skip-build: Skip building packages');
  process.exit(1);
}

// Validate version format
if (!/^(\d+\.\d+\.\d+)(-[a-z]+\.\d+)?$/.test(version)) {
  error(`Invalid version format: ${version}`);
  console.log('Expected format: 1.0.13 or 1.0.13-beta.1');
  process.exit(1);
}

async function runCommand(command, cwd = rootDir, silent = false) {
  try {
    const output = execSync(command, {
      cwd,
      stdio: silent ? 'pipe' : 'inherit',
      shell: true,
    });
    return output?.toString().trim();
  } catch (error) {
    throw new Error(`Command failed: ${command}\n${error.message}`);
  }
}

async function checkGitStatus() {
  info('Checking git status...');
  const status = await runCommand('git status --porcelain');
  if (status) {
    error('Working directory is not clean');
    console.log('Please commit or stash your changes first:');
    console.log(status);
    process.exit(1);
  }
  success('Git status is clean');
}

async function runTests() {
  if (options.skipTests) {
    warning('Skipping tests');
    return;
  }

  info('Running tests...');

  try {
    // Run npm test
    await runCommand('npm test');
    success('All npm tests passed');
  } catch (error) {
    error('Tests failed');
    process.exit(1);
  }

  try {
    // Run MCP server integration test
    await runCommand('node test-mcp-server.js');
    success('MCP server integration tests passed');
  } catch (error) {
    error('MCP server integration tests failed');
    process.exit(1);
  }

  try {
    // Run MCP protocol compliance test
    await runCommand('node test-mcp-protocol-compliance.js');
    success('MCP protocol compliance tests passed');
  } catch (error) {
    error('MCP protocol compliance tests failed');
    process.exit(1);
  }
}

async function updateVersion() {
  info(`Updating version to ${version}...`);

  // Update package.json
  const packageJsonPath = path.join(rootDir, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  packageJson.version = version;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  success('Updated package.json');

  // Update index.js
  const indexPath = path.join(rootDir, 'index.js');
  let indexContent = fs.readFileSync(indexPath, 'utf-8');
  indexContent = indexContent.replace(/version: "1\.0\.\d+"/, `version: "${version}"`);
  fs.writeFileSync(indexPath, indexContent);
  success('Updated index.js');

  // Update extension-package.json
  const extPackageJsonPath = path.join(rootDir, 'extension-package.json');
  const extPackageJson = JSON.parse(fs.readFileSync(extPackageJsonPath, 'utf-8'));
  extPackageJson.version = version;
  fs.writeFileSync(extPackageJsonPath, JSON.stringify(extPackageJson, null, 2));
  success('Updated extension-package.json');
}

async function createReleaseBranch() {
  info(`Creating release branch release/v${version}...`);
  try {
    await runCommand(`git checkout -b release/v${version}`);
    success(`Created release branch release/v${version}`);
  } catch (error) {
    // Branch might already exist
    warning(`Branch release/v${version} already exists, switching to it`);
    await runCommand(`git checkout release/v${version}`);
  }
}

async function commitVersionChanges() {
  info('Committing version changes...');
  await runCommand('git add package.json index.js extension-package.json');
  await runCommand(`git commit -m "chore: bump version to ${version}"`);
  success('Committed version changes');
}

async function createTag() {
  info(`Creating tag v${version}...`);
  try {
    await runCommand(`git tag -a v${version} -m "Release v${version}"`);
    success(`Created tag v${version}`);
  } catch (error) {
    error('Failed to create tag');
    process.exit(1);
  }
}

async function buildPackages() {
  if (options.skipBuild) {
    warning('Skipping package builds');
    return;
  }

  info('Building distribution packages...');

  // Create release directory
  const releaseDir = path.join(rootDir, 'release', `SWEObeyMe-${version}`);
  fs.mkdirSync(releaseDir, { recursive: true });

  // Copy required files
  const filesToCopy = [
    'lib',
    'index.js',
    'quotes.js',
    'package.json',
    'package-lock.json',
    'README.md',
    'LICENSE',
    'setup.bat',
    '.windsurfrules',
    'extension.js',
    'extension-package.json',
    '.gitignore',
    'CHANGELOG.md',
    'PUBLISH.md',
    'RELEASE_MANAGEMENT.md',
  ];

  for (const file of filesToCopy) {
    const src = path.join(rootDir, file);
    const dest = path.join(releaseDir, file);

    if (fs.existsSync(src)) {
      if (fs.statSync(src).isDirectory()) {
        fs.cpSync(src, dest, { recursive: true });
      } else {
        fs.copyFileSync(src, dest);
      }
      success(`Copied ${file}`);
    } else {
      warning(`File not found: ${file}`);
    }
  }

  // Create ZIP
  info('Creating ZIP package...');
  const zipPath = path.join(rootDir, 'release', `SWEObeyMe-${version}.zip`);
  if (process.platform === 'win32') {
    await runCommand(
      `powershell -Command "Compress-Archive -Path '${releaseDir}' -DestinationPath '${zipPath}' -Force"`
    );
  } else {
    await runCommand(
      `cd ${path.dirname(releaseDir)} && zip -r SWEObeyMe-${version}.zip SWEObeyMe-${version}/`
    );
  }
  success(`Created ZIP package: ${zipPath}`);

  // Build VSIX
  info('Building VSIX extension...');
  await runCommand('npx vsce package');
  success('Built VSIX extension');
}

async function pushToRemote() {
  if (options.dryRun) {
    warning('Dry run: skipping git push');
    return;
  }

  info('Pushing to remote...');
  await runCommand('git push origin main');
  await runCommand(`git push origin release/v${version}`);
  await runCommand(`git push origin v${version}`);
  success('Pushed to remote');
}

async function main() {
  log('═══════════════════════════════════════════════════════════════', colors.cyan);
  log(`SWEObeyMe Release Script v${version}`, colors.cyan);
  log('═══════════════════════════════════════════════════════════════', colors.cyan);
  console.log();

  if (options.dryRun) {
    warning('DRY RUN MODE - No changes will be pushed');
  }

  try {
    // Step 1: Check git status
    await checkGitStatus();

    // Step 2: Run tests
    await runTests();

    // Step 3: Update version
    await updateVersion();

    // Step 4: Create release branch
    await createReleaseBranch();

    // Step 5: Commit version changes
    await commitVersionChanges();

    // Step 6: Create tag
    await createTag();

    // Step 7: Build packages
    await buildPackages();

    // Step 8: Push to remote
    await pushToRemote();

    console.log();
    log('═══════════════════════════════════════════════════════════════', colors.green);
    log('Release preparation complete!', colors.green);
    log('═══════════════════════════════════════════════════════════════', colors.green);
    console.log();
    info('Next steps:');
    console.log('1. Review the changes: git log --oneline -5');
    console.log('2. Create GitHub release manually:');
    console.log(`   - Go to https://github.com/stonewolfpc/SWEObeyMe/releases/new`);
    console.log(`   - Select tag: v${version}`);
    console.log(`   - Title: v${version} - [Release Title]`);
    console.log('   - Copy release notes from CHANGELOG.md');
    console.log(`   - Attach: SWEObeyMe-${version}.zip`);
    console.log(`   - Attach: sweobeyme-${version}.vsix`);
    console.log('3. Publish release');
    console.log('4. Update main branch for next development:');
    console.log('   git checkout main');
    console.log('   git merge release/v' + version);
    console.log('   npm version patch');
    console.log('   git push origin main');
  } catch (err) {
    console.log();
    error(`Release failed: ${err.message}`);
    console.log();
    info('To clean up failed release:');
    console.log('  git checkout main');
    console.log(`  git branch -D release/v${version}`);
    console.log(`  git tag -d v${version}`);
    console.log('  git push origin --delete release/v' + version);
    console.log(`  git push origin --delete v${version}`);
    process.exit(1);
  }
}

main();
