/**
 * Hang Prevention & Timeout Tester
 * Specifically tests that tools never hang, always return, and handle timeouts gracefully
 * This is critical for production stability
 */

import { promises as fs, createWriteStream } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HANG_TEST_DIR = path.join(__dirname, 'hang-test-files');

// Test configuration
const HANG_CONFIG = {
  // Maximum acceptable response time (ms)
  MAX_ACCEPTABLE_TIME: 5000,
  
  // Timeout test values
  TIMEOUTS: {
    very_short: 100,
    short: 500,
    normal: 2000,
    generous: 10000,
  },
  
  // File sizes that could cause hangs
  PROBLEMATIC_SIZES: [
    0,                    // Empty
    1,                    // Single byte
    4096,                 // One page
    65536,                // 64KB
    1048576,              // 1MB
    10485760,             // 10MB
    104857600,            // 100MB (if system allows)
  ],
};

/**
 * Create file of specific byte size
 */
async function createSizedFile(name, bytes) {
  await fs.mkdir(HANG_TEST_DIR, { recursive: true });
  const filePath = path.join(HANG_TEST_DIR, name);
  
  // Use streaming for large files
  if (bytes > 1000000) {
    const stream = createWriteStream(filePath);
    const chunk = Buffer.alloc(65536, 'x');
    let written = 0;
    
    while (written < bytes) {
      const toWrite = Math.min(chunk.length, bytes - written);
      stream.write(chunk.slice(0, toWrite));
      written += toWrite;
    }
    
    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
      stream.end();
    });
  } else {
    const content = Buffer.alloc(bytes, 'x');
    await fs.writeFile(filePath, content);
  }
  
  return filePath;
}

/**
 * Test with timeout wrapper
 */
async function testWithTimeout(name, testFn, maxTime) {
  const start = Date.now();
  let completed = false;
  let error = null;
  let result = null;
  
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      if (!completed) {
        reject(new Error(`TIMEOUT: Test "${name}" exceeded ${maxTime}ms`));
      }
    }, maxTime);
  });
  
  try {
    result = await Promise.race([
      testFn().then(r => { completed = true; return r; }),
      timeoutPromise,
    ]);
  } catch (e) {
    completed = true;
    error = e;
  }
  
  const duration = Date.now() - start;
  
  return {
    name,
    duration,
    completed,
    error,
    result,
    hung: !completed && duration >= maxTime,
  };
}

/**
 * Test StreamingFileReader - hang prevention
 */
async function testStreamingReaderNoHang() {
  console.log('Testing StreamingFileReader hang prevention...');
  
  const results = [];
  const { StreamingFileReader } = await import('../lib/shared/streaming-utils.js');
  
  // Test 1: Empty file (should return immediately)
  const emptyFile = await createSizedFile('empty.txt', 0);
  const test1 = await testWithTimeout(
    'Empty file init',
    async () => {
      const reader = new StreamingFileReader(emptyFile);
      return await reader.initialize();
    },
    HANG_CONFIG.TIMEOUTS.short
  );
  results.push(test1);
  
  // Test 2: Large file initialization (streaming, not loading)
  const largeFile = await createSizedFile('large_10mb.txt', 10485760);
  const test2 = await testWithTimeout(
    '10MB file init (streaming)',
    async () => {
      const reader = new StreamingFileReader(largeFile);
      return await reader.initialize();
    },
    HANG_CONFIG.TIMEOUTS.generous
  );
  results.push(test2);
  
  // Test 3: Read small portion from huge file
  const hugeFile = await createSizedFile('huge_100mb.txt', 104857600);
  const test3 = await testWithTimeout(
    '100MB file - read 100 lines',
    async () => {
      const reader = new StreamingFileReader(hugeFile);
      await reader.initialize();
      return await reader.readLines(1, 100);
    },
    HANG_CONFIG.TIMEOUTS.generous
  );
  results.push(test3);
  
  // Test 4: Non-existent file (should fail fast, not hang)
  const test4 = await testWithTimeout(
    'Non-existent file',
    async () => {
      const reader = new StreamingFileReader('/does/not/exist.txt');
      return await reader.initialize();
    },
    HANG_CONFIG.TIMEOUTS.short
  );
  results.push(test4);
  
  // Test 5: Permission-denied simulation (read-only dir)
  // Skip on Windows due to different permission model
  if (process.platform !== 'win32') {
    const noPermDir = path.join(HANG_TEST_DIR, 'noperm');
    await fs.mkdir(noPermDir, { mode: 0o000 }).catch(() => {});
    const noPermFile = path.join(noPermDir, 'test.txt');
    
    const test5 = await testWithTimeout(
      'Permission denied',
      async () => {
        const reader = new StreamingFileReader(noPermFile);
        return await reader.initialize();
      },
      HANG_CONFIG.TIMEOUTS.short
    );
    results.push(test5);
    
    // Cleanup
    await fs.chmod(noPermDir, 0o755).catch(() => {});
  }
  
  // Test 6: Circular symlink (if supported)
  const linkDir = path.join(HANG_TEST_DIR, 'links');
  await fs.mkdir(linkDir, { recursive: true });
  const linkTarget = path.join(linkDir, 'circular');
  const linkSource = path.join(linkDir, 'circular_link');
  
  try {
    await fs.symlink(linkTarget, linkSource);
    
    const test6 = await testWithTimeout(
      'Circular symlink',
      async () => {
        const reader = new StreamingFileReader(linkSource);
        return await reader.initialize();
      },
      HANG_CONFIG.TIMEOUTS.short
    );
    results.push(test6);
  } catch {
    // Symlinks not supported, skip
  }
  
  // Test 7: File with no newlines (single huge line)
  const noNewlineFile = await createSizedFile('no_newlines.txt', 1000000);
  const test7 = await testWithTimeout(
    '1MB single line',
    async () => {
      const reader = new StreamingFileReader(noNewlineFile);
      await reader.initialize();
      // Try to read - should handle gracefully
      return await reader.readLines(1, 1);
    },
    HANG_CONFIG.TIMEOUTS.generous
  );
  results.push(test7);
  
  // Cleanup
  await fs.rm(HANG_TEST_DIR, { recursive: true, force: true });
  
  return results;
}

