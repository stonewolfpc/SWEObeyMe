/**
 * Cross-Platform Integration Test for SWEObeyMe
 * Validates that SWEObeyMe MCP server works correctly across:
 * - Windsurf
 * - Cursor
 * - VS Code
 * - LM Studio
 */

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CrossPlatformIntegrationTest {
  constructor() {
    this.results = {
      windsurf: { passed: false, errors: [] },
      cursor: { passed: false, errors: [] },
      vscode: { passed: false, errors: [] },
      lmstudio: { passed: false, errors: [] },
      build: { passed: false, errors: [] },
      configFiles: { passed: false, errors: [] },
    };
  }

  /**
   * Run all tests
   */
  async runAll() {
    console.log('='.repeat(60));
    console.log('CROSS-PLATFORM INTEGRATION TEST');
    console.log('='.repeat(60));
    console.log();

    await this.testBuildProcess();
    await this.testConfigFiles();
    await this.testMCPServerStartup();
    await this.testWindsurfConfig();
    await this.testCursorConfig();
    await this.testVSCodeConfig();
    await this.testLMStudioConfig();

    this.printResults();
    return this.allPassed();
  }

  /**
   * Test build process
   */
  async testBuildProcess() {
    console.log('Testing build process...');

    try {
      // Check if dist directory exists
      const distExists = await fs
        .access(path.join(__dirname, '../dist'))
        .then(() => true)
        .catch(() => false);

      if (!distExists) {
        this.results.build.errors.push('dist directory does not exist');
        console.log('  ❌ dist directory does not exist');
        return;
      }

      // Check if dist/mcp/server.js exists
      const serverExists = await fs
        .access(path.join(__dirname, '../dist/mcp/server.js'))
        .then(() => true)
        .catch(() => false);

      if (!serverExists) {
        this.results.build.errors.push('dist/mcp/server.js does not exist');
        console.log('  ❌ dist/mcp/server.js does not exist');
        return;
      }

      // Check if dist/extension.js exists (for VS Code)
      const extensionExists = await fs
        .access(path.join(__dirname, '../dist/extension.js'))
        .then(() => true)
        .catch(() => false);

      if (!extensionExists) {
        this.results.build.errors.push('dist/extension.js does not exist');
        console.log('  ❌ dist/extension.js does not exist');
        return;
      }

      this.results.build.passed = true;
      console.log('  ✅ Build artifacts exist');
    } catch (error) {
      this.results.build.errors.push(error.message);
      console.log(`  ❌ Build test failed: ${error.message}`);
    }
  }

  /**
   * Test config files
   */
  async testConfigFiles() {
    console.log('Testing config files...');

    const configs = [
      'mcp-configs/windsurf-mcp.json',
      'mcp-configs/cursor-mcp.json',
      'mcp-configs/lmstudio-mcp.json',
    ];

    for (const configPath of configs) {
      try {
        const fullPath = path.join(__dirname, '..', configPath);
        const content = await fs.readFile(fullPath, 'utf-8');
        const config = JSON.parse(content);

        // Validate structure
        if (!config.mcpServers) {
          this.results.configFiles.errors.push(`${configPath}: missing mcpServers`);
          console.log(`  ❌ ${configPath}: missing mcpServers`);
          continue;
        }

        if (!config.mcpServers.sweobeyme) {
          this.results.configFiles.errors.push(`${configPath}: missing sweobeyme server`);
          console.log(`  ❌ ${configPath}: missing sweobeyme server`);
          continue;
        }

        const server = config.mcpServers.sweobeyme;

        if (!server.command) {
          this.results.configFiles.errors.push(`${configPath}: missing command`);
          console.log(`  ❌ ${configPath}: missing command`);
          continue;
        }

        if (!server.args || !Array.isArray(server.args)) {
          this.results.configFiles.errors.push(`${configPath}: missing or invalid args`);
          console.log(`  ❌ ${configPath}: missing or invalid args`);
          continue;
        }

        console.log(`  ✅ ${configPath}: valid`);
      } catch (error) {
        this.results.configFiles.errors.push(`${configPath}: ${error.message}`);
        console.log(`  ❌ ${configPath}: ${error.message}`);
      }
    }

    if (this.results.configFiles.errors.length === 0) {
      this.results.configFiles.passed = true;
    }
  }

  /**
   * Test MCP server startup
   */
  async testMCPServerStartup() {
    console.log('Testing MCP server startup...');

    return new Promise((resolve) => {
      const serverPath = path.join(__dirname, '../dist/mcp/server.js');

      const serverProcess = spawn('node', [serverPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let output = '';
      let errors = '';
      let started = false;

      serverProcess.stdout.on('data', (data) => {
        output += data.toString();
        if (
          output.includes('MCP server listening') ||
          output.includes('Server started') ||
          output.includes('connected and ready')
        ) {
          started = true;
        }
      });

      serverProcess.stderr.on('data', (data) => {
        errors += data.toString();
        // Also check stderr for startup message (some servers log there)
        if (
          errors.includes('MCP server listening') ||
          errors.includes('Server started') ||
          errors.includes('connected and ready')
        ) {
          started = true;
        }
      });

      // Wait 5 seconds for server to start
      setTimeout(() => {
        serverProcess.kill();

        if (started) {
          console.log('  ✅ MCP server starts successfully');
          this.results.build.passed = true; // Reuse build results for server startup
        } else {
          this.results.build.errors.push('MCP server did not start within timeout');
          console.log('  ❌ MCP server did not start within timeout');
          if (errors) {
            console.log(`     Error: ${errors}`);
          }
        }

        resolve();
      }, 5000);
    });
  }

  /**
   * Test Windsurf config
   */
  async testWindsurfConfig() {
    console.log('Testing Windsurf config...');

    try {
      const configPath = path.join(__dirname, '../mcp-configs/windsurf-mcp.json');
      const content = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(content);

      // Validate Windsurf-specific requirements
      const server = config.mcpServers.sweobeyme;

      if (server.command !== 'node') {
        this.results.windsurf.errors.push('Windsurf requires "node" command');
        console.log('  ❌ Windsurf requires "node" command');
        return;
      }

      if (!server.args.includes('./dist/mcp/server.js')) {
        this.results.windsurf.errors.push('Windsurf args must include server path');
        console.log('  ❌ Windsurf args must include server path');
        return;
      }

      this.results.windsurf.passed = true;
      console.log('  ✅ Windsurf config valid');
    } catch (error) {
      this.results.windsurf.errors.push(error.message);
      console.log(`  ❌ Windsurf config test failed: ${error.message}`);
    }
  }

  /**
   * Test Cursor config
   */
  async testCursorConfig() {
    console.log('Testing Cursor config...');

    try {
      const configPath = path.join(__dirname, '../mcp-configs/cursor-mcp.json');
      const content = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(content);

      // Validate Cursor-specific requirements
      const server = config.mcpServers.sweobeyme;

      if (server.command !== 'node') {
        this.results.cursor.errors.push('Cursor requires "node" command');
        console.log('  ❌ Cursor requires "node" command');
        return;
      }

      if (!server.args.includes('./dist/mcp/server.js')) {
        this.results.cursor.errors.push('Cursor args must include server path');
        console.log('  ❌ Cursor args must include server path');
        return;
      }

      this.results.cursor.passed = true;
      console.log('  ✅ Cursor config valid');
    } catch (error) {
      this.results.cursor.errors.push(error.message);
      console.log(`  ❌ Cursor config test failed: ${error.message}`);
    }
  }

  /**
   * Test VS Code config
   */
  async testVSCodeConfig() {
    console.log('Testing VS Code config...');

    try {
      const packagePath = path.join(__dirname, '../package.json');
      const content = await fs.readFile(packagePath, 'utf-8');
      const packageJson = JSON.parse(content);

      // Validate VS Code-specific requirements
      if (!packageJson.contributes) {
        this.results.vscode.errors.push('package.json missing contributes');
        console.log('  ❌ package.json missing contributes');
        return;
      }

      if (!packageJson.contributes.mcpServers) {
        this.results.vscode.errors.push('package.json missing mcpServers in contributes');
        console.log('  ❌ package.json missing mcpServers in contributes');
        return;
      }

      const mcpServer = packageJson.contributes.mcpServers[0];

      if (!mcpServer || mcpServer.id !== 'sweobeyme') {
        this.results.vscode.errors.push('VS Code MCP server not properly configured');
        console.log('  ❌ VS Code MCP server not properly configured');
        return;
      }

      if (mcpServer.command !== 'node') {
        this.results.vscode.errors.push('VS Code requires "node" command');
        console.log('  ❌ VS Code requires "node" command');
        return;
      }

      if (!mcpServer.args || !mcpServer.args.includes('./dist/mcp/server.js')) {
        this.results.vscode.errors.push('VS Code args must include server path');
        console.log('  ❌ VS Code args must include server path');
        return;
      }

      this.results.vscode.passed = true;
      console.log('  ✅ VS Code config valid');
    } catch (error) {
      this.results.vscode.errors.push(error.message);
      console.log(`  ❌ VS Code config test failed: ${error.message}`);
    }
  }

  /**
   * Test LM Studio config
   */
  async testLMStudioConfig() {
    console.log('Testing LM Studio config...');

    try {
      const configPath = path.join(__dirname, '../mcp-configs/lmstudio-mcp.json');
      const content = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(content);

      // Validate LM Studio-specific requirements (follows Cursor notation)
      const server = config.mcpServers.sweobeyme;

      if (server.command !== 'node') {
        this.results.lmstudio.errors.push('LM Studio requires "node" command');
        console.log('  ❌ LM Studio requires "node" command');
        return;
      }

      if (!server.args.includes('./dist/mcp/server.js')) {
        this.results.lmstudio.errors.push('LM Studio args must include server path');
        console.log('  ❌ LM Studio args must include server path');
        return;
      }

      this.results.lmstudio.passed = true;
      console.log('  ✅ LM Studio config valid');
    } catch (error) {
      this.results.lmstudio.errors.push(error.message);
      console.log(`  ❌ LM Studio config test failed: ${error.message}`);
    }
  }

  /**
   * Check if all tests passed
   */
  allPassed() {
    return Object.values(this.results).every((result) => result.passed);
  }

  /**
   * Print results
   */
  printResults() {
    console.log();
    console.log('='.repeat(60));
    console.log('TEST RESULTS');
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

// Run tests
const test = new CrossPlatformIntegrationTest();
test
  .runAll()
  .then((passed) => {
    process.exit(passed ? 0 : 1);
  })
  .catch((error) => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
