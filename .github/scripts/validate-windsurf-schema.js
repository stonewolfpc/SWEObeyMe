/**
 * Validates that tool schemas comply with WindSurf's strict requirements
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Validating WindSurf Schema Compliance...\n');

// Navigate from .github/scripts to project root
const projectRoot = path.join(__dirname, '..', '..');
const toolsDir = path.join(projectRoot, 'lib/tools');
const errors = [];
const warnings = [];

// Get all registry files
const registryFiles = fs
  .readdirSync(toolsDir)
  .filter((f) => f.startsWith('registry') && f.endsWith('.js'));

for (const file of registryFiles) {
  const content = fs.readFileSync(path.join(toolsDir, file), 'utf8');

  // Find all tool definitions with their full blocks
  const toolPattern =
    /name:\s*['"]([^'"]+)['"]\s*,([\s\S]*?)(?:description:\s*['"][\s\S]*?['"]\s*,)?\s*inputSchema:\s*\{/g;
  let toolMatch;

  while ((toolMatch = toolPattern.exec(content)) !== null) {
    const toolName = toolMatch[1];
    const afterName = toolMatch[2];

    // Find the complete inputSchema object
    const schemaStart = toolMatch.index + toolMatch[0].length - 1; // -1 to include the {
    let braceCount = 1;
    let schemaEnd = schemaStart + 1;

    while (braceCount > 0 && schemaEnd < content.length) {
      if (content[schemaEnd] === '{') braceCount++;
      if (content[schemaEnd] === '}') braceCount--;
      schemaEnd++;
    }

    const schemaBlock = content.slice(schemaStart, schemaEnd);

    // Check for required fields in schema
    const hasType = schemaBlock.match(/type:\s*['"]object['"]/);
    const hasProperties = schemaBlock.includes('properties:');

    // Extract required array if present
    const requiredMatch = schemaBlock.match(/required:\s*\[([^\]]*)\]/);
    const required = requiredMatch
      ? requiredMatch[1]
        .split(',')
        .map((s) => s.trim().replace(/['"]/g, ''))
        .filter(Boolean)
      : [];

    // Extract property names
    const propMatches = schemaBlock.matchAll(/(\w+):\s*\{/g);
    const propNames = [];
    for (const pm of propMatches) {
      propNames.push(pm[1]);
    }

    // WindSurf REQUIRES "type: 'object'" at root
    if (!hasType) {
      errors.push({
        file,
        tool: toolName,
        error: 'inputSchema missing root type: "object" (WindSurf requirement)',
      });
    }

    // WindSurf REQUIRES properties
    if (!hasProperties) {
      errors.push({
        file,
        tool: toolName,
        error: 'inputSchema missing "properties" (WindSurf requirement)',
      });
    }

    // Validate required fields exist in properties
    for (const req of required) {
      if (!propNames.includes(req)) {
        errors.push({
          file,
          tool: toolName,
          error: `Required field "${req}" not found in properties`,
        });
      }
    }

    // Check for $ref (circular references) - WindSurf may not support
    if (schemaBlock.includes('$ref')) {
      warnings.push({
        file,
        tool: toolName,
        warning: 'Schema contains $ref - WindSurf may not support references',
      });
    }

    // Check for additionalProperties (WindSurf may not support)
    if (schemaBlock.includes('additionalProperties:')) {
      warnings.push({
        file,
        tool: toolName,
        warning: 'Schema uses additionalProperties - verify WindSurf compatibility',
      });
    }

    // Check for patternProperties (WindSurf may not support)
    if (schemaBlock.includes('patternProperties:')) {
      warnings.push({
        file,
        tool: toolName,
        warning: 'Schema uses patternProperties - verify WindSurf compatibility',
      });
    }
  }
}

if (errors.length > 0) {
  console.error('❌ SCHEMA VALIDATION ERRORS:');
  for (const err of errors) {
    console.error(`  [${err.file}] "${err.tool}": ${err.error}`);
  }
}

if (warnings.length > 0) {
  console.warn('\n⚠️  SCHEMA WARNINGS:');
  for (const warn of warnings) {
    console.warn(`  [${warn.file}] "${warn.tool}": ${warn.warning}`);
  }
}

if (errors.length > 0) {
  console.error('\n❌ Schema validation failed - WindSurf will reject these tools');
  process.exit(1);
} else if (warnings.length > 0) {
  console.log('\n✅ All schemas valid (with warnings)');
  process.exit(0);
} else {
  console.log('✅ All schemas valid for WindSurf');
  process.exit(0);
}
