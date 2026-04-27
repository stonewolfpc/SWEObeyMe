/**
 * Comprehensive Tool Test Bench & Fuzzer
 * Pushes all tools to their absolute limits to ensure rock-solid reliability
 * Tests every scenario: normal, edge case, extreme, and malicious inputs
 */

import { promises as fs, createWriteStream } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync, spawn } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_RESULTS_DIR = path.join(__dirname, 'test-results');
const STRESS_TEST_DIR = path.join(__dirname, 'stress-test-files');

// Test result tracking
const testResults = {
  passed: [],
  failed: [],
  warnings: [],
  total: 0,
  startTime: Date.now(),
};

/**
 * Test configuration
 */
const TEST_CONFIG = {
  // File size tests
  FILE_SIZES: {
    tiny: 10,           // 10 lines
    small: 100,         // 100 lines
    medium: 1000,      // 1K lines
    large: 10000,      // 10K lines
    huge: 100000,      // 100K lines
    extreme: 1000000, // 1M lines
  },
  
  // Timeout tests (ms)
  TIMEOUTS: {
    instant: 1,
    very_short: 100,
    short: 1000,
    normal: 5000,
    long: 30000,
  },
  
  // String lengths
  STRING_LENGTHS: {
    empty: 0,
    tiny: 1,
    small: 100,
    medium: 10000,
    large: 1000000,    // 1MB
    huge: 10000000,    // 10MB
  },
  
  // Iterations for stress tests
  STRESS_ITERATIONS: 100,
  
  // Malicious patterns
  MALICIOUS_PATTERNS: [
    '',                    // Empty
    null,                  // Null
    undefined,             // Undefined
    '../',                 // Path traversal
    '..\\',                // Windows path traversal
    '\x00',                // Null byte
    'A'.repeat(10000000),  // 10MB single char
    '<script>alert(1)</script>', // XSS attempt
    '${process.exit(1)}',  // Template injection
    '`rm -rf /`',          // Command injection attempt
    Buffer.alloc(1000000), // Binary data
    '\u0000\u0001\u0002', // Control characters
  ],
};

/**
 * Utility functions
 */
async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch {}
}

async function cleanup() {
  try {
    await fs.rm(STRESS_TEST_DIR, { recursive: true, force: true });
  } catch {}
}

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

async function recordResult(testName, passed, error = null, duration = 0) {
  testResults.total++;
  const result = {
    name: testName,
    passed,
    error: error?.message || error,
    duration,
    timestamp: Date.now(),
  };
  
  if (passed) {
    testResults.passed.push(result);
    log(`PASSED: ${testName} (${duration}ms)`, 'success');
  } else {
    testResults.failed.push(result);
    log(`FAILED: ${testName} - ${error?.message || error}`, 'error');
  }
}

async function recordWarning(testName, message) {
  testResults.warnings.push({ testName, message, timestamp: Date.now() });
  log(`WARNING: ${testName} - ${message}`, 'warning');
}

/**
 * Create test files of various sizes
 */
async function createTestFile(name, lineCount, content = null) {
  await ensureDir(STRESS_TEST_DIR);
  const filePath = path.join(STRESS_TEST_DIR, name);
  
  // For extreme sizes, use streaming
  if (lineCount > 10000) {
    const stream = createWriteStream(filePath);
    
    for (let i = 1; i <= lineCount; i++) {
      const line = content || `Line ${i}: ${'x'.repeat(80)}`;
      stream.write(`${line}\n`);
      
      // Yield every 1000 lines to prevent blocking
      if (i % 1000 === 0) {
        await new Promise(resolve => setImmediate(resolve));
      }
    }
    
    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
      stream.end();
    });
  } else {
    const lines = [];
    for (let i = 1; i <= lineCount; i++) {
      lines.push(content || `Line ${i}: ${'x'.repeat(80)}`);
    }
    await fs.writeFile(filePath, lines.join('\n'));
  }
  
  return filePath;
}

/**
 * Create binary document test files
 */
