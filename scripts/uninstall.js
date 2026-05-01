#!/usr/bin/env node
/**
 * SWEObeyMe Uninstall Cleanup
 * Runs in standalone Node process — NO vscode API available.
 * Responsibility: Remove auto-generated MCP config entries only.
 * NEVER touches user data (backups, snapshots, settings).
 *
 * @module uninstall
 * @version 1.0.0
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

const SERVER_ID = 'swe-obey-me';

const configPaths = [
  path.join(os.homedir(), '.codeium', 'windsurf-next', 'mcp_config.json'),
  path.join(os.homedir(), '.codeium', 'windsurf', 'mcp_config.json'),
  path.join(os.homedir(), '.codeium', 'mcp_config.json'),
  path.join(os.homedir(), '.cursor', 'mcp.json'),
  path.join(os.homedir(), '.cursor', 'mcp_config.json'),
  path.join(os.homedir(), '.vscode', 'mcp_config.json'),
];

let cleaned = 0;
let errors = 0;

for (const configPath of configPaths) {
  try {
    if (!fs.existsSync(configPath)) continue;

    const raw = fs.readFileSync(configPath, 'utf8');
    if (!raw.trim()) continue;

    const config = JSON.parse(raw);
    if (!config.mcpServers || !config.mcpServers[SERVER_ID]) continue;

    delete config.mcpServers[SERVER_ID];

    // If mcpServers is now empty, remove the key entirely to keep config clean
    if (Object.keys(config.mcpServers).length === 0) {
      delete config.mcpServers;
    }

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    cleaned++;

    console.log(`[SWEObeyMe Uninstall] Removed ${SERVER_ID} from ${configPath}`);
  } catch (err) {
    errors++;

    console.error(`[SWEObeyMe Uninstall] Failed to clean ${configPath}: ${err.message}`);
  }
}

if (cleaned === 0 && errors === 0) {
  console.log('[SWEObeyMe Uninstall] No MCP configs found to clean');
} else {
  console.log(`[SWEObeyMe Uninstall] Cleaned ${cleaned} config(s), ${errors} error(s)`);
}

// User data is intentionally preserved:
// - %LOCALAPPDATA%/SWEObeyMe/.sweobeyme-backups
// - ~/.sweobeyme/backups
// - ~/.sweobeyme-shadow-memory/
// - VS Code globalState

console.log('[SWEObeyMe Uninstall] User backups, snapshots, and settings preserved.');
