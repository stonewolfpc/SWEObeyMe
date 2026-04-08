/**
 * C# specific validation utilities
 * Helps prevent chaos in complex C# .NET 8/10 projects
 */

import {
  CSHARP_MAX_METHOD_COMPLEXITY,
  CSHARP_MAX_NESTING_DEPTH,
  CSHARP_MAX_TRY_CATCH_DEPTH,
} from './config.js';

/**
 * Analyze C# code complexity
 */
export function analyzeCSharpComplexity(code) {
  const lines = code.split('\n');
  const issues = [];
  const metrics = {
    maxNestingDepth: 0,
    maxMethodComplexity: 0,
    tryCatchDepth: 0,
    emptyCatchBlocks: [],
    asyncAwaitIssues: [],
    missingUsingStatements: [],
  };

  let currentNestingDepth = 0;
  let currentTryCatchDepth = 0;
  let methodComplexity = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lineNum = i + 1;

    // Track nesting depth
    if (line.includes('{')) {
      currentNestingDepth++;
      metrics.maxNestingDepth = Math.max(metrics.maxNestingDepth, currentNestingDepth);
    }
    if (line.includes('}')) {
      currentNestingDepth--;
    }

    // Track try-catch depth
    if (line.startsWith('try') && line.includes('{')) {
      currentTryCatchDepth++;
      metrics.tryCatchDepth = Math.max(metrics.tryCatchDepth, currentTryCatchDepth);
    }
    if (line.startsWith('catch') && line.includes('{')) {
      currentTryCatchDepth++;
      metrics.tryCatchDepth = Math.max(metrics.tryCatchDepth, currentTryCatchDepth);
    }
    if (
      line.includes('}') &&
      (lines[i - 1]?.trim().includes('catch') || lines[i - 1]?.trim().includes('try'))
    ) {
      currentTryCatchDepth--;
    }

    // Detect empty catch blocks
    if (line.startsWith('catch') && line.includes('{')) {
      const nextLines = lines.slice(i).join('\n');
      const catchEnd = nextLines.indexOf('}');
      const catchBody = nextLines.substring(nextLines.indexOf('{') + 1, catchEnd).trim();
      if (catchBody === '' || catchBody === '//' || catchBody.startsWith('//')) {
        issues.push({
          line: lineNum,
          type: 'EMPTY_CATCH',
          message: 'Empty catch block detected - exceptions are being swallowed',
        });
        metrics.emptyCatchBlocks.push(lineNum);
      }
    }

    // Detect async/await anti-patterns
    if (line.includes('async Task') && !line.includes('await')) {
      // Check if there's an await in the method
      const methodEnd = findMethodEnd(lines, i);
      const methodBody = lines.slice(i, methodEnd).join('\n');
      if (!methodBody.includes('await')) {
        issues.push({
          line: lineNum,
          type: 'ASYNC_NO_AWAIT',
          message: 'Async method without await - use async Task instead of async Task<T>',
        });
        metrics.asyncAwaitIssues.push(lineNum);
      }
    }

    // Detect void async methods (should return Task)
    if (line.includes('async void')) {
      issues.push({
        line: lineNum,
        type: 'ASYNC_VOID',
        message: 'Async void method detected - use async Task instead for better error handling',
      });
      metrics.asyncAwaitIssues.push(lineNum);
    }

    // Detect missing using statements for IDisposable
    const disposablePattern =
      /\b(Stream|Reader|Writer|Connection|Command|Transaction|HttpClient|DbContext|Disposable)\b/;
    if (disposablePattern.test(line) && !line.includes('using') && !line.includes('await using')) {
      // Check if it's inside a using statement
      const previousLines = lines.slice(0, i).reverse();
      let inUsing = false;
      for (const prevLine of previousLines) {
        if (prevLine.includes('using (') || prevLine.includes('await using (')) {
          inUsing = true;
          break;
        }
        if (prevLine.includes('}')) {
          break;
        }
      }
      if (!inUsing) {
        issues.push({
          line: lineNum,
          type: 'MISSING_USING',
          message: 'IDisposable object without using statement - potential resource leak',
        });
        metrics.missingUsingStatements.push(lineNum);
      }
    }

    // Calculate cyclomatic complexity (simplified)
    if (
      line.includes('if') ||
      line.includes('else if') ||
      line.includes('for') ||
      line.includes('foreach') ||
      line.includes('while') ||
      line.includes('case') ||
      line.includes('&&') ||
      line.includes('||') ||
      line.includes('?')
    ) {
      methodComplexity++;
    }
  }

  metrics.maxMethodComplexity = methodComplexity;

  return {
    issues,
    metrics,
    summary: generateSummary(metrics, issues),
  };
}

/**
 * Find the end of a method
 */
function findMethodEnd(lines, startLine) {
  let braceCount = 0;
  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i];
    braceCount += (line.match(/{/g) || []).length;
    braceCount -= (line.match(/}/g) || []).length;
    if (braceCount === 0 && i > startLine) {
      return i;
    }
  }
  return lines.length;
}

/**
 * Generate summary of complexity analysis
 */
