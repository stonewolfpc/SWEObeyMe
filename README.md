# SWEObeyMe MCP Server

[![Version](https://img.shields.io/badge/version-5.0.31-blue.svg)](CHANGELOG.md)
[![License](https://img.shields.io/badge/license-Dual--License-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)](https://nodejs.org)
[![VS Code](https://img.shields.io/badge/VS%20Code-Extension-purple.svg)](https://marketplace.visualstudio.com)
[![Code Style](https://img.shields.io/badge/code%20style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

[![Twitter](https://img.shields.io/badge/Twitter-@SWEObeyMe-blue.svg)](https://twitter.com/SWEObeyMe)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-SWEObeyMe-blue.svg)](https://linkedin.com/company/SWEObeyMe)
[![Donate](https://img.shields.io/badge/Donate-PayPal-blue.svg)](https://www.paypal.com/donate/?business=9QSRV22WNLFS6&no_recurring=0&currency_code=USD)

---

> **Ladies and Gentlemen, Chris with Stone Wolf Systems here, proud to present VERSION 5.0!**
>
> It's been a fun trip working on this. Updated features..... see the changelog, it's a list. Latest warning, we now send logs for the mcp server to vercel which automatically get fed to my git so I can track issues and make this thing WORK for you.
>
> It's been awesome building this for you guys, but I built it for me first.
>
> Just install the server, tell the ai "Use SWEObeyMe tools" and then your usual instructions. The ai will automatically start using the MCP server! Governance, anti drift, anti vibe, full ENGINEERING level support. Leave me some feedback, I want to know if this works for you, I want to know if it doesn't!

---

## � A Note on v5.0.10 through v5.0.15 — "It Worked On My Machine"

Okay, real talk — I owe you guys an apology.

Versions 5.0.10 through 5.0.15 were, to put it diplomatically, a mess for anyone who wasn't me. The MCP server crashed on startup, the sidebar icon never appeared, and the config file wrote to the wrong directory. Every single one of these worked perfectly on my local machine, which made them genuinely hard to catch before release.

Here's what was broken and what fixed it:

- **v5.0.12** — The real killer: enterprise modules were marked `external` in the build config, so the bundler emitted broken relative import paths that only resolved correctly inside my dev folder. For everyone else, the MCP server crashed immediately on launch.
- **v5.0.13** — MCP config was writing to `~/.codeium/mcp_config.json` instead of `~/.codeium/windsurf-next/mcp_config.json`. Windsurf-Next reads the second one. Total facepalm.
- **v5.0.14** — Runtime npm packages weren't bundled, so the server crashed on `raw-body` not found.
- **v5.0.15** — The sidebar icon had a `"when": "sweObeyMe.enabled"` condition on both the container and the view. The context key was never set. So the panel was permanently invisible for everyone.

**v5.0.16 is the one that works.** Fresh install, no leftover versions in your extensions folder, full restart of Windsurf-Next. That's all it takes.

I'm sorry for the headache. Genuinely. This extension means a lot to me and you all deserve better than "oops, worked locally." The error reporting pipeline is now live so I'll catch these before you do going forward. — Chris

---

## �🚀 New in v5.0 - Automatic Error Reporting

**Governance failures now automatically report to GitHub.** When the extension detects a router failure, validation error, or forbidden pattern, it:

1. Posts the error to the Vercel webhook server
2. Creates a GitHub issue with full diagnostics (type, domain, action, handler, file path, backup diff, router trace)
3. Labels the issue with `auto-reported` + type-specific tag
4. The local sync daemon downloads issues to your `sweobeyme-issues\` folder
5. Issues appear in the Cascade inbox for review and repair

This means I can see what's breaking in real time and fix it faster. The full pipeline is silent on failure — it won't crash your session, just queue the issue for review.

### ⚠️ What Data Is Sent

**The following information is sent to the webhook when a governance failure occurs:**

- **Error Type:** validation_failure, self_healing, handler_throw, invalid_domain_action, forbidden_pattern, backup_restore, or chaos_test
- **Domain:** The governance domain (files, refactor, context, safety, config, memory, agent, csharp, cpp, error, spec, codebase, godot, patreon)
- **Action:** The specific action that failed (e.g., write_file, code_analyze, validate_code)
- **Handler Name:** The name of the handler that failed
- **Diagnostics:** Error message and stack trace
- **File Path:** (Optional) Path to the file being operated on
- **Backup Diff:** (Optional) Diff of the backup if self-healing was attempted
- **Router Trace:** (Optional) Full trace of the governance router execution

**What is NOT sent:**

- **File contents** - Your actual code is never transmitted
- **Personal information** - No user identity, machine names, or personal data
- **API keys or secrets** - Never included in error reports
- **Session context** - No AI conversation history or prompts

### How to Disable Error Reporting

You can disable automatic error reporting entirely by setting the following configuration:

```json
{
  "sweObeyMe.errorReporting.enabled": false
}
```

Or change the webhook URL to point to your own server:

```json
{
  "sweObeyMe.webhookUrl": "https://your-server.com/webhook"
}
```

Error reporting is **enabled by default** to help improve SWEObeyMe for everyone. Disabling it means I won't see errors from your install, which may delay bug fixes.

---

## 🔧 Auto-Repair Pipeline

### How It Works (My Setup)

When something breaks in any user's install, here's the full chain:

1. **Extension detects the failure** — any catch block in activation, or any governance violation in the MCP router
2. **Posts to Vercel webhook** → `https://swe-obey-me-ivki.vercel.app/report`
3. **Vercel creates a GitHub issue** on `stonewolfpc/SWEObeyMe` labeled `auto-reported`
4. **Local sync daemon** (`Start-SWEObeyMe-Sync.bat`) polls GitHub every 60 seconds, downloads new issues to `%USERPROFILE%\sweobeyme-issues\`
5. **Issues appear in the Cascade inbox** inside the workspace rules file — I open the project, see the alert, and can say _"hey check this issue out"_ directly to the AI

The auto-repair prompts live **inside the MCP server tools** — not in Windsurf's global rules. This is intentional. Hooking into Windsurf's rule system globally risks breaking the IDE for everyone. The MCP layer is the safe, isolated place for this.

### For Everyone Else — The Door Is There, Just Closed

The auto-repair system exists in your install but is completely silent by default. It won't do anything you didn't ask for. Your session is safe.

If you want to **build your own repair pipeline** that works the same way, here's what you need:

**1. A GitHub token** with `repo` scope — set it as an environment variable:

```bat
setx SWEOBEYME_GITHUB_TOKEN "ghp_your_token_here"
```

**2. The sync daemon** — `sync-sweobeyme-issues.js` in your tools folder. It polls `api.github.com` for issues labeled `auto-reported` and writes them to a local folder. The key variable to set:

```js
const WORKSPACE_RULES = path.join('YOUR_DRIVE', 'YOUR_PROJECT', '.windsurfrules');
```

Point that at your workspace's `.windsurfrules` file and the inbox section will auto-populate.

**3. The inbox block** — your `.windsurfrules` (or equivalent AI rules file) needs these markers somewhere in it:

```html
<!-- SWEOBEYME_INBOX_START -->
<!-- SWEOBEYME_INBOX_END -->
```

The sync daemon writes issue summaries between those markers. Your AI sees them on session start.

**4. Enable auto-repair** — run `Start-SWEObeyMe-Sync.bat` (or equivalent), answer `Y` to auto-repair. That sets `SWEOBEYME_AUTO_REPAIR_ENABLED=true` in the environment before launching the daemon.

That's the whole thing. Four steps and you have the same pipeline I use.

---

## ⚠️ Important Notice - v5.0.3

**Major Architecture Overhaul - Governance Router System.** v5.0.0 includes:

- **93% Tool Reduction:** From 97 tools to 7 semantic entry points (file_ops, search_code, backup_restore, project_context, docs_manage, workflow_manage, sweobeyme_execute)
- **Governance Router:** Centralized philosophy enforcement (surgical compliance, backup-before-edit, validation, self-healing rollback)
- **Internal Handler Registry:** All 97 internal handlers hidden behind router, bypassing MCP 100-tool limit
- **Validation Layer:** Comprehensive test suite with 5 categories (structural, safety, router, integration, chaos)
- **Automatic Enforcement:** Philosophy rules now enforced at router level before operations execute

**Breaking Change:** AI models now see only 7 surface tools instead of 97. All existing functionality preserved through internal registry. Use `sweobeyme_execute` for direct access to internal handlers.

**Please upgrade to v5.0.0** to ensure all features function correctly.

---

## ⚠️ Important Notice - v4.2.0

**Implementation Knowledge System and Codebase Orientation added.** v4.2.0 includes:

- **Implementation Knowledge System**: Tracks experimental attempts, assumptions, working patterns, context annotations, and dependency impacts to help AI agents avoid repeating mistakes.
- **Codebase Orientation System**: Added codebase_orientation, dependency_analysis, entry_point_mapper, and codebase_explore tools for AI navigation.
- **Extended Project Memory**: Added contextAnnotations and dependencyImpacts arrays with automatic recording.
- **Comprehensive Testing**: Added full test suite (e2e, integration, unit) with 100% success rate.

**Please upgrade to v4.2.0** to ensure all features function correctly.

---

## ⚠️ Important Usage Note

**Please explicitly tell the AI to use SWEObeyMe tools.**

When working with this extension, you should instruct the AI assistant to:

- **"Always use SWEObeyMe tools for file operations"**
- **"Call get_governance_constitution at the start of each session"**
- **"Use obey_surgical_plan before write_file"**

**Important disclaimer:** While SWEObeyMe provides strong enforcement mechanisms, the AI model ultimately retains autonomy in tool selection. We cannot bypass Windsurf's internal mechanisms or override the model's decision-making process to achieve true full automation. However, with proper prompting and the runtime enforcement features we've implemented, SWEObeyMe can come very close to ensuring consistent tool usage in most cases.

The extension includes:

- Runtime enforcement that rejects operations if required tools weren't called first
- Tool priority settings (governance constitution at highest priority 999)
- Strong tool descriptions with explicit consequences for non-compliance

These features significantly increase the likelihood the AI will use the correct tools, but prompt guidance remains the most reliable method.

---

## Table of Contents

- [What It Does For You](#what-it-does-for-you)
- [The Pro Advantage](#the-pro-advantage)
- [Installation](#installation)
- [Developer Mode (Opt-In)](#developer-mode-opt-in)
- [How It Works](#how-it-works)
- [Feature Overview](#feature-overview)
- [Available Tools](#available-tools)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)
- [Changelog](#changelog)
- [License](#license)

---

## What It Does For You

**You describe. It builds. No half-measures.**

SWEObeyMe sits between you and your AI coding assistant and makes sure the AI actually finishes what it starts. No more:

- Fake functions that look real but do nothing
- Files that grow to 3,000 lines because the AI lost track
- Bracket nightmares that won't compile
- 20 clarifying questions at 3 AM instead of working code
- Lost context after long sessions
- Simulated implementations where you had working code

**Install it. Tell the AI what you want. Go to sleep.** The architecture is rigid enough that the AI can't cut corners.

---

## The Pro Advantage

SWEObeyMe is a **surgical governance MCP server** with **72+ enforcement tools** that integrate directly into Windsurf, VS Code, and any MCP-compatible IDE. It intercepts AI file operations and validates them against architectural rules before they touch disk.

**Core Enforcement:**

- **700-line file ceiling** — forces extraction when files grow
- **Forbidden pattern blocking** — // [REMOVED BY SWEObeyMe]: Forbidden Pattern, // [REMOVED BY SWEObeyMe]: Forbidden Pattern, // [REMOVED BY SWEObeyMe]: Forbidden Pattern, eval auto-removed
- **Automatic atomic backups** — every write is backed up before it lands
- **Loop detection** — prevents repetitive writes to the same file
- **Import/reference validation** — ensures all imports resolve
- **Duplicate file prevention** — catches copy-paste file sprawl
- **Path verification** — blocks hallucinated paths before they error

**Quality Assurance:**

- **C# Bridge** — real-time .NET error detection (10 detector categories, severity scoring, deduplication)
- **C++ Bridge** — custom static analysis for memory leaks, buffer overflows, missing virtual destructors
- **Math verification** — symbolic checks for formulas and algorithms
- **Syntax validation** — pre-write bracket matching and depth tracking

**Project Intelligence:**

- **Auto-indexing** — project structure, conventions, and decisions persist across sessions
- **Context switching** — separate rules per project, automatically detected
- **Decision recording** — architectural choices are logged and enforced
- **Operation audit** — every tool call tracked with deduplicated timestamps

**Workflow Automation:**

- **Checkpoints** — save and restore file states at any point
- **Diff review** — approve or reject changes before they apply
- **Git integration** — branch info, commit messages, pre-commit validation
- **Hot reload** — extension file changes apply without restart

**Documentation & Knowledge:**

- **Multi-corpus docs lookup** — search across C#, Git, TypeScript, Godot, MCP spec, math reference, and 10+ other corpora
- **Godot detection** — auto-detect Godot projects for game dev workflows
- **FDQ lookup** — LLM quantization and training dynamics reference
- **Patreon content management** — fetch, analyze, and rewrite Patreon tiers and posts

**Enterprise Features:**

- **RBAC / SSO / SCIM** — role-based access, single sign-on, user provisioning
- **Audit logging** — immutable operation logs with tamper detection
- **Rate limiting & quotas** — per-user and per-tool call controls
- **Webhook compliance** — automated compliance event streaming
- **Encryption at rest** — AES-256-GCM for sensitive configuration

**Governance & Trust:**

- **Surgical Integrity Score** — visible 0-100 compliance score per session
- **Error Feedback Loops** — consecutive error tracking, auto-recovery suggestions
- **Auto-enforcement** — validates files against architectural rules continuously
- **Anti-hallucination** — tool existence checks, path normalization, schema validation

---

## Installation

### VS Code / Windsurf (Recommended)

1. Open Extensions view (`Ctrl+Shift+X`)
2. Search **"SWEObeyMe"**
3. Click **Install**
4. Reload when prompted — the MCP server auto-configures on activation

### Windsurf-Next (Manual / Development)

1. Ensure Windsurf-Next (Phoenix Alpha Fast) or later is installed
2. Clone or download this repository
3. `npm install`
4. The extension auto-configures `~/.codeium/mcp_config.json` on first activation

### Prerequisites

- Node.js 18.0.0 or higher
- VS Code 1.61.0+ or Windsurf-Next
- Git (optional, for Git features)

---

## Developer Mode (Opt-In)

SWEObeyMe includes a **comprehensive error detection system** for industrial-grade correctness guarantees. This is **opt-in** for developers who want the same strict environment used by SWEObeyMe maintainers.

### Mode A - Minimal Install (Default)

For users who just want SWEObeyMe to run:

- No TypeScript
- No madge
- No husky
- No lint-staged
- No CI
- No audit enforcement

This is the default mode - no additional dependencies required.

### Mode B - Full Correctness Suite (Opt-In)

For developers who want the exact industrial-grade environment:

- ESLint strict
- TypeScript strict
- Prettier strict
- madge (circular dependency detection)
- npm audit
- husky (git hooks)
- lint-staged (pre-commit linting)
- Comprehensive error detection MCP tools

**⚠️ Important Dependency Constraints:**

- **TypeScript 6.x is NOT supported by madge 8.x** - Use TypeScript 5.9.x for full compatibility
- **ESLint 9.x required** - ESLint 10.x has breaking changes
- **Peer dependencies are optional** - SWEObeyMe will gracefully skip unavailable tools

### Developer Suite Installation

Run the following command to install the full developer suite:

```bash
npm run dev:install
```

This installs version-locked dependencies:

```bash
npm install --save-dev \
  eslint@9.39.4 \
  prettier@3.2.5 \
  typescript@5.9.3 \
  madge@8.0.0 \
  husky@9.0.11 \
  lint-staged@15.2.2
```

### What You Get

With the full suite enabled, SWEObMe provides:

- **Comprehensive error detection** - Frontend UI to tiny lint issues
- **Circular dependency detection** - madge integration
- **Type safety** - TypeScript strict mode
- **Code formatting** - Prettier enforcement
- **Pre-commit hooks** - Automatic linting before commits
- **Security auditing** - npm audit integration

### Graceful Degradation

If you choose not to install the full suite, SWEObeyMe will:

- Skip TypeScript checks
- Skip circular dependency checks
- Skip ESLint/Prettier checks
- Still provide all core enforcement tools
- Still provide C#/C++ Bridge diagnostics
- Still provide surgical governance

The comprehensive error detection system is designed to work with or without these optional dependencies.

---

## How It Works

SWEObeyMe runs as an **MCP (Model Context Protocol) server**. The AI talks to it before every file operation. The server says yes, no, or "fix this first." The AI cannot bypass it.

**Zero-trust architecture:** every workspace operation routes through MCP tools. The AI cannot use native file APIs while SWEObeyMe is active.

**Auto-configuration:** on first activation, the extension atomically writes its MCP server entry into your IDE's MCP config. No manual JSON editing.

---

## Feature Overview

| Category             | What It Does                                                                                  |
| -------------------- | --------------------------------------------------------------------------------------------- |
| **File Safety**      | Atomic backups, loop detection, path verification, duplicate prevention, reference validation |
| **Code Quality**     | Line-count limits, forbidden-pattern removal, syntax validation, import verification          |
| **C# Diagnostics**   | Missing using, empty catch, deep nesting, async/await, resource leaks, math safety, null refs |
| **C++ Diagnostics**  | Memory leaks, buffer overflows, missing virtual destructors, optional clang-tidy / cppcheck   |
| **Project Memory**   | Auto-indexing, convention detection, decision recording, file-purpose tracking                |
| **Checkpoints**      | Save/restore file states, concurrent checkpoints, automatic pruning                           |
| **Diff Review**      | Line-by-line approval workflow, impact analysis, change summaries                             |
| **Docs & Reference** | 14 searchable corpora covering C#, Git, TypeScript, Godot, MCP, math, LLM training, web dev   |
| **Governance**       | Surgical integrity score, error feedback loops, auto-enforcement, workflow orchestration      |
| **Enterprise**       | RBAC, SSO, SCIM, audit logging, rate limiting, quotas, encryption, webhooks                   |

---

## Available Tools

**72+ surgical tools** organized by domain:

- **Core Operations (6)** — read, write, list, diff, validate, backup
- **Configuration (1)** — get, set, reset, schema, diagnostics
- **Validation (1)** — anti-patterns, naming, imports, repetition
- **Safety (1)** — test coverage, dangerous-operation confirmation
- **Feedback (1)** — documentation requirements, change summaries, rejection explanations
- **Session & Context (1)** — context retrieval, decision recording, error recovery
- **C# .NET (2)** — code validation, bracket checks, complexity analysis, math safety
- **C++ (2)** — static analysis integration, health scoring
- **Project Integrity (1)** — indexing, duplicate detection, reference validation, search, audit reports
- **Project Memory (1)** — structure indexing, convention analysis, decision recording, file suggestions
- **Documentation (4)** — multi-corpus lookup, category listing, formula verification
- **Math (2)** — expression analysis, safety validation
- **Godot (3)** — project detection, scene analysis, GDScript validation
- **FDQ (2)** — quantization lookup, training dynamics reference
- **Training (2)** — corpus lookup, category listing
- **Patreon (4)** — content fetch, rewrite plan generation, draft writing, change application
- **Auto-Enforcement (2)** — audit directory, validate files, stats, threshold management
- **Diagnostics (2)** — server health, component status
- **Code Search (1)** — file and symbol search
- **Git (5)** — branch info, commit messages, pre-commit validation, status, diff

---

## Configuration

### Extension Settings

Configure via VS Code Settings (`Ctrl+,`) or `settings.json`:

```json
{
  "sweObeyMe.maxLines": 700,
  "sweObeyMe.warningThreshold": 650,
  "sweObeyMe.maxBackupsPerFile": 10,
  "sweObeyMe.enableAutoCorrection": true,
  "sweObeyMe.debugLogs": false,
  "sweObeyMe.enableLoopDetection": true,
  "sweObeyMe.csharpBridge.enabled": true,
  "sweObeyMe.csharpBridge.keepAiInformed": true,
  "sweObeyMe.csharpBridge.severityThreshold": 50,
  "sweObeyMe.cppBridge.enabled": true
}
```

### Project Files

- `.sweobeyme-contract.md` — project-specific architectural rules
- `.sweignore` — files to exclude from AI context

### Environment Variables

- `NODE_ENV` — set to `production` for production use
- `SWEOBEYME_BACKUP_DIR` — custom backup directory
- `SWEOBEYME_DEBUG` — set to `1` for debug logging

---

## Troubleshooting

| Symptom                               | Fix                                                                                                              |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| MCP server not loading                | Check extension activation; reload window                                                                        |
| File write rejected                   | Check line count (max 700) and forbidden patterns                                                                |
| Duplicate server detected             | Extension auto-cleans stale instances on reload                                                                  |
| Backup failed                         | Check backup directory permissions                                                                               |
| C# Bridge silent                      | Ensure .NET project is loaded and bridge is enabled in settings                                                  |
| C++ Bridge silent                     | Install clang-tidy or cppcheck for deeper analysis; pattern matching works out of box                            |
| Slow performance                      | Disable C# Bridge if not using .NET; reduce maxBackupsPerFile                                                    |
| **Transport error: transport closed** | MCP server connection was terminated; restart IDE or reload window; check if MCP server process is still running |

**Debug mode:** set `SWEOBEYME_DEBUG=1` before launching your IDE.

---

### MCP Transport Error (Documented Issue)

**Error encountered:** `transport error: transport closed`

**Context:**

- When attempting to call `mcp1_get_governance_constitution` from the SWEObeyMe MCP server
- The MCP server transport closed unexpectedly during tool invocation
- This prevents the AI from retrieving the governance constitution at session start

**What was being done:**

- Attempting to establish the required workflow and governance rules by calling the governance constitution tool
- This is a prerequisite operation that should be called at the start of every session according to the documentation

**Potential fixes:**

1. **Restart the IDE** - The MCP server process may have crashed or hung
2. **Reload the window** - Use the "Developer: Reload Window" command in VS Code/Windsurf
3. **Check MCP server status** - Verify the SWEObeyMe extension is activated and the MCP server is running
4. **Check MCP config** - Verify `~/.codeium/mcp_config.json` has the correct SWEObeyMe server entry
5. **Reinstall extension** - If the issue persists, uninstall and reinstall the SWEObeyMe extension
6. **Check for port conflicts** - Another process may be using the MCP server port
7. **Check logs** - Enable debug mode (`SWEOBEYME_DEBUG=1`) and check the extension logs for more details

**Workaround:**
If the governance constitution tool is unavailable, proceed without it but be aware that surgical enforcement may not work correctly until the constitution is retrieved.

---

> **⚠️ Credit Usage Note:** SWEObeyMe works correctly on all AI models, including free tiers. Due to comprehensive validation and enforcement, it may consume more tokens on paid models than basic assistants. This is expected — every file operation is validated, backed up, and audited before execution.

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and release notes.

---

## License

Dual-licensed. Choose the license that fits your use case:

### Community License (Free)

For individuals, indie developers, companies under $10M annual revenue, researchers, students, and open-source projects. Attribution required. No warranty.

### Enterprise License (Commercial)

Required for companies over $10M revenue, enterprise deployments, SaaS platforms, and redistribution in commercial offerings.

Contact: [stonewolfpc@github.com](mailto:stonewolfpc@github.com) | [GitHub](https://github.com/stonewolfpc/SWEObeyMe)

See [LICENSE](LICENSE) for full terms.

---

**Stone Wolf Systems, Architecting your dreams.**

---

_Most of this readme and all changelogs were written by AI, and so was the project. Surprise folks, I'm the anti-vibe coding non-programmer your bosses warned you about! I seriously hope this project helps you as much as it's helping me!_