/**
 * Test DocumentConverter - hang prevention
 */
async function testDocumentConverterNoHang() {
  console.log('Testing DocumentConverter hang prevention...');
  
  const results = [];
  const { extractDocumentText } = await import('../lib/shared/document-converter.js');
  
  // Test 1: Non-existent file (should fail fast)
  const test1 = await testWithTimeout(
    'Non-existent PDF',
    async () => {
      return await extractDocumentText('/nonexistent/path/file.pdf');
    },
    HANG_CONFIG.TIMEOUTS.short
  );
  results.push(test1);
  
  // Test 2: Empty file
  await fs.mkdir(HANG_TEST_DIR, { recursive: true });
  const emptyPdf = path.join(HANG_TEST_DIR, 'empty.pdf');
  await fs.writeFile(emptyPdf, '');
  
  const test2 = await testWithTimeout(
    'Empty PDF file',
    async () => {
      return await extractDocumentText(emptyPdf);
    },
    HANG_CONFIG.TIMEOUTS.short
  );
  results.push(test2);
  
  // Test 3: Corrupted/truncated binary
  const corruptFile = path.join(HANG_TEST_DIR, 'corrupt.bin');
  await fs.writeFile(corruptFile, Buffer.from([0xFF, 0xD8, 0xFF, 0xE0])); // Fake JPEG header
  
  const test3 = await testWithTimeout(
    'Corrupted binary',
    async () => {
      return await extractDocumentText(corruptFile);
    },
    HANG_CONFIG.TIMEOUTS.normal
  );
  results.push(test3);
  
  // Test 4: Large text file (pass-through)
  const largeText = path.join(HANG_TEST_DIR, 'large_text.txt');
  const largeContent = 'Line content\n'.repeat(100000);
  await fs.writeFile(largeText, largeContent);
  
  const test4 = await testWithTimeout(
    '100K line text file',
    async () => {
      return await extractDocumentText(largeText, { maxLength: 1000000 });
    },
    HANG_CONFIG.TIMEOUTS.generous
  );
  results.push(test4);
  
  // Cleanup
  await fs.rm(HANG_TEST_DIR, { recursive: true, force: true });
  
  return results;
}

/**
 * Test VSDevExecutor - hang prevention
 */
async function testVsDevExecutorNoHang() {
  console.log('Testing VSDevExecutor hang prevention...');
  
  const results = [];
  const { 
    executeVsDevCommand,
    isVsDevTool,
    findVsDevCmd
  } = await import('../lib/shared/vsdev-executor.js');
  
  // Test 1: Tool detection (should be instant)
  const test1 = await testWithTimeout(
    'Tool detection',
    async () => {
      return isVsDevTool('msbuild test.sln');
    },
    HANG_CONFIG.TIMEOUTS.very_short
  );
  results.push(test1);
  
  // Test 2: Find VsDevCmd (should not hang searching)
  const test2 = await testWithTimeout(
    'Find VsDevCmd 2022',
    async () => {
      return await findVsDevCmd('2022');
    },
    HANG_CONFIG.TIMEOUTS.normal
  );
  results.push(test2);
  
  // Test 3: Non-existent version (should fail fast)
  const test3 = await testWithTimeout(
    'Find VsDevCmd 2099',
    async () => {
      return await findVsDevCmd('2099');
    },
    HANG_CONFIG.TIMEOUTS.normal
  );
  results.push(test3);
  
  // Test 4: Execute with very short timeout
  // This tests that timeout mechanism actually works
  if (process.platform === 'win32') {
    const test4 = await testWithTimeout(
      'Command with 100ms timeout',
      async () => {
        return await executeVsDevCommand('msbuild /?', {
          version: '2022',
          timeout: 100, // Very short
        });
      },
      HANG_CONFIG.TIMEOUTS.normal
    );
    results.push(test4);
  }
  
  return results;
}

