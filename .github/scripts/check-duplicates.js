/**
 * Specifically checks for known problematic duplicate patterns
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Checking for Known Duplicate Patterns...\n');

// Known problematic pairs from debugging
const KNOWN_DUPLICATES = [
  {
    names: ['validate_before_write', 'validate_change_before_apply'],
    reason: 'Both validate content before writing files',
    fix: 'Remove validate_before_write, keep validate_change_before_apply',
  },
  {
    names: ['validate_file_references', 'verify_imports'],
    reason: 'Both validate file references in code',
    fix: 'Review and consolidate into one tool',
  },
  {
    names: ['record_project_decision', 'record_decision'],
    reason: 'Both record decisions to memory',
    fix: 'Review scope and consolidate',
  },
  {
    names: ['index_project_files', 'index_project_structure'],
    reason: 'Both index project files',
    fix: 'Clarify difference or consolidate',
  },
  {
    names: ['obey_me_status', 'status'],
    reason: 'Both provide status information',
    fix: 'Consolidate into obey_me_status',
  },
  {
    names: ['get_architectural_directive', 'get_constitution'],
    reason: 'Both retrieve architectural guidance',
    fix: 'Consolidate into get_architectural_directive',
  },
];

// Navigate from .github/scripts to project root
const projectRoot = path.join(__dirname, '..', '..');
const toolsDir = path.join(projectRoot, 'lib/tools');
let foundIssues = false;

// Get all registry files
const registryFiles = fs
  .readdirSync(toolsDir)
  .filter((f) => f.startsWith('registry') && f.endsWith('.js'));

for (const check of KNOWN_DUPLICATES) {
  const found = [];

  for (const file of registryFiles) {
    const content = fs.readFileSync(path.join(toolsDir, file), 'utf8');

    for (const name of check.names) {
      // Check for exact name matches with word boundaries
      const namePattern = new RegExp(`name:\s*['"\`]${name}['"\`]`, 'g');
      if (namePattern.test(content)) {
        found.push({ name, file });
      }
    }
  }

  if (found.length > 1) {
    console.error('❌ KNOWN DUPLICATE PAIR FOUND:');
    console.error(`   Tools: ${check.names.join(' vs ')}`);
    console.error(`   Reason: ${check.reason}`);
    console.error(`   Suggested Fix: ${check.fix}`);
    for (const f of found) {
      console.error(`   Location: ${f.file} -> ${f.name}`);
    }
    console.error('');
    foundIssues = true;
  }
}

// Also check for any tools that share the same prefix (potential duplicates)
const allTools = [];
for (const file of registryFiles) {
  const content = fs.readFileSync(path.join(toolsDir, file), 'utf8');
  const matches = content.matchAll(/name:\s*['"]([^'"]+)['"]/g);
  for (const match of matches) {
    allTools.push({ name: match[1], file });
  }
}

// Group by first 10 chars similarity
const similarityGroups = {};
for (const tool of allTools) {
  const prefix = tool.name.slice(0, 10);
  if (!similarityGroups[prefix]) {
    similarityGroups[prefix] = [];
  }
  similarityGroups[prefix].push(tool);
}

const suspiciousGroups = Object.entries(similarityGroups).filter(
  ([prefix, tools]) => tools.length > 1 && prefix.length > 5
);

if (suspiciousGroups.length > 0) {
  console.warn('\n⚠️  TOOLS WITH SIMILAR NAMES (manual review recommended):');
  for (const [prefix, tools] of suspiciousGroups) {
    console.warn(`   Prefix "${prefix}":`);
    for (const tool of tools) {
      console.warn(`     - ${tool.name} (${tool.file})`);
    }
  }
}

if (foundIssues) {
  console.error('❌ Duplicate check failed - fix known issues before release');
  process.exit(1);
} else {
  console.log('✅ No known duplicate patterns found');
  process.exit(0);
}
