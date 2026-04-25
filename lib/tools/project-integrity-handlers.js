/**
 * Project Integrity Handlers
 * Comprehensive handlers to prevent file duplication, ensure proper auditing,
 * and maintain integrity in massive projects
 */

import {
  getFileRegistry,
  findDuplicateFiles,
  findSimilarFiles,
  findSameNameFiles,
  searchFiles,
  getRegistryStatistics,
} from '../file-registry.js';
import {
  recordFileOperation,
  wasFileRecentlyWritten,
  checkForDuplicateWrite,
  getAuditStatistics,
  detectAuditIssues,
  generateAuditReport,
} from '../file-operation-audit.js';
import { validateAllReferences } from '../reference-validation.js';
import { recordAction } from '../session.js';

/**
 * Project Integrity Handlers
 */
export const projectIntegrityHandlers = {
  /**
   * Index project files into the registry
   */
  index_project_files: async (args) => {
    try {
      const registry = getFileRegistry();
      const rootDir = args.root_dir || process.cwd();

      console.error(`[PROJECT-INTEGRITY] Indexing project files in ${rootDir}...`);

      const result = await registry.indexProject(rootDir, {
        ignorePatterns: args.ignore_patterns || [
          'node_modules',
          '.git',
          'dist',
          'build',
          'bin',
          'obj',
          '.next',
          'out',
        ],
        maxDepth: args.max_depth || 20,
        onProgress: (count, _path) => {
          if (count % 100 === 0) {
            console.error(`[PROJECT-INTEGRITY] Indexed ${count} files...`);
          }
        },
      });

      recordAction('PROJECT_INDEXED', {
        rootDir,
        indexedCount: result.indexedCount,
        skippedCount: result.skippedCount,
        totalFiles: result.totalFiles,
      });

      return {
        content: [
          {
            type: 'text',
            text: `Project Indexed Successfully!

Root Directory: ${rootDir}
Files Indexed: ${result.indexedCount}
Files Skipped: ${result.skippedCount}
Total Files: ${result.totalFiles}
Directories: ${result.directories}

The file registry is now active and will help prevent file duplication.`,
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Project indexing failed: ${error.message}` }],
      };
    }
  },

  /**
   * Check for duplicate files before creating
   */
  check_file_duplicates: async (args) => {
    try {
      const { file_path, content } = args;

      if (!file_path) {
        return { isError: true, content: [{ type: 'text', text: 'file_path is required' }] };
      }

      const issues = [];

      // Check for exact duplicates by content
      const exactDuplicates = findDuplicateFiles(file_path, content || '');
      if (exactDuplicates.length > 0) {
        issues.push({
          type: 'EXACT_DUPLICATE',
          severity: 'ERROR',
          message: `Exact duplicate found! File with identical content already exists at: ${exactDuplicates.join(', ')}`,
          duplicates: exactDuplicates,
        });
      }

      // Check for same name files
      const sameNameFiles = findSameNameFiles(file_path);
      if (sameNameFiles.length > 0) {
        issues.push({
          type: 'SAME_NAME',
          severity: 'WARNING',
          message: `File with same name already exists: ${sameNameFiles.join(', ')}`,
          duplicates: sameNameFiles,
        });
      }

      // Check for similar files
      const similarFiles = findSimilarFiles(file_path, args.similarity_threshold || 0.7);
      if (similarFiles.length > 0) {
        issues.push({
          type: 'SIMILAR_NAME',
          severity: 'INFO',
          message: `Similar files found: ${similarFiles.map((f) => `${f.path} (${(f.similarity * 100).toFixed(0)}% similarity)`).join(', ')}`,
          similar: similarFiles,
        });
      }

      const hasCriticalIssues = issues.some((i) => i.severity === 'ERROR');

      return {
        content: [
          {
            type: 'text',
            text: `File Duplicate Check for ${file_path}:

${issues.length > 0 ? issues.map((i) => `[${i.severity}] ${i.message}`).join('\n\n') : 'No duplicates detected. Safe to proceed.'}

${hasCriticalIssues ? '\n⚠️ CRITICAL: Exact duplicate detected. Consider using existing file or modifying existing content.' : ''}`,
          },
        ],
        hasCriticalIssues,
        issues,
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Duplicate check failed: ${error.message}` }],
      };
    }
  },

  /**
   * Validate file references before write
   */
  validate_file_references: async (args) => {
    try {
      const { file_path, content, language } = args;

      if (!content) {
        return { isError: true, content: [{ type: 'text', text: 'content is required' }] };
      }

      // Auto-detect language if not provided
      let detectedLanguage = language;
      if (!detectedLanguage) {
        if (file_path.endsWith('.js') || file_path.endsWith('.mjs')) {
          detectedLanguage = 'javascript';
        } else if (file_path.endsWith('.ts')) {
          detectedLanguage = 'typescript';
        } else if (file_path.endsWith('.cs')) {
          detectedLanguage = 'csharp';
        } else if (file_path.endsWith('.py')) {
          detectedLanguage = 'python';
        }
      }

      const validation = await validateAllReferences(content, file_path, detectedLanguage);

      const hasErrors = validation.errors.length > 0;

      return {
        content: [
          {
            type: 'text',
            text: `Reference Validation for ${file_path}:

VALID: ${validation.valid ? 'YES' : 'NO'}
Total References: ${validation.references.length}
Found: ${validation.foundReferences.length}
Missing: ${validation.missingReferences.length}

${validation.errors.length > 0 ? `ERRORS (${validation.errors.length}):\n${validation.errors.map((e) => `  Line ${e.reference.line}: ${e.message}`).join('\n')}\n` : ''}
${validation.warnings.length > 0 ? `WARNINGS (${validation.warnings.length}):\n${validation.warnings.map((w) => `  Line ${w.reference.line}: ${w.message}`).join('\n')}\n` : ''}

${hasErrors ? '\n⚠️ CRITICAL: Missing references detected. Ensure all imports/referenced files exist.' : 'All references validated successfully.'}`,
          },
        ],
        valid: validation.valid,
        errors: validation.errors,
        warnings: validation.warnings,
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Reference validation failed: ${error.message}` }],
      };
    }
  },

  /**
   * Check recent file operations (prevents redundant operations)
   */
  check_recent_operations: async (args) => {
    try {
      const { file_path, operation, time_window } = args;

      const stats = getAuditStatistics();

      // Check for recent operations on file
      if (file_path) {
        const recentWrite = wasFileRecentlyWritten(file_path, time_window || 30000);
        if (recentWrite) {
          return {
            content: [
              {
                type: 'text',
                text: `⚠️ WARNING: File ${file_path} was recently written in the last ${time_window || 30} seconds.

This may indicate:
- SWE is in a loop writing the same file
- Redundant operation that should be skipped
- File is being modified by multiple processes

Recommendation: Review the operation history to determine if this operation is necessary.`,
              },
            ],
            hasRecentOperation: true,
          };
        }
      }

      // Check for duplicate operations
      if (operation && args.content) {
        const duplicate = await checkForDuplicateWrite(
          file_path,
          args.content,
          time_window || 10000
        );
        if (duplicate) {
          return {
            content: [
              {
                type: 'text',
                text: `⚠️ DUPLICATE OPERATION DETECTED!

An identical write operation was performed on ${file_path} at ${new Date(duplicate.timestamp).toISOString()}.

This operation will be blocked to prevent redundant work.`,
              },
            ],
            isDuplicate: true,
            duplicateOperation: duplicate,
          };
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: `No recent operations detected. Safe to proceed.

Session Statistics:
- Total Operations: ${stats.totalOperations}
- Success: ${stats.successCount}
- Failed: ${stats.failedCount}
- Duplicates Blocked: ${stats.duplicateCount}
- Blocked: ${stats.blockedCount}`,
          },
        ],
        hasRecentOperation: false,
        isDuplicate: false,
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Recent operation check failed: ${error.message}` }],
      };
    }
  },

  /**
   * Comprehensive pre-write validation
   */
  validate_before_write: async (args) => {
    try {
      const { file_path, content, language } = args;

      if (!file_path || !content) {
        return {
          isError: true,
          content: [{ type: 'text', text: 'file_path and content are required' }],
        };
      }

      const issues = [];
      const criticalIssues = [];

      // 1. Check for duplicates
      const duplicateCheck = await this.check_file_duplicates({ file_path, content });
      if (duplicateCheck.hasCriticalIssues) {
        criticalIssues.push(...duplicateCheck.issues.filter((i) => i.severity === 'ERROR'));
      }
      issues.push(...duplicateCheck.issues);

      // 2. Validate references
      const referenceCheck = await this.validate_file_references({ file_path, content, language });
      if (!referenceCheck.valid) {
        criticalIssues.push(...referenceCheck.errors);
      }
      issues.push(...referenceCheck.errors);
      issues.push(...referenceCheck.warnings);

      // 3. Check recent operations
      const recentCheck = await this.check_recent_operations({ file_path, content });
      if (recentCheck.isDuplicate) {
        criticalIssues.push({
          type: 'DUPLICATE_OPERATION',
          severity: 'ERROR',
          message: 'Duplicate operation detected - identical write was performed recently',
        });
      }

      // 4. Record the operation for audit
      await recordFileOperation('WRITE', file_path, { content });

      const hasCriticalIssues = criticalIssues.length > 0;

      return {
        content: [
          {
            type: 'text',
            text: `Pre-Write Validation for ${file_path}:

${criticalIssues.length > 0 ? `CRITICAL ISSUES (${criticalIssues.length}):\n${criticalIssues.map((i) => `  [${i.type}] ${i.message}`).join('\n')}\n` : ''}
${
  issues.filter((i) => i.severity !== 'ERROR').length > 0
    ? `WARNINGS (${issues.filter((i) => i.severity !== 'ERROR').length}):\n${issues
        .filter((i) => i.severity !== 'ERROR')
        .map((i) => `  [${i.type}] ${i.message}`)
        .join('\n')}\n`
    : ''
}

${hasCriticalIssues ? '❌ WRITE BLOCKED: Critical issues detected. Address these issues before proceeding.' : '✓ VALIDATION PASSED: Safe to write file.'}`,
          },
        ],
        valid: !hasCriticalIssues,
        criticalIssues,
        warnings: issues.filter((i) => i.severity !== 'ERROR'),
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Pre-write validation failed: ${error.message}` }],
      };
    }
  },

  /**
   * Get registry statistics
   */
  get_registry_stats: async (_args) => {
    try {
      const stats = getRegistryStatistics();
      const auditStats = getAuditStatistics();
      const auditIssues = detectAuditIssues();

      return {
        content: [
          {
            type: 'text',
            text: `Project Registry Statistics:

File Registry:
- Total Files: ${stats.totalFiles}
- Total Directories: ${stats.totalDirectories}
- Duplicates: ${stats.duplicates}
- Total Size: ${(stats.totalSize / 1024 / 1024).toFixed(2)} MB
- Last Indexed: ${new Date(stats.lastIndexed).toISOString()}

File Types:
${Object.entries(stats.fileTypes)
  .map(([ext, count]) => `  ${ext || 'no-extension'}: ${count}`)
  .join('\n')}

Operation Audit:
- Total Operations: ${auditStats.totalOperations}
- Session Duration: ${(auditStats.sessionDuration / 1000).toFixed(0)}s
- Success: ${auditStats.successCount}
- Failed: ${auditStats.failedCount}
- Duplicates Blocked: ${auditStats.duplicateCount}
- Blocked: ${auditStats.blockedCount}

${auditIssues.length > 0 ? `Issues Detected:\n${auditIssues.map((i) => `  [${i.type}] ${i.message}`).join('\n')}` : 'No issues detected.'}`,
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Failed to get registry stats: ${error.message}` }],
      };
    }
  },

  /**
   * Search for files in the registry
   */
  search_files: async (args) => {
    try {
      const { pattern, case_sensitive, in_directory, extension } = args;

      if (!pattern) {
        return { isError: true, content: [{ type: 'text', text: 'pattern is required' }] };
      }

      const results = searchFiles(pattern, {
        caseSensitive: case_sensitive || false,
        inDirectory: in_directory || null,
        extension: extension || null,
      });

      return {
        content: [
          {
            type: 'text',
            text: `Search Results for "${pattern}":

Found ${results.length} file(s):
${results.map((f) => `  ${f.path} (${f.basename}) - ${(f.size / 1024).toFixed(2)} KB`).join('\n')}

${results.length === 0 ? 'No files found matching the pattern.' : ''}`,
          },
        ],
        results,
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `File search failed: ${error.message}` }],
      };
    }
  },

  /**
   * Generate comprehensive audit report
   */
  generate_audit_report: async (_args) => {
    try {
      const report = generateAuditReport();

      return {
        content: [
          {
            type: 'text',
            text: `Project Integrity Audit Report:

Generated: ${new Date(report.timestamp).toISOString()}
Session Duration: ${(report.sessionDuration / 1000).toFixed(0)}s

Statistics:
- Total Operations: ${report.statistics.totalOperations}
- Success: ${report.statistics.successCount}
- Failed: ${report.statistics.failedCount}
- Duplicates Blocked: ${report.statistics.duplicateCount}
- Blocked: ${report.statistics.blockedCount}

${report.issues.length > 0 ? `Issues Detected:\n${report.issues.map((i) => `  [${i.type}] ${i.severity}: ${i.message}`).join('\n')}\n` : 'No issues detected.\n'}

Recent Operations (last 20):
${report.recentOperations.map((op) => `  [${op.status}] ${op.type} ${op.path} - ${new Date(op.timestamp).toISOString()}`).join('\n')}`,
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Audit report generation failed: ${error.message}` }],
      };
    }
  },

  /**
   * Check file exists in registry
   */
  check_file_exists: async (args) => {
    try {
      const { file_path } = args;
      const registry = getFileRegistry();

      const exists = registry.fileExists(file_path);
      const metadata = exists ? registry.getFileMetadata(file_path) : null;

      return {
        content: [
          {
            type: 'text',
            text: `File Existence Check for ${file_path}:

${exists ? '✓ File EXISTS in registry' : '✗ File NOT FOUND in registry'}

${
  metadata
    ? `
Metadata:
  Size: ${(metadata.size / 1024).toFixed(2)} KB
  Modified: ${new Date(metadata.modified).toISOString()}
  Directory: ${metadata.directory}
  Hash: ${metadata.hash}`
    : ''
}`,
          },
        ],
        exists,
        metadata,
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `File existence check failed: ${error.message}` }],
      };
    }
  },
};
