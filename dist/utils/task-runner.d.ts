import { TestResult, DebugAnalysis, PerformanceAnalysis, SecurityAnalysis, DeploymentResult } from '../types/index.js';
/**
 * Task Runner Utility
 *
 * Executes various automation tasks including testing, debugging,
 * performance optimization, security scanning, and deployment.
 */
export declare class TaskRunner {
    private runningProcesses;
    /**
     * Run automated tests
     */
    runTests(options: {
        target: string;
        testType?: 'unit' | 'integration' | 'e2e' | 'performance';
        framework?: string;
        coverage?: boolean;
    }): Promise<TestResult>;
    /**
     * Manage dependencies
     */
    manageDependencies(options: {
        action: 'analyze' | 'update' | 'audit' | 'cleanup';
        packageManager?: string;
        options?: any;
    }): Promise<any>;
    /**
     * Assist with debugging
     */
    assistDebugging(options: {
        error: string;
        context?: string;
        logs?: string[];
        code?: string;
    }): Promise<DebugAnalysis>;
    /**
     * Optimize performance
     */
    optimizePerformance(options: {
        target: string;
        analysisType?: 'cpu' | 'memory' | 'io' | 'network';
        benchmark?: boolean;
    }): Promise<PerformanceAnalysis>;
    /**
     * Generate documentation
     */
    generateDocumentation(options: {
        target: string;
        docType: 'api' | 'readme' | 'inline' | 'architecture' | 'user_guide';
        format?: 'markdown' | 'html' | 'pdf' | 'docx';
    }): Promise<any>;
    /**
     * Scan for security issues
     */
    scanSecurity(options: {
        target: string;
        scanType?: 'sast' | 'dast' | 'dependency' | 'secrets' | 'all';
        severity?: 'low' | 'medium' | 'high' | 'critical';
    }): Promise<SecurityAnalysis>;
    /**
     * Automate deployment
     */
    automateDeployment(options: {
        action: 'setup' | 'deploy' | 'rollback' | 'status';
        environment: string;
        config?: any;
    }): Promise<DeploymentResult>;
    /**
     * Detect test framework
     */
    private detectTestFramework;
    /**
     * Build test command
     */
    private buildTestCommand;
    /**
     * Parse test output
     */
    private parseTestOutput;
    /**
     * Detect package manager
     */
    private detectPackageManager;
    /**
     * Build dependency command
     */
    private buildDependencyCommand;
    /**
     * Parse dependency output
     */
    private parseDependencyOutput;
    /**
     * Classify error type
     */
    private classifyError;
    /**
     * Extract stack trace
     */
    private extractStackTrace;
    /**
     * Identify root cause
     */
    private identifyRootCause;
    /**
     * Generate fixes
     */
    private generateFixes;
    /**
     * Generate prevention measures
     */
    private generatePrevention;
    /**
     * Get recent changes
     */
    private getRecentChanges;
    /**
     * Identify performance bottlenecks
     */
    private identifyBottlenecks;
    /**
     * Collect performance metrics
     */
    private collectPerformanceMetrics;
    /**
     * Generate optimizations
     */
    private generateOptimizations;
    /**
     * Run benchmarks
     */
    private runBenchmarks;
    /**
     * Generate documentation content
     */
    private generateDocContent;
    /**
     * Get documentation output path
     */
    private getDocOutputPath;
    /**
     * Find vulnerabilities
     */
    private findVulnerabilities;
    /**
     * Generate security recommendations
     */
    private generateSecurityRecommendations;
    /**
     * Check compliance
     */
    private checkCompliance;
    /**
     * Setup deployment pipeline
     */
    private setupDeployment;
    /**
     * Execute deployment
     */
    private executeDeployment;
    /**
     * Rollback deployment
     */
    private rollbackDeployment;
    /**
     * Get deployment status
     */
    private getDeploymentStatus;
    /**
     * Cleanup resources
     */
    cleanup(): Promise<void>;
}
//# sourceMappingURL=task-runner.d.ts.map