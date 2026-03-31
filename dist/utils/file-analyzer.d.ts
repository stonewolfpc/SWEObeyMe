/**
 * File Analysis Result Interface
 *
 * Defines the structure for file analysis output, providing
 * comprehensive metadata about source code files.
 */
export interface FileAnalysisResult {
    /** Full path to the analyzed file */
    filePath: string;
    /** File extension and detected language */
    language: string;
    /** Namespace/module declaration (if applicable) */
    namespace?: string;
    /** All import statements and dependencies */
    imports: ImportStatement[];
    /** Class declarations with metadata */
    classes: ClassDeclaration[];
    /** Function/method declarations */
    functions: FunctionDeclaration[];
    /** Export declarations */
    exports: ExportDeclaration[];
    /** File metadata and statistics */
    metadata: FileMetadata;
}
/**
 * Import statement representation
 */
export interface ImportStatement {
    /** Raw import statement text */
    raw: string;
    /** Import type (default, named, wildcard, etc.) */
    type: 'default' | 'named' | 'wildcard' | 'side-effect';
    /** Source module/package */
    source: string;
    /** Imported names (for named imports) */
    names?: string[];
    /** Local alias (if any) */
    alias?: string;
    /** Line number in source file */
    line: number;
}
/**
 * Class declaration representation
 */
export interface ClassDeclaration {
    /** Class name */
    name: string;
    /** Inheritance (extends/implements) */
    extends?: string;
    /** Implemented interfaces */
    implements?: string[];
    /** Class type (class, interface, enum, etc.) */
    type: 'class' | 'interface' | 'enum' | 'type';
    /** Visibility modifier */
    visibility: 'public' | 'private' | 'protected' | 'internal';
    /** Method declarations */
    methods: MethodDeclaration[];
    /** Property declarations */
    properties: PropertyDeclaration[];
    /** Line number of class declaration */
    line: number;
}
/**
 * Method/function declaration representation
 */
export interface MethodDeclaration {
    /** Method name */
    name: string;
    /** Parameter list */
    parameters: ParameterDeclaration[];
    /** Return type */
    returnType?: string;
    /** Method visibility */
    visibility: 'public' | 'private' | 'protected' | 'internal';
    /** Static flag */
    isStatic: boolean;
    /** Async flag */
    isAsync: boolean;
    /** Method signature */
    signature: string;
    /** Line number */
    line: number;
}
/**
 * Function declaration (standalone)
 */
export interface FunctionDeclaration {
    /** Function name */
    name: string;
    /** Parameter list */
    parameters: ParameterDeclaration[];
    /** Return type */
    returnType?: string;
    /** Export status */
    isExported: boolean;
    /** Default export flag */
    isDefault: boolean;
    /** Async flag */
    isAsync: boolean;
    /** Function signature */
    signature: string;
    /** Line number */
    line: number;
}
/**
 * Parameter declaration
 */
export interface ParameterDeclaration {
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
 * Property declaration
 */
export interface PropertyDeclaration {
    /** Property name */
    name: string;
    /** Property type */
    type?: string;
    /** Property visibility */
    visibility: 'public' | 'private' | 'protected' | 'internal';
    /** Static flag */
    isStatic: boolean;
    /** Readonly flag */
    isReadonly: boolean;
    /** Optional flag */
    isOptional: boolean;
    /** Default value */
    defaultValue?: string;
    /** Line number */
    line: number;
}
/**
 * Export declaration
 */
export interface ExportDeclaration {
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
 * File metadata
 */
export interface FileMetadata {
    /** Total lines of code */
    lines: number;
    /** Lines of actual code (excluding comments/blank) */
    codeLines: number;
    /** Comment lines */
    commentLines: number;
    /** Blank lines */
    blankLines: number;
    /** File size in bytes */
    size: number;
    /** Last modified timestamp */
    lastModified: Date;
    /** Character encoding */
    encoding: string;
}
/**
 * File Analyzer Utility
 *
 * Provides comprehensive source code analysis capabilities for
 * multiple programming languages with extensible parsing support.
 *
 * Features:
 * - Multi-language support (TypeScript, JavaScript, Python, Java, etc.)
 * - AST-based parsing for accuracy
 * - Dependency extraction and mapping
 * - Structure analysis for classes, functions, and modules
 * - Metadata collection for metrics and analytics
 */
export declare class FileAnalyzer {
    private readonly languagePatterns;
    /**
     * Analyze a source file and extract comprehensive metadata
     *
     * @param filePath - Path to the file to analyze
     * @param content - Optional file content (will be read if not provided)
     * @returns Comprehensive file analysis result
     */
    analyzeFile(filePath: string, content?: string): Promise<FileAnalysisResult>;
    /**
     * Detect programming language from file extension
     */
    private detectLanguage;
    /**
     * Extract import statements from source code
     */
    private extractImports;
    /**
     * Determine import type from import statement
     */
    private determineImportType;
    /**
     * Extract imported names from import statement
     */
    private extractImportNames;
    /**
     * Extract import alias from import statement
     */
    private extractImportAlias;
    /**
     * Extract class declarations from source code
     */
    private extractClasses;
    /**
     * Extract function declarations from source code
     */
    private extractFunctions;
    /**
     * Extract export declarations
     */
    private extractExports;
    /**
     * Extract namespace/module declaration
     */
    private extractNamespace;
    /**
     * Extract methods from class content
     */
    private extractMethods;
    /**
     * Extract properties from class content
     */
    private extractProperties;
    /**
     * Parse parameter string into parameter declarations
     */
    private parseParameters;
    /**
     * Determine visibility from declaration
     */
    private determineVisibility;
    /**
     * Calculate file metadata
     */
    private calculateMetadata;
}
//# sourceMappingURL=file-analyzer.d.ts.map