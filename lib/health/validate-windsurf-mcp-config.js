/**
 * Windsurf MCP Config Core Module
 *
 * Provides load, validate, and repair functions for Windsurf's mcp_config.json:
 * - Load config with issue detection
 * - Validate schema, paths, URIs, entrypoints
 * - Auto-repair common issues (bad URIs, invalid disabled flags)
 * - Loud error attribution with distinct error codes
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

function scream(code, message, detail) {
  process.stderr.write(
    `[SWEObeyMe] WINDSURF MCP CONFIG PROBLEM: ${message} (${code})\n` +
      (detail ? `Details: ${detail}\n` : '')
  );
}

function isValidFileUri(uri) {
  return uri.startsWith('file:///') && !uri.includes('\\');
}

/**
 * Load config from file and detect issues
 * @param {string} configPath - Path to mcp_config.json
 * @returns {{config: object|null, issues: Array<object>}}
 */
export function loadConfig(configPath) {
  const issues = [];
  let raw;

  try {
    raw = fs.readFileSync(configPath, 'utf8');
  } catch {
    issues.push({
      code: 'ERR-MCP-CONFIG-NOT-FOUND',
      message: 'Windsurf MCP config file not found.',
      detail: configPath,
    });
    return { config: null, issues };
  }

  // Detect BOM
  if (raw.charCodeAt(0) === 0xfeff) {
    issues.push({
      code: 'ERR-MCP-CONFIG-BOM',
      message: 'Config contains UTF-8 BOM. Windsurf may silently ignore it.',
    });
    raw = raw.slice(1);
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    issues.push({
      code: 'ERR-MCP-CONFIG-JSON',
      message: 'Config JSON is malformed.',
      detail: e.message,
    });
    return { config: null, issues };
  }

  return { config: parsed, issues };
}

/**
 * Validate config schema and content
 * @param {string} configPath - Path to mcp_config.json
 * @param {object|null} config - Parsed config object
 * @returns {Array<object>} Array of issues
 */
export function validateConfig(configPath, config) {
  const issues = [];

  if (!config) {
    issues.push({
      code: 'ERR-MCP-CONFIG-INVALID',
      message: 'Config is null; cannot validate.',
      detail: configPath,
    });
    return issues;
  }

  if (!config.mcpServers || typeof config.mcpServers !== 'object') {
    issues.push({
      code: 'ERR-MCP-CONFIG-MISSING-MCP-SERVERS',
      message: "Missing required 'mcpServers' object.",
    });
    return issues;
  }

  for (const [name, server] of Object.entries(config.mcpServers)) {
    if (!server.command) {
      issues.push({
        code: 'ERR-MCP-CONFIG-MISSING-COMMAND',
        message: `Server '${name}' missing 'command'.`,
        serverName: name,
      });
    }

    if (!Array.isArray(server.args) || server.args.length === 0) {
      issues.push({
        code: 'ERR-MCP-CONFIG-MISSING-ARGS',
        message: `Server '${name}' missing 'args' array.`,
        serverName: name,
      });
    } else {
      const entry = server.args[server.args.length - 1];

      if (!isValidFileUri(entry)) {
        issues.push({
          code: 'ERR-MCP-CONFIG-BAD-URI',
          message: `Server '${name}' entrypoint is not a valid file:/// URI.`,
          detail: entry,
          serverName: name,
        });
      } else {
        const localPath = entry.replace('file:///', '');
        if (!fs.existsSync(localPath)) {
          issues.push({
            code: 'ERR-MCP-CONFIG-ENTRYPOINT-NOT-FOUND',
            message: `Entrypoint for '${name}' does not exist.`,
            detail: localPath,
            serverName: name,
          });
        }
      }
    }

    if (server.disabled !== undefined && typeof server.disabled !== 'boolean') {
      issues.push({
        code: 'ERR-MCP-CONFIG-BAD-DISABLED',
        message: `Server '${name}' has invalid 'disabled' value.`,
        detail: JSON.stringify(server.disabled),
        serverName: name,
      });
    }
  }

  return issues;
}

/**
 * Attempt to auto-repair common config issues
 * @param {string} configPath - Path to mcp_config.json
 * @param {object|null} config - Parsed config object
 * @param {Array<object>} issues - Array of detected issues
 * @returns {{repaired: boolean, newConfig?: object}}
 */
export function repairConfig(configPath, config, issues) {
  if (!config) return { repaired: false };

  let changed = false;
  const clone = JSON.parse(JSON.stringify(config));

  for (const issue of issues) {
    const name = issue.serverName;
    if (!name) continue;
    const server = clone.mcpServers?.[name];
    if (!server) continue;

    switch (issue.code) {
      case 'ERR-MCP-CONFIG-BAD-URI': {
        const entry = server.args[server.args.length - 1];
        const fixed = entry.replace('file://', 'file:///').replace(/\\/g, '/');
        server.args[server.args.length - 1] = fixed;
        changed = true;
        break;
      }
      case 'ERR-MCP-CONFIG-ENTRYPOINT-NOT-FOUND': {
        // We can't guess a correct path; safest is to disable the server
        server.disabled = true;
        changed = true;
        break;
      }
      case 'ERR-MCP-CONFIG-BAD-DISABLED': {
        server.disabled = false;
        changed = true;
        break;
      }
      default:
        break;
    }
  }

  if (changed) {
    fs.writeFileSync(configPath, JSON.stringify(clone, null, 2), 'utf8');
    return { repaired: true, newConfig: clone };
  }

  return { repaired: false };
}

/**
 * Legacy validation function for backward compatibility
 * @param {string} configPath - Path to mcp_config.json
 * @returns {boolean} True if config is valid
 */
export function validateWindsurfMcpConfig(configPath) {
  const { config, issues: loadIssues } = loadConfig(configPath);
  loadIssues.forEach((issue) => scream(issue.code, issue.message, issue.detail));

  const validationIssues = validateConfig(configPath, config);
  validationIssues.forEach((issue) => scream(issue.code, issue.message, issue.detail));

  const allIssues = [...loadIssues, ...validationIssues];

  if (allIssues.length > 0) {
    scream(
      'ERR-MCP-CONFIG-INVALID',
      'Windsurf MCP config failed validation. Windsurf may silently skip installing this server.'
    );
    return false;
  }

  return true;
}

/**
 * Get the config path for the current platform
 * @returns {string} Path to mcp_config.json
 */
export function getWindsurfConfigPath() {
  const homeDir = os.homedir();
  // Try windsurf-next first, then windsurf, then .codeium
  const possiblePaths = [
    path.join(homeDir, '.codeium', 'windsurf-next', 'mcp_config.json'),
    path.join(homeDir, '.codeium', 'windsurf', 'mcp_config.json'),
    path.join(homeDir, '.codeium', 'mcp_config.json'),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  // Return the default if none exist
  return possiblePaths[0];
}
