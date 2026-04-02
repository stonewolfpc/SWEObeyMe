# SWEObeyMe MCP Server

> **v1.0.13 Major Update (April 2026):** Massive enhancement for complex C# .NET 8/10 projects and massive file management! Includes comprehensive C# validation (bracket matching, complexity analysis, math safety), file registry system to prevent duplication, operation audit tracking, and reference validation. Perfect for large-scale enterprise projects with thousands of files.

A comprehensive Model Context Protocol (MCP) server designed specifically for SWE-1.5 and other AI models to enforce surgical coding standards and prevent technical debt.

## Overview

SWEObeyMe is a surgical governance system that integrates seamlessly with Windsurf, enabling AI models to perform software engineering tasks while maintaining strict architectural standards. It enforces file size limits, prevents forbidden patterns, and ensures code quality through automated validation and enforcement.

## Features

### 🔧 Core Surgical Governance Tools

- **Surgical Plan Validation**: Validates code changes against architectural rules before execution
- **Smart File Operations**: Intelligent file management with automatic backups and validation
- **Code Quality Enforcement**: Automatic detection and correction of forbidden patterns
- **Backup System**: Atomic backup operations with verification and retention management
- **Workflow Orchestration**: Multi-step surgical workflow management
- **Architectural Drift Detection**: Monitors and alerts on code quality degradation

### 🚀 Advanced Capabilities

- **Loop Detection**: Prevents repetitive operations on the same file
- **Auto-Repair**: Automatically repairs common JSON and code formatting issues
- **Session Memory**: Tracks all actions for accountability and audit
- **Recovery Mode**: Resets session state when operations get stuck
- **Refactoring Tools**: Move code blocks and extract modules while maintaining compliance
- **Health Analysis**: Analyzes file health for code smells and complexity

### � C# .NET 8/10 Enhancements (NEW in v1.0.13)

- **Bracket Validation**: Detects bracket mismatches and missing closing braces
- **Complexity Analysis**: Analyzes cyclomatic complexity and nesting depth
- **Try-Catch Detection**: Identifies deeply nested try-catch blocks
- **Async/Await Validation**: Ensures proper async/await patterns
- **Resource Management**: Checks for missing using statements for IDisposable
- **Math Safety**: Validates mathematical expressions for overflow, precision loss, and division by zero risks
- **Scope Visualization**: Visualizes nesting depth with tree structure
- **C# Health Check**: Comprehensive health scoring for C# files

### 📁 File Management Enhancements (NEW in v1.0.13)

- **File Registry System**: Comprehensive indexing of all project files
- **Duplicate Detection**: Prevents creating duplicate files with identical content
- **Operation Audit**: Tracks all file operations with time-based deduplication
- **Reference Validation**: Ensures all imports/references exist before operations
- **Same Name Detection**: Prevents creating files with same name in directory
- **Similar File Detection**: Identifies potentially duplicate files by name similarity
- **Project Integrity**: Comprehensive pre-write validation to prevent chaos
- **Search & Indexing**: Fast file search across thousands of files

### �️ Architecture Improvements (v1.0.13)

- **Modular Code Structure**: Refactored from 944-line monolith to modular architecture
- **Enhanced Backup System**: Atomic operations, hash verification, concurrent handling
- **MCP Lifecycle Management**: PID tracking, duplicate detection, graceful shutdown
- **Tool Compliance**: Comprehensive tool descriptions with dependencies and ordering guidance
- **Enhanced Context Analysis**: Complexity metrics and scoring for all files
- **Automatic Duplication Prevention**: Built into write_file handler

## Installation

### Prerequisites

- Node.js 18.0.0 or higher
- Windsurf IDE with MCP support (March 2026 update or later)
- Git (for some features)

### Setup

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the project:
   ```bash
   npm run build
   ```
4. Install the VS Code extension (included in this repository)
5. Configure Windsurf to use the MCP server (see Configuration section)

## Configuration

### Windsurf Integration

The VS Code extension automatically configures the MCP server on activation. Manual configuration:

```json
{
  "mcpServers": {
    "swe-obey-me": {
      "command": "node",
      "args": ["--no-warnings", "file:///d:/SWEObeyMe-restored/index.js"],
      "env": {
        "NODE_ENV": "production",
        "SWEOBEYME_BACKUP_DIR": "C:/Users/YourName/AppData/Local/SWEObeyMe/.sweobeyme-backups",
        "SWEOBEYME_DEBUG": "0"
      },
      "disabled": false
    }
  }
}
```

### Environment Variables

- `NODE_ENV`: Set to 'production' for production use
- `SWEOBEYME_BACKUP_DIR`: Custom backup directory (default: `%LOCALAPPDATA%\SWEObeyMe\.sweobeyme-backups`)
- `SWEOBEYME_DEBUG`: Set to '1' for debug logging

### Project Configuration Files

- `.sweobeyme-contract.md`: Project-specific architectural rules
- `.sweignore`: Files to exclude from AI context

## Usage

### Available Tools

The server provides **65 surgical governance tools** organized into categories:

