---
trigger: always_on
---

# SWEObeyMe Project Rules

## Language and Runtime
- JavaScript (Node.js), CommonJS modules (`require`/`module.exports`)
- Vitest for all tests — test files match `**/*.test.js` or `**/*.qa.test.js`
- No TypeScript — this is a pure JS project

## File Size Limits
- Hard limit: 700 lines per `.js` file
- Warning at 500 lines — consider splitting
- Exceeding 700 lines requires splitting with `refactor_move_block` or `extract_to_new_file`

## Separation of Concerns
- One responsibility per file
- Handlers live in `lib/tools/` — never in `lib/` root files
- UI components in `lib/ui/` — never inline in main files
- MCP server registration in `server.js`/`extension.js` only

## Code Quality
- No `console.log` in production code (`lib/`)
- No `debugger` statements
- No `eval()`
- No hardcoded secrets or API keys
- Validate all MCP tool parameters before processing

## MCP Tool Schema Rules (Windsurf compliance)
- Tool names must match `/^[a-z_][a-z0-9_]*$/` (snake_case only)
- Tool descriptions must be non-empty strings, ≤1000 characters
- All tools must have `inputSchema.type = "object"` with `properties` and `required` arrays
- `required` items must all appear in `properties`
- Response format: `{ content: [{ type: 'text', text: string }] }`
- Response `text` must be valid JSON
- No internal file paths in responses

## Testing
- QA tests in `qa/` — never in `qa/` subdirectories for unrelated tests
- Integration tests use InMemoryTransport — never real network calls
- Property tests in `qa/property/`
- Static lint checks in `qa/static/`
- Run `npm run qa:all` to verify full suite

## Windsurf-Specific
- Never call `vscode.lm.registerModelProvider` or `registerInferenceProvider`
- No tool names starting with `windsurf_` or `cascade_` (reserved)
- MCP config path: `~/.codeium/mcp_config.json`
- `.windsurf/rules/` for workspace rules, `.windsurf/workflows/` for repeatable procedures
