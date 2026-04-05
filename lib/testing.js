import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';

/**
 * Testing tools for integration with test frameworks
 */

/**
 * Run tests for affected files
 */
export async function runRelatedTests(filePath) {
  const result = {
    success: true,
    testsRun: 0,
    testsPassed: 0,
    testsFailed: 0,
    coverage: 0,
    errors: [],
    warnings: [],
    output: '',
  };

  try {
    // Check if test file exists
    const ext = path.extname(filePath);
    const testName = path.basename(filePath, ext);
    const testDir = path.dirname(filePath);

    // Look for test files
    const possibleTestFiles = [
      path.join(testDir, `${testName}.test${ext}`),
      path.join(testDir, `${testName}.spec${ext}`),
      path.join(testDir, `test/${testName}.test${ext}`),
      path.join(testDir, `tests/${testName}.test${ext}`),
    ];

    let testFile = null;
    for (const file of possibleTestFiles) {
      try {
        await fs.access(file);
        testFile = file;
        break;
      } catch (e) {
        // File doesn't exist
      }
    }

    if (!testFile) {
      result.warnings.push('No test file found for this file');
      return result;
    }

    // Try to run tests using npm test
    return new Promise(resolve => {
      exec('npm test', { cwd: testDir }, (error, stdout, stderr) => {
        result.output = stdout + stderr;

        // Check if npm test exists
        if (error && error.code === 127) {
          result.warnings.push('npm test script not found. Please configure test scripts in package.json.');
          result.success = false;
          resolve(result);
          return;
        }

        // Parse test results (simplified)
        const output = result.output;

        // Try to extract test counts
        const passMatch = output.match(/(\d+)\s+passing/i);
        const failMatch = output.match(/(\d+)\s+failing/i);
        const totalMatch = output.match(/(\d+)\s+tests?\s/i);

        if (passMatch) result.testsPassed = parseInt(passMatch[1], 10);
        if (failMatch) result.testsFailed = parseInt(failMatch[1], 10);
        if (totalMatch) result.testsRun = parseInt(totalMatch[1], 10);

        result.success = result.testsFailed === 0;

        if (error && !result.success) {
          result.errors.push(error.message);
        }

        resolve(result);
      });
    });
  } catch (error) {
    result.success = false;
    result.errors.push(`Test execution failed: ${error.message}`);
  }

  return result;
}

/**
 * Check test coverage
 */
export function checkTestCoverage(filePath) {
  const result = {
    success: true,
    coverage: 0,
    uncoveredLines: [],
    errors: [],
    warnings: [],
  };

  try {
    // Try to run coverage report
    return new Promise(resolve => {
      exec('npm run test:coverage', { cwd: path.dirname(filePath) }, (error, stdout, stderr) => {
        const output = stdout + stderr;

        // Try to extract coverage percentage
        const coverageMatch = output.match(/(\d+\.?\d*)%/g);
        if (coverageMatch && coverageMatch.length > 0) {
          result.coverage = parseFloat(coverageMatch[0]);
        }

        if (error) {
          result.warnings.push('Coverage report not available');
        }

        resolve(result);
      });
    });
  } catch (error) {
    result.success = false;
    result.errors.push(`Coverage check failed: ${error.message}`);
  }

  return result;
}

/**
 * Check if file has tests
 */
export async function hasTests(filePath) {
  try {
    const ext = path.extname(filePath);
    const testName = path.basename(filePath, ext);
    const testDir = path.dirname(filePath);

    const possibleTestFiles = [
      path.join(testDir, `${testName}.test${ext}`),
      path.join(testDir, `${testName}.spec${ext}`),
    ];

    for (const file of possibleTestFiles) {
      try {
        await fs.access(file);
        return true;
      } catch (e) {
        // File doesn't exist
      }
    }

    return false;
  } catch (error) {
    return false;
  }
}
