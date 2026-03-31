import { AstValidator } from './ast-validator.js';
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
export class PatchValidator {
    /**
     * Validate a proposed patch against original content
     *
     * @param originalContent - Original file content
     * @param patchedContent - Proposed patched content
     * @param context - Validation context and options
     * @returns Comprehensive validation result
     */
    async validatePatch(originalContent, patchedContent, context) {
        const startTime = Date.now();
        // Merge with default context
        const fullContext = {
            originalContent,
            patchedContent,
            options: {
                allowNamespaceChanges: false,
                allowStructuralChanges: false,
                allowNewImports: false,
                strict: true,
                ...context?.options
            },
            ...context,
        };
        const issues = [];
        let score = 100;
        try {
            // 1. Basic Syntax Validation (existing heuristic check)
            const syntaxIssues = await this.checkSyntax(fullContext);
            issues.push(...syntaxIssues);
            // 2. AST-Powered Validation (new enhanced layer)
            const astValidator = new AstValidator();
            const astResult = await astValidator.runAll(fullContext.originalContent, fullContext.patchedContent);
            // Convert AST issues to PatchIssue format and merge
            for (const astIssue of astResult.issues) {
                issues.push(astIssue);
            }
            // 3. Structural Integrity (existing heuristic check)
            const structuralResult = await this.checkStructural(fullContext);
            if (!structuralResult.valid) {
                issues.push(...this.createIssuesFromStructuralResult(structuralResult));
            }
            // 4. Duplicate Detection (existing heuristic check)
            const duplicateResult = await this.checkDuplicates(fullContext);
            if (duplicateResult.hasDuplicates) {
                issues.push(...this.createIssuesFromDuplicateResult(duplicateResult));
            }
            // 5. Namespace Integrity (existing heuristic check)
            const namespaceResult = await this.checkNamespace(fullContext);
            if (!namespaceResult.valid) {
                issues.push(...this.createIssuesFromNamespaceResult(namespaceResult));
            }
            // 6. Import Consistency (existing heuristic check)
            const importResult = await this.checkImports(fullContext);
            if (!importResult.valid) {
                issues.push(...this.createIssuesFromImportResult(importResult));
            }
            // 7. Reference Validation (existing heuristic check)
            const referenceIssues = await this.checkReferences(fullContext);
            issues.push(...referenceIssues);
            // Calculate final score (enhanced to account for AST validation)
            score = this.calculateEnhancedScore(issues, astResult);
        }
        catch (error) {
            issues.push({
                id: this.generateId(),
                severity: 'error',
                category: 'syntax',
                title: 'Validation Error',
                description: `Validation failed: ${error.message}`,
                location: { file: fullContext.filePath },
                suggestion: 'Fix the validation errors and retry',
                fixable: false,
            });
            score = 0;
        }
        const endTime = Date.now();
        // Create validation result
        const result = {
            valid: issues.filter(i => i.severity === 'error').length === 0,
            score,
            totalIssues: issues.length,
            issuesBySeverity: this.groupIssuesBySeverity(issues),
            issues,
            duration: endTime - startTime,
            summary: this.generateSummary(issues),
            recommendations: this.generateRecommendations(issues),
            approved: issues.filter(i => i.severity === 'error').length === 0,
        };
        return result;
    }
    /**
     * Basic syntax validation using symbol counting
     */
    async checkSyntax(context) {
        const issues = [];
        const lines = context.patchedContent.split('\n');
        // Count symbols
        let braceCount = 0;
        let parenCount = 0;
        let bracketCount = 0;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            for (let j = 0; j < line.length; j++) {
                const char = line[j];
                switch (char) {
                    case '{':
                        braceCount++;
                        break;
                    case '}':
                        braceCount--;
                        if (braceCount < 0) {
                            issues.push(this.createIssue('error', 'syntax', 'Unmatched closing brace', `Unmatched closing brace at line ${i + 1}`, { file: context.filePath, line: i + 1 }, 'Remove or add the matching opening brace', true));
                            braceCount = 0;
                        }
                        break;
                    case '(':
                        parenCount++;
                        break;
                    case ')':
                        parenCount--;
                        if (parenCount < 0) {
                            issues.push(this.createIssue('error', 'syntax', 'Unmatched closing parenthesis', `Unmatched closing parenthesis at line ${i + 1}`, { file: context.filePath, line: i + 1 }, 'Remove or add the matching opening parenthesis', true));
                            parenCount = 0;
                        }
                        break;
                    case '[':
                        bracketCount++;
                        break;
                    case ']':
                        bracketCount--;
                        if (bracketCount < 0) {
                            issues.push(this.createIssue('error', 'syntax', 'Unmatched closing bracket', `Unmatched closing bracket at line ${i + 1}`, { file: context.filePath, line: i + 1 }, 'Remove or add the matching opening bracket', true));
                            bracketCount = 0;
                        }
                        break;
                }
            }
        }
        // Check for unclosed symbols
        if (braceCount > 0) {
            issues.push(this.createIssue('error', 'syntax', 'Unclosed brace block', `${braceCount} unclosed brace(s) detected`, { file: context.filePath }, 'Add the missing closing brace(s)', true));
        }
        if (parenCount > 0) {
            issues.push(this.createIssue('error', 'syntax', 'Unclosed parenthesis', `${parenCount} unclosed parenthesis detected`, { file: context.filePath }, 'Add the missing closing parenthesis', true));
        }
        if (bracketCount > 0) {
            issues.push(this.createIssue('error', 'syntax', 'Unclosed bracket', `${bracketCount} unclosed bracket(s) detected`, { file: context.filePath }, 'Add the missing closing bracket(s)', true));
        }
        return issues;
    }
    /**
     * Basic structural integrity check
     */
    async checkStructural(context) {
        const issues = [];
        const midBlockInsertions = [];
        const partialEdits = [];
        const incompleteBlocks = [];
        const brokenIndentation = [];
        const originalLines = context.originalContent.split('\n');
        const patchedLines = context.patchedContent.split('\n');
        // Check for incomplete statements
        for (let i = 0; i < patchedLines.length; i++) {
            const line = patchedLines[i].trim();
            // Check for incomplete if/for/while statements
            if (line.startsWith('if ') && !line.includes('{')) {
                partialEdits.push(`Line ${i + 1}: Incomplete if statement`);
            }
            if (line.startsWith('for ') && !line.includes('{')) {
                partialEdits.push(`Line ${i + 1}: Incomplete for statement`);
            }
            if (line.startsWith('while ') && !line.includes('{')) {
                partialEdits.push(`Line ${i + 1}: Incomplete while statement`);
            }
            // Check for incomplete arrow functions
            if (line.includes('=>') && !line.includes('{') && !line.includes(';')) {
                partialEdits.push(`Line ${i + 1}: Incomplete arrow function`);
            }
        }
        // Check for indentation issues
        for (let i = 1; i < patchedLines.length; i++) {
            const prevIndent = patchedLines[i - 1].match(/^\s*/);
            const currentIndent = patchedLines[i].match(/^\s*/);
            if (prevIndent && currentIndent) {
                const prevLevel = prevIndent[0].length;
                const currentLevel = currentIndent[0].length;
                // Check for inconsistent indentation
                if (Math.abs(prevLevel - currentLevel) > 4) {
                    brokenIndentation.push(`Line ${i + 1}: Inconsistent indentation (${prevLevel} -> ${currentLevel})`);
                }
            }
        }
        const valid = issues.length === 0 &&
            midBlockInsertions.length === 0 &&
            partialEdits.length === 0 &&
            incompleteBlocks.length === 0 &&
            brokenIndentation.length === 0;
        return {
            valid,
            issues,
            midBlockInsertions,
            partialEdits,
            incompleteBlocks,
            brokenIndentation,
        };
    }
    /**
     * Basic duplicate detection
     */
    async checkDuplicates(context) {
        const duplicateClasses = [];
        const duplicateMethods = [];
        const duplicateImports = [];
        const lines = context.patchedContent.split('\n');
        const classes = new Map();
        const methods = new Map();
        const imports = new Map();
        // Extract classes
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // Match class/interface declarations
            const classMatch = line.match(/^\s*(export\s+)?(class|interface)\s+(\w+)/);
            if (classMatch) {
                const className = classMatch[3];
                if (!classes.has(className)) {
                    classes.set(className, []);
                }
                classes.get(className).push({ file: context.filePath || 'unknown', line: i + 1 });
            }
            // Match method declarations (simplified)
            const methodMatch = line.match(/^\s*(?:\w+\.\s+)?(\w+)\s*\([^)]*\s*[:=]/);
            if (methodMatch) {
                const methodName = methodMatch[1];
                const signature = line.trim();
                if (!methods.has(methodName)) {
                    methods.set(methodName, []);
                }
                methods.get(methodName).push({ file: context.filePath || 'unknown', line: i + 1, signature });
            }
            // Match import statements
            const importMatch = line.match(/^\s*import\s+(.+?)\s+from\s+[\'"](.+?)[\'"]/);
            if (importMatch) {
                const source = importMatch[1];
                if (!imports.has(source)) {
                    imports.set(source, []);
                }
                imports.get(source).push({ file: context.filePath || 'unknown', line: i + 1 });
            }
        }
        // Find duplicates
        classes.forEach((locations, name) => {
            if (locations.length > 1) {
                duplicateClasses.push({ name, locations });
            }
        });
        methods.forEach((locations, name) => {
            if (locations.length > 1) {
                duplicateMethods.push({ name, signature: locations[0].signature, locations });
            }
        });
        imports.forEach((locations, source) => {
            if (locations.length > 1) {
                duplicateImports.push({ source, locations });
            }
        });
        const totalDuplicates = duplicateClasses.length + duplicateMethods.length + duplicateImports.length;
        const hasDuplicates = totalDuplicates > 0;
        return {
            hasDuplicates,
            duplicateClasses,
            duplicateMethods,
            duplicateImports,
            totalDuplicates,
        };
    }
    /**
     * Basic namespace integrity check
     */
    async checkNamespace(context) {
        const issues = [];
        const namespaceChanges = [];
        const identifierChanges = [];
        const originalLines = context.originalContent.split('\n');
        const patchedLines = context.patchedContent.split('\n');
        // Extract namespace declarations (simplified)
        const originalNamespaces = new Set();
        const patchedNamespaces = new Set();
        for (const line of originalLines) {
            const namespaceMatch = line.match(/^\s*namespace\s+(\w+)/);
            if (namespaceMatch) {
                originalNamespaces.add(namespaceMatch[1]);
            }
        }
        for (let i = 0; i < patchedLines.length; i++) {
            const line = patchedLines[i];
            const namespaceMatch = line.match(/^\s*namespace\s+(\w+)/);
            if (namespaceMatch) {
                const ns = namespaceMatch[1];
                patchedNamespaces.add(ns);
                if (!originalNamespaces.has(ns)) {
                    namespaceChanges.push({
                        from: '(added)',
                        to: ns,
                        location: { file: context.filePath || 'unknown', line: i + 1 },
                    });
                }
            }
        }
        // Check for removed namespaces
        for (const ns of originalNamespaces) {
            if (!patchedNamespaces.has(ns)) {
                namespaceChanges.push({
                    from: ns,
                    to: '(removed)',
                    location: { file: context.filePath || 'unknown', line: 1 },
                });
            }
        }
        // Generate issues
        if (!context.options.allowNamespaceChanges && namespaceChanges.length > 0) {
            issues.push(`${namespaceChanges.length} namespace changes detected`);
        }
        const valid = context.options.allowNamespaceChanges || namespaceChanges.length === 0;
        return {
            valid,
            namespaceChanges,
            identifierChanges,
            issues,
        };
    }
    /**
     * Basic import consistency check
     */
    async checkImports(context) {
        const issues = [];
        const unusedImports = [];
        const missingImports = [];
        const invalidImports = [];
        const circularDependencies = [];
        const lines = context.patchedContent.split('\n');
        const imports = new Map();
        const usedIdentifiers = new Set();
        // Extract imports and check usage
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // Match import statements
            const importMatch = line.match(/^\s*import\s+(.+?)\s+from\s+[\'"](.+?)[\'"]/);
            if (importMatch) {
                const importName = importMatch[1];
                imports.set(importName, { name: importName, location: { file: context.filePath || 'unknown', line: i + 1 }, suggested: '' });
            }
            // Extract used identifiers (simplified)
            const identifiers = line.match(/\b[a-zA-Z_]\w*\b/g);
            if (identifiers) {
                identifiers.forEach(id => usedIdentifiers.add(id));
            }
        }
        // Check for unused imports
        for (const [importName, importInfo] of imports) {
            if (!usedIdentifiers.has(importName)) {
                unusedImports.push(importInfo);
            }
        }
        // Check for missing imports (simplified)
        const usedButNotImported = Array.from(usedIdentifiers).filter(id => !imports.has(id));
        for (const id of usedButNotImported) {
            missingImports.push({
                name: id,
                location: { file: context.filePath || 'unknown', line: 1 },
                suggested: `import ${id} from './${id}'`,
            });
        }
        // Check for invalid imports (simplified)
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.includes('import') && !line.match(/^\s*import\s+.+?\s+from\s+[\'"'][^\'"]*[\'"']/)) {
                invalidImports.push({
                    import: line.trim(),
                    error: 'Invalid import syntax',
                    location: { file: context.filePath || 'unknown', line: i + 1 },
                });
            }
        }
        // Generate issues
        if (unusedImports.length > 0 && context.options.strict) {
            issues.push(`${unusedImports.length} unused imports found`);
        }
        if (missingImports.length > 0) {
            issues.push(`${missingImports.length} missing imports found`);
        }
        if (invalidImports.length > 0) {
            issues.push(`${invalidImports.length} invalid imports found`);
        }
        const valid = issues.length === 0;
        return {
            valid,
            unusedImports,
            missingImports,
            invalidImports,
            circularDependencies,
            issues,
        };
    }
    /**
     * Basic reference validation
     */
    async checkReferences(context) {
        const issues = [];
        const lines = context.patchedContent.split('\n');
        const definedIdentifiers = new Set();
        // Extract defined identifiers (simplified)
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // Match function/class/interface declarations
            const functionMatch = line.match(/(?:function|class|interface|const|let|var)\s+([a-zA-Z_]\w*)/);
            if (functionMatch) {
                definedIdentifiers.add(functionMatch[1]);
            }
        }
        // Check for undefined references (simplified)
        for (let i = 0; i < lines.length; i++) {
            const identifiers = lines[i].match(/\b[a-zA-Z_]\w*\b/g);
            if (identifiers) {
                for (const id of identifiers) {
                    if (!definedIdentifiers.has(id) && id !== 'console' && id !== 'process' && id !== 'document') {
                        issues.push(this.createIssue('warning', 'reference', 'Undefined reference', `Undefined reference: ${id} at line ${i + 1}`, { file: context.filePath, line: i + 1 }, `Define the identifier or remove the reference`, true));
                    }
                }
            }
        }
        return issues;
    }
    /**
     * Create issues from structural result
     */
    createIssuesFromStructuralResult(result) {
        const issues = [];
        result.midBlockInsertions.forEach(issue => {
            issues.push(this.createIssue('warning', 'structure', 'Mid-block insertion detected', issue, { file: 'unknown' }, 'Avoid inserting content in the middle of blocks', true));
        });
        result.partialEdits.forEach(issue => {
            issues.push(this.createIssue('warning', 'structure', 'Partial edit detected', issue, { file: 'unknown' }, 'Complete the statement or remove partial code', true));
        });
        result.incompleteBlocks.forEach(issue => {
            issues.push(this.createIssue('error', 'structure', 'Incomplete block detected', issue, { file: 'unknown' }, 'Complete the block with proper closing syntax', true));
        });
        result.brokenIndentation.forEach(issue => {
            issues.push(this.createIssue('info', 'structure', 'Broken indentation', issue, { file: 'unknown' }, 'Fix indentation to be consistent', true));
        });
        return issues;
    }
    /**
     * Create issues from duplicate result
     */
    createIssuesFromDuplicateResult(result) {
        const issues = [];
        result.duplicateClasses.forEach(dup => {
            issues.push(this.createIssue('error', 'duplicate', 'Duplicate class detected', `Duplicate class: ${dup.name} found in ${dup.locations.length} locations`, dup.locations[0], `Rename one of the duplicate classes or remove the duplicate`, true));
        });
        result.duplicateMethods.forEach(dup => {
            issues.push(this.createIssue('error', 'duplicate', 'Duplicate method detected', `Duplicate method: ${dup.name} found in ${dup.locations.length} locations`, dup.locations[0], `Rename one of the duplicate methods or remove the duplicate`, true));
        });
        result.duplicateImports.forEach(dup => {
            issues.push(this.createIssue('warning', 'duplicate', 'Duplicate import detected', `Duplicate import: ${dup.source} found in ${dup.locations.length} locations`, dup.locations[0], `Remove one of the duplicate imports`, true));
        });
        return issues;
    }
    /**
     * Create issues from namespace result
     */
    createIssuesFromNamespaceResult(result) {
        const issues = [];
        result.namespaceChanges.forEach(change => {
            issues.push(this.createIssue('error', 'namespace', 'Namespace change detected', `Namespace changed from ${change.from} to ${change.to}`, change.location, 'Revert namespace change', true));
        });
        result.identifierChanges.forEach(change => {
            issues.push(this.createIssue('warning', 'namespace', 'Identifier change detected', `Identifier changed from ${change.from} to ${change.to}`, change.location, 'Revert identifier change', true));
        });
        result.issues.forEach(issue => {
            issues.push(this.createIssue('info', 'namespace', 'Namespace issue', issue, { file: 'unknown' }, 'Fix namespace issues', true));
        });
        return issues;
    }
    /**
     * Create issues from import result
     */
    createIssuesFromImportResult(result) {
        const issues = [];
        result.unusedImports.forEach(imp => {
            issues.push(this.createIssue('warning', 'import', 'Unused import detected', `Unused import: ${imp.name}`, imp.location, `Remove unused import or add usage`, true));
        });
        result.missingImports.forEach(imp => {
            issues.push(this.createIssue('warning', 'import', 'Missing import detected', `Missing import: ${imp.name}`, imp.location, imp.suggested, true));
        });
        result.invalidImports.forEach(imp => {
            issues.push(this.createIssue('error', 'import', 'Invalid import detected', `Invalid import: ${imp.import}`, imp.location, 'Fix import syntax', true));
        });
        result.circularDependencies.forEach(dep => {
            issues.push(this.createIssue('warning', 'import', 'Circular dependency detected', `Circular dependency: ${dep.path.join(' -> ')}`, { file: dep.path[0] }, `Break the circular dependency`, true));
        });
        return issues;
    }
    /**
     * Create a validation issue
     */
    createIssue(severity, category, title, description, location, suggestion, fixable = true) {
        const id = this.generateId();
        return {
            id,
            severity,
            category,
            title,
            description,
            location,
            suggestion,
            fixable,
        };
    }
    /**
     * Group issues by severity
     */
    groupIssuesBySeverity(issues) {
        const grouped = {
            error: 0,
            warning: 0,
            info: 0,
        };
        for (const issue of issues) {
            grouped[issue.severity]++;
        }
        return grouped;
    }
    /**
     * Calculate validation score (enhanced to account for AST validation)
     */
    calculateEnhancedScore(issues, astResult) {
        if (issues.length === 0)
            return 100;
        let score = 100;
        // Base scoring (existing logic)
        for (const issue of issues) {
            switch (issue.severity) {
                case 'error':
                    score -= 20;
                    break;
                case 'warning':
                    score -= 10;
                    break;
                case 'info':
                    score -= 5;
                    break;
            }
            if (!issue.fixable) {
                score -= 5;
            }
        }
        // Enhanced scoring for AST validation results
        if (astResult.syntaxErrors > 0) {
            score -= astResult.syntaxErrors * 15; // Heavier penalty for syntax errors
        }
        if (astResult.semanticErrors > 0) {
            score -= astResult.semanticErrors * 10; // Penalty for semantic errors
        }
        if (astResult.warnings > 0) {
            score -= astResult.warnings * 5; // Penalty for warnings
        }
        return Math.max(0, score);
    }
    /**
     * Calculate validation score (legacy method for backward compatibility)
     */
    calculateScore(issues) {
        if (issues.length === 0)
            return 100;
        let score = 100;
        for (const issue of issues) {
            switch (issue.severity) {
                case 'error':
                    score -= 20;
                    break;
                case 'warning':
                    score -= 10;
                    break;
                case 'info':
                    score -= 5;
                    break;
            }
            if (!issue.fixable) {
                score -= 5;
            }
        }
        return Math.max(0, score);
    }
    /**
     * Generate validation summary
     */
    generateSummary(issues) {
        if (issues.length === 0) {
            return 'Patch validation passed successfully';
        }
        const errorCount = issues.filter(i => i.severity === 'error').length;
        const warningCount = issues.filter(i => i.severity === 'warning').length;
        const infoCount = issues.filter(i => i.severity === 'info').length;
        let summary = `Found ${issues.length} validation issues`;
        if (errorCount > 0) {
            summary += ` (${errorCount} errors)`;
        }
        if (warningCount > 0) {
            summary += ` (${warningCount} warnings)`;
        }
        if (infoCount > 0) {
            summary += ` (${infoCount} info)`;
        }
        return summary;
    }
    /**
     * Generate recommendations
     */
    generateRecommendations(issues) {
        const recommendations = [];
        // Group issues by category and provide general recommendations
        const issuesByCategory = new Map();
        for (const issue of issues) {
            if (!issuesByCategory.has(issue.category)) {
                issuesByCategory.set(issue.category, []);
            }
            issuesByCategory.get(issue.category).push(issue);
        }
        for (const [category, categoryIssues] of issuesByCategory) {
            if (categoryIssues.length > 0) {
                recommendations.push(`Fix ${categoryIssues.length} ${category} issue${categoryIssues.length > 1 ? 's' : ''}`);
            }
        }
        if (recommendations.length === 0) {
            recommendations.push('No fixes needed');
        }
        return recommendations;
    }
    /**
     * Generate unique ID
     */
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }
}
//# sourceMappingURL=patch-validator.js.map