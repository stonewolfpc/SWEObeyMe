/**
 * QA Suite — Local-only release gate. NEVER included in published builds.
 *
 * vitest.config.qa.js is the runner for this directory.
 * It is NOT referenced by any build script, prepackage hook, or dist pipeline.
 *
 * Layers:
 *   qa/unit/       — pure logic, no I/O
 *   qa/integration/ — multi-module handoffs, webhook server (Supertest)
 *   qa/e2e/         — full MCP lifecycle via InMemoryTransport
 *   qa/static/      — ESLint + structural lint runner
 *   qa/property/    — fast-check property-based fuzz tests
 */
