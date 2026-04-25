#!/usr/bin/env node

/**
 * Fuzzer Invariants Definition
 *
 * Defines all invariants that must never be violated during fuzzing
 * These are the assertions that the fuzzer will validate
 */

export const SERVER_INVARIANTS = {
  NO_CRASH: 'Server must never crash',
  NO_HANG: 'Server must never hang indefinitely',
  NO_MEMORY_LEAK: 'Server must not leak memory beyond threshold',
  NO_INVALID_JSON: 'Server must never emit invalid MCP JSON',
  NO_FILE_CORRUPTION: 'Server must never corrupt files',
  NO_UNHANDLED_EXCEPTIONS: 'Server must handle all exceptions gracefully',
};

export const PROTOCOL_INVARIANTS = {
  EVERY_REQUEST_GETS_RESPONSE: 'Every request must get a response or clean error',
  VALID_REQUEST_ID: 'All requests must have valid IDs',
  VALID_JSON_RPC: 'All messages must be valid JSON-RPC 2.0',
};

export const SAFETY_INVARIANTS = {
  NO_WRITES_OUTSIDE_ROOTS: 'No writes outside allowed workspace roots',
  NO_PATH_TRAVERSAL: 'No path traversal attacks (../, etc.)',
  NO_DESTRUCTIVE_WITHOUT_CONFIRMATION: 'No destructive operations without confirmation',
  NO_SENSITIVE_DATA_EXPOSURE: 'No exposure of sensitive data',
  NO_DENIAL_OF_SERVICE: 'No denial of service attacks via resource exhaustion',
};

export const TRANSPORT_INVARIANTS = {
  STDIO_MUST_CLOSE: 'stdio transport must close cleanly',
  HTTP_MUST_RESPOND: 'HTTP transport must respond to all requests',
  SSE_MUST_STREAM: 'SSE transport must stream events correctly',
  NO_BUFFER_OVERFLOW: 'No buffer overflow in any transport',
  NO_HANG_ON_DISCONNECT: 'No hang on client disconnect',
};

export const TIMING_INVARIANTS = {
  NO_TIMEOUT_ON_NORMAL_OPS: 'No timeout on normal operations',
  NO_RACE_CONDITIONS: 'No race conditions in concurrent operations',
  CANCELLATION_MUST_WORK: 'Cancellation must work mid-flight',
  OVERLAPPING_CALLS_SAFE: 'Overlapping calls must be safe',
  BACKPRESSURE_HANDLED: 'Backpressure must be handled',
};

/**
 * Validate all invariants
 * @param {Object} results - Test results object
 * @param {Object} invariants - Invariants to validate
 * @returns {Object} Validation results
 */
export function validateInvariants(results, invariants) {
  const violations = [];

  for (const [key, description] of Object.entries(invariants)) {
    if (!results[key]) {
      violations.push({
        invariant: key,
        description,
        value: results[key],
      });
    }
  }

  return {
    passed: violations.length === 0,
    violations,
    total: Object.keys(invariants).length,
    failed: violations.length,
  };
}

/**
 * Get all invariants
 * @returns {Object} All invariants
 */
export function getAllInvariants() {
  return {
    server: SERVER_INVARIANTS,
    protocol: PROTOCOL_INVARIANTS,
    safety: SAFETY_INVARIANTS,
    transport: TRANSPORT_INVARIANTS,
    timing: TIMING_INVARIANTS,
  };
}
