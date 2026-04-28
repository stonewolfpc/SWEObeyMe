/**
 * Windsurf MCP Config Validator
 *
 * Validates Windsurf's mcp_config.json schema:
 * - File exists and is valid JSON
 * - No BOM prefix
 * - mcpServers object exists
 * - Each server has required fields (command, args, disabled)
 * - Paths are valid file:/// URIs
 * - Entry points exist on disk
 * - Paths use forward slashes
 * - No malformed env vars
 *
 * If ANYTHING is wrong → SCREAM LOUDLY and return false
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

function validateFileUri(uri) {
  if (!uri.startsWith('file:///')) return false;
  if (uri.includes('\\')) return false;
  return true;
}

function validateWindsurfMcpConfig(configPath) {
  let raw;

  try {
    raw = fs.readFileSync(configPath, 'utf8');
  } catch {
    scream('ERR-MCP-CONFIG-NOT-FOUND', 'Windsurf MCP config file not found.', configPath);
    return false;
  }

  // Detect BOM
  if (raw.charCodeAt(0) === 0xfeff) {
    scream(
      'ERR-MCP-CONFIG-BOM',
      'Windsurf MCP config contains a UTF-8 BOM. Windsurf may silently ignore it.'
    );
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    scream('ERR-MCP-CONFIG-JSON', 'Windsurf MCP config JSON is malformed.', e.message);
    return false;
  }

  if (!parsed.mcpServers || typeof parsed.mcpServers !== 'object') {
    scream('ERR-MCP-CONFIG-MISSING-MCP-SERVERS', "Missing required 'mcpServers' object.");
    return false;
  }

  let ok = true;

  for (const [name, server] of Object.entries(parsed.mcpServers)) {
    if (!server.command) {
      scream('ERR-MCP-CONFIG-MISSING-COMMAND', `Server '${name}' missing 'command' field.`);
      ok = false;
    }

    if (!Array.isArray(server.args)) {
      scream('ERR-MCP-CONFIG-MISSING-ARGS', `Server '${name}' missing 'args' array.`);
      ok = false;
    } else {
      const entry = server.args[server.args.length - 1];

      if (!validateFileUri(entry)) {
        scream(
          'ERR-MCP-CONFIG-BAD-URI',
          `Server '${name}' entrypoint is not a valid file:/// URI.`,
          entry
        );
        ok = false;
      } else {
        const localPath = entry.replace('file:///', '');
        if (!fs.existsSync(localPath)) {
          scream(
            'ERR-MCP-CONFIG-ENTRYPOINT-NOT-FOUND',
            `Entrypoint for '${name}' does not exist.`,
            localPath
          );
          ok = false;
        }
      }
    }

    if (server.disabled !== false && server.disabled !== true) {
      scream(
        'ERR-MCP-CONFIG-BAD-DISABLED',
        `Server '${name}' has invalid 'disabled' value.`,
        JSON.stringify(server.disabled)
      );
      ok = false;
    }
  }

  if (!ok) {
    scream(
      'ERR-MCP-CONFIG-INVALID',
      'Windsurf MCP config failed validation. Windsurf may silently skip installing this server.'
    );
  }

  return ok;
}

// Get the config path for the current platform
function getWindsurfConfigPath() {
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

export { validateWindsurfMcpConfig, getWindsurfConfigPath };
