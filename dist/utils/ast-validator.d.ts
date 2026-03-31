import * as ts from 'typescript';
import { PatchIssue } from '../types/patch-validation.js';
/**
 * AST Validator
 *
 * Uses the TypeScript Compiler API for advanced validation including:
 * - Real syntax parsing
 * - Semantic analysis
 * - Symbol resolution
 * - Import resolution
 * - Duplicate detection
 * - Namespace integrity
 * - Reference validation
 *
 * This module provides production-grade validation accuracy.
 */
export declare class AstValidator {
    /**
     * Validate syntax using TypeScript compiler
     *
     * @param code - Source code to validate
     * @returns Array of syntax issues
     */
    validateSyntax(code: string): PatchIssue[];
    /**
     * Validate imports for unused, missing, and invalid imports
     *
     * @param sourceFile - Parsed AST
     * @returns Array of import-related issues
     */
    validateImports(sourceFile: ts.SourceFile): PatchIssue[];
    /**
     * Validate references - check for undefined identifiers
     *
     * @param sourceFile - Parsed AST
     * @returns Array of reference-related issues
     */
    validateReferences(sourceFile: ts.SourceFile): PatchIssue[];
    /**
     * Validate duplicate declarations
     *
     * @param sourceFile - Parsed AST
     * @returns Array of duplicate-related issues
     */
    validateDuplicates(sourceFile: ts.SourceFile): PatchIssue[];
    /**
     * Validate namespace integrity between original and patched files
     *
     * @param originalContent - Original file content
     * @param patchedContent - Patched file content
     * @returns Array of namespace-related issues
     */
    validateNamespaceIntegrity(originalContent: string, patchedContent: string): PatchIssue[];
    /**
     * Run all AST validation checks
     *
     * @param originalContent - Original file content
     * @param patchedContent - Patched file content
     * @returns Complete validation result
     */
    runAll(originalContent: string, patchedContent: string): {
        issues: PatchIssue[];
        valid: boolean;
        syntaxErrors: number;
        semanticErrors: number;
        warnings: number;
    };
    /**
     * Generate unique ID for issues
     */
    private generateId;
    /**
     * Get suggestion for syntax errors
     */
    private getSyntaxSuggestion;
    /**
     * Check if identifier is a built-in global
     */
    private isBuiltinGlobal;
    /**
     * Find the position of an identifier in the source file
     */
    private findIdentifierPosition;
    /**
     * Detect circular imports (basic detection)
     */
    private detectCircularImports;
}
//# sourceMappingURL=ast-validator.d.ts.map