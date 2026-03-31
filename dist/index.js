#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError, } from '@modelcontextprotocol/sdk/types.js';
import { SWEAutomationTools } from './tools/swe-automation.js';
import { FileManager } from './utils/file-manager.js';
import { ProjectAnalyzer } from './utils/project-analyzer.js';
import { TaskRunner } from './utils/task-runner.js';
import { FileAnalyzer } from './utils/file-analyzer.js';
import { ProjectMapper } from './utils/project-mapper.js';
import { ContextMemory } from './utils/context-memory.js';
import { PromptEnforcer } from './utils/prompt-enforcer.js';
/**
 * SWE Automation MCP Server
 *
 * Provides advanced automation capabilities specifically designed for SWE-1.5
 * and other AI models to enhance software engineering workflows.
 */
class SWEAutomationServer {
    server;
    fileManager;
    projectAnalyzer;
    taskRunner;
    fileAnalyzer;
    projectMapper;
    contextMemory;
    promptEnforcer;
    sweTools;
    constructor() {
        this.server = new Server({
            name: 'swe-automation-mcp-server',
            version: '1.0.0',
        }, {
            capabilities: {
                tools: {},
            },
        });
        this.fileManager = new FileManager();
        this.projectAnalyzer = new ProjectAnalyzer();
        this.taskRunner = new TaskRunner();
        this.fileAnalyzer = new FileAnalyzer();
        this.projectMapper = new ProjectMapper();
        this.contextMemory = new ContextMemory();
        this.promptEnforcer = new PromptEnforcer(this.contextMemory, this.projectMapper);
        this.sweTools = new SWEAutomationTools(this.fileManager, this.projectAnalyzer, this.taskRunner, this.fileAnalyzer, this.projectMapper, this.contextMemory, this.promptEnforcer);
        this.setupToolHandlers();
        this.setupErrorHandling();
    }
    /**
     * Setup tool request handlers
     */
    setupToolHandlers() {
        // List available tools
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: this.sweTools.getAllTools(),
            };
        });
        // Handle tool calls
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            try {
                const result = await this.sweTools.executeTool(name, args);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            catch (error) {
                if (error instanceof McpError) {
                    throw error;
                }
                throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`);
            }
        });
    }
    /**
     * Setup error handling
     */
    setupErrorHandling() {
        this.server.onerror = (error) => {
            console.error('[MCP Error]', error);
        };
        process.on('SIGINT', async () => {
            await this.cleanup();
            process.exit(0);
        });
        process.on('SIGTERM', async () => {
            await this.cleanup();
            process.exit(0);
        });
    }
    /**
     * Cleanup resources
     */
    async cleanup() {
        try {
            await this.taskRunner.cleanup();
            await this.fileManager.cleanup();
            await this.projectAnalyzer.clearCache();
            await this.contextMemory.cleanup();
        }
        catch (error) {
            console.error('[Cleanup Error]', error);
        }
    }
    /**
     * Start the MCP server
     */
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('SWE Automation MCP Server running on stdio');
    }
}
/**
 * Main entry point
 */
async function main() {
    const server = new SWEAutomationServer();
    await server.run();
}
// Start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch((error) => {
        console.error('Server startup failed:', error);
        process.exit(1);
    });
}
export { SWEAutomationServer };
//# sourceMappingURL=index.js.map