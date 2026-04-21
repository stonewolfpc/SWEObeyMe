import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  InitializeRequestSchema,
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import path from 'path';

// Import from lib modules
import { ensureBackupDir } from './lib/backup.js';
import { internalAudit, CONSTITUTION } from './lib/enforcement.js';
import { loadProjectContract, loadSweIgnore } from './lib/project.js';
import { toolHandlers, getToolDefinitions, initializeQuotes } from './lib/tools.js';
import { initializePromptRegistry, getPromptRegistry } from './lib/prompts/registry.js';
import { getDynamicToolRegistry } from './lib/tools/registry-dynamic.js';
import { getLanguageSpecificTools } from './lib/language-upper-functions.js';
import { getProactiveVoice, GOVERNANCE_CONSTITUTION } from './lib/proactive-voice.js';
import { getServerDiagnostics } from './lib/server-diagnostics.js';
import { initializeOAuthManager, getOAuthManager } from './lib/oauth-manager.js';

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

// Transport selection: stdio (default) or http/sse
const TRANSPORT_MODE = process.env.SWEOBEYME_TRANSPORT || 'stdio';
const HTTP_PORT = process.env.SWEOBEYME_PORT || 3000;
const HTTP_HOST = process.env.SWEOBEYME_HOST || '127.0.0.1';

