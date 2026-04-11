/**
 * GITHUB GOVERNANCE ENFORCEMENT
 * 
 * Applies SWEObeyMe governance rules to GitHub workflows:
 * - PRs must not introduce digital debt
 * - Refactors across commits must maintain architecture
 * - Review feedback must follow governance
 * - "Fixes" must not rot the design
 * 
 * Rule: Same governance across commits as across files.
 */

import { enterpriseLogger } from './strict-logger.js';

class GitHubGovernanceEnforcer {
  constructor(config = {}) {
    this.config = {
      repo: config.repo,
      org: config.org,
      branchProtection: config.branchProtection || true,
      requiredReviews: config.requiredReviews || 1,
      requiredChecks: config.requiredChecks || ['test', 'lint'],
      ...config
    };
    
    this.violations = [];
  }

  /**
   * Validate a PR before merge
   */
  async validatePullRequest(prNumber) {
    console.log(`\n🔍 Validating PR #${prNumber} for governance compliance`);

    const checks = [];

    // 1. Check for digital debt introduction
    checks.push({
      name: 'DIGITAL_DEBT_CHECK',
      result: await this.checkDigitalDebt(prNumber)
    });

    // 2. Check architecture compliance
    checks.push({
      name: 'ARCHITECTURE_CHECK',
      result: await this.checkArchitectureCompliance(prNumber)
    });

    // 3. Check separation of concerns
    checks.push({
      name: 'SEPARATION_OF_CONCERNS',
      result: await this.checkSeparationOfConcerns(prNumber)
    });

    // 4. Check commit quality
    checks.push({
      name: 'COMMIT_QUALITY',
      result: await this.checkCommitQuality(prNumber)
    });

    // 5. Check for god files
    checks.push({
      name: 'GOD_FILE_CHECK',
      result: await this.checkGodFiles(prNumber)
    });

    // 6. Verify no governance regressions
    checks.push({
      name: 'NO_REGRESSIONS',
      result: await this.checkGovernanceRegressions(prNumber)
    });

    const failed = checks.filter(c => !c.result.passed);

    if (failed.length > 0) {
      console.log(`\n   ❌ PR #${prNumber} FAILED governance checks:`);
      failed.forEach(f => {
        console.log(`      - ${f.name}: ${f.result.reason}`);
      });

      return {
        passed: false,
        prNumber,
        checks,
        violations: failed,
        recommendation: 'BLOCK_MERGE',
        action: 'Request changes: fix governance issues before merge'
      };
    }

    console.log(`   ✅ PR #${prNumber} PASSED all governance checks`);
    
    return {
      passed: true,
      prNumber,
      checks,
      recommendation: 'APPROVE',
      action: 'Merge allowed - all governance requirements met'
    };
  }

  /**
   * Check if PR introduces new digital debt
   */
  async checkDigitalDebt(prNumber) {
    // Get files changed in PR
    const files = await this.getPRFiles(prNumber);
    
    const debtFlags = [];
    
    for (const file of files) {
      // Check for TODOs without tickets
      if (file.additions.includes('TODO') && !file.additions.includes('ticket:')) {
        debtFlags.push({
          file: file.filename,
          issue: 'TODO_WITHOUT_TICKET',
          line: this.findLine(file.additions, 'TODO')
        });
      }

      // Check for console.log
      if (file.additions.includes('console.log')) {
        debtFlags.push({
          file: file.filename,
          issue: 'DEBUG_CODE',
          line: this.findLine(file.additions, 'console.log')
        });
      }

      // Check for eval usage
      if (file.additions.includes('eval(')) {
        debtFlags.push({
          file: file.filename,
          issue: 'EVAL_USAGE',
          severity: 'HIGH',
          line: this.findLine(file.additions, 'eval(')
        });
      }
    }

    const hasDebt = debtFlags.length > 0;

    if (hasDebt) {
      enterpriseLogger.logToolCall(
        'governance_check',
        { pr: prNumber, check: 'digital_debt' },
        { passed: false, flags: debtFlags },
        { enterpriseMode: 'audited_logged' }
      );
    }

    return {
      passed: !hasDebt,
      debtFlags,
      reason: hasDebt ? `Found ${debtFlags.length} instances of digital debt` : null
    };
  }

