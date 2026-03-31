import * as ts from 'typescript';
/**
 * AST Utility Functions
 *
 * Provides TypeScript Compiler API utilities for AST analysis,
 * declaration extraction, and structural validation.
 *
 * This module uses ONLY the TypeScript compiler API - no regex allowed.
 */
export declare class AstUtils {
    /**
     * Create a TypeScript SourceFile from code string
     *
     * @param code - Source code to parse
     * @param fileName - Optional filename for error reporting
     * @returns Parsed AST SourceFile
     */
    static createSourceFile(code: string, fileName?: string): ts.SourceFile;
    /**
     * Extract top-level declarations from a SourceFile
     *
     * @param sourceFile - Parsed AST
     * @returns Object containing classes, interfaces, functions, and variables
     */
    static getTopLevelDeclarations(sourceFile: ts.SourceFile): {
        classes: Array<{
            name: string;
            node: ts.ClassDeclaration;
            line: number;
            column: number;
        }>;
        interfaces: Array<{
            name: string;
            node: ts.InterfaceDeclaration;
            line: number;
            column: number;
        }>;
        functions: Array<{
            name: string;
            node: ts.FunctionDeclaration;
            line: number;
            column: number;
        }>;
        variables: Array<{
            name: string;
            node: ts.VariableStatement;
            line: number;
            column: number;
        }>;
    };
    /**
     * Extract import declarations from a SourceFile
     *
     * @param sourceFile - Parsed AST
     * @returns Array of import information
     */
    static getImports(sourceFile: ts.SourceFile): Array<{
        kind: 'import' | 'require';
        identifiers: string[];
        moduleSpecifier: string;
        node: ts.ImportDeclaration | ts.VariableStatement;
        line: number;
        column: number;
    }>;
    /**
     * Get all used identifiers in the source file
     *
     * @param sourceFile - Parsed AST
     * @returns Set of used identifier names
     */
    static getUsedIdentifiers(sourceFile: ts.SourceFile): Set<string>;
    /**
     * Get all defined identifiers in the source file
     *
     * @param sourceFile - Parsed AST
     * @returns Set of defined identifier names
     */
    static getDefinedIdentifiers(sourceFile: ts.SourceFile): Set<string>;
    /**
     * Find duplicate declarations in the source file
     *
     * @param sourceFile - Parsed AST
     * @returns Object containing duplicate information
     */
    static findDuplicateDeclarations(sourceFile: ts.SourceFile): {
        duplicateClasses: Array<{
            name: string;
            locations: Array<{
                line: number;
                column: number;
            }>;
        }>;
        duplicateInterfaces: Array<{
            name: string;
            locations: Array<{
                line: number;
                column: number;
            }>;
        }>;
        duplicateFunctions: Array<{
            name: string;
            locations: Array<{
                line: number;
                column: number;
            }>;
        }>;
        duplicateMethods: Array<{
            name: string;
            className?: string;
            locations: Array<{
                line: number;
                column: number;
                classLine?: number;
            }>;
        }>;
        duplicateVariables: Array<{
            name: string;
            locations: Array<{
                line: number;
                column: number;
            }>;
        }>;
    };
    /**
     * Check if an identifier is a declaration name
     */
    private static isDeclarationName;
    /**
     * Extract identifiers from import declaration
     */
    private static extractImportIdentifiers;
    /**
     * Check if variable statement is a require statement
     */
    private static isRequireStatement;
    /**
     * Extract identifiers from require statement
     */
    private static extractRequireIdentifiers;
    /**
     * Extract module specifier from require statement
     */
    private static extractRequireModuleSpecifier;
    /**
     * Get name from variable statement
     */
    private static getVariableStatementName;
}
//# sourceMappingURL=ast-utils.d.ts.map