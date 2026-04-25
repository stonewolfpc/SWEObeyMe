# SWEObeyMe MCP Server

[![Version](https://img.shields.io/badge/version-4.2.6-blue.svg)](CHANGELOG.md)
[![License](https://img.shields.io/badge/license-Dual--License-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)](https://nodejs.org)
[![VS Code](https://img.shields.io/badge/VS%20Code-Extension-purple.svg)](https://marketplace.visualstudio.com)
[![Code Style](https://img.shields.io/badge/code%20style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

[![Twitter](https://img.shields.io/badge/Twitter-@SWEObeyMe-blue.svg)](https://twitter.com/SWEObeyMe)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-SWEObeyMe-blue.svg)](https://linkedin.com/company/SWEObeyMe)
[![Donate](https://img.shields.io/badge/Donate-PayPal-blue.svg)](https://www.paypal.com/donate/?business=9QSRV22WNLFS6&no_recurring=0&currency_code=USD)

---

> **Hello ladies and gentlemen, coders, and non coders, Stone Wolf Systems here.**
>
> With the April 21st, 2026 update to Windsurf-Next we have released a whole new package for you. This is geared towards non coders, the anti vibe coding agent. The dream? Make the system do the job you tell it to, just as you **HOPED** it would as a vibe coder, without all the half implemented functions.
>
> If you can't make the AI smarter, you make the architecture so firm it can't deny you. That's the hope I have, that this extension will provide you with relief. No more 3 AM "lets give it a list before bed" and wake up to 20 questions, 30 bracket nightmares, and simulated functions where you just had working implementations.
>
> Coders who know what they're doing can appreciate the speedup and automation. Professionals can appreciate the fact their side projects are now completing in record time with less intervention, but they're also able to provide far more control now.

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

## How It Works

SWEObeyMe runs as an **MCP (Model Context Protocol) server**. The AI talks to it before every file operation. The server says yes, no, or "fix this first." The AI cannot bypass it.

**Zero-trust architecture:** every workspace operation routes through MCP tools. The AI cannot use native file APIs while SWEObeyMe is active.

**Auto-configuration:** on first activation, the extension atomically writes its MCP server entry into your IDE's MCP config. No manual JSON editing.

---

## Feature Overview

| Category | What It Does |
|----------|-------------|
| **File Safety** | Atomic backups, loop detection, path verification, duplicate prevention, reference validation |
| **Code Quality** | Line-count limits, forbidden-pattern removal, syntax validation, import verification |
| **C# Diagnostics** | Missing using, empty catch, deep nesting, async/await, resource leaks, math safety, null refs |
| **C++ Diagnostics** | Memory leaks, buffer overflows, missing virtual destructors, optional clang-tidy / cppcheck |
| **Project Memory** | Auto-indexing, convention detection, decision recording, file-purpose tracking |
| **Checkpoints** | Save/restore file states, concurrent checkpoints, automatic pruning |
| **Diff Review** | Line-by-line approval workflow, impact analysis, change summaries |
| **Docs & Reference** | 14 searchable corpora covering C#, Git, TypeScript, Godot, MCP, math, LLM training, web dev |
| **Governance** | Surgical integrity score, error feedback loops, auto-enforcement, workflow orchestration |
| **Enterprise** | RBAC, SSO, SCIM, audit logging, rate limiting, quotas, encryption, webhooks |

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

| Symptom | Fix |
|-----------|-----|
| MCP server not loading | Check extension activation; reload window |
| File write rejected | Check line count (max 700) and forbidden patterns |
| Duplicate server detected | Extension auto-cleans stale instances on reload |
| Backup failed | Check backup directory permissions |
| C# Bridge silent | Ensure .NET project is loaded and bridge is enabled in settings |
| C++ Bridge silent | Install clang-tidy or cppcheck for deeper analysis; pattern matching works out of box |
| Slow performance | Disable C# Bridge if not using .NET; reduce maxBackupsPerFile |

**Debug mode:** set `SWEOBEYME_DEBUG=1` before launching your IDE.

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
