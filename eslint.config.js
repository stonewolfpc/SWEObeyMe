// ESLint v9+ Flat Config
// https://eslint.org/docs/latest/use/configure/configuration-files

import js from '@eslint/js';
import globals from 'globals';

/** @type {import('eslint').Linter.Config[]} */
export default [
  // Base JavaScript rules
  js.configs.recommended,

  // Project-specific configuration
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        allowImportExportEverywhere: true,
      },
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
    rules: {
      // Enforce no console.log (use structured logging instead)
      'no-console': ['warn', { allow: ['error', 'warn', 'info'] }],

      // No debugger statements
      'no-debugger': 'error',

      // No eval
      'no-eval': 'error',

      // No unused vars (allow underscore prefix for unused, ignore catch errors)
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' }],

      // Prefer const/let over var
      'no-var': 'error',

      // Prefer strict equality
      'eqeqeq': ['error', 'always'],

      // No implicit globals
      'no-implicit-globals': 'error',

      // Require error handling in callbacks
      'handle-callback-err': ['error', '^(err|error)$'],

      // No duplicate imports
      'no-duplicate-imports': 'error',

      // Prefer arrow callbacks
      'prefer-arrow-callback': 'warn',

      // Prefer const for never-reassigned variables
      'prefer-const': 'error',

      // No trailing spaces
      'no-trailing-spaces': 'error',

      // Consistent semicolons
      'semi': ['error', 'always'],

      // Consistent quotes
      'quotes': ['error', 'single', { avoidEscape: true }],

      // No mixed spaces and tabs
      'no-mixed-spaces-and-tabs': 'error',

      // Indentation (2 spaces)
      'indent': ['error', 2, { SwitchCase: 1 }],

      // No multiple empty lines
      'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 1 }],

      // No extra semicolons
      'no-extra-semi': 'error',

      // No unreachable code
      'no-unreachable': 'error',

      // No unsafe finally
      'no-unsafe-finally': 'error',

      // No unsafe negation
      'no-unsafe-negation': 'error',

      // Valid typeof comparisons
      'valid-typeof': 'error',
    },
  },

  // Test files - relaxed rules (warnings off)
  {
    files: [
      'tests/**/*.js',
      'test-tools/**/*.js',
      '.github/scripts/**/*.js',
      'ares-rig/**/*.js',
      'qa/**/*.js',
      '.local/**/*.js',
      'git-governor/**/*.js',
      'windsurf-rig/**/*.js',
    ],
    rules: {
      'no-console': 'off',
      'no-unused-vars': 'off',
      'no-undef': 'off',
      'no-empty': 'off',
      'no-control-regex': 'off',
      'handle-callback-err': 'off',
      'no-useless-escape': 'off',
      'no-async-promise-executor': 'off',
      'no-prototype-builtins': 'off',
      'no-dupe-keys': 'off',
      'no-case-declarations': 'off',
      'no-duplicate-imports': 'off',
    },
  },

  // Scripts - relaxed rules
  {
    files: ['scripts/**/*.js', 'webhook-server/**/*.js'],
    rules: {
      'no-console': 'off',
      'no-unused-vars': 'off',
    },
  },

  // Build config - allow console.log for build logging
  {
    files: ['esbuild.config.js'],
    rules: {
      'no-console': 'off',
    },
  },

  // Lib files - warnings off (unused vars often intentional for future use)
  {
    files: ['lib/**/*.js', '*.js'],
    rules: {
      'no-unused-vars': 'off',
      'no-empty': 'off',
      'no-console': 'off',
    },
  },

  // Other files with warnings
  {
    files: ['index.mjs', 'plugins/**/*.js', 'test-mcp.cjs', 'git-governor/checks/**/*.js'],
    rules: {
      'no-console': 'off',
      'no-unused-vars': 'off',
    },
  },

  // Ignored files/directories
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      '.sweobeyme-logs/**',
      '.sweobeyme-backups/**',
      '.sweobeyme-autonomous/**',
      'coverage/**',
      '**/*.min.js',
      '**/vendor/**',
      '**/*.md',
      '**/*.markdown',
      'README*',
      'tests/fuzzer-generated/**',
    ],
  },
];
