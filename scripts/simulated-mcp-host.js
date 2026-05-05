/**
 * Simulated MCP Host — Safety Bubble
 *
 * Pretends to be the SWEObeyMe MCP server so the extension/UI/tests
 * can run without spawning the real (crash-looping) server.
 *
 * Rules:
 * - NO fork, NO spawn, NO exec, NO child_process
 * - NO streams beyond minimal stdin/stdout
 * - NO external dependencies
 * - Basic file tools work via fs/promises only
 * - Everything else returns canned safe responses
 */

import { readFile, writeFile, stat, readdir, access } from 'fs/promises';
import path from 'path';

const VERSION = '5.3.1-simulated';
const logPath = path.join(
  process.env.USERPROFILE || process.env.HOME || '.',
  '.sweobeyme-simulated.log'
);

async function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  try {
    await writeFile(logPath, line, { flag: 'a' });
  } catch {
    // ignore log write failures
  }
}

// ─── Tool Definitions (subset that matters for daily work) ───
const tools = [
  {
    name: 'swe_read_file',
    description: 'Read a file safely.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        offset: { type: 'number' },
        limit: { type: 'number' },
      },
      required: ['path'],
    },
  },
  {
    name: 'swe_write_file',
    description: 'Write a file safely.',
    inputSchema: {
      type: 'object',
      properties: { path: { type: 'string' }, content: { type: 'string' } },
      required: ['path', 'content'],
    },
  },
  {
    name: 'file_info',
    description: 'Get file stats.',
    inputSchema: {
      type: 'object',
      properties: { operation: { type: 'string' }, path: { type: 'string' } },
      required: ['operation', 'path'],
    },
  },
  {
    name: 'swe_list_directory',
    description: 'List directory contents.',
    inputSchema: {
      type: 'object',
      properties: { path: { type: 'string' } },
      required: ['path'],
    },
  },
  {
    name: 'backup_restore',
    description: 'Backup/restore placeholder.',
    inputSchema: {
      type: 'object',
      properties: { operation: { type: 'string' } },
      required: ['operation'],
    },
  },
  {
    name: 'project_context',
    description: 'Project context placeholder.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'sweobeyme_execute',
    description: 'Governance router placeholder.',
    inputSchema: {
      type: 'object',
      properties: { domain: { type: 'string' }, action: { type: 'string' } },
    },
  },
  {
    name: 'swe_search_code',
    description: 'Code search placeholder.',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] },
  },
  {
    name: 'obey_surgical_plan',
    description: 'Surgical plan placeholder.',
    inputSchema: {
      type: 'object',
      properties: { file_path: { type: 'string' }, changes: { type: 'string' } },
    },
  },
  {
    name: 'preflight_change',
    description: 'Preflight check placeholder.',
    inputSchema: {
      type: 'object',
      properties: { file_path: { type: 'string' }, expected_line_count: { type: 'number' } },
    },
  },
];

// ─── Handlers ───
async function handleReadFile(args) {
  const filePath = args.path;
  const offset = args.offset || 0;
  const limit = args.limit || 1000;
  try {
    const data = await readFile(filePath, 'utf-8');
    const lines = data.split(/\r?\n/);
    const slice = lines.slice(offset, offset + limit);
    return {
      content: [{ type: 'text', text: slice.join('\n') }],
      lineCount: lines.length,
      size: Buffer.byteLength(data),
    };
  } catch (e) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Error reading ${filePath}: ${e.message}` }],
    };
  }
}

async function handleWriteFile(args) {
  const filePath = args.path;
  try {
    await writeFile(filePath, args.content, 'utf-8');
    return { content: [{ type: 'text', text: `Written ${filePath}` }] };
  } catch (e) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Error writing ${filePath}: ${e.message}` }],
    };
  }
}

