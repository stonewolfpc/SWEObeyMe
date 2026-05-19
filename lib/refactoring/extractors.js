/**
 * Refactoring Extractors — Language-aware function extraction
 *
 * Extracts complete function/method definitions with proper boundary detection.
 */

import { detectLanguage, getLangProfile } from '../lang-profile.js';

/**
 * Extract all top-level functions/methods from source code
 * @param {string} content - Source code content
 * @param {string} filePath - Path to the source file
 * @returns {Array<{name: string, content: string, lineRange: [number, number], receiver?: string}>}
 */
export function extractFunctions(content, filePath) {
  const lang = detectLanguage(filePath);
  const profile = getLangProfile(lang);

  switch (lang) {
    case 'go':
      return extractGoFunctions(content);
    case 'python':
    case 'ruby':
      return extractPythonFunctions(content);
    case 'rust':
      return extractRustFunctions(content);
    case 'javascript':
    case 'typescript':
      return extractJSFunctions(content);
    case 'csharp':
      return extractCSharpFunctions(content);
    case 'java':
      return extractJavaFunctions(content);
    case 'kotlin':
      return extractKotlinFunctions(content);
    case 'swift':
      return extractSwiftFunctions(content);
    case 'cpp':
    case 'c':
      return extractCppFunctions(content);
    default:
      return extractGenericFunctions(content, profile?.functionKw || 'function');
  }
}

/** Extract Go functions with proper brace balancing */
export function extractGoFunctions(content) {
  const lines = content.split('\n');
  const functions = [];
  const funcRegex = /^(\s*)func\s+(?:\(([^)]+)\)\s+)?(\w+)/;

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(funcRegex);
    if (match) {
      const receiver = match[2]?.trim() || null;
      const name = match[3];
      const { endLine, fullContent } = extractBalancedBlock(lines, i, '{', '}');

      functions.push({
        name,
        content: fullContent,
        lineRange: [i + 1, endLine + 1],
        receiver,
        language: 'go',
      });
      i = endLine;
    }
  }
  return functions;
}

/** Extract Python/Ruby functions (indentation-based) */
export function extractPythonFunctions(content) {
  const lines = content.split('\n');
  const functions = [];
  const defRegex = /^(\s*)def\s+(\w+)/;

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(defRegex);
    if (match) {
      const baseIndent = match[1].length;
      const name = match[2];
      let endLine = i;

      for (let j = i + 1; j < lines.length; j++) {
        const line = lines[j];
        if (line.trim() === '') continue;
        const lineIndent = line.match(/^(\s*)/)?.[1].length || 0;
        if (lineIndent <= baseIndent && !line.trim().startsWith('#')) break;
        endLine = j;
      }

      functions.push({
        name,
        content: lines.slice(i, endLine + 1).join('\n'),
        lineRange: [i + 1, endLine + 1],
        language: 'python',
      });
      i = endLine;
    }
  }
  return functions;
}

/** Extract Rust functions */
export function extractRustFunctions(content) {
  const lines = content.split('\n');
  const functions = [];
  const fnRegex = /^(\s*)fn\s+(\w+)/;

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(fnRegex);
    if (match) {
      const name = match[2];
      const { endLine, fullContent } = extractBalancedBlock(lines, i, '{', '}');

      functions.push({
        name,
        content: fullContent,
        lineRange: [i + 1, endLine + 1],
        language: 'rust',
      });
      i = endLine;
    }
  }
  return functions;
}

/** Extract JavaScript/TypeScript functions */
export function extractJSFunctions(content) {
  const lines = content.split('\n');
  const functions = [];
  const patterns = [
    /^(\s*)(?:async\s+)?function\s*\*?\s*(\w+)/,
    /^(\s*)(?:export\s+)?(?:async\s+)?function\s*\*?\s*(\w+)/,
    /^(\s*)(\w+)\s*[=:]\s*(?:async\s*)?(?:function|\([^)]*\)\s*=>)/,
    /^(\s*)(?:async\s+)?(\w+)\s*\([^)]*\)\s*\{/,
  ];

  for (let i = 0; i < lines.length; i++) {
    for (const pattern of patterns) {
      const match = lines[i].match(pattern);
      if (match) {
        const name = match[2];
        const { endLine, fullContent } = extractBalancedBlock(lines, i, '{', '}');

        functions.push({
          name,
          content: fullContent,
          lineRange: [i + 1, endLine + 1],
          language: 'javascript',
        });
        i = endLine;
        break;
      }
    }
  }
  return functions;
}

