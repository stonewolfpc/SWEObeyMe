/**
 * Language Profile System
 *
 * Responsibility: Single source of truth for per-language rule profiles.
 * All validation, enforcement, and anti-pattern checks derive language
 * behaviour from here — never hardcode JS assumptions elsewhere.
 *
 * @module lib/lang-profile
 */

/** Map file extension → canonical language identifier. */
const EXT_MAP = {
  js: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  go: 'go',
  py: 'python',
  rb: 'ruby',
  rs: 'rust',
  cs: 'csharp',
  java: 'java',
  kt: 'kotlin',
  kts: 'kotlin',
  swift: 'swift',
  cpp: 'cpp',
  cc: 'cpp',
  cxx: 'cpp',
  c: 'c',
  php: 'php',
  scala: 'scala',
};

/**
 * Per-language profiles define:
 *   maxLines      – sensible default file-size limit (no project config present)
 *   jsOnly        – true if JS/TS family (enables var/console.log checks)
 *   functionKw    – keyword(s) used to declare named functions (for extraction regex)
 *   namingRules   – which conventions apply { functions, classes, constants }
 *   forbiddenExtra– language-specific extra forbidden patterns ([] = none)
 */
const PROFILES = {
  javascript: {
    maxLines: 700,
    jsOnly: true,
    functionKw: 'function',
    namingRules: { functions: 'camelCase', classes: 'PascalCase', constants: 'UPPER_SNAKE' },
    forbiddenExtra: [/console\.log\(/, /\bvar\s+/],
  },
  typescript: {
    maxLines: 700,
    jsOnly: true,
    functionKw: 'function',
    namingRules: { functions: 'camelCase', classes: 'PascalCase', constants: 'UPPER_SNAKE' },
    forbiddenExtra: [/console\.log\(/, /\bvar\s+/],
  },
  go: {
    maxLines: 2000,
    jsOnly: false,
    functionKw: 'func',
    namingRules: { functions: 'camelCase', classes: 'PascalCase', constants: 'PascalCase' },
    forbiddenExtra: [],
  },
  python: {
    maxLines: 1000,
    jsOnly: false,
    functionKw: 'def',
    namingRules: { functions: 'snake_case', classes: 'PascalCase', constants: 'UPPER_SNAKE' },
    forbiddenExtra: [/print\s*\(/],
  },
  ruby: {
    maxLines: 1000,
    jsOnly: false,
    functionKw: 'def',
    namingRules: { functions: 'snake_case', classes: 'PascalCase', constants: 'UPPER_SNAKE' },
    forbiddenExtra: [],
  },
  rust: {
    maxLines: 1500,
    jsOnly: false,
    functionKw: 'fn',
    namingRules: { functions: 'snake_case', classes: 'PascalCase', constants: 'UPPER_SNAKE' },
    forbiddenExtra: [],
  },
  csharp: {
    maxLines: 1500,
    jsOnly: false,
    functionKw: null,
    namingRules: { functions: 'PascalCase', classes: 'PascalCase', constants: 'PascalCase' },
    forbiddenExtra: [],
  },
  java: {
    maxLines: 1500,
    jsOnly: false,
    functionKw: null,
    namingRules: { functions: 'camelCase', classes: 'PascalCase', constants: 'UPPER_SNAKE' },
    forbiddenExtra: [],
  },
  kotlin: {
    maxLines: 1000,
    jsOnly: false,
    functionKw: 'fun',
    namingRules: { functions: 'camelCase', classes: 'PascalCase', constants: 'UPPER_SNAKE' },
    forbiddenExtra: [],
  },
  swift: {
    maxLines: 1000,
    jsOnly: false,
    functionKw: 'func',
    namingRules: { functions: 'camelCase', classes: 'PascalCase', constants: 'camelCase' },
    forbiddenExtra: [],
  },
  cpp: {
    maxLines: 2000,
    jsOnly: false,
    functionKw: null,
    namingRules: { functions: 'camelCase', classes: 'PascalCase', constants: 'UPPER_SNAKE' },
    forbiddenExtra: [],
  },
  c: {
    maxLines: 2000,
    jsOnly: false,
    functionKw: null,
    namingRules: { functions: 'snake_case', classes: 'PascalCase', constants: 'UPPER_SNAKE' },
    forbiddenExtra: [],
  },
  php: {
    maxLines: 1000,
    jsOnly: false,
    functionKw: 'function',
    namingRules: { functions: 'camelCase', classes: 'PascalCase', constants: 'UPPER_SNAKE' },
    forbiddenExtra: [],
  },
  scala: {
    maxLines: 1500,
    jsOnly: false,
    functionKw: 'def',
    namingRules: { functions: 'camelCase', classes: 'PascalCase', constants: 'UPPER_SNAKE' },
    forbiddenExtra: [],
  },
};

const DEFAULT_PROFILE = {
  maxLines: 700,
  jsOnly: false,
  functionKw: null,
  namingRules: { functions: null, classes: null, constants: null },
  forbiddenExtra: [],
};

/**
 * Detect language from file extension.
 * @param {string} [filePath]
 * @returns {string} canonical language id e.g. 'go', 'javascript'
 */
export function detectLanguage(filePath) {
  if (!filePath) return 'javascript';
  const ext = filePath.split('.').pop().toLowerCase();
  return EXT_MAP[ext] || 'unknown';
}

/**
 * Get the full language profile for a given language id or file path.
 * Falls back to DEFAULT_PROFILE for unknown languages.
 * @param {string} langOrPath - language id OR file path (auto-detected)
 * @returns {object} profile
 */
export function getLangProfile(langOrPath) {
  const key =
    langOrPath && langOrPath.includes('.')
      ? detectLanguage(langOrPath)
      : langOrPath || 'javascript';
  return PROFILES[key] || DEFAULT_PROFILE;
}

/**
 * Returns true if the language is JS/TS family.
 * @param {string} langOrPath
 * @returns {boolean}
 */
export function isJSFamily(langOrPath) {
  return getLangProfile(langOrPath).jsOnly === true;
}

/**
 * Get the default max file size for a language (used when no project config exists).
 * @param {string} langOrPath
 * @returns {number}
 */
export function getDefaultMaxLines(langOrPath) {
  return getLangProfile(langOrPath).maxLines;
}
