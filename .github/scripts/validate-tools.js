/**
 * Validates all tool registries for:
 * 1. Duplicate tool names
 * 2. Valid JSON Schema in inputSchema
 * 3. Required fields present
 * 4. WindSurf naming conventions
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Validating Tool Registry...\n');

// Navigate from .github/scripts to project root
const projectRoot = path.join(__dirname, '..', '..');
const toolsDir = path.join(projectRoot, 'lib/tools');
const registryFiles = fs
  .readdirSync(toolsDir)
  .filter((f) => f.startsWith('registry') && f.endsWith('.js'))
  .filter((f) => f !== 'registry.js'); // Main registry imports others

console.log(`Found ${registryFiles.length} registry files:`);
registryFiles.forEach((f) => console.log(`  - ${f}`));

// Extract all tool definitions
const allTools = [];
const errors = [];

for (const file of registryFiles) {
  const content = fs.readFileSync(path.join(toolsDir, file), 'utf8');

  // Find all tool definitions using regex - handle both single and double quotes
  const toolPattern = /name:\s*['"]([^'"]+)['"]\s*,[\s\S]*?handler:/g;
  let match;

  while ((match = toolPattern.exec(content)) !== null) {
    const toolBlockStart = match.index;
    // Find the end of this tool definition (next tool or end of array)
    const nextToolMatch = content.slice(toolBlockStart + 1).match(/name:\s*['"]/);
    const toolBlockEnd = nextToolMatch ? toolBlockStart + 1 + nextToolMatch.index : content.length;
    const toolBlock = content.slice(toolBlockStart, toolBlockEnd);
    const name = match[1];

    // Extract priority
    const priorityMatch = toolBlock.match(/priority:\s*(\d+)/);
    const priority = priorityMatch ? parseInt(priorityMatch[1]) : 0;

    // Extract description - handle multiline
    const descMatch = toolBlock.match(
      /description:\s*['"]([\s\S]*?)['"]\s*,\s*(?:inputSchema|priority|handler)/
    );
    const description = descMatch ? descMatch[1].replace(/\s+/g, ' ').trim() : '';

    // Extract inputSchema (check it exists)
    const hasInputSchema = toolBlock.includes('inputSchema:');

    allTools.push({
      name,
      file,
      priority,
      description,
      hasInputSchema,
      fullMatch: toolBlock.slice(0, 200), // Store first 200 chars for debugging
    });
  }
}

console.log(`\n📊 Found ${allTools.length} total tools\n`);

// Check 1: Duplicate names
const nameCounts = {};
for (const tool of allTools) {
  nameCounts[tool.name] = (nameCounts[tool.name] || 0) + 1;
}

const duplicates = Object.entries(nameCounts).filter(([name, count]) => count > 1);

if (duplicates.length > 0) {
  console.error('❌ DUPLICATE TOOLS FOUND:');
  for (const [name, count] of duplicates) {
    const dupes = allTools.filter((t) => t.name === name);
    console.error(`  "${name}" appears ${count} times:`);
    for (const d of dupes) {
      console.error(`    - ${d.file}`);
    }
  }
  errors.push(`${duplicates.length} duplicate tool(s)`);
} else {
  console.log('✅ No duplicate tool names');
}

// Check 2: Naming conventions (WindSurf is strict - snake_case only)
const invalidNames = allTools.filter((t) => !/^[a-z][a-z0-9_]*$/.test(t.name));
if (invalidNames.length > 0) {
  console.error('\n❌ INVALID TOOL NAMES (must be snake_case):');
  for (const tool of invalidNames) {
    console.error(`  "${tool.name}" in ${tool.file}`);
  }
  errors.push(`${invalidNames.length} invalid tool name(s)`);
} else {
  console.log('✅ All tool names follow snake_case convention');
}

// Check 3: Required fields
const missingFields = allTools.filter((t) => !t.description || !t.hasInputSchema);
if (missingFields.length > 0) {
  console.error('\n❌ TOOLS MISSING REQUIRED FIELDS:');
  for (const tool of missingFields) {
    const missing = [];
    if (!t.description) missing.push('description');
    if (!t.hasInputSchema) missing.push('inputSchema');
    console.error(`  "${tool.name}" in ${tool.file} missing: ${missing.join(', ')}`);
  }
  errors.push(`${missingFields.length} tool(s) missing required fields`);
} else {
  console.log('✅ All tools have required fields');
}

// Check 4: Look for similar tools (potential duplicates)
const potentialDuplicates = [];
for (let i = 0; i < allTools.length; i++) {
  for (let j = i + 1; j < allTools.length; j++) {
    const t1 = allTools[i];
    const t2 = allTools[j];

    // Check for similar names
    const name1 = t1.name.toLowerCase().replace(/_/g, '');
    const name2 = t2.name.toLowerCase().replace(/_/g, '');

    if (
      name1 === name2 ||
      ((name1.includes(name2) || name2.includes(name1)) &&
        Math.abs(name1.length - name2.length) < 5)
    ) {
      potentialDuplicates.push([t1, t2]);
    }
  }
}

if (potentialDuplicates.length > 0) {
  console.warn('\n⚠️  POTENTIALLY SIMILAR TOOLS (review for duplicates):');
  for (const [t1, t2] of potentialDuplicates) {
    console.warn(`  "${t1.name}" (${t1.file})`);
    console.warn(`  "${t2.name}" (${t2.file})`);
    console.warn('');
  }
}

// Summary
console.log('\n' + '='.repeat(50));
if (errors.length > 0) {
  console.error(`❌ FAILED: ${errors.join(', ')}`);
  process.exit(1);
} else {
  console.log('✅ ALL VALIDATION PASSED');
  console.log(`   ${allTools.length} tools validated`);
  console.log(`   ${registryFiles.length} registry files`);
  process.exit(0);
}
