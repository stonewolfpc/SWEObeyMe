import esbuild from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const isEnterprise = process.env.BUILD_MODE === 'enterprise';
const isDev = process.env.BUILD_MODE === 'dev';

// Enterprise modules are bundled normally - externalizing them breaks path resolution
// at runtime (esbuild emits relative paths that don't resolve correctly post-install)
const enterpriseModules = [];

// Helper function to copy package.json to dist/mcp/
function copyPackageJson() {
  const sourcePackageJson = join(__dirname, 'package.json');
  const targetPackageJson = join(__dirname, 'dist', 'mcp', 'package.json');

  try {
    fs.copyFileSync(sourcePackageJson, targetPackageJson);
    console.info('Copied package.json to dist/mcp/package.json');
  } catch (error) {
    console.error('Failed to copy package.json:', error);
    throw error;
  }
}

// Helper to recursively copy a directory
function copyRecursive(src, dest) {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    if (entry.isDirectory()) {
      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true });
      }
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Helper function to copy lib folder to dist/lib for dynamic imports
function copyLibFolder() {
  const sourceLib = join(__dirname, 'lib');
  const targetLib = join(__dirname, 'dist', 'lib');

  try {
    if (!fs.existsSync(targetLib)) {
      fs.mkdirSync(targetLib, { recursive: true });
    }
    copyRecursive(sourceLib, targetLib);
    console.log('Copied lib folder to dist/lib/');
  } catch (error) {
    console.error('Failed to copy lib folder:', error);
    throw error;
  }
}

// Helper function to copy ide_mcp_corpus to dist/mcp for MCP server runtime access
function copyCorpusFolder() {
  const sourceCorpus = join(__dirname, 'ide_mcp_corpus');
  const targetCorpus = join(__dirname, 'dist', 'mcp', 'ide_mcp_corpus');

  if (!fs.existsSync(sourceCorpus)) {
    console.log('ide_mcp_corpus not found at source, skipping copy.');
    return;
  }

  try {
    if (!fs.existsSync(targetCorpus)) {
      fs.mkdirSync(targetCorpus, { recursive: true });
    }
    copyRecursive(sourceCorpus, targetCorpus);
    console.log('Copied ide_mcp_corpus to dist/mcp/ide_mcp_corpus/');
  } catch (error) {
    console.error('Failed to copy ide_mcp_corpus:', error);
    throw error;
  }
}

// Helper function to copy tests folder to dist for cockpit validation tests
function copyTestsFolder() {
  const sourceTests = join(__dirname, 'tests');
  const targetTests = join(__dirname, 'dist', 'tests');

  if (!fs.existsSync(sourceTests)) {
    console.log('tests not found at source, skipping copy.');
    return;
  }

  try {
    if (!fs.existsSync(targetTests)) {
      fs.mkdirSync(targetTests, { recursive: true });
    }
    copyRecursive(sourceTests, targetTests);
    console.log('Copied tests to dist/tests/');
  } catch (error) {
    console.error('Failed to copy tests:', error);
    throw error;
  }
}

// Node.js built-ins - always external (provided by Node runtime)
const nodeBuiltins = [
  'fs', 'fs/promises', 'path', 'os', 'crypto', 'stream', 'util',
  'url', 'http', 'https', 'net', 'tls', 'child_process', 'events',
  'buffer', 'zlib', 'assert', 'readline', 'worker_threads', 'perf_hooks',
  'node:fs', 'node:path', 'node:os', 'node:crypto', 'node:stream',
  'node:util', 'node:url', 'node:http', 'node:https', 'node:net',
  'node:tls', 'node:child_process', 'node:events', 'node:buffer',
  'node:zlib', 'node:assert', 'node:readline', 'node:worker_threads',
  'node:perf_hooks', 'node:process', 'node:original-fs',
];

// Dev-only tools: dynamically required by detection/analysis logic only.
// Never statically imported, never needed at runtime in installed extension.
const devToolsExternal = [
  '@vue/compiler-sfc',
  'typescript',
  'madge',
  'eslint',
  'prettier',
  'cross-spawn',
  'express',
  'cors',
];

const commonConfig = {
  platform: 'node',
  target: 'node18',
  format: 'esm',
  sourcemap: isDev,
  minify: isProduction && !isDev,
  treeShaking: true,
  external: [...nodeBuiltins, ...devToolsExternal],
  logLevel: 'info',
};

// Extension bundle configuration
const extensionConfig = {
  ...commonConfig,
  entryPoints: [join(__dirname, 'extension.js')],
  outfile: join(__dirname, 'dist', 'extension.js'),
  bundle: true,
  external: [...nodeBuiltins, 'vscode'],
  define: {
    'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
    'process.env.BUILD_MODE': JSON.stringify(isEnterprise ? 'enterprise' : 'public'),
    '__dirname': '__dirname',
    '__filename': '__filename',
  },
};