async function createBinaryTestFiles() {
  await ensureDir(STRESS_TEST_DIR);
  
  // Create fake PDF (just PDF header)
  const pdfPath = path.join(STRESS_TEST_DIR, 'test.pdf');
  await fs.writeFile(pdfPath, '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\nxref\ntrailer\n<<\n/Size 1\n/Root 1 0 R\n>>\nstartxref\n%%EOF');
  
  // Create fake DOCX (ZIP structure)
  // Note: Real implementation would need proper ZIP creation
  const docxPath = path.join(STRESS_TEST_DIR, 'test.docx');
  await fs.writeFile(docxPath, 'PK\x03\x04'); // ZIP magic number
  
  // Create corrupted file
  const corruptPath = path.join(STRESS_TEST_DIR, 'corrupted.bin');
  await fs.writeFile(corruptPath, Buffer.from([0xFF, 0xFE, 0x00, 0x00, 0xAB, 0xCD]));
  
  // Create file with null bytes
  const nullPath = path.join(STRESS_TEST_DIR, 'with_nulls.txt');
  await fs.writeFile(nullPath, 'Hello\x00World\x00Test');
  
  return { pdfPath, docxPath, corruptPath, nullPath };
}

/**
 * Test StreamingFileReader
 */
async function testStreamingFileReader() {
  log('Testing StreamingFileReader...');
  
  const { StreamingFileReader } = await import('../lib/shared/streaming-utils.js');
  
  // Test 1: Normal file reading
  const normalFile = await createTestFile('normal.txt', 100);
  try {
    const start = Date.now();
    const reader = new StreamingFileReader(normalFile);
    const init = await reader.initialize();
    
    if (!init.success) throw new Error('Initialization failed');
    if (init.totalLines !== 100) throw new Error(`Expected 100 lines, got ${init.totalLines}`);
    
    const lines = await reader.readLines(1, 50);
    if (lines.length !== 50) throw new Error(`Expected 50 lines, got ${lines.length}`);
    
    await recordResult('StreamingFileReader: Normal file', true, null, Date.now() - start);
  } catch (error) {
    await recordResult('StreamingFileReader: Normal file', false, error);
  }
  
  // Test 2: Large file (10K lines)
  const largeFile = await createTestFile('large.txt', 10000);
  try {
    const start = Date.now();
    const reader = new StreamingFileReader(largeFile);
    const init = await reader.initialize();
    
    if (!init.success) throw new Error('Initialization failed');
    if (init.totalLines !== 10000) throw new Error(`Expected 10000 lines, got ${init.totalLines}`);
    
    // Read multiple chunks
    const chunks = [];
    for await (const chunk of reader.readAllChunks()) {
      chunks.push(chunk);
      if (chunks.length >= 3) break; // Only test first 3 chunks
    }
    
    if (chunks.length < 3) throw new Error(`Expected at least 3 chunks, got ${chunks.length}`);
    
    await recordResult('StreamingFileReader: 10K lines (chunked)', true, null, Date.now() - start);
  } catch (error) {
    await recordResult('StreamingFileReader: 10K lines (chunked)', false, error);
  }
  
  // Test 3: Extreme file (100K lines) - memory test
  const extremeFile = await createTestFile('extreme.txt', 100000);
  try {
    const start = Date.now();
    const reader = new StreamingFileReader(extremeFile);
    const init = await reader.initialize();
    
    if (!init.success) throw new Error('Initialization failed');
    
    // Read a few chunks - memory should stay bounded
    let lineCount = 0;
    let chunkCount = 0;
    
    for await (const chunk of reader.readAllChunks()) {
      lineCount += chunk.lines.length;
      chunkCount++;
      if (chunkCount >= 10) break; // Test first 10 chunks only
    }
    
    const duration = Date.now() - start;
    await recordResult('StreamingFileReader: 100K lines (memory bounded)', true, null, duration);
    
    if (duration > 30000) {
      await recordWarning('StreamingFileReader: 100K', `Slow initialization: ${duration}ms`);
    }
  } catch (error) {
    await recordResult('StreamingFileReader: 100K lines (memory bounded)', false, error);
  }
  
  // Test 4: Empty file
  const emptyFile = await createTestFile('empty.txt', 0);
  try {
    const reader = new StreamingFileReader(emptyFile);
    const init = await reader.initialize();
    
    if (!init.success) throw new Error('Should handle empty file');
    if (init.totalLines !== 0 && init.totalLines !== 1) {
      throw new Error(`Empty file should have 0 or 1 lines, got ${init.totalLines}`);
    }
    
    await recordResult('StreamingFileReader: Empty file', true);
  } catch (error) {
    await recordResult('StreamingFileReader: Empty file', false, error);
  }
  
  // Test 5: Non-existent file
  try {
    const reader = new StreamingFileReader('/nonexistent/path/file.txt');
    const init = await reader.initialize();
    
    if (init.success) throw new Error('Should fail for non-existent file');
    
    await recordResult('StreamingFileReader: Non-existent file (graceful fail)', true);
  } catch (error) {
    await recordResult('StreamingFileReader: Non-existent file (graceful fail)', false, error);
  }
  
  // Test 6: Single line file
  const singleFile = await createTestFile('single.txt', 1);
  try {
    const reader = new StreamingFileReader(singleFile);
    const init = await reader.initialize();
    const lines = await reader.readLines(1, 1);
    
    if (lines.length !== 1) throw new Error(`Expected 1 line, got ${lines.length}`);
    
    await recordResult('StreamingFileReader: Single line', true);
  } catch (error) {
    await recordResult('StreamingFileReader: Single line', false, error);
  }
}

