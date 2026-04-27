/**
 * QA Suite — vitest config (LOCAL ONLY)
 *
 * This config is intentionally separate from vitest.config.js.
 * It is excluded from the VSIX build via .vscodeignore.
 * Do NOT reference this file from any build, prepackage, or CI publish step.
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['qa/**/*.qa.test.js'],
    testTimeout: 30000,
    hookTimeout: 15000,
    reporters: ['verbose'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['lib/**/*.js'],
      exclude: [
        'node_modules/',
        'dist/',
        'qa/',
        'tests/',
        '*.config.js',
        'lib/**/*.html',
      ],
      thresholds: {
        lines: 40,
        functions: 40,
        branches: 30,
        statements: 40,
      },
    },
  },
});
