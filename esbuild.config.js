import esbuild from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const isEnterprise = process.env.BUILD_MODE === 'enterprise';
const isDev = process.env.BUILD_MODE === 'dev';

// Enterprise modules to exclude in public builds
const enterpriseModules = [
  'lib/api-key-manager.js',
  'lib/audit-logger.js',
  'lib/backup-manager.js',
  'lib/checkpoint-manager.js',
  'lib/diff-review-manager.js',
  'lib/metrics-manager.js',
  'lib/permission-manager.js',
  'lib/policy-as-code-manager.js',
  'lib/provider-manager.js',
  'lib/quota-manager.js',
  'lib/skills-marketplace-manager.js',
  'lib/tools/patreon-handlers.js',
  'lib/tools/registry-patreon.js',
];

const commonConfig = {
  platform: 'node',
  target: 'node18',
  format: 'esm',
  sourcemap: isDev,
  minify: isProduction && !isDev,
  treeShaking: true,
  external: ['vscode'],
  logLevel: 'info',
};

// Extension bundle configuration
const extensionConfig = {
  ...commonConfig,
  entryPoints: [join(__dirname, 'extension.js')],
  outfile: join(__dirname, 'dist', 'extension.js'),
  bundle: true,
  define: {
    'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
    'process.env.BUILD_MODE': JSON.stringify(isEnterprise ? 'enterprise' : 'public'),
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
  },
};

// Public build - excludes enterprise modules
async function buildPublic() {
  console.log('Building public bundle...');
  
  await esbuild.build({
    ...extensionConfig,
    external: [
      ...extensionConfig.external,
      ...enterpriseModules.map(m => `./${m}`),
    ],
  });
  
  await esbuild.build({
    ...mcpConfig,
    external: [
      ...mcpConfig.external,
      ...enterpriseModules.map(m => `./${m}`),
    ],
  });
  
  console.log('Public bundle built successfully!');
}

// Enterprise build - includes all modules
async function buildEnterprise() {
  console.log('Building enterprise bundle...');
  
  await esbuild.build(extensionConfig);
  await esbuild.build(mcpConfig);
  
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