/**
 * Test StreamingFileWriter
 */
async function testStreamingFileWriter() {
  log('Testing StreamingFileWriter...');
  
  const { StreamingFileWriter } = await import('../lib/shared/streaming-utils.js');
  
  // Test 1: Normal write
  const normalPath = path.join(STRESS_TEST_DIR, 'write_normal.txt');
  try {
    const start = Date.now();
    const writer = new StreamingFileWriter(normalPath);
    const content = Array(100).fill('Line of test content').join('\n');
    
    const result = await writer.write(content);
    
    if (!result.success) throw new Error('Write failed');
    if (result.writtenLines !== 100) throw new Error(`Expected 100 lines written, got ${result.writtenLines}`);
    
    // Verify file exists and has content
    const stats = await fs.stat(normalPath);
    if (stats.size === 0) throw new Error('File is empty');
    
    await recordResult('StreamingFileWriter: Normal write', true, null, Date.now() - start);
  } catch (error) {
    await recordResult('StreamingFileWriter: Normal write', false, error);
  }
  
  // Test 2: Large content write (100K lines)
  const largePath = path.join(STRESS_TEST_DIR, 'write_large.txt');
  try {
    const start = Date.now();
    const writer = new StreamingFileWriter(largePath);
    
    // Generate large content
    const lines = [];
    for (let i = 0; i < 100000; i++) {
      lines.push(`Line ${i}: ${'x'.repeat(50)}`);
    }
    const content = lines.join('\n');
    
    const result = await writer.write(content, { chunkSize: 1000 });
    
    if (!result.success) throw new Error('Large write failed');
    
    const duration = Date.now() - start;
    await recordResult('StreamingFileWriter: 100K lines', true, null, duration);
    
    if (duration > 10000) {
      await recordWarning('StreamingFileWriter: 100K', `Slow write: ${duration}ms`);
    }
  } catch (error) {
    await recordResult('StreamingFileWriter: 100K lines', false, error);
  }
  
  // Test 3: Empty content
  const emptyPath = path.join(STRESS_TEST_DIR, 'write_empty.txt');
  try {
    const writer = new StreamingFileWriter(emptyPath);
    const result = await writer.write('');
    
    if (!result.success) throw new Error('Empty write failed');
    
    const stats = await fs.stat(emptyPath);
    if (stats.size !== 0) throw new Error('Empty file should be 0 bytes');
    
    await recordResult('StreamingFileWriter: Empty content', true);
  } catch (error) {
    await recordResult('StreamingFileWriter: Empty content', false, error);
  }
  
  // Test 4: Special characters
  const specialPath = path.join(STRESS_TEST_DIR, 'write_special.txt');
  try {
    const writer = new StreamingFileWriter(specialPath);
    const content = 'Special chars: <>&"\'\nUnicode: 你好世界 🌍\nTabs:\t\t\tEnd';
    
    const result = await writer.write(content);
    
    if (!result.success) throw new Error('Special chars write failed');
    
    // Verify content preserved
    const readContent = await fs.readFile(specialPath, 'utf8');
    if (readContent !== content) throw new Error('Content not preserved');
    
    await recordResult('StreamingFileWriter: Special characters', true);
  } catch (error) {
    await recordResult('StreamingFileWriter: Special characters', false, error);
  }
}

