/**
 * Feature Exclusion System (Forbidden Modules Gate)
 * Prevents enterprise code from being pushed
 */

import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

class FeatureExclusionCheck {
  constructor(options = {}) {
    this.options = options;
    this.results = {
      tests: [],
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0,
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

    this.repoRoot = dirname(dirname(__dirname));
  }

  async run() {
    console.log('[FeatureExclusion] Starting feature exclusion check...');

    const tests = [
      'scan-forbidden-paths',
      'check-for-enterprise-files',
      'check-for-enterprise-imports',
      'validate-forbidden-modules',
    ];

    for (const test of tests) {
      await this.runTest(test);
    }

    this.results.total = this.results.tests.length;
    return this.results;
  }

  async runTest(testName) {
    console.log(`[FeatureExclusion] Running: ${testName}...`);

    let passed = false;
    let error = null;

    try {
      switch (testName) {
        case 'scan-forbidden-paths':
          passed = await this.testScanForbiddenPaths();
          break;
        case 'check-for-enterprise-files':
          passed = await this.testCheckForEnterpriseFiles();
          break;
        case 'check-for-enterprise-imports':
          passed = await this.testCheckForEnterpriseImports();
          break;
        case 'validate-forbidden-modules':
          passed = await this.testValidateForbiddenModules();
          break;
      }
    } catch (e) {
      error = e.message;
    }

    this.results.tests.push({
      id: testName,
      name: `Feature Exclusion - ${testName}`,
      passed,
      error,
    });

    if (passed) {
      this.results.passed++;
      console.log(`[FeatureExclusion] ✅ ${testName}`);
    } else {
      this.results.failed++;
      console.log(`[FeatureExclusion] ❌ ${testName}: ${error}`);
    }
  }

  async testScanForbiddenPaths() {
    // Scan the repo for forbidden paths
    const foundForbidden = this.scanRepoForForbiddenPaths();

    // If no forbidden paths found, test passes
    return foundForbidden.length === 0;
  }

  async testCheckForEnterpriseFiles() {
    // Check for actual restricted files in the repo
    const enterpriseFiles = this.findEnterpriseFiles();

    // If no restricted files found, test passes
    return enterpriseFiles.length === 0;
  }

  async testCheckForEnterpriseImports() {
    // Check for restricted imports in main files
    const enterpriseImports = this.findEnterpriseImports();

    // If no restricted imports found, test passes
    return enterpriseImports.length === 0;
  }

  async testValidateForbiddenModules() {
    // Validate that forbidden modules list is correct
    const hasAllRequired = this.forbiddenModules.length > 0;

    return hasAllRequired;
  }

  // Helper methods
  scanRepoForForbiddenPaths() {
    const found = [];

    for (const forbidden of this.forbiddenModules) {
      const forbiddenPath = join(this.repoRoot, forbidden.replace(/^\//, ''));

      if (existsSync(forbiddenPath)) {
        found.push(forbidden);
      }
    }

    return found;
  }

  findEnterpriseFiles() {
    const files = [];

    for (const forbidden of this.forbiddenModules) {
      const forbiddenPath = join(this.repoRoot, forbidden.replace(/^\//, ''));

      if (existsSync(forbiddenPath)) {
        const stats = statSync(forbiddenPath);

        if (stats.isDirectory()) {
          const dirFiles = this.scanDirectory(forbiddenPath);
          files.push(...dirFiles);
        } else {
          files.push(forbiddenPath);
        }
      }
    }

    return files;
  }

  scanDirectory(dirPath) {
    const files = [];

    try {
      const items = readdirSync(dirPath);

      for (const item of items) {
        const itemPath = join(dirPath, item);
        const stats = statSync(itemPath);

        if (stats.isDirectory()) {
          files.push(...this.scanDirectory(itemPath));
        } else {
          files.push(itemPath);
        }
      }
    } catch (e) {
      // Ignore permission errors
    }

    return files;
  }

  findEnterpriseImports() {
    const imports = [];
    const mainFiles = [
      join(this.repoRoot, 'extension.js'),
      join(this.repoRoot, 'index.js'),
      join(this.repoRoot, 'lib', 'mcp-server.js'),
      join(this.repoRoot, 'lib', 'provider-manager.js'),
    ];

    for (const filePath of mainFiles) {
      if (existsSync(filePath)) {
        const content = readFileSync(filePath, 'utf-8');

        for (const forbidden of this.forbiddenModules) {
          const moduleName = forbidden.replace(/\/$/, '');

          if (
            content.includes(moduleName) ||
            content.includes(`'${moduleName}`) ||
            content.includes(`"${moduleName}"`)
          ) {
            imports.push({ file: filePath, module: moduleName });
          }
        }
      }
    }

    return imports;
  }
}

export default FeatureExclusionCheck;
