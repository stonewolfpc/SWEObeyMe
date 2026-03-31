import { ProjectMapper } from './project-mapper.js';
import { ContextMemory } from './context-memory.js';
import { AstUtils } from './ast-utils.js';
import { AstValidator } from './ast-validator.js';
import * as fs from 'fs-extra';
import * as path from 'path';
/**
 * Predictive Coding Engine
 *
 * Enables ARES to anticipate user intent and pre-compute:
 * - likely next steps
 * - required files
 * - potential patches
 * - missing imports
 * - structural fixes
 * - dependency updates
 *
 * This engine uses multiple analysis techniques:
 * - Project context analysis
 * - Context memory analysis
 * - AST analysis
 * - Pattern recognition
 * - Intent classification
 * - Dependency analysis
 */
export class PredictionEngine {
    config;
    metrics = {
        totalPredictions: 0,
        successfulPredictions: 0,
        averageConfidence: 0,
        averageProcessingTime: 0,
        lastPrediction: new Date(),
        actionDistribution: {},
        confidenceDistribution: {
            high: 0,
            medium: 0,
            low: 0,
        },
        fileTypePredictions: {},
    };
    projectMapper;
    contextMemory;
    astValidator;
    constructor(config = {
        analysisDepth: 'medium',
        confidenceThreshold: 0.5,
        maxActions: 10,
        enableFileAnalysis: true,
        enableASTAnalysis: true,
        enableContextMemoryAnalysis: true,
        enableDependencyAnalysis: true,
        enableMetrics: true,
    }) {
        this.config = config;
        this.projectMapper = new ProjectMapper();
        this.contextMemory = new ContextMemory();
        this.astValidator = new AstValidator();
    }
    /**
     * Analyze task and create prediction context
     *
     * @param task - Task description to analyze
     * @returns Comprehensive prediction context
     */
    async analyzeTask(task) {
        const startTime = Date.now();
        console.log(`🔮 Analyzing task for predictions: ${task}`);
        try {
            // 1. Get project context
            const projectContext = await this.projectMapper.getProjectContext(process.cwd(), {
                includeTests: false,
                maxDepth: 10,
                cacheKey: 'prediction-engine',
            });
            // 2. Analyze files
            const fileAnalysis = await this.analyzeFiles();
            // 3. Perform AST analysis
            const astAnalysis = await this.performASTAnalysis();
            // 4. Analyze context memory
            const contextMemoryAnalysis = await this.analyzeContextMemory();
            const context = {
                id: this.generateId(),
                task,
                workingDirectory: process.cwd(),
                projectContext,
                fileAnalysis,
                astAnalysis,
                contextMemory: contextMemoryAnalysis,
                metadata: {
                    timestamp: new Date(),
                    confidence: 0,
                    analysisDepth: this.config.analysisDepth,
                    processingTime: Date.now() - startTime,
                },
            };
            console.log(`✅ Task analysis completed (${context.metadata.processingTime}ms)`);
            return context;
        }
        catch (error) {
            console.error(`❌ Task analysis failed: ${error.message}`);
            throw error;
        }
    }
    /**
     * Generate predicted actions based on analysis
     *
     * @param context - Prediction context
     * @returns Array of predicted actions
     */
    async generatePredictedActions(context) {
        console.log(`🎯 Generating predicted actions...`);
        const actions = [];
        try {
            // 1. Classify intent
            const intent = await this.classifyIntent(context.task);
            // 2. Generate file-based predictions
            const fileActions = await this.generateFileActions(context);
            actions.push(...fileActions);
            // 3. Generate import-based predictions
            const importActions = await this.generateImportActions(context);
            actions.push(...importActions);
            // 4. Generate structural predictions
            const structuralActions = await this.generateStructuralActions(context);
            actions.push(...structuralActions);
            // 5. Generate dependency predictions
            if (this.config.enableDependencyAnalysis) {
                const dependencyActions = await this.generateDependencyActions(context);
                actions.push(...dependencyActions);
            }
            // 6. Generate refactor predictions
            const refactorActions = await this.generateRefactorActions(context);
            actions.push(...refactorActions);
            // 7. Sort by confidence and priority
            const sortedActions = actions
                .filter(action => action.confidence >= this.config.confidenceThreshold)
                .sort((a, b) => {
                // First by priority
                const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
                const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
                if (priorityDiff !== 0)
                    return priorityDiff;
                // Then by confidence
                return b.confidence - a.confidence;
            })
                .slice(0, this.config.maxActions);
            console.log(`✅ Generated ${sortedActions.length} predicted actions`);
            return sortedActions;
        }
        catch (error) {
            console.error(`❌ Action generation failed: ${error.message}`);
            return [];
        }
    }
    /**
     * Summarize predicted actions
     *
     * @param actions - Predicted actions to summarize
     * @returns Human-readable summary
     */
    summarize(actions) {
        if (actions.length === 0) {
            return "No specific actions predicted for this task.";
        }
        const summary = [];
        // Group actions by type
        const actionsByType = actions.reduce((groups, action) => {
            if (!groups[action.type]) {
                groups[action.type] = [];
            }
            groups[action.type].push(action);
            return groups;
        }, {});
        // Generate summary for each type
        Object.entries(actionsByType).forEach(([type, typeActions]) => {
            const highConfidence = typeActions.filter(a => a.confidence >= 0.7);
            const mediumConfidence = typeActions.filter(a => a.confidence >= 0.5 && a.confidence < 0.7);
            if (highConfidence.length > 0) {
                summary.push(`${type.charAt(0).toUpperCase() + type.slice(1)}: ${highConfidence.length} high-confidence actions`);
            }
            if (mediumConfidence.length > 0) {
                summary.push(`${type.charAt(0).toUpperCase() + type.slice(1)}: ${mediumConfidence.length} medium-confidence actions`);
            }
        });
        // Add top recommendations
        const topActions = actions.slice(0, 3);
        if (topActions.length > 0) {
            summary.push("\nTop recommendations:");
            topActions.forEach((action, index) => {
                summary.push(`${index + 1}. ${action.description} (${(action.confidence * 100).toFixed(1)}% confidence)`);
            });
        }
        return summary.join('\n');
    }
    /**
     * Run complete prediction workflow
     *
     * @param task - Task description to predict for
     * @returns Complete prediction result
     */
    async run(task) {
        const startTime = Date.now();
        console.log(`🚀 Running prediction engine for: ${task}`);
        try {
            // 1. Analyze task
            const context = await this.analyzeTask(task);
            // 2. Generate actions
            const actions = await this.generatePredictedActions(context);
            // 3. Create summary
            const summary = this.summarize(actions);
            // 4. Calculate overall confidence
            const overallConfidence = actions.length > 0
                ? actions.reduce((sum, action) => sum + action.confidence, 0) / actions.length
                : 0;
            // 5. Update metrics
            if (this.config.enableMetrics) {
                this.updateMetrics(actions, overallConfidence, Date.now() - startTime);
            }
            const result = {
                id: this.generateId(),
                task,
                actions,
                summary,
                confidence: overallConfidence,
                metadata: {
                    timestamp: new Date(),
                    processingTime: Date.now() - startTime,
                    analysisDepth: this.config.analysisDepth,
                    totalActions: actions.length,
                    highConfidenceActions: actions.filter(a => a.confidence >= 0.7).length,
                    criticalActions: actions.filter(a => a.priority === 'critical').length,
                },
            };
            console.log(`✅ Prediction completed (${result.metadata.processingTime}ms)`);
            console.log(`   Actions: ${result.actions.length}`);
            console.log(`   Confidence: ${(result.confidence * 100).toFixed(1)}%`);
            return result;
        }
        catch (error) {
            console.error(`❌ Prediction failed: ${error.message}`);
            return {
                id: this.generateId(),
                task,
                actions: [],
                summary: `Prediction failed: ${error.message}`,
                confidence: 0,
                metadata: {
                    timestamp: new Date(),
                    processingTime: Date.now() - startTime,
                    analysisDepth: this.config.analysisDepth,
                    totalActions: 0,
                    highConfidenceActions: 0,
                    criticalActions: 0,
                },
            };
        }
    }
    /**
     * Analyze files in the project
     */
    async analyzeFiles() {
        const workingDir = process.cwd();
        const files = await this.getProjectFiles(workingDir);
        const fileTypes = {};
        const largestFiles = [];
        const recentFiles = [];
        for (const file of files) {
            // Count file types
            const ext = path.extname(file).toLowerCase();
            fileTypes[ext] = (fileTypes[ext] || 0) + 1;
            try {
                const stats = await fs.stat(file);
                const content = await fs.readFile(file, 'utf8');
                const lines = content.split('\n').length;
                // Track largest files
                largestFiles.push({
                    path: file,
                    size: stats.size,
                    lines,
                });
                // Track recent files
                recentFiles.push({
                    path: file,
                    modified: stats.mtime,
                    size: stats.size,
                });
            }
            catch (error) {
                // Skip files that can't be read
            }
        }
        // Sort and limit results
        largestFiles.sort((a, b) => b.size - a.size).slice(0, 10);
        recentFiles.sort((a, b) => b.modified.getTime() - a.modified.getTime()).slice(0, 10);
        return {
            totalFiles: files.length,
            fileTypes,
            largestFiles,
            recentFiles,
        };
    }
    /**
     * Perform AST analysis
     */
    async performASTAnalysis() {
        const analysis = {
            classes: [],
            interfaces: [],
            imports: [],
            exports: [],
        };
        if (!this.config.enableASTAnalysis) {
            return analysis;
        }
        const workingDir = process.cwd();
        const files = await this.getProjectFiles(workingDir);
        const tsFiles = files.filter(file => file.endsWith('.ts') || file.endsWith('.tsx'));
        for (const file of tsFiles) {
            try {
                const content = await fs.readFile(file, 'utf8');
                const sourceFile = AstUtils.createSourceFile(file, content);
                // Analyze declarations
                const declarations = AstUtils.getTopLevelDeclarations(sourceFile);
                // Add classes
                declarations.classes.forEach(cls => {
                    analysis.classes.push({
                        name: cls.name,
                        filePath: file,
                        methods: 0, // TODO: Count methods
                        properties: 0, // TODO: Count properties
                    });
                });
                // Add interfaces
                declarations.interfaces.forEach(iface => {
                    analysis.interfaces.push({
                        name: iface.name,
                        filePath: file,
                        methods: 0, // TODO: Count methods
                    });
                });
                // Add imports
                const imports = AstUtils.getImports(sourceFile);
                imports.forEach(imp => {
                    analysis.imports.push({
                        source: imp.moduleSpecifier,
                        filePath: file,
                        identifiers: imp.identifiers,
                    });
                });
            }
            catch (error) {
                // Skip files that can't be parsed
            }
        }
        return analysis;
    }
    /**
     * Analyze context memory
     */
    async analyzeContextMemory() {
        const analysis = {
            recentTasks: [],
            recentPatches: [],
            activeSession: {
                id: this.generateId(),
                startTime: new Date(),
                taskCount: 0,
            },
        };
        if (!this.config.enableContextMemoryAnalysis) {
            return analysis;
        }
        try {
            // Get recent context
            const allContext = await this.contextMemory.getContext('all');
            // This is a simplified implementation
            // In a real implementation, we would parse the context memory data
        }
        catch (error) {
            // Continue without context memory analysis
        }
        return analysis;
    }
    /**
     * Classify user intent
     */
    async classifyIntent(task) {
        // Simple intent classification for MVP
        const intents = {
            'create': ['add', 'create', 'new', 'implement', 'build'],
            'fix': ['fix', 'repair', 'resolve', 'correct', 'debug'],
            'refactor': ['refactor', 'improve', 'optimize', 'clean', 'reorganize'],
            'test': ['test', 'spec', 'verify', 'validate', 'check'],
            'import': ['import', 'require', 'include', 'add dependency'],
            'update': ['update', 'modify', 'change', 'edit', 'alter'],
        };
        const keywords = task.toLowerCase().split(/\s+/);
        const confidence = {};
        // Calculate confidence for each intent
        Object.entries(intents).forEach(([intent, patterns]) => {
            const matches = patterns.filter(pattern => keywords.some(keyword => keyword.includes(pattern))).length;
            confidence[intent] = matches / patterns.length;
        });
        // Find primary intent
        const primaryIntent = Object.entries(confidence)
            .sort(([, a], [, b]) => b - a)[0]?.[0] || 'unknown';
        return {
            intent: primaryIntent,
            secondaryIntents: Object.entries(confidence)
                .filter(([, conf]) => conf > 0.3)
                .map(([intent]) => intent)
                .filter(intent => intent !== primaryIntent),
            confidence,
            keywords,
            entities: [],
            suggestedActions: [],
        };
    }
    /**
     * Generate file-based actions
     */
    async generateFileActions(context) {
        const actions = [];
        // Predict likely files to edit based on task keywords
        const task = context.task.toLowerCase();
        const files = context.fileAnalysis.recentFiles.map(f => f.path);
        // Simple file prediction logic
        if (task.includes('service') || task.includes('api')) {
            const serviceFiles = files.filter(f => f.includes('service') || f.includes('api'));
            serviceFiles.forEach(file => {
                actions.push({
                    id: this.generateId(),
                    type: 'edit',
                    filePath: file,
                    description: `Likely edit needed in ${file}`,
                    confidence: 0.7,
                    impact: 'medium',
                    requiredContext: ['file-content'],
                    dependencies: [],
                    suggestion: 'Review and update the service logic',
                    priority: 'medium',
                    outcome: 'Service functionality updated',
                    risk: 'low',
                    estimatedTime: 30000,
                });
            });
        }
        if (task.includes('test') || task.includes('spec')) {
            const testFiles = files.filter(f => f.includes('test') || f.includes('spec'));
            testFiles.forEach(file => {
                actions.push({
                    id: this.generateId(),
                    type: 'edit',
                    filePath: file,
                    description: `Test update needed in ${file}`,
                    confidence: 0.8,
                    impact: 'medium',
                    requiredContext: ['file-content'],
                    dependencies: [],
                    suggestion: 'Update tests to match new functionality',
                    priority: 'medium',
                    outcome: 'Test coverage updated',
                    risk: 'low',
                    estimatedTime: 15000,
                });
            });
        }
        return actions;
    }
    /**
     * Generate import-based actions
     */
    async generateImportActions(context) {
        const actions = [];
        // Predict missing imports based on task keywords
        const task = context.task.toLowerCase();
        if (task.includes('validation') || task.includes('validate')) {
            actions.push({
                id: this.generateId(),
                type: 'import',
                filePath: 'src/utils/validation.ts',
                description: 'Import validation utilities',
                confidence: 0.6,
                impact: 'low',
                requiredContext: [],
                dependencies: [],
                suggestion: 'Add validation import for input checking',
                priority: 'medium',
                outcome: 'Validation functionality available',
                risk: 'low',
                estimatedTime: 5000,
            });
        }
        if (task.includes('logging') || task.includes('log')) {
            actions.push({
                id: this.generateId(),
                type: 'import',
                filePath: 'src/utils/logger.ts',
                description: 'Import logging utilities',
                confidence: 0.7,
                impact: 'low',
                requiredContext: [],
                dependencies: [],
                suggestion: 'Add logging import for debugging',
                priority: 'medium',
                outcome: 'Logging functionality available',
                risk: 'low',
                estimatedTime: 5000,
            });
        }
        return actions;
    }
    /**
     * Generate structural actions
     */
    async generateStructuralActions(context) {
        const actions = [];
        // Predict structural fixes based on AST analysis
        const task = context.task.toLowerCase();
        if (task.includes('method') || task.includes('function')) {
            // Look for classes that might need new methods
            context.astAnalysis.classes.forEach(cls => {
                actions.push({
                    id: this.generateId(),
                    type: 'edit',
                    filePath: cls.filePath,
                    description: `Add new method to ${cls.name} class`,
                    confidence: 0.6,
                    impact: 'medium',
                    requiredContext: ['file-content'],
                    dependencies: [],
                    suggestion: `Implement the requested method in ${cls.name}`,
                    priority: 'high',
                    outcome: 'New method added to class',
                    risk: 'medium',
                    estimatedTime: 20000,
                });
            });
        }
        return actions;
    }
    /**
     * Generate dependency actions
     */
    async generateDependencyActions(context) {
        const actions = [];
        // Predict dependency updates based on task
        const task = context.task.toLowerCase();
        if (task.includes('database') || task.includes('db')) {
            actions.push({
                id: this.generateId(),
                type: 'dependency',
                filePath: 'package.json',
                description: 'Update database dependencies',
                confidence: 0.5,
                impact: 'high',
                requiredContext: ['package-content'],
                dependencies: [],
                suggestion: 'Update database driver or ORM dependencies',
                priority: 'medium',
                outcome: 'Database dependencies updated',
                risk: 'high',
                estimatedTime: 60000,
            });
        }
        return actions;
    }
    /**
     * Generate refactor actions
     */
    async generateRefactorActions(context) {
        const actions = [];
        // Predict refactoring based on file analysis
        const largeFiles = context.fileAnalysis.largestFiles.filter(f => f.lines > 200);
        largeFiles.forEach(file => {
            actions.push({
                id: this.generateId(),
                type: 'refactor',
                filePath: file.path,
                description: `Consider refactoring large file (${file.lines} lines)`,
                confidence: 0.4,
                impact: 'medium',
                requiredContext: ['file-content'],
                dependencies: [],
                suggestion: 'Break down large file into smaller modules',
                priority: 'low',
                outcome: 'Improved code maintainability',
                risk: 'medium',
                estimatedTime: 120000,
            });
        });
        return actions;
    }
    /**
     * Get project files
     */
    async getProjectFiles(workingDir) {
        const files = [];
        try {
            const entries = await fs.readdir(workingDir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(workingDir, entry.name);
                if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
                    // Recursively scan subdirectories
                    const subFiles = await this.getProjectFiles(fullPath);
                    files.push(...subFiles);
                }
                else if (entry.isFile() && this.isSourceFile(entry.name)) {
                    files.push(fullPath);
                }
            }
        }
        catch (error) {
            // Handle directory access errors
        }
        return files;
    }
    /**
     * Check if file is a source file
     */
    isSourceFile(fileName) {
        const sourceExtensions = ['.ts', '.tsx', '.js', '.jsx', '.json', '.md'];
        return sourceExtensions.some(ext => fileName.endsWith(ext));
    }
    /**
     * Update prediction metrics
     */
    updateMetrics(actions, confidence, processingTime) {
        this.metrics.totalPredictions++;
        this.metrics.averageConfidence = (this.metrics.averageConfidence * (this.metrics.totalPredictions - 1) + confidence) / this.metrics.totalPredictions;
        this.metrics.averageProcessingTime = (this.metrics.averageProcessingTime * (this.metrics.totalPredictions - 1) + processingTime) / this.metrics.totalPredictions;
        this.metrics.lastPrediction = new Date();
        // Update action distribution
        actions.forEach(action => {
            this.metrics.actionDistribution[action.type] = (this.metrics.actionDistribution[action.type] || 0) + 1;
            // Update confidence distribution
            if (action.confidence >= 0.7) {
                this.metrics.confidenceDistribution.high++;
            }
            else if (action.confidence >= 0.5) {
                this.metrics.confidenceDistribution.medium++;
            }
            else {
                this.metrics.confidenceDistribution.low++;
            }
            // Update file type predictions
            const ext = path.extname(action.filePath);
            this.metrics.fileTypePredictions[ext] = (this.metrics.fileTypePredictions[ext] || 0) + 1;
        });
    }
    /**
     * Get prediction metrics
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
//# sourceMappingURL=prediction-engine.js.map