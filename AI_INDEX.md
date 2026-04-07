# SWEObeyMe Project AI Index

**Purpose**: Instant orientation for AI agents working on this codebase.

## Project Overview

SWEObeyMe is an MCP (Model Context Protocol) server that provides surgical governance for AI code operations. It enforces architectural rules, prevents file bloat, and provides real-time validation.

## Entry Points

- **index.js**: Main MCP server entry point (68 tools available)
- **extension.js**: VSCode extension entry point
- **package.json**: Configuration and dependencies

## Core Architecture

### lib/tools/ (68 MCP Tools)
- **handlers.js**: Main tool handler registry
- **registry.js**: Tool definitions and schemas
- **csharp-handlers.js**: C# Bridge error detection tools
- **code-search-handlers.js**: Code search and documentation tools
- **validation-handlers.js**: Pre-write validation tools
- **context-handlers.js**: File context and analysis tools
- **safety-handlers.js**: Safety and anti-pattern detection
- **config-handlers.js**: Configuration management
- **feedback-handlers.js**: Error recovery and guidance
- **project-integrity-handlers.js**: Project integrity checks
- **project-memory-handlers.js**: Project memory and convention tracking (NEW in v1.3.0)

### lib/ (Core Systems)
- **enforcement.js**: Surgical rule enforcement
- **validation.js**: Code validation (syntax, imports, anti-patterns)
- **project.js**: Project contract and ignore rules
- **backup.js**: Automatic file backup system
- **workflow.js**: Multi-step workflow orchestration
- **session.js**: Session memory and audit
- **csharp-bridge.js**: C# error analysis integration
- **csharp-validation.js**: C# complexity analysis
- **math-safety.js**: Mathematical expression safety
- **file-operation-audit.js**: Duplicate write detection
- **file-registry.js**: File tracking and deduplication
- **rule-engine.js**: Rule enforcement and compliance checking (NEW in v1.3.0)
- **project-memory.js**: Persistent project structure and convention tracking (NEW in v1.3.0)
- **fallback-system.js**: Intelligent fallback behavior for failures (NEW in v1.3.0)

### Configuration Files
- **.sweignore**: Files excluded from AI context
- **.sweobeyme-contract.md**: Project architectural contract
- **package.json**: Dependencies and scripts
- **.vscodeignore**: VSCode packaging exclusions

## Documentation

### docs/ (Offline Reference)
- **llama/**: LlamaCpp.net and LlamaCppUnity documentation
- **math/**: Mathematical reference (algorithms, linear algebra, probability, discrete math)

### README.md
- Project description
- License information (dual licensing: Community + Enterprise)
- Changelog
- Tool usage examples

## Testing

### tests/
- **mcp-protocol-compliance.js**: MCP protocol validation
- **surgical-compliance.js**: Surgical rule enforcement tests

### test-tools/
- **test-all-schemas.js**: Schema validation for all 68 tools
- **test-csharp-tools.js**: C# Bridge tool registration tests
- **golden-regression-tests.js**: Expected success/failure outputs for critical tools

## Key Rules for AI

1. **ALWAYS use `read_file`** - Never read files directly
2. **ALWAYS call `obey_surgical_plan` before `write_file`** - Prevents file bloat
3. **Use `preflight_change` for non-trivial changes** - Orchestrates full validation
4. **Check .sweignore** - Protected files cannot be modified
5. **Line count limit is 700** - Use `refactor_move_block` or `extract_to_new_file` if exceeded
6. **Use project memory tools** - `index_project_structure` on first access, `suggest_file_location` for new files
7. **Follow rule engine** - Search before edit, explain before act, tools before manual edits

## Critical Workflows

### For File Modifications
1. `read_file` (to see context and warnings)
2. `get_file_context` (to understand dependencies)
3. `obey_surgical_plan` (to check line count)
4. `preflight_change` (for non-trivial changes)
5. `write_file` (to apply changes)
6. `run_related_tests` (to verify)

### For C# Files
1. `read_file` (includes C# complexity analysis)
2. `get_csharp_errors_for_file` (to check specific errors)
3. `get_integrity_report` (to understand architectural impact)
4. `toggle_csharp_error_type` (to enable/disable specific checks)

### For Code Analysis
1. `search_code_files` (find code by pattern)
2. `get_code_language_stats` (understand language distribution)
3. `analyze_change_impact` (understand ripple effects)

## Surgical Integrity Score

- Range: 0-100
- Decreases on failures, increases on successes
- Triggers Constitution reading when consecutive failures >= 3
- Affects C# error injection throttling

## Common Pitfalls to Avoid

1. **Skipping `obey_surgical_plan`** - Will cause write rejections
2. **Ignoring .sweignore** - Will cause operation blocks
3. **Exceeding 700 lines** - Will cause file bloat rejection
4. **Using console.log/TODO** - Forbidden patterns that auto-fail
5. **Not checking imports** - May cause broken code

## Version Information

- Current version: 1.3.0
- License: Dual licensing (Community + Enterprise)
- Total MCP tools: 68
- C# Bridge: Integrated with error detection
- Workflow Automation: Rule engine, project memory, fallback system (NEW in v1.3.0)
