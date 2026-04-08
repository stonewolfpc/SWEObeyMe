#!/usr/bin/env node

/**
 * Git Publish Governor
 * Pre-commit + pre-push test that guarantees correctness, safety, and exclusion of proprietary modules
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class GitGovernor {
  constructor(options = {}) {
    this.options = {
      check: options.check || 'all',
      override: options.override || [],
      verbose: options.verbose || false,
      ...options,
    };
    
    this.results = {
      totalTests: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      checks: {},
      startTime: Date.now(),
      endTime: null,
    };
    
    this.forbiddenModules = [
      '/enterprise/',
      '/rbac/',
      '/sso/',
      '/policy-engine/',
      '/tenant-isolation/',
      '/encryption/',
      '/audit/',
      '/webhooks/',
      '/admin-dashboard/',
    ];
    
    this.initialize();
  }

  async initialize() {
    console.log('[GitGovernor] Initializing Git Publish Governor...');
    console.log('[GitGovernor] Check:', this.options.check);
    console.log('[GitGovernor] Override:', this.options.override.join(', ') || 'none');
    
    // Create directories
    const dirs = ['checks', 'reports'];
    
    for (const dir of dirs) {
      const dirPath = join(__dirname, dir);
      if (!existsSync(dirPath)) {
        mkdirSync(dirPath, { recursive: true });
      }
    }
    
    console.log('[GitGovernor] Directories created');
  }

  async run() {
    console.log('[GitGovernor] Starting governor checks...');
    
    try {
      // Run based on check selection
      if (this.options.check === 'all') {
        await this.runAllChecks();
      } else {
        await this.runCheck(this.options.check);
      }
      
      this.results.endTime = Date.now();
      await this.generateReport();
      
      console.log('[GitGovernor] Governor checks completed');
      this.printSummary();
      
    } catch (error) {
      console.error('[GitGovernor] Fatal error:', error);
      process.exit(1);
    }
  }

  async runAllChecks() {
    const checks = [
      'feature-exclusion',
      'mcp-config-validator',
      'mcp-server-startup',
      'tool-arbitration-fuzzer',
      'path-normalization',
      'dependency-isolation',
      'public-build',
      'enterprise-leak-scanner',
    ];
    
    for (const check of checks) {
      await this.runCheck(check);
    }
  }

  async runCheck(checkName) {
    console.log(`[GitGovernor] Running check: ${checkName}`);
    
    // Check if this check is overridden
    if (this.options.override.includes(checkName)) {
      console.log(`[GitGovernor] ⚠️  Check ${checkName} is overridden (skipping)`);
      this.results.checks[checkName] = {
        status: 'overridden',
        tests: [],
        passed: 0,
        failed: 0,
        skipped: 0,
      };
      this.results.skipped++;
      return;
    }
    
    this.results.checks[checkName] = {
      tests: [],
      passed: 0,
      failed: 0,
      skipped: 0,
      startTime: Date.now(),
      endTime: null,
    };
    
    try {
      const { pathToFileURL } = await import('url');
      const modulePath = join(__dirname, 'checks', `${checkName}.js`);
      const moduleUrl = pathToFileURL(modulePath).href;
      const module = await import(moduleUrl);
      const check = new module.default(this.options);
      const results = await check.run();
      
      this.results.checks[checkName].tests = results.tests;
      this.results.checks[checkName].passed = results.passed;
      this.results.checks[checkName].failed = results.failed;
      this.results.checks[checkName].skipped = results.skipped;
      this.results.checks[checkName].endTime = Date.now();
      
      this.results.totalTests += results.total;
      this.results.passed += results.passed;
      this.results.failed += results.failed;
      this.results.skipped += results.skipped;
      
      console.log(`[GitGovernor] Check ${checkName} completed: ${results.passed}/${results.total} passed`);
      
    } catch (error) {
      console.error(`[GitGovernor] Check ${checkName} failed:`, error);
      this.results.checks[checkName].error = error.message;
      this.results.failed++;
    }
  }

  async generateReport() {
    const report = {
      metadata: {
        governorVersion: '1.0.0',
        timestamp: new Date().toISOString(),
        duration: this.results.endTime - this.results.startTime,
        options: this.options,
      },
      summary: {
        totalTests: this.results.totalTests,
        passed: this.results.passed,
        failed: this.results.failed,
        skipped: this.results.skipped,
        passRate: this.results.totalTests > 0 
          ? ((this.results.passed / this.results.totalTests) * 100).toFixed(2) 
          : 0,
      },
      checks: this.results.checks,
    };
    
    const reportPath = join(__dirname, 'reports', `governor-report-${Date.now()}.json`);
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`[GitGovernor] Report generated: ${reportPath}`);
    
    if (this.options.verbose) {
      this.printDetailedReport(report);
    }
    
    return report;
  }

  printSummary() {
    const duration = ((this.results.endTime - this.results.startTime) / 1000).toFixed(2);
    const passRate = this.results.totalTests > 0 
      ? ((this.results.passed / this.results.totalTests) * 100).toFixed(2) 
      : 0;
    
    console.log('\n' + '='.repeat(60));
    console.log('GIT PUBLISH GOVERNOR - SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${this.results.totalTests}`);
    console.log(`Passed: ${this.results.passed}`);
    console.log(`Failed: ${this.results.failed}`);
    console.log(`Skipped: ${this.results.skipped}`);
    console.log(`Pass Rate: ${passRate}%`);
    console.log(`Duration: ${duration}s`);
    console.log('='.repeat(60));
    
    if (this.results.failed > 0) {
      console.log('\n[GitGovernor] ❌ Some checks failed. Push blocked.');
      console.log('[GitGovernor] Fix the issues or use --override to bypass (emergency only).');
      process.exit(1);
    } else {
      console.log('\n[GitGovernor] ✅ All checks passed. Push allowed.');
    }
  }

  printDetailedReport(report) {
    console.log('\n' + '='.repeat(60));
    console.log('DETAILED REPORT');
    console.log('='.repeat(60));
    
    for (const [checkName, checkData] of Object.entries(report.checks)) {
      console.log(`\n${checkName}:`);
      console.log(`  Status: ${checkData.status || 'completed'}`);
      console.log(`  Tests: ${checkData.tests.length}`);
      console.log(`  Passed: ${checkData.passed}`);
      console.log(`  Failed: ${checkData.failed}`);
      console.log(`  Skipped: ${checkData.skipped}`);
      
      if (checkData.tests && checkData.tests.length > 0) {
        for (const test of checkData.tests) {
          const status = test.passed ? '✅' : '❌';
          console.log(`    ${status} ${test.name}`);
          if (!test.passed && test.error) {
            console.log(`       Error: ${test.error}`);
          }
        }
      }
    }
  }
}

// CLI interface
const args = process.argv.slice(2);
const options = {};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg.startsWith('--')) {
    const key = arg.slice(2);
    const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true;
    
    if (key === 'override') {
      options.override = (value === true ? [] : value.split(','));
    } else {
      options[key] = value;
    }
    
    if (value !== true) i++;
  }
}

const governor = new GitGovernor(options);
governor.run();
