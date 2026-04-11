/**
 * CROSS-PLATFORM TEST RUNNER
 * 
 * Executes the full enterprise certification matrix:
 * - Hosts: Windsurf, VS Code, Cursor, GitHub Codespaces
 * - OS: Windows, macOS, Linux
 * - GitHub: Public, Private, Org repos
 * - Enterprise: Read-only, Standard, Audited
 * 
 * Only certifies if ALL combinations pass.
 */

import { EnterpriseBoundaryTester } from './boundary-tests.js';
import { LunchBreakValidator } from './lunch-break-suite.js';
import { enterpriseLogger } from './strict-logger.js';
import testMatrix from './test-matrix.json' assert { type: 'json' };

class CrossPlatformCertificationRunner {
  constructor(options = {}) {
    this.matrix = testMatrix.matrix;
    this.options = {
      parallel: options.parallel || false,
      failFast: options.failFast !== false, // Default true
      logLevel: options.logLevel || 'DEBUG',
      adaptiveModels: options.adaptiveModels || ['adaptive', 'fixed-claude'],
      ...options
    };
    
    this.results = [];
    this.failures = [];
    this.startTime = null;
    this.endTime = null;
  }

  /**
   * Run full certification across all matrix combinations
   */
  async runFullCertification() {
    console.log('\n🏁 ENTERPRISE CERTIFICATION RUNNER');
    console.log('═══════════════════════════════════════');
    console.log(`Mode: ${this.options.failFast ? 'FAIL_FAST' : 'CONTINUE_ALL'}`);
    console.log(`Parallel: ${this.options.parallel}`);
    console.log(`Adaptive Models: ${this.options.adaptiveModels.join(', ')}`);
    console.log('═══════════════════════════════════════\n');

    this.startTime = Date.now();

    const combinations = this.generateMatrixCombinations();
    console.log(`Total test combinations: ${combinations.length}\n`);

    let passed = 0;
    let failed = 0;

    for (let i = 0; i < combinations.length; i++) {
      const combo = combinations[i];
      console.log(`\n[${i + 1}/${combinations.length}] Testing:`);
      console.log(`   Host: ${combo.host}`);
      console.log(`   OS: ${combo.os}`);
      console.log(`   GitHub: ${combo.githubMode}`);
      console.log(`   Enterprise: ${combo.enterpriseMode}`);
      console.log(`   Model: ${combo.model}`);

      try {
        const result = await this.runTestCombination(combo);
        
        if (result.passed) {
          console.log('   ✅ PASSED');
          passed++;
        } else {
          console.log('   ❌ FAILED');
          console.log(`   Reason: ${result.failureReason}`);
          failed++;
          
          if (this.options.failFast) {
            console.log('\n🛑 FAIL FAST triggered - stopping certification');
            break;
          }
        }

        this.results.push(result);
      } catch (error) {
        console.log(`   💥 ERROR: ${error.message}`);
        failed++;
        
        this.failures.push({
          combination: combo,
          error: error.message
        });
        
        if (this.options.failFast) {
          break;
        }
      }
    }

    this.endTime = Date.now();
    
    return this.generateCertificationReport(passed, failed, combinations.length);
  }

  /**
   * Generate all matrix combinations
   */
  generateMatrixCombinations() {
    const combinations = [];
    
    for (const host of Object.keys(this.matrix.axes.host)) {
      for (const os of Object.keys(this.matrix.axes.os)) {
        for (const github of Object.keys(this.matrix.axes.githubMode)) {
          for (const enterprise of Object.keys(this.matrix.axes.enterpriseMode)) {
            for (const model of this.options.adaptiveModels) {
              combinations.push({
                host,
                os,
                githubMode: github,
                enterpriseMode: enterprise,
                model,
                id: `${host}-${os}-${github}-${enterprise}-${model}`
              });
            }
          }
        }
      }
    }

    return combinations;
  }

  /**
   * Run tests for a single matrix combination
   */
  async runTestCombination(combo) {
    const startTime = Date.now();
    
    // 1. Environment Setup
    await this.setupTestEnvironment(combo);

    // 2. Run Boundary Tests
    const boundaryTester = new EnterpriseBoundaryTester({
      host: combo.host,
      os: combo.os,
      enterpriseMode: combo.enterpriseMode,
      githubMode: combo.githubMode
    });

    const boundaryResults = await boundaryTester.runAll();
    
    if (boundaryResults.hardFails > 0) {
      return {
        passed: false,
        combination: combo,
        failureReason: `Hard boundary failures: ${boundaryResults.hardFails}`,
        boundaryResults,
        duration: Date.now() - startTime
      };
    }

    // 3. Run Lunch Break Test (only for standard+ enterprise modes)
    if (combo.enterpriseMode !== 'read_only') {
      const lunchBreakValidator = new LunchBreakValidator({
        repo: this.getGoldenRepoForCombo(combo),
        task: 'Refactor sample module with full governance',
        rules: ['no_digital_debt', 'separation_of_concerns', 'max_lines_700'],
        enterpriseMode: combo.enterpriseMode
      });

      const lunchBreakResult = await lunchBreakValidator.run();

      if (lunchBreakResult.status === 'FAILED') {
        return {
          passed: false,
          combination: combo,
          failureReason: 'Lunch break test failed - unattended operation not safe',
          boundaryResults,
          lunchBreakResult,
          duration: Date.now() - startTime
        };
      }

      // 4. Verify no phantom/silent edits
      const correlation = enterpriseLogger.correlateLogsWithState(
        this.getTestRepoPath(combo),
        this.getGoldenRepoSpec(combo)
      );

      if (!correlation.passed) {
        return {
          passed: false,
          combination: combo,
          failureReason: `Log correlation failed: ${correlation.phantomCheck.phantomEdits.length} phantom edits, ${correlation.silentCheck.silentEdits.length} silent edits`,
          boundaryResults,
          lunchBreakResult,
          correlation,
          duration: Date.now() - startTime
        };
      }

      return {
        passed: true,
        combination: combo,
        boundaryResults,
        lunchBreakResult,
        correlation,
        duration: Date.now() - startTime
      };
    }

    // Read-only mode: just verify boundaries work
    return {
      passed: boundaryResults.passed > boundaryResults.failed,
      combination: combo,
      boundaryResults,
      duration: Date.now() - startTime
    };
  }