  /**
   * Check architecture compliance
   */
  async checkArchitectureCompliance(prNumber) {
    const files = await this.getPRFiles(prNumber);
    
    // Load project architecture rules
    const rules = await this.loadArchitectureRules();
    
    const violations = [];

    for (const file of files) {
      // Check layer violations
      if (file.filename.startsWith('src/ui/') && file.additions.includes('db.query')) {
        violations.push({
          file: file.filename,
          violation: 'UI_LAYER_ACCESSES_DB',
          rule: 'ui_should_not_access_database_directly'
        });
      }

      // Check for circular dependencies
      if (file.additions.includes('import') && file.filename.includes('utils')) {
        const imports = this.extractImports(file.additions);
        if (imports.some(i => i.includes(file.filename.replace('.js', '')))) {
          violations.push({
            file: file.filename,
            violation: 'CIRCULAR_DEPENDENCY',
            rule: 'no_circular_dependencies'
          });
        }
      }
    }

    return {
      passed: violations.length === 0,
      violations,
      reason: violations.length > 0 ? `Architecture violations: ${violations.length}` : null
    };
  }

  /**
   * Check separation of concerns
   */
  async checkSeparationOfConcerns(prNumber) {
    const files = await this.getPRFiles(prNumber);
    
    const mixedConcerns = [];

    for (const file of files) {
      const concerns = this.identifyConcerns(file.additions);
      
      // File should have primary concern only
      if (concerns.length > 2) {
        mixedConcerns.push({
          file: file.filename,
          concerns,
          severity: concerns.length > 3 ? 'HIGH' : 'MEDIUM'
        });
      }
    }

    return {
      passed: mixedConcerns.filter(m => m.severity === 'HIGH').length === 0,
      mixedConcerns,
      reason: mixedConcerns.length > 0 ? 'Separation of concerns violations detected' : null
    };
  }

  /**
   * Check commit quality
   */
  async checkCommitQuality(prNumber) {
    const commits = await this.getPRCommits(prNumber);
    
    const issues = [];

    for (const commit of commits) {
      // Check message length
      if (commit.message.length < 10) {
        issues.push({
          commit: commit.sha,
          issue: 'COMMIT_MESSAGE_TOO_SHORT',
          message: commit.message
        });
      }

      // Check for conventional commits
      const validPrefixes = ['feat:', 'fix:', 'refactor:', 'docs:', 'test:', 'chore:'];
      if (!validPrefixes.some(p => commit.message.startsWith(p))) {
        issues.push({
          commit: commit.sha,
          issue: 'NON_CONVENTIONAL_COMMIT',
          message: commit.message
        });
      }

      // Check for WIP commits
      if (commit.message.toLowerCase().includes('wip') || 
          commit.message.toLowerCase().includes('work in progress')) {
        issues.push({
          commit: commit.sha,
          issue: 'WIP_COMMIT',
          message: commit.message,
          severity: 'HIGH'
        });
      }
    }

    return {
      passed: issues.filter(i => i.severity === 'HIGH').length === 0,
      issues,
      reason: issues.length > 0 ? `${issues.length} commit quality issues` : null
    };
  }

  /**
   * Check for god files
   */
  async checkGodFiles(prNumber) {
    const files = await this.getPRFiles(prNumber);
    
    const godFiles = [];

    for (const file of files) {
      const lineCount = file.additions.split('\n').length;
      
      if (lineCount > 700) {
        godFiles.push({
          file: file.filename,
          lines: lineCount,
          severity: lineCount > 1000 ? 'CRITICAL' : 'HIGH',
          rule: 'max_lines_700'
        });
      }
    }

    return {
      passed: godFiles.filter(g => g.severity === 'CRITICAL').length === 0,
      godFiles,
      reason: godFiles.length > 0 ? `${godFiles.length} files exceed line limits` : null
    };
  }

  /**
   * Check for governance regressions
   */
  async checkGovernanceRegressions(prNumber) {
    // Compare PR state vs base state
    const baseMetrics = await this.getBaseMetrics();
    const prMetrics = await this.getPRMetrics(prNumber);

    const regressions = [];

    // Check if complexity increased
    if (prMetrics.avgComplexity > baseMetrics.avgComplexity * 1.1) {
      regressions.push({
        type: 'COMPLEXITY_INCREASE',
        base: baseMetrics.avgComplexity,
        pr: prMetrics.avgComplexity
      });
    }

    // Check if test coverage decreased
    if (prMetrics.testCoverage < baseMetrics.testCoverage - 5) {
      regressions.push({
        type: 'COVERAGE_DECREASE',
        base: baseMetrics.testCoverage,
        pr: prMetrics.testCoverage
      });
    }

    // Check if debt increased
    if (prMetrics.debtScore > baseMetrics.debtScore) {
      regressions.push({
        type: 'DEBT_INCREASE',
        base: baseMetrics.debtScore,
        pr: prMetrics.debtScore
      });
    }

    return {
      passed: regressions.length === 0,
      regressions,
      reason: regressions.length > 0 ? 'Governance regressions detected' : null
    };
  }

