/**
 * Refactoring Generators — File generation for split operations
 *
 * Generates complete, compilable files with proper imports and structure.
 */

import path from 'path';
import { detectLanguage } from '../lang-profile.js';

/**
 * Generate a complete split file with proper structure
 */
export function generateSplitFile(filePath, originalContent, functions, suffix) {
  const lang = detectLanguage(filePath);
  const ext = path.extname(filePath);
  const base = path.basename(filePath, ext);
  const newFileName = `${base}-${suffix}${ext}`;

  const imports = extractImports(originalContent, functions, lang);
  let newContent = '';

  switch (lang) {
    case 'go':
      newContent = generateGoFile(functions, imports, originalContent);
      break;
    case 'python':
      newContent = generatePythonFile(functions, imports);
      break;
    case 'javascript':
    case 'typescript':
      newContent = generateJSFile(functions, imports);
      break;
    case 'rust':
      newContent = generateRustFile(functions, imports);
      break;
    case 'java':
      newContent = generateJavaFile(functions, imports, base, suffix);
      break;
    case 'csharp':
      newContent = generateCSharpFile(functions, imports, base, suffix);
      break;
    default:
      newContent = generateGenericFile(functions, imports);
  }

  return { fileName: newFileName, content: newContent, imports };
}

/** Extract imports needed by the given functions */
function extractImports(originalContent, functions, lang) {
  const lines = originalContent.split('\n');
  const imports = [];
  const patterns = {
    go: /^import\s+/,
    python: /^(?:from\s+\S+\s+)?import\s+/,
    javascript: /^(?:import|export).*\s+from\s+/,
    typescript: /^(?:import|export).*\s+from\s+/,
    rust: /^use\s+/,
    java: /^import\s+/,
    csharp: /^using\s+/,
  };

  const pattern = patterns[lang];
  if (!pattern) return imports;

  for (const line of lines) {
    if (pattern.test(line)) imports.push(line.trim());
  }
  return imports;
}

/** Generate Go file with proper structure */
function generateGoFile(functions, imports, originalContent) {
  const packageMatch = originalContent.match(/^package\s+(\w+)/m);
  const packageName = packageMatch ? packageMatch[1] : 'main';

  let content = `package ${packageName}\n\n`;

  if (imports.length > 0) {
    content += 'import (\n';
    for (const imp of imports) {
      const match = imp.match(/import\s+(?:\(\s*)?"([^"]+)"/);
      if (match) content += `\t"${match[1]}"\n`;
    }
    content += ')\n\n';
  }

  for (const fn of functions) {
    content += fn.content + '\n\n';
  }

  return content;
}

/** Generate Python file */
function generatePythonFile(functions, imports) {
  let content = imports.length > 0 ? imports.join('\n') + '\n\n' : '';
  for (const fn of functions) content += fn.content + '\n\n';
  return content;
}

/** Generate JavaScript/TypeScript file */
function generateJSFile(functions, imports) {
  let content = imports.length > 0 ? imports.join('\n') + '\n\n' : '';
  for (const fn of functions) content += fn.content + '\n\n';

  const exportNames = functions.map((f) => f.name).filter(Boolean);
  if (exportNames.length > 0) {
    content += `export { ${exportNames.join(', ')} };\n`;
  }
  return content;
}

/** Generate Rust file */
function generateRustFile(functions, imports) {
  let content = imports.length > 0 ? imports.join('\n') + '\n\n' : '';
  for (const fn of functions) content += fn.content + '\n\n';
  return content;
}

/** Generate Java file */
function generateJavaFile(functions, imports, baseName, suffix) {
  const className = toPascalCase(`${baseName}${suffix}`);
  let content = imports.length > 0 ? imports.join('\n') + '\n\n' : '';

  content += `public class ${className} {\n\n`;
  for (const fn of functions) {
    const indented = fn.content
      .split('\n')
      .map((l) => '    ' + l)
      .join('\n');
    content += indented + '\n\n';
  }
  content += '}\n';
  return content;
}

/** Generate C# file */
function generateCSharpFile(functions, imports, baseName, suffix) {
  const className = toPascalCase(`${baseName}${suffix}`);
  const namespace = toPascalCase(baseName);

  let content = imports.length > 0 ? imports.join('\n') + '\n\n' : '';
  content += `namespace ${namespace}\n{\n`;
  content += `    public class ${className}\n    {\n\n`;

  for (const fn of functions) {
    const indented = fn.content
      .split('\n')
      .map((l) => '        ' + l)
      .join('\n');
    content += indented + '\n\n';
  }

  content += '    }\n}\n';
  return content;
}

/** Generate generic file */
function generateGenericFile(functions, imports) {
  let content = imports.length > 0 ? imports.join('\n') + '\n\n' : '';
  for (const fn of functions) content += fn.content + '\n\n';
  return content;
}

/** Utility: Convert string to PascalCase */
function toPascalCase(str) {
  return str
    .replace(/[-_]/g, ' ')
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => word.toUpperCase())
    .replace(/\s+/g, '');
}

/**
 * Group functions by concern for separation of concerns
 */
export function groupFunctionsByConcern(functions) {
  const groups = {};
  const patterns = {
    chat: /chat|message|response|prompt|conversation|stream|send|receive/i,
    image: /image|gallery|photo|picture|generate|inpaint|img2img|save.*image/i,
    character: /character|persona|npc|avatar/i,
    world: /world|scenario|lore|setting|context|description/i,
    persistence: /save|load|persist|history|storage|file|write|read/i,
    config: /config|setting|option|preference|init/i,
    util: /util|helper|format|parse|convert|debug/i,
    api: /api|http|request|client|server|endpoint/i,
  };

  for (const fn of functions) {
    let assigned = false;
    for (const [concern, pattern] of Object.entries(patterns)) {
      if (pattern.test(fn.name)) {
        if (!groups[concern]) groups[concern] = [];
        groups[concern].push(fn);
        assigned = true;
        break;
      }
    }
    if (!assigned) {
      if (!groups.core) groups.core = [];
      groups.core.push(fn);
    }
  }

  return groups;
}
