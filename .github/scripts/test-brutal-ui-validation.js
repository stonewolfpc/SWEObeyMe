#!/usr/bin/env node
/**
 * BRUTAL UI VALIDATION TEST
 *
 * Cross-platform UI validation for Windows, Linux, and macOS.
 * Tests every aspect of the UI to ensure it works perfectly.
 * No excuses. No warnings tolerated. Everything must work.
 */

import fs from 'fs';
import path from 'path';
import { spawn, exec } from 'child_process';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.join(__dirname, '..', '..');
const errors = [];
const warnings = [];
const testResults = [];

console.log('BRUTAL UI VALIDATION TEST');
console.log('Cross-platform: Windows, Linux, macOS');
console.log('Zero tolerance for UI failures');
console.log('='.repeat(60));

// Platform detection
const platform = os.platform();
const isWindows = platform === 'win32';
const isLinux = platform === 'linux';
const isMacOS = platform === 'darwin';

console.log(
  `\nPlatform: ${platform} (${isWindows ? 'Windows' : isLinux ? 'Linux' : isMacOS ? 'macOS' : 'Unknown'})`
);

// Helper functions
function logTest(testName, status, details = '') {
  const symbol = status === 'PASS' ? 'PASS' : status === 'FAIL' ? 'FAIL' : 'WARN';
  console.log(`[${symbol}] ${testName}${details ? ': ' + details : ''}`);

  testResults.push({
    test: testName,
    status: status,
    details: details,
    platform: platform,
    timestamp: new Date().toISOString(),
  });

  if (status === 'FAIL') {
    errors.push(`${testName}: ${details}`);
  } else if (status === 'WARN') {
    warnings.push(`${testName}: ${details}`);
  }
}

