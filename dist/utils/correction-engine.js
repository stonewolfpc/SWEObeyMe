/**
 * Correction Engine
 *
 * Enables autonomous correction of failed patches by analyzing validation
 * errors and generating improved versions through iterative refinement.
 *
 * This engine implements a retry loop that:
 * 1. Validates the initial patch
 * 2. If invalid, generates correction prompts
 * 3. Calls SWE to produce corrected patches
 * 4. Revalidates and repeats until success or retry limit
 */
export class CorrectionEngine {
    promptEnforcer;
    patchValidator;
    constructor(promptEnforcer, patchValidator) {
        this.promptEnforcer = promptEnforcer;
        this.patchValidator = patchValidator;
    }
    /**
     * Generate a correction prompt based on validation errors
     *
     * @param validationResult - The validation result showing errors
     * @param originalPatch - The original patch that failed
     * @param fileContent - The original file content
     * @param taskDescription - The original task description
     * @returns Correction prompt for SWE
     */
    async generateCorrectionPrompt(validationResult, originalPatch, fileContent, taskDescription) {
        // Build error summary
        const errorSummary = this.buildErrorSummary(validationResult);
        // Build correction instructions
        const correctionInstructions = this.buildCorrectionInstructions(validationResult);
        // Assemble correction prompt
        const correctionPrompt = `
CORRECTION TASK REQUIRED

ORIGINAL TASK: ${taskDescription}

VALIDATION FAILED - ERRORS FOUND:
${errorSummary}

ORIGINAL PATCH (FAILED VALIDATION):
\`\`\`diff
${originalPatch}
\`\`\`

CURRENT FILE CONTENT:
\`\`\`typescript
${fileContent}
\`\`\`

CORRECTION INSTRUCTIONS:
${correctionInstructions}

MANDATORY CORRECTION REQUIREMENTS:
1. Fix ALL validation errors listed above
2. Preserve the original task intent
3. Maintain code quality and best practices
4. Ensure syntax is valid
5. Avoid introducing new issues
6. Follow TypeScript conventions

CORRECTION OUTPUT FORMAT:
Provide ONLY the corrected patch content - no explanations, no apologies, just the fixed code.

The corrected patch must pass all validation checks including:
- Syntax validation (no unmatched braces, parentheses, brackets)
- Structural integrity (no incomplete statements)
- No duplicate classes, methods, or imports
- No namespace violations
- Import consistency
- No undefined references

CORRECTED PATCH:
`;
        // Enforce the correction prompt with global rules
        const enforcedPrompt = await this.promptEnforcer.enforcePrompt(correctionPrompt, 'correction_engine', {
            validationResult,
            originalPatch,
            fileContent,
            taskDescription,
        });
        return enforcedPrompt;
    }
    /**
     * Attempt to correct a patch by calling SWE with correction prompt
     *
     * @param taskContext - Context for the correction attempt
     * @returns Correction attempt result
     */
    async attemptCorrection(taskContext) {
        try {
            // Generate correction prompt
            const correctionPrompt = await this.generateCorrectionPrompt(taskContext.validationResult, taskContext.originalPatch, taskContext.fileContent, taskContext.taskDescription);
            // In a real implementation, this would call SWE
            // For MVP, we'll simulate with a basic correction strategy
            const correctedPatch = await this.simulateSWECorrection(correctionPrompt, taskContext.originalPatch, taskContext.validationResult);
            // Validate the corrected patch
            const validation = await this.patchValidator.validatePatch(taskContext.fileContent, correctedPatch, {
                options: {
                    allowNamespaceChanges: false,
                    allowStructuralChanges: false,
                    allowNewImports: false,
                    strict: true,
                },
            });
            return {
                correctedPatch,
                success: validation.valid,
                validation,
            };
        }
        catch (error) {
            return {
                correctedPatch: taskContext.originalPatch,
                success: false,
                validation: taskContext.validationResult,
                error: error.message,
            };
        }
    }
    /**
     * Run the complete correction loop
     *
     * @param originalContent - Original file content
     * @param initialPatch - Initial patch that failed validation
     * @param maxRetries - Maximum number of correction attempts
     * @param taskDescription - Original task description
     * @returns Final correction result
     */
    async runCorrectionLoop(originalContent, initialPatch, maxRetries = 3, taskDescription = 'Patch correction') {
        const correctionHistory = [];
        let currentPatch = initialPatch;
        let currentValidation = await this.patchValidator.validatePatch(originalContent, initialPatch, {
            options: {
                allowNamespaceChanges: false,
                allowStructuralChanges: false,
                allowNewImports: false,
                strict: true,
            },
        });
        // Record initial attempt
        correctionHistory.push({
            attempt: 0,
            success: currentValidation.valid,
            issues: currentValidation.totalIssues,
            score: currentValidation.score,
        });
        // If initial patch is valid, return immediately
        if (currentValidation.valid) {
            return {
                finalPatch: currentPatch,
                finalValidation: currentValidation,
                attempts: 0,
                success: true,
                correctionHistory,
            };
        }
        // Run correction loop
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            console.log(`🔧 Correction attempt ${attempt}/${maxRetries}...`);
            const correctionResult = await this.attemptCorrection({
                validationResult: currentValidation,
                originalPatch: currentPatch,
                fileContent: originalContent,
                taskDescription,
                attemptNumber: attempt,
            });
            // Record this attempt
            correctionHistory.push({
                attempt,
                success: correctionResult.success,
                issues: correctionResult.validation.totalIssues,
                score: correctionResult.validation.score,
                error: correctionResult.error,
            });
            if (correctionResult.success) {
                console.log(`✅ Correction successful on attempt ${attempt}`);
                return {
                    finalPatch: correctionResult.correctedPatch,
                    finalValidation: correctionResult.validation,
                    attempts: attempt,
                    success: true,
                    correctionHistory,
                };
            }
            // Update for next iteration
            currentPatch = correctionResult.correctedPatch;
            currentValidation = correctionResult.validation;
            console.log(`❌ Correction attempt ${attempt} failed: ${currentValidation.totalIssues} issues remaining`);
        }
        console.log(`💥 Correction failed after ${maxRetries} attempts`);
        return {
            finalPatch: currentPatch,
            finalValidation: currentValidation,
            attempts: maxRetries,
            success: false,
            correctionHistory,
        };
    }
    /**
     * Build a summary of validation errors
     */
    buildErrorSummary(validationResult) {
        const lines = [];
        lines.push(`Validation Score: ${validationResult.score}/100`);
        lines.push(`Total Issues: ${validationResult.totalIssues}`);
        lines.push(`Errors: ${validationResult.issuesBySeverity.error}`);
        lines.push(`Warnings: ${validationResult.issuesBySeverity.warning}`);
        lines.push(`Info: ${validationResult.issuesBySeverity.info}`);
        if (validationResult.issues.length > 0) {
            lines.push('\nDetailed Issues:');
            validationResult.issues.slice(0, 10).forEach((issue, index) => {
                lines.push(`${index + 1}. [${issue.severity.toUpperCase()}] ${issue.title}`);
                lines.push(`   ${issue.description}`);
                if (issue.suggestion) {
                    lines.push(`   Suggestion: ${issue.suggestion}`);
                }
                if (issue.location.file || issue.location.line) {
                    lines.push(`   Location: ${issue.location.file || 'unknown'}:${issue.location.line || 'unknown'}`);
                }
                lines.push('');
            });
            if (validationResult.issues.length > 10) {
                lines.push(`... and ${validationResult.issues.length - 10} more issues`);
            }
        }
        return lines.join('\n');
    }
    /**
     * Build specific correction instructions based on issue types
     */
    buildCorrectionInstructions(validationResult) {
        const instructions = [];
        // Group issues by category
        const issuesByCategory = new Map();
        validationResult.issues.forEach(issue => {
            if (!issuesByCategory.has(issue.category)) {
                issuesByCategory.set(issue.category, []);
            }
            issuesByCategory.get(issue.category).push(issue);
        });
        // Generate specific instructions for each category
        for (const [category, issues] of issuesByCategory) {
            instructions.push(`\n${category.toUpperCase()} ISSUES:`);
            switch (category) {
                case 'syntax':
                    instructions.push('- Check for unmatched braces, parentheses, or brackets');
                    instructions.push('- Ensure all blocks are properly closed');
                    instructions.push('- Verify string quotes are matched');
                    break;
                case 'structure':
                    instructions.push('- Complete any incomplete statements (if, for, while)');
                    instructions.push('- Fix indentation inconsistencies');
                    instructions.push('- Ensure proper block structure');
                    break;
                case 'duplicate':
                    instructions.push('- Remove duplicate class, method, or import declarations');
                    instructions.push('- Rename conflicting identifiers');
                    instructions.push('- Consolidate duplicate code');
                    break;
                case 'namespace':
                    instructions.push('- Avoid unauthorized namespace changes');
                    instructions.push('- Keep existing identifier names');
                    instructions.push('- Preserve module structure');
                    break;
                case 'import':
                    instructions.push('- Remove unused imports');
                    instructions.push('- Add missing imports for referenced identifiers');
                    instructions.push('- Fix invalid import syntax');
                    break;
                case 'reference':
                    instructions.push('- Define or import all referenced identifiers');
                    instructions.push('- Remove references to undefined symbols');
                    instructions.push('- Ensure all variables are declared before use');
                    break;
            }
            // Add specific issue instructions
            issues.slice(0, 5).forEach(issue => {
                if (issue.suggestion) {
                    instructions.push(`- ${issue.suggestion}`);
                }
            });
        }
        return instructions.join('\n');
    }
    /**
     * Simulate SWE correction (MVP implementation)
     * In a real implementation, this would call the actual SWE model
     */
    async simulateSWECorrection(correctionPrompt, originalPatch, validationResult) {
        // For MVP, implement basic automated corrections
        let correctedPatch = originalPatch;
        // Fix unmatched braces
        const braceCount = (originalPatch.match(/{/g) || []).length - (originalPatch.match(/}/g) || []).length;
        if (braceCount > 0) {
            correctedPatch += '}'.repeat(braceCount);
        }
        // Fix unmatched parentheses
        const parenCount = (originalPatch.match(/\(/g) || []).length - (originalPatch.match(/\)/g) || []).length;
        if (parenCount > 0) {
            correctedPatch += ')'.repeat(parenCount);
        }
        // Fix unmatched brackets
        const bracketCount = (originalPatch.match(/\[/g) || []).length - (originalPatch.match(/\]/g) || []).length;
        if (bracketCount > 0) {
            correctedPatch += ']'.repeat(bracketCount);
        }
        // Fix incomplete if statements
        correctedPatch = correctedPatch.replace(/(\s+if\s+\([^}]+)\s*$/gm, '$1 { /* TODO: Add condition body */ }');
        // Fix incomplete for loops
        correctedPatch = correctedPatch.replace(/(\s+for\s+\([^}]+)\s*$/gm, '$1 { /* TODO: Add loop body */ }');
        // Fix incomplete while loops
        correctedPatch = correctedPatch.replace(/(\s+while\s+\([^}]+)\s*$/gm, '$1 { /* TODO: Add loop body */ }');
        // If no corrections were made, return original
        if (correctedPatch === originalPatch) {
            // Add a comment to indicate correction attempt
            correctedPatch += '\n// Correction attempted - manual review required';
        }
        return correctedPatch;
    }
    /**
     * Get correction engine statistics
     */
    getCorrectionStats() {
        // In a real implementation, this would track actual statistics
        return {
            totalCorrections: 0,
            successRate: 0,
            averageAttempts: 0,
        };
    }
}
//# sourceMappingURL=correction-engine.js.map