// MCP server bundle configuration
const mcpConfig = {
  ...commonConfig,
  entryPoints: [join(__dirname, 'index.js')],
  outfile: join(__dirname, 'dist', 'mcp', 'server.js'),
  bundle: true,
  banner: {
    js: '#!/usr/bin/env node',
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
    'process.env.BUILD_MODE': JSON.stringify(isEnterprise ? 'enterprise' : 'public'),
    '__dirname': '__dirname',
    '__filename': '__filename',
  },
};

// Sync built dist to the installed Windsurf extension directory (dev convenience)
function syncToInstalledExtension() {
  const extBase = join(os.homedir(), '.windsurf-next', 'extensions');
  if (!fs.existsSync(extBase)) return;

  const candidates = fs.readdirSync(extBase).filter(n => n.startsWith('stonewolfpc.swe-obey-me-'));
  if (candidates.length === 0) return;

  // Pick the highest version
  candidates.sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
  const target = join(extBase, candidates[0], 'dist');
  if (!fs.existsSync(target)) return;

  const src = join(__dirname, 'dist');
  try {
    fs.copyFileSync(join(src, 'extension.js'), join(target, 'extension.js'));
    fs.copyFileSync(join(src, 'mcp', 'server.js'), join(target, 'mcp', 'server.js'));
    fs.copyFileSync(join(src, 'mcp', 'package.json'), join(target, 'mcp', 'package.json'));
    copyRecursive(join(src, 'lib'), join(target, 'lib'));
    console.log(`Synced to installed extension: ${candidates[0]}`);
  } catch (err) {
    console.warn(`Sync to installed extension failed: ${err.message}`);
  }
}

// Public build - excludes enterprise modules
async function buildPublic() {
  console.log('Building public bundle...');

  await esbuild.build({
    ...extensionConfig,
    external: [...extensionConfig.external, ...enterpriseModules.map((m) => `./${m}`)],
  });

  await esbuild.build({
    ...mcpConfig,
    external: [...mcpConfig.external, ...enterpriseModules.map((m) => `./${m}`)],
  });

  // Copy package.json for MCP server
  copyPackageJson();

  // Copy lib folder for dynamic imports
  copyLibFolder();

  // Copy documentation corpus for MCP server
  copyCorpusFolder();

  // Copy tests folder for cockpit validation tests
  copyTestsFolder();

  // Sync to installed Windsurf extension for live dev testing
  syncToInstalledExtension();

  console.log('Public bundle built successfully!');
}

// Enterprise build - includes all modules
async function buildEnterprise() {
  console.log('Building enterprise bundle...');

  await esbuild.build(extensionConfig);
  await esbuild.build(mcpConfig);

  // Copy package.json for MCP server
  copyPackageJson();

  // Copy lib folder for dynamic imports
  copyLibFolder();

  // Copy documentation corpus for MCP server
  copyCorpusFolder();

  // Copy tests folder for cockpit validation tests
  copyTestsFolder();

  syncToInstalledExtension();

  console.log('Enterprise bundle built successfully!');
}

// Dev build - includes sourcemaps and no minification
async function buildDev() {
  console.log('Building dev bundle...');

  await esbuild.build({
    ...extensionConfig,
    sourcemap: true,
    minify: false,
  });

  await esbuild.build({
    ...mcpConfig,
    sourcemap: true,
    minify: false,
  });

  // Copy package.json for MCP server
  copyPackageJson();

  // Copy lib folder for dynamic imports
  copyLibFolder();

  // Copy documentation corpus for MCP server
  copyCorpusFolder();

  // Copy tests folder for cockpit validation tests
  copyTestsFolder();

  syncToInstalledExtension();

  console.log('Dev bundle built successfully!');
}

// Watch mode for development
async function buildWatch() {
  console.log('Building in watch mode...');

  const ctxExtension = await esbuild.context({
    ...extensionConfig,
    sourcemap: true,
    minify: false,
  });

  const ctxMcp = await esbuild.context({
    ...mcpConfig,
    sourcemap: true,
    minify: false,
  });

  await ctxExtension.watch();
  await ctxMcp.watch();

  // Copy package.json for MCP server
  copyPackageJson();

  // Copy lib folder for dynamic imports
  copyLibFolder();

  // Copy documentation corpus for MCP server
  copyCorpusFolder();

  console.log('Watching for changes...');
}

// Main build function
async function build() {
  const mode = process.env.BUILD_MODE || 'public';

  try {
    if (mode === 'enterprise') {
      await buildEnterprise();
    } else if (mode === 'dev') {
      await buildDev();
    } else {
      await buildPublic();
    }
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

// Run build
build();

export { buildPublic, buildEnterprise, buildDev, buildWatch };