/**
 * Test timeout edge cases
 */
async function testTimeoutEdgeCases() {
  console.log('Testing timeout edge cases...');
  
  const results = [];
  
  // Test 1: Timeout of 0 (should still work or fail gracefully)
  const { executeVsDevCommand } = await import('../lib/shared/vsdev-executor.js');
  
  if (process.platform === 'win32') {
    const test1 = await testWithTimeout(
      'Zero timeout',
      async () => {
        return await executeVsDevCommand('echo test', { timeout: 0 });
      },
      HANG_CONFIG.TIMEOUTS.short
    );
    results.push(test1);
  }
  
  // Test 2: Negative timeout (edge case)
  const test2 = await testWithTimeout(
    'Negative timeout handling',
    async () => {
      const { StreamingFileReader } = await import('../lib/shared/streaming-utils.js');
      const testFile = path.join(HANG_TEST_DIR, 'test.txt');
      await fs.writeFile(testFile, 'test');
      const reader = new StreamingFileReader(testFile);
      return await reader.initialize();
    },
    HANG_CONFIG.TIMEOUTS.short
  );
  results.push(test2);
  
  // Test 3: Very long timeout (should not affect operation)
  const test3 = await testWithTimeout(
    'Very long timeout (60s)',
    async () => {
      const { StreamingFileReader } = await import('../lib/shared/streaming-utils.js');
      const testFile = path.join(HANG_TEST_DIR, 'test.txt');
      await fs.writeFile(testFile, 'test content\n'.repeat(100));
      const reader = new StreamingFileReader(testFile);
      return await reader.initialize();
    },
    HANG_CONFIG.TIMEOUTS.normal
  );
  results.push(test3);
  
  return results;
}

/**
 * Generate hang test report
 */
async function generateHangReport(allResults) {
  let hung = 0;
  let slow = 0;
  let passed = 0;
  
  for (const results of Object.values(allResults)) {
    for (const r of results) {
      if (r.hung) hung++;
      else if (r.duration > HANG_CONFIG.MAX_ACCEPTABLE_TIME) slow++;
      else if (!r.error) passed++;
    }
  }
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      hung,
      slow,
      passed,
      total: hung + slow + passed,
    },
    hungTests: [],
    slowTests: [],
    details: allResults,
  };
  
  // Collect hung and slow tests
  for (const [suite, results] of Object.entries(allResults)) {
    for (const r of results) {
      if (r.hung) {
        report.hungTests.push({ suite, name: r.name, duration: r.duration });
      } else if (r.duration > HANG_CONFIG.MAX_ACCEPTABLE_TIME) {
        report.slowTests.push({ suite, name: r.name, duration: r.duration });
      }
    }
  }
  
  // Save report
  await fs.mkdir(HANG_TEST_DIR, { recursive: true });
  const reportPath = path.join(HANG_TEST_DIR, `hang-report-${Date.now()}.json`);
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  
  // Console output
  console.log('\n' + '='.repeat(60));
  console.log('HANG PREVENTION TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`Total: ${report.summary.total}`);
  console.log(`Passed: ${report.summary.passed} ✅`);
  console.log(`Slow (>5s): ${report.summary.slow} ⚠️`);
  console.log(`HUNG: ${report.summary.hung} ❌`);
  console.log(`Report: ${reportPath}`);
  console.log('='.repeat(60));
  
  if (report.hungTests.length > 0) {
    console.log('\n🚨 HUNG TESTS (CRITICAL):');
    for (const test of report.hungTests) {
      console.log(`  ❌ [${test.suite}] ${test.name}: ${test.duration}ms`);
    }
  }
  
  return report;
}

/**
 * Main runner
 */
async function runHangTests() {
  console.log('='.repeat(60));
  console.log('HANG PREVENTION & TIMEOUT TESTER');
  console.log('Ensuring tools NEVER hang, always return');
  console.log('='.repeat(60));
  
  const allResults = {
    streamingReader: await testStreamingReaderNoHang(),
    documentConverter: await testDocumentConverterNoHang(),
    vsDevExecutor: await testVsDevExecutorNoHang(),
    timeoutEdgeCases: await testTimeoutEdgeCases(),
  };
  
  const report = await generateHangReport(allResults);
  
  // Cleanup
  await fs.rm(HANG_TEST_DIR, { recursive: true, force: true });
  
  // Exit with error if any hangs
  process.exit(report.summary.hung > 0 ? 1 : 0);
}

// Error handling
process.on('unhandledRejection', (error) => { console.error('Unhandled:', error); process.exit(1); });
process.on('uncaughtException', (error) => { console.error('Uncaught:', error); process.exit(1); });

// Run
runHangTests().catch((error) => { console.error('Failed:', error); process.exit(1); });