async function handleFileInfo(args) {
  const filePath = args.path;
  try {
    const s = await stat(filePath);
    const isDir = s.isDirectory();
    let lineCount = null;
    if (!isDir) {
      try {
        const data = await readFile(filePath, 'utf-8');
        lineCount = data.split(/\r?\n/).length;
      } catch {
        // ignore line count failures for directories/broken files
      }
    }
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              exists: true,
              size: s.size,
              isDirectory: isDir,
              lineCount,
              modified: s.mtime,
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (e) {
    return { isError: true, content: [{ type: 'text', text: `Error: ${e.message}` }] };
  }
}

async function handleListDirectory(args) {
  const dirPath = args.path;
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    const names = entries.map((e) => (e.isDirectory() ? `${e.name}/` : e.name));
    return { content: [{ type: 'text', text: names.join('\n') }] };
  } catch (e) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Error listing ${dirPath}: ${e.message}` }],
    };
  }
}

async function handleCallTool(name, args) {
  await log(`CallTool: ${name} args=${JSON.stringify(args).slice(0, 200)}`);
  switch (name) {
    case 'swe_read_file':
      return handleReadFile(args);
    case 'swe_write_file':
      return handleWriteFile(args);
    case 'file_info':
      return handleFileInfo(args);
    case 'swe_list_directory':
      return handleListDirectory(args);
    default:
      return {
        content: [{ type: 'text', text: `[SIMULATED] ${name} executed safely. No side effects.` }],
      };
  }
}

// ─── JSON-RPC over stdio ───
let buffer = '';

function sendResponse(id, result) {
  const msg = JSON.stringify({ jsonrpc: '2.0', id, result });
  const header = `Content-Length: ${Buffer.byteLength(msg)}\r\n\r\n`;
  process.stdout.write(header + msg);
}

function sendError(id, code, message) {
  const msg = JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } });
  const header = `Content-Length: ${Buffer.byteLength(msg)}\r\n\r\n`;
  process.stdout.write(header + msg);
}

async function handleMessage(msg) {
  const { id, method, params } = msg;
  if (!id) return; // notifications — ignore for simulation

  switch (method) {
    case 'initialize': {
      await log('Initialize');
      sendResponse(id, {
        protocolVersion: '2025-11-25',
        capabilities: { tools: {}, prompts: {} },
        serverInfo: { name: 'SWEObeyMe-Simulated', version: VERSION },
      });
      break;
    }
    case 'tools/list': {
      await log('ListTools');
      sendResponse(id, { tools });
      break;
    }
    case 'tools/call': {
      const { name, arguments: args } = params;
      const result = await handleCallTool(name, args);
      sendResponse(id, result);
      break;
    }
    case 'prompts/list': {
      sendResponse(id, { prompts: [] });
      break;
    }
    case 'prompts/get': {
      sendError(id, -32601, 'Prompt not found');
      break;
    }
    default: {
      sendError(id, -32601, `Method ${method} not implemented in simulated host`);
    }
  }
}

process.stdin.setEncoding('utf8');
process.stdin.on('data', async (chunk) => {
  buffer += chunk;
  while (true) {
    const headerEnd = buffer.indexOf('\r\n\r\n');
    if (headerEnd === -1) break;
    const header = buffer.slice(0, headerEnd);
    const match = header.match(/Content-Length:\s*(\d+)/i);
    if (!match) {
      buffer = buffer.slice(headerEnd + 4);
      continue;
    }
    const len = parseInt(match[1], 10);
    const msgStart = headerEnd + 4;
    if (buffer.length < msgStart + len) break;
    const msgText = buffer.slice(msgStart, msgStart + len);
    buffer = buffer.slice(msgStart + len);
    try {
      const msg = JSON.parse(msgText);
      await handleMessage(msg);
    } catch (e) {
      await log(`Parse error: ${e.message}`);
    }
  }
});

process.stdin.on('end', () => {
  log('Stdin closed — simulated host exiting cleanly');
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  log(`Uncaught: ${err.message}`);
});

process.on('unhandledRejection', (reason) => {
  log(`Unhandled: ${reason}`);
});

await log('Simulated MCP host started. PID=' + process.pid);
