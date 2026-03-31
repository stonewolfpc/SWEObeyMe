/**
 * Patch Validation Types
 *
 * Comprehensive type definitions for patch validation pipeline that ensures
 * SWE produces valid, non-destructive, and consistent code changes.
 */
/**
 * Complete patch validation result
 */
export interface PatchValidationResult {
    /** Overall validation status */
    valid: boolean;
    /** Validation score (0-100) */
    score: number;
    /** Total issues found */
    totalIssues: number;
    /** Issues by severity level */
    issuesBySeverity: Record<PatchSeverity, number>;
    /** All validation issues found */
    issues: PatchIssue[];
    /** Validation duration in milliseconds */
    duration: number;
    /** Summary message */
    summary: string;
    /** Recommendations for fixes */
    recommendations: string[];
    /** Patch approval status */
    approved: boolean;
}
/**
 * Individual validation issue found in patch
 */
export interface PatchIssue {
    /** Issue identifier */
    id: string;
    /** Issue severity level */
    severity: PatchSeverity;
    /** Issue category */
    category: 'syntax' | 'structure' | 'duplicate' | 'namespace' | 'import' | 'reference' | 'consistency';
    /** Issue title */
    title: string;
    /** Detailed description */
    description: string;
    /** Location in file */
    location: {
        file?: string;
        line?: number;
        column?: number;
        position?: number;
    };
    /** Suggested fix */
    suggestion?: string;
    /** Code snippet showing the issue */
    codeSnippet?: string;
    /** Whether issue is fixable */
    fixable: boolean;
}
/**
 * Patch severity levels
 */
export type PatchSeverity = 'error' | 'warning' | 'info';
/**
 * Context for patch validation checks
 */
export interface PatchCheckContext {
    /** Original file content */
    originalContent: string;
    /** Proposed patched content */
    patchedContent: string;
    /** File path being validated */
    filePath?: string;
    /** File language/type */
    language?: string;
    /** Validation options */
    options: {
        /** Allow namespace changes */
        allowNamespaceChanges?: boolean;
        /** Allow structural changes */
        allowStructuralChanges?: boolean;
        /** Allow new imports */
        allowNewImports?: boolean;
        /** Strict validation mode */
        strict?: boolean;
    };
}
/**
 * Result of structural integrity check
 */
export interface StructuralCheckResult {
    /** Whether structure is intact */
    valid: boolean;
    /** Issues found */
    issues: string[];
    /** Mid-block insertions detected */
    midBlockInsertions: string[];
    /** Partial edits detected */
    partialEdits: string[];
    /** Incomplete blocks detected */
    incompleteBlocks: string[];
    /** Broken indentation patterns */
    brokenIndentation: string[];
}
/**
 * Result of duplicate detection check
 */
export interface DuplicateCheckResult {
    /** Whether duplicates were found */
    hasDuplicates: boolean;
    /** Duplicate classes found */
    duplicateClasses: Array<{
        name: string;
        locations: Array<{
            file: string;
            line: number;
        }>;
    }>;
    /** Duplicate methods found */
    duplicateMethods: Array<{
        name: string;
        signature: string;
        locations: Array<{
            file: string;
            line: number;
        }>;
    }>;
    /** Duplicate imports found */
    duplicateImports: Array<{
        source: string;
        locations: Array<{
            file: string;
            line: number;
        }>;
    }>;
    /** Total duplicate count */
    totalDuplicates: number;
}
/**
 * Result of namespace integrity check
 */
export interface NamespaceCheckResult {
    /** Whether namespace integrity is maintained */
    valid: boolean;
    /** Namespace changes detected */
    namespaceChanges: Array<{
        from: string;
        to: string;
        location: {
            file: string;
            line: number;
        };
    }>;
    /** File-level identifier changes */
    identifierChanges: Array<{
        from: string;
        to: string;
        location: {
            file: string;
            line: number;
        };
    }>;
    /** Issues found */
    issues: string[];
}
/**
 * Result of import consistency check
 */
export interface ImportCheckResult {
    /** Whether imports are consistent */
    valid: boolean;
    /** Unused imports detected */
    unusedImports: Array<{
        name: string;
        location: {
            file: string;
            line: number;
        };
    }>;
    /** Missing imports detected */
    missingImports: Array<{
        name: string;
        location: {
            file: string;
            line: number;
        };
        suggested: string;
    }>;
    /** Invalid imports detected */
    invalidImports: Array<{
        import: string;
        error: string;
        location: {
            file: string;
            line: number;
        };
    }>;
    /** Circular dependencies detected */
    circularDependencies: Array<{
        path: string[];
        severity: 'low' | 'medium' | 'high';
    }>;
    /** Issues found */
    issues: string[];
}
//# sourceMappingURL=patch-validation.d.ts.map