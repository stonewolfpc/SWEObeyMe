import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  InitializeRequestSchema,
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

// Import from lib modules
import { ensureBackupDir } from './lib/backup.js';
import { internalAudit, CONSTITUTION } from './lib/enforcement.js';
import { loadProjectContract, loadSweIgnore } from './lib/project.js';
import { toolHandlers, getToolDefinitions, initializeQuotes } from './lib/tools.js';

// Read version from package.json (single source of truth)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
const VERSION = packageJson.version;

const DEBUG_LOGS = process.env.SWEOBEYME_DEBUG === '1';
const log = msg => {
  if (!DEBUG_LOGS) return;
  process.stderr.write(`[SWEObeyMe-Audit]: ${msg}\n`);
};

// Main async initialization
(async () => {
  // Startup banner to stderr (not stdout) for diagnostics
  process.stderr.write(`[SWEObeyMe] MCP server starting: ${__filename}\n`);
  process.stderr.write(`[SWEObeyMe] Version: ${VERSION}\n`);
  process.stderr.write(`[SWEObeyMe] Platform: ${process.platform}\n`);
  process.stderr.write(`[SWEObeyMe] Node: ${process.version}\n`);

  try {
    // Initialize quotes module
    await initializeQuotes();
  } catch (error) {
    console.error('[SWEObeyMe]: Failed to initialize quotes:', error);
  }

  // Initialize server
  const server = new Server(
    {
      name: 'swe-obey-me',
      version: VERSION,
    },
    {
      capabilities: { tools: {} },
    },
  );

  // Ensure backup directory exists
  await ensureBackupDir();

  // Initialize handler - REQUIRED for handshake
  server.setRequestHandler(InitializeRequestSchema, () => {
    // Do not block initialize on filesystem IO; Windsurf may EOF if init is slow.
    // Kick off in background if not already loaded.
    loadProjectContract().catch(() => {});
    loadSweIgnore().catch(() => {});

    return {
      protocolVersion: '2024-11-05',
      capabilities: { tools: {} },
      serverInfo: { name: 'SWEObeyMe', version: VERSION },
    };
  });

  // ListTools handler - REQUIRED for green dot
  server.setRequestHandler(ListToolsRequestSchema, () => ({
    tools: getToolDefinitions(),
  }));

  // CallTool handler - Core MCP interaction
  server.setRequestHandler(CallToolRequestSchema, async request => {
    const { name, arguments: args } = request.params;

    log(`Tool called: ${name}`);

    // Check if tool exists
    if (!toolHandlers[name]) {
      throw new Error(`Tool ${name} not found`);
    }

    let result;
    try {
      // Call the tool handler
      result = await toolHandlers[name](args);

      // PHASE 10: Pre-flight hook - Update internalAudit based on result
      if (result && result.isError) {
        internalAudit.consecutiveFailures++;
        internalAudit.surgicalIntegrityScore -= 5;
      } else if (result) {
        internalAudit.consecutiveFailures = 0;
        internalAudit.surgicalIntegrityScore = Math.min(
          100,
          internalAudit.surgicalIntegrityScore + 1,
        );
      }

      // If the AI is failing too much, force it to check the Constitution
      if (internalAudit.consecutiveFailures >= CONSTITUTION.ERROR_THRESHOLD && result) {
        result.content.push({
          type: 'text',
          text: '\n[SYSTEM ALERT]: High failure rate detected. Call \'get_architectural_directive\' before your next move.',
        });
      }

      return result;
    } catch (error) {
      // PHASE 10: Update audit on errors too
      internalAudit.consecutiveFailures++;
      internalAudit.surgicalIntegrityScore -= 5;

      log(`ERROR: ${error.message}`);
      return {
        isError: true,
        content: [{ type: 'text', text: error.message }],
      };
    }
  });

  // [STRICT TRANSPORT]: Standard Input/Output
  const transport = new StdioServerTransport();

  // Start server
  try {
    await server.connect(transport);
    process.stderr.write('[SWEObeyMe] MCP server connected and ready\n');
  } catch (error) {
    process.stderr.write(`[CRITICAL]: Handshake Failed: ${error}\n`);
    throw error;
  }

  // Background initialization (must not delay MCP handshake)
  ensureBackupDir().catch(() => {});
  loadProjectContract().catch(() => {});
  loadSweIgnore().catch(() => {});
  log('Server started successfully.');

  // Simple error handling - let process exit naturally on stdio close
  process.on('uncaughtException', err => {
    process.stderr.write(`[CRITICAL ERROR] ${err.message}\n`);
  });
})();
