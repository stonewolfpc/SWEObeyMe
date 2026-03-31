#!/usr/bin/env node
/**
 * SWE Automation MCP Server
 *
 * Provides advanced automation capabilities specifically designed for SWE-1.5
 * and other AI models to enhance software engineering workflows.
 */
declare class SWEAutomationServer {
    private server;
    private fileManager;
    private projectAnalyzer;
    private taskRunner;
    private fileAnalyzer;
    private projectMapper;
    private contextMemory;
    private promptEnforcer;
    private sweTools;
    constructor();
    /**
     * Setup tool request handlers
     */
    private setupToolHandlers;
    /**
     * Setup error handling
     */
    private setupErrorHandling;
    /**
     * Cleanup resources
     */
    private cleanup;
    /**
     * Start the MCP server
     */
    run(): Promise<void>;
}
export { SWEAutomationServer };
//# sourceMappingURL=index.d.ts.map