/**
 * Tool Registry Audit
 * Audits and categorizes all 96 tools in the SWEObeyMe MCP server
 */

import { getToolDefinitions } from '../lib/tools/registry.js';

const tools = getToolDefinitions();

console.log(`Total tools: ${tools.length}\n`);

// Categorize by priority
const critical = tools.filter(t => (t.priority || 0) >= 95);
const high = tools.filter(t => (t.priority || 0) >= 50 && (t.priority || 0) < 95);
const medium = tools.filter(t => (t.priority || 0) > 0 && (t.priority || 0) < 50);
const low = tools.filter(t => (t.priority || 0) === 0);

console.log('=== TOOL COUNT BY PRIORITY ===');
console.log(`Critical (≥95): ${critical.length}`);
console.log(`High (50-94): ${high.length}`);
console.log(`Medium (1-49): ${medium.length}`);
console.log(`Low (0): ${low.length}\n`);

// List all tools with priority
console.log('=== ALL TOOLS ===');
tools.forEach(t => {
  console.log(`- ${t.name} (priority: ${t.priority || 0})`);
});

// Identify language-specific tools
const languageTools = tools.filter(t => {
  const name = t.name.toLowerCase();
  return name.includes('csharp') || name.includes('godot') || name.includes('python') || name.includes('cpp');
});

console.log(`\n=== LANGUAGE-SPECIFIC TOOLS (${languageTools.length}) ===`);
languageTools.forEach(t => {
  console.log(`- ${t.name}`);
});

// Identify corpus-specific tools
const corpusTools = tools.filter(t => {
  const name = t.name.toLowerCase();
  return name.includes('docs') || name.includes('math') || name.includes('fdq') || name.includes('training') || name.includes('patreon');
});

console.log(`\n=== CORPUS-SPECIFIC TOOLS (${corpusTools.length}) ===`);
corpusTools.forEach(t => {
  console.log(`- ${t.name}`);
});
