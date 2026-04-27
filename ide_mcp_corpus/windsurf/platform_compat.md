# Windsurf-Next vs VS Code: Platform Compatibility Reference

Source: Windsurf University (windsurf.com/university), Windsurf Docs (docs.windsurf.com), and platform analysis
Last updated: 2026-04-27 (Wave 14+, Windsurf 2.0 era)

## Critical Architectural Fact

Windsurf-Next is NOT VS Code. It looks like VS Code, uses VS Code OSS as a base, but runs a **different extension host** with a different AI/agentic API surface. Extensions that work in VS Code may break silently in Windsurf.

## API Surface Matrix

### FULL Support (works exactly as in VS Code)

These are the APIs Windsurf uses internally — they MUST work:

- `vscode.lm` basic model access
- `LanguageModelChat` / `LanguageModelCompletion`
- `lm.selectChatModels()` / `lm.selectCompletionModels()`
- `lm.requestChat()` / `lm.requestCompletion()`
- `vscode.ChatParticipant` (base)
- `vscode.ChatRequest` / `vscode.ChatResponseStream` / `vscode.ChatFollowup`
- MCP transport layer (stdio, Streamable HTTP, SSE) — Cascade is the MCP client
- Standard `tools/list` and `tools/call` MCP protocol
- InMemoryTransport (same primitive Cascade uses internally)

### PARTIAL Support (present but restricted/rewritten by Windsurf)

- `vscode.ChatParticipant` with **custom tools**: Windsurf allows registration but may block/rewrite tool definitions that conflict with its internal agent system
- `vscode.lm.registerTool()`: Registration is allowed, but:
  - Overrides are blocked
  - Shadowing built-ins is blocked
  - Replacing built-ins is blocked
  - Tools violating Windsurf's internal schema are blocked
  - Tools conflicting with agent system are blocked
- `vscode.ChatVariableResolver`: Works, but Windsurf sometimes overrides variable resolution. Unresolved `${selection}`, `${file}`, `${workspaceFolder}` may be passed as literal strings to MCP tools.

### BLOCKED (silently ignored or crashes extension host)

- `vscode.lm.registerModelProvider()`: Windsurf forces use of its internal model registry
- `vscode.lm.registerInferenceProvider()`: Not supported; Windsurf uses its own inference pipeline
- `vscode.lm.registerChatParticipant()` with **full control**: Windsurf injects its own agent system and restricts message routing, tool invocation, participant visibility/priority

### REPLACED (Windsurf substitutes its own behavior)

- Model registry: Windsurf's own (SWE-1.6, SWE-1.5, GPT-5.x, Claude, Gemini, etc.)
- Tool priority and invocation routing: Windsurf's internal agent system takes precedence
- Inference pipeline: Windsurf's own — BYOK supported for Anthropic

### STUBBED ("coming soon" or no-op)

- Some `vscode.ChatParticipant` registration features return empty
- Participant visibility controls are no-ops

## Windsurf-Specific Features (no VS Code equivalent)

These are NEW in Windsurf and have no VS Code counterpart:

### Cascade Hooks (Wave 13+)
Execute shell scripts at key workflow points:
- `pre_mcp_tool_use` / `post_mcp_tool_use`
- `pre_write_code` / `post_write_code`
- `pre_run_command` / `post_run_command`
- `pre_user_prompt` (can BLOCK)
- `post_cascade_response` (async, full response)
Config: `.windsurf/hooks.json` (workspace), `~/.codeium/windsurf/hooks.json` (user)

### Rules Activation Modes (`.windsurf/rules/*.md`)
- `trigger: always_on` — in every system prompt
- `trigger: model_decision` — description shown, content loaded on demand
- `trigger: glob` — applied only when matching files are touched
- `trigger: manual` — only when `@rule-name` mentioned

### AGENTS.md
Location-scoped rules, zero frontmatter. Root=always-on, subdir=glob.

### Skills
Multi-step procedures with supporting files, progressive disclosure context loading.

### Cascade Modes
- **Code Mode**: Default agentic mode
- **Plan Mode**: Two-phase plan-then-execute
- **Ask Mode**: Read-only, no code changes

### MCP Plugin Store
One-click install of verified MCP servers via Windsurf UI.

### Cascade Hooks on MCP Tools
`pre_mcp_tool_use` can BLOCK any MCP tool call before it executes.

## Compliance Rules for SWEObeyMe

### MUST follow

1. **Never call `registerModelProvider` or `registerInferenceProvider`** — hard crash in Windsurf
2. **MCP server uses `~/.codeium/mcp_config.json`** — correct path confirmed
3. **Tool schemas must have `type: object`, `properties: {}`, `required: []`** — Windsurf drops non-conforming tools
4. **Tool names must be `snake_case`** matching `/^[a-z_][a-z0-9_]*$/`
5. **No `windsurf_` or `cascade_` prefix on tool names** — reserved namespaces
6. **Tool descriptions must be non-empty strings ≤1000 chars** — longer ones get truncated/dropped
7. **`required[]` items must all be in `properties`** — Windsurf strict validation
8. **Responses must be `content[{type:'text', text:string}]`** — Windsurf renders this shape
9. **Response `text` must be valid JSON** — Windsurf parses our responses
10. **No internal paths in responses** — CSP / info disclosure

### SHOULD follow

- Store workspace rules in `.windsurf/rules/` with proper frontmatter
- Use `.windsurf/workflows/` for repeatable procedures (our `/swe-obeyme-automation` workflow)
- Consider adding a `.windsurf/hooks.json` to enforce governance at the Cascade workflow level
- Add `AGENTS.md` at repo root for always-on project-level conventions

### Known tool name conflicts with Windsurf built-ins

`read_file` and `write_file` share names with Windsurf built-in Cascade tools. Windsurf allows registration but execution via our MCP server is blocked/superseded when those names conflict. This is a known risk, documented in tests.

## Windsurf-Specific MCP Behavior

- Cascade is the MCP **client** — our extension is the MCP **server**
- Windsurf calls our tools via standard `tools/list` + `tools/call`
- Tool calls may arrive with extra injected args (`__windsurf_session_id`, `__windsurf_model`)
- Optional args may be stripped entirely
- Variables like `${selection}` may arrive as literal strings if not resolved
- Windsurf may call `tools/list` multiple times — must be idempotent
- Windsurf aggressively recycles MCP connections (extension deactivate/reactivate, model switch, window close/reopen)
- Multiple parallel Cascade sessions (multiple chat tabs) connect simultaneously

## Current Models Available (Wave 14+)

- SWE-1.6, SWE-1.5, SWE-1.5-Free, SWE-1-mini
- GPT-5.x series (GPT-5.5, GPT-5.4, GPT-5.2-Codex, GPT-5.1, etc.)
- Claude Opus 4.7, Claude Sonnet 4.6/4.5, Claude Opus 4.6
- Gemini 3.1 Pro, Gemini 3 Flash, Gemini 3 Pro
- Adaptive (auto-routing model)
- BYOK: Anthropic keys supported

## Changelog-Relevant Features (affects our compliance tests)

- **Wave 13**: Cascade Hooks introduced, System-level Rules & Workflows, Multi-Cascade tabs
- **Wave 14**: Arena Mode (dual-model response comparison), Plan Mode improvements
- **Windsurf 2.0**: Devin integration, Agent Command Center, Adaptive model router
- **MCP**: One-click deeplink install, `pre_mcp_tool_use` hook, MCP registry for teams
