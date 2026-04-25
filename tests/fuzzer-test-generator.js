#!/usr/bin/env node

/**
 * Fuzz Failure to Permanent Test Generator
 *
 * Converts fuzz failures into deterministic regression tests
 * Ensures that once a bug is found, it never comes back
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class FuzzTestGenerator {
  constructor(options = {}) {
    this.outputDir = options.outputDir || path.join(__dirname, 'fuzzer-generated');
    this.templatePath = options.templatePath || path.join(__dirname, 'fuzzer-test-template.js');
  }

  /**
   * Initialize output directory
   */
  async init() {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
    } catch (e) {
      // Directory may already exist
    }
  }

  /**
   * Generate a test from a fuzz failure
   */
  async generateTest(failure) {
    const testName = this.generateTestName(failure);
    const testContent = this.generateTestContent(failure, testName);
    const testPath = path.join(this.outputDir, `${testName}.js`);

    await fs.writeFile(testPath, testContent);

    return {
      testName,
      testPath,
      testContent,
    };
  }

  /**
   * Generate test name from failure
   */
  generateTestName(failure) {
    const timestamp = Date.now();
    const type = failure.type || 'generic';
    const invariant = failure.invariant || 'unknown';
    const sanitized = invariant.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();

    return `fuzz_${type}_${sanitized}_${timestamp}`;
  }

  /**
   * Generate test content from failure
   */
  generateTestContent(failure, testName) {
    const { type, invariant, message, error, platform } = failure;

    let testLogic = '';

    switch (type) {
      case 'crash':
        testLogic = this.generateCrashTest(failure);
        break;
      case 'hang':
        testLogic = this.generateHangTest(failure);
        break;
      case 'protocol_violation':
        testLogic = this.generateProtocolTest(failure);
        break;
      case 'safety_violation':
        testLogic = this.generateSafetyTest(failure);
        break;
      case 'transport_error':
        testLogic = this.generateTransportTest(failure);
        break;
      case 'timing_error':
        testLogic = this.generateTimingTest(failure);
        break;
      default:
        testLogic = this.generateGenericTest(failure);
    }

    return `#!/usr/bin/env node

/**
 * Auto-generated fuzzer regression test
 * Generated from fuzz failure: ${invariant}
 * Platform: ${platform || 'generic'}
 * Timestamp: ${new Date().toISOString()}
 * 
 * This test ensures that the bug found by the fuzzer never returns
 */

import { GenericMCPFuzzer } from './fuzzer-generic-runtime.js';

export class ${testName} {
  constructor() {
    this.fuzzer = new GenericMCPFuzzer({
      platform: '${platform || 'generic'}'
    });
  }

  async run() {
    console.log('Running regression test: ${testName}');
    console.log('Original failure: ${error || 'Unknown error'}');
    
    try {
      await this.fuzzer.startServer();
      
      // Reproduce the exact failure scenario
${testLogic}
      
      await this.fuzzer.stopServer();
      
      console.log('✅ Test passed - bug is fixed');
      return true;
    } catch (e) {
      console.error('❌ Test failed - bug still present');
      console.error('Error:', e.message);
      return false;
    }
  }
}

// Run test if executed directly
if (import.meta.url === \`file://\${process.argv[1]}\`) {
  const test = new ${testName}();
  const result = await test.run();
  process.exit(result ? 0 : 1);
}
`;
  }

  /**
   * Generate crash test
   */
  generateCrashTest(failure) {
    const { message } = failure;
    const messageStr = JSON.stringify(message, null, 2);

    return `      // Send the message that caused the crash
      const crashMessage = ${messageStr};
      
      try {
        await this.fuzzer.sendMessage(crashMessage);
        
        // If we get here, check if server is still alive
        if (!this.fuzzer.server || this.fuzzer.server.killed) {
          throw new Error('Server crashed after receiving message');
        }
      } catch (e) {
        if (e.message.includes('crashed')) {
          throw e;
        }
      }`;
  }

  /**
   * Generate hang test
   */
  generateHangTest(failure) {
    const { message } = failure;
    const messageStr = JSON.stringify(message, null, 2);

    return `      // Send the message that caused the hang
      const hangMessage = ${messageStr};
      
      // Set a shorter timeout for the test
      const originalTimeout = this.fuzzer.timeout;
      this.fuzzer.timeout = 5000; // 5 seconds
      
      try {
        await this.fuzzer.sendMessage(hangMessage);
        throw new Error('Expected hang but server responded');
      } catch (e) {
        if (e.message === 'Message timeout') {
          throw new Error('Server still hangs on this message');
        }
        // If we get here, the hang is fixed
      } finally {
        this.fuzzer.timeout = originalTimeout;
      }`;
  }

  /**
   * Generate protocol test
   */
  generateProtocolTest(failure) {
    const { invariant, message } = failure;
    const messageStr = JSON.stringify(message, null, 2);

    return `      // Send message to test protocol invariant: ${invariant}
      const testMessage = ${messageStr};
      
      const response = await this.fuzzer.sendMessage(testMessage);
      const parsed = JSON.parse(response);
      
      // Validate the invariant
      switch ('${invariant}') {
        case 'EVERY_REQUEST_GETS_RESPONSE':
          if (!response) {
            throw new Error('Request did not get a response');
          }
          break;
        case 'VALID_REQUEST_ID':
          if (parsed.id !== testMessage.id && parsed.id !== null) {
            throw new Error('Request ID mismatch');
          }
          break;
        case 'VALID_JSON_RPC':
          if (parsed.jsonrpc !== '2.0') {
            throw new Error('Invalid JSON-RPC version');
          }
          break;
        default:
          throw new Error('Unknown invariant: ${invariant}');
      }`;
  }

  /**
   * Generate safety test
   */
  generateSafetyTest(failure) {
    const { invariant, message } = failure;
    const messageStr = JSON.stringify(message, null, 2);

    return `      // Send message to test safety invariant: ${invariant}
      const testMessage = ${messageStr};
      
      const response = await this.fuzzer.sendMessage(testMessage);
      const parsed = JSON.parse(response);
      
      // Validate the invariant
      switch ('${invariant}') {
        case 'NO_PATH_TRAVERSAL':
          if (!parsed.error) {
            throw new Error('Path traversal attack succeeded');
          }
          break;
        case 'NO_DESTRUCTIVE_WITHOUT_CONFIRMATION':
          if (!parsed.error && !parsed.result.requiresConfirmation) {
            throw new Error('Destructive operation without confirmation');
          }
          break;
        default:
          throw new Error('Unknown invariant: ${invariant}');
      }`;
  }

  /**
   * Generate transport test
   */
  generateTransportTest(failure) {
    const { transport, fuzzed } = failure;
    const fuzzedStr = JSON.stringify(fuzzed, null, 2);

    return `      // Test transport: ${transport}
      const fuzzedData = ${fuzzedStr};
      
      try {
        if (typeof fuzzedData === 'string') {
          await this.fuzzer.sendMessage(JSON.parse(fuzzedData));
        } else if (Array.isArray(fuzzedData)) {
          const reassembled = fuzzedData.join('');
          await this.fuzzer.sendMessage(JSON.parse(reassembled));
        }
        
        // If we get here, the transport issue is fixed
      } catch (e) {
        throw new Error('Transport error still occurs: ' + e.message);
      }`;
  }

  /**
   * Generate timing test
   */
  generateTimingTest(failure) {
    const { scenarioType } = failure;

    return `      // Test timing scenario: ${scenarioType}
      
      const testOperation = async (i) => {
        const message = this.fuzzer.messageFuzzer.generateRequest();
        return await this.fuzzer.sendMessage(message);
      };
      
      try {
        await this.fuzzer.timingFuzzer.generateChaosScenario(testOperation);
        
        // If we get here, the timing issue is fixed
      } catch (e) {
        throw new Error('Timing error still occurs: ' + e.message);
      }`;
  }

  /**
   * Generate generic test
   */
  generateGenericTest(failure) {
    const { message, error } = failure;
    const messageStr = JSON.stringify(message, null, 2);

    return `      // Generic test for failure
      const testMessage = ${messageStr};
      
      try {
        await this.fuzzer.sendMessage(testMessage);
        
        // If the original error was expected, this should fail
        throw new Error('Expected failure but operation succeeded');
      } catch (e) {
        if (e.message === '${error}') {
          throw new Error('Original error still occurs: ' + e.message);
        }
      }`;
  }

  /**
   * Generate tests from fuzzer report
   */
  async generateTestsFromReport(report) {
    const tests = [];

    // Generate tests from crashes
    for (const crash of report.crashes) {
      const test = await this.generateTest({
        type: 'crash',
        ...crash,
        platform: report.platform,
      });
      tests.push(test);
    }

    // Generate tests from hangs
    for (const hang of report.hangs) {
      const test = await this.generateTest({
        type: 'hang',
        ...hang,
        platform: report.platform,
      });
      tests.push(test);
    }

    // Generate tests from invariant violations
    const allInvariants = [
      ...Object.values(report.serverInvariants.violations || {}),
      ...Object.values(report.protocolInvariants.violations || {}),
      ...Object.values(report.safetyInvariants.violations || {}),
    ];

    for (const violation of allInvariants) {
      const test = await this.generateTest({
        type:
          violation.invariant.includes('NO_PATH_TRAVERSAL') ||
          violation.invariant.includes('NO_DESTRUCTIVE')
            ? 'safety_violation'
            : 'protocol_violation',
        invariant: violation.invariant,
        description: violation.description,
        platform: report.platform,
      });
      tests.push(test);
    }

    // Generate tests from errors
    for (const error of report.errors) {
      const test = await this.generateTest({
        type: 'generic',
        ...error,
        platform: report.platform,
      });
      tests.push(test);
    }

    return tests;
  }

  /**
   * Generate test index file
   */
  async generateTestIndex(tests) {
    const indexContent = `#!/usr/bin/env node

/**
 * Auto-generated fuzzer regression test suite
 * Generated: ${new Date().toISOString()}
 * Total tests: ${tests.length}
 */

const tests = [
${tests.map((t) => `  '${t.testName}',`).join('\n')}
];

export { tests };
`;

    const indexPath = path.join(this.outputDir, 'index.js');
    await fs.writeFile(indexPath, indexContent);

    return indexPath;
  }

  /**
   * Run all generated tests
   */
  async runGeneratedTests() {
    const testFiles = await fs.readdir(this.outputDir);
    const results = [];

    for (const file of testFiles) {
      if (file.endsWith('.js') && file !== 'index.js') {
        const testPath = path.join(this.outputDir, file);

        try {
          const { default: TestClass } = await import(testPath);
          const test = new TestClass();
          const result = await test.run();
          results.push({ file, result });
        } catch (e) {
          results.push({ file, error: e.message, result: false });
        }
      }
    }

    return results;
  }
}