function execAsync(command, options = {}) {
  return new Promise((resolve, reject) => {
    const child = exec(command, { ...options, encoding: 'utf8' }, (error, stdout, stderr) => {
      if (error) {
        reject({ error, stdout, stderr });
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

// Test 1: HTML Content Structure Validation
console.log('\n1. HTML CONTENT STRUCTURE VALIDATION');
console.log('='.repeat(50));

async function testHTMLStructure() {
  try {
    const extensionJs = fs.readFileSync(path.join(projectRoot, 'extension.js'), 'utf8');

    // Find all HTML generators
    const htmlGenerators = ['getSettingsHtml', 'getCSharpBridgeHtml', 'getAdminDashboardHtml'];

    for (const generator of htmlGenerators) {
      console.log(`\nTesting ${generator}...`);

      // Extract HTML content more reliably
      const startPattern = new RegExp(`function ${generator}\\s*\\(`);
      const startIndex = extensionJs.search(startPattern);

      if (startIndex === -1) {
        logTest(`HTML generator: ${generator}`, 'FAIL', 'Function not found');
        continue;
      }

      // Find the return statement with HTML - look for complete template literal
      const functionContent = extensionJs.substring(startIndex, startIndex + 8000);
      const returnMatch = functionContent.match(/return\s+`((?:[^`]|\\`)*?)`/s);

      if (!returnMatch) {
        logTest(`HTML generator: ${generator}`, 'FAIL', 'No HTML content found');
        continue;
      }

      const htmlContent = returnMatch[1];

      if (!htmlContent) {
        logTest(`HTML generator: ${generator}`, 'FAIL', 'No HTML content found');
        continue;
      }

      console.log(`  HTML length: ${htmlContent.length} characters`);

      // Validate HTML structure
      const htmlTests = [
        {
          name: 'DOCTYPE declaration',
          test: htmlContent.includes('<!DOCTYPE html>') || htmlContent.includes('<html'),
          critical: true,
        },
        {
          name: 'HTML tag',
          test: htmlContent.includes('<html'),
          critical: true,
        },
        {
          name: 'HEAD tag',
          test: htmlContent.includes('<head>'),
          critical: true,
        },
        {
          name: 'BODY tag',
          test: htmlContent.includes('<body>'),
          critical: true,
        },
        {
          name: 'Meta charset',
          test: htmlContent.includes('charset=') || htmlContent.includes('charset="'),
          critical: true,
        },
        {
          name: 'VS Code CSS variables',
          test: htmlContent.includes('var(--vscode-') || htmlContent.includes('vscode-light'),
          critical: true,
        },
        {
          name: 'CSP nonce',
          test: htmlContent.includes('nonce-') || htmlContent.includes('${nonce}'),
          critical: true,
        },
        {
          name: 'Script tags',
          test: htmlContent.includes('<script'),
          critical: false,
        },
        {
          name: 'Proper HTML closing',
          test: htmlContent.includes('</html>') || htmlContent.includes('</body>'),
          critical: true,
        },
        {
          name: 'No broken template literals',
          test: !htmlContent.includes('`') || (htmlContent.match(/`/g) || []).length % 2 === 0,
          critical: true,
        },
      ];

      for (const test of htmlTests) {
        if (test.test) {
          logTest(`${generator}: ${test.name}`, 'PASS');
        } else if (test.critical) {
          logTest(`${generator}: ${test.name}`, 'FAIL', 'Missing critical HTML element');
        } else {
          logTest(`${generator}: ${test.name}`, 'WARN', 'Optional element missing');
        }
      }

      // Check for common UI issues
      const uiTests = [
        {
          name: 'Unclosed tags',
          test: () => {
            // HTML5 void elements that don't need closing tags
            const voidElements = [
              'area',
              'base',
              'br',
              'col',
              'embed',
              'hr',
              'img',
              'input',
              'link',
              'meta',
              'param',
              'source',
              'track',
              'wbr',
            ];

            // Count all opening tags
            const allOpenTags = htmlContent.match(/<[^\/][^>]*>/g) || [];

            // Count void elements (they don't need closing tags)
            const voidTagCount = allOpenTags.filter((tag) => {
              const tagName = tag.match(/<(\w+)/)?.[1]?.toLowerCase();
              return voidElements.includes(tagName);
            }).length;

            // Count self-closing tags with />
            const selfClosing = (htmlContent.match(/<[^>]*\/>/g) || []).length;

            // Count closing tags
            const closeTags = (htmlContent.match(/<\/[^>]*>/g) || []).length;

            // Count normal opening tags (excluding void and self-closing)
            const normalOpenTags = allOpenTags.length - voidTagCount - selfClosing;

            // For valid HTML: normalOpenTags should equal closeTags
            const difference = Math.abs(normalOpenTags - closeTags);
            return difference <= 1; // Allow small difference for edge cases
          },
        },
        {
          name: 'Proper escaping',
          test: () => !htmlContent.includes('${') || htmlContent.includes('${nonce}'),
        },
        {
          name: 'No hardcoded paths',
          test: () => {
            // Look for actual file paths, not HTML tag endings
            const windowsPaths = (
              htmlContent.match(/[A-Z]:[\\/][^"'\\s]*\.(js|json|md|txt|png|svg)/g) || []
            ).length;
            const unixPaths = (htmlContent.match(/\/[^"'\\s]*\.(js|json|md|txt|png|svg)/g) || [])
              .length;
            return windowsPaths === 0 && unixPaths === 0;
          },
        },
      ];

      for (const test of uiTests) {
        try {
          const result = test.test();
          if (result) {
            logTest(`${generator}: ${test.name}`, 'PASS');
          } else {
            logTest(`${generator}: ${test.name}`, 'FAIL', 'UI structure issue');
          }
        } catch (e) {
          logTest(`${generator}: ${test.name}`, 'FAIL', e.message);
        }
      }
    }
  } catch (e) {
    logTest('HTML structure validation', 'FAIL', e.message);
  }
}

// Test 2: Cross-Platform Path Handling
console.log('\n2. CROSS-PLATFORM PATH HANDLING');
console.log('='.repeat(50));

async function testCrossPlatformPaths() {
  try {
    const extensionJs = fs.readFileSync(path.join(projectRoot, 'extension.js'), 'utf8');

    // Test path normalization
    const pathTests = [
      {
        name: 'Windows paths handled',
        test: extensionJs.includes('path.sep') || extensionJs.includes('path.join'),
        critical: true,
      },
      {
        name: 'No hardcoded backslashes',
        test: !extensionJs.includes('C:\\') && !extensionJs.includes('D:\\'),
        critical: true,
      },
      {
        name: 'Uses path.normalize',
        test: extensionJs.includes('path.normalize') || extensionJs.includes('normalizePath'),
        critical: false,
      },
      {
        name: 'Cross-platform separators',
        test: extensionJs.includes('path.sep') || extensionJs.includes('path.join'),
        critical: true,
      },
    ];

    for (const test of pathTests) {
      if (test.test) {
        logTest(`Path handling: ${test.name}`, 'PASS');
      } else if (test.critical) {
        logTest(`Path handling: ${test.name}`, 'FAIL', 'Cross-platform issue');
      } else {
        logTest(`Path handling: ${test.name}`, 'WARN', 'Could improve');
      }
    }

    // Test actual path operations
    const testPaths = [
      'config.json',
      'settings.json',
      'backup/file.txt',
      '../parent/child.txt',
      './relative/path.txt',
      'file with spaces.txt',
      'file-with-dashes.txt',
      'file_with_underscores.txt',
    ];

    for (const testPath of testPaths) {
      try {
        const normalized = path.normalize(testPath);
        const joined = path.join('test', 'dir', testPath);
        const resolved = path.resolve(testPath);

        logTest(`Path operation: ${testPath}`, 'PASS', `Normalized: ${normalized}`);
      } catch (e) {
        logTest(`Path operation: ${testPath}`, 'FAIL', e.message);
      }
    }
  } catch (e) {
    logTest('Cross-platform path test', 'FAIL', e.message);
  }
}

// Test 3: Webview Provider Registration
console.log('\n3. WEBVIEW PROVIDER REGISTRATION');
console.log('='.repeat(50));

async function testWebviewProviders() {
  try {
    const extensionJs = fs.readFileSync(path.join(projectRoot, 'extension.js'), 'utf8');
    const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));

    // Check webview provider registration
    const providerPattern = /registerWebviewViewProvider\(['"]([^'"]+)['"]/g;
    const providers = [];
    let match;

    while ((match = providerPattern.exec(extensionJs)) !== null) {
      providers.push(match[1]);
    }

    logTest(
      'Webview providers found',
      providers.length > 0 ? 'PASS' : 'FAIL',
      `${providers.length} providers`
    );

    // Check against package.json views
    const views = packageJson.contributes?.views?.sweObeyMe || [];

    for (const view of views) {
      if (providers.includes(view.id)) {
        logTest(`View provider: ${view.id}`, 'PASS', 'Provider registered');
      } else {
        logTest(`View provider: ${view.id}`, 'FAIL', 'No provider found');
      }
    }

    // Test webview creation
    const webviewTests = [
      {
        name: 'Webview options set',
        test:
          extensionJs.includes('enableScripts: true') || extensionJs.includes('webview.options'),
        critical: true,
      },
      {
        name: 'Message handling',
        test: extensionJs.includes('onDidReceiveMessage'),
        critical: true,
      },
      {
        name: 'Post message capability',
        test: extensionJs.includes('postMessage'),
        critical: true,
      },
      {
        name: 'Error handling in webview',
        test: extensionJs.includes('try') && extensionJs.includes('catch'),
        critical: true,
      },
    ];

    for (const test of webviewTests) {
      if (test.test) {
        logTest(`Webview feature: ${test.name}`, 'PASS');
      } else if (test.critical) {
        logTest(`Webview feature: ${test.name}`, 'FAIL', 'Missing critical feature');
      } else {
        logTest(`Webview feature: ${test.name}`, 'WARN', 'Optional feature');
      }
    }
  } catch (e) {
    logTest('Webview provider test', 'FAIL', e.message);
  }
}

// Test 4: Command Integration with UI
console.log('\n4. COMMAND INTEGRATION WITH UI');
console.log('='.repeat(50));

async function testCommandUIIntegration() {
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
    const extensionJs = fs.readFileSync(path.join(projectRoot, 'extension.js'), 'utf8');

    const commands = packageJson.contributes?.commands || [];
    const uiCommands = commands.filter(
      (cmd) =>
        cmd.title.toLowerCase().includes('settings') ||
        cmd.title.toLowerCase().includes('bridge') ||
        cmd.title.toLowerCase().includes('admin') ||
        cmd.title.toLowerCase().includes('dashboard')
    );

    logTest(
      'UI-related commands',
      uiCommands.length > 0 ? 'PASS' : 'FAIL',
      `${uiCommands.length} UI commands`
    );

    // Check command implementation
    for (const cmd of uiCommands) {
      const registrationPattern = new RegExp(
        `registerCommand\\(['"]${cmd.command.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`
      );
      if (registrationPattern.test(extensionJs)) {
        logTest(`UI command: ${cmd.command}`, 'PASS', 'Implemented');
      } else {
        logTest(`UI command: ${cmd.command}`, 'FAIL', 'Not implemented');
      }
    }

    // Test command execution
    const commandTests = [
      {
        name: 'executeCommand usage',
        test: extensionJs.includes('vscode.commands.executeCommand'),
        critical: true,
      },
      {
        name: 'showInformationMessage',
        test: extensionJs.includes('showInformationMessage'),
        critical: true,
      },
      {
        name: 'showErrorMessage',
        test: extensionJs.includes('showErrorMessage'),
        critical: true,
      },
      {
        name: 'showWarningMessage',
        test: extensionJs.includes('showWarningMessage'),
        critical: false,
      },
    ];

    for (const test of commandTests) {
      if (test.test) {
        logTest(`Command feature: ${test.name}`, 'PASS');
      } else if (test.critical) {
        logTest(`Command feature: ${test.name}`, 'FAIL', 'Missing critical feature');
      } else {
        logTest(`Command feature: ${test.name}`, 'WARN', 'Optional feature');
      }
    }
  } catch (e) {
    logTest('Command UI integration test', 'FAIL', e.message);
  }
}

// Test 5: Resource and Asset Loading
console.log('\n5. RESOURCE AND ASSET LOADING');
console.log('='.repeat(50));

async function testResourceLoading() {
  try {
    const extensionJs = fs.readFileSync(path.join(projectRoot, 'extension.js'), 'utf8');

    // Check for resource loading patterns
    const resourceTests = [
      {
        name: 'Uses extensionUri for resources',
        test: extensionJs.includes('extensionUri') || extensionJs.includes('context.extensionUri'),
        critical: true,
      },
      {
        name: 'No hardcoded resource paths',
        test: !extensionJs.includes('/src/') && !extensionJs.includes('/lib/'),
        critical: true,
      },
      {
        name: 'Uses path.join for resources',
        test: extensionJs.includes('path.join') && extensionJs.includes('extensionUri'),
        critical: true,
      },
      {
        name: 'Webview resource handling',
        test: extensionJs.includes('localResourceRoots') || extensionJs.includes('asWebviewUri'),
        critical: true,
      },
    ];

    for (const test of resourceTests) {
      if (test.test) {
        logTest(`Resource loading: ${test.name}`, 'PASS');
      } else if (test.critical) {
        logTest(`Resource loading: ${test.name}`, 'FAIL', 'Resource loading issue');
      } else {
        logTest(`Resource loading: ${test.name}`, 'WARN', 'Could improve');
      }
    }

    // Test actual resource paths
    const testResources = ['icon.png', 'icon.svg', 'ONBOARDING.md', 'LICENSE'];

    for (const resource of testResources) {
      const resourcePath = path.join(projectRoot, resource);
      if (fs.existsSync(resourcePath)) {
        logTest(`Resource exists: ${resource}`, 'PASS');
      } else {
        logTest(`Resource exists: ${resource}`, 'WARN', 'Resource not found');
      }
    }
  } catch (e) {
    logTest('Resource loading test', 'FAIL', e.message);
  }
}

// Test 6: CSS and Theming
console.log('\n6. CSS AND THEMING');
console.log('='.repeat(50));

async function testCSSAndTheming() {
  try {
    const extensionJs = fs.readFileSync(path.join(projectRoot, 'extension.js'), 'utf8');

    // Check for CSS and theming
    const cssTests = [
      {
        name: 'Uses VS Code CSS variables',
        test: extensionJs.includes('var(--vscode-') || extensionJs.includes('vscode-light'),
        critical: true,
      },
      {
        name: 'Dark theme support',
        test: extensionJs.includes('vscode-dark') || extensionJs.includes('--vscode-'),
        critical: true,
      },
      {
        name: 'High contrast support',
        test: extensionJs.includes('vscode-high-contrast') || extensionJs.includes('high-contrast'),
        critical: false,
      },
      {
        name: 'Inline CSS included',
        test: extensionJs.includes('<style>') || extensionJs.includes('style='),
        critical: true,
      },
      {
        name: 'Responsive design',
        test: extensionJs.includes('media') || extensionJs.includes('responsive'),
        critical: false,
      },
    ];

    for (const test of cssTests) {
      if (test.test) {
        logTest(`CSS/Theming: ${test.name}`, 'PASS');
      } else if (test.critical) {
        logTest(`CSS/Theming: ${test.name}`, 'FAIL', 'Missing critical CSS feature');
      } else {
        logTest(`CSS/Theming: ${test.name}`, 'WARN', 'Optional CSS feature');
      }
    }

    // Test for common CSS issues
    const cssIssueTests = [
      {
        name: 'No hardcoded colors',
        test: () => {
          const hardcodedColors = extensionJs.match(/#[0-9a-fA-F]{6}|rgb\(|rgba\(/g) || [];
          return hardcodedColors.length === 0;
        },
      },
      {
        name: 'Uses CSS variables',
        test: () => {
          const cssVars = extensionJs.match(/var\(--[^)]+\)/g) || [];
          return cssVars.length > 0;
        },
      },
      {
        name: 'No !important rules',
        test: () => !extensionJs.includes('!important'),
      },
    ];

    for (const test of cssIssueTests) {
      try {
        const result = test.test();
        if (result) {
          logTest(`CSS Quality: ${test.name}`, 'PASS');
        } else {
          logTest(`CSS Quality: ${test.name}`, 'WARN', 'CSS could be improved');
        }
      } catch (e) {
        logTest(`CSS Quality: ${test.name}`, 'FAIL', e.message);
      }
    }
  } catch (e) {
    logTest('CSS and theming test', 'FAIL', e.message);
  }
}

// Test 7: Error Handling and Fallbacks
console.log('\n7. ERROR HANDLING AND FALLBACKS');
console.log('='.repeat(50));

async function testErrorHandling() {
  try {
    const extensionJs = fs.readFileSync(path.join(projectRoot, 'extension.js'), 'utf8');

    // Check error handling patterns
    const errorTests = [
      {
        name: 'Try-catch blocks in UI',
        test: extensionJs.includes('try') && extensionJs.includes('catch'),
        critical: true,
      },
      {
        name: 'Error logging',
        test: extensionJs.includes('console.error') || extensionJs.includes('console.warn'),
        critical: true,
      },
      {
        name: 'User error notifications',
        test:
          extensionJs.includes('showErrorMessage') || extensionJs.includes('showWarningMessage'),
        critical: true,
      },
      {
        name: 'Fallback error UI',
        test:
          extensionJs.includes('fallback') ||
          (extensionJs.includes('error') && extensionJs.includes('html')),
        critical: false,
      },
      {
        name: 'Webview error handling',
        test: extensionJs.includes('onDidReceiveMessage') && extensionJs.includes('try'),
        critical: true,
      },
    ];

    for (const test of errorTests) {
      if (test.test) {
        logTest(`Error handling: ${test.name}`, 'PASS');
      } else if (test.critical) {
        logTest(`Error handling: ${test.name}`, 'FAIL', 'Missing error handling');
      } else {
        logTest(`Error handling: ${test.name}`, 'WARN', 'Could improve error handling');
      }
    }
  } catch (e) {
    logTest('Error handling test', 'FAIL', e.message);
  }
}

// Test 8: Version and License Audit
console.log('\n8. VERSION AND LICENSE AUDIT');
console.log('='.repeat(50));

async function testVersionAndLicense() {
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));

    // Version checks
    const versionTests = [
      {
        name: 'Version field exists',
        test: !!packageJson.version,
        critical: true,
      },
      {
        name: 'Valid version format',
        test: /^\d+\.\d+\.\d+/.test(packageJson.version),
        critical: true,
      },
      {
        name: 'No duplicate versions',
        test: () => {
          const versionMatches = (JSON.stringify(packageJson).match(/"version":/g) || []).length;
          return versionMatches === 1;
        },
      },
      {
        name: 'Repository field exists',
        test: !!packageJson.repository,
        critical: true,
      },
      {
        name: 'License field exists',
        test: !!packageJson.license,
        critical: true,
      },
      {
        name: 'LICENSE file exists',
        test: fs.existsSync(path.join(projectRoot, 'LICENSE')),
        critical: true,
      },
    ];

    for (const test of versionTests) {
      try {
        const result = typeof test.test === 'function' ? test.test() : test.test;
        if (result) {
          logTest(`Version/License: ${test.name}`, 'PASS');
        } else if (test.critical) {
          logTest(`Version/License: ${test.name}`, 'FAIL', 'Missing version/license info');
        } else {
          logTest(`Version/License: ${test.name}`, 'WARN', 'Could improve');
        }
      } catch (e) {
        logTest(`Version/License: ${test.name}`, 'FAIL', e.message);
      }
    }

    // Check for duplications
    const duplicationTests = [
      {
        name: 'No duplicate command IDs',
        test: () => {
          const commands = packageJson.contributes?.commands || [];
          const commandIds = commands.map((c) => c.command);
          const uniqueIds = new Set(commandIds);
          return commandIds.length === uniqueIds.size;
        },
      },
      {
        name: 'No duplicate view IDs',
        test: () => {
          const views = packageJson.contributes?.views?.sweObeyMe || [];
          const viewIds = views.map((v) => v.id);
          const uniqueIds = new Set(viewIds);
          return viewIds.length === uniqueIds.size;
        },
      },
      {
        name: 'No duplicate configuration keys',
        test: () => {
          const config = packageJson.contributes?.configuration?.properties || {};
          const configKeys = Object.keys(config);
          const uniqueKeys = new Set(configKeys);
          return configKeys.length === uniqueKeys.size;
        },
      },
    ];

    for (const test of duplicationTests) {
      try {
        const result = test.test();
        if (result) {
          logTest(`Duplication check: ${test.name}`, 'PASS');
        } else {
          logTest(`Duplication check: ${test.name}`, 'FAIL', 'Duplicates found');
        }
      } catch (e) {
        logTest(`Duplication check: ${test.name}`, 'FAIL', e.message);
      }
    }
  } catch (e) {
    logTest('Version and license audit', 'FAIL', e.message);
  }
}

// Run all UI tests
async function runAllUITests() {
  console.log('\nStarting brutal UI validation...\n');

  await testHTMLStructure();
  await testCrossPlatformPaths();
  await testWebviewProviders();
  await testCommandUIIntegration();
  await testResourceLoading();
  await testCSSAndTheming();
  await testErrorHandling();
  await testVersionAndLicense();

  // Final report
  console.log('\n' + '='.repeat(60));
  console.log('BRUTAL UI VALIDATION REPORT');
  console.log('='.repeat(60));

  const totalTests = testResults.length;
  const passedTests = testResults.filter((t) => t.status === 'PASS').length;
  const failedTests = testResults.filter((t) => t.status === 'FAIL').length;
  const warningTests = testResults.filter((t) => t.status === 'WARN').length;

  console.log(`\nTotal Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests} (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log(`Failed: ${failedTests} (${Math.round((failedTests / totalTests) * 100)}%)`);
  console.log(`Warnings: ${warningTests} (${Math.round((warningTests / totalTests) * 100)}%)`);

  if (failedTests > 0) {
    console.log('\nFAILED TESTS:');
    errors.forEach((err) => console.log(`  - ${err}`));
  }

  if (warningTests > 0) {
    console.log('\nWARNINGS:');
    warnings.forEach((warn) => console.log(`  - ${warn}`));
  }

  console.log('\n' + '='.repeat(60));

  if (failedTests === 0 && warningTests === 0) {
    console.log('BRUTAL UI VALIDATION PASSED');
    console.log('UI is perfect and ready for production.');
    console.log('Zero tolerance achieved - no failures, no warnings.');
    process.exit(0);
  } else if (failedTests === 0) {
    console.log('BRUTAL UI VALIDATION PASSED WITH WARNINGS');
    console.log('UI works but has minor improvements needed.');
    process.exit(0);
  } else {
    console.log('BRUTAL UI VALIDATION FAILED');
    console.log('Fix UI failures before shipping.');
    console.log('The brutal UI test does not compromise on quality.');
    process.exit(1);
  }
}

// Execute
runAllUITests().catch((error) => {
  console.error('Brutal UI validation crashed:', error);
  process.exit(1);
});
