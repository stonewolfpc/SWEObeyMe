// [LOCKDOWN]: Ensure NOTHING hits stdout except the MCP Protocol
const originalLog = console.log;
console.log = (...args) => {
  // Redirects all standard logs to the error channel (safe for Windsurf)
  process.stderr.write(args.join(' ') + '\n');
};

// Also silence the Audit/SWEObeyMe messages specifically
const auditLog = msg => process.stderr.write(`[AUDIT]: ${msg}\n`);
// Suppress unused variable warnings
void originalLog;
void auditLog;

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  InitializeRequestSchema,
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Import from lib modules
import { ensureBackupDir } from './lib/backup.js';
import { internalAudit, CONSTITUTION } from './lib/enforcement.js';
import { loadProjectContract, loadSweIgnore } from './lib/project.js';
import { toolHandlers, getToolDefinitions, initializeQuotes } from './lib/tools.js';

const DEBUG_LOGS = process.env.SWEOBEYME_DEBUG === '1';
const log = msg => {
  if (!DEBUG_LOGS) return;
  process.stderr.write(`[SWEObeyMe-Audit]: ${msg}\n`);
};

// Main async initialization
(async () => {
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
      version: '1.0.16',
    },
    {
      capabilities: { tools: {} },
    }
  );

  // Ensure backup directory exists
  await ensureBackupDir();

  // Initialize handler - REQUIRED for handshake
  server.setRequestHandler(InitializeRequestSchema, async () => {
    // Do not block initialize on filesystem IO; Windsurf may EOF if init is slow.
    // Kick off in background if not already loaded.
    loadProjectContract().catch(() => {});
    loadSweIgnore().catch(() => {});

    return {
      protocolVersion: '2024-11-05',
      capabilities: { tools: {} },
      serverInfo: { name: 'SWEObeyMe', version: '1.0.16' },
    };
  });

  // ListTools handler - REQUIRED for green dot
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
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
          internalAudit.surgicalIntegrityScore + 1
        );
      }

      // If the AI is failing too much, force it to check the Constitution
      if (internalAudit.consecutiveFailures >= CONSTITUTION.ERROR_THRESHOLD && result) {
        result.content.push({
          type: 'text',
          text: "\n[SYSTEM ALERT]: High failure rate detected. Call 'get_architectural_directive' before your next move.",
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

  // Re-check the handshake logic
  const startServer = async () => {
    try {
      await server.connect(transport);
      if (DEBUG_LOGS) process.stderr.write('[SWEObeyMe]: Governor Online. Handshake Complete.\n');
    } catch (error) {
      process.stderr.write(`[CRITICAL]: Handshake Failed: ${error}\n`);
      // Do NOT call process.exit() - VS Code extension host prevents it
      throw error;
    }
  };

  await startServer();

  // Background initialization (must not delay MCP handshake)
  ensureBackupDir().catch(() => {});
  loadProjectContract().catch(() => {});
  loadSweIgnore().catch(() => {});
  log('Server started successfully.');

  // [LIFECYCLE MANAGEMENT]: Graceful Shutdown for VS Code Extension Host
  let isShuttingDown = false;
  const initiateShutdown = reason => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    process.stderr.write(`[SHUTDOWN] ${reason}. Cleaning up gracefully (no exit call)...\n`);
    // Close the MCP transport gracefully - do NOT call process.exit()
    // VS Code's extension host prevents process.exit() - let it close naturally
    transport.close().catch(() => {});
  };

  // Use the global process object explicitly
  global.process.on('SIGINT', () => initiateShutdown('SIGINT'));
  global.process.on('SIGTERM', () => initiateShutdown('SIGTERM'));

  // Listen for pipe closure (The Windsurf "Reload" fix)
  global.process.stdin.on('close', () => initiateShutdown('Stdin Closed'));

  // [DISTRIBUTION PATCH]: Active Parent Monitoring
  // Stores/VSIX often mask stdin 'close' events.
  const parentPid = global.process.ppid;

  setInterval(() => {
    try {
      // Check if the parent process still exists
      // On Windows, process.kill(pid, 0) can fail due to permission issues even when parent exists
      // Only shut down if we get a specific error indicating the process is gone
      try {
        global.process.kill(parentPid, 0);
      } catch (e) {
        // On Windows, EPERM or EACCES means permission denied, not process gone
        // Only shut down on ESRCH (No such process)
        if (e.code === 'ESRCH') {
          initiateShutdown('Parent Process (IDE) not found. Store-Life Protocol triggered.');
        }
        // Ignore permission errors - parent is likely still running
      }
    } catch (e) {
      // Ignore any other errors in parent checking
    }
  }, 5000); // Check every 5 seconds

  // 2. Handle "End of File" on stdin (Standard MCP exit)
  global.process.stdin.on('end', () => {
    initiateShutdown('IDE sent EOF');
  });

  // [ZOMBIE PREVENTION]: Force absolute termination on any pipe error
  global.process.stdout.on('error', err => {
    if (err.code === 'EPIPE') initiateShutdown('Stdout Pipe Broken (EPIPE)');
  });

  // 3. Handle standard Windows termination signals
  // Note: SIGINT and SIGTERM already registered above.

  // 4. Catch Unhandled Errors to prevent silent zombie hangs
  global.process.on('uncaughtException', err => {
    process.stderr.write(`[CRITICAL ERROR] ${err.message}\n`);
    initiateShutdown('Uncaught Exception');
  });
})(); // Close async IIFE
