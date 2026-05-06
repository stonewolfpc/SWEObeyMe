/**
 * Diagnostics Tool Handlers
 * Handlers for exposing server diagnostics and validation status to Windsurf UI
 */

import { getServerDiagnostics } from '../../lib/server-diagnostics.js';
import { internalAudit } from '../../lib/enforcement.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const SERVER_ID = 'swe-obey-me';
const PUBLISHER = 'stonewolfpc';

/**
 * Diagnostics handlers
 */
export const diagnosticsHandlers = {
  /**
   * Get server diagnostics
   */
  get_server_diagnostics: async (args) => {
    const diagnostics = getServerDiagnostics();
    const runChecks = args?.runChecks === true;

    let results;
    if (runChecks) {
      results = await diagnostics.runDiagnostics();
    } else {
      // Return cached results or run fresh if no cache
      if (!diagnostics.lastResults) {
        results = await diagnostics.runDiagnostics();
        diagnostics.lastResults = results;
      } else {
        results = diagnostics.lastResults;
      }
    }

    let message = '=== SERVER DIAGNOSTICS ===\n';
    message += `Timestamp: ${results.timestamp}\n`;
    message += `Startup Time: ${results.startupTime}ms\n`;
    message += `Overall Status: ${results.summary.overall.toUpperCase()}\n`;
    message += `Checks: ${results.summary.total} (Pass: ${results.summary.pass}, Fail: ${results.summary.fail}, Warn: ${results.summary.warn})\n\n`;

    message += 'Component Status:\n';
    results.checks.forEach((check) => {
      const status = check.status.toUpperCase();
      const icon = status === 'PASS' ? '✓' : status === 'FAIL' ? '✗' : '⚠';
      message += `  ${icon} ${check.name}: ${check.message}\n`;
      if (check.error) {
        message += `    Error: ${check.error}\n`;
      }
    });

    message += '\n=== END DIAGNOSTICS ===';

    return {
      content: [{ type: 'text', text: message }],
      _diagnostics: results, // Include raw data for UI parsing
    };
  },

  /**
   * Get validation status
   */
  get_validation_status: async () => {
    let message = '=== VALIDATION STATUS ===\n';
    message += `Surgical Integrity Score: ${internalAudit.surgicalIntegrityScore}/100\n`;
    message += `Consecutive Failures: ${internalAudit.consecutiveFailures}\n`;
    message += `Constitution Threshold: ${internalAudit.consecutiveFailures >= 3 ? 'TRIGGERED' : 'OK'}\n\n`;

    if (internalAudit.recentViolations && internalAudit.recentViolations.length > 0) {
      message += 'Recent Violations (last 10):\n';
      internalAudit.recentViolations.slice(-10).forEach((violation, i) => {
        message += `  ${i + 1}. ${violation.type}: ${violation.message}\n`;
      });
    } else {
      message += 'Recent Violations: None\n';
    }

    message += '\n=== END STATUS ===';

    return {
      content: [{ type: 'text', text: message }],
      _validation: {
        integrityScore: internalAudit.surgicalIntegrityScore,
        consecutiveFailures: internalAudit.consecutiveFailures,
        recentViolations: internalAudit.recentViolations || [],
      },
    };
  },

  /**
   * Validate clean installation
   */
  validate_clean_install: async () => {
    const issues = [];
    const warnings = [];

    const configPaths = [
      path.join(os.homedir(), '.codeium', 'windsurf-next', 'mcp_config.json'),
      path.join(os.homedir(), '.codeium', 'windsurf', 'mcp_config.json'),
      path.join(os.homedir(), '.codeium', 'mcp_config.json'),
      path.join(os.homedir(), '.cursor', 'mcp.json'),
      path.join(os.homedir(), '.cursor', 'mcp_config.json'),
      path.join(os.homedir(), '.vscode', 'mcp_config.json'),
    ];

    const extensionDirs = [
      path.join(os.homedir(), '.codeium', 'windsurf-next', 'extensions'),
      path.join(os.homedir(), '.codeium', 'windsurf', 'extensions'),
      path.join(os.homedir(), '.cursor', 'extensions'),
      path.join(os.homedir(), '.vscode', 'extensions'),
    ];

    // Check for stale MCP entries
    for (const configPath of configPaths) {
      try {
        const exists = await fs
          .access(configPath)
          .then(() => true)
          .catch(() => false);
        if (!exists) continue;

        const raw = await fs.readFile(configPath, 'utf8');
        const config = JSON.parse(raw);
        if (config.mcpServers && config.mcpServers[SERVER_ID]) {
          issues.push(`Stale MCP entry found in ${configPath}`);
        }
      } catch (err) {
        warnings.push(`Could not check ${configPath}: ${err.message}`);
      }
    }

    // Check for duplicate extension installations
    for (const extDir of extensionDirs) {
      try {
        const exists = await fs
          .access(extDir)
          .then(() => true)
          .catch(() => false);
        if (!exists) continue;

        const entries = await fs.readdir(extDir);
        const sweObeyMeEntries = entries.filter((e) => e.startsWith(`${PUBLISHER}.swe-obey-me`));

        if (sweObeyMeEntries.length > 1) {
          issues.push(`Duplicate installations in ${extDir}: ${sweObeyMeEntries.join(', ')}`);
        } else if (sweObeyMeEntries.length === 1) {
          // Check if the installed extension matches the current version
          const extPath = path.join(extDir, sweObeyMeEntries[0]);
          try {
            const packageJsonPath = path.join(extPath, 'package.json');
            const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
            const currentVersion = process.env.npm_package_version || 'unknown';
            if (packageJson.version !== currentVersion && currentVersion !== 'unknown') {
              warnings.push(
                `Version mismatch in ${extPath}: installed ${packageJson.version}, expected ${currentVersion}`
              );
            }
          } catch (err) {
            warnings.push(`Could not check version in ${extPath}: ${err.message}`);
          }
        }
      } catch (err) {
        warnings.push(`Could not check ${extDir}: ${err.message}`);
      }
    }

    // Check for stale environment variables
    const envVars = ['SWEOBEYME_BACKUP_DIR', 'SWEOBEYME_DEBUG'];
    for (const envVar of envVars) {
      if (process.env[envVar]) {
        warnings.push(`Environment variable ${envVar} is set: ${process.env[envVar]}`);
      }
    }

    let message = '=== CLEAN INSTALL VALIDATION ===\n';
    message += `Issues Found: ${issues.length}\n`;
    message += `Warnings: ${warnings.length}\n\n`;

    if (issues.length > 0) {
      message += 'ISSUES:\n';
      issues.forEach((issue, i) => {
        message += `  ${i + 1}. ${issue}\n`;
      });
      message += '\n';
    }

    if (warnings.length > 0) {
      message += 'WARNINGS:\n';
      warnings.forEach((warning, i) => {
        message += `  ${i + 1}. ${warning}\n`;
      });
      message += '\n';
    }

    if (issues.length === 0 && warnings.length === 0) {
      message += '✓ Installation is clean. No issues detected.\n';
    }

    message += '\n=== END VALIDATION ===';

    return {
      content: [{ type: 'text', text: message }],
      _cleanInstall: {
        issues,
        warnings,
        clean: issues.length === 0,
      },
    };
  },
};
