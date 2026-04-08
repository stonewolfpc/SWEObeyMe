/**
 * Math expression safety utilities for C# and other languages
 * Helps prevent chaos in complex mathematical code
 */

import { CSHARP_WARN_ON_COMPLEX_MATH, CSHARP_MATH_COMPLEXITY_THRESHOLD } from './config.js';

/**
 * Analyze mathematical expression complexity
 */
export function analyzeMathExpression(code) {
  const issues = [];
  const lines = code.split('\n');
  const metrics = {
    complexExpressions: [],
    potentialOverflow: [],
    precisionLoss: [],
    divisionByZeroRisk: [],
    operatorPrecedenceIssues: [],
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lineNum = i + 1;

    // Skip comments and empty lines
    if (line.startsWith('//') || line.startsWith('/*') || line === '') {
      continue;
    }

    // Detect complex mathematical expressions
    const operators = (line.match(/[+\-*/%^]/g) || []).length;
    const parentheses = (line.match(/\(/g) || []).length;
    const complexity = operators + parentheses;

    if (complexity >= CSHARP_MATH_COMPLEXITY_THRESHOLD()) {
      metrics.complexExpressions.push({
        line: lineNum,
        complexity,
        expression: line.substring(0, 100),
      });

      if (CSHARP_WARN_ON_COMPLEX_MATH()) {
        issues.push({
          line: lineNum,
          type: 'COMPLEX_MATH_EXPRESSION',
          severity: 'WARNING',
          message: `Complex mathematical expression (complexity: ${complexity}). Consider breaking into smaller expressions or variables.`,
        });
      }
    }

    // Detect potential integer overflow
    if (line.includes('int') && (line.includes('*') || line.includes('+'))) {
      // Check for multiplication/addition that could overflow
      const hasLargeNumbers = /\b\d{4,}\b/.test(line);
      if (hasLargeNumbers) {
        issues.push({
          line: lineNum,
          type: 'POTENTIAL_OVERFLOW',
          severity: 'WARNING',
          message:
            'Potential integer overflow detected with large numbers. Consider using long or checked context.',
        });
        metrics.potentialOverflow.push(lineNum);
      }
    }

    // Detect precision loss issues (decimal vs double)
    if (line.includes('double') && line.includes('decimal')) {
      issues.push({
        line: lineNum,
        type: 'PRECISION_LOSS',
        severity: 'WARNING',
        message: 'Mixing double and decimal may cause precision loss. Use consistent types.',
      });
      metrics.precisionLoss.push(lineNum);
    }

    // Detect division without zero check
    if (line.includes('/') && !line.includes('0') && !line.includes('Zero')) {
      // Check if there's a zero check before this line
      const previousLines = lines.slice(Math.max(0, i - 5), i);
      const hasZeroCheck = previousLines.some(
        l => l.includes('=== 0') || l.includes('!== 0') || l.includes('Zero') || l.includes('throw'),
      );

      if (!hasZeroCheck) {
        issues.push({
          line: lineNum,
          type: 'DIVISION_BY_ZERO_RISK',
          severity: 'WARNING',
          message:
            'Division operation without explicit zero check detected. Add validation to prevent division by zero.',
        });
        metrics.divisionByZeroRisk.push(lineNum);
      }
    }

    // Detect operator precedence issues
    if (line.includes('&&') && line.includes('||')) {
      // Mixing && and || without parentheses can be ambiguous
      const hasParens = line.includes('(') && line.includes(')');
      if (!hasParens) {
        issues.push({
          line: lineNum,
          type: 'OPERATOR_PRECEDENCE',
          severity: 'WARNING',
          message:
            'Mixing && and || operators without parentheses. Use explicit grouping to clarify intent.',
        });
        metrics.operatorPrecedenceIssues.push(lineNum);
      }
    }

    // Detect complex nested parentheses
    const nestedParens = line.match(/\([^()]*\([^()]*\)/g);
    if (nestedParens && nestedParens.length > 0) {
      issues.push({
        line: lineNum,
        type: 'NESTED_PARENTHESES',
        severity: 'INFO',
        message:
          'Nested parentheses detected. Consider extracting sub-expressions to named variables for clarity.',
      });
    }

    // Detect magic numbers in calculations
    const magicNumbers = line.match(/\b\d+\b/g);
    if (
      magicNumbers &&
      magicNumbers.length > 2 &&
      !line.includes('const') &&
      !line.includes('readonly')
    ) {
      issues.push({
        line: lineNum,
        type: 'MAGIC_NUMBERS',
        severity: 'INFO',
        message:
          'Multiple magic numbers in expression. Consider extracting to named constants for maintainability.',
      });
    }
  }

  return {
    issues,
    metrics,
    summary: generateMathSummary(metrics, issues),
  };
}

/**
 * Generate summary of math safety analysis
 */
function generateMathSummary(metrics, _issues) {
  const summary = [];

  if (metrics.complexExpressions.length > 0) {
    const maxComplexity = Math.max(...metrics.complexExpressions.map(e => e.complexity));
    summary.push(
      `${metrics.complexExpressions.length} complex math expression(s) found (max complexity: ${maxComplexity})`,
    );
  }

  if (metrics.potentialOverflow.length > 0) {
    summary.push(`${metrics.potentialOverflow.length} potential overflow risk(s) detected`);
  }

  if (metrics.precisionLoss.length > 0) {
    summary.push(`${metrics.precisionLoss.length} precision loss issue(s) detected`);
  }

  if (metrics.divisionByZeroRisk.length > 0) {
    summary.push(`${metrics.divisionByZeroRisk.length} division by zero risk(s) detected`);
  }

  if (metrics.operatorPrecedenceIssues.length > 0) {
    summary.push(
      `${metrics.operatorPrecedenceIssues.length} operator precedence issue(s) detected`,
    );
  }

  return summary.length > 0 ? summary : ['Mathematical expressions are safe'];
}

/**
 * Validate C# math-specific patterns
 */
export function validateCSharpMath(code) {
  const issues = [];
  const lines = code.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lineNum = i + 1;

    // Check for Math.Abs on potentially negative numbers
    if (line.includes('Math.Abs') && !line.includes('Math.Max')) {
      issues.push({
        line: lineNum,
        type: 'MATH_ABS_USAGE',
        severity: 'INFO',
        message: 'Math.Abs detected. Ensure this is the intended behavior for your use case.',
      });
    }

    // Check for floating point equality comparisons
    if (line.includes('==') && (line.includes('double') || line.includes('float'))) {
      issues.push({
        line: lineNum,
        type: 'FLOAT_EQUALITY',
        severity: 'WARNING',
        message:
          'Direct equality comparison of floating point numbers is unreliable. Use Math.Abs(a - b) < epsilon instead.',
      });
    }

    // Check for Math.Round without specifying rounding mode
    if (line.includes('Math.Round(') && !line.includes('MidpointRounding')) {
      issues.push({
        line: lineNum,
        type: 'MATH_ROUND_IMPLICIT',
        severity: 'INFO',
        message:
          'Math.Round without explicit MidpointRounding. Specify rounding mode for predictable behavior.',
      });
    }

    // Check for unchecked arithmetic
    if (line.includes('unchecked') && (line.includes('+') || line.includes('*'))) {
      issues.push({
        line: lineNum,
        type: 'UNCHECKED_ARITHMETIC',
        severity: 'INFO',
        message: 'Unchecked arithmetic block. Ensure overflow behavior is intended.',
      });
    }

    // Check for large calculations without decimal precision
    if (
      (line.includes('double') && line.includes('0.1')) ||
      line.includes('0.2') ||
      line.includes('0.3')
    ) {
      issues.push({
        line: lineNum,
        type: 'FLOATING_POINT_IMPRECISION',
        severity: 'WARNING',
        message:
          'Floating point arithmetic with values that may have precision issues. Consider using decimal for financial calculations.',
      });
    }

    // Detect complex LINQ calculations
    if (line.includes('.Select(') || line.includes('.Where(') || line.includes('.Sum(')) {
      const nextLines = lines.slice(i, i + 5).join('\n');
      if (nextLines.includes('+') || nextLines.includes('*') || nextLines.includes('/')) {
        issues.push({
          line: lineNum,
          type: 'COMPLEX_LINQ_CALCULATION',
          severity: 'WARNING',
          message:
            'Complex calculation within LINQ expression. Consider extracting to separate method for readability and performance.',
        });
      }
    }
  }

  return {
    issues,
    summary:
      issues.length > 0
        ? `${issues.length} C# math-specific issue(s) detected`
        : 'C# math patterns are correct',
  };
}

/**
 * Suggest improvements for complex math expressions
 */
export function suggestMathImprovements(code) {
  const suggestions = [];
  const lines = code.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lineNum = i + 1;

    // Suggest using named variables for complex expressions
    const operators = (line.match(/[+\-*/%^]/g) || []).length;
    if (operators >= 5) {
      suggestions.push({
        line: lineNum,
        type: 'EXTRACT_VARIABLE',
        suggestion:
          'Extract complex sub-expressions to named variables for better readability and debugging.',
      });
    }

    // Suggest using Math.Max/Min instead of ternary
    if (line.includes('?') && line.includes(':') && (line.includes('>') || line.includes('<'))) {
      suggestions.push({
        line: lineNum,
        type: 'USE_MATH_MAX_MIN',
        suggestion:
          'Consider using Math.Max() or Math.Min() instead of ternary operator for clarity.',
      });
    }

    // Suggest using decimal for financial calculations
    if (
      line.includes('double') &&
      (line.includes('$') ||
        line.includes('price') ||
        line.includes('amount') ||
        line.includes('cost'))
    ) {
      suggestions.push({
        line: lineNum,
        type: 'USE_DECIMAL',
        suggestion:
          'Consider using decimal instead of double for financial calculations to avoid floating point precision issues.',
      });
    }

    // Suggest using BigInteger for very large numbers
    if (line.includes('long') && line.includes('1000000000')) {
      suggestions.push({
        line: lineNum,
        type: 'USE_BIGINT',
        suggestion:
          'Consider using BigInteger for very large number calculations to prevent overflow.',
      });
    }
  }

  return suggestions;
}

/**
 * Comprehensive math safety validation
 */
export function validateMathSafety(code) {
  const generalMath = analyzeMathExpression(code);
  const csharpMath = validateCSharpMath(code);
  const improvements = suggestMathImprovements(code);

  const allIssues = [...generalMath.issues, ...csharpMath.issues];

  const criticalIssues = allIssues.filter(
    i => i.severity === 'WARNING' || i.severity === 'CRITICAL',
  );
  const infoIssues = allIssues.filter(i => i.severity === 'INFO');

  return {
    valid: criticalIssues.length === 0,
    issues: allIssues,
    criticalIssues,
    infoIssues,
    suggestions: improvements,
    metrics: generalMath.metrics,
    summary: {
      general: generalMath.summary,
      csharp: csharpMath.summary,
      suggestions: `${improvements.length} improvement suggestion(s) available`,
    },
  };
}
