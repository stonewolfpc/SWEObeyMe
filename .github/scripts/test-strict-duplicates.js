/**
 * STRICT DUPLICATE DETECTION - FAILS on any duplicates
 * This test is PICKY and finds exact duplicates across ALL registry files
 * WindSurf will reject the server if ANY duplicates exist
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚨 STRICT DUPLICATE DETECTION (WindSurf Critical)\n');

const projectRoot = path.join(__dirname, '..', '..');
const toolsDir = path.join(projectRoot, 'lib/tools');

// Get all registry files
const registryFiles = fs
  .readdirSync(toolsDir)
  .filter((f) => f.startsWith('registry') && f.endsWith('.js'));

// Extract all tools with exact locations
const allTools = [];

for (const file of registryFiles) {
  const content = fs.readFileSync(path.join(toolsDir, file), 'utf8');
  const lines = content.split('\n');

  // Find all tool definitions with line numbers
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/name:\s*['"]([^'"]+)['"]/);
    if (match) {
      const toolName = match[1];
      allTools.push({
        name: toolName,
        file: file,
        line: i + 1,
        fullLine: line.trim(),
      });
    }
  }
}

console.log(`Found ${allTools.length} tool definitions\n`);

// Find EXACT duplicates
const duplicates = [];
const nameMap = new Map();

for (const tool of allTools) {
  if (nameMap.has(tool.name)) {
    if (!duplicates.find((d) => d.name === tool.name)) {
      duplicates.push({
        name: tool.name,
        occurrences: [nameMap.get(tool.name), tool],
      });
    } else {
      duplicates.find((d) => d.name === tool.name).occurrences.push(tool);
    }
  } else {
    nameMap.set(tool.name, tool);
  }
}

// Find duplicates in the same file (redefinitions)
const sameFileDuplicates = [];
for (const file of registryFiles) {
  const fileTools = allTools.filter((t) => t.file === file);
  const seen = new Set();
  for (const tool of fileTools) {
    if (seen.has(tool.name)) {
      sameFileDuplicates.push(tool);
    }
    seen.add(tool.name);
  }
}

// Report results
let hasErrors = false;

if (duplicates.length > 0) {
  console.error('❌ CRITICAL: DUPLICATE TOOL NAMES FOUND');
  console.error('   WindSurf will REJECT the server with these duplicates!\n');

  for (const dup of duplicates) {
    console.error(`   🔴 "${dup.name}" appears ${dup.occurrences.length} times:`);
    for (const occ of dup.occurrences) {
      console.error(`      → ${occ.file}:${occ.line}`);
    }
    console.error('');
  }
  hasErrors = true;
}

if (sameFileDuplicates.length > 0) {
  console.error('❌ CRITICAL: SAME-FILE DUPLICATES (Redefinitions)');
  for (const dup of sameFileDuplicates) {
    console.error(`   🔴 "${dup.name}" redefined in ${dup.file}:${dup.line}`);
  }
  hasErrors = true;
}

// Also check for case-insensitive duplicates (WindSurf may treat as same)
const caseInsensitiveMap = new Map();
for (const tool of allTools) {
  const lowerName = tool.name.toLowerCase();
  if (caseInsensitiveMap.has(lowerName)) {
    const existing = caseInsensitiveMap.get(lowerName);
    if (existing.name !== tool.name) {
      console.warn(`\n⚠️  CASE-INSENSITIVE MATCH: "${existing.name}" vs "${tool.name}"`);
      console.warn('   WindSurf may treat these as the same tool');
    }
  } else {
    caseInsensitiveMap.set(lowerName, tool);
  }
}

console.log('\n' + '='.repeat(60));
if (hasErrors) {
  console.error('❌ STRICT DUPLICATE CHECK FAILED');
  console.error(`   ${duplicates.length} duplicate name(s) found`);
  console.error('   FIX THESE BEFORE RELEASE - WindSurf will reject the server!');
  process.exit(1);
} else {
  console.log('✅ NO DUPLICATES FOUND');
  console.log(`   All ${allTools.length} tools have unique names`);
  console.log('   Safe for WindSurf deployment');
  process.exit(0);
}
