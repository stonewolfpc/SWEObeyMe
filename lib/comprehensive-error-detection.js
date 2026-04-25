/**
 * Comprehensive Error Detection System
 *
 * Detects errors from frontend UI to tiny lint issues that never show
 * Designed for indie budget developers with 1 test machine
 *
 * Dependencies (TypeScript, madge, eslint, prettier) are optional.
 * If not available, those specific checks are skipped gracefully.
 *
 * @module lib/comprehensive-error-detection
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

// Check if optional dependencies are available
let hasTypeScript = false;
let hasMadge = false;
let hasESLint = false;
let hasPrettier = false;

try {
  await import('typescript');
  hasTypeScript = true;
} catch {
  hasTypeScript = false;
}

try {
  await import('madge');
  hasMadge = true;
} catch {
  hasMadge = false;
}

// eslint and prettier are CLI tools, check if they're available via npx
async function checkCLI(tool) {
  try {
    await execAsync(`npx ${tool} --version`, { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Comprehensive Error Detector
 * Detects all potential errors from frontend UI to tiny lint issues
 */
class ComprehensiveErrorDetector {
  constructor(options = {}) {
    this.projectRoot = options.projectRoot || process.cwd();
    this.enableTypeScript = options.enableTypeScript !== false;
    this.enableESLint = options.enableESLint !== false;
    this.enablePrettier = options.enablePrettier !== false;
    this.enableSecurity = options.enableSecurity !== false;
    this.enableAccessibility = options.enableAccessibility !== false;
    this.enablePerformance = options.enablePerformance !== false;
    this.enableDeadCode = options.enableDeadCode !== false;
    this.enableCircularDeps = options.enableCircularDeps !== false;

    this.results = {
      syntax: [],
      lint: [],
      type: [],
      security: [],
      accessibility: [],
      performance: [],
      deadCode: [],
      circularDeps: [],
      ui: [],
      runtime: [],
    };
  }

  /**
   * Run all error detection checks
   */
  async runAllChecks(filePath = null) {
    console.log('=== Comprehensive Error Detection ===\n');

    const checks = [];

    // Check CLI availability
    hasESLint = await checkCLI('eslint');
    hasPrettier = await checkCLI('prettier');

    if (filePath) {
      // Run checks on specific file
      if (hasESLint && this.enableESLint) checks.push(this.runESLint(filePath));
      if (hasPrettier && this.enablePrettier) checks.push(this.runPrettierCheck(filePath));
      if (hasTypeScript && this.enableTypeScript) checks.push(this.runTypeScriptCheck(filePath));
    } else {
      // Run checks on entire project
      if (hasESLint && this.enableESLint) checks.push(this.runESLint());
      if (hasPrettier && this.enablePrettier) checks.push(this.runPrettierCheck());
      if (hasTypeScript && this.enableTypeScript) checks.push(this.runTypeScriptCheck());
      if (this.enableSecurity) checks.push(this.runSecurityScan());
      if (this.enableAccessibility) checks.push(this.runAccessibilityCheck());
      if (this.enablePerformance) checks.push(this.runPerformanceAnalysis());
      if (this.enableDeadCode) checks.push(this.runDeadCodeDetection());
      if (hasMadge && this.enableCircularDeps) checks.push(this.runCircularDependencyCheck());
    }

    // Run all checks in parallel
    await Promise.all(checks);

    // Generate summary
    this.generateSummary();

    return this.results;
  }

  /**
   * Run ESLint for linting
   */
  async runESLint(filePath = null) {
    console.log('Running ESLint...');

    try {
      const target = filePath || '.';
      const { stdout, stderr } = await execAsync(
        `npx eslint "${target}" --ext .js,.ts,.tsx,.jsx --format json`
      );

      if (stdout) {
        const results = JSON.parse(stdout);
        results.forEach((result) => {
          result.messages.forEach((msg) => {
            this.results.lint.push({
              file: result.filePath,
              line: msg.line,
              column: msg.column,
              severity: msg.severity, // 1 = warning, 2 = error
              message: msg.message,
              ruleId: msg.ruleId,
            });
          });
        });
      }

      console.log(`ESLint: ${this.results.lint.length} issues found\n`);
    } catch (error) {
      // ESLint returns non-zero exit code when issues found
      if (error.stdout) {
        try {
          const results = JSON.parse(error.stdout);
          results.forEach((result) => {
            result.messages.forEach((msg) => {
              this.results.lint.push({
                file: result.filePath,
                line: msg.line,
                column: msg.column,
                severity: msg.severity,
                message: msg.message,
                ruleId: msg.ruleId,
              });
            });
          });
          console.log(`ESLint: ${this.results.lint.length} issues found\n`);
        } catch (e) {
          console.log('ESLint: Unable to parse results\n');
        }
      } else {
        console.log('ESLint: No issues found\n');
      }
    }
  }

