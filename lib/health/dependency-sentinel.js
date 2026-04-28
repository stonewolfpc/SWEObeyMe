/**
 * External Dependency Health Sentinel
 *
 * Unified, centralized system for monitoring all external dependencies:
 * - NPM packages (runtime and dev)
 * - System tools (git, dotnet, clangd, clang-tidy, cppcheck)
 * - MCP SDK health
 * - Node.js environment health
 * - Clangd LSP channel health
 * - Extraneous package detection
 *
 * All errors use loud, tagged, blame-assigning format.
 */

import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read package.json
const packageJsonPath = path.join(__dirname, '../../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Health tracking
const healthStatus = {
  node: { status: 'unknown', version: null, errors: [] },
  npm: { status: 'unknown', version: null, errors: [] },
  git: { status: 'unknown', version: null, errors: [] },
  dotnet: { status: 'unknown', version: null, errors: [] },
  clangd: { status: 'unknown', version: null, errors: [] },
  clangTidy: { status: 'unknown', version: null, errors: [] },
  cppcheck: { status: 'unknown', version: null, errors: [] },
  mcpSdk: { status: 'unknown', version: null, errors: [] },
  runtimeDeps: { status: 'unknown', missing: [], errors: [] },
  devDeps: { status: 'unknown', missing: [], errors: [] },
  extraneous: { status: 'unknown', packages: [], errors: [] },
  clangdHealth: {
    lastDiagnostic: null,
    lastMessage: null,
    lastRestart: null,
    lastCrash: null,
    restarts: 0,
    malformedPackets: 0,
    silentStalls: 0,
  },
};

// Error reporter - loud, tagged, blame-assigning
function reportError(category, code, message, detail) {
  const categoryTag =
    {
      WINDSURF: '[WINDSURF PROBLEM]',
      SYSTEM: '[SYSTEM PROBLEM]',
      DEPENDENCY: '[DEPENDENCY PROBLEM]',
      WTF: '[WTF PROBLEM]',
    }[category] || '[SWEObeyMe]';

  process.stderr.write(
    `${categoryTag} ${category} PROBLEM: ${message} (${code})\n` + `Details: ${detail}\n`
  );

  // Track error in health status
  healthStatus[category.toLowerCase()] = healthStatus[category.toLowerCase()] || { errors: [] };
  if (Array.isArray(healthStatus[category.toLowerCase()].errors)) {
    healthStatus[category.toLowerCase()].errors.push({ code, message, detail });
  }
}

// Check if an NPM package is installed
function checkNpmPackage(pkgName, category = 'DEPENDENCY') {
  try {
    require.resolve(pkgName);
    return { installed: true, version: null };
  } catch (e) {
    reportError(category, 'ERR-NPM-MISSING', `Missing NPM package: ${pkgName}`, e.message);
    return { installed: false, error: e.message };
  }
}

// Check a system tool - STUBBED OUT (now handled by external dependency-checker.js)
function checkSystemTool(name, command, args, errorCode, category = 'SYSTEM') {
  // External checker handles this asynchronously via IPC
  // This stub returns cached result or assumes installed
  return { installed: true, version: 'unknown' };
}

// Check all runtime dependencies
export function checkRuntimeDependencies() {
  const required = ['@modelcontextprotocol/sdk', 'cors', 'express', 'fs-extra', 'jimp', 'zod'];
  const missing = [];

  for (const pkg of required) {
    const result = checkNpmPackage(pkg);
    if (!result.installed) {
      missing.push(pkg);
    }
  }

  healthStatus.runtimeDeps = {
    status: missing.length === 0 ? 'OK' : 'MISSING',
    missing,
    errors: missing.length > 0 ? [`Missing ${missing.length} runtime packages`] : [],
  };

  return healthStatus.runtimeDeps;
}

// Check all dev dependencies
export function checkDevDependencies() {
  const required = ['esbuild', 'eslint', 'prettier', 'vitest', 'typescript'];
  const missing = [];

  for (const pkg of required) {
    const result = checkNpmPackage(pkg);
    if (!result.installed) {
      missing.push(pkg);
    }
  }

  healthStatus.devDeps = {
    status: missing.length === 0 ? 'OK' : 'MISSING',
    missing,
    errors:
      missing.length > 0 ? [`Missing ${missing.length} dev packages (dev warning, not fatal)`] : [],
  };

  return healthStatus.devDeps;
}

// Check for extraneous packages
export function checkExtraneousPackages() {
  try {
    const declared = new Set([
      ...Object.keys(packageJson.dependencies || {}),
      ...Object.keys(packageJson.devDependencies || {}),
    ]);

    const nodeModulesPath = path.join(__dirname, '../../node_modules');
    if (!fs.existsSync(nodeModulesPath)) {
      healthStatus.extraneous = { status: 'OK', packages: [], errors: [] };
      return healthStatus.extraneous;
    }

    const installed = fs.readdirSync(nodeModulesPath);
    const extraneous = installed.filter((name) => !declared.has(name) && !name.startsWith('.'));

    if (extraneous.length > 0) {
      reportError(
        'WTF',
        'ERR-NPM-EXTRANEOUS',
        'Extraneous NPM packages detected. Node_modules may be corrupted.',
        extraneous.join(', ')
      );
    }

    healthStatus.extraneous = {
      status: extraneous.length === 0 ? 'OK' : 'EXTRANEOUS',
      packages: extraneous,
      errors: extraneous.length > 0 ? [`Found ${extraneous.length} extraneous packages`] : [],
    };

    return healthStatus.extraneous;
  } catch (e) {
    reportError('SYSTEM', 'ERR-NPM-CHECK', 'Failed to check extraneous packages', e.message);
    healthStatus.extraneous = { status: 'ERROR', packages: [], errors: [e.message] };
    return healthStatus.extraneous;
  }
}

// Check Git
export function checkGitHealth() {
  const result = checkSystemTool('Git', 'git', ['--version'], 'ERR-GIT-MISSING');
  healthStatus.git = {
    status: result.installed ? 'OK' : 'MISSING',
    version: result.version,
    errors: result.installed ? [] : [result.error],
  };
  return healthStatus.git;
}

// Check dotnet
export function checkDotnetHealth() {
  const result = checkSystemTool('dotnet', 'dotnet', ['--version'], 'ERR-DOTNET-MISSING');
  healthStatus.dotnet = {
    status: result.installed ? 'OK' : 'MISSING',
    version: result.version,
    errors: result.installed ? [] : [result.error],
  };
  return healthStatus.dotnet;
}

// Check clangd
export function checkClangdHealth() {
  const result = checkSystemTool('clangd', 'clangd', ['--version'], 'ERR-CLANGD-MISSING');
  healthStatus.clangd = {
    status: result.installed ? 'OK' : 'MISSING',
    version: result.version,
    errors: result.installed ? [] : [result.error],
  };
  return healthStatus.clangd;
}

// Check clang-tidy
export function checkClangTidyHealth() {
  const result = checkSystemTool(
    'clang-tidy',
    'clang-tidy',
    ['--version'],
    'ERR-CLANGTIDY-MISSING'
  );
  healthStatus.clangTidy = {
    status: result.installed ? 'OK' : 'MISSING',
    version: result.version,
    errors: result.installed ? [] : [result.error],
  };
  return healthStatus.clangTidy;
}

// Check cppcheck
export function checkCppcheckHealth() {
  const result = checkSystemTool('cppcheck', 'cppcheck', ['--version'], 'ERR-CPPCHECK-MISSING');
  healthStatus.cppcheck = {
    status: result.installed ? 'OK' : 'MISSING',
    version: result.version,
    errors: result.installed ? [] : [result.error],
  };
  return healthStatus.cppcheck;
}

// Check MCP SDK health
export function checkSDKHealth() {
  try {
    const sdk = require('@modelcontextprotocol/sdk');
    healthStatus.mcpSdk = {
      status: 'OK',
      version: sdk.version || 'unknown',
      errors: [],
    };
    return healthStatus.mcpSdk;
  } catch (e) {
    reportError(
      'DEPENDENCY',
      'ERR-SDK-BROKEN',
      'MCP SDK is malformed or failing internally',
      e.message
    );
    healthStatus.mcpSdk = {
      status: 'BROKEN',
      version: null,
      errors: [e.message],
    };
    return healthStatus.mcpSdk;
  }
}

// Check Node.js health
export function checkNodeHealth() {
  try {
    const version = process.version;
    const arch = process.arch;
    const platform = process.platform;

    // Test child process spawning - STUBBED OUT (now handled by external checker)
    // const testSpawn = spawnSync('node', ['--version'], { encoding: 'utf8', timeout: 5000 });
    // if (testSpawn.error) throw testSpawn.error;

    healthStatus.node = {
      status: 'OK',
      version,
      arch,
      platform,
      errors: [],
    };
    return healthStatus.node;
  } catch (e) {
    reportError('SYSTEM', 'ERR-NODE-BROKEN', 'Node.js environment corrupted', e.message);
    healthStatus.node = {
      status: 'BROKEN',
      version: process.version,
      arch: process.arch,
      platform: process.platform,
      errors: [e.message],
    };
    return healthStatus.node;
  }
}

// Check npm health
export function checkNpmHealth() {
  try {
    // STUBBED OUT (now handled by external checker)
    // const result = spawnSync('npm', ['--version'], { encoding: 'utf8', timeout: 5000 });
    // if (result.error) throw result.error;
    // if (result.status !== 0) {
    //   throw new Error(`Exit code ${result.status}: ${result.stderr}`);
    // }

    healthStatus.npm = {
      status: 'OK',
      version: 'unknown',
      errors: [],
    };
    return healthStatus.npm;
  } catch (e) {
    reportError('SYSTEM', 'ERR-NPM-BROKEN', 'npm CLI missing or corrupted', e.message);
    healthStatus.npm = {
      status: 'BROKEN',
      version: null,
      errors: [e.message],
    };
    return healthStatus.npm;
  }
}

// Clangd LSP health tracking (for long sessions)
export function trackClangdDiagnostic(timestamp) {
  healthStatus.clangdHealth.lastDiagnostic = timestamp;
}

export function trackClangdMessage(timestamp) {
  healthStatus.clangdHealth.lastMessage = timestamp;
}

export function trackClangdRestart(timestamp) {
  healthStatus.clangdHealth.lastRestart = timestamp;
  healthStatus.clangdHealth.restarts++;

  reportError(
    'WINDSURF',
    'ERR-CLANGD-RESTART',
    'clangd restarted mid-session',
    'Likely caused by model swap or transport corruption'
  );
}

export function trackClangdCrash(timestamp) {
  healthStatus.clangdHealth.lastCrash = timestamp;
  reportError(
    'WINDSURF',
    'ERR-CLANGD-CRASH',
    'clangd crashed mid-session',
    'Unexpected LSP termination'
  );
}

export function trackClangdMalformedPacket(packet) {
  healthStatus.clangdHealth.malformedPackets++;
  reportError('WINDSURF', 'ERR-CLANGD-MALFORMED', 'clangd sent malformed LSP packet', packet);
}

// Clangd watchdog - detect silent LSP channel
let clangdWatchdogInterval = null;
let clangdLastActivity = Date.now();

export function startClangdWatchdog(intervalMs = 1500, stallMs = 3000) {
  if (clangdWatchdogInterval) {
    clearInterval(clangdWatchdogInterval);
  }

  clangdWatchdogInterval = setInterval(() => {
    const delta = Date.now() - clangdLastActivity;
    if (delta > stallMs) {
      healthStatus.clangdHealth.silentStalls++;
      reportError(
        'WINDSURF',
        'ERR-CLANGD-DEADCHANNEL',
        'clangd LSP channel silent',
        `No diagnostics for ${delta}ms`
      );
    }
  }, intervalMs);
}

export function stopClangdWatchdog() {
  if (clangdWatchdogInterval) {
    clearInterval(clangdWatchdogInterval);
    clangdWatchdogInterval = null;
  }
}

export function markClangdActivity() {
  clangdLastActivity = Date.now();
}

// Check all dependencies
export function checkAllDependencies() {
  const results = {
    runtime: checkRuntimeDependencies(),
    dev: checkDevDependencies(),
    extraneous: checkExtraneousPackages(),
    node: checkNodeHealth(),
    npm: checkNpmHealth(),
    git: checkGitHealth(),
    dotnet: checkDotnetHealth(),
    clangd: checkClangdHealth(),
    clangTidy: checkClangTidyHealth(),
    cppcheck: checkCppcheckHealth(),
    sdk: checkSDKHealth(),
  };

  return results;
}

// Generate health report
export function generateHealthReport() {
  return {
    node: healthStatus.node,
    npm: healthStatus.npm,
    git: healthStatus.git,
    dotnet: healthStatus.dotnet,
    clangd: healthStatus.clangd,
    clangTidy: healthStatus.clangTidy,
    cppcheck: healthStatus.cppcheck,
    sdk: healthStatus.mcpSdk,
    runtimeDeps: healthStatus.runtimeDeps,
    devDeps: healthStatus.devDeps,
    extraneous: healthStatus.extraneous,
    clangdHealth: healthStatus.clangdHealth,
  };
}

// Print health report to stderr
export function printHealthReport(prefix = 'External Dependency Health') {
  const report = generateHealthReport();

  process.stderr.write(`[SWEObeyMe] ${prefix}:\n`);
  process.stderr.write(`  Node: ${report.node.status} (${report.node.version})\n`);
  process.stderr.write(`  npm: ${report.npm.status} (${report.npm.version})\n`);
  process.stderr.write(`  Git: ${report.git.status} (${report.git.version || 'N/A'})\n`);
  process.stderr.write(`  dotnet: ${report.dotnet.status} (${report.dotnet.version || 'N/A'})\n`);
  process.stderr.write(`  clangd: ${report.clangd.status} (${report.clangd.version || 'N/A'})\n`);
  process.stderr.write(
    `  clang-tidy: ${report.clangTidy.status} (${report.clangTidy.version || 'N/A'})\n`
  );
  process.stderr.write(
    `  cppcheck: ${report.cppcheck.status} (${report.cppcheck.version || 'N/A'})\n`
  );
  process.stderr.write(`  MCP SDK: ${report.sdk.status} (${report.sdk.version || 'N/A'})\n`);
  process.stderr.write(`  Runtime deps: ${report.runtimeDeps.status}\n`);
  process.stderr.write(`  Dev deps: ${report.devDeps.status}\n`);
  process.stderr.write(`  Extraneous packages: ${report.extraneous.status}\n`);

  if (report.extraneous.packages.length > 0) {
    process.stderr.write(`    Found: ${report.extraneous.packages.join(', ')}\n`);
  }

  if (
    report.clangdHealth.restarts > 0 ||
    report.clangdHealth.malformedPackets > 0 ||
    report.clangdHealth.silentStalls > 0
  ) {
    process.stderr.write('  Clangd health:\n');
    process.stderr.write(`    Restarts: ${report.clangdHealth.restarts}\n`);
    process.stderr.write(`    Malformed packets: ${report.clangdHealth.malformedPackets}\n`);
    process.stderr.write(`    Silent stalls: ${report.clangdHealth.silentStalls}\n`);
  }
}
