/**
 * Edge Case & Chaos Fuzzer
 * Continuously generates extreme scenarios to find hidden bugs
 * Designed to run regularly (CI/CD) to catch regressions
 */

import { promises as fs, createWriteStream } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHAOS_DIR = path.join(__dirname, 'chaos-files');

// Chaos configuration
const CHAOS_CONFIG = {
  // File sizes to test
  SIZES: [0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597, 2584, 4181, 6765],
  
  // Special Unicode characters
  UNICODE_RANGES: [
    [0x0000, 0x001F],   // Control characters
    [0x007F, 0x009F],   // More control chars
    [0x2000, 0x206F],   // General punctuation
    [0x2600, 0x26FF],   // Misc symbols
    [0x2700, 0x27BF],   // Dingbats
    [0x1F600, 0x1F64F], // Emoticons
    [0xFF00, 0xFFEF],   // Fullwidth forms
  ],
  
  // Path injection attempts
  PATH_ATTACKS: [
    '..',
    '../..',
    '../../../',
    '..\\..\\..',
    '/../',
    '\\..\\',
    '%2e%2e',
    '%252e%252e',
    '..%c0%af',
    '....//',
    '....\\',
  ],
  
  // Encoding edge cases
  ENCODINGS: [
    'utf8',
    'utf16le',
    'latin1',
    'ascii',
    'base64',
    'hex',
  ],
};

/**
 * Generate random string with specific characteristics
 */
function generateChaosString(type, length = 100) {
  switch (type) {
    case 'ascii':
      return Array(length).fill(0).map(() => 
        String.fromCharCode(32 + Math.floor(Math.random() * 95))
      ).join('');
      
    case 'unicode':
      const range = CHAOS_CONFIG.UNICODE_RANGES[
        Math.floor(Math.random() * CHAOS_CONFIG.UNICODE_RANGES.length)
      ];
      return Array(length).fill(0).map(() => 
        String.fromCharCode(range[0] + Math.floor(Math.random() * (range[1] - range[0])))
      ).join('');
      
    case 'mixed':
      return Array(length).fill(0).map(() => {
        const r = Math.random();
        if (r < 0.5) return String.fromCharCode(32 + Math.floor(Math.random() * 95));
        if (r < 0.8) return String.fromCharCode(0x4E00 + Math.floor(Math.random() * 1000));
        return String.fromCharCode(0x1F600 + Math.floor(Math.random() * 80));
      }).join('');
      
    case 'binary-like':
      return Array(length).fill(0).map(() => 
        String.fromCharCode(Math.floor(Math.random() * 256))
      ).join('');
      
    case 'newlines':
      return Array(length).fill(0).map(() => {
        const r = Math.random();
        if (r < 0.33) return 'line\n';
        if (r < 0.66) return 'line\r\n';
        return 'line\r';
      }).join('');
      
    case 'tabs':
      return 'line1\t\t\t\tline2\t\t\t\tline3';
      
    case 'nulls':
      return 'hello\x00world\x00test\x00data\x00';
      
    case 'path-injection':
      return CHAOS_CONFIG.PATH_ATTACKS[
        Math.floor(Math.random() * CHAOS_CONFIG.PATH_ATTACKS.length)
      ];
      
    case 'bomb':
      // Exponential expansion pattern (like ZIP bomb concept)
      return 'a'.repeat(length);
      
    default:
      return 'x'.repeat(length);
  }
}

/**
 * Generate filename chaos
 */
function generateChaosFilename() {
  const attacks = [
    ...CHAOS_CONFIG.PATH_ATTACKS,
    'file<nul>.txt',
    'file>con.txt',
    'file"quote.txt',
    'file*star.txt',
    'file?ques.txt',
    'file:colon.txt',
    'file|pipe.txt',
    'file.name.with.many.dots.txt',
    '.hidden',
    '..hidden',
    'CON',
    'PRN',
    'AUX',
    'NUL',
    'COM1',
    'LPT1',
    'FILE~1.TXT',
    'file\x00name.txt',
    'file\x0aname.txt',
    'file\r\nname.txt',
    'file\x1fname.txt',
    'file\x7fname.txt',
    'file\x9fname.txt',
    'file\xa0name.txt',
    'file\xffname.txt',
    generateChaosString('unicode', 50),
  ];
  
  return attacks[Math.floor(Math.random() * attacks.length)];
}

/**
 * Create chaos test file
 */