  /**
   * Validate review feedback compliance
   */
  async validateReviewFeedback(prNumber, feedback) {
    console.log(`\n💬 Validating review feedback for PR #${prNumber}`);

    // Check if feedback would introduce violations
    const projectedViolations = [];

    for (const item of feedback) {
      // Simulate applying the feedback
      const projected = await this.simulateFeedbackApplication(item);
      
      if (projected.violations.length > 0) {
        projectedViolations.push({
          feedbackItem: item,
          wouldIntroduce: projected.violations
        });
      }
    }

    if (projectedViolations.length > 0) {
      return {
        approved: false,
        reason: 'Feedback would introduce governance violations',
        projectedViolations,
        recommendation: 'Rework feedback to maintain governance'
      };
    }

    return {
      approved: true,
      reason: 'Feedback maintains governance standards'
    };
  }

  /**
   * Enforce merge requirements
   */
  async enforceMergeRequirements(prNumber) {
    const governanceCheck = await this.validatePullRequest(prNumber);
    
    if (!governanceCheck.passed) {
      return {
        canMerge: false,
        blockers: governanceCheck.violations,
        action: 'BLOCKED_BY_GOVERNANCE'
      };
    }

    // Check other requirements
    const requirements = [
      { name: 'reviews', check: () => this.checkReviewCount(prNumber) },
      { name: 'checks', check: () => this.checkRequiredChecks(prNumber) },
      { name: 'up_to_date', check: () => this.checkBranchUpToDate(prNumber) }
    ];

    const failed = [];
    for (const req of requirements) {
      const result = await req.check();
      if (!result.passed) {
        failed.push({ name: req.name, reason: result.reason });
      }
    }

    if (failed.length > 0) {
      return {
        canMerge: false,
        blockers: failed,
        action: 'BLOCKED_BY_REQUIREMENTS'
      };
    }

    return {
      canMerge: true,
      action: 'MERGE_ALLOWED',
      governance: governanceCheck
    };
  }

  // Helper methods (would use actual GitHub API in production)

  async getPRFiles(prNumber) {
    // Simulated - would call GitHub API
    return [
      { filename: 'src/module.js', additions: '...code...', deletions: '...' }
    ];
  }

  async getPRCommits(prNumber) {
    // Simulated
    return [
      { sha: 'abc123', message: 'refactor: update module structure' }
    ];
  }

  async loadArchitectureRules() {
    return {
      layers: ['ui', 'business', 'data', 'api'],
      dependencies: {
        ui: ['business'],
        business: ['data', 'api'],
        data: [],
        api: []
      }
    };
  }

  identifyConcerns(code) {
    const concerns = [];
    if (code.includes('render') || code.includes('DOM')) concerns.push('UI');
    if (code.includes('db') || code.includes('query')) concerns.push('Data');
    if (code.includes('fetch') || code.includes('api')) concerns.push('API');
    if (code.includes('validate') || code.includes('process')) concerns.push('Business');
    return concerns;
  }

  findLine(code, pattern) {
    const lines = code.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(pattern)) return i + 1;
    }
    return -1;
  }

  extractImports(code) {
    const importRegex = /import\s+.*?\s+from\s+['"](.+?)['"];?/g;
    const imports = [];
    let match;
    while ((match = importRegex.exec(code)) !== null) {
      imports.push(match[1]);
    }
    return imports;
  }

  async getBaseMetrics() {
    return { avgComplexity: 5, testCoverage: 80, debtScore: 10 };
  }

  async getPRMetrics(prNumber) {
    return { avgComplexity: 5.2, testCoverage: 79, debtScore: 12 };
  }

  async simulateFeedbackApplication(feedback) {
    return { violations: [] };
  }

  async checkReviewCount(prNumber) {
    return { passed: true, count: 2 };
  }

  async checkRequiredChecks(prNumber) {
    return { passed: true, checks: ['test', 'lint'] };
  }

  async checkBranchUpToDate(prNumber) {
    return { passed: true };
  }
}

// Export
export { GitHubGovernanceEnforcer };
export default GitHubGovernanceEnforcer;