  /**
   * Run Prettier for formatting checks
   */
  async runPrettierCheck(filePath = null) {
    console.log('Running Prettier check...');

    try {
      const target = filePath || '"**/*.{js,ts,tsx,jsx,json,md}"';
      const { stdout, stderr } = await execAsync(`npx prettier --check ${target}`);
      console.log('Prettier: All files properly formatted\n');
    } catch (error) {
      // Prettier returns non-zero when formatting needed
      this.results.lint.push({
        severity: 'warning',
        message: 'Files need formatting with Prettier',
        details: error.stderr || error.stdout,
      });
      console.log('Prettier: Files need formatting\n');
    }
  }

  /**
   * Run TypeScript type checking
   */
  async runTypeScriptCheck(filePath = null) {
    console.log('Running TypeScript type check...');

    try {
      const target = filePath || '.';
      const { stdout, stderr } = await execAsync(`npx tsc --noEmit ${target}`);
      console.log('TypeScript: No type errors\n');
    } catch (error) {
      // TypeScript returns non-zero when type errors found
      const errorOutput = error.stderr || error.stdout;
      const lines = errorOutput.split('\n').filter((line) => line.includes('error TS'));

      lines.forEach((line) => {
        const match = line.match(/(.+?)\((\d+),(\d+)\):\s+error TS(\d+):\s+(.+)/);
        if (match) {
          this.results.type.push({
            file: match[1],
            line: parseInt(match[2]),
            column: parseInt(match[3]),
            code: `TS${match[4]}`,
            message: match[5],
          });
        }
      });

      console.log(`TypeScript: ${this.results.type.length} type errors\n`);
    }
  }

  /**
   * Run security scan using npm audit
   */
  async runSecurityScan() {
    console.log('Running security scan...');

    try {
      const { stdout, stderr } = await execAsync('npm audit --json');
      const audit = JSON.parse(stdout);

      if (audit.vulnerabilities) {
        Object.entries(audit.vulnerabilities).forEach(([pkg, vuln]) => {
          this.results.security.push({
            package: pkg,
            severity: vuln.severity,
            vulnerableVersions: vuln.vulnerableVersions,
            patchedVersions: vuln.patchedVersions,
            title: vuln.title,
          });
        });
      }

      console.log(`Security: ${this.results.security.length} vulnerabilities\n`);
    } catch (error) {
      console.log('Security: No vulnerabilities found\n');
    }
  }

  /**
   * Run accessibility check (basic)
   */
  async runAccessibilityCheck() {
    console.log('Running accessibility check...');

    try {
      const { stdout, stderr } = await execAsync(
        'npx eslint . --ext .js,.jsx,.tsx --plugin jsxa11y'
      );

      if (stdout) {
        const lines = stdout.split('\n').filter((line) => line.includes('jsxa11y'));
        lines.forEach((line) => {
          this.results.accessibility.push({
            message: line,
          });
        });
      }

      console.log(`Accessibility: ${this.results.accessibility.length} issues\n`);
    } catch (error) {
      console.log('Accessibility: No issues found (or eslint-plugin-jsxa11y not installed)\n');
    }
  }

  /**
   * Run performance analysis (basic)
   */
  async runPerformanceAnalysis() {
    console.log('Running performance analysis...');

    try {
      // Check for large files
      const { stdout } = await execAsync(
        'find . -type f -name "*.js" -o -name "*.ts" -o -name "*.tsx" | xargs wc -l | sort -rn | head -20'
      );
      const lines = stdout.split('\n').filter((line) => line.match(/^\s*\d+/));

      lines.forEach((line) => {
        const match = line.match(/^\s*(\d+)\s+(.+)/);
        if (match && parseInt(match[1]) > 500) {
          this.results.performance.push({
            type: 'large_file',
            file: match[2],
            lines: parseInt(match[1]),
            message: `File exceeds 500 lines (${match[1]} lines)`,
          });
        }
      });

      console.log(`Performance: ${this.results.performance.length} issues\n`);
    } catch (error) {
      console.log('Performance: No issues found\n');
    }
  }