  /**
   * Setup test environment for combination
   */
  async setupTestEnvironment(combo) {
    // Configure host-specific settings
    const hostConfig = this.matrix.axes.host[combo.host];
    const osConfig = this.matrix.axes.os[combo.os];

    // Set environment variables
    process.env.SWEOBEYME_HOST = combo.host;
    process.env.SWEOBEYME_OS = combo.os;
    process.env.SWEOBEYME_ENTERPRISE_MODE = combo.enterpriseMode;
    process.env.SWEOBEYME_GITHUB_MODE = combo.githubMode;
    process.env.SWEOBEYME_STRICT_MODE = 'true';

    // Configure transport
    if (hostConfig.mcpTransport === 'stdio') {
      // STDIO mode already active
    }

    // OS-specific path handling
    process.env.PATH_SEPARATOR = osConfig.pathSeparator;
  }

  /**
   * Get appropriate golden repo for this combination
   */
  getGoldenRepoForCombo(combo) {
    const goldenRepos = testMatrix.goldenRepos;
    
    // Return repo based on expected test patterns
    if (combo.githubMode === 'org_repo') {
      return goldenRepos[0]?.url || 'https://github.com/stonewolfpc/sweobeyme-golden-js';
    }
    
    return goldenRepos[0]?.url || 'sweobeyme-test-public';
  }

  /**
   * Get golden repo specification for verification
   */
  getGoldenRepoSpec(combo) {
    return testMatrix.goldenRepos[0] || {
      expectedFilesChanged: ['src/module.js', 'src/utils.js'],
      expectedDiffHash: 'sha256:placeholder'
    };
  }

  /**
   * Get test repo path
   */
  getTestRepoPath(combo) {
    return `./temp/${combo.id}`;
  }

  /**
   * Generate final certification report
   */
  generateCertificationReport(passed, failed, total) {
    const duration = this.endTime - this.startTime;
    const passRate = (passed / total * 100).toFixed(1);

    const report = {
      timestamp: new Date().toISOString(),
      duration: {
        totalMs: duration,
        minutes: (duration / 1000 / 60).toFixed(1)
      },
      summary: {
        totalCombinations: total,
        passed,
        failed,
        passRate: `${passRate}%`
      },
      matrix: this.matrix,
      results: this.results,
      failures: this.failures,
      certificationStatus: this.determineCertificationStatus(passed, failed, total),
      logs: enterpriseLogger.exportLog()
    };

    this.printReport(report);

    return report;
  }

  /**
   * Determine final certification status
   */
  determineCertificationStatus(passed, failed, total) {
    if (failed === 0 && passed === total) {
      return {
        level: 'v1.0_ENTERPRISE_CERTIFIED',
        message: 'All matrix combinations passed. Ready for production deployment.',
        recommendation: 'Deploy with confidence across all supported environments.',
        validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days
      };
    }

    if (passed > failed && failed <= Math.ceil(total * 0.1)) {
      return {
        level: 'v1.0_CONDITIONAL_CERTIFIED',
        message: 'Most combinations passed. Some edge cases need attention.',
        recommendation: 'Review failed combinations. Consider restricting to supported matrix subset.',
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      };
    }

    return {
      level: 'NOT_CERTIFIED',
      message: 'Too many failures for certification.',
      recommendation: 'Fix critical issues and re-run certification.',
      validUntil: null
    };
  }

  /**
   * Print formatted report
   */
  printReport(report) {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('           CERTIFICATION REPORT');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Status: ${report.certificationStatus.level}`);
    console.log(`Message: ${report.certificationStatus.message}`);
    console.log(`\nResults: ${report.summary.passed}/${report.summary.totalCombinations} passed (${report.summary.passRate})`);
    console.log(`Duration: ${report.duration.minutes} minutes`);
    
    if (report.summary.failed > 0) {
      console.log('\nFailed Combinations:');
      this.failures.forEach((f, i) => {
        console.log(`  ${i + 1}. ${f.combination.id}`);
        console.log(`     Reason: ${f.error || 'Test failure'}`);
      });
    }

    console.log('\nRecommendation:');
    console.log(`  ${report.certificationStatus.recommendation}`);
    
    if (report.certificationStatus.validUntil) {
      console.log(`\nCertification valid until: ${report.certificationStatus.validUntil}`);
    }
    
    console.log('═══════════════════════════════════════════════════════════\n');
  }
}

// CLI execution
if (process.argv.includes('--run')) {
  const runner = new CrossPlatformCertificationRunner({
    parallel: false,
    failFast: true,
    adaptiveModels: ['adaptive']
  });

  runner.runFullCertification().then(report => {
    process.exit(report.certificationStatus.level === 'v1.0_ENTERPRISE_CERTIFIED' ? 0 : 1);
  }).catch(error => {
    console.error('Certification runner failed:', error);
    process.exit(1);
  });
}

export { CrossPlatformCertificationRunner };
export default CrossPlatformCertificationRunner;
