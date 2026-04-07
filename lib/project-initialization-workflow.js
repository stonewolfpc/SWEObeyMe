/**
 * Project Initialization Workflow
 * Orchestrates the scan → build map → generate report → wait sequence
 */

import { initializeProjectScanner, getProjectScanner } from './project-scanner.js';
import { ProjectHealthAnalyzer } from './project-health-analyzer.js';
import { initializeProjectMemory, getProjectMemory } from './project-memory.js';
import fs from 'fs/promises';
import path from 'path';

export class ProjectInitializationWorkflow {
  constructor(workspacePath) {
    this.workspacePath = workspacePath;
    this.statePath = path.join(workspacePath, '.sweobeyme-init-state.json');
    this.state = {
      scanned: false,
      reportGenerated: false,
      userApproved: false,
      lastScanTime: null,
      lastApprovalTime: null
    };
  }

  /**
   * Detect if project is new or unfamiliar
   */
  async detectNewProject() {
    try {
      // Check for project_map.json
      const hasProjectMap = await fs.access(path.join(this.workspacePath, 'project_map.json'))
        .then(() => true)
        .catch(() => false);
      
      // Check for .sweobeyme_state
      const hasState = await fs.access(this.statePath)
        .then(() => true)
        .catch(() => false);
      
      // Load state if exists
      if (hasState) {
        const stateData = JSON.parse(await fs.readFile(this.statePath, 'utf-8'));
        this.state = stateData;
      }
      
      // Determine if scan is needed
      const needsScan = !hasProjectMap || !hasState || !this.state.scanned;
      
      return {
        needsScan,
        hasProjectMap,
        hasState,
        lastScanTime: this.state.lastScanTime
      };
    } catch (error) {
      return {
        needsScan: true,
        hasProjectMap: false,
        hasState: false,
        lastScanTime: null
      };
    }
  }

  /**
   * Perform full project scan
   */
  async performScan() {
    console.log('Starting project scan...');
    
    // Initialize scanner
    const scanner = initializeProjectScanner(this.workspacePath);
    
    // Perform scan
    const scanResults = await scanner.scan();
    
    // Update state
    this.state.scanned = true;
    this.state.lastScanTime = new Date().toISOString();
    await this.saveState();
    
    return scanResults;
  }

  /**
   * Build or update project map
   */
  async buildProjectMap(scanResults) {
    console.log('Building project map...');
    
    // Initialize project memory
    const pm = await initializeProjectMemory(this.workspacePath);
    
    // Index structure
    await pm.indexStructure();
    
    // Analyze conventions
    await pm.analyzeConventions();
    
    // Save project map
    await pm.save();
    
    // Update project map with scan results
    if (pm.projectMap) {
      pm.projectMap.audit.lastValidation = new Date().toISOString();
      pm.projectMap.audit.lastScan = this.state.lastScanTime;
      await pm.saveProjectMap();
    }
    
    return pm;
  }

  /**
   * Generate report for user
   */
  async generateReport(scanResults) {
    console.log('Generating project health report...');
    
    // Analyze health
    const analyzer = new ProjectHealthAnalyzer(scanResults);
    const healthAnalysis = analyzer.analyze();
    
    // Generate report
    const report = {
      timestamp: new Date().toISOString(),
      project: path.basename(this.workspacePath),
      summary: healthAnalysis.summary,
      healthScore: healthAnalysis.healthScore,
      grade: healthAnalysis.grade,
      recommendations: healthAnalysis.recommendations,
      structuralIssues: healthAnalysis.structuralIssues,
      missingItems: healthAnalysis.missingItems,
      potentialRefactors: healthAnalysis.potentialRefactors,
      scanResults: {
        totalFiles: scanResults.files.length,
        totalFolders: scanResults.folders.length,
        fileTypes: Object.fromEntries(scanResults.fileTypes)
      }
    };
    
    // Update state
    this.state.reportGenerated = true;
    await this.saveState();
    
    return report;
  }

