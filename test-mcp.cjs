const { spawn } = require('child_process');
const fs = require('fs');

const child = spawn('node', ['dist/mcp/server.js'], { stdio: ['pipe', 'pipe', 'pipe'] });

let output = '';
let initialized = false;
const _log = (msg) => {
  output += msg + '\n';
  fs.appendFileSync('test-mcp-output.txt', msg + '\n');
};

child.stdout.on('data', (d) => {
  const str = d.toString();
  output += str;
  console.log('[STDOUT]', str.slice(0, 200));

  if (!initialized && str.includes('serverInfo')) {
    initialized = true;
    setTimeout(() => {
      const msg = JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list' }) + '\n';
      console.log('[SENDING] tools/list');
      child.stdin.write(msg);
    }, 100);
  }

  if (str.includes('tools')) {
    setTimeout(() => {
      console.log('\n=== FULL OUTPUT ===');
      console.log(output);
      child.kill();
    }, 200);
  }
});

child.stderr.on('data', (d) => {
  console.log('[STDERR]', d.toString().slice(0, 200));
});

setTimeout(() => {
  const init = JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'test', version: '1.0' }
    }
  }) + '\n';
  console.log('[SENDING] initialize');
  child.stdin.write(init);
}, 500);

setTimeout(() => {
  console.log('\n=== TIMEOUT - OUTPUT ===');
  console.log(output);
  child.kill();
}, 5000);
