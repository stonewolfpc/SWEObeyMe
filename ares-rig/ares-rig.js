#!/usr/bin/env node

/**
 * ARES Test Rig - Main Runner
 * Advanced Rig for Enterprise Simulation
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class ARESRig {
  constructor(options = {}) {
    this.options = {
      layer: options.layer || 'all',
      os: options.os || 'all',
      editor: options.editor || 'all',
      report: options.report || false,
      verbose: options.verbose || false,
      ...options,
    };

    this.results = {
      totalTests: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      layers: {},
      startTime: Date.now(),
      endTime: null,
    };

    this.initialize();
  }

  async initialize() {
    console.log('[ARES] Initializing Test Rig...');
    console.log('[ARES] Layer:', this.options.layer);
    console.log('[ARES] OS:', this.options.os);
    console.log('[ARES] Editor:', this.options.editor);

    // Create directories
    const dirs = [
      'config',
      'simulators/editor',
      'simulators/os',
      'simulators/mcp',
      'simulators/fs',
      'simulators/provider',
      'simulators/webview',
      'tests/mcp-loader',
      'tests/tool-arbitration',
      'tests/workspace',
      'tests/checkpoint',
      'tests/e2e',
      'fixtures',
      'reports',
    ];

    for (const dir of dirs) {
      const dirPath = join(__dirname, dir);
      if (!existsSync(dirPath)) {
        mkdirSync(dirPath, { recursive: true });
      }
    }

    console.log('[ARES] Directories created');
  }

  async run() {
    console.log('[ARES] Starting test execution...');

    try {
      // Run based on layer selection
      if (this.options.layer === 'all') {
        await this.runAllLayers();
      } else {
        await this.runLayer(this.options.layer);
      }

      this.results.endTime = Date.now();
      await this.generateReport();

      console.log('[ARES] Test execution completed');
      this.printSummary();

      // Explicitly exit to prevent hanging
      process.exit(this.results.failed > 0 ? 1 : 0);
    } catch (error) {
      console.error('[ARES] Fatal error:', error);
      process.exit(1);
    }
  }

  async runAllLayers() {
    const layers = [
      'editor-simulation',
      'os-simulation',
      'mcp-loader-stress',
      'tool-arbitration',
      'fs-chaos',
      'workspace-awareness',
      'provider-failure',
      'webview-failure',
      'checkpoint-stress',
      'e2e-software-factory',
    ];

    for (const layer of layers) {
      await this.runLayer(layer);
    }
  }

  async runLayer(layerName) {
    console.log(`[ARES] [${new Date().toISOString()}] Starting layer: ${layerName}`);
    const layerStartTime = Date.now();

    this.results.layers[layerName] = {
      tests: [],
      passed: 0,
      failed: 0,
      skipped: 0,
      startTime: layerStartTime,
      endTime: null,
    };

    try {
      const { pathToFileURL } = await import('url');
      const modulePath = join(__dirname, 'simulators', `${layerName}.js`);
      const moduleUrl = pathToFileURL(modulePath).href;
      const module = await import(moduleUrl);
      const simulator = new module.default(this.options);

      // Add timeout for entire layer (5 minutes max)
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Layer ${layerName} timeout (5min)`)), 300000)
      );

      const results = await Promise.race([simulator.run(), timeout]);

      this.results.layers[layerName].tests = results.tests;
      this.results.layers[layerName].passed = results.passed;
      this.results.layers[layerName].failed = results.failed;
      this.results.layers[layerName].skipped = results.skipped;
      this.results.layers[layerName].endTime = Date.now();

      this.results.totalTests += results.total;
      this.results.passed += results.passed;
      this.results.failed += results.failed;
      this.results.skipped += results.skipped;

      const duration = ((Date.now() - layerStartTime) / 1000).toFixed(2);
      console.log(
        `[ARES] [${new Date().toISOString()}] Layer ${layerName} completed in ${duration}s: ${results.passed}/${results.total} passed`
      );
    } catch (error) {
      const duration = ((Date.now() - layerStartTime) / 1000).toFixed(2);
      console.error(
        `[ARES] [${new Date().toISOString()}] Layer ${layerName} failed after ${duration}s:`,
        error.message
      );
      this.results.layers[layerName].error = error.message;
      this.results.layers[layerName].endTime = Date.now();
      this.results.failed++;
    }
  }

  async generateReport() {
    const report = {
      metadata: {
        rigVersion: '1.0.0',
        timestamp: new Date().toISOString(),
        duration: this.results.endTime - this.results.startTime,
        options: this.options,
      },
      summary: {
        totalTests: this.results.totalTests,
        passed: this.results.passed,
        failed: this.results.failed,
        skipped: this.results.skipped,
        passRate:
          this.results.totalTests > 0
            ? ((this.results.passed / this.results.totalTests) * 100).toFixed(2)
            : 0,
      },
      layers: this.results.layers,
    };

    const reportPath = join(__dirname, 'reports', `ares-report-${Date.now()}.json`);
    writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`[ARES] Report generated: ${reportPath}`);

    if (this.options.report) {
      this.printDetailedReport(report);
    }

    return report;
  }

  printSummary() {
    const duration = ((this.results.endTime - this.results.startTime) / 1000).toFixed(2);
    const passRate =
      this.results.totalTests > 0
        ? ((this.results.passed / this.results.totalTests) * 100).toFixed(2)
        : 0;

    console.log('\n' + '='.repeat(60));
    console.log('ARES TEST RIG - SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${this.results.totalTests}`);
    console.log(`Passed: ${this.results.passed}`);
    console.log(`Failed: ${this.results.failed}`);
    console.log(`Skipped: ${this.results.skipped}`);
    console.log(`Pass Rate: ${passRate}%`);
    console.log(`Duration: ${duration}s`);
    console.log('='.repeat(60));

    if (this.results.failed > 0) {
      console.log('\n[ARES] ⚠️  Some tests failed. Review the report for details.');
      process.exit(1);
    } else {
      console.log('\n[ARES] ✅ All tests passed. SWEObeyMe is production-ready.');
    }
  }

  printDetailedReport(report) {
    console.log('\n' + '='.repeat(60));
    console.log('DETAILED REPORT');
    console.log('='.repeat(60));

    for (const [layerName, layerData] of Object.entries(report.layers)) {
      console.log(`\n${layerName}:`);
      console.log(`  Tests: ${layerData.tests.length}`);
      console.log(`  Passed: ${layerData.passed}`);
      console.log(`  Failed: ${layerData.failed}`);
      console.log(`  Skipped: ${layerData.skipped}`);

      if (layerData.tests && layerData.tests.length > 0) {
        for (const test of layerData.tests) {
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
    options[key] = value;
    if (value !== true) i++;
  }
}

const rig = new ARESRig(options);
rig.run();
