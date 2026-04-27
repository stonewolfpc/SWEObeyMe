/**
 * C++ Bridge - Pattern-based error detection for C/C++
 *
 * Orchestrator only. Rule definitions live in cpp-error-rules.js.
 */

import fs from 'fs/promises';
import crypto from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';
import { SeverityColors, SeverityLevels, errorRules } from './cpp-error-rules.js';

const execAsync = promisify(exec);

export { SeverityColors, SeverityLevels, errorRules };

const analysisCache = new Map();
const deduplicationCache = new Map();
const cooldownCache = new Map();

function calculateConfidence(rule, result, content) {
  let score = 50;
  if (rule.pattern && result) score += 30;
  else if (!rule.pattern && result) score += 20;
  if (result && typeof result === 'object' && result.length > 0) {
    score += 20;
    if (result.length > 3) score += 10;
  }
  const lineCount = content.split('\n').length;
  if (lineCount < 100) score += 15;
  else if (lineCount < 500) score += 10;
  else score += 5;
  if (rule.severity === SeverityLevels.CRITICAL) score += 15;
  else if (rule.severity === SeverityLevels.WARNING) score += 10;
  return Math.min(100, score);
}

function generateSignature(ruleId, filePath, line) {
  const data = `${ruleId}:${filePath}:${line}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

function isInCooldown(signature, cooldownSeconds) {
  const cached = cooldownCache.get(signature);
  if (!cached) return false;
  return (Date.now() - cached.timestamp) / 1000 < cooldownSeconds;
}

function updateCooldown(signature) {
  cooldownCache.set(signature, { timestamp: Date.now(), count: (cooldownCache.get(signature)?.count || 0) + 1 });
}

function isDuplicate(signature) {
  return deduplicationCache.has(signature);
}

function updateDeduplicationCache(signature) {
  deduplicationCache.set(signature, Date.now());
}

export function clearCaches() {
  analysisCache.clear();
  deduplicationCache.clear();
  cooldownCache.clear();
}

async function isToolAvailable(tool) {
  try { await execAsync(`${tool} --version`); return true; } catch { return false; }
}

async function runClangTidy(filePath, config) {
  if (!config.useClangTidy) return null;
  if (!await isToolAvailable('clang-tidy')) return null;
  try {
    const { stdout } = await execAsync(`clang-tidy "${filePath}" --quiet`, { timeout: 30000 });
    const errors = [];
    for (const line of stdout.split('\n')) {
      const match = line.match(/(.+):(\d+):(\d+):\s+(error|warning):\s+(.+)/);
      if (match) errors.push({ file: match[1], line: parseInt(match[2]), column: parseInt(match[3]), severity: match[4] === 'error' ? SeverityLevels.CRITICAL : SeverityLevels.WARNING, message: match[5], source: 'clang-tidy' });
    }
    return errors;
  } catch { return null; }
}

async function runCppcheck(filePath, config) {
  if (!config.useCppcheck) return null;
  if (!await isToolAvailable('cppcheck')) return null;
  try {
    const { stdout } = await execAsync(`cppcheck --enable=all --template=gcc "${filePath}" 2>&1`, { timeout: 30000 });
    const severityMap = { error: SeverityLevels.CRITICAL, warning: SeverityLevels.WARNING, performance: SeverityLevels.WARNING, portability: SeverityLevels.INFO, style: SeverityLevels.INFO };
    const errors = [];
    for (const line of stdout.split('\n')) {
      const match = line.match(/(.+):(\d+):\s+(style|performance|portability|warning|error):\s+(.+)/);
      if (match) errors.push({ file: match[1], line: parseInt(match[2]), severity: severityMap[match[3]] || SeverityLevels.INFO, message: match[4], source: 'cppcheck' });
    }
    return errors;
  } catch { return null; }
}

function findLineRanges(content, pattern) {
  const ranges = [];
  if (!pattern) return ranges;
  let match;
  const regex = new RegExp(pattern.source, pattern.flags);
  while ((match = regex.exec(content)) !== null) {
    const beforeMatch = content.substring(0, match.index);
    const startLine = beforeMatch.split('\n').length;
    const endLine = startLine + match[0].split('\n').length - 1;
    ranges.push({ startLine, endLine, text: match[0].substring(0, 100) });
  }
  return ranges;
}

export async function analyzeCppFile(filePath, config = {}) {
  const {
    severityThreshold = 0,
    enabledRules = ['buffer_overflow_risk', 'memory_leak_raw_new', 'missing_virtual_destructor', 'missing_null_check', 'exception_safety', 'deep_nesting'],
    confidenceThreshold = 60,
    deduplicateAlerts = true,
    alertCooldown = 30,
    detectors = {},
    useClangTidy = false,
    useCppcheck = false,
  } = config;

  const cacheKey = `${filePath}:${JSON.stringify(config)}`;
  if (analysisCache.has(cacheKey)) return analysisCache.get(cacheKey);

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const allErrors = [];

    if (useClangTidy) {
      const clangErrors = await runClangTidy(filePath, config);
      if (clangErrors) {
        allErrors.push(...clangErrors.map((e) => ({ id: 'clang-tidy', name: 'clang-tidy', color: e.severity === SeverityLevels.CRITICAL ? SeverityColors.CRITICAL : SeverityColors.WARNING, severity: e.severity, confidence: 95, details: e.message, lineRanges: [{ startLine: e.line, endLine: e.line, text: '' }], signature: generateSignature('clang-tidy', filePath, e.line), source: 'clang-tidy' })));
      }
    }

    if (useCppcheck) {
      const cppcheckErrors = await runCppcheck(filePath, config);
      if (cppcheckErrors) {
        allErrors.push(...cppcheckErrors.map((e) => ({ id: 'cppcheck', name: 'cppcheck', color: e.severity === SeverityLevels.CRITICAL ? SeverityColors.CRITICAL : SeverityColors.WARNING, severity: e.severity, confidence: 90, details: e.message, lineRanges: [{ startLine: e.line, endLine: e.line, text: '' }], signature: generateSignature('cppcheck', filePath, e.line), source: 'cppcheck' })));
      }
    }

    for (const rule of errorRules) {
      if (detectors[rule.id] === false) continue;
      if (!enabledRules.includes(rule.id)) continue;
      if (rule.severity < severityThreshold) continue;
      const matches = rule.pattern ? content.match(rule.pattern) : null;
      const result = rule.check(content, matches);
      if (!result) continue;
      const confidence = calculateConfidence(rule, result, content);
      if (confidence < confidenceThreshold) continue;
      const lineRanges = findLineRanges(content, rule.pattern);
      lineRanges.forEach((range) => {
        const signature = generateSignature(rule.id, filePath, range.startLine);
        if (deduplicateAlerts && isDuplicate(signature)) return;
        if (alertCooldown > 0 && isInCooldown(signature, alertCooldown)) return;
        if (deduplicateAlerts) updateDeduplicationCache(signature);
        if (alertCooldown > 0) updateCooldown(signature);
        const rangeDetail = range.text ? range.text.trim() : Array.isArray(result) ? result[0] : result;
        allErrors.push({ id: rule.id, name: rule.name, color: rule.color, severity: rule.severity, confidence, details: rangeDetail, lineRanges: [range], signature, source: 'C++ Bridge (pattern)' });
      });
    }

    const analysisResult = { filePath, errors: allErrors, errorCount: allErrors.length, timestamp: Date.now(), usedTools: { patternMatching: true, clangTidy: useClangTidy && (await isToolAvailable('clang-tidy')), cppcheck: useCppcheck && (await isToolAvailable('cppcheck')) } };
    analysisCache.set(cacheKey, analysisResult);
    return analysisResult;
  } catch (error) {
    console.error(`[C++ Bridge] Error analyzing ${filePath}:`, error);
    return { filePath, errors: [], errorCount: 0, timestamp: Date.now(), error: error.message };
  }
}

export function clearAnalysisCache() {
  analysisCache.clear();
}

function generateRecommendations(errors) {
  const recommendations = [];
  if (errors.some((e) => e.id === 'memory_leak_raw_new')) recommendations.push('Consider using std::unique_ptr or std::shared_ptr for automatic memory management');
  if (errors.some((e) => e.id === 'missing_virtual_destructor')) recommendations.push('Add virtual destructor to base classes with virtual methods');
  if (errors.some((e) => e.id === 'buffer_overflow_risk')) recommendations.push('Replace unsafe string functions with safer alternatives (strncpy, strncat, snprintf)');
  if (errors.some((e) => e.id === 'raw_array_new')) recommendations.push('Use std::vector instead of raw arrays for safer memory management');
  return recommendations;
}

export async function getIntegrityReport(filePath) {
  const analysis = await analyzeCppFile(filePath);
  const criticalErrors = analysis.errors.filter((e) => e.severity === SeverityLevels.CRITICAL);
  const warningErrors = analysis.errors.filter((e) => e.severity === SeverityLevels.WARNING);
  const infoErrors = analysis.errors.filter((e) => e.severity === SeverityLevels.INFO);
  return {
    filePath,
    totalErrors: analysis.errorCount,
    criticalCount: criticalErrors.length,
    warningCount: warningErrors.length,
    infoCount: infoErrors.length,
    integrityScore: Math.max(0, 100 - criticalErrors.length * 10 - warningErrors.length * 5 - infoErrors.length * 2),
    errorsByRule: analysis.errors.reduce((acc, err) => { acc[err.id] = (acc[err.id] || 0) + 1; return acc; }, {}),
    toolsUsed: analysis.usedTools,
    context: { highValueRulesViolated: criticalErrors.map((e) => e.id), recommendations: generateRecommendations(analysis.errors) },
  };
}

export default { analyzeCppFile, getIntegrityReport, clearCaches, clearAnalysisCache, errorRules, SeverityColors, SeverityLevels };
