import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { FileManager } from '../utils/file-manager.js';
import { ProjectAnalyzer } from '../utils/project-analyzer.js';
import { TaskRunner } from '../utils/task-runner.js';
import { FileAnalyzer } from '../utils/file-analyzer.js';
import { ProjectMapper } from '../utils/project-mapper.js';
import { ContextMemory } from '../utils/context-memory.js';
import { PromptEnforcer } from '../utils/prompt-enforcer.js';
/**
 * SWE Automation Tools
 *
 * Provides specialized tools for SWE-1.5 and other AI models to enhance
 * software engineering workflows with advanced automation capabilities.
 */
export declare class SWEAutomationTools {
    private fileManager;
    private projectAnalyzer;
    private taskRunner;
    private fileAnalyzer;
    private projectMapper;
    private contextMemory;
    private promptEnforcer;
    constructor(fileManager: FileManager, projectAnalyzer: ProjectAnalyzer, taskRunner: TaskRunner, fileAnalyzer: FileAnalyzer, projectMapper: ProjectMapper, contextMemory: ContextMemory, promptEnforcer: PromptEnforcer);
    /**
     * Get all available tools
     */
    getAllTools(): Tool[];
    /**
     * Execute a specific tool
     */
    executeTool(name: string, args: any): Promise<any>;
    /**
     * Handle get_last_context tool
     */
    private handleGetLastContext;
    /**
     * Handle set_last_context tool
     */
    private handleSetLastContext;
    /**
     * Handle run multi-agent task tool
     */
    private handleRunMultiAgentTask;
    /**
     * Generate unique ID
     */
    private generateId;
}
/**
 * Run orchestrated task function
 */
export declare function runOrchestratedTask(task: string): Promise<any>;
//# sourceMappingURL=swe-automation.d.ts.map