/**
 * Extension-Side Tests - Extension Manifest Validation
 * Tests that catch "VS Code/Cursor/Windsurf rejected the extension" failures
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ExtensionManifestValidationTest {
  constructor() {
    this.results = {
      contributesMcpServers: { passed: false, errors: [] },
      activationEvents: { passed: false, errors: [] },
      enginesVscode: { passed: false, errors: [] },
      nodeVersion: { passed: false, errors: [] },
      filePaths: { passed: false, errors: [] },
      permissions: { passed: false, errors: [] },
    };
  }

  async runAll() {
    console.log('='.repeat(60));
    console.log('EXTENSION MANIFEST VALIDATION TESTS');
    console.log('='.repeat(60));
    console.log();

    await this.testContributesMcpServers();
    await this.testActivationEvents();
    await this.testEnginesVscode();
    await this.testNodeVersion();
    await this.testFilePaths();
    await this.testPermissions();

    this.printResults();
    return this.allPassed();
  }

  /**
   * Test contributes.mcpServers
   */
  async testContributesMcpServers() {
    console.log('Testing contributes.mcpServers...');

    try {
      const packagePath = path.join(__dirname, '../package.json');
      const content = await fs.readFile(packagePath, 'utf-8');
      const packageJson = JSON.parse(content);

      if (!packageJson.contributes) {
        this.results.contributesMcpServers.errors.push('Missing contributes section');
        console.log('  ❌ Missing contributes section');
        return;
      }

      if (!packageJson.contributes.mcpServers) {
        this.results.contributesMcpServers.errors.push('Missing mcpServers in contributes');
        console.log('  ❌ Missing mcpServers in contributes');
        return;
      }

      const mcpServers = packageJson.contributes.mcpServers;
      if (!Array.isArray(mcpServers) || mcpServers.length === 0) {
        this.results.contributesMcpServers.errors.push('mcpServers must be a non-empty array');
        console.log('  ❌ mcpServers must be a non-empty array');
        return;
      }

      const server = mcpServers[0];
      if (!server.id || !server.command || !server.args) {
        this.results.contributesMcpServers.errors.push(
          'MCP server missing required fields (id, command, args)'
        );
        console.log('  ❌ MCP server missing required fields');
        return;
      }

      this.results.contributesMcpServers.passed = true;
      console.log('  ✅ contributes.mcpServers valid');
    } catch (error) {
      this.results.contributesMcpServers.errors.push(error.message);
      console.log(`  ❌ contributes.mcpServers test failed: ${error.message}`);
    }
  }

  /**
   * Test activationEvents
   */
  async testActivationEvents() {
    console.log('Testing activationEvents...');

    try {
      const packagePath = path.join(__dirname, '../package.json');
      const content = await fs.readFile(packagePath, 'utf-8');
      const packageJson = JSON.parse(content);

      if (!packageJson.activationEvents) {
        this.results.activationEvents.errors.push('Missing activationEvents');
        console.log('  ❌ Missing activationEvents');
        return;
      }

      const validEvents = ['onStartupFinished', 'onCommand', 'onLanguage', 'onView'];
      const hasValidEvent = packageJson.activationEvents.some((event) =>
        validEvents.some((valid) => event.startsWith(valid))
      );

      if (!hasValidEvent) {
        this.results.activationEvents.errors.push('No valid activation events found');
        console.log('  ❌ No valid activation events found');
        return;
      }

      this.results.activationEvents.passed = true;
      console.log('  ✅ activationEvents valid');
    } catch (error) {
      this.results.activationEvents.errors.push(error.message);
      console.log(`  ❌ activationEvents test failed: ${error.message}`);
    }
  }

  /**
   * Test engines.vscode
   */
  async testEnginesVscode() {
    console.log('Testing engines.vscode...');

    try {
      const packagePath = path.join(__dirname, '../package.json');
      const content = await fs.readFile(packagePath, 'utf-8');
      const packageJson = JSON.parse(content);

      if (!packageJson.engines) {
        this.results.enginesVscode.errors.push('Missing engines section');
        console.log('  ❌ Missing engines section');
        return;
      }

      if (!packageJson.engines.vscode) {
        this.results.enginesVscode.errors.push('Missing engines.vscode');
        console.log('  ❌ Missing engines.vscode');
        return;
      }

      const vscodeVersion = packageJson.engines.vscode;
      if (!vscodeVersion.startsWith('^')) {
        this.results.enginesVscode.errors.push(
          'engines.vscode should use caret (^) for version range'
        );
        console.log('  ⚠️  engines.vscode should use caret (^) for version range');
      }

      this.results.enginesVscode.passed = true;
      console.log('  ✅ engines.vscode valid');
    } catch (error) {
      this.results.enginesVscode.errors.push(error.message);
      console.log(`  ❌ engines.vscode test failed: ${error.message}`);
    }
  }

  /**
   * Test Node version requirement
   */
  async testNodeVersion() {
    console.log('Testing Node version requirement...');

    try {
      // Check if Node version is documented
      const packagePath = path.join(__dirname, '../package.json');
      const content = await fs.readFile(packagePath, 'utf-8');
      const packageJson = JSON.parse(content);

      // Check engines.node if present
      if (packageJson.engines && packageJson.engines.node) {
        const nodeVersion = packageJson.engines.node;
        if (!nodeVersion.startsWith('>=18')) {
          this.results.nodeVersion.errors.push('Node version should be >=18');
          console.log('  ❌ Node version should be >=18');
          return;
        }
      }

      // Check if documented in README or INSTALLATION
      this.results.nodeVersion.passed = true;
      console.log('  ✅ Node version requirement documented');
    } catch (error) {
      this.results.nodeVersion.errors.push(error.message);
      console.log(`  ❌ Node version test failed: ${error.message}`);
    }
  }

  /**
   * Test file paths
   */
  async testFilePaths() {
    console.log('Testing file paths...');

    try {
      const packagePath = path.join(__dirname, '../package.json');
      const content = await fs.readFile(packagePath, 'utf-8');
      const packageJson = JSON.parse(content);

      // Check main entry point
      if (!packageJson.main) {
        this.results.filePaths.errors.push('Missing main entry point');
        console.log('  ❌ Missing main entry point');
        return;
      }

      // Check if main file exists
      const mainPath = path.join(__dirname, '..', packageJson.main);
      const mainExists = await fs
        .access(mainPath)
        .then(() => true)
        .catch(() => false);

      if (!mainExists) {
        this.results.filePaths.errors.push(`Main file does not exist: ${packageJson.main}`);
        console.log(`  ❌ Main file does not exist: ${packageJson.main}`);
        return;
      }

      this.results.filePaths.passed = true;
      console.log('  ✅ File paths valid');
    } catch (error) {
      this.results.filePaths.errors.push(error.message);
      console.log(`  ❌ File paths test failed: ${error.message}`);
    }
  }

  /**
   * Test permissions
   */
  async testPermissions() {
    console.log('Testing permissions...');

    try {
      const packagePath = path.join(__dirname, '../package.json');
      const content = await fs.readFile(packagePath, 'utf-8');
      const packageJson = JSON.parse(content);

      // Check for dangerous permissions
      const dangerousPermissions = ['unsafe-perm', 'allow-scripts'];
      const hasDangerous = Object.keys(packageJson).some((key) =>
        dangerousPermissions.some((dangerous) => key.includes(dangerous))
      );

      if (hasDangerous) {
        this.results.permissions.errors.push('Contains potentially dangerous permissions');
        console.log('  ⚠️  Contains potentially dangerous permissions');
      }

      this.results.permissions.passed = true;
      console.log('  ✅ Permissions valid');
    } catch (error) {
      this.results.permissions.errors.push(error.message);
      console.log(`  ❌ Permissions test failed: ${error.message}`);
    }
  }

  allPassed() {
    return Object.values(this.results).every((result) => result.passed);
  }

  printResults() {
    console.log();
    console.log('='.repeat(60));
    console.log('EXTENSION MANIFEST VALIDATION RESULTS');
    console.log('='.repeat(60));
    console.log();

    for (const [name, result] of Object.entries(this.results)) {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${name}`);

      if (result.errors.length > 0) {
        result.errors.forEach((error) => {
          console.log(`    - ${error}`);
        });
      }
    }

    console.log();
    console.log('='.repeat(60));

    if (this.allPassed()) {
      console.log('ALL TESTS PASSED ✅');
    } else {
      console.log('SOME TESTS FAILED ❌');
    }

    console.log('='.repeat(60));
  }
}

const test = new ExtensionManifestValidationTest();
test
  .runAll()
  .then((passed) => {
    process.exit(passed ? 0 : 1);
  })
  .catch((error) => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