/** Extract C# methods */
export function extractCSharpFunctions(content) {
  const lines = content.split('\n');
  const functions = [];
  const methodRegex =
    /^(\s*)(?:public|private|protected|internal)?\s+(?:static\s+)?(?:virtual\s+)?(?:override\s+)?(?:async\s+)?[\w<>,\s[\]]+\s+(\w+)\s*\(/;

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(methodRegex);
    if (match) {
      const name = match[2];
      const { endLine, fullContent } = extractBalancedBlock(lines, i, '{', '}');

      functions.push({
        name,
        content: fullContent,
        lineRange: [i + 1, endLine + 1],
        language: 'csharp',
      });
      i = endLine;
    }
  }
  return functions;
}

/** Extract Java methods */
export function extractJavaFunctions(content) {
  const lines = content.split('\n');
  const functions = [];
  const methodRegex =
    /^(\s*)(?:public|private|protected)?\s+(?:static\s+)?(?:final\s+)?(?:abstract\s+)?[\w<>,[\]]+\s+(\w+)\s*\(/;

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(methodRegex);
    if (match) {
      const name = match[2];
      const { endLine, fullContent } = extractBalancedBlock(lines, i, '{', '}');

      functions.push({
        name,
        content: fullContent,
        lineRange: [i + 1, endLine + 1],
        language: 'java',
      });
      i = endLine;
    }
  }
  return functions;
}

/** Extract Kotlin functions */
export function extractKotlinFunctions(content) {
  const lines = content.split('\n');
  const functions = [];
  const funRegex =
    /^(\s*)(?:private\s+|public\s+|internal\s+|protected\s+)?(?:suspend\s+)?fun\s+(\w+)/;

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(funRegex);
    if (match) {
      const name = match[2];
      const { endLine, fullContent } = extractBalancedBlock(lines, i, '{', '}');

      functions.push({
        name,
        content: fullContent,
        lineRange: [i + 1, endLine + 1],
        language: 'kotlin',
      });
      i = endLine;
    }
  }
  return functions;
}

/** Extract Swift functions */
export function extractSwiftFunctions(content) {
  const lines = content.split('\n');
  const functions = [];
  const funcRegex =
    /^(\s*)(?:private\s+|public\s+|internal\s+|fileprivate\s+|open\s+)?(?:static\s+)?(?:override\s+)?(?:func\s+)(\w+)/;

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(funcRegex);
    if (match) {
      const name = match[2];
      const { endLine, fullContent } = extractBalancedBlock(lines, i, '{', '}');

      functions.push({
        name,
        content: fullContent,
        lineRange: [i + 1, endLine + 1],
        language: 'swift',
      });
      i = endLine;
    }
  }
  return functions;
}

/** Extract C/C++ functions */
export function extractCppFunctions(content) {
  const lines = content.split('\n');
  const functions = [];
  const funcRegex = /^(\s*)(?:[\w*]+\s+)+(\w+)\s*\([^)]*\)\s*\{/;

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(funcRegex);
    if (match && !lines[i].includes('typedef') && !lines[i].includes('struct')) {
      const name = match[2];
      const { endLine, fullContent } = extractBalancedBlock(lines, i, '{', '}');

      functions.push({
        name,
        content: fullContent,
        lineRange: [i + 1, endLine + 1],
        language: 'cpp',
      });
      i = endLine;
    }
  }
  return functions;
}

/** Generic function extraction fallback */
export function extractGenericFunctions(content, keyword) {
  const lines = content.split('\n');
  const functions = [];
  const regex = new RegExp(`^(\\s*)${keyword}\\s+(\\w+)`);

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(regex);
    if (match) {
      const name = match[2];
      const { endLine, fullContent } = extractBalancedBlock(lines, i, '{', '}');

      functions.push({
        name,
        content: fullContent,
        lineRange: [i + 1, endLine + 1],
        language: 'generic',
      });
      i = endLine;
    }
  }
  return functions;
}

/**
 * Extract a balanced block of code with proper brace/paren/bracket counting
 */
export function extractBalancedBlock(lines, startLine, openChar, closeChar) {
  let braceCount = 0;
  let inString = false;
  let stringChar = null;
  let endLine = startLine;

  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i];

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      const prevChar = j > 0 ? line[j - 1] : null;

      if ((char === '"' || char === "'" || char === '`') && prevChar !== '\\') {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (stringChar === char) {
          inString = false;
          stringChar = null;
        }
        continue;
      }

      if (inString) continue;

      if (char === openChar) {
        braceCount++;
      } else if (char === closeChar) {
        braceCount--;
        if (braceCount === 0 && i > startLine) {
          endLine = i;
          break;
        }
      }
    }

    if (braceCount === 0 && i > startLine) break;
  }

  if (braceCount > 0) {
    endLine = lines.length - 1;
  }

  return {
    endLine,
    fullContent: lines.slice(startLine, endLine + 1).join('\n'),
  };
}