// Main async initialization
(async () => {
  // Startup banner to stderr (not stdout) for diagnostics
  process.stderr.write(`[SWEObeyMe] MCP server starting: ${__filename}\n`);
  process.stderr.write(`[SWEObeyMe] Version: ${VERSION}\n`);
  process.stderr.write(`[SWEObeyMe] Platform: ${process.platform}\n`);
  process.stderr.write(`[SWEObeyMe] Node: ${process.version}\n`);
  process.stderr.write(`[SWEObeyMe] Transport: ${TRANSPORT_MODE}\n`);

  // HTTP transport dependencies - imported conditionally to avoid bundling issues
  let SSEServerTransport, express, cors;
  if (TRANSPORT_MODE === 'http' || TRANSPORT_MODE === 'sse') {
    const sseModule = await import('@modelcontextprotocol/sdk/server/sse.js');
    SSEServerTransport = sseModule.SSEServerTransport;
    const expressModule = await import('express');
    express = expressModule.default;
    const corsModule = await import('cors');
    cors = corsModule.default;
  }

  try {
    // Initialize quotes module
    await initializeQuotes();
  } catch (error) {
    console.error('[SWEObeyMe]: Failed to initialize quotes:', error);
  }

  // Initialize OAuth manager
  try {
    await initializeOAuthManager();
  } catch (error) {
    console.error('[SWEObeyMe]: Failed to initialize OAuth manager:', error);
  }

  // Initialize server
  const server = new Server(
    {
      name: 'swe-obey-me',
      version: VERSION,
    },
    {
      capabilities: { tools: {}, prompts: {} },
    },
  );

  // Ensure backup directory exists
  await ensureBackupDir();

  // Initialize proactive voice system
  const proactiveVoice = getProactiveVoice();

  // Initialize server diagnostics
  const diagnostics = getServerDiagnostics();

  // Run initial diagnostics in background (non-blocking)
  diagnostics.runDiagnostics().then(results => {
    diagnostics.lastResults = results;
    log(`Diagnostics completed: ${results.summary.overall} (${results.summary.pass}/${results.summary.total} passed)`);
  }).catch(error => {
    log(`Diagnostics failed: ${error.message}`);
  });

  // Initialize handler - REQUIRED for handshake
  server.setRequestHandler(InitializeRequestSchema, () => {
    // Do not block initialize on filesystem IO; Windsurf may EOF if init is slow.
    // Kick off in background if not already loaded.
    loadProjectContract().catch(() => {});
    loadSweIgnore().catch(() => {});
    initializePromptRegistry().catch(() => {});

    return {
      protocolVersion: '2025-11-25',
      capabilities: { tools: {}, prompts: {} },
      serverInfo: { 
        name: 'SWEObeyMe', 
        version: VERSION,
        // Add diagnostic metadata for Windsurf UI
        _diagnostics: {
          status: 'initializing',
          message: 'SWEObeyMe initializing - diagnostics running in background',
        },
      },
    };
  });

  // Initialize dynamic tool registry
  const dynamicRegistry = getDynamicToolRegistry();

  // ListTools handler - REQUIRED for green dot
  // Uses dynamic registry for project-specific toolsets and corpus disabling
  server.setRequestHandler(ListToolsRequestSchema, () => ({
    tools: dynamicRegistry.getFilteredToolDefinitions(),
  }));

  // ListPrompts handler - REQUIRED for prompt discovery
  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    const registry = await getPromptRegistry();
    const prompts = registry.getAllPrompts();

    return {
      prompts: prompts.map(prompt => ({
        name: prompt.name,
        description: prompt.description,
        arguments: prompt.arguments || [],
      })),
    };
  });

  // GetPrompt handler - REQUIRED for prompt retrieval
  server.setRequestHandler(GetPromptRequestSchema, async request => {
    const { name, arguments: args = {} } = request.params;
    const registry = await getPromptRegistry();
    const prompt = registry.getPrompt(name);

    if (!prompt) {
      throw new Error(`Prompt ${name} not found`);
    }

    // Apply arguments to template if it exists
    let messages = prompt.messages || [];
    if (prompt.template) {
      messages = [{ role: 'user', content: prompt.template }];
    }

    // Replace argument placeholders in messages
    if (args && messages.length > 0) {
      messages = messages.map(msg => ({
        ...msg,
        content: msg.content.replace(/\{\{(\w+)\}\}/g, (match, key) => args[key] || match),
      }));
    }

    return {
      description: prompt.description,
      messages,
    };
  });

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

      // Proactive voice analysis - automatically recommend next actions
      const proactiveAnalysis = await proactiveVoice.analyzeToolCall(name, result, { args });

      // Add proactive recommendations to result
      if (proactiveAnalysis.recommendations.length > 0) {
        const recommendationsText = proactiveAnalysis.recommendations
          .map(rec => {
            let text = `\n[${rec.priority.toUpperCase()}] ${rec.message}`;
            if (rec.prompt) {
              text += `\n  Recommended prompt: ${rec.prompt}`;
            }
            return text;
          })
          .join('\n');

        result.content.push({
          type: 'text',
          text: `\n=== SWEObeyMe Proactive Guidance ===\n${recommendationsText}\n=== End Guidance ===\nIntegrity Score: ${proactiveAnalysis.integrityScore}/100`,
        });
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
      
      const errorMessage = error.message;
      const validationStatus = `\n\n[VALIDATION STATUS]\nSurgical Integrity Score: ${internalAudit.surgicalIntegrityScore}/100\nConsecutive Failures: ${internalAudit.consecutiveFailures}\nRecommended Action: Call get_validation_status for details`;
      
      return {
        isError: true,
        content: [{ type: 'text', text: errorMessage + validationStatus }],
        _validation: {
          integrityScore: internalAudit.surgicalIntegrityScore,
          consecutiveFailures: internalAudit.consecutiveFailures,
        },
      };
    }
  });

  // [TRANSPORT SELECTION]: stdio (default) or http/sse
  if (TRANSPORT_MODE === 'stdio') {
    // [STRICT TRANSPORT]: Standard Input/Output
    const transport = new StdioServerTransport();

    // Start server
    try {
      await server.connect(transport);
      process.stderr.write('[SWEObeyMe] MCP server connected and ready (stdio transport)\n');
    } catch (error) {
      process.stderr.write(`[CRITICAL]: Handshake Failed: ${error}\n`);
      throw error;
    }
  } else if (TRANSPORT_MODE === 'http' || TRANSPORT_MODE === 'sse') {
    // HTTP/SSE Transport
    const app = express();
    app.use(cors());
    app.use(express.json());

    // Root route
    app.get('/', (req, res) => {
      res.json({ message: 'SWEObeyMe MCP Server', version: VERSION, transport: TRANSPORT_MODE });
    });

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({ status: 'ok', version: VERSION, transport: TRANSPORT_MODE });
    });

    // Test endpoint
    app.get('/test', (req, res) => {
      res.json({ message: 'Express is working', transport: TRANSPORT_MODE });
    });

    // OAuth endpoints
    app.get('/oauth/pkce', async (req, res) => {
      try {
        const oauthManager = getOAuthManager();
        if (!oauthManager) {
          return res.status(503).json({ error: 'OAuth manager not initialized' });
        }
        const state = req.query.state || crypto.randomUUID();
        const challenge = await oauthManager.generatePKCEChallenge(state);
        res.json(challenge);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // OAuth callback endpoint
    app.post('/oauth/callback', async (req, res) => {
      try {
        const oauthManager = getOAuthManager();
        if (!oauthManager) {
          return res.status(503).json({ error: 'OAuth manager not initialized' });
        }
        const { provider, code, state, codeVerifier } = req.body;
        
        if (!provider || !code || !state) {
          return res.status(400).json({ error: 'Missing required parameters' });
        }

        // Verify PKCE challenge if codeVerifier is provided
        if (codeVerifier) {
          oauthManager.verifyPKCEChallenge(state, codeVerifier);
        }

        // Store the token (this would normally exchange the code for tokens)
        // For now, we'll store the code as a placeholder
        await oauthManager.storeToken(provider, code, null, 3600);

        res.json({ success: true, provider });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get token status
    app.get('/oauth/token/:provider', (req, res) => {
      try {
        const oauthManager = getOAuthManager();
        if (!oauthManager) {
          return res.status(503).json({ error: 'OAuth manager not initialized' });
        }
        const { provider } = req.params;
        const token = oauthManager.getToken(provider);
        
        if (!token) {
          return res.status(404).json({ error: 'Token not found' });
        }

        res.json({
          provider: token.provider,
          expiresAt: token.expiresAt,
          isExpired: token.isExpired(),
          willExpireSoon: token.willExpireSoon(),
          scopes: token.scopes,
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Remove token
    app.delete('/oauth/token/:provider', async (req, res) => {
      try {
        const oauthManager = getOAuthManager();
        if (!oauthManager) {
          return res.status(503).json({ error: 'OAuth manager not initialized' });
        }
        const { provider } = req.params;
        await oauthManager.removeToken(provider);
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // OAuth statistics
    app.get('/oauth/stats', (req, res) => {
      try {
        const oauthManager = getOAuthManager();
        if (!oauthManager) {
          return res.status(503).json({ error: 'OAuth manager not initialized' });
        }
        const stats = oauthManager.getStatistics();
        res.json(stats);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // SSE endpoint for streaming
    if (TRANSPORT_MODE === 'sse') {
      app.get('/sse', async (req, res) => {
        process.stderr.write('[SWEObeyMe] SSE connection established\n');
        
        // Set SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Access-Control-Allow-Origin', '*');

        // Create SSE transport
        const transport = new SSEServerTransport('/message', res);

        try {
          await server.connect(transport);
          process.stderr.write('[SWEObeyMe] MCP server connected and ready (SSE transport)\n');
        } catch (error) {
          process.stderr.write(`[CRITICAL]: SSE Handshake Failed: ${error}\n`);
          res.end();
          throw error;
        }

        // Handle client disconnect
        req.on('close', () => {
          process.stderr.write('[SWEObeyMe] SSE connection closed\n');
        });
      });
    }

    // Start HTTP server
    app.listen(HTTP_PORT, HTTP_HOST, () => {
      process.stderr.write(`[SWEObeyMe] MCP server listening on http://${HTTP_HOST}:${HTTP_PORT} (${TRANSPORT_MODE} transport)\n`);
    });
  } else {
    process.stderr.write(`[ERROR]: Unknown transport mode: ${TRANSPORT_MODE}. Use 'stdio' or 'sse'.\n`);
    process.exit(1);
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
