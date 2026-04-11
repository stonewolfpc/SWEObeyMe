# SWEObeyMe MCP Server

[![Version](https://img.shields.io/badge/version-2.1.6--beta-blue.svg)](https://github.com/stonewolfpc/SWEObeyMe)
[![License](https://img.shields.io/badge/license-Dual--License-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)](https://nodejs.org)
[![VS Code](https://img.shields.io/badge/VS%20Code-Extension-purple.svg)](https://marketplace.visualstudio.com)
[![Code Style](https://img.shields.io/badge/code%20style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

[![Twitter](https://img.shields.io/badge/Twitter-@SWEObeyMe-blue.svg)](https://twitter.com/SWEObeyMe)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-SWEObeyMe-blue.svg)](https://linkedin.com/company/SWEObeyMe)
[![Donate](https://img.shields.io/badge/Donate-PayPal-blue.svg)](https://www.paypal.com/donate/?business=9QSRV22WNLFS6&no_recurring=0&currency_code=USD)

## Quick Start

### Installation (Open VSX Marketplace)

1. Open VS Code or Windsurf
2. Navigate to Extensions view (Ctrl+Shift+X)
3. Search for "SWEObeyMe"
4. Click Install

### Installation (Windsurf-Next)

1. Ensure Windsurf-Next (Phoenix Alpha Fast) or later is installed
2. Clone or download this repository
3. Install dependencies:
   ```bash
   npm install
   ```
4. The extension will automatically configure the MCP server on activation

### Prerequisites

- Node.js 18.0.0 or higher
- Windsurf Next (Phoenix Alpha Fast) or later with ESM support
- Git (for some features)

### First Steps

After installation, SWEObeyMe automatically configures the MCP server. The extension will:

- Automatically write MCP configuration to `~/.codeium/mcp_config.json`
- Enable surgical governance tools for AI models
- Start enforcing architectural rules on file operations
- Provide C# diagnostics for .NET projects

### Basic Usage

SWEObeyMe works transparently with AI models. The system automatically:

- Validates file operations before execution
- Enforces line count limits (max 700 lines per file)
- Prevents forbidden patterns (console.log, TODO, debugger)
- Maintains automatic backups before file writes
- Provides real-time C# error detection

No manual configuration is required for basic usage.

---

> **⚠️ Important Usage Note:** SWEObeyMe is designed for use with **free AI models** and will function correctly on all models. However, due to its comprehensive validation, enforcement, and workflow automation features, it may result in **higher than normal credit consumption** on premium/paid models. The system performs extensive validation, maintains persistent project memory, and enforces strict discipline through multiple tool calls - all of which consume additional tokens. If you're using a paid model, be aware that credit usage may be significantly higher than with basic coding assistants.

A comprehensive Model Context Protocol (MCP) server designed specifically for SWE-1.5 and other AI models to enforce surgical coding standards and prevent technical debt.

## What is SWEObeyMe?

SWEObeyMe is a surgical governance system that integrates seamlessly with Windsurf, enabling AI models to perform software engineering tasks while maintaining strict architectural standards. It enforces file size limits, prevents forbidden patterns, and ensures code quality through automated validation and enforcement.

The system intercepts all VS Code workspace operations and routes them through MCP tools, ensuring AI models cannot bypass your architectural rules or make uncontrolled changes to your codebase. This zero-trust architecture forces AI to use surgical tools for all file operations, validate changes before applying them, follow your architectural blueprint exactly, and maintain predictable, reliable execution.

## Why It Exists

AI models often struggle with maintaining architectural discipline when working on complex codebases. Common issues include:

- Ignoring established coding standards and conventions
- Creating files that exceed reasonable size limits
- Introducing forbidden patterns (console.log, TODO comments, debugger)
- Losing context across long coding sessions
- Making changes without proper validation
- Hallucinating file paths or tool names
- Failing to follow project-specific architectural rules

SWEObeyMe addresses these issues by enforcing surgical governance at every step. The system provides comprehensive validation, persistent project memory, and automated enforcement to ensure AI models maintain the highest standards of code quality and architectural compliance.

## Key Features (Public Build)

### Governor Pattern
Intercepts all VS Code workspace operations and routes them through MCP tools, forcing AI to use surgical tools, validate changes, follow architectural blueprints, and maintain predictable execution. Zero-trust architecture prevents AI from bypassing governance.

### Workflow Automation
- **Rule Engine**: 7 strict behavior rules (search-before-edit, explain-before-act, tools-before-manual, no-hallucination, maintain-project-map, follow-conventions, documentation-required)
- **Persistent Project Memory**: Automatic structure indexing, convention detection, decision recording, file purpose tracking
- **Fallback Behavior System**: Intelligent strategies for 7 failure types with context-aware suggestions
- **Anti-Hallucination Protection**: Path verification, file existence checks, tool validation
- **Tool Priority System**: SWEObeyMe tools ranked above Windsurf built-ins
- **Proactive Tool Suggestions**: Context-aware recommendations in all responses

### Core Surgical Governance
Surgical plan validation, smart file operations with automatic backups, code quality enforcement with forbidden pattern detection, atomic backup operations with verification, workflow orchestration, and architectural drift detection.

### Advanced Capabilities
Loop detection, auto-repair of JSON/code formatting, session memory tracking, recovery mode for stuck operations, refactoring tools (move blocks, extract modules), and file health analysis for code smells.

### C# .NET 8/10 Enhancements
Bracket validation, complexity analysis, try-catch detection, async/await validation, resource management (missing using statements), math safety (overflow, division by zero), scope visualization, and comprehensive C# health scoring.

### File Management
File registry system, duplicate detection, operation audit with time-based deduplication, reference validation, same-name detection, similar file detection, project integrity validation, and fast search across thousands of files.

### Tool Success Metrics & Implementation Philosophy
- **Tool Success Metrics**: Comprehensive tracking with `get_tool_metrics` tool (call counts, success rates, error types, performance metrics)
- **Implementation Philosophy Rules**: 3 enforcement rules (IMPLEMENT_DIRECTLY, INFORM_AFTER_IMPLEMENT, NO_FAKE_IMPLEMENTATIONS) preventing stubs, placeholders, and unnecessary user prompts
- **Implementation Decision Tree**: Guides AI on when to implement directly vs ask user

## Installation

### Open VSX Marketplace

1. Open VS Code or Windsurf
2. Navigate to Extensions view (Ctrl+Shift+X)
3. Search for "SWEObeyMe"
4. Click Install

### Windsurf-Next

1. Ensure Windsurf-Next (Phoenix Alpha Fast) or later is installed
2. Clone or download this repository
3. Install dependencies:
   ```bash
   npm install
   ```
4. The extension will automatically configure the MCP server on activation

### Prerequisites

- Node.js 18.0.0 or higher
- Windsurf Next (Phoenix Alpha Fast) or later with ESM support
- Git (for some features)

## MCP Auto-Configuration

The VS Code extension automatically configures the MCP server on activation. Manual configuration is not required in most cases.

The extension uses an atomic read-modify-write pattern to preserve your existing MCP server configuration while adding SWEObeyMe. Configuration is written to `~/.codeium/mcp_config.json` (or `~/.windsurf/mcp_config.json` depending on your setup).

### Environment Variables

- `NODE_ENV`: Set to 'production' for production use
- `SWEOBEYME_BACKUP_DIR`: Custom backup directory (default: `%LOCALAPPDATA%\SWEObeyMe\.sweobeyme-backups`)
- `SWEOBEYME_DEBUG`: Set to '1' for debug logging

## Usage Guide

### Available Tools

The server provides 70+ surgical governance tools organized into categories:

- **Core Surgical Tools (19)**: obey_me_status, obey_surgical_plan, enforce_surgical_rules, auto_repair_submission, get_session_context, get_workflow_status, get_architectural_directive, query_the_oracle, read_file, write_file, list_directory, dry_run_write_file, validate_change_before_apply, diff_changes, get_file_context, verify_syntax, analyze_change_impact, get_symbol_references, enforce_strict_mode

- **Configuration Tools (4)**: get_config, set_config, reset_config, get_config_schema

- **Validation Tools (4)**: check_for_anti_patterns, validate_naming_conventions, verify_imports, check_for_repetitive_patterns

- **Safety Tools (3)**: check_test_coverage, confirm_dangerous_operation, check_for_repetitive_patterns

- **Feedback Tools (6)**: require_documentation, generate_change_summary, explain_rejection, suggest_alternatives, get_historical_context, get_operation_guidance

- **C# .NET 8/10 Tools (10)**: validate_csharp_code, validate_csharp_brackets, analyze_csharp_complexity, detect_nested_try_catch, visualize_scope_depth, validate_math_safety, analyze_math_expressions, validate_csharp_math, suggest_math_improvements, csharp_health_check

- **Project Integrity Tools (9)**: index_project_files, check_file_duplicates, validate_file_references, check_recent_operations, validate_before_write, get_registry_stats, search_files, generate_audit_report, check_file_exists

- **Project Memory Tools (5)**: index_project_structure, analyze_project_conventions, get_project_memory_summary, record_project_decision, suggest_file_location

- **Tool Metrics (1)**: get_tool_metrics

### Surgical Rules

- **Line Count Limit**: Maximum 700 lines per file
- **Forbidden Patterns**: console.log, TODO comments, debugger, eval()
- **Mandatory Backups**: Automatic backup of existing files before writes
- **Loop Detection**: Prevents repetitive writes to the same file
- **Auto-Correction**: Automatically removes forbidden patterns
- **Duplicate Prevention**: Prevents duplicate file creation
- **Reference Validation**: Ensures all imports/references exist

### Example Usage

#### Validate Surgical Plan
```json
{
  "tool": "obey_surgical_plan",
  "arguments": {
    "target_file": "index.js",
    "current_line_count": 650,
    "estimated_addition": 100
  }
}
```

#### Read File with Context
```json
{
  "tool": "read_file",
  "arguments": {
    "path": "./src/index.js"
  }
}
```

#### Write File with Validation
```json
{
  "tool": "write_file",
  "arguments": {
    "path": "./src/index.js",
    "content": "// Your code here"
  }
}
```

#### Refactor to Reduce File Size
```json
{
  "tool": "refactor_move_block",
  "arguments": {
    "source_path": "./index.js",
    "target_path": "./lib/utils.js",
    "code_block": "function myLargeFunction() { /* ... */ }"
  }
}
```

## Commands

The extension provides the following commands via the Command Palette (Ctrl+Shift+P):

- `sweObeyMe.restartMCP` - Restart the MCP server
- `sweObeyMe.openSettings` - Open extension settings
- `sweObeyMe.clearBackups` - Clear all backup files
- `sweObeyMe.showMetrics` - Show tool usage metrics
- `sweObeyMe.validateProject` - Validate entire project for compliance
- `sweObeyMe.generateReport` - Generate compliance report

## Configuration Options

### Project Configuration Files

- `.sweobeyme-contract.md`: Project-specific architectural rules
- `.sweignore`: Files to exclude from AI context

### Extension Settings

Configure via VS Code settings:

```json
{
  "sweObeyMe.maxLines": 700,
  "sweObeyMe.warningThreshold": 650,
  "sweObeyMe.maxBackupsPerFile": 10,
  "sweObeyMe.enableAutoCorrection": true,
  "sweObeyMe.debugLogs": false,
  "sweObeyMe.enableLoopDetection": true,
  "sweObeyMe.minDocumentationRatio": 0.1,
  "sweObeyMe.csharpBridge.enabled": true,
  "sweObeyMe.csharpBridge.keepAiInformed": true,
  "sweObeyMe.csharpBridge.severityThreshold": 50
}
```

## C# Bridge Diagnostics

The C# Bridge provides real-time error detection for .NET projects with the following capabilities:

### Error Detection Categories

- **Missing Using Statements**: Detects unused using directives
- **Empty Catch Blocks**: Identifies silent error handling
- **Deep Nesting**: Flags excessive indentation complexity
- **Async/Await Issues**: Validates proper async patterns
- **Resource Leaks**: Detects missing IDisposable disposal
- **Math Safety**: Identifies overflow and division by zero risks
- **Null Reference**: Flags potential null dereference
- **Static Mutation**: Detects unsafe static state changes
- **String Concatenation**: Flags inefficient string building
- **Cross-Thread Access**: Detects thread-safety violations

### Features

- **Severity-Based Coloring**: Red (Critical), Orange (Warning), Cyan (Info)
- **Confidence Scoring**: Multi-factor scoring (0-100) based on pattern strength
- **Deduplication**: SHA256-based grouping to prevent duplicate alerts
- **Cooldown Mechanism**: Time-based throttling (default 30s)
- **Keep AI Informed**: Automatic error injection into file reads
- **Integrity Report**: Detailed error context in relation to architectural rules

### MCP Tools

- `get_csharp_errors`: Returns current errors in workspace
- `get_csharp_errors_for_file`: Returns errors for specific file
- `get_integrity_report`: Returns detailed integrity report
- `toggle_csharp_error_type`: Enable/disable specific error checks
- `set_csharp_ai_informed`: Toggle automatic error injection
- `undo_last_surgical_edit`: Revert file to last state with high integrity

## Checkpoints System

The checkpoints system provides version control for file states, allowing you to save and restore file states at any point.

### Features

- **Checkpoint Creation**: Save current file state with metadata
- **Checkpoint Restoration**: Restore files to previous states
- **Checkpoint Validation**: Verify checkpoint integrity
- **Checkpoint Recovery**: Recover from corrupted checkpoints
- **Concurrent Checkpoints**: Handle multiple simultaneous checkpoints
- **Checkpoint Pruning**: Automatic cleanup of old checkpoints

### MCP Tools

- `create_checkpoint`: Create a checkpoint for current state
- `restore_checkpoint`: Restore files from a checkpoint
- `list_checkpoints`: List all available checkpoints
- `validate_checkpoint`: Verify checkpoint integrity
- `delete_checkpoint`: Delete a checkpoint

## Diff Review System

The diff review system provides comprehensive change visualization and approval workflows.

### Features

- **Change Visualization**: Line-by-line diff display
- **Change Approval**: Approve or reject changes
- **Change Summary**: Generate change summaries
- **Impact Analysis**: Analyze change impact on dependencies
- **Change History**: Track all changes across sessions

### MCP Tools

- `diff_changes`: Generate diff between current and proposed changes
- `review_changes`: Review and approve/reject changes
- `generate_change_summary`: Generate summary of changes
- `analyze_change_impact`: Analyze impact of proposed changes

## Provider Support

SWEObeyMe supports multiple AI model providers:

### Supported Providers

- **Ollama**: Local models (llama3, mistral, codellama, etc.)
- **OpenAI**: GPT-4, GPT-4 Turbo, GPT-3.5 Turbo
- **Anthropic**: Claude 3 Opus, Claude 3 Sonnet, Claude 3 Haiku

### Configuration

Configure your preferred provider in Windsurf settings. SWEObeyMe works with any provider that supports MCP protocol.

### Performance Considerations

Due to comprehensive validation and enforcement features, credit consumption may be higher on paid models compared to basic coding assistants. This is normal and expected behavior given the extensive validation, persistent project memory, and strict discipline enforcement.

## Skills Marketplace Integration

The skills marketplace provides community-contributed tool extensions and workflows.

### Features

- **Skill Discovery**: Browse available skills and tools
- **Skill Installation**: Install community skills
- **Skill Management**: Enable/disable installed skills
- **Skill Sharing**: Contribute custom skills to the marketplace

### MCP Tools

- `list_skills`: List available marketplace skills
- `install_skill`: Install a skill from the marketplace
- `enable_skill`: Enable an installed skill
- `disable_skill`: Disable an installed skill

## Project Awareness Layer

The project awareness layer automatically detects project switches and applies project-specific constraints.

### Features

- **Automatic Project Detection**: Detects when you switch between projects
- **Context Switching**: Maintains separate context for each project
- **Project-Specific Rules**: Applies different architectural rules per project
- **Project State Maintenance**: Preserves project state across sessions
- **Project Health Analysis**: Analyzes overall project health

### MCP Tools

- `detect_project`: Detect current project context
- `switch_project`: Switch to different project context
- `get_project_state`: Get current project state
- `analyze_project_health`: Analyze project health metrics

## Project Integrity Tools

Project integrity tools ensure your codebase remains healthy and maintainable.

### Features

- **Duplicate Detection**: Identifies duplicate files and code
- **Reference Validation**: Ensures all imports/references exist
- **Operation Audit**: Tracks all file operations with timestamps
- **File Registry**: Maintains registry of all project files
- **Similar File Detection**: Identifies similar files that may need consolidation

### MCP Tools

- `index_project_files`: Index all project files
- `check_file_duplicates`: Check for duplicate files
- `validate_file_references`: Validate all file references
- `check_recent_operations`: Check recent file operations
- `validate_before_write`: Validate before file write
- `get_registry_stats`: Get file registry statistics
- `search_files`: Search across project files
- `generate_audit_report`: Generate operation audit report
- `check_file_exists`: Check if file exists

## Reference Validation System

The reference validation system ensures all imports, requires, and file references are valid.

### Features

- **Import Validation**: Validates all import statements
- **File Reference Validation**: Ensures referenced files exist
- **Circular Dependency Detection**: Detects circular dependencies
- **Broken Reference Reporting**: Reports all broken references
- **Auto-Fix Suggestions**: Suggests fixes for broken references

### MCP Tools

- `verify_imports`: Validate all imports in code
- `validate_references`: Validate file references
- `detect_circular_deps`: Detect circular dependencies
- `report_broken_refs`: Report broken references

## Publish Validator

The publish validator ensures your code is ready for production deployment.

### Features

- **Pre-Publish Validation**: Comprehensive validation before publishing
- **Build Verification**: Verifies build process succeeds
- **Dependency Validation**: Validates all dependencies
- **Security Scanning**: Scans for security vulnerabilities
- **Performance Analysis**: Analyzes performance characteristics

### MCP Tools

- `validate_publish`: Validate code for publishing
- `check_build`: Verify build process
- `validate_dependencies`: Validate all dependencies
- `scan_security`: Scan for security issues
- `analyze_performance`: Analyze performance

## Git Integration

SWEObeyMe integrates with Git for enhanced workflow automation.

### Features

- **Branch Management**: Manage Git branches
- **Commit Message Generation**: Generate commit messages
- **Pre-Commit Hooks**: Validate changes before commit
- **Git Operations**: Perform common Git operations
- **Hot-Reload**: Reload extension files without restarting

### MCP Tools

- `git_branch_info`: Get current branch information
- `git_commit_message`: Generate commit message
- `git_pre_commit_validate`: Validate before commit
- `git_status`: Get Git status
- `git_diff`: Get Git diff

## Hot Reload

Hot reload allows you to make changes to extension files without restarting the entire extension.

### Features

- **Automatic Detection**: Detects file changes
- **Live Reloading**: Reloads changed files automatically
- **State Preservation**: Preserves state across reloads
- **Error Recovery**: Handles reload errors gracefully

### Usage

Simply save changes to extension files. The extension will automatically detect changes and reload the affected modules.

## Troubleshooting

### Common Issues

1. **MCP server not loading**: Check if extension is activated and configured
2. **File write rejected**: Check line count and forbidden patterns
3. **Duplicate server detected**: Extension will clean up stale instances automatically
4. **Backup failed**: Check backup directory permissions
5. **C# Bridge not working**: Ensure .NET project is properly configured

### Debug Mode

Enable debug logging by setting:
```bash
export SWEOBEYME_DEBUG=1
```

### Logs

Check the following locations for logs:
- Console output for real-time logs
- Extension output channel for extension logs
- Backup directory for operation logs

### Performance Issues

If experiencing slow performance:
- Disable C# Bridge if not working with .NET projects
- Reduce maxBackupsPerFile setting
- Disable loop detection for large projects
- Use minimal configuration for rapid prototyping

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for complete version history and detailed release notes.

## License

SWEObeyMe is dual-licensed. You may choose to use this software under either license:

### License A: SWEObeyMe Community License (Free)

**Free Use Permitted For:**
- Individual developers
- Independent developers / indie devs
- Companies with annual revenue under $10M USD
- Research and academic use
- Educational institutions and students
- Open source projects

**Terms:**
- Free to use, modify, and distribute
- Attribution required
- No warranty provided (as-is)

### License B: SWEObeyMe Enterprise License (Commercial)

**Required For:**
- Companies with annual revenue over $10M USD
- Enterprise deployments (large-scale internal use)
- Commercial integration in enterprise products
- Redistribution as part of commercial offerings
- SaaS platforms using SWEObeyMe

**Contact for Enterprise License:**
- Email: stonewolfpc@github.com
- GitHub: https://github.com/stonewolfpc/SWEObeyMe

See [LICENSE](LICENSE) file for complete details.
