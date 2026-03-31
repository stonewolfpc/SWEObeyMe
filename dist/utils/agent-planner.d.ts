import { AgentRole, AgentOutput, AgentContext, AgentPlan, AgentPlanStep, AgentExecutionResult } from '../types/agent-types.js';
/**
 * Agent Planner
 *
 * Coordinates the execution of specialized agents to complete complex
 * software engineering tasks through a structured planning and execution
 * workflow.
 */
export declare class AgentPlanner {
    private registry;
    private orchestrator;
    private projectMapper;
    private contextMemory;
    private promptEnforcer;
    constructor();
    /**
     * Plan a task by breaking it down into executable steps
     *
     * @param task - Task description to plan
     * @returns Execution plan with steps, required files, and expected outcomes
     */
    planTask(task: string): Promise<AgentPlan>;
    /**
     * Execute a single step in the plan
     *
     * @param step - Plan step to execute
     * @param context - Agent execution context
     * @returns Step execution result
     */
    executeStep(step: AgentPlanStep, context: AgentContext): Promise<{
        finalPatch: string;
        validation: any;
        success: boolean;
        applied: boolean;
        stepResult: AgentOutput;
    }>;
    /**
     * Run the complete plan from start to finish
     *
     * @param task - Task description to execute
     * @returns Complete execution result with review
     */
    runPlan(task: string): Promise<AgentExecutionResult>;
    /**
     * Create agent context for execution
     */
    private createAgentContext;
    /**
     * Generate unique ID
     */
    private generateId;
    /**
     * Get registry statistics
     */
    getRegistryStats(): {
        totalAgents: number;
        agentsByRole: Record<AgentRole, string>;
        metrics: Record<AgentRole, any>;
    };
}
//# sourceMappingURL=agent-planner.d.ts.map