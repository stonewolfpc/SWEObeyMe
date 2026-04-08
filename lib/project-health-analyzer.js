/**
 * Project Health Analyzer
 * Analyzes scan results to generate health scores and recommendations
 */

export class ProjectHealthAnalyzer {
  constructor(scanResults) {
    this.scanResults = scanResults;
    this.healthScore = 0;
    this.recommendations = [];
  }

  /**
   * Analyze project health
   */
  analyze() {
    this.calculateHealthScore();
    this.generateRecommendations();

    return {
      healthScore: this.healthScore,
      grade: this.getGrade(),
      summary: this.getSummary(),
      recommendations: this.recommendations,
      structuralIssues: this.getStructuralIssues(),
      missingItems: this.getMissingItems(),
      potentialRefactors: this.getPotentialRefactors(),
    };
  }

  /**
   * Calculate overall health score (0-100)
   */
  calculateHealthScore() {
    let score = 100;

    // Deduct for code smells
    const codeSmellDeduction = this.scanResults.codeSmells.length * 5;
    score -= Math.min(codeSmellDeduction, 20);

    // Deduct for digital debt
    const digitalDebtDeduction = this.scanResults.digitalDebt.length * 3;
    score -= Math.min(digitalDebtDeduction, 15);

    // Deduct for architecture drift
    const architectureDriftDeduction = this.scanResults.architectureDrift.length * 10;
    score -= Math.min(architectureDriftDeduction, 25);

    // Deduct for missing documentation
    const missingDocDeduction = this.scanResults.missingDocumentation.length * 8;
    score -= Math.min(missingDocDeduction, 20);

    // Deduct for missing tests
    const missingTestDeduction = this.scanResults.missingTests.length * 7;
    score -= Math.min(missingTestDeduction, 15);

    // Deduct for inconsistent naming
    const namingDeduction = this.scanResults.inconsistentNaming.length * 2;
    score -= Math.min(namingDeduction, 10);

    // Deduct for missing module boundaries
    const boundaryDeduction = this.scanResults.missingModuleBoundaries.length * 10;
    score -= Math.min(boundaryDeduction, 20);

    this.healthScore = Math.max(0, score);
  }

  /**
   * Get health grade
   */
  getGrade() {
    if (this.healthScore >= 90) return 'A';
    if (this.healthScore >= 80) return 'B';
    if (this.healthScore >= 70) return 'C';
    if (this.healthScore >= 60) return 'D';
    return 'F';
  }

  /**
   * Get summary
   */
  getSummary() {
    return {
      totalFiles: this.scanResults.files.length,
      totalFolders: this.scanResults.folders.length,
      healthScore: this.healthScore,
      grade: this.getGrade(),
      issues: {
        codeSmells: this.scanResults.codeSmells.length,
        digitalDebt: this.scanResults.digitalDebt.length,
        architectureDrift: this.scanResults.architectureDrift.length,
        missingDocumentation: this.scanResults.missingDocumentation.length,
        missingTests: this.scanResults.missingTests.length,
        inconsistentNaming: this.scanResults.inconsistentNaming.length,
        missingModuleBoundaries: this.scanResults.missingModuleBoundaries.length,
      },
    };
  }

  /**
   * Generate recommendations
   */
  generateRecommendations() {
    this.recommendations = [];

    // Code smell recommendations
    if (this.scanResults.codeSmells.length > 0) {
      this.recommendations.push({
        priority: 'high',
        category: 'Code Quality',
        message: `Fix ${this.scanResults.codeSmells.length} code smell(s)`,
        details: this.scanResults.codeSmells.slice(0, 3),
      });
    }

    // Architecture drift recommendations
    if (this.scanResults.architectureDrift.length > 0) {
      this.recommendations.push({
        priority: 'high',
        category: 'Architecture',
        message: `Address ${this.scanResults.architectureDrift.length} architecture drift issue(s)`,
        details: this.scanResults.architectureDrift,
      });
    }

    // Missing documentation recommendations
    if (this.scanResults.missingDocumentation.length > 0) {
      this.recommendations.push({
        priority: 'medium',
        category: 'Documentation',
        message: `Add missing documentation (${this.scanResults.missingDocumentation.length} item(s))`,
        details: this.scanResults.missingDocumentation,
      });
    }

    // Missing tests recommendations
    if (this.scanResults.missingTests.length > 0) {
      this.recommendations.push({
        priority: 'medium',
        category: 'Testing',
        message: `Add tests (${this.scanResults.missingTests.length} issue(s))`,
        details: this.scanResults.missingTests,
      });
    }

    // Naming consistency recommendations
    if (this.scanResults.inconsistentNaming.length > 0) {
      this.recommendations.push({
        priority: 'low',
        category: 'Naming',
        message: `Fix ${this.scanResults.inconsistentNaming.length} naming inconsistency(ies)`,
        details: this.scanResults.inconsistentNaming.slice(0, 3),
      });
    }

    // Module boundary recommendations
    if (this.scanResults.missingModuleBoundaries.length > 0) {
      this.recommendations.push({
        priority: 'high',
        category: 'Structure',
        message: `Establish module boundaries (${this.scanResults.missingModuleBoundaries.length} issue(s))`,
        details: this.scanResults.missingModuleBoundaries,
      });
    }
  }

  /**
   * Get structural issues
   */
  getStructuralIssues() {
    return {
      architectureDrift: this.scanResults.architectureDrift,
      missingModuleBoundaries: this.scanResults.missingModuleBoundaries,
      inconsistentNaming: this.scanResults.inconsistentNaming,
    };
  }

  /**
   * Get missing items
   */
  getMissingItems() {
    return {
      documentation: this.scanResults.missingDocumentation,
      tests: this.scanResults.missingTests,
    };
  }

  /**
   * Get potential refactors
   */
  getPotentialRefactors() {
    const refactors = [];

    // Suggest refactoring for large files
    const largeFiles = this.scanResults.codeSmells.filter(smell => smell.type === 'long_file');
    if (largeFiles.length > 0) {
      refactors.push({
        type: 'split_large_files',
        message: `Split ${largeFiles.length} large file(s) into smaller modules`,
        files: largeFiles.map(f => f.file),
      });
    }

    // Suggest refactoring for deep nesting
    const deeplyNested = this.scanResults.codeSmells.filter(smell => smell.type === 'deep_nesting');
    if (deeplyNested.length > 0) {
      refactors.push({
        type: 'reduce_nesting',
        message: `Reduce nesting in ${deeplyNested.length} file(s)`,
        files: deeplyNested.map(f => f.file),
      });
    }

    return refactors;
  }
}