#### Core Surgical Tools (19)
1. **obey_me_status** - Check server status and compliance
2. **obey_surgical_plan** - Validate surgical plan before execution
3. **enforce_surgical_rules** - Enforce code quality rules
4. **auto_repair_submission** - Auto-repair common code issues
5. **get_session_context** - Get current session context
6. **get_workflow_status** - Check workflow status
7. **get_architectural_directive** - Get architectural guidance
8. **query_the_oracle** - Query the oracle for wisdom
9. **read_file** - Read file with context
10. **write_file** - Write file with validation (now includes duplication prevention)
11. **list_directory** - List directory contents
12. **dry_run_write_file** - Test write without committing
13. **validate_change_before_apply** - Validate changes before applying
14. **diff_changes** - Show diff between versions
15. **get_file_context** - Get comprehensive file context (now includes complexity metrics)
16. **verify_syntax** - Verify code syntax
17. **analyze_change_impact** - Analyze impact of changes
18. **get_symbol_references** - Find symbol references
19. **enforce_strict_mode** - Enable strict enforcement

#### Configuration Tools (4)
20. **get_config** - Get configuration values
21. **set_config** - Set configuration values
22. **reset_config** - Reset configuration to defaults
23. **get_config_schema** - Get configuration schema

#### Validation Tools (4)
24. **check_for_anti_patterns** - Check for code anti-patterns
25. **validate_naming_conventions** - Validate naming conventions
26. **verify_imports** - Verify import statements
27. **check_for_repetitive_patterns** - Check for repetitive patterns

#### Context Tools (2)
28. **diff_changes** - Show diff between versions
29. **get_file_context** - Get comprehensive file context

#### Safety Tools (3)
30. **check_test_coverage** - Check test coverage
31. **confirm_dangerous_operation** - Confirm dangerous operations
32. **check_for_repetitive_patterns** - Check for repetitive patterns

#### Feedback Tools (4)
33. **require_documentation** - Require documentation
34. **generate_change_summary** - Generate change summary
35. **explain_rejection** - Explain why an operation was rejected
36. **suggest_alternatives** - Suggest alternatives to rejected operations
37. **get_historical_context** - Get historical context
38. **get_operation_guidance** - Get operation guidance
39. **run_related_tests** - Run related tests

#### C# .NET 8/10 Tools (10) - NEW in v1.0.13
40. **validate_csharp_code** - Comprehensive C# code validation
41. **validate_csharp_brackets** - Validate bracket matching
42. **analyze_csharp_complexity** - Analyze C# code complexity
43. **detect_nested_try_catch** - Detect deeply nested try-catch blocks
44. **visualize_scope_depth** - Visualize nesting depth
45. **validate_math_safety** - Validate mathematical expressions
46. **analyze_math_expressions** - Analyze math expressions
47. **validate_csharp_math** - Validate C# math patterns
48. **suggest_math_improvements** - Suggest math improvements
49. **csharp_health_check** - Comprehensive C# health check

#### Project Integrity Tools (9) - NEW in v1.0.13
50. **index_project_files** - Index all project files into registry
51. **check_file_duplicates** - Check for duplicate files
52. **validate_file_references** - Validate file references exist
53. **check_recent_operations** - Check for recent/redundant operations
54. **validate_before_write** - Comprehensive pre-write validation
55. **get_registry_stats** - Get file registry statistics
56. **search_files** - Search files in registry
57. **generate_audit_report** - Generate operation audit report
58. **check_file_exists** - Check if file exists in registry

### Surgical Rules

- **Line Count Limit**: Maximum 700 lines per file
- **Forbidden Patterns**: console.log, TODO comments, debugger, eval()
- **Mandatory Backups**: Automatic backup of existing files before writes
- **Loop Detection**: Prevents repetitive writes to the same file
- **Auto-Correction**: Automatically removes forbidden patterns
- **Duplicate Prevention**: Prevents duplicate file creation (NEW in v1.0.13)
- **Reference Validation**: Ensures all imports/references exist (NEW in v1.0.13)

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

## Architecture

### Project Structure (v1.0.13)

```
SWEObeyMe-restored/
├── index.js                 # Main entry point (156 lines, refactored)
├── extension.js             # VS Code extension with lifecycle management
├── lib/
│   ├── utils.js            # Utility functions (URI normalization, backup dir)
│   ├── backup.js           # Enhanced backup system (atomic, verified, concurrent)
│   ├── enforcement.js      # Validation rules and enforcement logic
│   ├── session.js          # Session memory and action recording
│   ├── project.js          # Project configuration (contract, .sweignore)
│   ├── workflow.js         # Workflow orchestration
│   ├── tools.js            # Tool initialization and quotes
│   └── tools/
│       ├── handlers.js     # Tool implementations (387 lines)
│       └── registry.js     # Tool definitions with dependencies (222 lines)
├── quotes.js               # Oracle quotes
├── .sweignore              # Default ignore patterns
├── package.json            # Dependencies and scripts
└── README.md               # This file
```

### Key Improvements in v1.0.13

**Modular Architecture**
- Reduced index.js from 944 to 156 lines (83% reduction)
- Extracted logical modules for maintainability
- Single responsibility principle applied throughout

