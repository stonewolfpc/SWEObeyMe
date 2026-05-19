/**
 * Refactoring Validator — Validates generated split files
 *
 * Ensures generated code is syntactically plausible before returning it.
 */

/**
 * Validate that generated code is syntactically plausible
 * @param {string} content - Generated code content
 * @param {string} lang - Language identifier
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateGeneratedCode(content, lang) {
  const errors = [];
  const lines = content.split('\n');

  // Check for balanced braces
  let braceCount = 0;
  let parenCount = 0;
  let inString = false;
  let stringChar = null;

  for (const line of lines) {
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const prev = i > 0 ? line[i - 1] : null;

      if ((char === '"' || char === "'" || char === '`') && prev !== '\\') {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (stringChar === char) {
          inString = false;
        }
        continue;
      }

      if (inString) continue;

      if (char === '{') braceCount++;
      if (char === '}') braceCount--;
      if (char === '(') parenCount++;
      if (char === ')') parenCount--;
    }
  }

  if (braceCount !== 0) {
    errors.push(`Unbalanced braces: ${braceCount} remaining`);
  }
  if (parenCount !== 0) {
    errors.push(`Unbalanced parentheses: ${parenCount} remaining`);
  }

  // Language-specific checks
  switch (lang) {
    case 'go':
      if (!content.includes('package ')) {
        errors.push('Go file missing package declaration');
      }
      break;
    case 'java':
    case 'csharp':
      if (!content.includes('class ')) {
        errors.push(`${lang} file missing class declaration`);
      }
      break;
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
