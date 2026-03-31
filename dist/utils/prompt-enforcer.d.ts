import { ContextMemory } from './context-memory.js';
import { ProjectMapper } from './project-mapper.js';
/**
 * Prompt Enforcer Utility
 *
 * Enforces mandatory pre-flight injection of global rules, project context,
 * and memory into every SWE prompt to ensure deterministic behavior.
 *
 * Features:
 * - Automatic rule injection before every tool call
 * - Global context and memory integration
 * - Task-specific instruction assembly
 * - Enforced prompt structure and formatting
 * - Rule prioritization and conflict resolution
 */
export declare class PromptEnforcer {
    private contextMemory;
    private projectMapper;
    private globalRules;
    private projectContext;
    private lastContext;
    private masterContract;
    constructor(contextMemory: ContextMemory, projectMapper: ProjectMapper);
    /**
     * Enforce prompt with mandatory pre-flight injection
     *
     * @param taskInstructions - Original task instructions from user
     * @param toolName - Tool being called
     * @param args - Tool arguments
     * @returns Enforced prompt with all rules and context injected
     */
    enforcePrompt(taskInstructions: string, toolName: string, args?: any): Promise<string>;
    /**
     * Load current project and last context
     */
    private loadCurrentContext;
    /**
     * Assemble complete enforced prompt
     */
    private assembleEnforcedPrompt;
    /**
     * Build prompt header
     */
    private buildHeader;
    /**
     * Build global rules section
     */
    private buildGlobalRules;
    /**
     * Build project context section
     */
    private buildProjectContext;
    /**
     * Build last context section
     */
    private buildLastContext;
    /**
     * Build task-specific rules
     */
    private buildTaskSpecificRules;
    /**
     * Build task instructions section
     */
    private buildTaskInstructions;
    /**
     * Build prompt footer
     */
    private buildFooter;
    /**
     * Get task-specific rules for tool
     */
    private getTaskSpecificRules;
    /**
     * Initialize global rules
     */
    private initializeGlobalRules;
    /**
     * Add or update global rule
     */
    addGlobalRule(rule: GlobalRule): void;
    /**
     * Remove global rule
     */
    removeGlobalRule(name: string): boolean;
    /**
     * Get current global rules
     */
    getGlobalRules(): GlobalRule[];
    /**
     * Load the SWEObeyMe Master Prompt Contract
     */
    private loadMasterContract;
    /**
     * Reload the master contract (useful for updates)
     */
    reloadMasterContract(): Promise<void>;
    /**
     * Clear context cache
     */
    clearCache(): Promise<void>;
}
/**
 * Global rule interface
 */
interface GlobalRule {
    name: string;
    category: string;
    description: string;
    priority: number;
    active: boolean;
}
export {};
//# sourceMappingURL=prompt-enforcer.d.ts.map