#!/usr/bin/env node

/**
 * Transport Fuzzer
 *
 * Fuzzes MCP transport layer: chunking, delays, reordering, interleaved logs, BOMs, truncated packets
 */

export class TransportFuzzer {
  constructor(options = {}) {
    this.maxDelay = options.maxDelay || 5000; // 5 seconds
    this.maxChunkSize = options.maxChunkSize || 1024; // 1KB
    this.corruptionRate = options.corruptionRate || 0.1;
  }

  /**
   * Fuzz a message through stdio transport simulation
   */
  fuzzStdio(message) {
    const fuzzers = [
      () => this.chunkMessage(message),
      () => this.addDelay(message),
      () => this.addBOM(message),
      () => this.truncateMessage(message),
      () => this.interleaveWithLogs(message),
      () => this.corruptBytes(message),
    ];

    const numFuzzers = Math.floor(Math.random() * 3) + 1;
    let result = JSON.stringify(message);

    for (let i = 0; i < numFuzzers; i++) {
      const fuzzer = fuzzers[Math.floor(Math.random() * fuzzers.length)];
      result = fuzzer(result);
    }

    return result;
  }

  /**
   * Chunk message into random-sized chunks
   */
  chunkMessage(message) {
    if (typeof message !== 'string') {
      message = JSON.stringify(message);
    }

    const chunks = [];
    let remaining = message;

    while (remaining.length > 0) {
      const chunkSize = Math.min(
        Math.floor(Math.random() * this.maxChunkSize) + 1,
        remaining.length
      );
      chunks.push(remaining.substring(0, chunkSize));
      remaining = remaining.substring(chunkSize);
    }

    return chunks;
  }

  /**
   * Add random delay metadata
   */
  addDelay(message) {
    if (typeof message !== 'string') {
      message = JSON.stringify(message);
    }

    const delay = Math.floor(Math.random() * this.maxDelay);
    return {
      data: message,
      delay,
    };
  }

  /**
   * Add BOM (Byte Order Mark)
   */
  addBOM(message) {
    if (typeof message !== 'string') {
      message = JSON.stringify(message);
    }

    const boms = [
      '\uFEFF', // UTF-8 BOM
      '\uFFFE', // UTF-16 BE BOM
      '\uFEFF', // UTF-16 LE BOM
      '\u0000\uFEFF', // UTF-32 BE BOM
      '\uFEFF\u0000', // UTF-32 LE BOM
    ];

    const bom = boms[Math.floor(Math.random() * boms.length)];
    return bom + message;
  }

  /**
   * Truncate message randomly
   */
  truncateMessage(message) {
    if (typeof message !== 'string') {
      message = JSON.stringify(message);
    }

    const truncateAt = Math.floor(Math.random() * message.length);
    return message.substring(0, truncateAt);
  }

  /**
   * Interleave with random log messages
   */
  interleaveWithLogs(message) {
    if (typeof message !== 'string') {
      message = JSON.stringify(message);
    }

    const logs = [
      '[INFO] Processing request...',
      '[DEBUG] Received message',
      '[WARN] Unexpected input',
      '[ERROR] Failed to parse',
      '[TRACE] Step 1 complete',
      'stdout: Partial output',
      'stderr: Warning message',
    ];

    const log = logs[Math.floor(Math.random() * logs.length)];
    return message + '\n' + log + '\n' + message;
  }

  /**
   * Corrupt random bytes
   */
  corruptBytes(message) {
    if (typeof message !== 'string') {
      message = JSON.stringify(message);
    }

    const bytes = Buffer.from(message);
    const numCorruptions = Math.floor(bytes.length * this.corruptionRate);

    for (let i = 0; i < numCorruptions; i++) {
      const pos = Math.floor(Math.random() * bytes.length);
      bytes[pos] = Math.floor(Math.random() * 256);
    }

    return bytes.toString('utf-8');
  }

