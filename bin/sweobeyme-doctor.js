#!/usr/bin/env node
/**
 * SWEObeyMe Doctor CLI
 *
 * Diagnoses and auto-repairs Windsurf MCP config issues.
 * Usage: sweobeyme-doctor
 */

import path from 'path';
import { fileURLToPath } from 'url';
import {
  loadConfig,
  validateConfig,
  repairConfig,
  getWindsurfConfigPath,
} from '../lib/health/validate-windsurf-mcp-config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function logIssue(issue) {
  console.error(
    `[SWEObeyMe] MCP CONFIG ISSUE: ${issue.message} (${issue.code})` +
      (issue.detail ? `\nDetails: ${issue.detail}` : '') +
      (issue.serverName ? `\nServer: ${issue.serverName}` : '')
  );
}

function main() {
  const configPath = getWindsurfConfigPath();

  console.info('[SWEObeyMe] Doctor: Checking Windsurf MCP config at:');
  console.info(`  ${configPath}\n`);

  const { config, issues: loadIssues } = loadConfig(configPath);
  loadIssues.forEach(logIssue);

  const validationIssues = validateConfig(configPath, config);
  validationIssues.forEach(logIssue);

  const allIssues = [...loadIssues, ...validationIssues];

  if (allIssues.length === 0) {
    console.info('[SWEObeyMe] Doctor: MCP config looks valid ✅');
    process.exit(0);
  }

  console.info(
    `\n[SWEObeyMe] Doctor: Found ${allIssues.length} issue(s). Attempting self-repair...\n`
  );

  const { repaired } = repairConfig(configPath, config, allIssues);

  if (repaired) {
    console.info('[SWEObeyMe] Doctor: Config repaired ✅  Re-run doctor to confirm.');
    process.exit(0);
  } else {
    console.info('[SWEObeyMe] Doctor: Unable to auto-repair all issues. Manual fix required.');
    process.exit(1);
  }
}

main();
