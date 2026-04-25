/**
 * Server Diagnostics Module
 * Provides richer startup diagnostics and status reporting for Windsurf UI integration
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Diagnostic checks for server startup
 */
export class ServerDiagnostics {
  constructor() {
    this.checks = [];
    this.startTime = Date.now();
  }

  /**
   * Run all diagnostic checks
   */
  async runDiagnostics() {
    const results = [];

    // Check backup directory
    results.push(await this.checkBackupDirectory());

    // Check project contract
    results.push(await this.checkProjectContract());

    // Check .sweignore
    results.push(await this.checkSweIgnore());

    // Check prompt registry
    results.push(await this.checkPromptRegistry());

    // Check tool registry
    results.push(await this.checkToolRegistry());

    // Check C# Bridge availability
    results.push(await this.checkCSharpBridge());

    return {
      timestamp: new Date().toISOString(),
      startupTime: Date.now() - this.startTime,
      checks: results,
      summary: this.summarizeResults(results),
    };
  }

  /**
   * Check if backup directory exists and is writable
   */
  async checkBackupDirectory() {
    try {
      const backupDir = path.join(__dirname, '../.swe-backups');
      await fs.access(backupDir, fs.constants.W_OK);
      return {
        name: 'backup_directory',
        status: 'pass',
        message: 'Backup directory exists and is writable',
        path: backupDir,
      };
    } catch (error) {
      return {
        name: 'backup_directory',
        status: 'fail',
        message: `Backup directory check failed: ${error.message}`,
        error: error.message,
      };
    }
  }

  /**
   * Check if project contract can be loaded
   */
  async checkProjectContract() {
    try {
      const { loadProjectContract } = await import('./project.js');
      const contract = await loadProjectContract();
      return {
        name: 'project_contract',
        status: 'pass',
        message: 'Project contract loaded successfully',
        hasContract: !!contract,
      };
    } catch (error) {
      return {
        name: 'project_contract',
        status: 'warn',
        message: `Project contract not loaded: ${error.message}`,
        error: error.message,
      };
    }
  }

  /**
   * Check if .sweignore can be loaded
   */
  async checkSweIgnore() {
    try {
      const { loadSweIgnore } = await import('./project.js');
      const sweIgnore = await loadSweIgnore();
      return {
        name: 'sweignore',
        status: 'pass',
        message: '.sweignore loaded successfully',
        hasSweIgnore: !!sweIgnore,
      };
    } catch (error) {
      return {
        name: 'sweignore',
        status: 'warn',
        message: `.sweignore not loaded: ${error.message}`,
        error: error.message,
      };
    }
  }

  /**
   * Check if prompt registry can be initialized
   */
  async checkPromptRegistry() {
    try {
      const { initializePromptRegistry, getPromptRegistry } = await import('./prompts/registry.js');
      await initializePromptRegistry();
      const registry = await getPromptRegistry();
      const prompts = registry.getAllPrompts();
      return {
        name: 'prompt_registry',
        status: 'pass',
        message: 'Prompt registry initialized successfully',
        promptCount: prompts.length,
      };
    } catch (error) {
      return {
        name: 'prompt_registry',
        status: 'fail',
        message: `Prompt registry initialization failed: ${error.message}`,
        error: error.message,
      };
    }
  }

  /**
   * Check if tool registry can be loaded
   */
  async checkToolRegistry() {
    try {
      const { getDynamicToolRegistry } = await import('./tools/registry-dynamic.js');
      const registry = getDynamicToolRegistry();
      const tools = registry.getFilteredToolDefinitions();
      return {
        name: 'tool_registry',
        status: 'pass',
        message: 'Tool registry loaded successfully',
        toolCount: tools.length,
      };
    } catch (error) {
      return {
        name: 'tool_registry',
        status: 'fail',
        message: `Tool registry loading failed: ${error.message}`,
        error: error.message,
      };
    }
  }

  /**
   * Check if C# Bridge is available
   */
  async checkCSharpBridge() {
    try {
      const { analyzeCSharpFile } = await import('./csharp-bridge.js');
      // Try to initialize bridge
      return {
        name: 'csharp_bridge',
        status: 'pass',
        message: 'C# Bridge available',
        available: true,
      };
    } catch (error) {
      return {
        name: 'csharp_bridge',
        status: 'warn',
        message: `C# Bridge not available: ${error.message}`,
        error: error.message,
      };
    }
  }

  /**
   * Summarize diagnostic results
   */
  summarizeResults(results) {
    const pass = results.filter((r) => r.status === 'pass').length;
    const fail = results.filter((r) => r.status === 'fail').length;
    const warn = results.filter((r) => r.status === 'warn').length;
    const total = results.length;

    let overall = 'pass';
    if (fail > 0) overall = 'fail';
    else if (warn > 0) overall = 'warn';

    return {
      overall,
      total,
      pass,
      fail,
      warn,
    };
  }
}

// Singleton instance
let diagnosticsInstance = null;

export function getServerDiagnostics() {
  if (!diagnosticsInstance) {
    diagnosticsInstance = new ServerDiagnostics();
  }
  return diagnosticsInstance;
}
