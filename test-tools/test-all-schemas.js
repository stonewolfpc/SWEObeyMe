#!/usr/bin/env node

import { getToolDefinitions } from '../lib/tools/registry.js';

console.log('=== Comprehensive Schema Validation Test ===\n');

const tools = getToolDefinitions();
console.log(`Total tools: ${tools.length}\n`);

const errors = [];
const warnings = [];

tools.forEach((tool, index) => {
  const toolName = tool.name;
  const hasInputSchema = 'inputSchema' in tool;
  const inputSchema = tool.inputSchema;

  console.log(`${index + 1}. ${toolName}`);

  if (!hasInputSchema) {
    errors.push({
      tool: toolName,
      issue: 'Missing inputSchema property',
    });
    console.log('  ✗ ERROR: Missing inputSchema property');
  } else if (!inputSchema || inputSchema === '') {
    errors.push({
      tool: toolName,
      issue: 'Empty or invalid inputSchema',
    });
    console.log('  ✗ ERROR: Empty or invalid inputSchema');
  } else if (typeof inputSchema !== 'object') {
    errors.push({
      tool: toolName,
      issue: `inputSchema is not an object (type: ${typeof inputSchema})`,
    });
    console.log('  ✗ ERROR: inputSchema is not an object');
  } else if (!inputSchema.type) {
    errors.push({
      tool: toolName,
      issue: 'inputSchema missing type property',
    });
    console.log('  ✗ ERROR: inputSchema missing type property');
  } else if (inputSchema.type !== 'object') {
    errors.push({
      tool: toolName,
      issue: `inputSchema type is not 'object' (found: ${inputSchema.type})`,
    });
    console.log('  ✗ ERROR: inputSchema type is not \'object\'');
  } else if (!inputSchema.properties) {
    warnings.push({
      tool: toolName,
      issue: 'inputSchema missing properties (should be empty object {} for no params)',
    });
    console.log('  ⚠ WARNING: inputSchema missing properties');
  } else {
    console.log('  ✓ Valid schema');
    if (inputSchema.properties && Object.keys(inputSchema.properties).length === 0) {
      console.log('    (no parameters)');
    } else if (inputSchema.properties) {
      const paramCount = Object.keys(inputSchema.properties).length;
      console.log(`    (${paramCount} parameter${paramCount !== 1 ? 's' : ''})`);
    }
  }
  console.log();
});

console.log('=== Summary ===');
console.log(`Total tools: ${tools.length}`);
console.log(`Errors: ${errors.length}`);
console.log(`Warnings: ${warnings.length}`);

if (errors.length > 0) {
  console.log('\n=== ERRORS ===');
  errors.forEach(err => {
    console.log(`  ${err.tool}: ${err.issue}`);
  });
}

if (warnings.length > 0) {
  console.log('\n=== WARNINGS ===');
  warnings.forEach(warn => {
    console.log(`  ${warn.tool}: ${warn.issue}`);
  });
}

console.log(`\n${errors.length === 0 ? '✓ All tools have valid schemas' : '✗ Some tools have invalid schemas'}`);

process.exit(errors.length === 0 ? 0 : 1);
