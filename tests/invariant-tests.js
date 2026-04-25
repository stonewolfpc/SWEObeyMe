#!/usr/bin/env node

/**
 * Invariant Tests
 * 
 * Based on verification theory best practices from corpus
 * Tests that critical invariants always hold
 */

import fs from 'fs/promises';
import path from 'path';

class InvariantTests {
  constructor() {
    this.results = [];
    this.passed = 0;
    this.failed = 0;
  }

  /**
   * Invariant: File read after write should return written content
   */
  async testWriteReadInvariant(testDir) {
    const testFile = path.join(testDir, 'write-read-test.txt');
    const content = 'Test content for invariant check';
    
    try {
      await fs.writeFile(testFile, content);
      const readContent = await fs.readFile(testFile, 'utf8');
      const invariantHolds = readContent === content;
      
      this.results.push({
        invariant: 'write_read_consistency',
        passed: invariantHolds,
        expected: content,
        actual: readContent
      });
      
      if (invariantHolds) {
        this.passed++;
        console.log('✓ Write-read consistency invariant holds');
      } else {
        this.failed++;
        console.log('✗ Write-read consistency invariant violated');
      }
      
      // Cleanup
      await fs.unlink(testFile);
      
      return invariantHolds;
    } catch (error) {
      this.results.push({
        invariant: 'write_read_consistency',
        passed: false,
        error: error.message
      });
      this.failed++;
      console.log('✗ Write-read consistency invariant - error');
      return false;
    }
  }

  /**
   * Invariant: Directory exists after creation
   */
  async testDirectoryCreationInvariant(testDir) {
    const newDir = path.join(testDir, 'new-dir');
    
    try {
      await fs.mkdir(newDir, { recursive: true });
      const exists = await fs.access(newDir).then(() => true).catch(() => false);
      
      this.results.push({
        invariant: 'directory_creation',
        passed: exists,
        path: newDir
      });
      
      if (exists) {
        this.passed++;
        console.log('✓ Directory creation invariant holds');
      } else {
        this.failed++;
        console.log('✗ Directory creation invariant violated');
      }
      
      // Cleanup
      await fs.rm(newDir, { recursive: true, force: true });
      
      return exists;
    } catch (error) {
      this.results.push({
        invariant: 'directory_creation',
        passed: false,
        error: error.message
      });
      this.failed++;
      console.log('✗ Directory creation invariant - error');
      return false;
    }
  }

  /**
   * Invariant: JSON parse after stringify returns original
   */
  async testJsonStringifyParseInvariant(data) {
    try {
      const stringified = JSON.stringify(data);
      const parsed = JSON.parse(stringified);
      const invariantHolds = JSON.stringify(parsed) === JSON.stringify(data);
      
      this.results.push({
        invariant: 'json_stringify_parse_roundtrip',
        passed: invariantHolds,
        original: data,
        roundtripped: parsed
      });
      
      if (invariantHolds) {
        this.passed++;
        console.log('✓ JSON stringify-parse roundtrip invariant holds');
      } else {
        this.failed++;
        console.log('✗ JSON stringify-parse roundtrip invariant violated');
      }
      
      return invariantHolds;
    } catch (error) {
      this.results.push({
        invariant: 'json_stringify_parse_roundtrip',
        passed: false,
        error: error.message
      });
      this.failed++;
      console.log('✗ JSON stringify-parse roundtrip invariant - error');
      return false;
    }
  }

  /**
   * Invariant: Path normalization is idempotent
   */
  async testPathNormalizationIdempotent(inputPath) {
    const normalized1 = inputPath.replace(/\\/g, '/');
    const normalized2 = normalized1.replace(/\\/g, '/');
    const invariantHolds = normalized1 === normalized2;
    
    this.results.push({
      invariant: 'path_normalization_idempotent',
      passed: invariantHolds,
      input: inputPath,
      normalized1,
      normalized2
    });
    
    if (invariantHolds) {
      this.passed++;
      console.log('✓ Path normalization idempotent invariant holds');
    } else {
      this.failed++;
      console.log('✗ Path normalization idempotent invariant violated');
    }
    
    return invariantHolds;
  }

  /**
   * Invariant: Array length after push increases by 1
   */
  async testArrayPushInvariant(arr, element) {
    const originalLength = arr.length;
    arr.push(element);
    const newLength = arr.length;
    const invariantHolds = newLength === originalLength + 1;
    
    this.results.push({
      invariant: 'array_push_increments_length',
      passed: invariantHolds,
      originalLength,
      newLength
    });
    
    // Cleanup
    arr.pop();
    
    if (invariantHolds) {
      this.passed++;
      console.log('✓ Array push increments length invariant holds');
    } else {
      this.failed++;
      console.log('✗ Array push increments length invariant violated');
    }
    
    return invariantHolds;
  }

