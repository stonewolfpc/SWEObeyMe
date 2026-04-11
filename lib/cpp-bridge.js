/**
 * C++ Bridge - Pattern-based error detection for C/C++
 * 
 * This module provides custom error detection for C++ files
 * that works ON TOP OF Windsurf's default C++ language server.
 * It does NOT replace or override - it ADDS additional diagnostics.
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Diagnostic severity colors matching C# Bridge
export const SeverityColors = {
  CRITICAL: 'red',
  WARNING: 'orange',
  INFO: 'cyan',
  ENVIRONMENTAL_DRIFT: 'magenta',
  MEMORY_LEAK: 'purple',
  TERNARY_STATE: 'silver',
};

export const SeverityLevels = {
  CRITICAL: 2,
  WARNING: 1,
  INFO: 0,
  ENVIRONMENTAL_DRIFT: 1,
  MEMORY_LEAK: 2,
  TERNARY_STATE: 0,
};

// C++ Error Rules - Pattern based detection
export const errorRules = [
  {
    id: 'memory_leak_raw_new',
    name: 'Potential memory leak - raw new without delete',
    color: SeverityColors.MEMORY_LEAK,
    severity: SeverityLevels.MEMORY_LEAK,
    pattern: /new\s+\w+[^[]]*\([^)]*\)(?!\s*->|\s*\.|\s*\[)/g,
    check: (content, matches) => {
      if (!matches) return null;
      const leaks = [];
      matches.forEach(match => {
        // Check if there's a corresponding delete
        const typeName = match.match(/new\s+(\w+)/)?.[1] || 'unknown';
        // Simple heuristic: if no delete found within 100 chars after
        const afterMatch = content.substring(content.indexOf(match) + match.length, content.indexOf(match) + match.length + 500);
        if (!afterMatch.includes('delete') && !afterMatch.includes('unique_ptr') && !afterMatch.includes('shared_ptr')) {
          leaks.push({ match: match.substring(0, 50), type: typeName });
        }
      });
      return leaks.length > 0 ? leaks : null;
    },
  },
  {
    id: 'missing_virtual_destructor',
    name: 'Class with virtual methods lacks virtual destructor',
    color: SeverityColors.WARNING,
    severity: SeverityLevels.WARNING,
    pattern: /class\s+(\w+)[^{]*\{[^}]*virtual\s+\w+/gs,
    check: (content, matches) => {
      if (!matches) return null;
      const violations = [];
      matches.forEach(match => {
        const className = match.match(/class\s+(\w+)/)?.[1];
        // Check if virtual destructor exists
        if (!match.includes('virtual ~') && !match.includes('virtual ~' + className)) {
          violations.push(className);
        }
      });
      return violations.length > 0 ? violations : null;
    },
  },
  {
    id: 'raw_array_new',
    name: 'Raw array allocation with new[] - use std::vector instead',
    color: SeverityColors.WARNING,
    severity: SeverityLevels.WARNING,
    pattern: /new\s+\w+\s*\[[^\]]+\]/g,
    check: (content, matches) => {
      if (!matches) return null;
      return matches.length > 0 ? matches.map(m => m.substring(0, 30)) : null;
    },
  },
  {
    id: 'missing_null_check',
    name: 'Pointer dereference without null check',
    color: SeverityColors.CRITICAL,
    severity: SeverityLevels.CRITICAL,
    pattern: /(\w+)\s*->\s*\w+/g,
    check: (content, matches) => {
      if (!matches) return null;
      const unsafe = [];
      matches.forEach(match => {
        const ptrName = match.match(/(\w+)\s*->/)?.[1];
        // Check if preceded by null check
        const beforeMatch = content.substring(Math.max(0, content.indexOf(match) - 200), content.indexOf(match));
        const hasNullCheck = beforeMatch.includes(`${ptrName} != nullptr`) || 
                            beforeMatch.includes(`${ptrName} != NULL`) ||
                            beforeMatch.includes(`if (${ptrName})`) ||
                            beforeMatch.includes(`if(${ptrName})`);
        if (!hasNullCheck && ptrName !== 'this' && ptrName !== 'self') {
          unsafe.push({ pointer: ptrName, context: match.substring(0, 40) });
        }
      });
      return unsafe.length > 0 ? unsafe : null;
    },
  },
  {
    id: 'unused_include',
    name: 'Potentially unused include directive',
    color: SeverityColors.INFO,
    severity: SeverityLevels.INFO,
    pattern: /#include\s+[<"]([^>"]+)[>"]/g,
    check: (content, matches) => {
      if (!matches) return null;
      // This is a heuristic - full analysis requires parsing
      // For now, flag system headers that might be unused
      const systemHeaders = ['iostream', 'stdio.h', 'stdlib.h', 'string.h'];
      const unused = [];
      matches.forEach(match => {
        const header = match.match(/#include\s+[<"]([^>"]+)[>"]/)?.[1];
        if (systemHeaders.includes(header)) {
          // Check if common functions from this header are used
          if (header === 'iostream' && !content.match(/std::(cout|cin|cerr|endl)/)) {
            unused.push(header);
          }
        }
      });
      return unused.length > 0 ? unused : null;
    },
  },
  {
    id: 'naked_delete',
    name: 'Naked delete - ensure proper RAII or smart pointers',
    color: SeverityColors.WARNING,
    severity: SeverityLevels.WARNING,
    pattern: /delete\s+(\w+);/g,
    check: (content, matches) => {
      if (!matches) return null;
      return matches.length > 3 ? matches.map(m => m.substring(0, 25)) : null;
    },
  },
  {
    id: 'exception_safety',
    name: 'Function may lack exception safety (raw pointer manipulation)',
    color: SeverityColors.ENVIRONMENTAL_DRIFT,
    severity: SeverityLevels.ENVIRONMENTAL_DRIFT,
    pattern: /void\s+(\w+)\s*\([^)]*\)\s*\{[^}]*new\s+[^}]*}/gs,
    check: (content, matches) => {
      if (!matches) return null;
      const unsafe = [];
      matches.forEach(match => {
        // Check if there's try-catch
        if (!match.includes('try') && !match.includes('catch')) {
          const funcName = match.match(/void\s+(\w+)/)?.[1];
          unsafe.push(funcName);
        }
      });
      return unsafe.length > 0 ? unsafe : null;
    },
  },
  {
    id: 'buffer_overflow_risk',
    name: 'Potential buffer overflow - unsafe string/buffer operation',
    color: SeverityColors.CRITICAL,
    severity: SeverityLevels.CRITICAL,
    pattern: /(strcpy|strcat|sprintf|gets)\s*\(/g,
    check: (content, matches) => {
      if (!matches) return null;
      const unsafe = [];
      matches.forEach(match => {
        const func = match.match(/(strcpy|strcat|sprintf|gets)/)?.[1];
        unsafe.push(func);
      });
      return unsafe.length > 0 ? unsafe : null;
    },
  },
  {
    id: 'magic_number',
    name: 'Magic number detected - consider named constant',
    color: SeverityColors.INFO,
    severity: SeverityLevels.INFO,
    pattern: /[^\w](\d{3,})[^\w]/g,
    check: (content, matches) => {
      if (!matches) return null;
      // Filter out common non-magic numbers
      const common = [0, 1, 2, 100, 256, 1024, 4096, 1000, 10000];
      const magic = matches.filter(m => {
        const num = parseInt(m.match(/\d+/)?.[0]);
        return !common.includes(num);
      });
      return magic.length > 5 ? magic.slice(0, 5).map(m => m.trim()) : null;
    },
  },
  {
    id: 'deep_nesting',
    name: 'Deep nesting - consider refactoring',
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
      const nestingLevel = Math.floor(maxNesting / 2); // 2-space indentation typical for C++
      return nestingLevel > 6 ? nestingLevel : null;
    },
  },
  {
    id: 'global_variable',
    name: 'Global variable - consider encapsulation',
    color: SeverityColors.WARNING,
    severity: SeverityLevels.WARNING,
    pattern: /^(?!\s*(?:#|\/\/|\/\*|\*|class|struct|namespace|enum|typedef|using))\s*(?:const\s+)?\w+\s+\w+\s*=/gm,
    check: (content, matches) => {
      if (!matches) return null;
      // Filter out function declarations and local variables
      const globals = matches.filter(m => {
        // Simple heuristic: check if it's at file scope (not inside braces)
        const before = content.substring(0, content.indexOf(m));
        const openBraces = (before.match(/{/g) || []).length;
        const closeBraces = (before.match(/}/g) || []).length;
        return openBraces === closeBraces; // At file scope
      });
      return globals.length > 3 ? globals.slice(0, 5).map(m => m.substring(0, 40)) : null;
    },
  },
  {
    id: 'implicit_conversion',
    name: 'Potential implicit type conversion',
    color: SeverityColors.INFO,
    severity: SeverityLevels.INFO,
    pattern: /(\w+)\s*=\s*(\w+)\s*;/g,
    check: (content, matches) => {
      if (!matches) return null;
      const suspicious = [];
      matches.forEach(match => {
        // Check for double-to-int, int-to-pointer, etc.
        if (match.includes('double') || match.includes('float')) {
          if (!match.includes('static_cast') && !match.includes('dynamic_cast')) {
            suspicious.push(match.substring(0, 50));
          }
        }
      });
      return suspicious.length > 0 ? suspicious.slice(0, 3) : null;
    },
  },
];

// Cache for analysis results
const analysisCache = new Map();
const deduplicationCache = new Map();
const cooldownCache = new Map();

/**
 * Calculate confidence score for a finding (0-100)
 */