  /**
   * Format report for user
   */
  formatReport(report) {
    let output = '\n';
    output += '='.repeat(60) + '\n';
    output += 'PROJECT HEALTH REPORT\n';
    output += '='.repeat(60) + '\n\n';
    
    output += `Project: ${report.project}\n`;
    output += `Health Score: ${report.healthScore}/100 (${report.grade})\n`;
    output += `Scanned at: ${report.timestamp}\n\n`;
    
    output += '-'.repeat(40) + '\n';
    output += 'SUMMARY\n';
    output += '-'.repeat(40) + '\n';
    output += `Total Files: ${report.summary.totalFiles}\n`;
    output += `Total Folders: ${report.summary.totalFolders}\n`;
    output += `Code Smells: ${report.summary.issues.codeSmells}\n`;
    output += `Digital Debt: ${report.summary.issues.digitalDebt}\n`;
    output += `Architecture Drift: ${report.summary.issues.architectureDrift}\n`;
    output += `Missing Documentation: ${report.summary.issues.missingDocumentation}\n`;
    output += `Missing Tests: ${report.summary.issues.missingTests}\n\n`;
    
    if (report.recommendations.length > 0) {
      output += '-'.repeat(40) + '\n';
      output += 'RECOMMENDATIONS\n';
      output += '-'.repeat(40) + '\n';
      report.recommendations.forEach((rec, i) => {
        output += `${i + 1}. [${rec.priority.toUpperCase()}] ${rec.category}: ${rec.message}\n`;
      });
      output += '\n';
    }
    
    if (report.structuralIssues.architectureDrift.length > 0 || 
        report.structuralIssues.missingModuleBoundaries.length > 0) {
      output += '-'.repeat(40) + '\n';
      output += 'STRUCTURAL ISSUES\n';
      output += '-'.repeat(40) + '\n';
      
      if (report.structuralIssues.architectureDrift.length > 0) {
        output += `Architecture Drift (${report.structuralIssues.architectureDrift.length}):\n`;
        report.structuralIssues.architectureDrift.forEach(issue => {
          output += `  - ${issue.message}\n`;
        });
      }
      
      if (report.structuralIssues.missingModuleBoundaries.length > 0) {
        output += `Missing Module Boundaries (${report.structuralIssues.missingModuleBoundaries.length}):\n`;
        report.structuralIssues.missingModuleBoundaries.forEach(issue => {
          output += `  - ${issue.message}\n`;
        });
      }
      output += '\n';
    }
    
    if (report.missingItems.documentation.length > 0 || 
        report.missingItems.tests.length > 0) {
      output += '-'.repeat(40) + '\n';
      output += 'MISSING ITEMS\n';
      output += '-'.repeat(40) + '\n';
      
      if (report.missingItems.documentation.length > 0) {
        output += `Documentation (${report.missingItems.documentation.length}):\n`;
        report.missingItems.documentation.forEach(item => {
          output += `  - ${item.message}\n`;
        });
      }
      
      if (report.missingItems.tests.length > 0) {
        output += `Tests (${report.missingItems.tests.length}):\n`;
        report.missingItems.tests.forEach(item => {
          output += `  - ${item.message}\n`;
        });
      }
      output += '\n';
    }
    
    output += '='.repeat(60) + '\n';
    output += 'USER ACTION REQUIRED\n';
    output += '='.repeat(60) + '\n';
    output += 'SWEObeyMe has completed the project scan.\n';
    output += 'Please review the report above and choose an action:\n\n';
    output += 'Options:\n';
    output += '  - "Proceed" - Continue with the task\n';
    output += '  - "Fix everything" - Auto-fix all issues\n';
    output += '  - "Fix only [category]" - Fix specific category\n';
    output += '  - "Ignore [category]" - Ignore specific category\n';
    output += '  - "Start the task now" - Skip fixes and begin task\n';
    output += '\n';
    
    return output;
  }

  /**
   * Wait for user approval
   */
  async waitForApproval() {
    this.state.userApproved = false;
    await this.saveState();
    
    return {
      awaitingApproval: true,
      message: 'Waiting for user approval to proceed'
    };
  }

  /**
   * Grant user approval
   */
  async grantApproval() {
    this.state.userApproved = true;
    this.state.lastApprovalTime = new Date().toISOString();
    await this.saveState();
    
    return {
      approved: true,
      message: 'User approval granted. Proceeding with task.'
    };
  }

  /**
   * Check if approved
   */
  isApproved() {
    return this.state.userApproved === true;
  }

  /**
   * Save state
   */
  async saveState() {
    try {
      await fs.writeFile(this.statePath, JSON.stringify(this.state, null, 2), 'utf-8');
    } catch (error) {
      console.error(`Failed to save initialization state: ${error.message}`);
    }
  }

  /**
   * Run complete initialization workflow
   */
  async run() {
    try {
      // Detect if scan is needed
      const detection = await this.detectNewProject();
      
      if (!detection.needsScan && this.state.userApproved) {
        return {
          status: 'already_approved',
          message: 'Project already scanned and approved. Ready to begin task.'
        };
      }
      
      // Perform scan
      const scanResults = await this.performScan();
      
      // Build project map
      await this.buildProjectMap(scanResults);
      
      // Generate report
      const report = await this.generateReport(scanResults);
      
      // Wait for approval
      await this.waitForApproval();
      
      return {
        status: 'awaiting_approval',
        report: report,
        formattedReport: this.formatReport(report)
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }
}

/**
 * Global initialization workflow instance
 */
let globalInitializationWorkflow = null;

/**
 * Initialize workflow for workspace
 */
export function initializeInitializationWorkflow(workspacePath) {
  if (!globalInitializationWorkflow) {
    globalInitializationWorkflow = new ProjectInitializationWorkflow(workspacePath);
  }
  
  return globalInitializationWorkflow;
}

/**
 * Get global workflow instance
 */
export function getInitializationWorkflow() {
  return globalInitializationWorkflow;
}
