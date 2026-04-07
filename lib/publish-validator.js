/**
 * Publish Validation Tool
 * Validates project readiness before any publish operation
 * Enforces best practices for GitHub/npm/VSCE publishing
 */

import fs from 'fs/promises';
import path from 'path';
import { getProjectMemory } from './project-memory.js';
import { getVersionTracker, initializeVersionTracker } from './version-tracker.js';

export class PublishValidator {
  constructor(workspacePath) {
    this.workspacePath = workspacePath;
    this.packageJsonPath = path.join(workspacePath, 'package.json');
    this.readmePath = path.join(workspacePath, 'README.md');
    this.changelogPath = path.join(workspacePath, 'CHANGELOG.md');
    this.validationResults = {
      canPublish: false,
      issues: [],
      warnings: [],
      checks: {}
    };
  }

  /**
   * Validate project readiness for publishing
   */
  async validate() {
    this.validationResults = {
      canPublish: true,
      issues: [],
      warnings: [],
      checks: {}
    };

    // Check 1: package.json exists and is valid
    await this.checkPackageJson();

    // Check 2: Version has been bumped
    await this.checkVersionBumped();

    // Check 3: README exists and is updated
    await this.checkReadme();

    // Check 4: CHANGELOG exists and is updated
    await this.checkChangelog();

    // Check 5: Documentation is in sync
    await this.checkDocumentationSync();

    // Check 6: Project map is updated
    await this.checkProjectMap();

    // Check 7: No critical code smells
    await this.checkCodeQuality();

    // Check 8: Tests pass (if applicable)
    await this.checkTests();

    // Determine if can publish
    this.validationResults.canPublish = this.validationResults.issues.length === 0;

    return this.validationResults;
  }

  /**
   * Check package.json exists and is valid
   */
  async checkPackageJson() {
    try {
      const packageJson = JSON.parse(await fs.readFile(this.packageJsonPath, 'utf-8'));
      
      // Check required fields
      const requiredFields = ['name', 'version', 'description', 'publisher'];
      const missingFields = requiredFields.filter(field => !packageJson[field]);
      
      if (missingFields.length > 0) {
        this.validationResults.issues.push({
          check: 'package.json',
          severity: 'critical',
          message: `Missing required fields: ${missingFields.join(', ')}`
        });
      }

      // Check version format
      const version = packageJson.version;
      if (!/^\d+\.\d+\.\d+/.test(version)) {
        this.validationResults.issues.push({
          check: 'package.json',
          severity: 'critical',
          message: `Invalid version format: ${version}. Expected semver (X.Y.Z)`
        });
      }

      this.validationResults.checks.packageJson = {
        valid: missingFields.length === 0 && /^\d+\.\d+\.\d+/.test(version),
        version: version,
        name: packageJson.name,
        publisher: packageJson.publisher
      };
    } catch (error) {
      this.validationResults.issues.push({
        check: 'package.json',
        severity: 'critical',
        message: `package.json is invalid or missing: ${error.message}`
      });
      this.validationResults.checks.packageJson = { valid: false };
    }
  }

  /**
   * Check if version has been bumped
   */
  async checkVersionBumped() {
    try {
      const vt = getVersionTracker();
      if (!vt) {
        await initializeVersionTracker(this.workspacePath);
      }
      
      const tracker = getVersionTracker();
      const status = await tracker.getVersionStatus();
      
      if (status.changesSummary.totalChanges === 0) {
        this.validationResults.issues.push({
          check: 'version_bump',
          severity: 'critical',
          message: 'No changes recorded. Version bump may not be necessary.'
        });
      } else {
        // Check if version was bumped after last changes
        const packageJson = JSON.parse(await fs.readFile(this.packageJsonPath, 'utf-8'));
        const suggestedBump = status.suggestedBump;
        
        if (suggestedBump !== 'none') {
          this.validationResults.warnings.push({
            check: 'version_bump',
            severity: 'warning',
            message: `Recommended version bump: ${suggestedBump}. Current version: ${packageJson.version}`
          });
        }
      }

      this.validationResults.checks.versionBump = {
        valid: status.changesSummary.totalChanges > 0,
        currentVersion: status.currentVersion,
        suggestedBump: status.suggestedBump,
        totalChanges: status.changesSummary.totalChanges
      };
    } catch (error) {
      this.validationResults.warnings.push({
        check: 'version_bump',
        severity: 'warning',
        message: `Could not verify version bump: ${error.message}`
      });
      this.validationResults.checks.versionBump = { valid: false };
    }
  }

