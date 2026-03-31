/**
 * Type definitions for SWE Automation MCP Server
 */
export * from './project-context.js';
export * from './context-memory.js';
export * from './patch-validation.js';
export * from './agent-types.js';
export * from './prediction-types.js';
export * from './refactor-types.js';
export interface FileManagerOptions {
    backupDir?: string;
}
export interface FileOperationResult {
    success: boolean;
    path: string;
    originalPath?: string;
    operation: 'create' | 'update' | 'delete' | 'move' | 'copy';
    size: number;
    originalSize?: number;
    timestamp: Date;
    backup?: string;
}
export interface ProjectAnalysisResult {
    structure: ProjectStructure;
    dependencies: DependencyAnalysis;
    architecture: ArchitectureAnalysis;
    metrics: ProjectMetrics;
    recommendations: string[];
}
export interface ProjectStructure {
    type: 'monolith' | 'microservices' | 'library' | 'cli' | 'other';
    pattern: string;
    directories: string[];
    files: string[];
    depth: number;
}
export interface DependencyAnalysis {
    packageManager: string;
    dependencies: Dependency[];
    vulnerabilities: Vulnerability[];
    outdated: OutdatedDependency[];
}
export interface Dependency {
    name: string;
    version: string;
    type: 'production' | 'development' | 'peer';
    optional: boolean;
}
export interface Vulnerability {
    package: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    patchedIn?: string;
}
export interface OutdatedDependency {
    package: string;
    current: string;
    latest: string;
    type: 'major' | 'minor' | 'patch';
}
export interface ArchitectureAnalysis {
    patterns: string[];
    layers: string[];
    components: Component[];
    dataFlow: DataFlow[];
}
export interface Component {
    name: string;
    type: string;
    responsibility: string;
    dependencies: string[];
}
export interface DataFlow {
    from: string;
    to: string;
    type: 'sync' | 'async';
    protocol?: string;
}
export interface ProjectMetrics {
    linesOfCode: number;
    complexity: number;
    testCoverage: number;
    maintainability: number;
    duplicates: number;
    technicalDebt: number;
}
export interface TestResult {
    success: boolean;
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    coverage?: CoverageReport;
    duration: number;
    tests: Test[];
}
export interface CoverageReport {
    lines: number;
    functions: number;
    branches: number;
    statements: number;
}
export interface Test {
    name: string;
    suite: string;
    status: 'passed' | 'failed' | 'skipped';
    duration: number;
    error?: string;
}
export interface QualityAnalysis {
    overall: number;
    metrics: QualityMetric[];
    smells: CodeSmell[];
    suggestions: Suggestion[];
}
export interface QualityMetric {
    name: string;
    value: number;
    threshold: number;
    status: 'good' | 'warning' | 'critical';
}
export interface CodeSmell {
    type: string;
    severity: 'low' | 'medium' | 'high';
    location: string;
    description: string;
    suggestion: string;
}
export interface Suggestion {
    priority: 'low' | 'medium' | 'high';
    category: string;
    description: string;
    effort: 'small' | 'medium' | 'large';
    impact: string;
}
export interface DebugAnalysis {
    rootCause: string;
    likelihood: number;
    fixes: Fix[];
    prevention: string[];
    context: DebugContext;
}
export interface Fix {
    description: string;
    confidence: number;
    code?: string;
    effort: 'small' | 'medium' | 'large';
}
export interface DebugContext {
    errorType: string;
    stackTrace: string;
    recentChanges: string[];
    environment: string;
}
export interface PerformanceAnalysis {
    bottlenecks: Bottleneck[];
    metrics: PerformanceMetric[];
    optimizations: Optimization[];
    benchmarks: Benchmark[];
}
export interface Bottleneck {
    location: string;
    type: 'cpu' | 'memory' | 'io' | 'network';
    impact: number;
    description: string;
}
export interface PerformanceMetric {
    name: string;
    value: number;
    unit: string;
    baseline?: number;
    improvement?: number;
}
export interface Optimization {
    description: string;
    expectedGain: number;
    effort: 'small' | 'medium' | 'large';
    risk: 'low' | 'medium' | 'high';
}
export interface Benchmark {
    name: string;
    before: number;
    after: number;
    improvement: number;
    unit: string;
}
export interface SecurityAnalysis {
    overall: 'secure' | 'moderate' | 'vulnerable';
    vulnerabilities: SecurityVulnerability[];
    recommendations: SecurityRecommendation[];
    compliance: ComplianceReport;
}
export interface SecurityVulnerability {
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    location: string;
    description: string;
    cve?: string;
    fix: string;
}
export interface SecurityRecommendation {
    priority: 'low' | 'medium' | 'high' | 'critical';
    category: string;
    description: string;
    implementation: string;
}
export interface ComplianceReport {
    standards: string[];
    compliant: string[];
    nonCompliant: string[];
    gaps: string[];
}
export interface DeploymentResult {
    success: boolean;
    environment: string;
    version: string;
    url?: string;
    healthCheck?: HealthCheck;
    rollbackAvailable: boolean;
    duration: number;
}
export interface HealthCheck {
    status: 'healthy' | 'unhealthy' | 'degraded';
    checks: HealthCheckItem[];
}
export interface HealthCheckItem {
    name: string;
    status: 'pass' | 'fail' | 'warn';
    message?: string;
    responseTime?: number;
}
export interface ToolExecutionResult {
    success: boolean;
    data: any;
    error?: string;
    metadata?: {
        duration: number;
        tool: string;
        timestamp: Date;
    };
}
//# sourceMappingURL=index.d.ts.map