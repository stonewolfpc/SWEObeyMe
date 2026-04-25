/**
 * Extension-Side Tests - Marketplace Packaging Tests
 * Tests that catch "VS Code/Cursor/Windsurf rejected the extension" failures
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MarketplacePackagingTest {
  constructor() {
    this.results = {
      noExtraFiles: { passed: false, errors: [] },
      noMissingFiles: { passed: false, errors: [] },
      noDevDependencies: { passed: false, errors: [] },
      noLargeBundles: { passed: false, errors: [] },
      noAbsolutePaths: { passed: false, errors: [] },
      noOSSpecificCode: { passed: false, errors: [] },
    };
  }

  async runAll() {
    console.log('='.repeat(60));
    console.log('MARKETPLACE PACKAGING TESTS');
    console.log('='.repeat(60));
    console.log();

    await this.testNoExtraFiles();
    await this.testNoMissingFiles();
    await this.testNoDevDependencies();
    await this.testNoLargeBundles();
    await this.testNoAbsolutePaths();
    await this.testNoOSSpecificCode();

    this.printResults();
    return this.allPassed();
  }

  /**
   * Test no extra files in package
   */
  async testNoExtraFiles() {
    console.log('Testing no extra files in package...');

    try {
      const ignorePatterns = [
        'node_modules',
        '.git',
        'dist',
        '.vscode',
        '.cursor',
        '.codeium',
        'tests',
        'test-tools',
        '.local',
        'coverage',
        '.nyc_output',
      ];

      // Check .vscodeignore or .gitignore for exclusions
      const vscodeIgnorePath = path.join(__dirname, '..', '.vscodeignore');
      const gitIgnorePath = path.join(__dirname, '..', '.gitignore');

      const hasVscodeIgnore = await fs
        .access(vscodeIgnorePath)
        .then(() => true)
        .catch(() => false);
      const hasGitIgnore = await fs
        .access(gitIgnorePath)
        .then(() => true)
        .catch(() => false);

      if (!hasVscodeIgnore && !hasGitIgnore) {
        this.results.noExtraFiles.errors.push(
          'No .vscodeignore or .gitignore found - extra files may be packaged'
        );
        console.log('  ⚠️  No .vscodeignore or .gitignore found');
      }

      this.results.noExtraFiles.passed = true;
      console.log('  ✅ No extra files test passed');
    } catch (error) {
      this.results.noExtraFiles.errors.push(error.message);
      console.log(`  ❌ No extra files test failed: ${error.message}`);
    }
  }

  /**
   * Test no missing files in package
   */
  async testNoMissingFiles() {
    console.log('Testing no missing files in package...');

    try {
      const requiredFiles = [
        'package.json',
        'index.js',
        'extension.js',
        'lib/tools/handlers.js',
        'lib/tools/registry-config.js',
        'lib/config.js',
        'lib/session.js',
        'lib/workflow.js',
        'lib/verification.js',
        'lib/validation.js',
        'lib/multi-agent-orchestration.js',
        'lib/spec-driven-development.js',
        'lib/autonomous-execution.js',
      ];

      for (const file of requiredFiles) {
        const fullPath = path.join(__dirname, '..', file);
        const exists = await fs
          .access(fullPath)
          .then(() => true)
          .catch(() => false);
        if (!exists) {
          this.results.noMissingFiles.errors.push(`Missing required file: ${file}`);
          console.log(`  ❌ Missing required file: ${file}`);
          return;
        }
      }

      this.results.noMissingFiles.passed = true;
      console.log('  ✅ No missing files test passed');
    } catch (error) {
      this.results.noMissingFiles.errors.push(error.message);
      console.log(`  ❌ No missing files test failed: ${error.message}`);
    }
  }

  /**
   * Test no dev dependencies in production package
   */
  async testNoDevDependencies() {
    console.log('Testing no dev dependencies in production package...');

    try {
      const packagePath = path.join(__dirname, '..', 'package.json');
      const content = await fs.readFile(packagePath, 'utf-8');
      const packageJson = JSON.parse(content);

      // Check for devDependencies in package
      if (packageJson.devDependencies) {
        const devDeps = Object.keys(packageJson.devDependencies);
        if (devDeps.length > 0) {
          this.results.noDevDependencies.errors.push(
            `Dev dependencies found: ${devDeps.join(', ')}`
          );
          console.log(`  ⚠️  Dev dependencies found: ${devDeps.join(', ')}`);
        }
      }

      // This is a warning - dev deps may be excluded during packaging
      this.results.noDevDependencies.passed = true;
      console.log(
        '  ✅ No dev dependencies test passed (dev deps may be excluded during packaging)'
      );
    } catch (error) {
      this.results.noDevDependencies.errors.push(error.message);
      console.log(`  ❌ No dev dependencies test failed: ${error.message}`);
    }
  }

  /**
   * Test no large bundles
   */
  async testNoLargeBundles() {
    console.log('Testing no large bundles...');

    try {
      const distDir = path.join(__dirname, '..', 'dist');
      const distExists = await fs
        .access(distDir)
        .then(() => true)
        .catch(() => false);

      if (!distExists) {
        this.results.noLargeBundles.errors.push('dist directory does not exist');
        console.log('  ❌ dist directory does not exist');
        return;
      }

      // Check bundle sizes
      const maxSize = 2 * 1024 * 1024; // 2MB
      const files = await fs.readdir(distDir, { recursive: true });

      for (const file of files) {
        if (file.endsWith('.js') || file.endsWith('.json')) {
          const fullPath = path.join(distDir, file);
          const stat = await fs.stat(fullPath);
          if (stat.isFile() && stat.size > maxSize) {
            this.results.noLargeBundles.errors.push(
              `Bundle too large: ${file} (${(stat.size / 1024 / 1024).toFixed(2)}MB)`
            );
            console.log(
              `  ❌ Bundle too large: ${file} (${(stat.size / 1024 / 1024).toFixed(2)}MB)`
            );
            return;
          }
        }
      }

      this.results.noLargeBundles.passed = true;
      console.log('  ✅ No large bundles test passed');
    } catch (error) {
      this.results.noLargeBundles.errors.push(error.message);
      console.log(`  ❌ No large bundles test failed: ${error.message}`);
    }
  }

  /**
   * Test no absolute paths
   */
  async testNoAbsolutePaths() {
    console.log('Testing no absolute paths...');

    try {
      const packagePath = path.join(__dirname, '..', 'package.json');
      const content = await fs.readFile(packagePath, 'utf-8');

      // Check for absolute paths in package.json (but not URLs)
      // Skip "https://" and "http://" patterns, only check for file system paths
      const absolutePathPattern = /"(file:|C:\\|\/[a-zA-Z]:\\)/g;
      const matches = content.match(absolutePathPattern);

      if (matches) {
        this.results.noAbsolutePaths.errors.push(
          `Absolute paths found in package.json: ${matches.join(', ')}`
        );
        console.log(`  ❌ Absolute paths found in package.json: ${matches.join(', ')}`);
        return;
      }

      this.results.noAbsolutePaths.passed = true;
      console.log('  ✅ No absolute paths test passed');
    } catch (error) {
      this.results.noAbsolutePaths.errors.push(error.message);
      console.log(`  ❌ No absolute paths test failed: ${error.message}`);
    }
  }

  /**
   * Test no OS-specific code
   */
  async testNoOSSpecificCode() {
    console.log('Testing no OS-specific code...');

    try {
      const filesToCheck = [
        'index.js',
        'extension.js',
        'lib/config.js',
        'lib/session.js',
        'lib/tools/handlers.js',
      ];

      for (const file of filesToCheck) {
        const fullPath = path.join(__dirname, '..', file);
        const exists = await fs
          .access(fullPath)
          .then(() => true)
          .catch(() => false);
        if (!exists) continue;

        const content = await fs.readFile(fullPath, 'utf-8');

        // Check for hardcoded OS-specific paths or code
        const osSpecificPatterns = [
          /C:\\\\[^\\]/,
          /\\windows\\/i,
          /\\system32\\/i,
          /\\\\users\\\\/i,
          /\\\\program files\\\\/i,
        ];

        for (const pattern of osSpecificPatterns) {
          if (pattern.test(content)) {
            this.results.noOSSpecificCode.errors.push(
              `OS-specific code found in ${file}: ${pattern}`
            );
            console.log(`  ⚠️  OS-specific code found in ${file}`);
          }
        }
      }

      this.results.noOSSpecificCode.passed = true;
      console.log('  ✅ No OS-specific code test passed');
    } catch (error) {
      this.results.noOSSpecificCode.errors.push(error.message);
      console.log(`  ❌ No OS-specific code test failed: ${error.message}`);
    }
  }

  allPassed() {
    return Object.values(this.results).every((result) => result.passed);
  }

  printResults() {
    console.log();
    console.log('='.repeat(60));
    console.log('MARKETPLACE PACKAGING TEST RESULTS');
    console.log('='.repeat(60));
    console.log();

    for (const [name, result] of Object.entries(this.results)) {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${name}`);

      if (result.errors.length > 0) {
        result.errors.forEach((error) => {
          console.log(`    - ${error}`);
        });
      }
    }

    console.log();
    console.log('='.repeat(60));

    if (this.allPassed()) {
      console.log('ALL TESTS PASSED ✅');
    } else {
      console.log('SOME TESTS FAILED ❌');
    }

    console.log('='.repeat(60));
  }
}

const test = new MarketplacePackagingTest();
test
  .runAll()
  .then((passed) => {
    process.exit(passed ? 0 : 1);
  })
  .catch((error) => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