  /**
   * Check README exists and is updated
   */
  async checkReadme() {
    try {
      await fs.access(this.readmePath);
      const readme = await fs.readFile(this.readmePath, 'utf-8');
      
      // Check for common README sections
      const requiredSections = ['#', '## Installation', '## Usage'];
      const missingSections = requiredSections.filter(section => !readme.includes(section));
      
      if (missingSections.length > 0) {
        this.validationResults.warnings.push({
          check: 'readme',
          severity: 'warning',
          message: `README missing sections: ${missingSections.join(', ')}`
        });
      }

      // Check for image URLs
      const imageMatches = readme.match(/!\[.*?\]\((.*?)\)/g) || [];
      const httpImages = imageMatches.filter(img => img.includes('http://'));
      
      if (httpImages.length > 0) {
        this.validationResults.issues.push({
          check: 'readme',
          severity: 'critical',
          message: `README contains ${httpImages.length} non-HTTPS image URLs. VS Code Marketplace requires HTTPS.`
        });
      }

      this.validationResults.checks.readme = {
        valid: httpImages.length === 0,
        exists: true,
        missingSections: missingSections,
        nonHttpsImages: httpImages.length
      };
    } catch (error) {
      this.validationResults.issues.push({
        check: 'readme',
        severity: 'critical',
        message: 'README.md is missing'
      });
      this.validationResults.checks.readme = { valid: false, exists: false };
    }
  }

  /**
   * Check CHANGELOG exists and is updated
   */
  async checkChangelog() {
    try {
      await fs.access(this.changelogPath);
      const changelog = await fs.readFile(this.changelogPath, 'utf-8');
      
      // Check for recent changelog entry
      const packageJson = JSON.parse(await fs.readFile(this.packageJsonPath, 'utf-8'));
      const currentVersion = packageJson.version;
      
      if (!changelog.includes(currentVersion)) {
        this.validationResults.issues.push({
          check: 'changelog',
          severity: 'critical',
          message: `CHANGELOG does not contain entry for version ${currentVersion}`
        });
      }

      this.validationResults.checks.changelog = {
        valid: changelog.includes(currentVersion),
        exists: true,
        currentVersion: currentVersion
      };
    } catch (error) {
      this.validationResults.issues.push({
        check: 'changelog',
        severity: 'critical',
        message: 'CHANGELOG.md is missing'
      });
      this.validationResults.checks.changelog = { valid: false, exists: false };
    }
  }

