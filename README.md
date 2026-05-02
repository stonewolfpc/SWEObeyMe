# SWEObeyMe

AI Governance System for Surgical Code Editing

[![Version](https://img.shields.io/badge/version-5.3.1-blue.svg)](CHANGELOG.md)
[![Node.js](https://img.shields.io/badge/node-%3E%3D24.15.0-green.svg)](https://nodejs.org)
[![Vitest](https://img.shields.io/badge/vitest-latest-orange.svg)](https://vitest.dev)

---

## Overview

SWEObeyMe is an MCP (Model Context Protocol) server that enforces architectural discipline on AI coding assistants. It prevents common AI failure modes: hallucinated file paths, bloated edits, context pollution, and separation-of-concerns violations.

**Key capabilities:**

- **Surgical editing**: Enforces minimal diffs, single-responsibility files, 700-line limits
- **Governance constitution**: Mandatory workflow rules injected at session start
- **10 public tools, 90+ internal**: Clean surface API with deep functionality via router
- **Self-correcting**: Automatic error detection, backup/restore, integrity scoring
- **Documentation corpus**: 35+ technical categories (MCP spec, Windsurf, Godot, C#, C++, math, quantization)

---

## Architecture

### Tool Surface (10 Public MCP Tools)

| Tool                  | Domain     | Purpose                                    |
| --------------------- | ---------- | ------------------------------------------ |
| `file_ops`            | Files      | Read, write, backup, restore               |
| `swe_search_code`     | Search     | Grep, find, codebase exploration           |
| `backup_restore`      | Safety     | Snapshots, recovery, rollback              |
| `project_context`     | Context    | Project rules, conventions, detection      |
| `docs_manage`         | Docs       | Search 35+ documentation corpora           |
| `swe_workflow_manage` | Workflow   | Multi-step procedures, automation          |
| `sweobeyme_execute`   | Router     | Access 90+ internal tools by domain/action |
| `validate_code`       | Quality    | Syntax, anti-patterns, compliance          |
| `governance_manage`   | Governance | Constitution, status, validation           |
| `safety_manage`       | Safety     | Test coverage, confirmation, checks        |

### Internal Router Domains

Call via `sweobeyme_execute(domain, action, payload)`:

- `files` — write, read, analyze, extract, refactor
- `refactor` — move blocks, extract to new file
- `context` — file analysis, impact assessment
- `safety` — test coverage, dangerous operation confirmation
- `config` — get/set settings
- `memory` — project history, decisions, patterns
- `agent` — spawn, dashboard, orchestrate
- `csharp` — error detection, integrity reports
- `cpp` — memory safety, clang-tidy integration
- `error_detect` — comprehensive scanning
- `spec` — requirements tracking, verification
- `codebase` — orientation, exploration
- `godot` — GDScript, scene organization
- `patreon` — content management

---

## Quick Start

### Prerequisites

- Node.js 24.15.0+
- Windsurf 2.0+ (Wave 14+)

### Install

```bash
# Marketplace
# Search "SWEObeyMe" in Windsurf Extensions

# Or manual
git clone https://github.com/stonewolfpc/SWEObeyMe.git
cd SWEObeyMe
npm install
npm run build
npm test
```

### MCP Configuration

Windsurf auto-detects the MCP server. Manual config path:

- Windows: `~/.codeium/windsurf-next/mcp_config.json`
- macOS/Linux: `~/.codeium/windsurf/mcp_config.json`

---

## AI Skill System

SWEObeyMe includes progressive-disclosure skills in `.windsurf/skills/`:

| Skill              | Level             | When Activated               |
| ------------------ | ----------------- | ---------------------------- |
| `mcp-tools`        | Beginner→Advanced | Working with SWEObeyMe tools |
| `surgical-editing` | Intermediate      | Modifying any code file      |
| `error-recovery`   | Beginner          | On tool errors or failures   |

Skills teach:

- Tool calling patterns (direct vs router)
- Edit validation workflow
- Error response protocols
- Integrity score recovery

---

## Cascade Hooks

Automation triggers in `.windsurf/hooks.json`:

| Hook                    | Trigger          | Action                      |
| ----------------------- | ---------------- | --------------------------- |
| `pre-mcp-tool-call`     | Before tool use  | Validate arguments          |
| `post-mcp-tool-call`    | After tool use   | Validate response format    |
| `pre-write-code`        | Before file edit | Surgical plan check         |
| `post-write-code`       | After file edit  | Auto-validate and test      |
| `pre-run-command`       | Before shell cmd | Safety confirmation         |
| `post-run-command`      | After shell cmd  | Error pattern detection     |
| `pre-user-prompt`       | New session      | Load constitution + context |
| `post-cascade-response` | After response   | Quality validation          |

---

## Project Rules

Always-on rules in `.windsurf/rules/project-conventions.md`:

- JavaScript (Node.js), CommonJS modules
- Vitest for tests, no TypeScript
- 700-line hard limit per `.js` file
- One responsibility per file
- No `console.log`/`debugger`/`eval` in production code
- Tool names: `snake_case`, no `windsurf_`/`cascade_` prefixes
- MCP responses: `{ content: [{ type: 'text', text: string }] }`

---

## Agent System

Domain-specialized agents defined in `AGENTS.md`:

| Agent                | Role                           | Tools                                |
| -------------------- | ------------------------------ | ------------------------------------ |
| `governance-agent`   | Session init, rule enforcement | `governance_manage`, `safety_manage` |
| `surgical-agent`     | File edits, code changes       | `file_ops`, `validate_code`          |
| `research-agent`     | Exploration, docs              | `swe_search_code`, `docs_manage`     |
| `orchestrator-agent` | Multi-step workflows           | `swe_workflow_manage`                |
| `diagnostics-agent`  | Error detection, health        | `error_detect`, `validate_code`      |
| `csharp-agent`       | C# analysis                    | `csharp_manage`                      |
| `cpp-agent`          | C++ safety                     | `cpp_manage`                         |
| `godot-agent`        | Godot dev                      | `godot_manage`                       |
| `patreon-agent`      | Content mgmt                   | `patreon_manage`                     |

---

## Development

```bash
# Run all tests
npm test

# Protocol compliance
npm run test:protocol

# Package VSIX
npm run package

# Build MCP server
npm run build:mcp
```

---

## Migration Notes

### From pre-5.1.9

1. Uninstall old extension from Windsurf extensions folder
2. Delete SWEObeyMe MCP config entries
3. Restart Windsurf completely
4. Install fresh

Install paths:

- Windows: `C:\Users\USER\.codeium\windsurf-next\extensions\`
- macOS/Linux: `~/.codeium/windsurf-next/extensions/`

---

## License

MIT © Christofer Wade

---

## Support

- **Issues:** [GitHub Issues](https://github.com/stonewolfpc/SWEObeyMe/issues)
- **Discord:** [discord.gg/WHvc2EGe](https://discord.gg/WHvc2EGe)
- **Patreon:** [patreon.com/StoneWolfSystems](https://patreon.com/StoneWolfSystems)
