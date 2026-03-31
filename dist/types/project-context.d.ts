/**
 * Project Context Types
 *
 * Comprehensive type definitions for project context mapping
 * that provides SWE with complete global awareness of codebase structure.
 */
/**
 * Complete project context map for SWE global awareness
 */
export interface ProjectContext {
    /** Project metadata and configuration */
    metadata: ProjectMetadata;
    /** Complete file structure with analysis */
    files: Map<string, FileContext>;
    /** Namespace hierarchy and organization */
    namespaces: Map<string, NamespaceContext>;
    /** All classes with detailed information */
    classes: Map<string, ClassContext>;
    /** All methods and functions */
    methods: Map<string, MethodContext>;
    /** Complete dependency graph */
    dependencies: DependencyGraph;
    /** Detected architectural patterns */
    patterns: ArchitecturalPattern[];
    /** Coding conventions and standards */
    conventions: CodingConvention[];
    /** Import/export relationships */
    imports: Map<string, ImportContext>;
    /** Export declarations */
    exports: Map<string, ExportContext>;
}
/**
 * Project metadata and configuration
 */
export interface ProjectMetadata {
    /** Project root path */
    rootPath: string;
    /** Detected project type */
    type: 'monolith' | 'microservices' | 'library' | 'cli' | 'other';
    /** Primary programming language */
    language: string;
    /** Package manager in use */
    packageManager: string;
    /** Frameworks detected */
    frameworks: string[];
    /** Total source files */
    totalFiles: number;
    /** Total lines of code */
    totalLines: number;
    /** Last analysis timestamp */
    analyzedAt: Date;
}
/**
 * File context with comprehensive analysis
 */
export interface FileContext {
    /** File path relative to project root */
    path: string;
    /** File language/extension */
    language: string;
    /** File type classification */
    type: 'source' | 'test' | 'config' | 'docs' | 'build' | 'other';
    /** Classes defined in this file */
    classes: string[];
    /** Functions defined in this file */
    functions: string[];
    /** Imports in this file */
    imports: string[];
    /** Exports from this file */
    exports: string[];
    /** Dependencies on other files */
    dependencies: string[];
    /** Files that depend on this file */
    dependents: string[];
    /** File size and metrics */
    metrics: FileMetrics;
}
/**
 * File metrics and statistics
 */
export interface FileMetrics {
    /** Total lines */
    lines: number;
    /** Lines of code */
    codeLines: number;
    /** Comment lines */
    commentLines: number;
    /** File size in bytes */
    size: number;
    /** Complexity score */
    complexity: number;
}
/**
 * Namespace context and hierarchy
 */
export interface NamespaceContext {
    /** Namespace name */
    name: string;
    /** Parent namespace (if nested) */
    parent?: string;
    /** Child namespaces */
    children: string[];
    /** Files in this namespace */
    files: string[];
    /** Classes in this namespace */
    classes: string[];
    /** Functions in this namespace */
    functions: string[];
    /** Namespace depth in hierarchy */
    depth: number;
}
/**
 * Class context with detailed information
 */
export interface ClassContext {
    /** Class name */
    name: string;
    /** File where class is defined */
    file: string;
    /** Namespace (if applicable) */
    namespace?: string;
    /** Class type */
    type: 'class' | 'interface' | 'enum' | 'type' | 'abstract';
    /** Inheritance (extends) */
    extends?: string;
    /** Implemented interfaces */
    implements: string[];
    /** Visibility modifier */
    visibility: 'public' | 'private' | 'protected' | 'internal';
    /** Methods in this class */
    methods: string[];
    /** Properties in this class */
    properties: string[];
    /** Classes that inherit from this */
    inheritors: string[];
    /** Classes this depends on */
    dependencies: string[];
    /** Line number of declaration */
    line: number;
}
/**
 * Method/function context
 */
export interface MethodContext {
    /** Method name */
    name: string;
    /** File where method is defined */
    file: string;
    /** Class (if method of class) */
    class?: string;
    /** Namespace (if applicable) */
    namespace?: string;
    /** Method type */
    type: 'method' | 'function' | 'constructor' | 'getter' | 'setter';
    /** Parameters */
    parameters: ParameterContext[];
    /** Return type */
    returnType?: string;
    /** Visibility modifier */
    visibility: 'public' | 'private' | 'protected' | 'internal';
    /** Static flag */
    isStatic: boolean;
    /** Async flag */
    isAsync: boolean;
    /** Methods this calls */
    calls: string[];
    /** Methods that call this */
    callers: string[];
    /** Line number of declaration */
    line: number;
}
/**
 * Parameter context
 */
export interface ParameterContext {
    /** Parameter name */
    name: string;
    /** Parameter type */
    type?: string;
    /** Optional flag */
    isOptional: boolean;
    /** Default value */
    defaultValue?: string;
    /** Rest parameter flag */
    isRest: boolean;
}
/**
 * Complete dependency graph
 */
export interface DependencyGraph {
    /** All dependencies by source file */
    bySource: Map<string, string[]>;
    /** All dependents by target file */
    byTarget: Map<string, string[]>;
    /** External package dependencies */
    external: Map<string, ExternalDependency>;
    /** Internal file dependencies */
    internal: Map<string, InternalDependency>;
    /** Circular dependencies detected */
    circular: CircularDependency[];
}
/**
 * External dependency information
 */
export interface ExternalDependency {
    /** Package name */
    name: string;
    /** Version requirement */
    version: string;
    /** Type of dependency */
    type: 'production' | 'development' | 'peer' | 'optional';
    /** Files that import this package */
    importers: string[];
}
/**
 * Internal dependency information
 */
export interface InternalDependency {
    /** Source file */
    source: string;
    /** Target file */
    target: string;
    /** Import type */
    type: 'default' | 'named' | 'wildcard';
    /** Imported names */
    names?: string[];
    /** Dependency strength (how many imports) */
    strength: number;
}
/**
 * Circular dependency detection
 */
export interface CircularDependency {
    /** Files in circular dependency */
    files: string[];
    /** Length of cycle */
    length: number;
    /** Severity level */
    severity: 'low' | 'medium' | 'high';
}
/**
 * Import context
 */
export interface ImportContext {
    /** Source file */
    file: string;
    /** Import statement */
    statement: string;
    /** Import type */
    type: 'default' | 'named' | 'wildcard' | 'side-effect';
    /** Source module/file */
    source: string;
    /** Imported names */
    names?: string[];
    /** Local alias */
    alias?: string;
    /** Line number */
    line: number;
}
/**
 * Export context
 */
export interface ExportContext {
    /** Source file */
    file: string;
    /** Export type */
    type: 'named' | 'default' | 'all' | 'type';
    /** Exported names */
    names?: string[];
    /** Source module (for re-exports) */
    source?: string;
    /** Line number */
    line: number;
}
/**
 * Architectural pattern detection
 */
export interface ArchitecturalPattern {
    /** Pattern name */
    name: string;
    /** Pattern type */
    type: 'structural' | 'creational' | 'behavioral' | 'architectural';
    /** Confidence score */
    confidence: number;
    /** Files involved in pattern */
    files: string[];
    /** Pattern description */
    description: string;
}
/**
 * Coding convention detection
 */
export interface CodingConvention {
    /** Convention name */
    name: string;
    /** Convention type */
    type: 'naming' | 'structure' | 'formatting' | 'documentation';
    /** Pattern detected */
    pattern: string;
    /** Confidence score */
    confidence: number;
    /** Files following this convention */
    files: string[];
    /** Description */
    description: string;
}
//# sourceMappingURL=project-context.d.ts.map