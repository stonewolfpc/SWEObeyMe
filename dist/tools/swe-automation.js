import { FileManager } from '../utils/file-manager.js';
import { ProjectAnalyzer } from '../utils/project-analyzer.js';
import { TaskRunner } from '../utils/task-runner.js';
import { FileAnalyzer } from '../utils/file-analyzer.js';
import { ProjectMapper } from '../utils/project-mapper.js';
import { ContextMemory } from '../utils/context-memory.js';
import { PromptEnforcer } from '../utils/prompt-enforcer.js';
import { WorkflowOrchestrator } from '../utils/workflow-orchestrator.js';
import { createValidatePatchTool, handleValidatePatch } from './validate-patch.js';
import { createApplyPatchSafelyTool, handleApplyPatchSafely } from './apply-patch-safely.js';
import { createRunCorrectiveTaskTool, handleRunCorrectiveTask } from './run-corrective-task.js';
import { createGetPredictedActionsTool, handleGetPredictedActions } from './get-predicted-actions.js';
import { createRunRefactorTaskTool, handleRunRefactorTask } from './run-refactor-task.js';
/**
 * SWE Automation Tools
 *
 * Provides specialized tools for SWE-1.5 and other AI models to enhance
 * software engineering workflows with advanced automation capabilities.
 */