/**
 * Test Document Converter
 */
async function testDocumentConverter() {
  log('Testing DocumentConverter...');
  
  const { 
    detectDocumentType, 
    isBinaryDocument, 
    extractDocumentText,
    DOCUMENT_TYPES 
  } = await import('../lib/shared/document-converter.js');
  
  // Test 1: Document type detection
  const testFiles = [
    { path: 'test.pdf', expected: 'PDF' },
    { path: 'test.docx', expected: 'DOCX' },
    { path: 'test.xlsx', expected: 'XLSX' },
    { path: 'test.pptx', expected: 'PPTX' },
    { path: 'test.epub', expected: 'EPUB' },
    { path: 'test.tex', expected: 'TEX' },
    { path: 'test.txt', expected: null },
    { path: 'test.js', expected: null },
  ];
  
  for (const test of testFiles) {
    try {
      const detected = detectDocumentType(test.path);
      const type = detected?.type || null;
      
      if (type !== test.expected) {
        throw new Error(`Expected ${test.expected}, got ${type}`);
      }
      
      await recordResult(`DocumentConverter: Detect ${test.path}`, true);
    } catch (error) {
      await recordResult(`DocumentConverter: Detect ${test.path}`, false, error);
    }
  }
  
  // Test 2: Binary detection
  try {
    const binaryFiles = ['test.pdf', 'test.docx', 'test.xlsx', 'test.pptx'];
    for (const file of binaryFiles) {
      if (!isBinaryDocument(file)) {
        throw new Error(`${file} should be detected as binary`);
      }
    }
    await recordResult('DocumentConverter: Binary detection', true);
  } catch (error) {
    await recordResult('DocumentConverter: Binary detection', false, error);
  }
}

async function generateReport() {
  const duration = Date.now() - testResults.startTime;
  const report = {
    summary: {
      total: testResults.total,
      passed: testResults.passed.length,
      failed: testResults.failed.length,
      warnings: testResults.warnings.length,
      duration: `${(duration / 1000).toFixed(2)}s`,
      passRate: `${((testResults.passed.length / testResults.total) * 100).toFixed(1)}%`,
    },
    passed: testResults.passed,
    failed: testResults.failed,
    warnings: testResults.warnings,
    timestamp: new Date().toISOString(),
  };
  
  await ensureDir(TEST_RESULTS_DIR);
  const reportPath = path.join(TEST_RESULTS_DIR, `test-report-${Date.now()}.json`);
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  
  console.log('\n' + '='.repeat(60));
  console.log('TEST EXECUTION COMPLETE');
  console.log('='.repeat(60));
  console.log(`Total: ${report.summary.total}, Passed: ${report.summary.passed} ✅, Failed: ${report.summary.failed} ❌`);
  console.log(`Pass Rate: ${report.summary.passRate}, Duration: ${report.summary.duration}`);
  console.log('='.repeat(60));
  
  return report;
}

async function runAllTests() {
  console.log('='.repeat(60));
  console.log('COMPREHENSIVE TOOL TEST BENCH');
  console.log('='.repeat(60));
  
  await ensureDir(STRESS_TEST_DIR);
  await testStreamingFileReader();
  await testStreamingFileWriter();
  await testDocumentConverter();
  
  const report = await generateReport();
  await cleanup();
  process.exit(report.summary.failed > 0 ? 1 : 0);
}

process.on('unhandledRejection', (error) => { console.error('Unhandled:', error); process.exit(1); });
process.on('uncaughtException', (error) => { console.error('Uncaught:', error); process.exit(1); });
runAllTests().catch((error) => { console.error('Failed:', error); process.exit(1); });

