import { RefactorEngine } from '../utils/refactor-engine.js';
/**
 * Run Refactor Task Tool
 *
 * MCP tool that enables ARES to execute coordinated multi-file refactoring
 * with project analysis, cross-file issue detection, coordinated patch generation,
 * validation, and safe application.
 */
export function createRunRefactorTaskTool() {
    return {
        name: 'run_refactor_task',
        description: 'Runs a coordinated multi-file refactor using SWEObeyMe with project analysis, validation, and safe patching',
        inputSchema: {
            type: 'object',
            properties: {
                task: {
                    type: 'string',
                    description: 'Refactor task description (e.g., "Improve code quality across the project", "Remove unused imports", "Fix structural inconsistencies")',
                },
                maxRetries: {
                    type: 'number',
                    description: 'Maximum number of retry attempts for failed patches',
                    minimum: 1,
                    maximum: 10,
                    default: 3,
                },
                analysisDepth: {
                    type: 'string',
                    description: 'Analysis depth level',
                    enum: ['shallow', 'medium', 'deep'],
                    default: 'medium',
                },
                confidenceThreshold: {
                    type: 'number',
                    description: 'Minimum confidence threshold for refactoring targets',
                    minimum: 0,
                    maximum: 1,
                    default: 0.5,
                },
                maxTargets: {
                    type: 'number',
                    description: 'Maximum number of files to refactor',
                    minimum: 1,
                    maximum: 50,
                    default: 10,
                },
                enableBackup: {
                    type: 'boolean',
                    description: 'Create backup files before applying patches',
                    default: true,
                },
                enableValidation: {
                    type: 'boolean',
                    description: 'Enable patch validation before application',
                    default: true,
                },
                enableCorrection: {
                    type: 'boolean',
                    description: 'Enable automatic correction of failed patches',
                    default: true,
                },
            },
            required: ['task'],
        },
    };
}
/**
 * Handle run refactor task tool call
 */
export async function handleRunRefactorTask(args) {
    try {
        const { task, maxRetries = 3, analysisDepth = 'medium', confidenceThreshold = 0.5, maxTargets = 10, enableBackup = true, enableValidation = true, enableCorrection = true, } = args;
        // Validate inputs
        if (!task || typeof task !== 'string') {
            throw new Error('Invalid task description provided');
        }
        if (task.trim().length === 0) {
            throw new Error('Task description cannot be empty');
        }
        console.log(`🔧 Starting refactor task: ${task}`);
        console.log(`   Analysis depth: ${analysisDepth}`);
        console.log(`   Max retries: ${maxRetries}`);
        console.log(`   Confidence threshold: ${confidenceThreshold}`);
        console.log(`   Max targets: ${maxTargets}`);
        console.log(`   Enable backup: ${enableBackup}`);
        console.log(`   Enable validation: ${enableValidation}`);
        console.log(`   Enable correction: ${enableCorrection}`);
        // Create refactor engine with custom configuration
        const refactorEngine = new RefactorEngine({
            analysisDepth,
            confidenceThreshold,
            maxTargets,
            maxRetries,
            enableRollback: true,
            enableBackup,
            enableValidation,
            enableCorrection,
            enableMetrics: true,
        });
        // Run refactor
        const result = await refactorEngine.run(task);
        console.log(`✅ Refactor completed`);
        console.log(`   Success: ${result.success}`);
        console.log(`   Total patches: ${result.patches.length}`);
        console.log(`   Applied: ${result.statistics.successfulPatches}`);
        console.log(`   Failed: ${result.statistics.failedPatches}`);
        console.log(`   Processing time: ${result.metadata.processingTime}ms`);
        // Transform result for output
        const transformedResult = {
            id: result.id,
            success: result.success,
            summary: result.summary,
            statistics: result.statistics,
            impact: result.impact,
            recommendations: result.recommendations,
            nextSteps: result.nextSteps,
        };
        // Transform plan for output
        const transformedPlan = result.plan ? {
            id: result.plan.id,
            task: result.plan.task,
            description: result.plan.description,
            targets: result.plan.targets.length,
            confidence: result.plan.confidence,
            estimatedImpact: result.plan.estimatedImpact,
            estimatedEffort: result.plan.estimatedEffort,
            risk: result.plan.risk,
        } : undefined;
        return {
            success: result.success,
            task: result.task,
            plan: transformedPlan,
            result: transformedResult,
            metadata: {
                timestamp: result.metadata.timestamp.toISOString(),
                processingTime: result.metadata.processingTime,
                version: result.metadata.version,
            },
        };
    }
    catch (error) {
        console.error(`❌ Refactor task failed: ${error.message}`);
        return {
            success: false,
            task: args.task || '',
            metadata: {
                timestamp: new Date().toISOString(),
                processingTime: 0,
                version: '1.0.0',
            },
            error: error.message,
        };
    }
}
//# sourceMappingURL=run-refactor-task.js.map