export class SWEAutomationTools {
    fileManager;
    projectAnalyzer;
    taskRunner;
    fileAnalyzer;
    projectMapper;
    contextMemory;
    promptEnforcer;
    constructor(fileManager, projectAnalyzer, taskRunner, fileAnalyzer, projectMapper, contextMemory, promptEnforcer) {
        this.fileManager = fileManager;
        this.projectAnalyzer = projectAnalyzer;
        this.taskRunner = taskRunner;
        this.fileAnalyzer = fileAnalyzer;
        this.projectMapper = projectMapper;
        this.contextMemory = contextMemory;
        this.promptEnforcer = promptEnforcer;
    }
    /**
     * Get all available tools
     */
    getAllTools() {
        return [
            {
                name: 'get_last_context',
                description: 'Retrieve the last stored context including patches, validations, commands, and file states for SWE continuity',
                inputSchema: {
                    type: 'object',
                    properties: {
                        type: {
                            type: 'string',
                            enum: ['all', 'patch', 'validation', 'command', 'file_state'],
                            description: 'Type of context to retrieve',
                            default: 'all',
                        },
                    },
                },
            },
            {
                name: 'set_last_context',
                description: 'Store context information including patches, validations, commands, and file states for SWE memory persistence',
                inputSchema: {
                    type: 'object',
                    properties: {
                        type: {
                            type: 'string',
                            enum: ['patch', 'validation', 'command', 'file_state', 'rule'],
                            description: 'Type of context to store',
                        },
                        data: {
                            type: 'object',
                            description: 'Context data to store',
                        },
                        priority: {
                            type: 'string',
                            enum: ['low', 'medium', 'high', 'critical'],
                            description: 'Storage priority',
                            default: 'medium',
                        },
                    },
                    required: ['type', 'data'],
                },
            },
            {
                name: 'get_project_context',
                description: 'Generate comprehensive project context map providing SWE with complete global awareness of codebase structure, dependencies, and architectural patterns',
                inputSchema: {
                    type: 'object',
                    properties: {
                        projectPath: {
                            type: 'string',
                            description: 'Root path of the project to analyze (default: current working directory)',
                        },
                        includeTests: {
                            type: 'boolean',
                            description: 'Include test files in analysis',
                            default: false,
                        },
                        maxDepth: {
                            type: 'number',
                            description: 'Maximum depth for file scanning',
                            default: 10,
                        },
                        useCache: {
                            type: 'boolean',
                            description: 'Use cached results if available',
                            default: true,
                        },
                    },
                },
            },
            {
                name: 'analyze_current_file',
                description: 'Analyze the active file to extract namespace, imports, classes, methods, and return comprehensive JSON structure',
                inputSchema: {
                    type: 'object',
                    properties: {
                        filePath: {
                            type: 'string',
                            description: 'Path to the file to analyze (optional - uses active file if not provided)',
                        },
                        includeContent: {
                            type: 'boolean',
                            description: 'Include file content in analysis',
                            default: false,
                        },
                    },
                },
            },
            {
                name: 'analyze_project_structure',
                description: 'Analyze project structure and identify key components, dependencies, and architecture patterns',
                inputSchema: {
                    type: 'object',
                    properties: {
                        path: {
                            type: 'string',
                            description: 'Path to the project directory to analyze',
                        },
                        depth: {
                            type: 'number',
                            description: 'Depth of analysis (default: 3)',
                            default: 3,
                        },
                    },
                    required: ['path'],
                },
            },
            {
                name: 'smart_file_operations',
                description: 'Perform intelligent file operations with context awareness and safety checks',
                inputSchema: {
                    type: 'object',
                    properties: {
                        operation: {
                            type: 'string',
                            enum: ['create', 'update', 'delete', 'move', 'copy'],
                            description: 'Type of file operation',
                        },
                        source: {
                            type: 'string',
                            description: 'Source file path',
                        },
                        destination: {
                            type: 'string',
                            description: 'Destination file path (for move/copy operations)',
                        },
                        content: {
                            type: 'string',
                            description: 'File content (for create/update operations)',
                        },
                        backup: {
                            type: 'boolean',
                            description: 'Create backup before operation',
                            default: true,
                        },
                    },
                    required: ['operation'],
                },
            },
            {
                name: 'automated_testing',
                description: 'Generate and run automated tests with intelligent test selection and coverage analysis',
                inputSchema: {
                    type: 'object',
                    properties: {
                        target: {
                            type: 'string',
                            description: 'Target file, directory, or function to test',
                        },
                        testType: {
                            type: 'string',
                            enum: ['unit', 'integration', 'e2e', 'performance'],
                            description: 'Type of tests to generate/run',
                        },
                        framework: {
                            type: 'string',
                            description: 'Testing framework to use (auto-detected if not specified)',
                        },
                        coverage: {
                            type: 'boolean',
                            description: 'Generate coverage report',
                            default: true,
                        },
                    },
                    required: ['target'],
                },
            },
            {
                name: 'code_quality_analysis',
                description: 'Perform comprehensive code quality analysis with metrics, smells detection, and improvement suggestions',
                inputSchema: {
                    type: 'object',
                    properties: {
                        path: {
                            type: 'string',
                            description: 'Path to file or directory to analyze',
                        },
                        metrics: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Specific metrics to analyze (default: all)',
                        },
                        threshold: {
                            type: 'number',
                            description: 'Quality threshold for recommendations',
                            default: 0.8,
                        },
                    },
                    required: ['path'],
                },
            },
            {
                name: 'dependency_management',
                description: 'Automated dependency analysis, updates, and vulnerability scanning',
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: {
                            type: 'string',
                            enum: ['analyze', 'update', 'audit', 'cleanup'],
                            description: 'Dependency management action',
                        },
                        packageManager: {
                            type: 'string',
                            enum: ['npm', 'yarn', 'pnpm', 'pip', 'cargo', 'maven'],
                            description: 'Package manager (auto-detected if not specified)',
                        },
                        options: {
                            type: 'object',
                            description: 'Additional options for the action',
                        },
                    },
                    required: ['action'],
                },
            },
            {
                name: 'debug_assistant',
                description: 'Intelligent debugging assistance with root cause analysis and fix suggestions',
                inputSchema: {
                    type: 'object',
                    properties: {
                        error: {
                            type: 'string',
                            description: 'Error message or stack trace',
                        },
                        context: {
                            type: 'string',
                            description: 'Context where the error occurred',
                        },
                        logs: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Relevant log entries',
                        },
                        code: {
                            type: 'string',
                            description: 'Code snippet where error occurred',
                        },
                    },
                    required: ['error'],
                },
            },
            {
                name: 'performance_optimization',
                description: 'Analyze and optimize code performance with profiling and bottleneck identification',
                inputSchema: {
                    type: 'object',
                    properties: {
                        target: {
                            type: 'string',
                            description: 'Target function, file, or application to optimize',
                        },
                        analysisType: {
                            type: 'string',
                            enum: ['cpu', 'memory', 'io', 'network'],
                            description: 'Type of performance analysis',
                        },
                        benchmark: {
                            type: 'boolean',
                            description: 'Run benchmarks before and after optimization',
                            default: true,
                        },
                    },
                    required: ['target'],
                },
            },
            {
                name: 'documentation_generator',
                description: 'Generate comprehensive documentation with AI-powered content generation',
                inputSchema: {
                    type: 'object',
                    properties: {
                        target: {
                            type: 'string',
                            description: 'Target to document (file, directory, or project)',
                        },
                        docType: {
                            type: 'string',
                            enum: ['api', 'readme', 'inline', 'architecture', 'user_guide'],
                            description: 'Type of documentation to generate',
                        },
                        format: {
                            type: 'string',
                            enum: ['markdown', 'html', 'pdf', 'docx'],
                            description: 'Output format',
                            default: 'markdown',
                        },
                    },
                    required: ['target', 'docType'],
                },
            },
            {
                name: 'security_scanner',
                description: 'Comprehensive security analysis with vulnerability detection and security recommendations',
                inputSchema: {
                    type: 'object',
                    properties: {
                        target: {
                            type: 'string',
                            description: 'Target to scan (file, directory, or application)',
                        },
                        scanType: {
                            type: 'string',
                            enum: ['sast', 'dast', 'dependency', 'secrets', 'all'],
                            description: 'Type of security scan',
                            default: 'all',
                        },
                        severity: {
                            type: 'string',
                            enum: ['low', 'medium', 'high', 'critical'],
                            description: 'Minimum severity level to report',
                            default: 'medium',
                        },
                    },
                    required: ['target'],
                },
            },
            {
                name: 'deployment_automation',
                description: 'Automated deployment pipeline setup and execution with environment management',
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: {
                            type: 'string',
                            enum: ['setup', 'deploy', 'rollback', 'status'],
                            description: 'Deployment action',
                        },
                        environment: {
                            type: 'string',
                            description: 'Target environment (dev, staging, prod)',
                        },
                        config: {
                            type: 'object',
                            description: 'Deployment configuration',
                        },
                    },
                    required: ['action', 'environment'],
                },
            },
            createValidatePatchTool(),
            createApplyPatchSafelyTool(),
            createRunCorrectiveTaskTool(),
            createGetPredictedActionsTool(),
            createRunRefactorTaskTool(),
        ];
    }
    /**
     * Execute a specific tool
     */
    async executeTool(name, args) {
        // Enforce prompt with mandatory pre-flight injection
        const enforcedPrompt = await this.promptEnforcer.enforcePrompt(`Execute tool: ${name} with arguments: ${JSON.stringify(args)}`, name, args);
        // Store command context
        await this.contextMemory.storeContext('command', {
            id: this.generateId(),
            tool: name,
            arguments: args,
            timestamp: new Date(),
            enforcedPrompt,
        });
        switch (name) {
            case 'get_last_context':
                return await this.handleGetLastContext(args);
            case 'set_last_context':
                return await this.handleSetLastContext(args);
            case 'get_project_context':
                return this.projectMapper.getProjectContext(args.projectPath || process.cwd(), {
                    includeTests: args.includeTests,
                    maxDepth: args.maxDepth,
                    cacheKey: args.useCache ? 'default' : undefined,
                });
            case 'analyze_current_file':
                return this.fileAnalyzer.analyzeFile(args.filePath || process.cwd(), args.includeContent);
            case 'analyze_project_structure':
                return this.projectAnalyzer.analyzeStructure(args.path, args.depth);
            case 'smart_file_operations':
                return this.fileManager.performOperation(args);
            case 'automated_testing':
                return this.taskRunner.runTests(args);
            case 'code_quality_analysis':
                return this.projectAnalyzer.analyzeQuality(args.path, args.metrics, args.threshold);
            case 'dependency_management':
                return this.taskRunner.manageDependencies(args);
            case 'debug_assistant':
                return this.taskRunner.assistDebugging(args);
            case 'performance_optimization':
                return this.taskRunner.optimizePerformance(args);
            case 'documentation_generator':
                return this.taskRunner.generateDocumentation(args);
            case 'security_scanner':
                return this.taskRunner.scanSecurity(args);
            case 'automated_testing':
                return this.taskRunner.runTests(args);
            case 'validate_patch':
                return await handleValidatePatch(args);
            case 'apply_patch_safely':
                return await handleApplyPatchSafely(args);
            case 'run_corrective_task':
                return await handleRunCorrectiveTask(args);
            case 'get_predicted_actions':
                return await handleGetPredictedActions(args);
            case 'run_refactor_task':
                return await handleRunRefactorTask(args);
            case 'run_multi_agent_task':
                return await this.handleRunMultiAgentTask(args);
            case 'deployment_automation':
                return this.taskRunner.automateDeployment(args);
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
    /**
     * Handle get_last_context tool
     */
    async handleGetLastContext(args) {
        const lastContext = await this.contextMemory.getLastContext();
        if (args.type === 'all') {
            return lastContext;
        }
        // Filter by type
        const typeMap = {
            'patch': 'lastPatch',
            'validation': 'lastValidation',
            'command': 'lastCommand',
            'file_state': 'lastFileState',
        };
        const field = typeMap[args.type];
        return field ? lastContext[field] : null;
    }
    /**
     * Handle set_last_context tool
     */
    async handleSetLastContext(args) {
        const id = await this.contextMemory.storeContext(args.type, args.data, {
            priority: args.priority,
            tags: [args.type],
        });
        return { success: true, id, timestamp: new Date() };
    }
    /**
     * Handle run multi-agent task tool
     */
    async handleRunMultiAgentTask(args) {
        // Create dependencies
        const fileManager = new FileManager();
        const projectAnalyzer = new ProjectAnalyzer();
        const taskRunner = new TaskRunner();
        const fileAnalyzer = new FileAnalyzer();
        const projectMapper = new ProjectMapper();
        const contextMemory = new ContextMemory();
        const promptEnforcer = new PromptEnforcer(contextMemory, projectMapper);
        // Create orchestrator
        const orchestrator = new WorkflowOrchestrator();
        return orchestrator.runMultiAgentTask(args.task);
    }
    /**
     * Generate unique ID
     */
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }
}
/**
 * Run orchestrated task function
 */
export async function runOrchestratedTask(task) {
    // Create dependencies
    const fileManager = new FileManager();
    const projectAnalyzer = new ProjectAnalyzer();
    const taskRunner = new TaskRunner();
    const fileAnalyzer = new FileAnalyzer();
    const projectMapper = new ProjectMapper();
    const contextMemory = new ContextMemory();
    const promptEnforcer = new PromptEnforcer(contextMemory, projectMapper);
    // Create orchestrator
    const orchestrator = new WorkflowOrchestrator();
    return orchestrator.runTaskWithCorrections(task, 'default-file');
}
//# sourceMappingURL=swe-automation.js.map