/**
 * MCP Transport Sentinel
 *
 * Pre-parser that sits before the MCP SDK to handle edge cases and prevent silent failures.
 * Detects and mitigates:
 * - UTF-8 BOM prefixes
 * - Missing required JSON-RPC fields
 * - Null params
 * - Partial/chunked JSON
 * - Invalid JSON
 *
 * Emits structured events for telemetry and debugging.
 */

import { EventEmitter } from 'events';

class TransportSentinel extends EventEmitter {
  constructor(options = {}) {
    super();

    this.options = {
      watchdogTimeout: options.watchdogTimeout || 150,
      integrityThreshold: options.integrityThreshold || 3,
      integrityWindow: options.integrityWindow || 10000,
      ...options,
    };

    // Transport health metrics
    this.metrics = {
      bomStripped: 0,
      missingFields: 0,
      nullParams: 0,
      partialPackets: 0,
      chunkedPackets: 0,
      invalidJson: 0,
      silentFailures: 0,
      recoveries: 0,
      integrityScore: 100,
    };

    // Integrity tracking
    this.malformedCount = [];
    this.lastMalformedTime = 0;

    // Buffer for partial/chunked JSON
    this.buffer = '';
    this.bufferTimeout = null;

    // Last known good packet
    this.lastGoodPacket = null;

    // Watchdog timer
    this.watchdogTimer = null;
    this.lastResponseTime = Date.now();

    // Start watchdog
    this.startWatchdog();
  }

  /**
   * Process raw input before it reaches the MCP SDK
   */
  processInput(rawInput) {
    // Reset watchdog on any input
    this.resetWatchdog();

    // Detect silent failure (0-byte input)
    if (rawInput.length === 0) {
      this.metrics.silentFailures++;
      this.emit('SWEObeyMe:TransportError', {
        type: 'silent_failure',
        details: 'SDK returned 0 bytes',
      });
      process.stderr.write('[SWEObeyMe] SilentFailureDetected: SDK returned 0 bytes.\n');
      return null;
    }

    let data = rawInput;

    // 1. Detect and strip UTF-8 BOM
    if (Buffer.isBuffer(data)) {
      if (data.length >= 3 && data[0] === 0xef && data[1] === 0xbb && data[2] === 0xbf) {
        data = data.slice(3);
        this.metrics.bomStripped++;
        this.trackMalformed('bom');
        this.emit('SWEObeyMe:TransportError', {
          type: 'bom_detected',
          details: 'UTF-8 BOM stripped',
        });
        process.stderr.write('[SWEObeyMe] Warning: BOM detected and removed before JSON parse.\n');
      }
      // Convert to string for JSON parsing
      data = data.toString('utf8');
    } else if (typeof data === 'string') {
      // Check for UTF-16 BOM
      if (data.charCodeAt(0) === 0xfeff) {
        data = data.slice(1);
        this.metrics.bomStripped++;
        this.trackMalformed('bom');
        this.emit('SWEObeyMe:TransportError', {
          type: 'bom_detected',
          details: 'UTF-16 BOM stripped',
        });
        process.stderr.write('[SWEObeyMe] Warning: BOM detected and removed before JSON parse.\n');
      }
    }

    // 2. Try to parse JSON
    let parsed;
    try {
      parsed = JSON.parse(data);
    } catch (error) {
      // Check for partial JSON
      if (this.isPartialJson(data)) {
        this.metrics.partialPackets++;
        this.trackMalformed('partial');
        this.emit('SWEObeyMe:TransportError', {
          type: 'partial_json',
          details: 'Buffering partial JSON packet',
        });
        return this.bufferPartial(data);
      }

      this.metrics.invalidJson++;
      this.trackMalformed('invalid');
      this.emit('SWEObeyMe:TransportError', {
        type: 'invalid_json',
        details: error.message,
      });
      process.stderr.write(`[SWEObeyMe] Error: Invalid JSON - ${error.message}\n`);
      return this.createErrorResponse(-32700, 'Parse error');
    }

    // 3. Validate JSON-RPC structure
    if (!parsed || typeof parsed !== 'object') {
      this.metrics.invalidJson++;
      this.trackMalformed('invalid');
      this.emit('SWEObeyMe:TransportError', {
        type: 'invalid_structure',
        details: 'Parsed JSON is not an object',
      });
      process.stderr.write('[SWEObeyMe] Error: Invalid JSON-RPC structure.\n');
      return this.createErrorResponse(-32700, 'Invalid Request');
    }

    // 4. Check for missing required fields
    if (!parsed.method) {
      this.metrics.missingFields++;
      this.trackMalformed('missing_fields');
      this.emit('SWEObeyMe:TransportError', {
        type: 'missing_fields',
        details: 'Missing method field',
      });
      process.stderr.write('[SWEObeyMe] Error: Malformed JSON-RPC (missing method).\n');
      return this.createErrorResponse(-32600, 'Invalid Request', 'Missing method field');
    }

    if (parsed.params === undefined && parsed.method !== 'initialize') {
      this.metrics.missingFields++;
      this.trackMalformed('missing_fields');
      this.emit('SWEObeyMe:TransportError', {
        type: 'missing_fields',
        details: 'Missing params field',
      });
      process.stderr.write('[SWEObeyMe] Error: Malformed JSON-RPC (missing params).\n');
      return this.createErrorResponse(-32600, 'Invalid Request', 'Missing params field');
    }

    // 5. Handle null params
    if (parsed.params === null) {
      this.metrics.nullParams++;
      this.trackMalformed('null_params');
      this.emit('SWEObeyMe:TransportError', {
        type: 'null_params',
        details: 'params is null, using {} fallback',
      });
      process.stderr.write(
        '[SWEObeyMe] Error: Invalid JSON-RPC (params=null). Using {} fallback.\n'
      );
      parsed.params = {};
    }

    // Valid packet - store as last known good
    this.lastGoodPacket = parsed;

    return parsed;
  }

