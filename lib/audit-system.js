/**
 * Pre-Work Audit System
 * Provides pre-work validation before starting new tasks
 * Focuses on: existing implementations, blocked dependencies, unaddressed todos
 * 
 * Note: Duplicate detection is handled by the separate duplicate scanner tool
 * Directory structure validation is handled by the separate project context tool
 */

import fs from 'fs/promises';
import path from 'path';
import { readFileSafe, existsSafe, readdirSafe } from './shared/async-utils.js';

/**
 * Audit Issue Types
 */
export const AuditIssue = {
  EXISTING_IMPLEMENTATION: 'existing_implementation',
  BLOCKED_DEPENDENCY: 'blocked_dependency',
  UNADDRESSED_TODO: 'unaddressed_todo',
  OUTDATED_DEPENDENCY: 'outdated_dependency',
};

/**
 * Severity Levels
 */
export const AuditSeverity = {
  CRITICAL: 'critical',      // Must fix before proceeding
  HIGH: 'high',              // Should fix before proceeding
  MEDIUM: 'medium',          // Should fix soon
  LOW: 'low',                // Nice to fix
  INFO: 'info',              // Informational
};

/**
 * Pre-Work Auditor
 * Audits project before starting work to prevent duplicate implementations
 */
export class PreWorkAuditor {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.projectRoot = options.projectRoot || process.cwd();
    this.scanDepth = options.scanDepth || 3;
    this.similarityThreshold = options.similarityThreshold || 0.7;
    this.issues = new Map();
  }

  /**
   * Run full pre-work audit before starting new work
   */
  async auditBeforeWork(taskDescription) {
    if (!this.enabled) {
      return { shouldProceed: true, issues: [] };
    }

    const issues = [];

    // 1. Check for existing implementations related to the task
    const existingImpls = await this.checkExistingImplementations(taskDescription);
    issues.push(...existingImpls);

    // 2. Check for blocked dependencies
    const blockedIssues = await this.checkBlockedDependencies();
    issues.push(...blockedIssues);

    // 3. Check for unaddressed todos related to the task
    const todoIssues = await this.checkRelatedTodos(taskDescription);
    issues.push(...todoIssues);

    // Store issues
    for (const issue of issues) {
      this.issues.set(issue.id, issue);
    }

    const criticalIssues = issues.filter(i => i.severity === AuditSeverity.CRITICAL);
    const highIssues = issues.filter(i => i.severity === AuditSeverity.HIGH);

    return {
      shouldProceed: criticalIssues.length === 0,
      issues,
      criticalCount: criticalIssues.length,
      highCount: highIssues.length,
    };
  }

  /**
   * Check for existing implementations related to the task
   */
  async checkExistingImplementations(taskDescription) {
    const issues = [];
    const keywords = this.extractKeywords(taskDescription);
    const files = await this.scanProjectFiles();

    for (const file of files) {
      const content = await readFileSafe(file, 10000, `checkExistingImplementations read ${file}`);
      const similarity = this.calculateSimilarity(taskDescription, content);

      if (similarity > this.similarityThreshold) {
        issues.push({
          id: `existing_${Date.now()}_${file}`,
          type: AuditIssue.EXISTING_IMPLEMENTATION,
          severity: AuditSeverity.HIGH,
          description: `Existing implementation related to task found in ${file}`,
          details: {
            file,
            similarity: similarity.toFixed(2),
            matchedKeywords: keywords.filter(k => content.toLowerCase().includes(k.toLowerCase())),
          },
          suggestion: `Review ${file} before creating new implementation. Consider extending or refactoring existing code instead.`,
        });
      }
    }

    return issues;
  }

  /**
   * Check for blocked dependencies
   */
  async checkBlockedDependencies() {
    const issues = [];
    
    // Check if there are critical TODOs that block new work
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    if (await existsSafe(packageJsonPath, 1000, 'checkBlockedDependencies exists packageJsonPath')) {
      try {
        const packageJson = JSON.parse(await readFileSafe(packageJsonPath, 10000, 'checkBlockedDependencies read'));
        
        // Check for outdated critical dependencies
        if (packageJson.dependencies) {
          for (const [dep, version] of Object.entries(packageJson.dependencies)) {
            if (version.includes('beta') || version.includes('alpha') || version.includes('rc')) {
              issues.push({
                id: `dep_${dep}_${Date.now()}`,
                type: AuditIssue.BLOCKED_DEPENDENCY,
                severity: AuditSeverity.MEDIUM,
                description: `Dependency ${dep} uses pre-release version: ${version}`,
                details: { dependency: dep, version },
                suggestion: 'Consider using stable versions for production dependencies.',
              });
            }
          }
        }
      } catch (error) {
        // Invalid package.json, skip
      }
    }

    return issues;
  }

  /**
   * Check for unaddressed todos related to the task
   */
  async checkRelatedTodos(taskDescription) {
    const issues = [];
    const keywords = this.extractKeywords(taskDescription);
    const files = await this.scanProjectFiles();
    
    for (const file of files) {
      const content = await readFileSafe(file, 10000, `checkRelatedTodos read ${file}`);
      const todoMatches = content.match(/TODO|FIXME|XXX|HACK/gi);
      
      if (todoMatches && todoMatches.length > 0) {
        const relatedKeywords = keywords.filter(k => content.toLowerCase().includes(k.toLowerCase()));
        
        if (relatedKeywords.length > 0) {
          issues.push({
            id: `related_todo_${Date.now()}_${path.basename(file)}`,
            type: AuditIssue.UNADDRESSED_TODO,
            severity: AuditSeverity.MEDIUM,
            description: `File contains ${todoMatches.length} unaddressed TODO comments related to task`,
            details: { file, count: todoMatches.length, relatedKeywords },
            suggestion: 'Address related TODO comments before proceeding with new work.',
          });
        }
      }
    }

    return issues;
  }

  /**
   * Extract keywords from task description
   */
  extractKeywords(description) {
    const words = description.toLowerCase().split(/\W+/);
    const stopWords = ['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'to', 'for', 'of', 'in', 'on', 'at', 'by', 'with', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once'];
    
    return words
      .filter(word => word.length > 3 && !stopWords.includes(word))
      .filter((word, index, self) => self.indexOf(word) === index);
  }

  /**
   * Calculate similarity between two texts
   */
  calculateSimilarity(text1, text2) {
    const words1 = this.extractKeywords(text1);
    const words2 = this.extractKeywords(text2);
    
    const intersection = words1.filter(w => words2.includes(w));
    const union = [...new Set([...words1, ...words2])];
    
    return union.length > 0 ? intersection.length / union.length : 0;
  }

  /**
   * Scan project files
   */
  async scanProjectFiles() {
    const files = [];
    const extensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.go', '.rs', '.java', '.cs'];
    
    const scanDirectory = async (dir, depth = 0) => {
      if (depth > this.scanDepth) return;
      
      try {
        const entries = await readdirSafe(dir, {}, 5000, 'scanProjectFiles readdir');
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry);
          const stats = await fs.stat(fullPath);
          
          if (stats.isDirectory()) {
            // Skip node_modules, .git, dist, build
            if (!['node_modules', '.git', 'dist', 'build', '.local', 'coverage'].includes(entry)) {
              await scanDirectory(fullPath, depth + 1);
            }
          } else if (stats.isFile() && extensions.some(ext => entry.endsWith(ext))) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    };
    
    await scanDirectory(this.projectRoot);
    return files;
  }

  /**
   * Get all issues
   */
  getIssues() {
    return Array.from(this.issues.values());
  }

  /**
   * Clear issues
   */
  clearIssues() {
    this.issues.clear();
  }
}

// Global instance
let preWorkAuditor = null;

/**
 * Initialize audit system
 */
export function initializeAuditSystem(options = {}) {
  preWorkAuditor = new PreWorkAuditor(options.preWorkAuditor || {});

  console.log('[SWEObeyMe] Audit system initialized');
  return {
    preWorkAuditor,
  };
}

/**
 * Get audit system
 */
export function getAuditSystem() {
  if (!preWorkAuditor) {
    throw new Error('Audit system not initialized. Call initializeAuditSystem first.');
  }

  return {
    preWorkAuditor,
  };
}