  /**
   * Invariant: Set contains added element
   */
  async testSetContainsInvariant(set, element) {
    set.add(element);
    const contains = set.has(element);
    
    this.results.push({
      invariant: 'set_contains_added_element',
      passed: contains,
      element
    });
    
    // Cleanup
    set.delete(element);
    
    if (contains) {
      this.passed++;
      console.log('✓ Set contains added element invariant holds');
    } else {
      this.failed++;
      console.log('✗ Set contains added element invariant violated');
    }
    
    return contains;
  }

  /**
   * Invariant: Map get returns same value as set
   */
  async testMapGetSetInvariant(map, key, value) {
    map.set(key, value);
    const retrieved = map.get(key);
    const invariantHolds = retrieved === value;
    
    this.results.push({
      invariant: 'map_get_returns_set_value',
      passed: invariantHolds,
      key,
      expected: value,
      actual: retrieved
    });
    
    // Cleanup
    map.delete(key);
    
    if (invariantHolds) {
      this.passed++;
      console.log('✓ Map get returns set value invariant holds');
    } else {
      this.failed++;
      console.log('✗ Map get returns set value invariant violated');
    }
    
    return invariantHolds;
  }

  /**
   * Invariant: Timeout prevents indefinite execution
   */
  async testTimeoutInvariant(operation, timeout) {
    const startTime = Date.now();
    
    try {
      await Promise.race([
        operation(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), timeout)
        )
      ]);
      
      const elapsed = Date.now() - startTime;
      const invariantHolds = elapsed <= timeout + 100; // Allow 100ms overhead
      
      this.results.push({
        invariant: 'timeout_prevents_indefinite_execution',
        passed: invariantHolds,
        elapsed,
        timeout
      });
      
      if (invariantHolds) {
        this.passed++;
        console.log('✓ Timeout prevents indefinite execution invariant holds');
      } else {
        this.failed++;
        console.log('✗ Timeout prevents indefinite execution invariant violated');
      }
      
      return invariantHolds;
    } catch (error) {
      const elapsed = Date.now() - startTime;
      const acceptableTimeout = error.message === 'Timeout' && elapsed <= timeout + 100;
      
      this.results.push({
        invariant: 'timeout_prevents_indefinite_execution',
        passed: acceptableTimeout,
        elapsed,
        timeout,
        error: error.message
      });
      
      if (acceptableTimeout) {
        this.passed++;
        console.log('✓ Timeout prevents indefinite execution invariant holds');
      } else {
        this.failed++;
        console.log('✗ Timeout prevents indefinite execution invariant violated');
      }
      
      return acceptableTimeout;
    }
  }

  /**
   * Run all invariant tests
   */
  async runAll() {
    const testDir = './invariant-test-temp';
    
    console.log('Invariant Tests\n');
    console.log('Based on verification theory best practices\n');
    
    // Initialize test directory
    await fs.mkdir(testDir, { recursive: true });
    
    // Test invariants
    await this.testWriteReadInvariant(testDir);
    await this.testDirectoryCreationInvariant(testDir);
    await this.testJsonStringifyParseInvariant({ test: 'data', number: 42 });
    await this.testPathNormalizationIdempotent('C:\\Users\\test\\path');
    await this.testArrayPushInvariant([1, 2, 3], 4);
    await this.testSetContainsInvariant(new Set([1, 2, 3]), 4);
    await this.testMapGetSetInvariant(new Map([['key1', 'value1']]), 'key2', 'value2');
    await this.testTimeoutInvariant(
      () => new Promise(resolve => setTimeout(resolve, 100)),
      5000
    );
    
    // Cleanup
    await fs.rm(testDir, { recursive: true, force: true });
    
    this.printSummary();
  }

  printSummary() {
    console.log('\n' + '='.repeat(50));
    console.log('Invariant Test Summary');
    console.log('='.repeat(50));
    console.log(`Passed: ${this.passed}`);
    console.log(`Failed: ${this.failed}`);
    console.log(`Total: ${this.results.length}`);
    
    if (this.failed > 0) {
      console.log('\nFailed Invariants:');
      this.results.filter(r => r.passed === false).forEach(r => {
        console.log(`  - ${r.invariant}`);
        if (r.error) console.log(`    Error: ${r.error}`);
      });
    }
    
    console.log('='.repeat(50));
    
    if (this.failed === 0) {
      console.log('\nALL TESTS PASSED');
      process.exit(0);
    } else {
      console.log('\nSOME TESTS FAILED');
      process.exit(1);
    }
  }
}

// Run tests
const invariantTests = new InvariantTests();
invariantTests.runAll().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});