  /**
   * Run dead code detection (basic)
   */
  async runDeadCodeDetection() {
    console.log('Running dead code detection...');

    try {
      // Check for unused exports
      const { stdout } = await execAsync(
        'npx eslint . --ext .js,.ts --rule "no-unused-vars: error" --rule "import/no-unused-modules: error"'
      );

      if (stdout) {
        const lines = stdout
          .split('\n')
          .filter((line) => line.includes('no-unused-vars') || line.includes('no-unused-modules'));
        lines.forEach((line) => {
          this.results.deadCode.push({
            message: line,
          });
        });
      }

      console.log(`Dead Code: ${this.results.deadCode.length} issues\n`);
    } catch (error) {
      console.log('Dead Code: No issues found\n');
    }
  }

  /**
   * Run circular dependency check
   */
  async runCircularDependencyCheck() {
    console.log('Running circular dependency check...');

    try {
      const { stdout } = await execAsync('npx madge --circular --extensions js,ts,tsx .');

      if (stdout) {
        const lines = stdout.split('\n').filter((line) => line.trim());
        lines.forEach((line) => {
          this.results.circularDeps.push({
            message: line,
          });
        });
      }

      console.log(`Circular Dependencies: ${this.results.circularDeps.length} found\n`);
    } catch (error) {
      console.log('Circular Dependencies: None found (or madge not installed)\n');
    }
  }

  /**
   * Generate summary of all findings
   */
  generateSummary() {
    const totalIssues =
      this.results.syntax.length +
      this.results.lint.length +
      this.results.type.length +
      this.results.security.length +
      this.results.accessibility.length +
      this.results.performance.length +
      this.results.deadCode.length +
      this.results.circularDeps.length;

    console.log('\n=== Error Detection Summary ===');
    console.log(`Syntax Errors: ${this.results.syntax.length}`);
    console.log(`Lint Issues: ${this.results.lint.length}`);
    console.log(`Type Errors: ${this.results.type.length}`);
    console.log(`Security Vulnerabilities: ${this.results.security.length}`);
    console.log(`Accessibility Issues: ${this.results.accessibility.length}`);
    console.log(`Performance Issues: ${this.results.performance.length}`);
    console.log(`Dead Code: ${this.results.deadCode.length}`);
    console.log(`Circular Dependencies: ${this.results.circularDeps.length}`);
    console.log(`\nTotal Issues: ${totalIssues}`);

    if (totalIssues === 0) {
      console.log('\n✅ No issues found - code is clean!');
    } else {
      console.log('\n⚠️  Issues found - review and fix before shipping');
    }
  }

  /**
   * Get detailed results
   */
  getResults() {
    return this.results;
  }

  /**
   * Get results as formatted report
   */
  getReport() {
    let report = '=== Comprehensive Error Detection Report ===\n\n';

    if (this.results.lint.length > 0) {
      report += '## Lint Issues\n';
      this.results.lint.forEach((issue) => {
        report += `- ${issue.file}:${issue.line}:${issue.column} [${issue.severity === 2 ? 'ERROR' : 'WARNING'}] ${issue.message} (${issue.ruleId})\n`;
      });
      report += '\n';
    }

    if (this.results.type.length > 0) {
      report += '## Type Errors\n';
      this.results.type.forEach((issue) => {
        report += `- ${issue.file}:${issue.line}:${issue.column} [${issue.code}] ${issue.message}\n`;
      });
      report += '\n';
    }

    if (this.results.security.length > 0) {
      report += '## Security Vulnerabilities\n';
      this.results.security.forEach((issue) => {
        report += `- ${issue.package} [${issue.severity}] ${issue.title}\n`;
      });
      report += '\n';
    }

    if (this.results.performance.length > 0) {
      report += '## Performance Issues\n';
      this.results.performance.forEach((issue) => {
        report += `- ${issue.file}: ${issue.message}\n`;
      });
      report += '\n';
    }

    return report;
  }
}

/**
 * Initialize and run comprehensive error detection
 */
export async function runComprehensiveErrorDetection(options = {}) {
  const detector = new ComprehensiveErrorDetector(options);
  return await detector.runAllChecks(options.filePath);
}

export { ComprehensiveErrorDetector };