function generateSummary(metrics, _issues) {
  const summary = [];

  if (metrics.maxNestingDepth > CSHARP_MAX_NESTING_DEPTH()) {
    summary.push(
      `CRITICAL: Nesting depth ${metrics.maxNestingDepth} exceeds limit of ${CSHARP_MAX_NESTING_DEPTH()}`,
    );
  }

  if (metrics.maxMethodComplexity > CSHARP_MAX_METHOD_COMPLEXITY()) {
    summary.push(
      `WARNING: Method complexity ${metrics.maxMethodComplexity} exceeds limit of ${CSHARP_MAX_METHOD_COMPLEXITY()}`,
    );
  }

  if (metrics.tryCatchDepth > CSHARP_MAX_TRY_CATCH_DEPTH()) {
    summary.push(
      `CRITICAL: Try-catch nesting ${metrics.tryCatchDepth} exceeds limit of ${CSHARP_MAX_TRY_CATCH_DEPTH()}`,
    );
  }

  if (metrics.emptyCatchBlocks.length > 0) {
    summary.push(`WARNING: ${metrics.emptyCatchBlocks.length} empty catch block(s) detected`);
  }

  if (metrics.missingUsingStatements.length > 0) {
    summary.push(
      `CRITICAL: ${metrics.missingUsingStatements.length} missing using statement(s) for IDisposable`,
    );
  }

  if (metrics.asyncAwaitIssues.length > 0) {
    summary.push(
      `WARNING: ${metrics.asyncAwaitIssues.length} async/await anti-pattern(s) detected`,
    );
  }

  return summary.length > 0 ? summary : ['Code complexity is within acceptable limits'];
}

/**
 * Validate bracket matching in C# code
 */
export function validateCSharpBrackets(code) {
  const issues = [];
  const stack = [];
  const lines = code.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      const column = j + 1;

      if (char === '{' || char === '(' || char === '[') {
        stack.push({ char, line: lineNum, column });
      } else if (char === '}' || char === ')' || char === ']') {
        const opening = stack.pop();
        if (!opening) {
          issues.push({
            line: lineNum,
            column,
            type: 'UNEXPECTED_CLOSING_BRACKET',
            message: `Unexpected closing bracket '${char}' without matching opening bracket`,
          });
        } else {
          const pairs = { '{': '}', '(': ')', '[': ']' };
          if (pairs[opening.char] !== char) {
            issues.push({
              line: lineNum,
              column,
              type: 'MISMATCHED_BRACKET',
              message: `Mismatched brackets: expected '${pairs[opening.char]}' but found '${char}' (opened at line ${opening.line}, column ${opening.column})`,
            });
          }
        }
      }
    }
  }

  // Check for unclosed brackets
  while (stack.length > 0) {
    const unclosed = stack.pop();
    issues.push({
      line: unclosed.line,
      column: unclosed.column,
      type: 'UNCLOSED_BRACKET',
      message: `Unclosed bracket '${unclosed.char}' at line ${unclosed.line}, column ${unclosed.column}`,
    });
  }

  return {
    valid: issues.length === 0,
    issues,
    summary:
      issues.length > 0
        ? `${issues.length} bracket issue(s) found`
        : 'All brackets properly matched',
  };
}

/**
 * Visualize scope depth for C# code
 */
export function visualizeScopeDepth(code) {
  const lines = code.split('\n');
  const visualization = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let depth = 0;

    // Calculate depth based on opening/closing brackets
    for (let j = 0; j < line.length; j++) {
      if (line[j] === '{' || line[j] === '(' || line[j] === '[') {
        depth++;
      } else if (line[j] === '}' || line[j] === ')' || line[j] === ']') {
        depth--;
      }
    }

    const indent = '│  '.repeat(Math.max(0, depth));
    const depthIndicator = depth > 5 ? ` ⚠️[${depth}]` : ` [${depth}]`;
    visualization.push(`${indent}${depthIndicator}${line}`);
  }

  return visualization.join('\n');
}

/**
 * Detect nested try-catch nightmares
 */
export function detectNestedTryCatch(code) {
  const lines = code.split('\n');
  const issues = [];
  const tryStack = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('try') && line.includes('{')) {
      tryStack.push({ line: i + 1, depth: tryStack.length });
      if (tryStack.length > CSHARP_MAX_TRY_CATCH_DEPTH()) {
        issues.push({
          line: i + 1,
          depth: tryStack.length,
          type: 'DEEPLY_NESTED_TRY_CATCH',
          message: `Try-catch nested ${tryStack.length} levels deep - consider extracting to separate methods`,
        });
      }
    } else if (line.startsWith('catch') && line.includes('{')) {
      tryStack.push({ line: i + 1, depth: tryStack.length });
    } else if (line.startsWith('finally') && line.includes('{')) {
      tryStack.push({ line: i + 1, depth: tryStack.length });
    } else if (line === '}' && tryStack.length > 0) {
      tryStack.pop();
    }
  }

  return {
    issues,
    maxDepth: tryStack.reduce((max, item) => Math.max(max, item.depth), 0),
    summary:
      issues.length > 0
        ? `${issues.length} deeply nested try-catch issue(s) found`
        : 'Try-catch nesting is acceptable',
  };
}

/**
 * Validate C# code comprehensively
 */
export function validateCSharpCode(code) {
  const complexity = analyzeCSharpComplexity(code);
  const brackets = validateCSharpBrackets(code);
  const tryCatch = detectNestedTryCatch(code);

  const allIssues = [...complexity.issues, ...brackets.issues, ...tryCatch.issues];

  const criticalIssues = allIssues.filter(
    i => i.type.includes('CRITICAL') || i.type.includes('UNCLOSED') || i.type.includes('UNEXPECTED'),
  );
  const warnings = allIssues.filter(i => !criticalIssues.includes(i));

  return {
    valid: criticalIssues.length === 0,
    issues: allIssues,
    criticalIssues,
    warnings,
    metrics: complexity.metrics,
    summary: {
      complexity: complexity.summary,
      brackets: brackets.summary,
      tryCatch: tryCatch.summary,
    },
  };
}
