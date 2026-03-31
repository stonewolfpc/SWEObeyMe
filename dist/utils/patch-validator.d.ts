import { PatchValidationResult, PatchCheckContext } from '../types/patch-validation.js';
/**
 * Patch Validator Utility
 *
 * Enhanced validation pipeline that ensures SWE produces valid,
 * non-destructive, and consistent code changes.
 *
 * Features:
 * - Syntax validation with basic symbol counting + AST parsing
 * - Structural integrity checks
 * - Duplicate detection across files
 * - Namespace integrity validation
 * - Import consistency analysis
 * - Reference validation
 * - AST-powered semantic analysis
 * - Detailed issue reporting with suggestions
 */
export declare class PatchValidator {
    /**
     * Validate a proposed patch against original content
     *
     * @param originalContent - Original file content
     * @param patchedContent - Proposed patched content
     * @param context - Validation context and options
     * @returns Comprehensive validation result
     */
    validatePatch(originalContent: string, patchedContent: string, context?: Partial<PatchCheckContext>): Promise<PatchValidationResult>;
    /**
     * Basic syntax validation using symbol counting
     */
    private checkSyntax;
    /**
     * Basic structural integrity check
     */
    private checkStructural;
    /**
     * Basic duplicate detection
     */
    private checkDuplicates;
    /**
     * Basic namespace integrity check
     */
    private checkNamespace;
    /**
     * Basic import consistency check
     */
    private checkImports;
    /**
     * Basic reference validation
     */
    private checkReferences;
    /**
     * Create issues from structural result
     */
    private createIssuesFromStructuralResult;
    /**
     * Create issues from duplicate result
     */
    private createIssuesFromDuplicateResult;
    /**
     * Create issues from namespace result
     */
    private createIssuesFromNamespaceResult;
    /**
     * Create issues from import result
     */
    private createIssuesFromImportResult;
    /**
     * Create a validation issue
     */
    private createIssue;
    /**
     * Group issues by severity
     */
    private groupIssuesBySeverity;
    /**
     * Calculate validation score (enhanced to account for AST validation)
     */
    private calculateEnhancedScore;
    /**
     * Calculate validation score (legacy method for backward compatibility)
     */
    private calculateScore;
    /**
     * Generate validation summary
     */
    private generateSummary;
    /**
     * Generate recommendations
     */
    private generateRecommendations;
    /**
     * Generate unique ID
     */
    private generateId;
}
//# sourceMappingURL=patch-validator.d.ts.map