function calculateConfidence(rule, result, content) {
  let score = 50; // Base score

  if (rule.pattern && result) {
    score += 30;
  } else if (!rule.pattern && result) {
    score += 20;
  }

  if (result && typeof result === 'object' && result.length > 0) {
    score += 20;
    if (result.length > 3) {
      score += 10;
    }
  }

  const lineCount = content.split('\n').length;
  if (lineCount < 100) {
    score += 15;
  } else if (lineCount < 500) {
    score += 10;
  } else {
    score += 5;
  }

  if (rule.severity === SeverityLevels.CRITICAL) {
    score += 15;
  } else if (rule.severity === SeverityLevels.WARNING) {
    score += 10;
  }

  return Math.min(100, score);
}

/**
 * Generate signature for deduplication
 */
function generateSignature(ruleId, filePath, line) {
  const data = `${ruleId}:${filePath}:${line}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Check if alert is in cooldown
 */
function isInCooldown(signature, cooldownSeconds) {
  const cached = cooldownCache.get(signature);
  if (!cached) return false;
  const elapsed = (Date.now() - cached.timestamp) / 1000;
  return elapsed < cooldownSeconds;
}

/**
 * Update cooldown cache
 */
function updateCooldown(signature) {
  cooldownCache.set(signature, {
    timestamp: Date.now(),
    count: (cooldownCache.get(signature)?.count || 0) + 1,
  });
}

/**
 * Check for duplicate alerts
 */
function isDuplicate(signature) {
  return deduplicationCache.has(signature);
}

/**
 * Update deduplication cache
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
 * Check if external tool is available
 */
async function isToolAvailable(tool) {
  try {
    await execAsync(`${tool} --version`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Run clang-tidy on file (fallback to pattern matching if unavailable)
 */
async function runClangTidy(filePath, config) {
  if (!config.useClangTidy) return null;
  
  const available = await isToolAvailable('clang-tidy');
  if (!available) {
    // [REMOVED BY SWEObeyMe]: Forbidden Pattern('[C++ Bridge] clang-tidy not available, using pattern matching');
    return null;
  }

  try {
    const { stdout } = await execAsync(`clang-tidy "${filePath}" --quiet`, {
      timeout: 30000, // 30 second timeout
    });
    
    // Parse clang-tidy output
    const errors = [];
    const lines = stdout.split('\n');
    for (const line of lines) {
      const match = line.match(/(.+):(\d+):(\d+):\s+(error|warning):\s+(.+)/);
      if (match) {
        errors.push({
          file: match[1],
          line: parseInt(match[2]),
          column: parseInt(match[3]),
          severity: match[4] === 'error' ? SeverityLevels.CRITICAL : SeverityLevels.WARNING,
          message: match[5],
          source: 'clang-tidy',
        });
      }
    }
    return errors;
  } catch (error) {
    // [REMOVED BY SWEObeyMe]: Forbidden Pattern('[C++ Bridge] clang-tidy execution failed:', error.message);
    return null;
  }
}

/**
 * Run cppcheck on file (fallback to pattern matching if unavailable)
 */
async function runCppcheck(filePath, config) {
  if (!config.useCppcheck) return null;
  
  const available = await isToolAvailable('cppcheck');
  if (!available) {
    // [REMOVED BY SWEObeyMe]: Forbidden Pattern('[C++ Bridge] cppcheck not available, using pattern matching');
    return null;
  }

  try {
    const { stdout } = await execAsync(`cppcheck --enable=all --template=gcc "${filePath}" 2>&1`, {
      timeout: 30000,
    });
    
    // Parse cppcheck output
    const errors = [];
    const lines = stdout.split('\n');
    for (const line of lines) {
      const match = line.match(/(.+):(\d+):\s+(style|performance|portability|warning|error):\s+(.+)/);
      if (match) {
        const severityMap = {
          'error': SeverityLevels.CRITICAL,
          'warning': SeverityLevels.WARNING,
          'performance': SeverityLevels.WARNING,
          'portability': SeverityLevels.INFO,
          'style': SeverityLevels.INFO,
        };
        errors.push({
          file: match[1],
          line: parseInt(match[2]),
          severity: severityMap[match[3]] || SeverityLevels.INFO,
          message: match[4],
          source: 'cppcheck',
        });
      }
    }
    return errors;
  } catch (error) {
    // [REMOVED BY SWEObeyMe]: Forbidden Pattern('[C++ Bridge] cppcheck execution failed:', error.message);
    return null;
  }
}

/**
 * Find line ranges for errors
 */
function findLineRanges(content, pattern, result) {
  const ranges = [];
  
  if (pattern) {
    let match;
    const regex = new RegExp(pattern.source, pattern.flags);
    
    while ((match = regex.exec(content)) !== null) {
      const beforeMatch = content.substring(0, match.index);
      const startLine = beforeMatch.split('\n').length;
      const afterMatch = content.substring(match.index + match[0].length);
      const endLine = startLine + match[0].split('\n').length - 1;
      
      ranges.push({
        startLine,
        endLine,
        text: match[0].substring(0, 100),
      });
    }
  }
  
  return ranges;
}

/**
 * Analyze C++ file for errors
 * Uses pattern matching + optional clang-tidy/cppcheck
 * Falls back to pattern matching if external tools unavailable
 */
export async function analyzeCppFile(filePath, config = {}) {
  const {
    severityThreshold = 0,
    enabledRules = errorRules.map(r => r.id),
    confidenceThreshold = 70,
    deduplicateAlerts = true,
    alertCooldown = 30,
    detectors = {},
    useClangTidy = false,
    useCppcheck = false,
  } = config;

  // Check cache
  const cacheKey = `${filePath}:${JSON.stringify(config)}`;
  if (analysisCache.has(cacheKey)) {
    return analysisCache.get(cacheKey);
  }

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const allErrors = [];

    // Try external tools first (if enabled)
    if (useClangTidy) {
      const clangErrors = await runClangTidy(filePath, config);
      if (clangErrors) {
        allErrors.push(...clangErrors.map(e => ({
          id: 'clang-tidy',
          name: 'clang-tidy',
          color: e.severity === SeverityLevels.CRITICAL ? SeverityColors.CRITICAL : SeverityColors.WARNING,
          severity: e.severity,
          confidence: 95,
          details: e.message,
          lineRanges: [{ startLine: e.line, endLine: e.line, text: '' }],
          signature: generateSignature('clang-tidy', filePath, e.line),
          source: 'clang-tidy',
        })));
      }
    }

    if (useCppcheck) {
      const cppcheckErrors = await runCppcheck(filePath, config);
      if (cppcheckErrors) {
        allErrors.push(...cppcheckErrors.map(e => ({
          id: 'cppcheck',
          name: 'cppcheck',
          color: e.severity === SeverityLevels.CRITICAL ? SeverityColors.CRITICAL : SeverityColors.WARNING,
          severity: e.severity,
          confidence: 90,
          details: e.message,
          lineRanges: [{ startLine: e.line, endLine: e.line, text: '' }],
          signature: generateSignature('cppcheck', filePath, e.line),
          source: 'cppcheck',
        })));
      }
    }

    // Always run pattern-based analysis (fallback + additional checks)
    for (const rule of errorRules) {
      if (detectors[rule.id] === false) continue;
      if (!enabledRules.includes(rule.id)) continue;
      if (rule.severity < severityThreshold) continue;

      const matches = rule.pattern ? content.match(rule.pattern) : null;
      const result = rule.check(content, matches);

      if (result) {
        const confidence = calculateConfidence(rule, result, content);
        if (confidence < confidenceThreshold) continue;

        const lineRanges = findLineRanges(content, rule.pattern, result);

        lineRanges.forEach(range => {
          const signature = generateSignature(rule.id, filePath, range.startLine);

          if (deduplicateAlerts && isDuplicate(signature)) return;
          if (alertCooldown > 0 && isInCooldown(signature, alertCooldown)) return;

          if (deduplicateAlerts) updateDeduplicationCache(signature);
          if (alertCooldown > 0) updateCooldown(signature);

          allErrors.push({
            id: rule.id,
            name: rule.name,
            color: rule.color,
            severity: rule.severity,
            confidence,
            details: result,
            lineRanges: [range],
            signature,
            source: 'C++ Bridge (pattern)',
          });
        });
      }
    }

    const analysisResult = {
      filePath,
      errors: allErrors,
      errorCount: allErrors.length,
      timestamp: Date.now(),
      usedTools: {
        patternMatching: true,
        clangTidy: useClangTidy && await isToolAvailable('clang-tidy'),
        cppcheck: useCppcheck && await isToolAvailable('cppcheck'),
      },
    };

    // Cache result
    analysisCache.set(cacheKey, analysisResult);

    return analysisResult;
  } catch (error) {
    console.error(`[C++ Bridge] Error analyzing ${filePath}:`, error);
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
 * Clear analysis cache
 */
export function clearAnalysisCache() {
  analysisCache.clear();
}

/**
 * Get integrity report for errors
 */
export async function getIntegrityReport(filePath) {
  const analysis = await analyzeCppFile(filePath);

  const criticalErrors = analysis.errors.filter(e => e.severity === SeverityLevels.CRITICAL);
  const warningErrors = analysis.errors.filter(e => e.severity === SeverityLevels.WARNING);
  const infoErrors = analysis.errors.filter(e => e.severity === SeverityLevels.INFO);

  return {
    filePath,
    totalErrors: analysis.errorCount,
    criticalCount: criticalErrors.length,
    warningCount: warningErrors.length,
    infoCount: infoErrors.length,
    integrityScore: Math.max(0, 100 - (criticalErrors.length * 10) - (warningErrors.length * 5) - (infoErrors.length * 2)),
    errorsByRule: analysis.errors.reduce((acc, err) => {
      acc[err.id] = (acc[err.id] || 0) + 1;
      return acc;
    }, {}),
    toolsUsed: analysis.usedTools,
    context: {
      highValueRulesViolated: criticalErrors.map(e => e.id),
      recommendations: generateRecommendations(analysis.errors),
    },
  };
}

/**
 * Generate recommendations based on errors
 */
function generateRecommendations(errors) {
  const recommendations = [];

  if (errors.some(e => e.id === 'memory_leak_raw_new')) {
    recommendations.push('Consider using std::unique_ptr or std::shared_ptr for automatic memory management');
  }

  if (errors.some(e => e.id === 'missing_virtual_destructor')) {
    recommendations.push('Add virtual destructor to base classes with virtual methods');
  }

  if (errors.some(e => e.id === 'buffer_overflow_risk')) {
    recommendations.push('Replace unsafe string functions with safer alternatives (strncpy, strncat, snprintf)');
  }

  if (errors.some(e => e.id === 'raw_array_new')) {
    recommendations.push('Use std::vector instead of raw arrays for safer memory management');
  }

  return recommendations;
}

export default {
  analyzeCppFile,
  getIntegrityReport,
  clearCaches,
  clearAnalysisCache,
  errorRules,
  SeverityColors,
  SeverityLevels,
};
