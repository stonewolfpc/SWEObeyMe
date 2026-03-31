import { WorkflowOrchestrator } from '../utils/workflow-orchestrator.js';
import { CorrectionEngine } from '../utils/correction-engine.js';
import { PatchValidator } from '../utils/patch-validator.js';
import { PromptEnforcer } from '../utils/prompt-enforcer.js';
import { ProjectMapper } from '../utils/project-mapper.js';
import { ContextMemory } from '../utils/context-memory.js';
import * as fs from 'fs-extra';
import * as path from 'path';
/**
 * Run Corrective Task Tool
 *
 * Executes a task with autonomous correction and retry logic.
 * This tool combines the workflow orchestrator with the correction
 * engine to automatically fix failed patches through iterative refinement.
 */
export function createRunCorrectiveTaskTool() {
    return {
        name: 'run_corrective_task',
        description: 'Runs a task with autonomous correction and retry logic to automatically fix failed patches',
        inputSchema: {
            type: 'object',
            properties: {
                filePath: {
                    type: 'string',
                    description: 'File path to modify',
                },
                taskDescription: {
                    type: 'string',
                    description: 'Description of the task to perform',
                },
                maxRetries: {
                    type: 'number',
                    description: 'Maximum number of correction attempts',
                    default: 3,
                    minimum: 1,
                    maximum: 10,
                },
                applyPatch: {
                    type: 'boolean',
                    description: 'Whether to apply the final corrected patch',
                    default: false,
                },
                createBackup: {
                    type: 'boolean',
                    description: 'Create backup before applying patch',
                    default: true,
                },
            },
            required: ['filePath', 'taskDescription'],
        },
    };
}
/**
 * Handle run corrective task tool call
 */
export async function handleRunCorrectiveTask(args) {
    const { filePath, taskDescription, maxRetries = 3, applyPatch = false, createBackup = true, } = args;
    let resolvedPath = '';
    try {
        if (!filePath || typeof filePath !== 'string') {
            throw new Error('Invalid file path provided');
        }
        if (!taskDescription || typeof taskDescription !== 'string') {
            throw new Error('Invalid task description provided');
        }
        // Resolve file path
        resolvedPath = path.resolve(filePath);
        // Check if file exists
        const fileExists = await fs.pathExists(resolvedPath);
        if (!fileExists) {
            throw new Error(`File does not exist: ${resolvedPath}`);
        }
        // Read original file content
        const originalContent = await fs.readFile(resolvedPath, 'utf8');
        // Setup dependencies
        const projectMapper = new ProjectMapper();
        const contextMemory = new ContextMemory();
        const promptEnforcer = new PromptEnforcer(contextMemory, projectMapper);
        const patchValidator = new PatchValidator();
        // Create orchestrator and correction engine
        const orchestrator = new WorkflowOrchestrator();
        const correctionEngine = new CorrectionEngine(promptEnforcer, patchValidator);
        console.log(`🚀 Starting corrective task: ${taskDescription}`);
        console.log(`📁 Target file: ${resolvedPath}`);
        console.log(`🔄 Max retries: ${maxRetries}`);
        // Step 1: Run the task with corrections using the orchestrator
        const result = await orchestrator.runTaskWithCorrections(taskDescription, resolvedPath);
        console.log(`✅ Corrective task completed`);
        console.log(`   Success: ${result.success}`);
        console.log(`   Attempts: ${result.attempts}`);
        console.log(`   Applied: ${result.applied}`);
        return {
            success: result.success,
            taskDescription,
            filePath: resolvedPath,
            finalPatch: result.finalPatch,
            validation: result.validation,
            attempts: result.attempts,
            correctionHistory: result.correctionHistory.map((item) => ({
                attempt: item.attempt,
                success: item.success,
                issues: item.validation.issues.length,
                score: item.validation.score,
                error: item.error,
            })),
            applied: result.applied,
            backupPath: result.backupPath,
        };
    }
    catch (error) {
        console.error(`❌ Corrective task failed: ${error.message}`);
        return {
            success: false,
            taskDescription,
            filePath: resolvedPath,
            finalPatch: '',
            validation: {
                valid: false,
                score: 0,
                issues: [],
                totalIssues: 0,
                issuesBySeverity: { error: 0, warning: 0, info: 0 },
                duration: 0,
                recommendations: [],
                approved: false,
                summary: `Task failed: ${error.message}`,
            },
            attempts: 0,
            correctionHistory: [],
            applied: false,
        };
    }
}
/**
 * Simulate SWE patch generation (MVP implementation)
 * In a real implementation, this would call the actual SWE model
 */
async function simulateSWEPatchGeneration(prompt, originalContent, taskDescription) {
    // For MVP, generate a simple patch based on the task description
    if (taskDescription.toLowerCase().includes('add method')) {
        // Add a simple method
        const methodName = 'newMethod';
        return `${originalContent}

  /**
   * Newly added method
   */
  ${methodName}(): string {
    return 'Generated method';
  }`;
    }
    if (taskDescription.toLowerCase().includes('validate')) {
        // Add validation logic
        return `${originalContent}

  /**
   * Validation method
   */
  validateInput(input: string): boolean {
    return input && input.length > 0;
  }`;
    }
    if (taskDescription.toLowerCase().includes('fix')) {
        // Fix syntax issues by ensuring proper structure
        const lines = originalContent.split('\n');
        const fixedLines = lines.map(line => {
            // Fix incomplete if statements
            if (line.trim().match(/^if\s+\(.*\)\s*$/)) {
                return line + ' { /* Fixed incomplete statement */ }';
            }
            // Fix incomplete for loops
            if (line.trim().match(/^for\s+\(.*\)\s*$/)) {
                return line + ' { /* Fixed incomplete loop */ }';
            }
            return line;
        });
        return fixedLines.join('\n');
    }
    // Default: return a simple modification
    return `${originalContent}

// Generated modification for: ${taskDescription}
public generatedField: string = 'auto-generated';`;
}
/**
 * Generate unique ID
 */
function generateId() {
    return Math.random().toString(36).substr(2, 9);
}
//# sourceMappingURL=run-corrective-task.js.map