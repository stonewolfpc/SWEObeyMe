import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Golden regression tests for critical tools
 * Tests expected success/failure outputs to ensure tool behavior consistency
 */

const TESTS = [
  {
    name: 'obey_surgical_plan - valid plan',
    tool: 'obey_surgical_plan',
    args: { target_file: 'test.js', current_line_count: 500, estimated_addition: 100 },
    expected: 'PLAN APPROVED',
    shouldPass: true,
  },
  {
    name: 'obey_surgical_plan - exceeds limit',
    tool: 'obey_surgical_plan',
    args: { target_file: 'test.js', current_line_count: 650, estimated_addition: 100 },
    expected: 'REJECTED',
    shouldPass: false,
  },
  {
    name: 'obey_surgical_plan - missing target_file',
    tool: 'obey_surgical_plan',
    args: { current_line_count: 500 },
    expected: 'ERROR',
    shouldPass: false,
  },
  {
    name: 'verify_syntax - valid code',
    tool: 'verify_syntax',
    args: { code: 'const x = 1;', language: 'javascript' },
    expected: 'valid',
    shouldPass: true,
  },
  {
    name: 'verify_syntax - unmatched braces',
    tool: 'verify_syntax',
    args: { code: 'const x = {', language: 'javascript' },
    expected: 'Unmatched braces',
    shouldPass: false,
  },
  {
    name: 'enforce_surgical_rules - valid code',
    tool: 'enforce_surgical_rules',
    args: { proposed_code: '// Valid code\nconst x = 1;', file_path: 'test.js' },
    expected: 'satisfied',
    shouldPass: true,
  },
  {
    name: 'enforce_surgical_rules - console.log forbidden',
    tool: 'enforce_surgical_rules',
    args: { proposed_code: 'console.log("test");', file_path: 'test.js' },
    expected: 'Forbidden pattern',
    shouldPass: false,
  },
  {
    name: 'enforce_surgical_rules - TODO forbidden',
    tool: 'enforce_surgical_rules',
    args: { proposed_code: '// TODO: fix this', file_path: 'test.js' },
    expected: 'Forbidden pattern',
    shouldPass: false,
  },
  {
    name: 'preflight_change - missing path',
    tool: 'preflight_change',
    args: { content: 'test' },
    expected: 'ERROR',
    shouldPass: false,
  },
  {
    name: 'preflight_change - missing content',
    tool: 'preflight_change',
    args: { path: 'test.js' },
    expected: 'ERROR',
    shouldPass: false,
  },
];

async function runGoldenTest(test) {
  return new Promise((resolve) => {
    const server = spawn('node', [join(__dirname, '..', 'index.js')], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let output = '';
    let errorOutput = '';

    server.stdout.on('data', (data) => {
      output += data.toString();
    });

    server.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    // Send tool call
    const toolCall = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: test.tool,
        arguments: test.args,
      },
    });

    server.stdin.write(toolCall + '\n');

    setTimeout(() => {
      server.kill();
      const passed = output.includes(test.expected) || errorOutput.includes(test.expected);
      resolve({
        name: test.name,
        passed: passed === test.shouldPass,
        expected: test.expected,
        actual: output || errorOutput,
      });
    }, 2000);
  });
}

async function runAllGoldenTests() {
  console.log('=== GOLDEN REGRESSION TESTS ===\n');

  const results = [];
  for (const test of TESTS) {
    const result = await runGoldenTest(test);
    results.push(result);
    
    if (result.passed) {
      console.log(`✓ ${result.name}`);
    } else {
      console.log(`✗ ${result.name}`);
      console.log(`  Expected: ${result.expected}`);
      console.log(`  Actual: ${result.actual.substring(0, 200)}...`);
    }
  }

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;

  console.log(`\n=== RESULTS ===`);
  console.log(`Passed: ${passed}/${total}`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

  if (passed === total) {
    console.log('\n✓ ALL GOLDEN TESTS PASSED');
    process.exit(0);
  } else {
    console.log('\n✗ SOME GOLDEN TESTS FAILED');
    process.exit(1);
  }
}

runAllGoldenTests().catch((error) => {
  console.error('Golden test suite failed:', error);
  process.exit(1);
});