  /**
   * Check if JSON is partial (incomplete)
   */
  isPartialJson(str) {
    try {
      JSON.parse(str);
      return false;
    } catch {
      // Count braces/brackets to determine if it might be partial
      const openBraces = (str.match(/{/g) || []).length;
      const closeBraces = (str.match(/}/g) || []).length;
      const openBrackets = (str.match(/\[/g) || []).length;
      const closeBrackets = (str.match(/\]/g) || []).length;

      return openBraces > closeBraces || openBrackets > closeBrackets;
    }
  }

  /**
   * Buffer partial JSON until complete
   */
  bufferPartial(data) {
    this.buffer += data;

    // Clear existing timeout
    if (this.bufferTimeout) {
      clearTimeout(this.bufferTimeout);
    }

    // Set timeout to flush buffer if no more data arrives
    this.bufferTimeout = setTimeout(() => {
      if (this.buffer.length > 0) {
        // Try to parse buffered data
        try {
          const parsed = JSON.parse(this.buffer);
          this.metrics.chunkedPackets++;
          this.emit('SWEObeyMe:TransportError', {
            type: 'chunked_reassembled',
            details: 'Chunked JSON reassembled',
          });
          this.buffer = '';
          this.lastGoodPacket = parsed;
          return parsed;
        } catch {
          // Still invalid, emit error
          this.metrics.invalidJson++;
          this.emit('SWEObeyMe:TransportError', {
            type: 'buffer_timeout',
            details: 'Buffered JSON still invalid after timeout',
          });
          this.buffer = '';
          return this.createErrorResponse(-32700, 'Parse error');
        }
      }
    }, 50); // 50ms window for chunks

    return null; // Waiting for more data
  }

