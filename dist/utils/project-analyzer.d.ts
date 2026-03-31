import { ProjectAnalysisResult } from '../types/index.js';
/**
 * Project Analyzer Utility
 *
 * Analyzes project structure, dependencies, architecture, and metrics
 * to provide comprehensive insights for SWE automation tasks.
 */
export declare class ProjectAnalyzer {
    private cache;
    /**
     * Analyze project structure
     */
    analyzeStructure(projectPath: string, depth?: number): Promise<ProjectAnalysisResult>;
    /**
     * Analyze code quality
     */
    analyzeQuality(targetPath: string, metrics?: string[], threshold?: number): Promise<any>;
    /**
     * Analyze project structure
     */
    private analyzeProjectStructure;
    /**
     * Scan directory structure
     */
    private scanDirectory;
    /**
     * Check if directory should be ignored
     */
    private shouldIgnoreDirectory;
    /**
     * Check if file is a source file
     */
    private isSourceFile;
    /**
     * Detect project type
     */
    private detectProjectType;
    /**
     * Detect architectural pattern
     */
    private detectArchitecturalPattern;
    /**
     * Analyze dependencies
     */
    private analyzeDependencies;
    /**
     * Detect package manager
     */
    private detectPackageManager;
    /**
     * Parse dependencies from package file
     */
    private parseDependencies;
    /**
     * Analyze architecture
     */
    private analyzeArchitecture;
    /**
     * Calculate project metrics
     */
    private calculateMetrics;
    /**
     * Generate recommendations based on analysis
     */
    private generateRecommendations;
    /**
     * Clear cache
     */
    clearCache(): void;
}
//# sourceMappingURL=project-analyzer.d.ts.map