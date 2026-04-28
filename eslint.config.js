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

  // Test files - relaxed rules
  {
    files: [
      'tests/**/*.js',
      'test-tools/**/*.js',
      '.github/scripts/**/*.js',
      'ares-rig/**/*.js',
      'qa/**/*.js',
      '.local/**/*.js',
      'git-governor/**/*.js',
    ],
    rules: {
      'no-console': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' }],
      'no-undef': 'warn',
      'no-empty': ['warn', { allowEmptyCatch: true }],
    },
  },

  // Scripts - relaxed rules
  {
    files: ['scripts/**/*.js', 'webhook-server/**/*.js', 'git-governor/**/*.js'],
    rules: {
      'no-console': 'off',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' }],
    },
  },

  // Lib files - warn on patterns that are often intentional
  {
    files: ['lib/**/*.js', '*.js'],
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' }],
      'no-empty': ['warn', { allowEmptyCatch: true }],
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
    ],
  },
];
