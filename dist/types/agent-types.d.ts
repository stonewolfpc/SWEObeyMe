/**
 * Agent Type Definitions
 *
 * Type definitions for the multi-agent planning system that coordinates
 * specialized agents for different aspects of software engineering tasks.
 */
/**
 * Available agent roles in the multi-agent system
 */
export type AgentRole = "planner" | "coder" | "validator" | "corrector" | "reviewer";
/**
 * Task definition for agent execution
 */
export interface AgentTask {
    /** Unique task identifier */
    id: string;
    /** Task description */
    description: string;
    /** Task type/category */
    type: string;
    /** Task priority */
    priority: "low" | "medium" | "high" | "critical";
    /** Task parameters */
    parameters: Record<string, any>;
    /** Required context for execution */
    requiredContext: string[];
    /** Expected output format */
    expectedOutput: string;
    /** Task dependencies */
    dependencies: string[] | number[];
    /** Timestamp when task was created */
    createdAt: Date;
    /** Estimated execution time in milliseconds */
    estimatedDuration: number;
}
/**
 * Output from agent execution
 */
export interface AgentOutput {
    /** Output identifier */
    id: string;
    /** Agent role that produced this output */
    agentRole: AgentRole;
    /** Task that was executed */
    task: AgentTask;
    /** Execution success status */
    success: boolean;
    /** Output data/content */
    data: any;
    /** Execution duration in milliseconds */
    duration: number;
    /** Error message if execution failed */
    error?: string;
    /** Warnings generated during execution */
    warnings: string[];
    /** Metadata about the output */
    metadata: Record<string, any>;
    /** Timestamp when output was generated */
    timestamp: Date;
}
/**
 * Context provided to agents for execution
 */
export interface AgentContext {
    /** Context identifier */
    id: string;
    /** Original task description */
    originalTask: string;
    /** Current task being executed */
    task?: AgentTask;
    /** Current working directory */
    workingDirectory: string;
    /** Project context information */
    projectContext: any;
    /** File contents for relevant files */
    fileContents: Record<string, string>;
    /** Previous agent outputs */
    previousOutputs: AgentOutput[];
    /** Current data/state */
    data?: any;
    /** Current parameters */
    parameters?: Record<string, any>;
    /** Global configuration */
    configuration: Record<string, any>;
    /** Session information */
    session: {
        id: string;
        startTime: Date;
        userId?: string;
    };
    /** Available tools and their capabilities */
    availableTools: string[];
    /** Execution constraints */
    constraints: {
        maxExecutionTime: number;
        maxFileSize: number;
        allowedFileTypes: string[];
        restrictedPaths: string[];
    };
}
/**
 * Agent definition for registration and execution
 */
export interface AgentDefinition {
    /** Agent name */
    name: string;
    /** Agent role */
    role: AgentRole;
    /** Agent description */
    description: string;
    /** Agent capabilities */
    capabilities: string[];
    /** Agent execution method */
    execute(context: AgentContext): Promise<AgentOutput>;
    /** Agent configuration */
    configuration: {
        maxExecutionTime: number;
        retryAttempts: number;
        requiredTools: string[];
        outputFormat: string;
    };
    /** Agent metadata */
    metadata: {
        version: string;
        author: string;
        createdAt: Date;
        lastUpdated: Date;
    };
}
/**
 * Multi-agent execution plan
 */
export interface AgentPlan {
    /** Plan identifier */
    id: string;
    /** Original task description */
    task: string;
    /** Plan steps in execution order */
    steps: AgentPlanStep[];
    /** Required files for the plan */
    requiredFiles: string[];
    /** Expected outcomes */
    expectedOutcomes: string[];
    /** Plan creation timestamp */
    createdAt: Date;
    /** Estimated total execution time */
    estimatedDuration: number;
}
/**
 * Individual step in an agent plan
 */
export interface AgentPlanStep {
    /** Step identifier */
    id: string;
    /** Step number in sequence */
    stepNumber: number;
    /** Agent role for this step */
    agentRole: AgentRole;
    /** Step description */
    description: string;
    /** Step input requirements */
    inputRequirements: string[];
    /** Step expected output */
    expectedOutput: string;
    /** Step dependencies */
    dependencies: number[];
    /** Estimated execution time */
    estimatedDuration: number;
    /** Step status */
    status: "pending" | "in_progress" | "completed" | "failed" | "skipped";
    /** Step execution result */
    result?: AgentOutput;
    /** Step execution timestamp */
    executedAt?: Date;
}
/**
 * Multi-agent execution result
 */
export interface AgentExecutionResult {
    /** Execution identifier */
    id: string;
    /** Original task */
    task: string;
    /** Execution plan */
    plan: AgentPlan;
    /** Final execution status */
    success: boolean;
    /** All step results */
    stepResults: AgentOutput[];
    /** Final review output */
    reviewOutput?: AgentOutput;
    /** Execution summary */
    summary: {
        totalSteps: number;
        completedSteps: number;
        failedSteps: number;
        totalDuration: number;
        successRate: number;
    };
    /** Applied changes */
    appliedChanges: Array<{
        filePath: string;
        changeType: "create" | "update" | "delete";
        success: boolean;
        backupPath?: string;
    }>;
    /** Execution timestamp */
    executedAt: Date;
    /** Error information if execution failed */
    error?: string;
}
/**
 * Agent registry configuration
 */
export interface AgentRegistryConfig {
    /** Maximum number of agents per role */
    maxAgentsPerRole: number;
    /** Default execution timeout */
    defaultTimeout: number;
    /** Enable agent caching */
    enableCaching: boolean;
    /** Agent performance metrics */
    enableMetrics: boolean;
}
/**
 * Agent performance metrics
 */
export interface AgentMetrics {
    /** Agent role */
    role: AgentRole;
    /** Total executions */
    totalExecutions: number;
    /** Successful executions */
    successfulExecutions: number;
    /** Average execution time */
    averageExecutionTime: number;
    /** Last execution timestamp */
    lastExecution: Date;
    /** Error rate */
    errorRate: number;
    /** Performance score (0-100) */
    performanceScore: number;
}
//# sourceMappingURL=agent-types.d.ts.map