  /**
   * Track malformed input for integrity scoring
   */
  trackMalformed(type) {
    const now = Date.now();
    this.malformedCount = this.malformedCount.filter((t) => now - t < this.options.integrityWindow);
    this.malformedCount.push(now);

    // Update integrity score
    const recentCount = this.malformedCount.length;
    this.metrics.integrityScore = Math.max(0, 100 - recentCount * 10);

    // Check threshold
    if (recentCount >= this.options.integrityThreshold) {
      this.emit('SWEObeyMe:TransportError', {
        type: 'integrity_threshold_exceeded',
        details: `${recentCount} malformed inputs in ${this.options.integrityWindow}ms`,
        score: this.metrics.integrityScore,
      });
      process.stderr.write(
        `[SWEObeyMe] Transport Integrity Threshold Exceeded: ${recentCount} malformed inputs in ${this.options.integrityWindow}ms\n`
      );
      this.triggerRecovery();
    }
  }

  /**
   * Create JSON-RPC error response
   */
  createErrorResponse(code, message, data = null) {
    const response = {
      jsonrpc: '2.0',
      id: null,
      error: {
        code,
        message,
      },
    };

    if (data) {
      response.error.data = data;
    }

    return JSON.stringify(response) + '\n';
  }

  /**
   * Start watchdog timer
   */
  startWatchdog() {
    this.watchdogTimer = setInterval(() => {
      const elapsed = Date.now() - this.lastResponseTime;
      if (elapsed > this.options.watchdogTimeout) {
        this.metrics.silentFailures++;
        this.emit('SWEObeyMe:TransportError', {
          type: 'watchdog_timeout',
          details: `No response for ${elapsed}ms`,
        });
        process.stderr.write(
          `[SWEObeyMe] TransportWatchdog: No response from SDK. Possible silent parse failure (${elapsed}ms).\n`
        );
        this.triggerRecovery();
      }
    }, this.options.watchdogTimeout);
  }

  /**
   * Reset watchdog timer
   */
  resetWatchdog() {
    this.lastResponseTime = Date.now();
  }

  /**
   * Trigger recovery from failure
   */
  triggerRecovery() {
    this.metrics.recoveries++;
    this.emit('SWEObeyMe:TransportError', {
      type: 'recovery_triggered',
      details: 'Self-healing recovery initiated',
    });
    process.stderr.write(
      '[SWEObeyMe] SelfHealing: Recovery triggered. Flushing buffers and resetting state.\n'
    );

    // Flush buffer
    this.buffer = '';
    if (this.bufferTimeout) {
      clearTimeout(this.bufferTimeout);
      this.bufferTimeout = null;
    }

    // Reset integrity tracking
    this.malformedCount = [];
    this.metrics.integrityScore = 100;
  }

  /**
   * Get transport health dashboard
   */
  getHealthDashboard() {
    return {
      'BOM stripped': this.metrics.bomStripped,
      'Missing fields': this.metrics.missingFields,
      'Null params': this.metrics.nullParams,
      'Partial packets': this.metrics.partialPackets,
      'Chunked packets': this.metrics.chunkedPackets,
      'Invalid JSON': this.metrics.invalidJson,
      'Silent failures': this.metrics.silentFailures,
      Recoveries: this.metrics.recoveries,
      'Integrity Score': this.metrics.integrityScore,
    };
  }

  /**
   * Log health dashboard
   */
  logHealthDashboard() {
    const health = this.getHealthDashboard();
    process.stderr.write('[SWEObeyMe] Transport Health:\n');
    Object.entries(health).forEach(([key, value]) => {
      process.stderr.write(`  ${key}: ${value}\n`);
    });
  }

  /**
   * Get last known good packet
   */
  getLastGoodPacket() {
    return this.lastGoodPacket;
  }

  /**
   * Stop watchdog
   */
  stop() {
    if (this.watchdogTimer) {
      clearInterval(this.watchdogTimer);
      this.watchdogTimer = null;
    }
    if (this.bufferTimeout) {
      clearTimeout(this.bufferTimeout);
      this.bufferTimeout = null;
    }
  }
}

export function createTransportSentinel(options) {
  return new TransportSentinel(options);
}

export default TransportSentinel;
