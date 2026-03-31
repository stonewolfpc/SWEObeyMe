import { ProjectContext } from '../types/project-context.js';
/**
 * Project Mapper Utility
 *
 * Creates comprehensive project context maps that provide SWE with
 * complete global awareness of codebase structure, dependencies,
 * and architectural patterns.
 *
 * Features:
 * - Complete file structure analysis
 * - Namespace hierarchy mapping
 * - Class and method relationship tracking
 * - Dependency graph construction
 * - Pattern detection and convention analysis
 * - Cross-file relationship mapping
 */
export declare class ProjectMapper {
    private fileAnalyzer;
    private cache;
    constructor();
    /**
     * Generate complete project context for SWE global awareness
     *
     * @param projectPath - Root path of the project to analyze
     * @param options - Analysis options
     * @returns Comprehensive project context map
     */
    getProjectContext(projectPath: string, options?: {
        includeTests?: boolean;
        maxDepth?: number;
        cacheKey?: string;
    }): Promise<ProjectContext>;
    /**
     * Build project metadata
     */
    private buildMetadata;
    /**
     * Map all files with context
     */
    private mapFiles;
    /**
     * Build namespace hierarchy
     */
    private buildNamespaces;
    /**
     * Build class context map
     */
    private buildClasses;
    /**
     * Build method context map
     */
    private buildMethods;
    /**
     * Build dependency graph
     */
    private buildDependencyGraph;
    /**
     * Map imports with context
     */
    private mapImports;
    /**
     * Map exports with context
     */
    private mapExports;
    /**
     * Detect architectural patterns
     */
    private detectPatterns;
    /**
     * Detect coding conventions
     */
    private detectConventions;
    private findSourceFiles;
    private shouldIgnoreDirectory;
    private detectPackageManager;
    private detectFrameworks;
    private detectProjectType;
    private detectPrimaryLanguage;
    private classifyFileType;
    private calculateComplexity;
    private findFileForDependency;
    private getParentNamespace;
    private extractNamespaceFromPath;
    private extractClassDependencies;
    private resolveRelativePath;
    private detectCircular;
    private hasMVCPattern;
    private hasComponentPattern;
    /**
     * Clear cache
     */
    clearCache(): void;
}
//# sourceMappingURL=project-mapper.d.ts.map