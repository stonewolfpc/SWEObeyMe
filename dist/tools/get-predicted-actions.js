import { PredictionEngine } from '../utils/prediction-engine.js';
/**
 * Get Predicted Actions Tool
 *
 * MCP tool that enables ARES to predict likely next steps, file edits,
 * and structural changes based on user intent and project context.
 */
export function createGetPredictedActionsTool() {
    return {
        name: 'get_predicted_actions',
        description: 'Predicts likely next steps, file edits, and structural changes based on user intent and project context',
        inputSchema: {
            type: 'object',
            properties: {
                task: {
                    type: 'string',
                    description: 'Task description to analyze for predictions',
                },
                analysisDepth: {
                    type: 'string',
                    description: 'Analysis depth level',
                    enum: ['shallow', 'medium', 'deep'],
                    default: 'medium',
                },
                maxActions: {
                    type: 'number',
                    description: 'Maximum number of predicted actions to return',
                    default: 10,
                    minimum: 1,
                    maximum: 20,
                },
                confidenceThreshold: {
                    type: 'number',
                    description: 'Minimum confidence threshold for predictions',
                    default: 0.5,
                    minimum: 0,
                    maximum: 1,
                },
            },
            required: ['task'],
        },
    };
}
/**
 * Handle get predicted actions tool call
 */
export async function handleGetPredictedActions(args) {
    try {
        const { task, analysisDepth = 'medium', maxActions = 10, confidenceThreshold = 0.5, } = args;
        // Validate inputs
        if (!task || typeof task !== 'string') {
            throw new Error('Invalid task description provided');
        }
        if (task.trim().length === 0) {
            throw new Error('Task description cannot be empty');
        }
        console.log(`🔮 Generating predictions for task: ${task}`);
        console.log(`   Analysis depth: ${analysisDepth}`);
        console.log(`   Max actions: ${maxActions}`);
        console.log(`   Confidence threshold: ${confidenceThreshold}`);
        // Create prediction engine with custom configuration
        const predictionEngine = new PredictionEngine({
            analysisDepth,
            maxActions,
            confidenceThreshold,
            enableFileAnalysis: true,
            enableASTAnalysis: true,
            enableContextMemoryAnalysis: true,
            enableDependencyAnalysis: true,
            enableMetrics: true,
        });
        // Run prediction
        const result = await predictionEngine.run(task);
        console.log(`✅ Predictions generated successfully`);
        console.log(`   Total actions: ${result.actions.length}`);
        console.log(`   Overall confidence: ${(result.confidence * 100).toFixed(1)}%`);
        console.log(`   Processing time: ${result.metadata.processingTime}ms`);
        // Transform actions for output
        const transformedActions = result.actions.map(action => ({
            id: action.id,
            type: action.type,
            filePath: action.filePath,
            description: action.description,
            confidence: action.confidence,
            impact: action.impact,
            priority: action.priority,
            suggestion: action.suggestion,
            outcome: action.outcome,
            risk: action.risk,
            estimatedTime: action.estimatedTime,
        }));
        return {
            success: true,
            task: result.task,
            actions: transformedActions,
            summary: result.summary,
            confidence: result.confidence,
            metadata: {
                timestamp: result.metadata.timestamp.toISOString(),
                processingTime: result.metadata.processingTime,
                analysisDepth: result.metadata.analysisDepth,
                totalActions: result.metadata.totalActions,
                highConfidenceActions: result.metadata.highConfidenceActions,
                criticalActions: result.metadata.criticalActions,
            },
        };
    }
    catch (error) {
        console.error(`❌ Prediction generation failed: ${error.message}`);
        return {
            success: false,
            task: args.task || '',
            actions: [],
            summary: `Prediction failed: ${error.message}`,
            confidence: 0,
            metadata: {
                timestamp: new Date().toISOString(),
                processingTime: 0,
                analysisDepth: args.analysisDepth || 'medium',
                totalActions: 0,
                highConfidenceActions: 0,
                criticalActions: 0,
            },
            error: error.message,
        };
    }
}
//# sourceMappingURL=get-predicted-actions.js.map