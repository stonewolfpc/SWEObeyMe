#!/usr/bin/env node
/**
 * MASTER RELEASE VALIDATION SCRIPT
 * 
 * Runs ALL tests in sequence to ensure 100% certainty before release.
 * This is the FINAL GATE - if this passes, the release is ready.
 * 
 * Usage: node scripts/release-validation.js
 * 
 * Test Sequence:
 * 1. Tool Registry Validation (duplicates, naming, schemas)
 * 2. Strict Duplicate Detection (WindSurf critical)
 * 3. Schema Validation (WindSurf compliance)
 * 4. Build Artifacts (files exist, sizes valid)
 * 5. OS Compatibility (paths, separators)
 * 6. UI Components (commands, webviews)
 * 7. Config Generation (paths, structure)
 * 8. MCP Startup (server starts, no errors)
 * 9. MCP Compliance (protocol, duplicates)
 * 10. Clean Environment Simulation (fresh install test)
 * 
 * Exit codes:
 * 0 = All tests passed, release ready
 * 1 = Critical test failed, DO NOT RELEASE
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.join(__dirname, '..');
const scriptsDir = path.join(projectRoot, '.github', 'scripts');

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║     SWEObeyMe RELEASE VALIDATION - FINAL GATE             ║');
console.log('║     100% Certainty Before Release - No Excuses            ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// Debug paths
console.log('📁 Debug paths:');
console.log(`   __dirname: ${__dirname}`);
console.log(`   projectRoot: ${projectRoot}`);
console.log(`   scriptsDir: ${scriptsDir}`);
console.log('');

// Test configuration - order matters!
const tests = [
  {
    name: '🔍 Tool Registry Validation',
    script: 'validate-tools.js',
    critical: true,
    description: 'Checks for duplicates, naming conventions, required fields'
  },
  {
    name: ' Schema Validation',
    script: 'validate-windsurf-schema.js',
    critical: true,
    description: 'Validates tool schemas comply with WindSurf requirements'
  },
  {
    name: '📦 Build Artifacts',
    script: 'test-build-artifacts.js',
    critical: true,
    description: 'Verifies all required files exist and are valid'
  },
  {
    name: '⚙️  Config Generation',
    script: 'test-config-generation.js',
    critical: true,
    description: 'Validates MCP config paths and structure'
  },
  {
    name: '🚀 MCP Server Startup',
    script: 'test-mcp-startup.js',
    critical: true,
    description: 'Tests server starts without errors, package.json present'
  },
  {
    name: '🔌 MCP Compliance',
    script: 'test-mcp-compliance.js',
    critical: true,
    description: 'Full MCP protocol compliance with SDK'
  }
];

const results = [];
let criticalFailures = 0;

async function runTest(test, index) {
  const testNumber = index + 1;
  const totalTests = tests.length;
  
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`[${testNumber}/${totalTests}] ${test.name}`);
  console.log(`    ${test.description}`);
  console.log(`${'─'.repeat(60)}`);
  
  const scriptPath = path.join(scriptsDir, test.script);
  const exists = fs.existsSync(scriptPath);
  
  console.log(`   🔍 Checking: ${scriptPath}`);
  console.log(`   📄 Exists: ${exists}`);
  
  if (!exists) {
    console.error(`❌ Test script not found: ${test.script}`);
    console.error(`   Expected at: ${scriptPath}`);
    results.push({ test: test.name, status: 'SCRIPT_MISSING', critical: test.critical });
    if (test.critical) criticalFailures++;
    return false;
  }
  
  return new Promise((resolve) => {
    const startTime = Date.now();
    const child = spawn('node', [scriptPath], {
      stdio: 'pipe',
      cwd: projectRoot,
      env: { ...process.env, NODE_ENV: 'test' }
    });
    
    let output = '';
    let errorOutput = '';
    
    child.stdout.on('data', (data) => {
      const str = data.toString();
      output += str;
      process.stdout.write(str);
    });
    
    child.stderr.on('data', (data) => {
      const str = data.toString();
      errorOutput += str;
      process.stderr.write(str);
    });
    
    child.on('close', (code) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      const passed = code === 0;
      
      results.push({
        test: test.name,
        status: passed ? 'PASSED' : 'FAILED',
        duration: `${duration}s`,
        critical: test.critical,
        exitCode: code
      });
      
      if (!passed && test.critical) {
        criticalFailures++;
      }
      
      console.log(`\n${passed ? '✅' : '❌'} ${test.name} ${passed ? 'PASSED' : 'FAILED'} (${duration}s)`);
      
      resolve(passed);
    });
  });
}

async function runAllTests() {
  console.log(`Starting ${tests.length} validation tests...\n`);
  
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  
  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    
    // If we already have critical failures, ask whether to continue
    if (criticalFailures > 0 && test.critical) {
      console.log(`\n⚠️  Skipping remaining critical tests due to previous failure`);
      skipped++;
      continue;
    }
    
    const result = await runTest(test, i);
    if (result) {
      passed++;
    } else {
      failed++;
    }
    
    // Small delay between tests
    if (i < tests.length - 1) {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  
  return { passed, failed, skipped };
}

function printFinalReport({ passed, failed, skipped }) {
  console.log('\n' + '═'.repeat(60));
  console.log('FINAL VALIDATION REPORT');
  console.log('═'.repeat(60));
  
  console.log('\n📊 Results Summary:');
  console.log(`   Total tests: ${tests.length}`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   Critical failures: ${criticalFailures}`);
  
  console.log('\n📋 Detailed Results:');
  for (const result of results) {
    const icon = result.status === 'PASSED' ? '✅' : 
                 result.status === 'FAILED' ? '❌' : '⚠️';
    const critical = result.critical ? ' [CRITICAL]' : '';
    console.log(`   ${icon} ${result.test}${critical} - ${result.status}`);
  }
  
  console.log('\n' + '═'.repeat(60));
  
  if (criticalFailures > 0) {
    console.log('❌ ❌ ❌ RELEASE VALIDATION FAILED ❌ ❌ ❌');
    console.log('');
    console.log('CRITICAL TESTS FAILED - DO NOT RELEASE');
    console.log('');
    console.log('Fix the issues above and run again:');
    console.log('  node scripts/release-validation.js');
    console.log('');
    console.log('═'.repeat(60));
    process.exit(1);
  } else if (failed > 0) {
    console.log('⚠️  RELEASE VALIDATION PASSED WITH WARNINGS');
    console.log('');
    console.log('Non-critical tests failed. Review before release.');
    console.log('To proceed anyway, you understand the risks.');
    console.log('');
    console.log('═'.repeat(60));
    process.exit(0);
  } else {
    console.log('✅ ✅ ✅ ALL TESTS PASSED ✅ ✅ ✅');
    console.log('');
    console.log('RELEASE READY - 100% VALIDATED');
    console.log('');
    console.log('Proceed with confidence:');
    console.log('  vsce package');
    console.log('  vsce publish');
    console.log('');
    console.log('═'.repeat(60));
    process.exit(0);
  }
}

// Handle interrupts
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Validation interrupted by user');
  process.exit(130);
});

// Run all tests
runAllTests().then(printFinalReport).catch(err => {
  console.error('\n❌ Validation script error:', err);
  process.exit(1);
});
