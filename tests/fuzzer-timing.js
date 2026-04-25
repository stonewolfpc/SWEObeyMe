#!/usr/bin/env node

/**
 * Timing Fuzzer
 *
 * Fuzzes timing aspects: delays, race conditions, overlapping calls, cancellation mid-flight
 */

export class TimingFuzzer {
  constructor(options = {}) {
    this.maxDelay = options.maxDelay || 5000; // 5 seconds
    this.minDelay = options.minDelay || 0;
    this.raceProbability = options.raceProbability || 0.3;
  }

  /**
   * Add random delay to an operation
   */
  async addDelay(operation) {
    const delay = Math.random() * (this.maxDelay - this.minDelay) + this.minDelay;
    await this.sleep(delay);
    return operation();
  }

  /**
   * Sleep for specified milliseconds
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Simulate race condition with overlapping operations
   */
  async simulateRaceCondition(operations) {
    const promises = operations.map((op) => {
      // Add random delay to each operation
      const delay = Math.random() * 100;
      return this.sleep(delay).then(() => op());
    });

    return Promise.all(promises);
  }

  /**
   * Simulate cancellation mid-flight
   */
  async simulateCancellation(operation) {
    const controller = new AbortController();
    const signal = controller.signal;

    // Cancel at random time
    const cancelDelay = Math.random() * 1000;
    setTimeout(() => controller.abort(), cancelDelay);

    try {
      return await operation(signal);
    } catch (e) {
      if (e.name === 'AbortError') {
        throw new Error('Operation cancelled mid-flight');
      }
      throw e;
    }
  }

  /**
   * Simulate timeout
   */
  async simulateTimeout(operation, timeout = 5000) {
    return Promise.race([
      operation(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Operation timed out')), timeout)
      ),
    ]);
  }

  /**
   * Simulate backpressure
   */
  async simulateBackpressure(operation) {
    // Simulate backpressure by adding delays
    const iterations = 10;
    const results = [];

    for (let i = 0; i < iterations; i++) {
      const delay = Math.random() * 100;
      await this.sleep(delay);
      results.push(await operation(i));
    }

    return results;
  }

  /**
   * Simulate concurrent overlapping calls
   */
  async simulateOverlappingCalls(operation, count = 10) {
    const promises = [];

    for (let i = 0; i < count; i++) {
      // Start all operations with slight delays
      const delay = Math.random() * 50;
      promises.push(this.sleep(delay).then(() => operation(i)));
    }

    return Promise.allSettled(promises);
  }

  /**
   * Simulate rapid-fire requests (DDOS-like)
   */
  async simulateRapidFire(operation, count = 100) {
    const results = [];

    for (let i = 0; i < count; i++) {
      try {
        results.push(await operation(i));
      } catch (e) {
        results.push({ error: e.message });
      }
    }

    return results;
  }

  /**
   * Simulate long-running operation
   */
  async simulateLongRunning(operation, duration = 10000) {
    const startTime = Date.now();
    const result = await operation();
    const elapsed = Date.now() - startTime;

    if (elapsed > duration) {
      throw new Error(`Operation took too long: ${elapsed}ms`);
    }

    return result;
  }

  /**
   * Simulate intermittent failures
   */
  async simulateIntermittentFailure(operation, failureRate = 0.3) {
    if (Math.random() < failureRate) {
      throw new Error('Simulated intermittent failure');
    }
    return operation();
  }

  /**
   * Simulate network jitter
   */
  async simulateNetworkJitter(operation) {
    const jitter = Math.random() * 200 - 100; // -100ms to +100ms
    if (jitter > 0) {
      await this.sleep(jitter);
    }
    return operation();
  }

  /**
   * Simulate resource exhaustion
   */
  async simulateResourceExhaustion(operation) {
    // Simulate memory pressure by creating large objects
    const largeArrays = [];

    for (let i = 0; i < 10; i++) {
      largeArrays.push(new Array(1000000).fill(0));
    }

    try {
      const result = await operation();
      largeArrays.length = 0; // Cleanup
      return result;
    } catch (e) {
      largeArrays.length = 0; // Cleanup
      throw e;
    }
  }

  /**
   * Generate timing chaos scenario
   */
  async generateChaosScenario(operation) {
    const scenarios = [
      () => this.simulateRaceCondition([operation, operation, operation]),
      () => this.simulateCancellation(() => operation()),
      () => this.simulateTimeout(() => operation(), 1000),
      () => this.simulateBackpressure((i) => operation(i)),
      () => this.simulateOverlappingCalls((i) => operation(i), 10),
      () => this.simulateRapidFire((i) => operation(i), 50),
      () => this.simulateLongRunning(() => operation(), 5000),
      () => this.simulateIntermittentFailure(() => operation(), 0.3),
      () => this.simulateNetworkJitter(() => operation()),
      () => this.simulateResourceExhaustion(() => operation()),
    ];

    const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    return await scenario();
  }

  /**
   * Run timing fuzz batch
   */
  async runFuzzBatch(operation, count = 50) {
    const results = [];

    for (let i = 0; i < count; i++) {
      const scenarioType = [
        'race_condition',
        'cancellation',
        'timeout',
        'backpressure',
        'overlapping_calls',
        'rapid_fire',
        'long_running',
        'intermittent_failure',
        'network_jitter',
        'resource_exhaustion',
      ][i % 10];

      const startTime = Date.now();
      let result;
      let error = null;

      try {
        result = await this.generateChaosScenario(operation);
      } catch (e) {
        error = e.message;
      }

      const elapsed = Date.now() - startTime;

      results.push({
        scenarioType,
        success: error === null,
        result,
        error,
        elapsed,
      });
    }

    return results;
  }

  /**
   * Measure operation performance
   */
  async measurePerformance(operation, iterations = 100) {
    const times = [];

    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      await operation();
      times.push(Date.now() - start);
    }

    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);
    const p50 = times.sort((a, b) => a - b)[Math.floor(times.length / 2)];
    const p95 = times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)];
    const p99 = times.sort((a, b) => a - b)[Math.floor(times.length * 0.99)];

    return {
      avg,
      min,
      max,
      p50,
      p95,
      p99,
      times,
    };
  }

  /**
   * Detect memory leaks
   */
  async detectMemoryLeaks(operation, iterations = 100) {
    if (typeof process === 'undefined' || !process.memoryUsage) {
      return { error: 'Memory detection not available in this environment' };
    }

    const initialMemory = process.memoryUsage().heapUsed;
    const memorySnapshots = [];

    for (let i = 0; i < iterations; i++) {
      await operation();
      memorySnapshots.push(process.memoryUsage().heapUsed);
    }

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryGrowth = finalMemory - initialMemory;
    const avgGrowth = memoryGrowth / iterations;

    return {
      initialMemory,
      finalMemory,
      memoryGrowth,
      avgGrowth,
      memorySnapshots,
      hasLeak: memoryGrowth > 10 * 1024 * 1024, // 10MB threshold
    };
  }
}
