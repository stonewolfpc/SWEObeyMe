#!/usr/bin/env node

import { toolHandlers, getToolDefinitions } from '../lib/tools.js';

console.log('=== Testing C# Bridge Tool Registration ===\n');

const toolNames = getToolDefinitions().map(t => t.name);
const csharpTools = [
  'get_csharp_errors',
  'get_csharp_errors_for_file',
  'get_csharp_integrity_report',
  'toggle_csharp_error_type',
  'set_csharp_ai_informed',
  'undo_last_surgical_edit',
];

console.log('Total tools registered:', toolNames.length);
console.log('\nChecking C# Bridge tools:');

csharpTools.forEach(toolName => {
  const isRegistered = toolNames.includes(toolName);
  const hasHandler = !!toolHandlers[toolName];
  console.log(`  ${toolName}: ${isRegistered ? '✓ Registered' : '✗ Missing'} | ${hasHandler ? '✓ Handler' : '✗ No handler'}`);
});

console.log('\n=== Test Complete ===');
console.log('\nAll tools registered:', csharpTools.every(t => toolNames.includes(t)) ? 'YES' : 'NO');
console.log('All handlers present:', csharpTools.every(t => toolHandlers[t]) ? 'YES' : 'NO');

process.exit(csharpTools.every(t => toolNames.includes(t)) && csharpTools.every(t => toolHandlers[t]) ? 0 : 1);