  /**
   * Fuzz HTTP transport
   */
  fuzzHttp(message) {
    const fuzzers = [
      () => this.chunkMessage(message),
      () => this.addHttpHeaders(message),
      () => this.addDelay(message),
      () => this.corruptBytes(message),
      () => this.truncateMessage(message),
      () => this.reorderChunks(message),
    ];

    const numFuzzers = Math.floor(Math.random() * 3) + 1;
    let result = message;

    for (let i = 0; i < numFuzzers; i++) {
      const fuzzer = fuzzers[Math.floor(Math.random() * fuzzers.length)];
      result = fuzzer(result);
    }

    return result;
  }

  /**
   * Add random HTTP headers
   */
  addHttpHeaders(message) {
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': JSON.stringify(message).length,
      'Transfer-Encoding': Math.random() < 0.5 ? 'chunked' : undefined,
      Connection: Math.random() < 0.5 ? 'keep-alive' : 'close',
      'X-Custom-Header': Math.random().toString(36).substring(7),
    };

    return {
      headers,
      body: message,
    };
  }

  /**
   * Reorder message chunks
   */
  reorderChunks(message) {
    if (typeof message !== 'string') {
      message = JSON.stringify(message);
    }

    const chunks = this.chunkMessage(message);

    // Shuffle chunks
    for (let i = chunks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [chunks[i], chunks[j]] = [chunks[j], chunks[i]];
    }

    return chunks;
  }

  /**
   * Fuzz SSE (Server-Sent Events) transport
   */
  fuzzSSE(message) {
    const fuzzers = [
      () => this.addSSEFormat(message),
      () => this.addDelay(message),
      () => this.truncateMessage(message),
      () => this.interleaveWithLogs(message),
      () => this.corruptBytes(message),
    ];

    const numFuzzers = Math.floor(Math.random() * 3) + 1;
    let result = message;

    for (let i = 0; i < numFuzzers; i++) {
      const fuzzer = fuzzers[Math.floor(Math.random() * fuzzers.length)];
      result = fuzzer(result);
    }

    return result;
  }

  /**
   * Add SSE event format
   */
  addSSEFormat(message) {
    if (typeof message !== 'string') {
      message = JSON.stringify(message);
    }

    const eventTypes = ['message', 'error', 'notification', 'response'];
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];

    return `event: ${eventType}\ndata: ${message}\n\n`;
  }

  /**
   * Generate transport fuzz batch
   */
  generateFuzzBatch(count = 100) {
    const batch = [];
    const transports = ['stdio', 'http', 'sse'];

    for (let i = 0; i < count; i++) {
      const transport = transports[Math.floor(Math.random() * transports.length)];
      const message = {
        jsonrpc: '2.0',
        id: i,
        method: 'tools/call',
        params: { name: 'test_tool', arguments: {} },
      };

      let fuzzed;
      switch (transport) {
        case 'stdio':
          fuzzed = this.fuzzStdio(message);
          break;
        case 'http':
          fuzzed = this.fuzzHttp(message);
          break;
        case 'sse':
          fuzzed = this.fuzzSSE(message);
          break;
        default:
          fuzzed = this.fuzzStdio(message);
      }

      batch.push({ transport, fuzzed });
    }

    return batch;
  }

  /**
   * Simulate network conditions
   */
  simulateNetworkConditions(message) {
    const conditions = ['normal', 'slow', 'lossy', 'jitter', 'congestion'];

    const condition = conditions[Math.floor(Math.random() * conditions.length)];

    switch (condition) {
      case 'normal':
        return message;
      case 'slow':
        return this.addDelay(message);
      case 'lossy':
        return Math.random() < 0.3 ? null : message; // 30% packet loss
      case 'jitter':
        return this.chunkMessage(message); // Simulate jitter via chunking
      case 'congestion':
        return this.truncateMessage(message); // Simulate congestion via truncation
      default:
        return message;
    }
  }
}
