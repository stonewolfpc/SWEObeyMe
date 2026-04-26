#!/usr/bin/env node

/**
 * MCP Protocol Compliance Test
 * Comprehensive MCP 2024-11-05 spec compliance, tool contract, and runtime validation.
 * EVERY failure must be caught before a release ships.
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const indexPath = path.join(__dirname, '..', 'index.js');

let serverProcess;
let messageId = 0;
const results = { total: 0, passed: 0, failed: 0, errors: [] };

function assert(condition, testName, details = '') {
  results.total++;
  if (condition) {
    results.passed++;
    process.stdout.write(`  \u2713 ${testName}\n`);
    return true;
  } else {
    results.failed++;
    process.stdout.write(`  \u2717 FAIL: ${testName}${details ? ' — ' + details : ''}\n`);
    results.errors.push({ test: testName, details });
    return false;
  }
}

function sendRequest(method, params = {}, allowError = false) {
  return new Promise((resolve, reject) => {
    const id = messageId++;
    const request = { jsonrpc: '2.0', id, method, params };

    let responseReceived = false;
    const timeout = setTimeout(() => {
      if (!responseReceived) {
        reject(new Error(`Timeout after 8000ms for: ${method}`));
      }
    }, 8000);

    const dataHandler = (data) => {
      const lines = data.toString().split('\n').filter(l => l.trim());
      for (const line of lines) {
        try {
          const response = JSON.parse(line);
          if (response.id === id) {
            responseReceived = true;
            clearTimeout(timeout);
            serverProcess.stdout.off('data', dataHandler);
            if (response.error && !allowError) {
              reject(new Error(`${response.error.code}: ${response.error.message}`));
            } else {
              resolve(response);
            }
          }
        } catch { }
      }
    };

    serverProcess.stdout.on('data', dataHandler);
    serverProcess.stdin.write(JSON.stringify(request) + '\n');
  });
}

function validateJsonRpc(response) {
  const errors = [];
  if (typeof response !== 'object' || response === null) errors.push('response must be an object');
  if (response.jsonrpc !== '2.0') errors.push(`jsonrpc must be "2.0", got "${response.jsonrpc}"`);
  if (response.id === undefined) errors.push('missing id field');
  if (response.result === undefined && response.error === undefined) errors.push('missing result and error');
  if (response.result !== undefined && response.error !== undefined) errors.push('cannot have both result and error');
  if (response.error) {
    if (typeof response.error.code !== 'number') errors.push('error.code must be a number');
    if (typeof response.error.message !== 'string') errors.push('error.message must be a string');
  }
  return errors;
}

function validateTool(tool) {
  const errors = [];
  if (typeof tool.name !== 'string' || !tool.name) errors.push('tool.name must be a non-empty string');
  if (typeof tool.description !== 'string') errors.push(`tool.description must be a string (tool: ${tool.name})`);
  if (!tool.inputSchema || typeof tool.inputSchema !== 'object') errors.push(`tool.inputSchema missing (tool: ${tool.name})`);
  if (tool.inputSchema && tool.inputSchema.type !== 'object') errors.push(`tool.inputSchema.type must be "object" (tool: ${tool.name})`);
  return errors;
}

async function runTests() {
  console.log('\u2554' + '\u2550'.repeat(62) + '\u2557');
  console.log('\u2551  MCP Protocol Compliance Test Suite (Comprehensive)         \u2551');
  console.log('\u2551  MCP 2024-11-05 specification                                \u2551');
  console.log('\u255a' + '\u2550'.repeat(62) + '\u255d\n');

  if (!fs.existsSync(indexPath)) {
    console.error(`FATAL: index.js not found at ${indexPath}`);
    process.exit(1);
  }

  serverProcess = spawn('node', [indexPath], {
    cwd: path.dirname(indexPath),
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  let stderrBuffer = '';
  serverProcess.stderr.on('data', d => { stderrBuffer += d.toString(); });

  serverProcess.on('error', err => { console.error('Server process error:', err.message); });

  await new Promise(resolve => setTimeout(resolve, 1500));

  try {
    // ─── Suite 1: Initialize Handshake ──────────────────────────────────
    console.log('\n=== Suite 1: Initialize Handshake ===');
    let toolList = [];
    let initResponse;
    try {
      initResponse = await sendRequest('initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'compliance-test', version: '1.0.0' },
      });
    } catch (e) {
      assert(false, 'Initialize request must not throw', e.message);
      throw e;
    }

    const initErrors = validateJsonRpc(initResponse);
    assert(initErrors.length === 0, 'Initialize response is valid JSON-RPC 2.0', initErrors.join('; '));
    assert(typeof initResponse.result === 'object' && initResponse.result !== null, 'Initialize result is an object');
    assert(typeof initResponse.result.serverInfo === 'object', 'serverInfo present');
    assert(typeof initResponse.result.serverInfo?.name === 'string' && initResponse.result.serverInfo.name.length > 0, 'serverInfo.name is a non-empty string');
    assert(typeof initResponse.result.serverInfo?.version === 'string' && initResponse.result.serverInfo.version.length > 0, 'serverInfo.version is a non-empty string');
    assert(typeof initResponse.result.capabilities === 'object', 'capabilities present');
    assert(initResponse.result.protocolVersion !== undefined, 'protocolVersion echoed back');

    // ─── Suite 2: Tool Listing ─────────────────────────────────────────
    console.log('\n=== Suite 2: Tool Listing ===');
    const toolsResponse = await sendRequest('tools/list');
    const toolsErrors = validateJsonRpc(toolsResponse);
    assert(toolsErrors.length === 0, 'tools/list response is valid JSON-RPC 2.0', toolsErrors.join('; '));
    assert(typeof toolsResponse.result === 'object', 'tools/list result is an object');
    assert(Array.isArray(toolsResponse.result.tools), 'result.tools is an array');
    assert(toolsResponse.result.tools.length >= 10, `At least 10 tools registered (got ${toolsResponse.result.tools.length})`);
    toolList = toolsResponse.result.tools;

    let toolSchemaErrors = 0;
    toolList.forEach(tool => {
      const errs = validateTool(tool);
      if (errs.length > 0) {
        errs.forEach(e => assert(false, `Tool schema valid: ${tool.name}`, e));
        toolSchemaErrors++;
      }
    });
    if (toolSchemaErrors === 0) assert(true, `All ${toolList.length} tool schemas are spec-compliant`);

    const toolNames = toolList.map(t => t.name);
    const requiredTools = [
      'obey_me_status', 'get_governance_constitution', 'get_validation_status',
      'read_file', 'write_file', 'obey_surgical_plan', 'validate_code',
      'audit', 'auto_enforce', 'preflight_change',
    ];
    requiredTools.forEach(name => {
      assert(toolNames.includes(name), `Required tool registered: ${name}`);
    });

    // ─── Suite 3: Tool Calls ───────────────────────────────────────────
    console.log('\n=== Suite 3: Tool Calls ===');

    async function callAndValidate(toolName, args, label) {
      try {
        const r = await sendRequest('tools/call', { name: toolName, arguments: args });
        const errs = validateJsonRpc(r);
        assert(errs.length === 0, `${label}: valid JSON-RPC response`, errs.join('; '));
        assert(typeof r.result === 'object' && r.result !== null, `${label}: result is an object`);
        assert(Array.isArray(r.result.content), `${label}: result.content is an array`);
        assert(r.result.content.length > 0, `${label}: content is non-empty`);
        r.result.content.forEach((item, i) => {
          assert(typeof item.type === 'string', `${label}: content[${i}].type is a string`);
          assert(item.type === 'text' ? typeof item.text === 'string' : true,
            `${label}: content[${i}].text is a string when type=text`);
        });
        return r;
      } catch (e) {
        assert(false, `${label}: tool call must succeed`, e.message);
        return null;
      }
    }

    await callAndValidate('obey_me_status', {}, 'obey_me_status()');
    await callAndValidate('get_governance_constitution', {}, 'get_governance_constitution()');
    await callAndValidate('get_validation_status', {}, 'get_validation_status()');
    await callAndValidate('get_server_diagnostics', { runChecks: false }, 'get_server_diagnostics()');
    await callAndValidate('audit', { operation: 'status' }, 'audit(status)');
    await callAndValidate('docs_list_corpora', {}, 'docs_list_corpora()');

    // ─── Suite 4: Error Handling ───────────────────────────────────────
    console.log('\n=== Suite 4: Error Handling ===');

    const unknownToolResp = await sendRequest('tools/call', {
      name: 'definitely_not_a_real_tool_xyz123',
      arguments: {},
    }, true);
    const unknownErrs = validateJsonRpc(unknownToolResp);
    assert(unknownErrs.length === 0, 'Unknown tool returns valid JSON-RPC error response', unknownErrs.join('; '));
    assert(unknownToolResp.error !== undefined || unknownToolResp.result !== undefined,
      'Unknown tool response has result or error');

    const malformedResp = await sendRequest('tools/call', {
      name: 'read_file',
      arguments: {},
    }, true);
    const malformedErrs = validateJsonRpc(malformedResp);
    assert(malformedErrs.length === 0, 'Missing required arg returns valid JSON-RPC response', malformedErrs.join('; '));

    // ─── Suite 5: Concurrent Requests ───────────────────────────────────
    console.log('\n=== Suite 5: Concurrent Requests ===');
    try {
      const concurrentResults = await Promise.all([
        sendRequest('tools/call', { name: 'obey_me_status', arguments: {} }),
        sendRequest('tools/call', { name: 'get_validation_status', arguments: {} }),
        sendRequest('tools/call', { name: 'get_governance_constitution', arguments: {} }),
      ]);
      concurrentResults.forEach((r, i) => {
        const errs = validateJsonRpc(r);
        assert(errs.length === 0, `Concurrent request ${i + 1} returns valid JSON-RPC`, errs.join('; '));
        assert(r.id !== undefined, `Concurrent request ${i + 1} has correct id`);
      });
      const ids = concurrentResults.map(r => r.id);
      assert(new Set(ids).size === ids.length, 'All concurrent responses have unique IDs');
    } catch (e) {
      assert(false, 'Concurrent requests handled correctly', e.message);
    }

    // ─── Suite 6: Response Consistency ──────────────────────────────────
    console.log('\n=== Suite 6: Response Content Consistency ===');
    try {
      const r1 = await sendRequest('tools/call', { name: 'obey_me_status', arguments: {} });
      const r2 = await sendRequest('tools/call', { name: 'obey_me_status', arguments: {} });
      assert(r1.result?.content[0]?.type === 'text', 'obey_me_status returns text content');
      assert(typeof r1.result?.content[0]?.text === 'string', 'obey_me_status content.text is a string');
      assert(r1.result?.content[0]?.text.length > 0, 'obey_me_status content.text is non-empty');
      assert(r1.id !== r2.id, 'Repeated calls have different IDs');
    } catch (e) {
      assert(false, 'Response consistency checks failed', e.message);
    }

    // ─── Suite 7: Large Payload Handling ────────────────────────────────
    console.log('\n=== Suite 7: Governance Constitution (Large Payload) ===');
    try {
      const r = await sendRequest('tools/call', { name: 'get_governance_constitution', arguments: {} });
      const text = r.result?.content[0]?.text || '';
      assert(text.length > 100, 'Governance constitution is substantive (>100 chars)');
      assert(!text.includes('[object Object]'), 'Constitution text is not corrupted ([object Object])');
      assert(!text.includes('undefined'), 'Constitution text contains no undefined values');
    } catch (e) {
      assert(false, 'Large payload governance test', e.message);
    }

    // ─── Suite 8: Unknown Method Handling ────────────────────────────────
    console.log('\n=== Suite 8: Unknown Method Handling ===');
    try {
      const r = await sendRequest('nonexistent/method', {}, true);
      const errs = validateJsonRpc(r);
      assert(errs.length === 0, 'Unknown method returns valid JSON-RPC structure', errs.join('; '));
    } catch (e) {
      assert(false, 'Unknown method handling', e.message);
    }

  } finally {
    if (serverProcess) {
      serverProcess.stdin.end();
      serverProcess.kill();
    }
  }

  // ─── Summary ────────────────────────────────────────────────────────────
  console.log('\n\u2554' + '\u2550'.repeat(62) + '\u2557');
  console.log('\u2551  MCP COMPLIANCE TEST RESULTS                                \u2551');
  console.log('\u255a' + '\u2550'.repeat(62) + '\u255d');
  console.log(`  Total:   ${results.total}`);
  console.log(`  Passed:  ${results.passed} \u2713`);
  console.log(`  Failed:  ${results.failed} \u2717`);
  const rate = ((results.passed / results.total) * 100).toFixed(1);
  console.log(`  Rate:    ${rate}%`);

  if (results.failed > 0) {
    console.log('\nFailed tests:');
    results.errors.forEach(e => console.log(`  \u2717 ${e.test}${e.details ? ' — ' + e.details : ''}`) );
    console.log('\n\u2717 MCP COMPLIANCE FAILED — Fix all issues before shipping.');
    process.exit(1);
  } else {
    console.log('\n\u2713 ALL MCP COMPLIANCE TESTS PASSED — Server is spec-compliant and release-ready.');
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('\nFATAL:', err.message);
  if (serverProcess) serverProcess.kill();
  process.exit(1);
});
