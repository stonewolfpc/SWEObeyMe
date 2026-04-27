/**
 * Master Test Runner
 * Runs all test suites: comprehensive, fuzz, hang prevention
 * Designed for CI/CD and scheduled execution
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPORTS_DIR = path.join(__dirname, 'reports');

/**
 * Run a test file and capture results
 */
async function runTestFile(testFile, timeout = 300000) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Running: ${testFile}`);
  console.log('='.repeat(60));
  
  return new Promise((resolve) => {
    const start = Date.now();
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    
    const child = spawn('node', [testFile], {
      cwd: __dirname,
      stdio: 'pipe',
    });
    
    const timeoutId = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
      setTimeout(() => child.kill('SIGKILL'), 5000);
    }, timeout);
    
    child.stdout.on('data', (data) => {
      const str = data.toString('utf8');
      stdout += str;
      process.stdout.write(str);
    });
    
    child.stderr.on('data', (data) => {
      const str = data.toString('utf8');
      stderr += str;
      process.stderr.write(str);
    });
    
    child.on('close', (code) => {
      clearTimeout(timeoutId);
      const duration = Date.now() - start;
      
      resolve({
        file: testFile,
        exitCode: code,
        duration,
        timedOut,
        stdout,
        stderr,
        passed: code === 0 && !timedOut,
      });
    });
    
    child.on('error', (error) => {
      clearTimeout(timeoutId);
      resolve({
        file: testFile,
        exitCode: -1,
        duration: Date.now() - start,
        timedOut: false,
        error: error.message,
        passed: false,
      });
    });
  });
}

/**
 * Main runner
 */
async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         SWEObeyMe COMPREHENSIVE TEST SUITE                 ║');
  console.log('║     Testing: Stability, Performance, Hang Prevention       ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  const startTime = Date.now();
  
  // Test suites to run
  const testSuites = [
    { file: 'comprehensive-tool-tester.js', timeout: 300000 },
    { file: 'edge-case-fuzzer.js', timeout: 120000 },
    { file: 'hang-prevention-tester.js', timeout: 120000 },
  ];
  
  const results = [];
  
  for (const suite of testSuites) {
    const testPath = path.join(__dirname, suite.file);
    
    // Check if file exists
    try {
      await fs.access(testPath);
    } catch {
      console.log(`⚠️  Test file not found: ${suite.file}`);
      continue;
    }
    
    const result = await runTestFile(testPath, suite.timeout);
    results.push(result);
  }
  
  // Generate master report
  const totalDuration = Date.now() - startTime;
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  const masterReport = {
    timestamp: new Date().toISOString(),
    summary: {
      total: results.length,
      passed,
      failed,
      duration: totalDuration,
      passRate: `${((passed / results.length) * 100).toFixed(1)}%`,
    },
    suites: results.map(r => ({
      file: r.file,
      passed: r.passed,
      exitCode: r.exitCode,
      timedOut: r.timedOut,
      duration: r.duration,
      error: r.error,
    })),
  };
  
  // Save report
  await fs.mkdir(REPORTS_DIR, { recursive: true });
  const reportPath = path.join(REPORTS_DIR, `master-report-${Date.now()}.json`);
  await fs.writeFile(reportPath, JSON.stringify(masterReport, null, 2));
  
  // Console summary
  console.log('\n' + '═'.repeat(60));
  console.log('                    FINAL REPORT                              ');
  console.log('═'.repeat(60));
  console.log(`Total Duration: ${(totalDuration / 1000).toFixed(1)}s`);
  console.log(`Suites Run: ${masterReport.summary.total}`);
  console.log(`Passed: ${masterReport.summary.passed} ✅`);
  console.log(`Failed: ${masterReport.summary.failed} ❌`);
  console.log(`Pass Rate: ${masterReport.summary.passRate}`);
  console.log(`Report: ${reportPath}`);
  console.log('═'.repeat(60));
  
  // Suite details
  console.log('\nSuite Results:');
  for (const suite of masterReport.suites) {
    const icon = suite.passed ? '✅' : suite.timedOut ? '⏱️' : '❌';
    console.log(`  ${icon} ${suite.file}: ${suite.duration}ms`);
    if (suite.error) {
      console.log(`     Error: ${suite.error}`);
    }
  }
  
  // Exit code
  process.exit(failed > 0 ? 1 : 0);
}

// Error handling
process.on('unhandledRejection', (error) => {
  console.error('Test runner error:', error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Test runner error:', error);
  process.exit(1);
});

// Run
runAllTests();