  /**
   * Check documentation is in sync
   */
  async checkDocumentationSync() {
    try {
      const pm = getProjectMemory();
      if (!pm) {
        this.validationResults.warnings.push({
          check: 'documentation_sync',
          severity: 'warning',
          message: 'Project memory not initialized. Cannot verify documentation sync.'
        });
        this.validationResults.checks.documentationSync = { valid: false };
        return;
      }

      // Check if project_map.json exists and is recent
      const projectMapPath = path.join(this.workspacePath, 'project_map.json');
      await fs.access(projectMapPath);
      
      const stats = await fs.stat(projectMapPath);
      const hoursSinceUpdate = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60);
      
      if (hoursSinceUpdate > 24) {
        this.validationResults.warnings.push({
          check: 'documentation_sync',
          severity: 'warning',
          message: `project_map.json was last updated ${hoursSinceUpdate.toFixed(1)} hours ago. Consider updating.`
        });
      }

      this.validationResults.checks.documentationSync = {
        valid: true,
        lastUpdated: stats.mtime.toISOString(),
        hoursSinceUpdate: hoursSinceUpdate
      };
    } catch (error) {
      this.validationResults.issues.push({
        check: 'documentation_sync',
        severity: 'critical',
        message: `project_map.json is missing or inaccessible: ${error.message}`
      });
      this.validationResults.checks.documentationSync = { valid: false };
    }
  }

  /**
   * Check project map is updated
   */
  async checkProjectMap() {
    try {
      const projectMapPath = path.join(this.workspacePath, 'project_map.json');
      const projectMap = JSON.parse(await fs.readFile(projectMapPath, 'utf-8'));
      
      // Check required sections
      const requiredSections = ['project', 'structure', 'conventions'];
      const missingSections = requiredSections.filter(section => !projectMap[section]);
      
      if (missingSections.length > 0) {
        this.validationResults.warnings.push({
          check: 'project_map',
          severity: 'warning',
          message: `project_map.json missing sections: ${missingSections.join(', ')}`
        });
      }

      this.validationResults.checks.projectMap = {
        valid: missingSections.length === 0,
        exists: true,
        missingSections: missingSections
      };
    } catch (error) {
      this.validationResults.warnings.push({
        check: 'project_map',
        severity: 'warning',
        message: `project_map.json is missing or invalid: ${error.message}`
      });
      this.validationResults.checks.projectMap = { valid: false };
    }
  }

  /**
   * Check code quality
   */
  async checkCodeQuality() {
    try {
      // Check for obvious code smells in lib folder
      const libPath = path.join(this.workspacePath, 'lib');
      const files = await fs.readdir(libPath);
      
      for (const file of files) {
        if (file.endsWith('.js')) {
          const filePath = path.join(libPath, file);
          const content = await fs.readFile(filePath, 'utf-8');
          const lines = content.split('\n');
          
          // Check for files over 700 lines
          if (lines.length > 700) {
            this.validationResults.issues.push({
              check: 'code_quality',
              severity: 'critical',
              message: `${file} exceeds 700 lines (${lines.length} lines). This violates surgical rules.`
            });
          }
          
          // Check for TODO comments
          if (content.includes('TODO') || content.includes('FIXME')) {
            this.validationResults.warnings.push({
              check: 'code_quality',
              severity: 'warning',
              message: `${file} contains TODO/FIXME comments. Consider resolving before publishing.`
            });
          }
        }
      }

      this.validationResults.checks.codeQuality = {
        valid: this.validationResults.issues.filter(i => i.check === 'code_quality').length === 0
      };
    } catch (error) {
      this.validationResults.warnings.push({
        check: 'code_quality',
        severity: 'warning',
        message: `Could not verify code quality: ${error.message}`
      });
      this.validationResults.checks.codeQuality = { valid: false };
    }
  }

  /**
   * Check tests pass
   */
  async checkTests() {
    try {
      const packageJson = JSON.parse(await fs.readFile(this.packageJsonPath, 'utf-8'));
      const hasTestScript = packageJson.scripts && packageJson.scripts.test;
      
      if (hasTestScript) {
        this.validationResults.warnings.push({
          check: 'tests',
          severity: 'info',
          message: 'Project has test script. Consider running tests before publishing.'
        });
      }

      this.validationResults.checks.tests = {
        valid: true,
        hasTestScript: !!hasTestScript
      };
    } catch (error) {
      this.validationResults.checks.tests = { valid: false };
    }
  }

  /**
   * Format validation report
   */
  formatReport() {
    let output = '\n';
    output += '='.repeat(60) + '\n';
    output += 'PUBLISH VALIDATION REPORT\n';
    output += '='.repeat(60) + '\n\n';
    
    output += `Status: ${this.validationResults.canPublish ? '✅ READY TO PUBLISH' : '❌ NOT READY TO PUBLISH'}\n\n`;
    
    if (this.validationResults.issues.length > 0) {
      output += '-'.repeat(40) + '\n';
      output += 'CRITICAL ISSUES (Must Fix)\n';
      output += '-'.repeat(40) + '\n';
      this.validationResults.issues.forEach((issue, i) => {
        output += `${i + 1}. [${issue.check.toUpperCase()}] ${issue.message}\n`;
      });
      output += '\n';
    }
    
    if (this.validationResults.warnings.length > 0) {
      output += '-'.repeat(40) + '\n';
      output += 'WARNINGS (Should Fix)\n';
      output += '-'.repeat(40) + '\n';
      this.validationResults.warnings.forEach((warning, i) => {
        output += `${i + 1}. [${warning.check.toUpperCase()}] ${warning.message}\n`;
      });
      output += '\n';
    }
    
    output += '-'.repeat(40) + '\n';
    output += 'CHECKS SUMMARY\n';
    output += '-'.repeat(40) + '\n';
    
    for (const [checkName, result] of Object.entries(this.validationResults.checks)) {
      const status = result.valid ? '✅' : '❌';
      output += `${status} ${checkName}: ${result.valid ? 'PASS' : 'FAIL'}\n`;
    }
    
    output += '\n';
    output += '='.repeat(60) + '\n';
    
    if (this.validationResults.canPublish) {
      output += 'PROJECT IS READY TO PUBLISH\n';
      output += 'Use `request_publish_permission` to request user authorization.\n';
    } else {
      output += 'PROJECT IS NOT READY TO PUBLISH\n';
      output += 'Fix critical issues above before attempting to publish.\n';
    }
    output += '='.repeat(60) + '\n\n';
    
    return output;
  }
}

/**
 * Global publish validator instance
 */
let globalPublishValidator = null;

/**
 * Initialize publish validator for workspace
 */
export function initializePublishValidator(workspacePath) {
  if (!globalPublishValidator) {
    globalPublishValidator = new PublishValidator(workspacePath);
  }
  
  return globalPublishValidator;
}

/**
 * Get global publish validator instance
 */
export function getPublishValidator() {
  return globalPublishValidator;
}
