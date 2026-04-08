#!/usr/bin/env node
/**
 * PRE-FLIGHT CHECKLIST
 * Quick sanity checks before running full validation
 * Use this as a first pass to catch obvious issues
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('✈️  PRE-FLIGHT CHECKLIST\n');

const projectRoot = path.join(__dirname, '..');
const checklist = [];

// Quick checks
const checks = [
  {
    name: 'package.json exists',
    test: () => fs.existsSync(path.join(projectRoot, 'package.json')),
    fix: 'Create package.json'
  },
  {
    name: 'extension.js exists',
    test: () => fs.existsSync(path.join(projectRoot, 'extension.js')),
    fix: 'Create extension.js'
  },
  {
    name: 'dist/ directory built',
    test: () => fs.existsSync(path.join(projectRoot, 'dist')),
    fix: 'Run: npm run build'
  },
  {
    name: 'dist/extension.js exists',
    test: () => fs.existsSync(path.join(projectRoot, 'dist', 'extension.js')),
    fix: 'Run: npm run build'
  },
  {
    name: 'dist/mcp/server.js exists',
    test: () => fs.existsSync(path.join(projectRoot, 'dist', 'mcp', 'server.js')),
    fix: 'Run: npm run build'
  },
  {
    name: 'dist/mcp/package.json exists (CRITICAL)',
    test: () => fs.existsSync(path.join(projectRoot, 'dist', 'mcp', 'package.json')),
    fix: 'CRITICAL: Run npm run build (esbuild should copy package.json)'
  },
  {
    name: '.vsix package exists',
    test: () => {
      const files = fs.readdirSync(projectRoot).filter(f => f.endsWith('.vsix'));
      return files.length > 0;
    },
    fix: 'Run: vsce package'
  },
  {
    name: 'lib/tools/ directory exists',
    test: () => fs.existsSync(path.join(projectRoot, 'lib', 'tools')),
    fix: 'Create lib/tools/ directory'
  },
  {
    name: 'icon.png exists',
    test: () => fs.existsSync(path.join(projectRoot, 'icon.png')),
    fix: 'Add icon.png'
  }
];

let passed = 0;
let failed = 0;

for (const check of checks) {
  process.stdout.write(`   ${check.name}... `);
  
  try {
    const result = check.test();
    if (result) {
      console.log('✅');
      passed++;
    } else {
      console.log('❌');
      console.log(`      Fix: ${check.fix}`);
      failed++;
    }
  } catch (e) {
    console.log('❌');
    console.log(`      Error: ${e.message}`);
    console.log(`      Fix: ${check.fix}`);
    failed++;
  }
}

console.log('\n' + '='.repeat(50));
console.log(`Results: ${passed}/${checks.length} passed`);

if (failed > 0) {
  console.log('\n⚠️  Pre-flight checks incomplete');
  console.log('   Address the issues above before running full validation');
  console.log('\n   Next step:');
  console.log('   node scripts/release-validation.js');
  process.exit(1);
} else {
  console.log('\n✅ Pre-flight checks passed');
  console.log('   Ready for full validation:');
  console.log('   node scripts/release-validation.js');
  process.exit(0);
}