async function createChaosFile(name, content) {
  await fs.mkdir(CHAOS_DIR, { recursive: true });
  const filePath = path.join(CHAOS_DIR, name);
  await fs.writeFile(filePath, content);
  return filePath;
}

/**
 * Fuzz test: Document converter with chaos inputs
 */
async function fuzzDocumentConverter() {
  console.log('Fuzzing DocumentConverter with chaos inputs...');
  
  const results = {
    tested: 0,
    crashed: [],
    slow: [],
    passed: [],
  };
  
  const { extractDocumentText, detectDocumentType } = await import('../lib/shared/document-converter.js');
  
  // Test 1: Chaos filenames
  for (let i = 0; i < 20; i++) {
    const filename = generateChaosFilename();
    const sanitized = filename.replace(/[<>"/\\|?*\x00-\x1f]/g, '_').substring(0, 100);
    
    try {
      const start = Date.now();
      const detected = detectDocumentType(sanitized);
      const duration = Date.now() - start;
      
      results.tested++;
      
      if (duration > 1000) {
        results.slow.push({ test: `detect ${sanitized}`, duration });
      }
    } catch (error) {
      results.crashed.push({ test: `detect ${sanitized}`, error: error.message });
    }
  }
  
  // Test 2: Chaos content extraction
  const contentTypes = ['ascii', 'unicode', 'mixed', 'binary-like', 'newlines', 'nulls'];
  
  for (const type of contentTypes) {
    for (const size of [10, 100, 1000, 10000]) {
      const content = generateChaosString(type, size);
      const filename = `chaos_${type}_${size}.txt`;
      
      try {
        const filepath = await createChaosFile(filename, content);
        const start = Date.now();
        
        const result = await extractDocumentText(filepath);
        const duration = Date.now() - start;
        
        results.tested++;
        
        // Any result (success or fail) is OK, crash is not
        if (duration > 5000) {
          results.slow.push({ test: `extract ${type} ${size}`, duration });
        } else {
          results.passed.push({ test: `extract ${type} ${size}`, duration });
        }
        
        // Cleanup
        await fs.unlink(filepath).catch(() => {});
      } catch (error) {
        results.crashed.push({ 
          test: `extract ${type} ${size}`, 
          error: error.message 
        });
      }
    }
  }
  
  return results;
}

/**
 * Fuzz test: Streaming reader with chaos
 */
async function fuzzStreamingReader() {
  console.log('Fuzzing StreamingFileReader with chaos...');
  
  const results = {
    tested: 0,
    crashed: [],
    slow: [],
    passed: [],
  };
  
  const { StreamingFileReader } = await import('../lib/shared/streaming-utils.js');
  
  // Test chaos files
  for (const size of CHAOS_CONFIG.SIZES.slice(0, 10)) {
    for (const type of ['ascii', 'unicode', 'newlines']) {
      const content = generateChaosString(type, size * 10);
      const filename = `stream_${type}_${size}.txt`;
      
      try {
        const filepath = await createChaosFile(filename, content);
        const start = Date.now();
        
        const reader = new StreamingFileReader(filepath);
        const init = await reader.initialize();
        
        if (init.success) {
          // Try various read patterns
          const readStart = Math.floor(Math.random() * Math.max(1, init.totalLines));
          const readCount = Math.floor(Math.random() * 100) + 1;
          
          await reader.readLines(readStart, readStart + readCount);
        }
        
        const duration = Date.now() - start;
        results.tested++;
        
        if (duration > 30000) {
          results.slow.push({ test: `stream ${type} ${size}`, duration });
        } else {
          results.passed.push({ test: `stream ${type} ${size}`, duration });
        }
        
        await fs.unlink(filepath).catch(() => {});
      } catch (error) {
        results.crashed.push({
          test: `stream ${type} ${size}`,
          error: error.message,
        });
      }
    }
  }
  
  // Test boundary conditions
  const boundaryTests = [
    { name: 'exact-chunk', size: 1000 },    // Exactly one chunk
    { name: 'chunk-minus-1', size: 999 }, // Just under chunk size
    { name: 'chunk-plus-1', size: 1001 },  // Just over chunk size
    { name: 'double-chunk', size: 2000 },  // Exactly two chunks
  ];
  
  for (const test of boundaryTests) {
    try {
      const content = generateChaosString('ascii', test.size * 10);
      const filepath = await createChaosFile(`boundary_${test.name}.txt`, content);
      
      const reader = new StreamingFileReader(filepath);
      await reader.initialize();
      
      // Read across chunk boundary
      await reader.readLines(990, 1010);
      
      results.tested++;
      results.passed.push({ test: `boundary ${test.name}` });
      
      await fs.unlink(filepath).catch(() => {});
    } catch (error) {
      results.crashed.push({
        test: `boundary ${test.name}`,
        error: error.message,
      });
    }
  }
  
  return results;
}

/**
 * Fuzz test: VS Developer executor
 */
async function fuzzVsDevExecutor() {
  console.log('Fuzzing VSDevExecutor with chaos...');
  
  const results = {
    tested: 0,
    crashed: [],
    slow: [],
    passed: [],
  };
  
  const { 
    isVsDevTool, 
    validateVsCommand,
    executeVsDevCommand 
  } = await import('../lib/shared/vsdev-executor.js');
  
  // Test 1: Chaos command detection
  const chaosCommands = [
    '',
    '   ',
    '\t',
    '\n',
    null,
    undefined,
    123,
    {},
    [],
    'msbuild',
    'MSBUILD',
    'MsBuild',
    'cl',
    'CL',
    'Cl',
    'msbuild.exe',
    '/usr/bin/msbuild',
    'C:\\Program Files\\MSBuild.exe',
    'msbuild test.sln /p:Configuration=Release',
    'cl main.cpp /O2 /std:c++20',
    'gcc main.c',
    'make all',
    '<script>alert(1)</script>',
    '$(whoami)',
    '`ls -la`',
    '${process.exit(1)}',
    'A'.repeat(10000),
    ...CHAOS_CONFIG.PATH_ATTACKS.map(p => `msbuild ${p}test.sln`),
  ];
  
  for (const cmd of chaosCommands) {
    try {
      const start = Date.now();
      const isTool = isVsDevTool(cmd);
      const duration = Date.now() - start;
      
      results.tested++;
      
      if (duration > 100) {
        results.slow.push({ test: `isTool "${String(cmd).substring(0, 50)}"`, duration });
      } else {
        results.passed.push({ test: `isTool "${String(cmd).substring(0, 50)}"` });
      }
    } catch (error) {
      results.crashed.push({
        test: `isTool "${String(cmd).substring(0, 50)}"`,
        error: error.message,
      });
    }
  }
  
  return results;
}

/**
 * Generate chaos report
 */
async function generateChaosReport(allResults) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: 0,
      passed: 0,
      crashed: 0,
      slow: 0,
    },
    details: allResults,
  };
  
  for (const [name, results] of Object.entries(allResults)) {
    report.summary.total += results.tested;
    report.summary.passed += results.passed.length;
    report.summary.crashed += results.crashed.length;
    report.summary.slow += results.slow.length;
  }
  
  // Save report
  await fs.mkdir(CHAOS_DIR, { recursive: true });
  const reportPath = path.join(CHAOS_DIR, `chaos-report-${Date.now()}.json`);
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  
  // Console output
  console.log('\n' + '='.repeat(60));
  console.log('CHAOS FUZZ TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${report.summary.total}`);
  console.log(`Passed: ${report.summary.passed} ✅`);
  console.log(`Crashed: ${report.summary.crashed} ❌`);
  console.log(`Slow (> threshold): ${report.summary.slow} ⚠️`);
  console.log(`Report: ${reportPath}`);
  console.log('='.repeat(60));
  
  if (report.summary.crashed > 0) {
    console.log('\nCRASHED TESTS:');
    for (const [name, results] of Object.entries(allResults)) {
      for (const crash of results.crashed.slice(0, 3)) {
        console.log(`  ❌ [${name}] ${crash.test}: ${crash.error}`);
      }
    }
  }
  
  return report;
}

/**
 * Main fuzzer runner
 */
async function runChaosFuzzer() {
  console.log('='.repeat(60));
  console.log('EDGE CASE & CHAOS FUZZER');
  console.log('Generating extreme scenarios to find hidden bugs');
  console.log('='.repeat(60));
  
  const allResults = {
    documentConverter: await fuzzDocumentConverter(),
    vsDevExecutor: await fuzzVsDevExecutor(),
  };
  
  const report = await generateChaosReport(allResults);
  
  // Cleanup
  await fs.rm(CHAOS_DIR, { recursive: true, force: true });
  
  // Exit with error if any crashes
  process.exit(report.summary.crashed > 0 ? 1 : 0);
}

// Error handling
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

// Run
runChaosFuzzer().catch((error) => {
  console.error('Fuzzer failed:', error);
  process.exit(1);
});

