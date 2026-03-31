import { ProjectMapper } from './project-mapper.js';
import { ContextMemory } from './context-memory.js';
import { PredictionEngine } from './prediction-engine.js';
import { AstValidator } from './ast-validator.js';
import { PatchValidator } from './patch-validator.js';
import { CorrectionEngine } from './correction-engine.js';
import { PromptEnforcer } from './prompt-enforcer.js';
import * as fs from 'fs-extra';
import * as path from 'path';
/**
 * Autonomous Multi-File Refactor Engine
 *
 * Enables SWEObeyMe to analyze entire project structure, detect cross-file issues,
 * generate coordinated multi-file patches, validate each patch, apply changes safely,
 * and maintain architectural integrity.
 */
export class RefactorEngine {
    config;
    metrics = {
        totalRefactors: 0,
        successfulRefactors: 0,
        averageConfidence: 0,
        averageProcessingTime: 0,
        lastRefactor: new Date(),
        targetDistribution: {},
        successRateByType: {},
        averageEffortByType: {},
        fileTypeDistribution: {},
    };
    projectMapper;
    contextMemory;
    predictionEngine;
    astValidator;
    patchValidator;
    correctionEngine;
    promptEnforcer;
    constructor(config = {
        analysisDepth: 'medium',
        confidenceThreshold: 0.5,
        maxTargets: 10,
        maxRetries: 3,
        enableRollback: true,
        enableBackup: true,
        enableValidation: true,
        enableCorrection: true,
        enableMetrics: true,
    }) {
        this.config = config;
        this.projectMapper = new ProjectMapper();
        this.contextMemory = new ContextMemory();
        this.predictionEngine = new PredictionEngine();
        this.astValidator = new AstValidator();
        this.patchValidator = new PatchValidator();
        this.correctionEngine = new CorrectionEngine(new PromptEnforcer(this.contextMemory, this.projectMapper), this.patchValidator);
        this.promptEnforcer = new PromptEnforcer(this.contextMemory, this.projectMapper);
    }
    /**
     * Analyze entire project structure and identify refactoring targets
     *
     * @param task - Refactor task description
     * @returns Complete refactor plan with targets and metadata
     */
    async analyzeProject(task) {
        const startTime = Date.now();
        console.log(`🔍 Analyzing project for refactoring: ${task}`);
        try {
            // 1. Create refactor context
            const context = await this.createRefactorContext(task);
            // 2. Identify refactor targets
            const targets = await this.identifyRefactorTargets(context);
            // 3. Filter and prioritize targets
            const prioritizedTargets = this.prioritizeTargets(targets);
            // 4. Calculate overall metrics
            const overallConfidence = this.calculateOverallConfidence(prioritizedTargets);
            const overallImpact = this.calculateOverallImpact(prioritizedTargets);
            const estimatedEffort = prioritizedTargets.reduce((sum, target) => sum + target.estimatedEffort, 0);
            const plan = {
                id: this.generateId(),
                task,
                targets: prioritizedTargets,
                description: this.generatePlanDescription(task, prioritizedTargets),
                estimatedImpact: overallImpact,
                confidence: overallConfidence,
                estimatedEffort,
                risk: this.calculateOverallRisk(prioritizedTargets),
                dependencies: [],
                prerequisites: [],
                expectedOutcomes: this.generateExpectedOutcomes(task, prioritizedTargets),
                risks: this.identifyRisks(prioritizedTargets),
                successCriteria: this.generateSuccessCriteria(task, prioritizedTargets),
                rollbackStrategy: this.generateRollbackStrategy(prioritizedTargets),
                metadata: {
                    timestamp: new Date(),
                    analysisDepth: this.config.analysisDepth,
                    processingTime: Date.now() - startTime,
                    version: '1.0.0',
                },
            };
            console.log(`✅ Project analysis completed (${plan.metadata.processingTime}ms)`);
            console.log(`   Targets identified: ${plan.targets.length}`);
            console.log(`   Overall confidence: ${(plan.confidence * 100).toFixed(1)}%`);
            return plan;
        }
        catch (error) {
            console.error(`❌ Project analysis failed: ${error.message}`);
            throw error;
        }
    }
    /**
     * Generate coordinated multi-file patches based on refactor plan
     *
     * @param refactorPlan - Refactor plan with targets
     * @returns Array of refactor patches
     */
    async generatePatches(refactorPlan) {
        console.log(`🔧 Generating patches for ${refactorPlan.targets.length} targets...`);
        const patches = [];
        const startTime = Date.now();
        try {
            // Generate patches for each target
            for (const target of refactorPlan.targets) {
                console.log(`   Processing target: ${target.filePath}`);
                try {
                    const patch = await this.generatePatchForTarget(target, refactorPlan);
                    patches.push(patch);
                    console.log(`     ✅ Patch generated (${patch.validation.valid ? 'valid' : 'invalid'})`);
                }
                catch (error) {
                    console.error(`     ❌ Patch generation failed: ${error.message}`);
                    // Create a failed patch record
                    const failedPatch = {
                        id: this.generateId(),
                        filePath: target.filePath,
                        originalContent: '',
                        patchedContent: '',
                        validation: {
                            valid: false,
                            score: 0,
                            issues: [{
                                    category: 'generation',
                                    severity: 'error',
                                    description: error.message,
                                }],
                            summary: `Patch generation failed: ${error.message}`,
                        },
                        success: false,
                        error: error.message,
                        confidence: 0,
                        retries: 0,
                        timestamp: new Date(),
                        processingTime: Date.now() - startTime,
                    };
                    patches.push(failedPatch);
                }
            }
            console.log(`✅ Patch generation completed (${patches.length} patches, ${Date.now() - startTime}ms)`);
            console.log(`   Valid patches: ${patches.filter(p => p.validation.valid).length}`);
            console.log(`   Invalid patches: ${patches.filter(p => !p.validation.valid).length}`);
            return patches;
        }
        catch (error) {
            console.error(`❌ Patch generation failed: ${error.message}`);
            throw error;
        }
    }
    /**
     * Apply patches safely with validation and rollback
     *
     * @param patches - Array of patches to apply
     * @returns Complete refactor result
     */
    async applyPatchesSafely(patches) {
        console.log(`🔒 Applying ${patches.length} patches safely...`);
        const startTime = Date.now();
        const appliedPatches = [];
        const failedPatches = [];
        const backupPaths = [];
        try {
            // Apply patches in dependency order
            const sortedPatches = this.sortPatchesByDependencies(patches);
            for (const patch of sortedPatches) {
                console.log(`   Applying patch to ${patch.filePath}`);
                try {
                    // Validate patch before applying
                    if (!this.config.enableValidation || patch.validation.valid) {
                        // Apply patch directly
                        const applyResult = await this.applyPatchDirectly(patch);
                        if (applyResult.success) {
                            appliedPatches.push(patch);
                            if (applyResult.backupPath) {
                                backupPaths.push(applyResult.backupPath);
                            }
                            console.log(`     ✅ Patch applied successfully`);
                        }
                        else {
                            failedPatches.push(patch);
                            console.log(`     ❌ Patch application failed: ${applyResult.error}`);
                        }
                    }
                    else {
                        failedPatches.push(patch);
                        console.log(`     ❌ Patch validation failed`);
                    }
                }
                catch (error) {
                    console.error(`     ❌ Patch processing error: ${error.message}`);
                    failedPatches.push(patch);
                }
            }
            // Calculate statistics
            const statistics = this.calculateStatistics(appliedPatches, failedPatches, Date.now() - startTime);
            // Generate summary
            const summary = this.generateRefactorSummary(appliedPatches, failedPatches, statistics);
            const result = {
                id: this.generateId(),
                task: patches[0]?.filePath ? `Refactor ${patches.length} files` : 'Refactor operation',
                plan: {
                    id: this.generateId(),
                    task: patches[0]?.filePath ? `Refactor ${patches.length} files` : 'Refactor operation',
                    targets: [],
                    description: 'Multi-file refactor operation',
                    estimatedImpact: 'medium',
                    confidence: appliedPatches.length > 0 ? appliedPatches.reduce((sum, p) => sum + p.confidence, 0) / appliedPatches.length : 0,
                    estimatedEffort: statistics.totalLinesChanged / 10,
                    risk: 'medium',
                    dependencies: [],
                    prerequisites: [],
                    expectedOutcomes: [],
                    risks: [],
                    successCriteria: [],
                    rollbackStrategy: '',
                    metadata: {
                        timestamp: new Date(),
                        analysisDepth: this.config.analysisDepth,
                        processingTime: 0,
                        version: '1.0.0',
                    },
                },
                patches: [...appliedPatches, ...failedPatches],
                success: failedPatches.length === 0,
                summary,
                failures: failedPatches,
                statistics,
                impact: {
                    codeQuality: 'improved',
                    maintainability: 'improved',
                    testCoverage: 'maintained',
                    performance: 'maintained',
                },
                rollback: {
                    available: backupPaths.length > 0,
                    backupPaths,
                },
                recommendations: this.generateRecommendations(appliedPatches, failedPatches),
                nextSteps: this.generateNextSteps(appliedPatches, failedPatches),
                metadata: {
                    timestamp: new Date(),
                    processingTime: Date.now() - startTime,
                    version: '1.0.0',
                    environment: process.env.NODE_ENV || 'development',
                },
            };
            console.log(`✅ Patch application completed (${result.metadata.processingTime}ms)`);
            console.log(`   Success: ${result.success}`);
            console.log(`   Applied: ${result.statistics.successfulPatches}`);
            console.log(`   Failed: ${result.statistics.failedPatches}`);
            // Update metrics
            if (this.config.enableMetrics) {
                this.updateMetrics(result);
            }
            return result;
        }
        catch (error) {
            console.error(`❌ Patch application failed: ${error.message}`);
            return {
                id: this.generateId(),
                task: 'Refactor operation',
                plan: {
                    id: this.generateId(),
                    task: 'Refactor operation',
                    targets: [],
                    description: 'Failed refactor operation',
                    estimatedImpact: 'low',
                    confidence: 0,
                    estimatedEffort: 0,
                    risk: 'high',
                    dependencies: [],
                    prerequisites: [],
                    expectedOutcomes: [],
                    risks: [],
                    successCriteria: [],
                    rollbackStrategy: '',
                    metadata: {
                        timestamp: new Date(),
                        analysisDepth: this.config.analysisDepth,
                        processingTime: 0,
                        version: '1.0.0',
                    },
                },
                patches: [],
                success: false,
                summary: `Refactor failed: ${error.message}`,
                failures: [],
                statistics: {
                    totalTargets: 0,
                    successfulPatches: 0,
                    failedPatches: 0,
                    totalLinesChanged: 0,
                    totalFilesChanged: 0,
                    averageConfidence: 0,
                    totalProcessingTime: Date.now() - startTime,
                    successRate: 0,
                },
                impact: {
                    codeQuality: 'maintained',
                    maintainability: 'maintained',
                    testCoverage: 'maintained',
                    performance: 'maintained',
                },
                rollback: {
                    available: false,
                    backupPaths: [],
                },
                recommendations: ['Review the error and try again'],
                nextSteps: ['Fix the identified issues'],
                metadata: {
                    timestamp: new Date(),
                    processingTime: Date.now() - startTime,
                    version: '1.0.0',
                    environment: process.env.NODE_ENV || 'development',
                },
            };
        }
    }
    /**
     * Run complete refactor workflow
     *
     * @param task - Refactor task description
     * @returns Complete refactor result
     */
    async run(task) {
        console.log(`🚀 Starting autonomous refactor: ${task}`);
        const startTime = Date.now();
        try {
            // 1. Analyze project and create plan
            const plan = await this.analyzeProject(task);
            if (plan.targets.length === 0) {
                throw new Error('No refactoring targets identified');
            }
            // 2. Generate patches
            const patches = await this.generatePatches(plan);
            if (patches.length === 0) {
                throw new Error('No patches generated');
            }
            // 3. Apply patches safely
            const result = await this.applyPatchesSafely(patches);
            console.log(`🎉 Refactor completed (${Date.now() - startTime}ms)`);
            console.log(`   Success: ${result.success}`);
            console.log(`   Total patches: ${result.patches.length}`);
            console.log(`   Applied: ${result.statistics.successfulPatches}`);
            console.log(`   Failed: ${result.statistics.failedPatches}`);
            return result;
        }
        catch (error) {
            console.error(`❌ Refactor failed: ${error.message}`);
            return {
                id: this.generateId(),
                task,
                plan: {
                    id: this.generateId(),
                    task,
                    targets: [],
                    description: 'Failed refactor operation',
                    estimatedImpact: 'low',
                    confidence: 0,
                    estimatedEffort: 0,
                    risk: 'high',
                    dependencies: [],
                    prerequisites: [],
                    expectedOutcomes: [],
                    risks: [],
                    successCriteria: [],
                    rollbackStrategy: '',
                    metadata: {
                        timestamp: new Date(),
                        analysisDepth: this.config.analysisDepth,
                        processingTime: 0,
                        version: '1.0.0',
                    },
                },
                patches: [],
                success: false,
                summary: `Refactor failed: ${error.message}`,
                failures: [],
                statistics: {
                    totalTargets: 0,
                    successfulPatches: 0,
                    failedPatches: 0,
                    totalLinesChanged: 0,
                    totalFilesChanged: 0,
                    averageConfidence: 0,
                    totalProcessingTime: Date.now() - startTime,
                    successRate: 0,
                },
                impact: {
                    codeQuality: 'maintained',
                    maintainability: 'maintained',
                    testCoverage: 'maintained',
                    performance: 'maintained',
                },
                rollback: {
                    available: false,
                    backupPaths: [],
                },
                recommendations: ['Review the error and try again'],
                nextSteps: ['Fix the identified issues'],
                metadata: {
                    timestamp: new Date(),
                    processingTime: Date.now() - startTime,
                    version: '1.0.0',
                    environment: process.env.NODE_ENV || 'development',
                },
            };
        }
    }
    /**
     * Create refactor context for analysis
     */
    async createRefactorContext(task) {
        // Get project context
        const projectContext = await this.projectMapper.getProjectContext(process.cwd(), {
            includeTests: true,
            maxDepth: 10,
            cacheKey: 'refactor-engine',
        });
        return {
            id: this.generateId(),
            task,
            workingDirectory: process.cwd(),
            projectContext,
            fileSystemAnalysis: {
                totalFiles: 0,
                fileTypes: {},
                directoryStructure: [],
                largestFiles: [],
            },
            astAnalysis: {
                classes: [],
                interfaces: [],
                imports: [],
                exports: [],
            },
            qualityMetrics: {
                maintainabilityIndex: 75,
                cyclomaticComplexity: 5,
                codeDuplication: 10,
                testCoverage: 60,
                technicalDebt: 15,
            },
            metadata: {
                timestamp: new Date(),
                analysisDepth: this.config.analysisDepth,
                processingTime: 0,
                confidence: 0,
            },
        };
    }
    /**
     * Identify refactor targets based on analysis
     */
    async identifyRefactorTargets(context) {
        const targets = [];
        // Simple target identification for MVP
        // In a real implementation, this would be more sophisticated
        // Add some example targets based on common patterns
        targets.push({
            filePath: 'src/utils/example.ts',
            reason: 'High complexity detected',
            confidence: 0.8,
            refactorType: 'structural',
            issues: ['Complexity score: 15'],
            suggestions: ['Break down into smaller functions'],
            estimatedImpact: 'medium',
            dependencies: [],
            dependents: [],
            risk: 'low',
            estimatedEffort: 20,
            metrics: {
                lines: 100,
                complexity: 15,
                maintainability: 60,
                testCoverage: 50,
            },
        });
        return targets;
    }
    /**
     * Prioritize and filter targets
     */
    prioritizeTargets(targets) {
        return targets
            .filter(target => target.confidence >= this.config.confidenceThreshold)
            .sort((a, b) => {
            // First by impact
            const impactOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            const impactDiff = impactOrder[b.estimatedImpact] - impactOrder[a.estimatedImpact];
            if (impactDiff !== 0)
                return impactDiff;
            // Then by confidence
            return b.confidence - a.confidence;
        })
            .slice(0, this.config.maxTargets);
    }
    /**
     * Calculate overall confidence
     */
    calculateOverallConfidence(targets) {
        if (targets.length === 0)
            return 0;
        const totalConfidence = targets.reduce((sum, target) => sum + target.confidence, 0);
        return totalConfidence / targets.length;
    }
    /**
     * Calculate overall impact
     */
    calculateOverallImpact(targets) {
        const impacts = targets.map(t => t.estimatedImpact);
        if (impacts.includes('critical'))
            return 'critical';
        if (impacts.includes('high'))
            return 'high';
        if (impacts.includes('medium'))
            return 'medium';
        return 'low';
    }
    /**
     * Calculate overall risk
     */
    calculateOverallRisk(targets) {
        const risks = targets.map(t => t.risk);
        if (risks.includes('high'))
            return 'high';
        if (risks.includes('medium'))
            return 'medium';
        return 'low';
    }
    /**
     * Generate plan description
     */
    generatePlanDescription(task, targets) {
        const targetTypes = targets.map(t => t.refactorType);
        const uniqueTypes = [...new Set(targetTypes)];
        return `Refactor ${targets.length} files focusing on: ${uniqueTypes.join(', ')}. ${task}`;
    }
    /**
     * Generate expected outcomes
     */
    generateExpectedOutcomes(task, targets) {
        const outcomes = [];
        outcomes.push(`Improved code quality for ${targets.length} files`);
        outcomes.push(`Reduced technical debt`);
        outcomes.push(`Enhanced maintainability`);
        return outcomes;
    }
    /**
     * Identify risks
     */
    identifyRisks(targets) {
        const risks = [];
        const highRiskTargets = targets.filter(t => t.risk === 'high');
        if (highRiskTargets.length > 0) {
            risks.push(`High-risk changes to ${highRiskTargets.length} files`);
        }
        return risks;
    }
    /**
     * Generate success criteria
     */
    generateSuccessCriteria(task, targets) {
        const criteria = [];
        criteria.push('All patches applied successfully');
        criteria.push('No regression issues introduced');
        criteria.push('Code quality metrics improved');
        return criteria;
    }
    /**
     * Generate rollback strategy
     */
    generateRollbackStrategy(targets) {
        return `Rollback available via ${targets.length} backup files if needed`;
    }
    /**
     * Generate patch for a specific target
     */
    async generatePatchForTarget(target, plan) {
        const startTime = Date.now();
        try {
            // Read original content
            const originalContent = await fs.readFile(target.filePath, 'utf8');
            // Generate pre-flight prompt
            const prompt = await this.generateRefactorPrompt(target, plan, originalContent);
            // Simulate SWE patch generation (MVP implementation)
            const patchedContent = await this.simulateSWEPatchGeneration(prompt, originalContent, target);
            // Validate patch
            const validation = await this.validatePatchContent(originalContent, patchedContent, target.filePath);
            return {
                id: this.generateId(),
                filePath: target.filePath,
                originalContent,
                patchedContent,
                validation,
                success: validation.valid,
                confidence: target.confidence,
                retries: 0,
                timestamp: new Date(),
                processingTime: Date.now() - startTime,
            };
        }
        catch (error) {
            return {
                id: this.generateId(),
                filePath: target.filePath,
                originalContent: '',
                patchedContent: '',
                validation: {
                    valid: false,
                    score: 0,
                    issues: [{
                            category: 'generation',
                            severity: 'error',
                            description: error.message,
                        }],
                    summary: `Patch generation failed: ${error.message}`,
                },
                success: false,
                error: error.message,
                confidence: 0,
                retries: 0,
                timestamp: new Date(),
                processingTime: Date.now() - startTime,
            };
        }
    }
    /**
     * Generate refactor prompt for SWE
     */
    async generateRefactorPrompt(target, plan, originalContent) {
        const prompt = `
REFACTOR TASK: ${plan.task}

TARGET FILE: ${target.filePath}
REFACTOR TYPE: ${target.refactorType}
REASON: ${target.reason}
CONFIDENCE: ${(target.confidence * 100).toFixed(1)}%

ISSUES IDENTIFIED:
${target.issues.map(issue => `- ${issue}`).join('\n')}

SUGGESTIONS:
${target.suggestions.map(suggestion => `- ${suggestion}`).join('\n')}

CURRENT FILE CONTENT:
\`\`\`typescript
${originalContent}
\`\`\`

REFACTOR REQUIREMENTS:
1. Address all identified issues
2. Follow all suggestions
3. Maintain code quality and best practices
4. Preserve existing functionality
5. Ensure backward compatibility
6. Add proper error handling
7. Include necessary imports

OUTPUT FORMAT:
Provide the complete refactored file content - no explanations, no apologies, just the code.

REFACTORED CODE:
`;
        // Enforce the prompt with global rules
        const enforcedPrompt = await this.promptEnforcer.enforcePrompt(prompt, 'refactor_engine', {
            target,
            plan,
            originalContent,
        });
        return enforcedPrompt;
    }
    /**
     * Simulate SWE patch generation (MVP implementation)
     */
    async simulateSWEPatchGeneration(prompt, originalContent, target) {
        // Simple refactor simulation based on target type
        switch (target.refactorType) {
            case 'import':
                // Remove unused imports
                return originalContent;
            case 'structural':
                // Add missing error handling
                if (originalContent.includes('function') && !originalContent.includes('try')) {
                    return originalContent.replace(/function\s+\w+\([^)]*\)\s*\{/g, (match) => `function ${match.substring(9, match.length - 1)} {\n  try {\n    ${originalContent.substring(match.length).split('\n').slice(1).join('\n').trim()}\n  } catch (error) {\n    console.error('Error:', error);\n    throw error;\n  }\n}`);
                }
                return originalContent;
            default:
                return originalContent;
        }
    }
    /**
     * Validate patch content
     */
    async validatePatchContent(originalContent, patchedContent, filePath) {
        try {
            const result = await this.astValidator.runAll(originalContent, patchedContent);
            return {
                valid: result.valid,
                score: result.issues.length > 0 ? Math.max(0, 100 - result.issues.length * 10) : 100,
                issues: result.issues.map(issue => ({
                    category: issue.category,
                    severity: issue.severity,
                    description: issue.description,
                    location: issue.location && issue.location.line ? {
                        line: issue.location.line,
                        column: issue.location.column || 0,
                    } : undefined,
                })),
                summary: result.valid ? 'Patch validation passed' : `Patch validation failed: ${result.issues.length} issues`,
            };
        }
        catch (error) {
            return {
                valid: false,
                score: 0,
                issues: [{
                        category: 'validation',
                        severity: 'error',
                        description: error.message,
                    }],
                summary: `Validation error: ${error.message}`,
            };
        }
    }
    async applyPatchDirectly(patch) {
        // Create backup if enabled
        let backupPath;
        if (this.config.enableBackup) {
            backupPath = `${patch.filePath}.backup.${Date.now()}`;
        }
        try {
            if (backupPath) {
                await fs.copyFile(patch.filePath, backupPath);
            }
            // Write patched content
            await fs.writeFile(patch.filePath, patch.patchedContent, 'utf8');
            // Verify write
            const writtenContent = await fs.readFile(patch.filePath, 'utf8');
            if (writtenContent === patch.patchedContent) {
                return {
                    success: true,
                    before: patch.originalContent,
                    after: patch.patchedContent,
                    filePath: patch.filePath,
                    backupPath,
                };
            }
            else {
                throw new Error('Write verification failed');
            }
        }
        catch (error) {
            // Try to restore from backup if available
            if (backupPath && await fs.pathExists(backupPath)) {
                try {
                    await fs.copyFile(backupPath, patch.filePath);
                }
                catch (restoreError) {
                    console.error('Failed to restore from backup:', restoreError);
                }
            }
            throw new Error(`Patch application failed: ${error.message}`);
        }
    }
    /**
     * Sort patches by dependencies
     */
    sortPatchesByDependencies(patches) {
        // This is a simplified implementation
        // In a real implementation, we would analyze actual dependencies
        return patches;
    }
    /**
     * Calculate refactor statistics
     */
    calculateStatistics(appliedPatches, failedPatches, processingTime) {
        const allPatches = [...appliedPatches, ...failedPatches];
        const totalTargets = allPatches.length;
        const successfulPatches = appliedPatches.length;
        const failedPatchesCount = failedPatches.length;
        const totalLinesChanged = appliedPatches.reduce((sum, patch) => {
            return sum + (patch.patchedContent.split('\n').length - patch.originalContent.split('\n').length);
        }, 0);
        const totalFilesChanged = allPatches.length;
        const averageConfidence = successfulPatches > 0
            ? appliedPatches.reduce((sum, patch) => sum + patch.confidence, 0) / successfulPatches
            : 0;
        return {
            totalTargets,
            successfulPatches,
            failedPatches: failedPatchesCount,
            totalLinesChanged,
            totalFilesChanged,
            averageConfidence,
            totalProcessingTime: processingTime,
            successRate: totalTargets > 0 ? (successfulPatches / totalTargets) * 100 : 0,
        };
    }
    /**
     * Generate refactor summary
     */
    generateRefactorSummary(appliedPatches, failedPatches, statistics) {
        const lines = [];
        lines.push(`Refactor completed with ${statistics.successRate.toFixed(1)}% success rate`);
        lines.push(`Successfully applied: ${statistics.successfulPatches}/${statistics.totalTargets} patches`);
        lines.push(`Lines changed: ${statistics.totalLinesChanged}`);
        lines.push(`Files modified: ${statistics.totalFilesChanged}`);
        if (failedPatches.length > 0) {
            lines.push(`Failed patches: ${failedPatches.length}`);
            lines.push('Failed files:');
            failedPatches.forEach(patch => {
                lines.push(`  - ${patch.filePath}: ${patch.error || 'Unknown error'}`);
            });
        }
        return lines.join('\n');
    }
    /**
     * Generate recommendations
     */
    generateRecommendations(appliedPatches, failedPatches) {
        const recommendations = [];
        if (failedPatches.length > 0) {
            recommendations.push('Review and fix failed patches manually');
            recommendations.push('Consider adjusting confidence thresholds');
        }
        if (appliedPatches.length > 0) {
            recommendations.push('Run tests to verify changes');
            recommendations.push('Review applied changes for correctness');
            recommendations.push('Update documentation if needed');
        }
        return recommendations;
    }
    /**
     * Generate next steps
     */
    generateNextSteps(appliedPatches, failedPatches) {
        const nextSteps = [];
        if (failedPatches.length > 0) {
            nextSteps.push('Fix failed patches and retry');
        }
        if (appliedPatches.length > 0) {
            nextSteps.push('Run comprehensive testing suite');
            nextSteps.push('Update documentation');
            nextSteps.push('Monitor for regressions');
        }
        nextSteps.push('Review overall code quality metrics');
        return nextSteps;
    }
    /**
     * Update refactor metrics
     */
    updateMetrics(result) {
        this.metrics.totalRefactors++;
        if (result.success) {
            this.metrics.successfulRefactors++;
        }
        this.metrics.averageConfidence = (this.metrics.averageConfidence * (this.metrics.totalRefactors - 1) + result.statistics.averageConfidence) / this.metrics.totalRefactors;
        this.metrics.averageProcessingTime = (this.metrics.averageProcessingTime * (this.metrics.totalRefactors - 1) + result.metadata.processingTime) / this.metrics.totalRefactors;
        this.metrics.lastRefactor = result.metadata.timestamp;
        // Update target distribution
        result.patches.forEach(patch => {
            const ext = path.extname(patch.filePath);
            this.metrics.fileTypeDistribution[ext] = (this.metrics.fileTypeDistribution[ext] || 0) + 1;
        });
    }
    /**
     * Get refactor metrics
     */
    getMetrics() {
        return { ...this.metrics };
    }
    /**
     * Generate unique ID
     */
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }
}
//# sourceMappingURL=refactor-engine.js.map