/**
 * Duplicate Scanner
 * 
 * Scans any codebase for duplicate implementations and issues
 * Can scan code files, package.json, extension.js, and other config files
 * 
 * @module lib/duplicate-scanner
 */

import fs from 'fs/promises';
import path from 'path';
import { readFileSafe, existsSafe, readdirSafe } from './shared/async-utils.js';

const DEFAULT_SCAN_DEPTH = 3;
const DEFAULT_SIMILARITY_THRESHOLD = 0.7;

export class DuplicateScanner {
  constructor(options = {}) {
    this.projectRoot = options.projectRoot || process.cwd();
    this.scanDepth = options.scanDepth || DEFAULT_SCAN_DEPTH;
    this.similarityThreshold = options.similarityThreshold || DEFAULT_SIMILARITY_THRESHOLD;
  }

  /**
   * Scan entire codebase for duplicates
   */
  async scanForDuplicates(targetDescription = '') {
    const duplicates = [];

    // 1. Scan code files for duplicate implementations
    const codeDuplicates = await this.scanCodeFiles(targetDescription);
    duplicates.push(...codeDuplicates);

    // 2. Scan package.json for duplicate UI elements
    const packageDuplicates = await this.scanPackageJson();
    duplicates.push(...packageDuplicates);

    // 3. Scan extension.js for duplicate registrations
    const extensionDuplicates = await this.scanExtensionJs();
    duplicates.push(...extensionDuplicates);

    return {
      totalDuplicates: duplicates.length,
      duplicates,
      summary: this.generateSummary(duplicates),
    };
  }

  /**
   * Scan code files for duplicate implementations
   */
  async scanCodeFiles(targetDescription) {
    const duplicates = [];
    const files = await this.scanProjectFiles();
    const keywords = this.extractKeywords(targetDescription);

    for (const file of files) {
      const content = await readFileSafe(file, 10000, `scanCodeFiles read ${file}`);
      const similarity = this.calculateSimilarity(targetDescription, content);

      if (similarity > this.similarityThreshold) {
        duplicates.push({
          type: 'code_implementation',
          file,
          similarity: similarity.toFixed(2),
          matchedKeywords: keywords.filter(k => content.toLowerCase().includes(k.toLowerCase())),
          suggestion: `Review ${file} before creating new implementation. Consider extending or refactoring existing code.`,
        });
      }
    }

    return duplicates;
  }

  /**
   * Scan package.json for duplicate UI elements
   */
  async scanPackageJson() {
    const duplicates = [];
    const packageJsonPath = path.join(this.projectRoot, 'package.json');

    if (!(await existsSafe(packageJsonPath, 1000, 'scanPackageJson exists'))) {
      return duplicates;
    }

    try {
      const packageJson = JSON.parse(await readFileSafe(packageJsonPath, 10000, 'scanPackageJson read'));

      // Check for duplicate view IDs
      if (packageJson.contributes?.views) {
        const viewIds = packageJson.contributes.views.map(v => v.id);
        const duplicateIds = this.findDuplicates(viewIds);

        for (const dup of duplicateIds) {
          duplicates.push({
            type: 'package_json_view',
            id: dup,
            location: 'package.json -> contributes.views',
            suggestion: `Remove duplicate view ID "${dup}" from package.json`,
          });
        }
      }

      // Check for duplicate command IDs
      if (packageJson.contributes?.commands) {
        const commandIds = packageJson.contributes.commands.map(c => c.command);
        const duplicateIds = this.findDuplicates(commandIds);

        for (const dup of duplicateIds) {
          duplicates.push({
            type: 'package_json_command',
            id: dup,
            location: 'package.json -> contributes.commands',
            suggestion: `Remove duplicate command "${dup}" from package.json`,
          });
        }
      }

    } catch (error) {
      // Invalid package.json, skip
    }

    return duplicates;
  }

  /**
   * Scan extension.js for duplicate registrations
   */
  async scanExtensionJs() {
    const duplicates = [];
    const extensionJsPath = path.join(this.projectRoot, 'extension.js');

    if (!(await existsSafe(extensionJsPath, 1000, 'scanExtensionJs exists'))) {
      return duplicates;
    }

    try {
      const content = await readFileSafe(extensionJsPath, 10000, 'scanExtensionJs read');

      // Check for duplicate registerWebviewViewProvider calls
      const providerMatches = content.match(/registerWebviewViewProvider\(['"`]([^'"`]+)['"`]/g);
      if (providerMatches) {
        const providerIds = providerMatches.map(m => m.match(/['"`]([^'"`]+)['"`]/)[1]);
        const duplicateIds = this.findDuplicates(providerIds);

        for (const dup of duplicateIds) {
          duplicates.push({
            type: 'extension_js_provider',
            id: dup,
            location: 'extension.js -> registerWebviewViewProvider',
            suggestion: `Remove duplicate webview provider registration for "${dup}" in extension.js`,
          });
        }
      }

      // Check for duplicate registerCommand calls
      const commandMatches = content.match(/registerCommand\(['"`]([^'"`]+)['"`]/g);
      if (commandMatches) {
        const commandIds = commandMatches.map(m => m.match(/['"`]([^'"`]+)['"`]/)[1]);
        const duplicateIds = this.findDuplicates(commandIds);

        for (const dup of duplicateIds) {
          duplicates.push({
            type: 'extension_js_command',
            id: dup,
            location: 'extension.js -> registerCommand',
            suggestion: `Remove duplicate command registration for "${dup}" in extension.js`,
          });
        }
      }

    } catch (error) {
      // Invalid extension.js, skip
    }

    return duplicates;
  }

  /**
   * Find duplicate values in an array
   */
  findDuplicates(array) {
    const seen = new Set();
    const duplicates = new Set();

    for (const item of array) {
      if (seen.has(item)) {
        duplicates.add(item);
      }
      seen.add(item);
    }

    return Array.from(duplicates);
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
   * Extract keywords from description
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
   * Generate summary of duplicates
   */
  generateSummary(duplicates) {
    const summary = {
      codeImplementations: duplicates.filter(d => d.type === 'code_implementation').length,
      packageJsonViews: duplicates.filter(d => d.type === 'package_json_view').length,
      packageJsonCommands: duplicates.filter(d => d.type === 'package_json_command').length,
      extensionJsProviders: duplicates.filter(d => d.type === 'extension_js_provider').length,
      extensionJsCommands: duplicates.filter(d => d.type === 'extension_js_command').length,
    };

    return summary;
  }
}

let scannerInstance = null;

export function initializeDuplicateScanner(options = {}) {
  if (!scannerInstance) {
    scannerInstance = new DuplicateScanner(options);
  }
  return scannerInstance;
}

export function getDuplicateScanner() {
  if (!scannerInstance) {
    throw new Error('Duplicate scanner not initialized. Call initializeDuplicateScanner first.');
  }
  return scannerInstance;
}
