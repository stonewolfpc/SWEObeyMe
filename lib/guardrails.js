import { STRICT_MODE, MAX_LINES, FORBIDDEN_PATTERNS, MIN_DOCUMENTATION_RATIO } from './config.js';
import { checkAntiPatterns, validateNamingConventions } from './validation.js';

/**
 * Guardrail tools for enforcing strict rules
 */

/**
 * Enforce strict mode validation
 */
export function enforceStrictMode(content) {
  if (!STRICT_MODE()) {
    return { valid: true, errors: [], warnings: [] };
  }

  const errors = [];
  const warnings = [];

  // Stricter line count limit (10% less than normal)
  const strictMaxLines = MAX_LINES() * 0.9;
  const lineCount = content.split('\n').length;

  if (lineCount > strictMaxLines) {
    errors.push(`Strict mode: Line count ${lineCount} exceeds strict limit of ${strictMaxLines}`);
  }

  // Check all forbidden patterns
  const patterns = FORBIDDEN_PATTERNS();
  patterns.forEach(pattern => {
    const regex = new RegExp(pattern, 'g');
    const matches = content.match(regex);
    if (matches) {
      errors.push(`Strict mode: Forbidden pattern '${pattern}' found ${matches.length} times`);
    }
  });

  // Require minimum documentation (15% in strict mode)
  const lines = content.split('\n');
  const commentLines = lines.filter(
    line => line.trim().startsWith('//') || line.trim().startsWith('/*'),
  ).length;
  const commentRatio = commentLines / lineCount;
  const minRatio = MIN_DOCUMENTATION_RATIO() * 1.5;

  if (commentRatio < minRatio) {
    errors.push(
      `Strict mode: Documentation ratio ${(commentRatio * 100).toFixed(1)}% below strict minimum of ${(minRatio * 100).toFixed(1)}%`,
    );
  }

  // Check for anti-patterns
  const antiPatterns = checkAntiPatterns(content);
  if (antiPatterns.issueCount > 0) {
    errors.push(`Strict mode: ${antiPatterns.issueCount} anti-patterns detected`);
    errors.push(...antiPatterns.issues);
  }

  // Check naming conventions
  const naming = validateNamingConventions(content);
  if (!naming.valid) {
    errors.push('Strict mode: Naming convention violations');
    errors.push(...naming.errors);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check for anti-patterns
 */
export function checkForAntiPatterns(content) {
  return checkAntiPatterns(content);
}

/**
 * Check for dangerous operations
 */
export function checkForDangerousOperations(content) {
  const dangerousPatterns = [
    { pattern: /rm\s+-rf/g, description: 'Recursive delete command' },
    { pattern: /exec\s*\(/g, description: 'Dynamic code execution' },
    { pattern: /eval\s*\(/g, description: 'eval() usage' },
    { pattern: /innerHTML\s*=/g, description: 'innerHTML assignment (XSS risk)' },
    { pattern: /document\.write/g, description: 'document.write (XSS risk)' },
    { pattern: /setTimeout\s*\(\s*['"]/g, description: 'setTimeout with string (code execution)' },
  ];

  const issues = [];

  dangerousPatterns.forEach(({ pattern, description }) => {
    const matches = content.match(pattern);
    if (matches) {
      issues.push({
        description,
        count: matches.length,
        severity: 'high',
      });
    }
  });

  return {
    hasDangerousOperations: issues.length > 0,
    issues,
  };
}

/**
 * Check for security issues
 */
export function checkForSecurityIssues(content) {
  const securityIssues = [];

  // Check for hardcoded secrets
  const secretPatterns = [
    /password\s*=\s*['"][^'"]+['"]/gi,
    /api[_-]?key\s*=\s*['"][^'"]+['"]/gi,
    /secret\s*=\s*['"][^'"]+['"]/gi,
    /token\s*=\s*['"][^'"]+['"]/gi,
  ];

  secretPatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      securityIssues.push({
        type: 'hardcoded_secret',
        count: matches.length,
        severity: 'high',
        message: 'Potential hardcoded secrets detected',
      });
    }
  });

  // Check for SQL injection risks
  if (
    content.includes('SELECT') &&
    content.includes('WHERE') &&
    !content.includes('prepared') &&
    !content.includes('parameterized')
  ) {
    securityIssues.push({
      type: 'sql_injection',
      severity: 'high',
      message: 'Potential SQL injection vulnerability',
    });
  }

  // Check for XSS risks
  if (content.includes('innerHTML') || content.includes('document.write')) {
    securityIssues.push({
      type: 'xss',
      severity: 'high',
      message: 'Potential XSS vulnerability',
    });
  }

  return {
    hasSecurityIssues: securityIssues.length > 0,
    issues: securityIssues,
  };
}
