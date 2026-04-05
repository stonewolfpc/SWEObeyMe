import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

// Diagnostic Rainbow Colors
export const SeverityColors = {
  CRITICAL: 'red', // Red - immediate injection
  WARNING: 'orange', // Orange - medium priority
  INFO: 'cyan', // Cyan - low priority
  ENVIRONMENTAL_DRIFT: 'magenta', // Magenta - architectural instability
  MEMORY_LEAK: 'purple', // Purple - potential resource leak
  TERNARY_STATE: 'silver', // Silver - potential/unstable
};

export const SeverityLevels = {
  CRITICAL: 2,
  WARNING: 1,
  INFO: 0,
  ENVIRONMENTAL_DRIFT: 1,
  MEMORY_LEAK: 2,
  TERNARY_STATE: 0,
};

// Error Rules Definition
export const errorRules = [
  {
    id: 'missing_using',
    name: 'Missing using statements',
    color: SeverityColors.CRITICAL,
    severity: SeverityLevels.CRITICAL,
    pattern: /using\s+([\w.]+);/g,
    check: (content, matches) => {
      // Check if using statements are actually used
      const usingStatements = matches.map(m => m[1]);
      const unusedUsings = [];
      usingStatements.forEach(using => {
        const name = using.split('.').pop();
        if (!content.includes(name) && !content.includes(using)) {
          unusedUsings.push(using);
        }
      });
      return unusedUsings.length > 0 ? unusedUsings : null;
    },
  },
  {
    id: 'empty_catch',
    name: 'Empty catch blocks',
    color: SeverityColors.CRITICAL,
    severity: SeverityLevels.CRITICAL,
    pattern: /catch\s*\([^)]*\)\s*\{\s*\}/g,
    check: (content, matches) => {
      return matches && matches.length > 0 ? matches.length : null;
    },
  },
  {
    id: 'deep_nesting',
    name: 'Deep nesting',
    color: SeverityColors.WARNING,
    severity: SeverityLevels.WARNING,
    pattern: null,
    check: (content) => {
      const lines = content.split('\n');
      let maxNesting = 0;
      lines.forEach(line => {
        const indent = line.search(/\S/);
        if (indent > maxNesting) maxNesting = indent;
      });
      const nestingLevel = Math.floor(maxNesting / 4); // Assuming 4-space indentation
      return nestingLevel > 5 ? nestingLevel : null;
    },
  },
  {
    id: 'unhandled_async',
    name: 'Unhandled async',
    color: SeverityColors.CRITICAL,
    severity: SeverityLevels.CRITICAL,
    pattern: /async\s+\w+\s*\([^)]*\)\s*\{[^}]*\}/g,
    check: (content, matches) => {
      if (!matches) return null;
      const unhandled = [];
      matches.forEach(match => {
        if (!match.includes('await')) {
          unhandled.push(match.substring(0, 50) + '...');
        }
      });
      return unhandled.length > 0 ? unhandled : null;
    },
  },
  {
    id: 'idisposable_not_disposed',
    name: 'IDisposable not disposed',
    color: SeverityColors.MEMORY_LEAK,
    severity: SeverityLevels.MEMORY_LEAK,
    pattern: /new\s+\w+.*\(\)/g,
    check: (content, matches) => {
      if (!matches) return null;
      const potentialLeaks = [];
      matches.forEach(match => {
        const typeName = match.match(/new\s+(\w+)/);
        if (typeName && ['FileStream', 'StreamReader', 'StreamWriter', 'SqlConnection', 'HttpClient'].includes(typeName[1])) {
          // Check if wrapped in using statement
          const beforeMatch = content.substring(0, content.indexOf(match));
          if (!beforeMatch.includes('using')) {
            potentialLeaks.push(typeName[1]);
          }
        }
      });
      return potentialLeaks.length > 0 ? potentialLeaks : null;
    },
  },
  {
    id: 'string_concatenation',
    name: 'String concatenation vs interpolation',
    color: SeverityColors.INFO,
    severity: SeverityLevels.INFO,
    pattern: /\+\s*["']/g,
    check: (content, matches) => {
      return matches && matches.length > 3 ? matches.length : null;
    },
  },
  {
    id: 'null_reference_patterns',
    name: 'Null reference patterns',
    color: SeverityColors.WARNING,
    severity: SeverityLevels.WARNING,
    pattern: /(\w+)\.\w+/g,
    check: (content, matches) => {
      if (!matches) return null;
      // Simple heuristic - check for potential null dereferences
      const nullPatterns = matches.filter(m => m[1] !== 'this' && m[1] !== 'base');
      return nullPatterns.length > 5 ? nullPatterns.length : null;
    },
  },
  {
    id: 'async_suffix',
    name: 'Async method without Async suffix',
    color: SeverityColors.INFO,
    severity: SeverityLevels.INFO,
    pattern: /async\s+\w+\s+([a-zA-Z]+)\s*\(/g,
    check: (content, matches) => {
      if (!matches) return null;
      const violations = matches.filter(m => !m[1].endsWith('Async'));
      return violations.length > 0 ? violations.map(v => v[1]) : null;
    },
  },
  {
    id: 'event_handler_leak',
    name: 'Event handler memory leak',
    color: SeverityColors.ENVIRONMENTAL_DRIFT,
    severity: SeverityLevels.ENVIRONMENTAL_DRIFT,
    pattern: /\.event\s*\+=\s*\w+/g,
    check: (content, matches) => {
      if (!matches) return null;
      const potentialLeaks = matches.filter(match => {
        const after = content.substring(content.indexOf(match) + match.length, content.indexOf(match) + match.length + 200);
        return !after.includes('-=');
      });
      return potentialLeaks.length > 0 ? potentialLeaks.length : null;
    },
  },
  {
    id: 'static_mutation',
    name: 'Static state mutation',
    color: SeverityColors.ENVIRONMENTAL_DRIFT,
    severity: SeverityLevels.ENVIRONMENTAL_DRIFT,
    pattern: /static\s+\w+\s+\w+\s*=/g,
    check: (content, matches) => {
      return matches && matches.length > 5 ? matches.length : null;
    },
  },
  {
    id: 'math_safety',
    name: 'Math safety issues',
    color: SeverityColors.WARNING,
    severity: SeverityLevels.WARNING,
    pattern: /(\/\s*\w+|\*\s*\w+)/g,
    check: (content, matches) => {
      if (!matches) return null;
      const unsafeOps = matches.filter(match => {
        // Check for division by zero risk
        if (match.includes('/') && !match.includes('?')) {
          return true;
        }
        // Check for unchecked multiplication overflow risk
        if (match.includes('*') && match.match(/\d{4,}/)) {
          return true;
        }
        return false;
      });
      return unsafeOps.length > 0 ? unsafeOps.length : null;
    },
  },
];

// Cache for analysis results
const analysisCache = new Map();

// Deduplication cache
const deduplicationCache = new Map();

// Cooldown cache
const cooldownCache = new Map();

/**
 * Calculate confidence score for a finding (0-100)
 * @param {Object} rule - Error rule
 * @param {*} result - Check result
 * @param {string} content - File content
 * @returns {number} Confidence score
 */
function calculateConfidence(rule, result, content) {
  let score = 50; // Base score

  // Pattern match strength (40% weight)
  if (rule.pattern && result) {
    score += 30;
  } else if (!rule.pattern && result) {
    score += 20;
  }

  // Context analysis (30% weight)
  if (result && typeof result === 'object' && result.length > 0) {
    score += 20;
    if (result.length > 3) {
      score += 10;
    }
  }

  // Code complexity factor (15% weight)
  const lineCount = content.split('\n').length;
  if (lineCount < 100) {
    score += 15;
  } else if (lineCount < 500) {
    score += 10;
  } else {
    score += 5;
  }

  // Severity boost (15% weight)
  if (rule.severity === SeverityLevels.CRITICAL) {
    score += 15;
  } else if (rule.severity === SeverityLevels.WARNING) {
    score += 10;
  }

  return Math.min(100, score);
}

/**
 * Generate signature for deduplication
 * @param {string} ruleId - Rule ID
 * @param {string} filePath - File path
 * @param {number} line - Line number
 * @returns {string} Signature hash
 */
function generateSignature(ruleId, filePath, line) {
  const data = `${ruleId}:${filePath}:${line}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Check if alert is in cooldown
 * @param {string} signature - Alert signature
 * @param {number} cooldownSeconds - Cooldown period in seconds
 * @returns {boolean} True if in cooldown
 */
function isInCooldown(signature, cooldownSeconds) {
  const cached = cooldownCache.get(signature);
  if (!cached) return false;

  const elapsed = (Date.now() - cached.timestamp) / 1000;
  return elapsed < cooldownSeconds;
}

/**
 * Update cooldown cache
 * @param {string} signature - Alert signature
 */
function updateCooldown(signature) {
  cooldownCache.set(signature, {
    timestamp: Date.now(),
    count: (cooldownCache.get(signature)?.count || 0) + 1,
  });
}

/**
 * Check for duplicate alerts
 * @param {string} signature - Alert signature
 * @returns {boolean} True if duplicate
 */
function isDuplicate(signature) {
  return deduplicationCache.has(signature);
}

/**
 * Update deduplication cache
 * @param {string} signature - Alert signature
 */
function updateDeduplicationCache(signature) {
  deduplicationCache.set(signature, Date.now());
}

/**
 * Clear caches
 */
export function clearCaches() {
  analysisCache.clear();
  deduplicationCache.clear();
  cooldownCache.clear();
}

/**
 * Analyze C# file for errors using pattern matching
 * @param {string} filePath - Path to the C# file
 * @param {Object} config - Configuration options
 * @returns {Promise<Object>} Analysis results
 */
export async function analyzeCSharpFile(filePath, config = {}) {
  const {
    severityThreshold = 0,
    enabledRules = errorRules.map(r => r.id),
    confidenceThreshold = 70,
    deduplicateAlerts = true,
    alertCooldown = 30,
    detectors = {},
  } = config;

  // Check cache
  const cacheKey = `${filePath}:${JSON.stringify(config)}`;
  if (analysisCache.has(cacheKey)) {
    return analysisCache.get(cacheKey);
  }

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const errors = [];

    for (const rule of errorRules) {
      // Skip if detector is disabled
      if (detectors[rule.id] === false) continue;
      
      // Skip if rule not in enabled rules
      if (!enabledRules.includes(rule.id)) continue;
      
      // Skip if severity below threshold
      if (rule.severity < severityThreshold) continue;

      const matches = rule.pattern ? content.match(rule.pattern) : null;
      const result = rule.check(content, matches);

      if (result) {
        // Calculate confidence score
        const confidence = calculateConfidence(rule, result, content);
        
        // Filter by confidence threshold
        if (confidence < confidenceThreshold) continue;

        // Generate line ranges
        const lineRanges = findLineRanges(content, rule.pattern, result);

        // Process each finding
        lineRanges.forEach(range => {
          const signature = generateSignature(rule.id, filePath, range.startLine);
          
          // Check deduplication
          if (deduplicateAlerts && isDuplicate(signature)) return;
          
          // Check cooldown
          if (alertCooldown > 0 && isInCooldown(signature, alertCooldown)) return;
          
          // Update caches
          if (deduplicateAlerts) updateDeduplicationCache(signature);
          if (alertCooldown > 0) updateCooldown(signature);

          errors.push({
            id: rule.id,
            name: rule.name,
            color: rule.color,
            severity: rule.severity,
            confidence,
            details: result,
            lineRanges: [range],
            signature,
          });
        });
      }
    }

    const analysisResult = {
      filePath,
      errors,
      errorCount: errors.length,
      timestamp: Date.now(),
    };

    // Cache result
    analysisCache.set(cacheKey, analysisResult);

    return analysisResult;
  } catch (error) {
    console.error(`[C# Bridge] Error analyzing ${filePath}:`, error);
    return {
      filePath,
      errors: [],
      errorCount: 0,
      timestamp: Date.now(),
      error: error.message,
    };
  }
}

/**
 * Find line ranges for errors (Edit, Don't Replace rule)
 * @param {string} content - File content
 * @param {RegExp} pattern - Error pattern
 * @param {*} result - Check result
 * @returns {Array} Array of line ranges
 */
function findLineRanges(content, pattern, result) {
  const ranges = [];
  const lines = content.split('\n');

  if (pattern) {
    let match;
    const regex = new RegExp(pattern.source, pattern.flags);
    let lastIndex = 0;

    while ((match = regex.exec(content)) !== null) {
      const beforeMatch = content.substring(0, match.index);
      const startLine = beforeMatch.split('\n').length - 1;
      const afterMatch = content.substring(match.index + match[0].length);
      const endLine = startLine + match[0].split('\n').length - 1;

      ranges.push({
        startLine,
        endLine,
        text: match[0].substring(0, 100),
      });

      lastIndex = regex.lastIndex;
    }
  }

  return ranges;
}

/**
 * Clear analysis cache
 */
export function clearAnalysisCache() {
  analysisCache.clear();
}

/**
 * Get integrity report for errors in context of high-value rules
 * @param {string} filePath - Path to the C# file
 * @returns {Promise<Object>} Integrity report
 */
export async function getIntegrityReport(filePath) {
  const analysis = await analyzeCSharpFile(filePath);

  const criticalErrors = analysis.errors.filter(e => e.severity === SeverityLevels.CRITICAL);
  const warningErrors = analysis.errors.filter(e => e.severity === SeverityLevels.WARNING);
  const driftErrors = analysis.errors.filter(e => e.severity === SeverityLevels.ENVIRONMENTAL_DRIFT);

  return {
    filePath,
    totalErrors: analysis.errorCount,
    criticalCount: criticalErrors.length,
    warningCount: warningErrors.length,
    driftCount: driftErrors.length,
    integrityScore: Math.max(0, 100 - (criticalErrors.length * 10) - (warningErrors.length * 5) - (driftErrors.length * 7)),
    errorsByRule: analysis.errors.reduce((acc, err) => {
      acc[err.id] = (acc[err.id] || 0) + 1;
      return acc;
    }, {}),
    context: {
      highValueRulesViolated: criticalErrors.map(e => e.id),
      architecturalDrift: driftErrors.map(e => e.id),
      recommendations: generateRecommendations(analysis.errors),
    },
  };
}

/**
 * Generate recommendations based on errors
 * @param {Array} errors - Error array
 * @returns {Array} Recommendations
 */
function generateRecommendations(errors) {
  const recommendations = [];

  if (errors.some(e => e.id === 'empty_catch')) {
    recommendations.push('Review empty catch blocks - add logging or rethrow');
  }

  if (errors.some(e => e.id === 'deep_nesting')) {
    recommendations.push('Reduce nesting depth - extract methods or use early return');
  }

  if (errors.some(e => e.id === 'idisposable_not_disposed')) {
    recommendations.push('Wrap IDisposable objects in using statements');
  }

  if (errors.some(e => e.id === 'event_handler_leak')) {
    recommendations.push('Ensure event handlers are unsubscribed to prevent memory leaks');
  }

  return recommendations;
}
