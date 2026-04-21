/**
 * Automated Audit System
 * Provides pre-work auditing, duplicate detection, and professional directory structure validation
 * Addresses AI-centric issues like duplicate implementations and poor organization
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Professional Directory Structure Standards
 */
export const DirectoryStandards = {
  LIB: 'lib',
  TESTS: 'tests',
  DOCS: 'docs',
  CONFIG: 'config',
  ASSETS: 'assets',
  UTILS: 'utils',
  HANDLERS: 'handlers',
  COMPONENTS: 'components',
  SERVICES: 'services',
  TYPES: 'types',
  INTERFACES: 'interfaces',
};

/**
 * Audit Issue Types
 */
export const AuditIssue = {
  DUPLICATE_IMPLEMENTATION: 'duplicate_implementation',
  POOR_DIRECTORY_STRUCTURE: 'poor_directory_structure',
  MISSING_DIRECTORY: 'missing_directory',
  INCONSISTENT_NAMING: 'inconsistent_naming',
  SCATTERED_FUNCTIONALITY: 'scattered_functionality',
  TODO_NOT_ADDRESSED: 'todo_not_addressed',
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

    // 1. Check for duplicate implementations
    const duplicates = await this.detectDuplicateImplementations(taskDescription);
    issues.push(...duplicates);

    // 2. Check directory structure
    const structureIssues = this.auditDirectoryStructure();
    issues.push(...structureIssues);

    // 3. Check for scattered functionality
    const scatteredIssues = this.detectScatteredFunctionality(taskDescription);
    issues.push(...scatteredIssues);

    // 4. Check for unaddressed todos
    const todoIssues = this.checkUnaddressedTodos();
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
   * Detect duplicate implementations based on task description
   */
  async detectDuplicateImplementations(taskDescription) {
    const issues = [];
    const keywords = this.extractKeywords(taskDescription);
    const files = this.scanProjectFiles();

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const similarity = this.calculateSimilarity(taskDescription, content);

      if (similarity > this.similarityThreshold) {
        issues.push({
          id: `dup_${Date.now()}_${file}`,
          type: AuditIssue.DUPLICATE_IMPLEMENTATION,
          severity: AuditSeverity.HIGH,
          description: `Potential duplicate implementation in ${file}`,
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
  scanProjectFiles() {
    const files = [];
    const extensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.go', '.rs', '.java', '.cs'];
    
    const scanDirectory = (dir, depth = 0) => {
      if (depth > this.scanDepth) return;
      
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory()) {
            // Skip node_modules, .git, dist, build
            if (!['node_modules', '.git', 'dist', 'build', '.local', 'coverage'].includes(entry.name)) {
              scanDirectory(fullPath, depth + 1);
            }
          } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    };
    
    scanDirectory(this.projectRoot);
    return files;
  }

  /**
   * Audit directory structure against professional standards
   */
  auditDirectoryStructure() {
    const issues = [];
    const requiredDirs = [
      DirectoryStandards.LIB,
      DirectoryStandards.TESTS,
    ];
    
    const optionalDirs = [
      DirectoryStandards.DOCS,
      DirectoryStandards.CONFIG,
      DirectoryStandards.ASSETS,
    ];

    // Check for required directories
    for (const dir of requiredDirs) {
      const dirPath = path.join(this.projectRoot, dir);
      if (!fs.existsSync(dirPath)) {
        issues.push({
          id: `missing_${dir}_${Date.now()}`,
          type: AuditIssue.MISSING_DIRECTORY,
          severity: AuditSeverity.MEDIUM,
          description: `Missing required directory: ${dir}`,
          details: { directory: dir },
          suggestion: `Create ${dir} directory to maintain professional project structure.`,
        });
      }
    }

    // Check for poor structure (flat structure with many files)
    const rootFiles = fs.readdirSync(this.projectRoot, { withFileTypes: true });
    const fileCount = rootFiles.filter(f => f.isFile()).length;
    
    if (fileCount > 20) {
      issues.push({
        id: `flat_structure_${Date.now()}`,
        type: AuditIssue.POOR_DIRECTORY_STRUCTURE,
        severity: AuditSeverity.MEDIUM,
        description: 'Project has flat structure with too many root files',
        details: { fileCount },
        suggestion: 'Organize files into appropriate subdirectories (lib, tests, config, etc.)',
      });
    }

    return issues;
  }

  /**
   * Detect scattered functionality (same concern in multiple files)
   */
  detectScatteredFunctionality(taskDescription) {
    const issues = [];
    const keywords = this.extractKeywords(taskDescription);
    const files = this.scanProjectFiles();
    const matches = [];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const matchedKeywords = keywords.filter(k => content.toLowerCase().includes(k.toLowerCase()));
      
      if (matchedKeywords.length >= 2) {
        matches.push({ file, keywords: matchedKeywords });
      }
    }

    if (matches.length > 3) {
      issues.push({
        id: `scattered_${Date.now()}`,
        type: AuditIssue.SCATTERED_FUNCTIONALITY,
        severity: AuditSeverity.HIGH,
        description: 'Functionality may be scattered across multiple files',
        details: { fileCount: matches.length, files: matches.map(m => m.file) },
        suggestion: 'Consider consolidating related functionality into a single module or directory.',
      });
    }

    return issues;
  }

  /**
   * Check for unaddressed todos
   */
  checkUnaddressedTodos() {
    const issues = [];
    
    // Scan for TODO/FIXME comments
    const files = this.scanProjectFiles();
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const todoMatches = content.match(/TODO|FIXME|XXX|HACK/gi);
      
      if (todoMatches && todoMatches.length > 0) {
        issues.push({
          id: `todo_${Date.now()}_${path.basename(file)}`,
          type: AuditIssue.TODO_NOT_ADDRESSED,
          severity: AuditSeverity.MEDIUM,
          description: `File contains ${todoMatches.length} unaddressed TODO comments`,
          details: { file, count: todoMatches.length },
          suggestion: 'Address TODO comments or create scheduled tasks for them.',
        });
      }
    }

    return issues;
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

/**
 * Todo Scheduler
 * Configures when todos should be completed
 */
export class TodoScheduler {
  constructor(options = {}) {
    this.todos = new Map();
    this.schedules = new Map();
    this.autoRemind = options.autoRemind !== false;
    this.reminderInterval = options.reminderInterval || 3600000; // 1 hour
  }

  /**
   * Schedule a todo for completion
   */
  scheduleTodo(todo, schedule) {
    const { trigger, priority, dependencies } = schedule;
    
    this.schedules.set(todo.id, {
      todo,
      trigger, // 'immediate', 'after_phase', 'before_commit', 'time_based'
      priority, // 'critical', 'high', 'medium', 'low'
      dependencies, // Array of todo IDs that must complete first
      scheduledAt: Date.now(),
      completedAt: null,
    });
  }

  /**
   * Get todos due for completion based on current context
   */
  getDueTodos(context) {
    const dueTodos = [];
    
    for (const [id, schedule] of this.schedules) {
      if (schedule.completedAt) continue;
      
      let isDue = false;
      
      switch (schedule.trigger) {
        case 'immediate':
          isDue = true;
          break;
        case 'after_phase':
          if (context.phase && context.phase === schedule.phase) {
            isDue = true;
          }
          break;
        case 'before_commit':
          if (context.action === 'commit') {
            isDue = true;
          }
          break;
        case 'time_based':
          if (Date.now() - schedule.scheduledAt >= schedule.delay) {
            isDue = true;
          }
          break;
      }
      
      // Check dependencies
      if (isDue && schedule.dependencies) {
        const allDependenciesMet = schedule.dependencies.every(depId => {
          const dep = this.schedules.get(depId);
          return dep && dep.completedAt;
        });
        
        if (!allDependenciesMet) {
          isDue = false;
        }
      }
      
      if (isDue) {
        dueTodos.push(schedule);
      }
    }
    
    // Sort by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    dueTodos.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    
    return dueTodos;
  }

  /**
   * Mark todo as completed
   */
  completeTodo(todoId) {
    const schedule = this.schedules.get(todoId);
    if (schedule) {
      schedule.completedAt = Date.now();
    }
  }

  /**
   * Get all schedules
   */
  getSchedules() {
    return Array.from(this.schedules.values());
  }

  /**
   * Clear completed schedules
   */
  clearCompleted() {
    for (const [id, schedule] of this.schedules) {
      if (schedule.completedAt) {
        this.schedules.delete(id);
      }
    }
  }
}

// Global instances
let preWorkAuditor = null;
let todoScheduler = null;

/**
 * Initialize audit system
 */
export function initializeAuditSystem(options = {}) {
  preWorkAuditor = new PreWorkAuditor(options.preWorkAuditor || {});
  todoScheduler = new TodoScheduler(options.todoScheduler || {});

  console.log('[SWEObeyMe] Audit system initialized');
  return {
    preWorkAuditor,
    todoScheduler,
  };
}

/**
 * Get audit system
 */
export function getAuditSystem() {
  if (!preWorkAuditor || !todoScheduler) {
    throw new Error('Audit system not initialized. Call initializeAuditSystem first.');
  }

  return {
    preWorkAuditor,
    todoScheduler,
  };
}
