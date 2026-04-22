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
import express from 'express';
import cors from 'cors';
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
import { initializeRefreshRecovery, getRefreshRecovery } from './lib/refresh-recovery.js';
import { initializeURLHandler, getURLHandler } from './lib/url-handler.js';
import { initializeLoadingStateManager, getLoadingStateManager } from './lib/loading-state.js';
import { initializeAutoEnforcement, getAutoEnforcement } from './lib/auto-enforcement.js';
import { initializeAuditSystem, getAuditSystem } from './lib/audit-system.js';
import { initializeDuplicateScanner, getDuplicateScanner } from './lib/duplicate-scanner.js';
import { initializeSessionTracker, getSessionTracker } from './lib/session-tracker.js';
import { initializeShadowMemoryLedger, getShadowMemoryLedger } from './lib/shadow-memory-ledger.js';
import { initializeStartupPromptInjector, getStartupPromptInjector } from './lib/startup-prompt-injector.js';
import { initializeProjectMemorySystem, getProjectMemoryManager } from './lib/project-memory-system.js';
import { initializeProjectRegistry, getProjectRegistry } from './lib/project-registry.js';
import { initializeArchiveManager, getArchiveManager } from './lib/archive-manager.js';
import { setBackupCallback } from './lib/backup.js';
import { loadSessionState, incrementToolCallCounter, shouldShowReminder, updateLastReminder, getSessionState, setTaskListSnapshot, setCurrentTaskId } from './lib/session-state.js';

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
const HTTP_PORT = process.env.SWEOBEYME_PORT || 3001;
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
  let SSEServerTransport;
  if (TRANSPORT_MODE === 'http' || TRANSPORT_MODE === 'sse') {
    const sseModule = await import('@modelcontextprotocol/sdk/server/sse.js');
    SSEServerTransport = sseModule.SSEServerTransport;
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

  // Initialize refresh-recovery mechanisms
  try {
    initializeRefreshRecovery({
      circuitBreaker: {
        failureThreshold: 5,
        resetTimeout: 60000,
        callTimeout: 30000,
      },
      retryHandler: {
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 30000,
        backoffMultiplier: 2,
      },
      connectionRefresh: {
        refreshInterval: 300000,
        healthCheckInterval: 60000,
        maxRetries: 3,
      },
    });
    console.log('[SWEObeyMe] Refresh/recovery mechanisms initialized');
  } catch (error) {
    console.error('[SWEObeyMe]: Failed to initialize refresh/recovery:', error);
  }

  // Initialize URL handler
  try {
    initializeURLHandler({
      urlHandler: {
        baseUrl: `http://${HTTP_HOST}:${HTTP_PORT}`,
        defaultPath: '/mcp',
        strictValidation: true,
      },
      router: {
        defaultRoute: null,
      },
      config: {
        defaultConfig: {
          protocol: 'http:',
          host: HTTP_HOST,
          port: HTTP_PORT,
        },
      },
    });
    console.log('[SWEObeyMe] URL handler initialized');
  } catch (error) {
    console.error('[SWEObeyMe]: Failed to initialize URL handler:', error);
  }

  // Initialize loading state manager
  try {
    initializeLoadingStateManager({
      maxStates: 100,
      stateTimeout: 300000,
      cleanupInterval: 60000,
    });
    console.log('[SWEObeyMe] Loading state manager initialized');
  } catch (error) {
    console.error('[SWEObeyMe]: Failed to initialize loading state manager:', error);
  }

  // Initialize automated rule enforcement
  try {
    initializeAutoEnforcement({
      enabled: true,
      autoIntercept: true,
      thresholds: {
        maxFileSize: 500,
        maxFunctionLength: 50,
        maxNestingDepth: 4,
        maxFunctionCount: 10,
        maxClassCount: 5,
      },
      forbiddenPatterns: [
        /console\.log\(/,
        /debugger/,
        /TODO/,
        /FIXME/,
        /XXX/,
      ],
    });
    console.log('[SWEObeyMe] Automated rule enforcement initialized');
  } catch (error) {
    console.error('[SWEObeyMe]: Failed to initialize auto enforcement:', error);
  }

  // Initialize audit system
  try {
    initializeAuditSystem({
      preWorkAuditor: {
        enabled: true,
        projectRoot: process.cwd(),
        scanDepth: 3,
        similarityThreshold: 0.7,
      },
    });
    console.log('[SWEObeyMe] Audit system initialized');
  } catch (error) {
    console.error('[SWEObeyMe]: Failed to initialize audit system:', error);
  }

  // Initialize duplicate scanner
  try {
    initializeDuplicateScanner({
      projectRoot: process.cwd(),
      scanDepth: 3,
      similarityThreshold: 0.7,
    });
    console.log('[SWEObeyMe] Duplicate scanner initialized');
  } catch (error) {
    console.error('[SWEObeyMe]: Failed to initialize duplicate scanner:', error);
  }

  // Initialize session tracker
  try {
    initializeSessionTracker();
    console.log('[SWEObeyMe] Session tracker initialized');
  } catch (error) {
    console.error('[SWEObeyMe]: Failed to initialize session tracker:', error);
  }

  // Initialize shadow memory ledger
  try {
    await initializeShadowMemoryLedger();
    console.log('[SWEObeyMe] Shadow memory ledger initialized');
  } catch (error) {
    console.error('[SWEObeyMe]: Failed to initialize shadow memory ledger:', error);
  }

  // Initialize startup prompt injector
  try {
    await initializeStartupPromptInjector();
    console.log('[SWEObeyMe] Startup prompt injector initialized');
  } catch (error) {
    console.error('[SWEObeyMe]: Failed to initialize startup prompt injector:', error);
  }

  // Initialize project memory system
  try {
    await initializeProjectMemorySystem();
    console.log('[SWEObeyMe] Project memory system initialized');
  } catch (error) {
    console.error('[SWEObeyMe]: Failed to initialize project memory system:', error);
  }

  // Initialize project registry
  try {
    await initializeProjectRegistry();
    console.log('[SWEObeyMe] Project registry initialized');
  } catch (error) {
    console.error('[SWEObeyMe]: Failed to initialize project registry:', error);
  }

  // Initialize archive manager
  try {
    await initializeArchiveManager();
    console.log('[SWEObeyMe] Archive manager initialized');
  } catch (error) {
    console.error('[SWEObeyMe]: Failed to initialize archive manager:', error);
  }

  // Load session state for task reminder system
  try {
    loadSessionState();
    console.log('[SWEObeyMe] Session state loaded');
  } catch (error) {
    console.error('[SWEObeyMe] Failed to load session state:', error);
  }

  // Set up backup callback for project memory integration
  setBackupCallback(async (filePath, backupPath, timestamp) => {
    try {
      const projectRegistry = getProjectRegistry();
      if (!projectRegistry) return;

      // Find project for this file
      const projects = projectRegistry.getAllProjects();
      const project = projects.find(p => filePath.startsWith(p.projectPath));
      
      if (project) {
        const memoryManager = await getProjectMemoryManager(project.projectName);
        if (memoryManager) {
          // Include current task context in backup metadata
          const sessionState = getSessionState();
          const taskContext = sessionState.currentTaskId ? {
            taskId: sessionState.currentTaskId,
            taskList: sessionState.taskListSnapshot || [],
          } : null;
          
          memoryManager.linkToBackup(filePath, backupPath, taskContext);
        }
      }
    } catch (error) {
      console.error('[Backup Callback] Failed to link backup to project memory:', error);
    }
  });

  // Reset old shadow memory directory (Phase 5.1)
  // This prevents pollution from old global memory and starts fresh with project-based system
  try {
    const oldShadowMemoryDir = path.join(os.homedir(), '.sweobeyme-shadow-memory');
    if (fs.existsSync(oldShadowMemoryDir)) {
      console.log('[SWEObeyMe] Resetting old shadow memory directory:', oldShadowMemoryDir);
      fs.rmSync(oldShadowMemoryDir, { recursive: true, force: true });
      console.log('[SWEObeyMe] Old shadow memory directory deleted');
    }
  } catch (error) {
    console.error('[SWEObeyMe]: Failed to reset old shadow memory directory:', error);
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
  server.setRequestHandler(InitializeRequestSchema, (request) => {
    const injector = getStartupPromptInjector();
    const ledger = getShadowMemoryLedger();
    
    // Detect new conversation
    const modelInfo = request.params?.clientInfo?.name || 'unknown';
    const isNewConversation = injector.detectNewConversation(modelInfo);
    
    if (isNewConversation) {
      console.log(`[SWEObeyMe] New conversation detected: ${modelInfo}`);
      ledger.startNewSession();
    }

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
    const injector = getStartupPromptInjector();
    const ledger = getShadowMemoryLedger();

    log(`Tool called: ${name}`);

    // Increment tool call counter
    const callCount = incrementToolCallCounter();

    // Get project memory manager if available
    const projectRegistry = getProjectRegistry();
    let memoryManager = null;
    if (projectRegistry && args?.path) {
      const projects = projectRegistry.getAllProjects();
      const project = projects.find(p => args.path.startsWith(p.projectPath));
      if (project) {
        memoryManager = await getProjectMemoryManager(project.projectName);
      }
    }

    // Inject startup prompt if this is the first tool call of a new conversation
    const startupPrompt = injector.injectStartupPromptIntoToolCall(name, args, {
      filePath: args?.path,
    });

    if (startupPrompt) {
      console.log('[SWEObeyMe] Injecting startup prompt');
      // Record the startup prompt in the ledger
      ledger.recordEvent('startup_prompt_injected', {
        sessionId: startupPrompt.sessionId,
        model: startupPrompt.model,
        tool: name,
      });
    }

    // Check if tool exists
    if (!toolHandlers[name]) {
      throw new Error(`Tool ${name} not found`);
    }

    let result;
    try {
      // Call the tool handler
      result = await toolHandlers[name](args);

      // Inject task reminder if applicable
      // Only on pertinent tools: read_file, write_file, obey_surgical_plan, refactor_manage, etc.
      const pertinentTools = ['read_file', 'write_file', 'obey_surgical_plan', 'preflight_change', 'refactor_manage', 'backup_manage', 'analyze_file', 'code_analyze'];
      if (pertinentTools.includes(name) && shouldShowReminder()) {
        const sessionState = getSessionState();
        const currentTaskId = sessionState.currentTaskId;
        const taskList = sessionState.taskListSnapshot || [];
        
        if (taskList.length > 0) {
          const currentTask = taskList.find(t => t.id === currentTaskId) || taskList[0];
          const currentIndex = taskList.findIndex(t => t.id === currentTaskId);
          const remaining = taskList.filter(t => t.status !== 'completed').length;
          
          const reminderText = `[CONTEXT REMINDER] Call ${callCount}. Task ${currentIndex + 1}/${taskList.length}: "${currentTask.description || currentTask}" (${currentTask.status || 'pending'}). Remaining: ${remaining}. Resume with project_track when complete.`;
          
          result.content.push({
            type: 'text',
            text: reminderText,
          });
          
          updateLastReminder(callCount);
        }
      }

      // Inject startup prompt into result if this is a new conversation
      if (startupPrompt && result && result.content) {
        result.content.unshift({
          type: 'text',
          text: startupPrompt.prompt,
        });
      }

      // Record file events in shadow memory ledger (legacy)
      if (name === 'read_file' && args?.path) {
        ledger.recordFileEvent(args.path, 'file_read', { path: args.path });
      } else if (name === 'write_file' && args?.path) {
        ledger.recordFileEvent(args.path, 'file_edit', { path: args.path });
      } else if (name === 'obey_surgical_plan' && args?.target_file) {
        ledger.recordFileEvent(args.target_file, 'surgical_plan', { target_file: args.target_file });
      }

      // Record in project memory system if available
      if (memoryManager) {
        if (name === 'read_file' && args?.path) {
          memoryManager.recordFileEvent(args.path, 'file_read', { path: args.path });
        } else if (name === 'write_file' && args?.path) {
          memoryManager.recordFileEvent(args.path, 'file_edit', { path: args.path });
        } else if (name === 'obey_surgical_plan' && args?.target_file) {
          memoryManager.recordFileEvent(args.target_file, 'surgical_plan', { target_file: args.target_file });
          memoryManager.recordArchitecture({
            decision: 'Surgical plan approved for file modification',
            targetFile: args.target_file,
            currentLineCount: args?.current_line_count,
            estimatedAddition: args?.estimated_addition,
          });
        } else if (name === 'preflight_change' && args?.path) {
          memoryManager.recordEvent('preflight_check', { path: args.path });
        } else if (name === 'audit' && args?.operation) {
          memoryManager.recordEvent('audit', { operation: args.operation });
        }

        // Record tool call
        memoryManager.recordEvent('tool_call', { tool: name, args });
      }

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
  } else if (TRANSPORT_MODE === 'http') {
    // HTTP REST API mode - Express server only (no MCP transport)
    const app = express();
    
    // Add request logging middleware
    app.use((req, res, next) => {
      process.stderr.write(`[HTTP] ${req.method} ${req.url}\n`);
      next();
    });
    
    app.use(cors());
    app.use(express.json());

    // Root route
    app.get('/', (req, res) => {
      process.stderr.write('[HTTP] Serving root route\n');
      res.json({ message: 'SWEObeyMe HTTP API', version: VERSION, transport: TRANSPORT_MODE });
    });

    // Health check endpoint
    app.get('/health', (req, res) => {
      process.stderr.write('[HTTP] Serving health route\n');
      res.json({ status: 'ok', version: VERSION, transport: TRANSPORT_MODE });
    });

    // Test endpoint
    app.get('/test', (req, res) => {
      process.stderr.write('[HTTP] Serving test route\n');
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

    // Health check endpoint
    app.get('/health/detailed', (req, res) => {
      try {
        const refreshRecovery = getRefreshRecovery();
        const health = {
          status: 'ok',
          timestamp: new Date().toISOString(),
          version: VERSION,
          transport: TRANSPORT_MODE,
          circuitBreaker: refreshRecovery.circuitBreaker.getState(),
          connections: refreshRecovery.connectionRefreshManager.getAllHealthStatus(),
        };
        res.json(health);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Circuit breaker status
    app.get('/circuit-breaker/status', (req, res) => {
      try {
        const refreshRecovery = getRefreshRecovery();
        const status = refreshRecovery.circuitBreaker.getState();
        res.json(status);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Circuit breaker reset
    app.post('/circuit-breaker/reset', (req, res) => {
      try {
        const refreshRecovery = getRefreshRecovery();
        refreshRecovery.circuitBreaker.reset();
        res.json({ success: true, message: 'Circuit breaker reset' });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Loading state statistics
    app.get('/loading/stats', (req, res) => {
      try {
        const { loadingStateManager } = getLoadingStateManager();
        const stats = loadingStateManager.getStatistics();
        res.json(stats);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get all loading states
    app.get('/loading/states', (req, res) => {
      try {
        const { loadingStateManager } = getLoadingStateManager();
        const states = loadingStateManager.getAllStates();
        res.json(states);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get loading state by ID
    app.get('/loading/state/:id', (req, res) => {
      try {
        const { id } = req.params;
        const { loadingStateManager } = getLoadingStateManager();
        const state = loadingStateManager.getState(id);
        if (!state) {
          return res.status(404).json({ error: 'State not found' });
        }
        res.json(state);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get progress for a state
    app.get('/loading/progress/:id', (req, res) => {
      try {
        const { id } = req.params;
        const { loadingStateManager } = getLoadingStateManager();
        const progress = loadingStateManager.getProgress(id);
        if (!progress) {
          return res.status(404).json({ error: 'Progress not found' });
        }
        res.json(progress);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Automated rule enforcement status
    app.get('/enforcement/status', (req, res) => {
      try {
        const { autoEnforcement } = getAutoEnforcement();
        const status = {
          enabled: autoEnforcement.enabled,
          thresholds: autoEnforcement.thresholds,
          violations: autoEnforcement.getViolations().length,
        };
        res.json(status);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Validate a file against rules
    app.post('/enforcement/validate', (req, res) => {
      try {
        const { filePath } = req.body;
        if (!filePath) {
          return res.status(400).json({ error: 'File path is required' });
        }

        const fs = require('fs');
        const content = fs.readFileSync(filePath, 'utf8');
        const { autoEnforcement } = getAutoEnforcement();
        const validation = autoEnforcement.validateFile(filePath, content);

        res.json(validation);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get enforcement statistics
    app.get('/enforcement/stats', (req, res) => {
      try {
        const { autoEnforcement } = getAutoEnforcement();
        const violations = autoEnforcement.getViolations();

        const stats = {
          totalViolations: violations.length,
          byType: {},
          bySeverity: {},
          byRule: {},
        };

        for (const violation of violations) {
          stats.byType[violation.type] = (stats.byType[violation.type] || 0) + 1;
          stats.bySeverity[violation.severity] = (stats.bySeverity[violation.severity] || 0) + 1;
          stats.byRule[violation.id] = (stats.byRule[violation.id] || 0) + 1;
        }

        res.json(stats);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Audit system status
    app.get('/audit/status', (req, res) => {
      try {
        const { preWorkAuditor, todoScheduler } = getAuditSystem();
        const status = {
          preWorkAuditor: {
            enabled: preWorkAuditor.enabled,
            issues: preWorkAuditor.getIssues().length,
          },
          todoScheduler: {
            schedules: todoScheduler.getSchedules().length,
          },
        };
        res.json(status);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Run pre-work audit
    app.post('/audit/pre-work', (req, res) => {
      try {
        const { taskDescription } = req.body;
        if (!taskDescription) {
          return res.status(400).json({ error: 'Task description is required' });
        }

        const { preWorkAuditor } = getAuditSystem();
        preWorkAuditor.auditBeforeWork(taskDescription).then(audit => {
          res.json(audit);
        }).catch(error => {
          res.status(500).json({ error: error.message });
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get audit issues
    app.get('/audit/issues', (req, res) => {
      try {
        const { preWorkAuditor } = getAuditSystem();
        const issues = preWorkAuditor.getIssues();
        res.json(issues);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get due todos
    app.get('/audit/todos/due', (req, res) => {
      try {
        const { todoScheduler } = getAuditSystem();
        const context = {
          action: req.query.action,
          phase: req.query.phase,
        };
        const dueTodos = todoScheduler.getDueTodos(context);
        res.json(dueTodos);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // 404 handler - must be after all other routes
    app.use((req, res) => {
      process.stderr.write(`[HTTP] 404 - Route not found: ${req.method} ${req.url}\n`);
      res.status(404).json({ error: 'Route not found', path: req.url, method: req.method });
    });

    // Error handler
    app.use((err, req, res, next) => {
      process.stderr.write(`[HTTP] Error: ${err.message}\n`);
      res.status(500).json({ error: err.message });
    });

    // Log all registered routes before starting server
    process.stderr.write(`[HTTP] Starting HTTP server on ${HTTP_HOST}:${HTTP_PORT}\n`);
    process.stderr.write(`[HTTP] Transport mode: ${TRANSPORT_MODE}\n`);

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
