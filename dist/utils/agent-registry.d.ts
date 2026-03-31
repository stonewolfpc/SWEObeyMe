import { AgentRole, AgentDefinition, AgentOutput, AgentRegistryConfig, AgentMetrics } from '../types/agent-types.js';
/**
 * Agent Registry
 *
 * Manages registration and retrieval of specialized agents for the
 * multi-agent planning system. Ensures only one agent per role and
 * provides centralized agent management.
 */
export declare class AgentRegistry {
    private agents;
    private metrics;
    private config;
    constructor(config?: AgentRegistryConfig);
    /**
     * Register an agent for a specific role
     *
     * @param agent - Agent definition to register
     * @throws Error if agent role already exists
     */
    registerAgent(agent: AgentDefinition): void;
    /**
     * Get agent by role
     *
     * @param role - Agent role to retrieve
     * @returns Agent definition or undefined if not found
     */
    getAgent(role: AgentRole): AgentDefinition | undefined;
    /**
     * List all registered agents
     *
     * @returns Array of all registered agent definitions
     */
    listAgents(): AgentDefinition[];
    /**
     * Check if agent role is registered
     *
     * @param role - Agent role to check
     * @returns True if agent is registered
     */
    hasAgent(role: AgentRole): boolean;
    /**
     * Get metrics for an agent role
     *
     * @param role - Agent role
     * @returns Agent metrics or undefined if not found
     */
    getMetrics(role: AgentRole): AgentMetrics | undefined;
    /**
     * Update metrics after agent execution
     *
     * @param role - Agent role
     * @param output - Agent execution output
     */
    updateMetrics(role: AgentRole, output: AgentOutput): void;
    /**
     * Initialize default agents
     */
    private initializeDefaultAgents;
    /**
     * Create Planner Agent implementation
     */
    private createPlannerAgent;
    /**
     * Create Coder Agent implementation
     */
    private createCoderAgent;
    /**
     * Create Validator Agent implementation
     */
    private createValidatorAgent;
    /**
     * Create Corrector Agent implementation
     */
    private createCorrectorAgent;
    /**
     * Create Reviewer Agent implementation
     */
    private createReviewerAgent;
    /**
     * Analyze task and create execution plan
     */
    private analyzeTask;
    /**
     * Simulate code generation (MVP implementation)
     */
    private simulateCodeGeneration;
    /**
     * Generate review report
     */
    private generateReviewReport;
    /**
     * Extract file references from task description
     */
    private extractFilesFromTask;
    /**
     * Generate unique ID
     */
    private generateId;
}
//# sourceMappingURL=agent-registry.d.ts.map