**Enhanced Backup System**
- Atomic file operations using temp files
- SHA-256 hash verification for backup integrity
- Concurrent operation handling with write locks
- Automatic retention management (max 10 backups per file)
- Comprehensive error logging

**MCP Lifecycle Management**
- PID file tracking for duplicate detection
- Automatic cleanup of stale instances
- Graceful shutdown without process.exit()
- Extension reload support (no need to disable/uninstall)
- Configuration change detection and auto-restart

**Tool Compliance**
- Comprehensive tool descriptions with dependencies
- Ordering guidance (e.g., obey_surgical_plan before write_file)
- Progressive enforcement hints
- Recovery mechanisms for stuck sessions

## Development

### Scripts

- `npm run build`: Build the project
- `npm start`: Start the MCP server
- `npm test`: Run tests
- `npm run lint`: Lint the code
- `npm run format`: Format the code
- `npm run commit`: Interactive commit with Commitizen
- `npm run release`: Create a new release with standard-version

### Professional Standards

This project follows industry best practices for professional software development:

- **Git Flow Branching Strategy**: main, develop, feature/*, fix/*, hotfix/*, release/*
- **Conventional Commits**: Enforced with commitlint and Commitizen
- **Automated CI/CD**: GitHub Actions for linting, testing, and releases
- **Code Quality**: ESLint, Prettier, and pre-commit hooks
- **Automated Testing**: Jest with coverage thresholds
- **Semantic Versioning**: Automated with standard-version
- **Documentation**: Comprehensive branching, hotfix, and contribution guides

See `BRANCHING.md`, `HOTFIX.md`, and `CONTRIBUTING.md` for details.

## Security Considerations

- File operations restricted to workspace directory
- Read-only backup files to prevent accidental modification
- All operations logged for audit purposes
- Write locks prevent concurrent operations
- Hash verification ensures backup integrity

## Troubleshooting

### Common Issues

1. **MCP server not loading**: Check if extension is activated and configured
2. **File write rejected**: Check line count and forbidden patterns
3. **Duplicate server detected**: Extension will clean up stale instances automatically
4. **Backup failed**: Check backup directory permissions

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

## Contributing

1. Fork the repository
2. Create a feature branch from `develop`
3. Make your changes following the coding standards
4. Add tests for new functionality
5. Ensure all tests pass and coverage thresholds are met
6. Commit using conventional commits (use `npm run commit`)
7. Submit a pull request

See `CONTRIBUTING.md` for detailed guidelines.

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation
- Read the branching and contribution guidelines

## Changelog

### [1.0.13] - 2026-04-02

#### Major Refactoring
- **Reduced index.js from 944 to 156 lines** (83% reduction) by extracting logical modules
- Created modular architecture with `lib/` directory structure:
  - `lib/utils.js` - URI normalization and backup directory utilities
  - `lib/backup.js` - Enhanced backup system with atomic operations
  - `lib/enforcement.js` - Validation rules and enforcement logic
  - `lib/session.js` - Session memory and action recording
  - `lib/project.js` - Project configuration and .sweignore handling
  - `lib/workflow.js` - Workflow orchestration
  - `lib/tools.js` - Tool initialization and quotes
  - `lib/tools/handlers.js` - Tool implementations (387 lines)
  - `lib/tools/registry.js` - Tool definitions with dependencies (222 lines)
- All source files now under 500 lines (largest: lib/tools/handlers.js at 387 lines)

#### Enhanced Backup System
- **Atomic file operations** using temp files for safe writes
- **SHA-256 hash verification** for backup integrity
- **Concurrent operation handling** with write locks and duplicate prevention
- **Automatic retention management** (max 10 backups per file)
- **Enhanced error logging** with detailed context
- **Backup statistics API** with `listBackups()` and `getBackupStats()` functions
- Write lock timeout (30 seconds) to prevent deadlocks

#### MCP Server Lifecycle Management
- **PID file tracking** for duplicate detection
- **Automatic cleanup of stale instances** on extension activation
- **Graceful shutdown** without process.exit() calls
- **Extension reload support** - no need to disable/uninstall
- **Configuration change detection** with auto-restart
- New `sweObeyMe.restartMCP` command for manual restarts
- Preserved MCP config on deactivation for seamless reload

#### Tool Compliance Improvements
- **Comprehensive tool descriptions** with dependencies and ordering guidance
- **CRITICAL/MUST keywords** to enforce proper tool usage sequences
- **Progressive enforcement hints** with actionable alternatives
- **Recovery mechanisms** for stuck sessions
- **Workflow guidance** for complex multi-step operations
- Enhanced descriptions for all 19 tools with examples

#### Bug Fixes
- **Fixed .cz-config.js syntax errors** - converted from JSON to proper JavaScript format
- Fixed import path errors in lib/tools.js (changed "../utils.js" to "./utils.js")
- Corrected import paths in lib/tools/handlers.js for all lib modules

#### Documentation
- Updated README.md with comprehensive v1.0.13 improvements
- Updated project structure documentation
- Added architecture improvements section
- Enhanced troubleshooting guide
- Added professional standards section

### [1.0.12] - 2026-04-01
- Updated version references
- Version alignment across all project files
