# SWEObeyMe MCP Server

> **v1.1.0 C# Bridge (April 2026):** Enhanced C# error detection with pattern-based analysis, Surgical Integrity Score throttling for AI awareness, diagnostic rainbow coloring, get_integrity_report tool, undo_last_surgical_edit rollback tool, and MCP integration for automatic error injection.

A comprehensive Model Context Protocol (MCP) server designed specifically for SWE-1.5 and other AI models to enforce surgical coding standards and prevent technical debt.

## Overview

SWEObeyMe is a surgical governance system that integrates seamlessly with Windsurf, enabling AI models to perform software engineering tasks while maintaining strict architectural standards. It enforces file size limits, prevents forbidden patterns, and ensures code quality through automated validation and enforcement.

### The Governor Pattern

**NEW in v1.0.17:** The Governor Pattern is an enforcement mechanism that intercepts all VS Code workspace operations and routes them through MCP tools. This ensures AI models cannot bypass your architectural rules or make uncontrolled changes to your codebase. The system forces AI to:

- Use surgical tools for all file operations
- Validate changes before applying them
- Follow your architectural blueprint exactly
- Never hallucinate or deviate from defined toolsets
- Maintain predictable, reliable execution

## Features

### 🏛️ Governor Pattern (NEW in v1.0.17)

- **Workspace Operation Interception**: Overrides `vscode.workspace.fs.writeFile`, `vscode.workspace.fs.rename`, `vscode.workspace.fs.delete`, and `vscode.workspace.applyEdit`
- **MCP Tool Routing**: Routes all operations through MCP surgical tools
- **Architectural Enforcement**: Forces AI models to use your defined toolset
- **Predictable Execution**: Prevents hallucination and deviation from architectural vision
- **Zero Trust Architecture**: AI cannot bypass governance to directly modify files

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

### 🎯 C# .NET 8/10 Enhancements (v1.0.13)

- **Bracket Validation**: Detects bracket mismatches and missing closing braces
- **Complexity Analysis**: Analyzes cyclomatic complexity and nesting depth
- **Try-Catch Detection**: Identifies deeply nested try-catch blocks
- **Async/Await Validation**: Ensures proper async/await patterns
- **Resource Management**: Checks for missing using statements for IDisposable
- **Math Safety**: Validates mathematical expressions for overflow, precision loss, and division by zero risks
- **Scope Visualization**: Visualizes nesting depth with tree structure
- **C# Health Check**: Comprehensive health scoring for C# files

### 📁 File Management Enhancements (v1.0.13)

- **File Registry System**: Comprehensive indexing of all project files
- **Duplicate Detection**: Prevents creating duplicate files with identical content
- **Operation Audit**: Tracks all file operations with time-based deduplication
- **Reference Validation**: Ensures all imports/references exist before operations
- **Same Name Detection**: Prevents creating files with same name in directory
- **Similar File Detection**: Identifies potentially duplicate files by name similarity
- **Project Integrity**: Comprehensive pre-write validation to prevent chaos
- **Search & Indexing**: Fast file search across thousands of files

### 🏗️ Architecture Improvements (v1.0.13)

- **Modular Code Structure**: Refactored from 944-line monolith to modular architecture
- **Enhanced Backup System**: Atomic operations, hash verification, concurrent handling
- **MCP Lifecycle Management**: PID tracking, duplicate detection, graceful shutdown
- **Tool Compliance**: Comprehensive tool descriptions with dependencies and ordering guidance
- **Enhanced Context Analysis**: Complexity metrics and scoring for all files
- **Automatic Duplication Prevention**: Built into write_file handler

## Installation

### Prerequisites

- Node.js 18.0.0 or higher

- Windsurf Next (Phoenix Alpha Fast) or later with ESM support
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

- `npm run package`: Package the extension as a .vsix file
- `npm run publish`: Publish the extension to the VS Code Marketplace
- `npm start`: Start the MCP server directly
- `npm test`: Run all test suites (integration, protocol compliance, schema validation, C# bridge)
- `npm run test:integration`: Run MCP integration tests
- `npm run test:protocol`: Run MCP protocol compliance tests
- `npm run test:schemas`: Run tool schema validation tests
- `npm run test:csharp`: Run C# bridge tool registration tests
- `npm run build`: Placeholder (no build step required for this project)
- `npm run lint`: Placeholder (linting not yet configured)
- `npm run format`: Placeholder (formatting not yet configured)

### Testing

The project includes integration-style tests that can be run manually:

1. **Integration Tests** (`tests/mcp-integration.js`): Tests MCP server functionality including initialize, tool listing, surgical plan validation, and rule enforcement
2. **Protocol Compliance Tests** (`tests/mcp-protocol-compliance.js`): Validates JSON-RPC 2.0 compliance against MCP 2024-11-05 specification
3. **Schema Validation** (`test-tools/test-all-schemas.js`): Validates all tool definitions have proper inputSchema properties
4. **C# Bridge Tests** (`test-tools/test-csharp-tools.js`): Verifies C# bridge tools are registered with handlers

Run all tests with `npm test` or individual suites with the specific npm scripts.

### Professional Standards

This project follows industry best practices for professional software development:

- **Automated CI/CD**: GitHub Actions for testing and packaging
- **Integration Testing**: Manual test suites for MCP protocol compliance and tool validation
- **Modular Architecture**: Clean separation of concerns with lib/ directory structure

Note: Some professional development tools (ESLint, Prettier, commitlint, standard-version) are documented in the README but not yet configured in this project. These can be added as needed.

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

## Support & Feedback

### GitHub Repository
For bug reports, feature requests, and general feedback, please visit:
https://github.com/stonewolfpc/SWEObeyMe

We encourage you to:
- Report issues you encounter
- Suggest new features or improvements
- Share your success stories
- Comment on what's working or not working
- Contribute to the project

### Support Development
If you find SWEObeyMe valuable and would like to support continued development:
https://patreon.com/StoneWolfSystems?utm_medium=unknown&utm_source=join_link&utm_campaign=creatorshare_creator&utm_content=copyLink

Your support helps:
- Maintain and improve the project
- Add new features and capabilities
- Fix bugs and issues
- Keep the project free and open source

## Future Work

### Planned Enhancements

#### Governor Pattern Improvements
- [ ] Full delete operation routing through `confirm_dangerous_operation`
- [ ] Enhanced applyEdit routing with comprehensive validation
- [ ] Workspace-wide operation auditing and reporting
- [ ] Operation rollback capabilities
- [ ] Real-time architectural compliance dashboard

#### Advanced Validation
- [ ] Multi-language support (Python, TypeScript, Go, Rust)
- [ ] Custom architectural rule definitions
- [ ] Pattern-based code generation validation
- [ ] Dependency graph analysis
- [ ] Security vulnerability scanning

#### Integration Enhancements
- [ ] Integration with popular CI/CD pipelines
- [ ] Git hook integration for pre-commit validation
- [ ] VS Code CodeLens integration for quick actions
- [ ] Remote development support
- [ ] Multi-workspace support

#### Performance & Scalability
- [ ] Parallel file processing
- [ ] Distributed caching for large projects
- [ ] Incremental indexing for file registry
- [ ] Memory optimization for massive projects
- [ ] Background operation processing

#### Developer Experience
- [ ] Interactive configuration wizard
- [ ] Visual architectural compliance reports
- [ ] Code smell visualization
- [ ] Refactoring suggestions
- [ ] Interactive learning mode

#### Testing & Quality
- [ ] Automated integration tests
- [ ] Performance benchmarking
- [ ] Load testing for large projects
- [ ] Security audit
- [ ] Code coverage improvements

#### ARES Integration (X-ray Vision for Code)
- [ ] **ARES-lite Integration**: Lightweight version of ARES language codex (100-200MB)
- [ ] **Predictive Error Detection**: X-ray vision that predicts what WILL break, not just what IS broken
- [ ] **Custom Error Trackers**: 90+ error trackers with specific codes (e.g., ARES:002-DEADLOCK)
- [ ] **Custom Warning Trackers**: 120+ warning trackers with specific codes
- [ ] **Runtime Error Prevention**: "I don't see any errors" problem eliminated
- [ ] **Multi-Language Support**: 50-100 most relevant languages (not 1000)
- [ ] **Bridge Validation**: JS-to-C# .NET 10 bridge with comprehensive error tracking
- [ ] **Self-Teaching System**: AI models ask SWEObeyMe for help when stuck
- [ ] **Context-Aware Documentation**: Instant, relevant documentation in model's native language
- [ ] **Sidebar Integration**: Dedicated sidebar icon for ARES features
- [ ] **User Transparency & Control**: Configurable visibility and behavior
- [ ] **.NET 10 Backend**: High-performance .NET 10 service for error tracking and language parsing

#### Community Features
- [ ] Plugin system for custom tools
- [ ] Shared architectural templates
- [ ] Community rule library
- [ ] Best practices documentation
- [ ] Tutorial series

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

## Changelog

### [1.2.1] - 2026-04-05

#### AI First-Pass Success Enhancements
- **Fixed validation correctness** - Replaced incorrect `fs.existsSync` with proper async `fs.access` in `validateImports` function
- **Added preflight workflow tool** - New `preflight_change` tool orchestrates complete validation sequence (get_file_context → analyze_change_impact → verify_imports → check_test_coverage → dry_run_write_file) before file writes
- **Enhanced read_file context injection** - Added compact project map, file dependency hints, and suggested next tools to every file read operation
- **Added project AI index** - Created `AI_INDEX.md` providing instant orientation guide with entry points, core architecture, critical workflows, and common pitfalls
- **Added golden regression tests** - Created `test-tools/golden-regression-tests.js` for testing expected success/failure outputs of critical tools
- **Tightened tool guidance text** - Enhanced descriptions for key tools (obey_surgical_plan, read_file, write_file, get_file_context, analyze_change_impact) with decision-oriented guidance including "use this when", "do not use this if", and "best next tool"
- **Total tools**: 63 MCP tools (up from 62 in v1.2.0)

**Context**: These improvements enhance the AI's ability to perform tasks correctly on the first attempt by providing better context, mandatory validation workflows, and clearer decision-oriented tool guidance.

### [1.2.0] - 2026-04-05

#### Dual Licensing Model
- **SWEObeyMe Community License (Free)**: Free for individuals, indie devs, companies under $10M revenue, research, and education
- **SWEObeyMe Enterprise License (Commercial)**: Required for companies over $10M, enterprise deployments, commercial integration, and SaaS platforms
- **License Change**: Transitioned from MIT to dual-licensing model to support sustainable development
- **Contact**: Enterprise license inquiries at stonewolfpc@github.com

### [1.1.5] - 2026-04-05

#### Offline Documentation Suite for AI Development
- **Llama.cpp Documentation**: Added LlamaCpp.net (.NET bindings) and LlamaCppUnity (Unity bindings) documentation with proper Apache 2.0 and MIT license attribution
- **Mathematical Reference Library**: Comprehensive mathematical documentation for AI/ML programming including algorithm complexity, mathematical symbols, linear algebra, probability/statistics, and discrete mathematics
- **Code Search Enhancement**: Added language-aware code search with 18 language support and importance-based ranking
- **Dedicated Search Tools**: 
  - `search_llama_docs` / `list_llama_docs` - Search and list llama.cpp documentation offline
  - `search_math_docs` / `list_math_docs` - Search and list mathematical documentation offline
  - `search_code_files` - Search code with language-aware ranking
  - `get_code_language_stats` - Get project language distribution
  - `search_code_pattern` - Regex pattern search by language
  - `detect_file_language` - Detect language from file extension
  - `find_code_files` - Find files by language
- **Sample Code Examples**: Created example files for C++, Python, Java, Rust, Go, and TypeScript demonstrating language-specific patterns and anti-patterns
- **Total Tools**: 62 MCP tools (up from 58 in v1.1.4)

**Context**: This update provides comprehensive offline documentation for AI development, particularly for users building llama.cpp replacements or working with LLM integration in various programming environments.

### [1.1.4] - 2026-04-05

#### Enhanced C# Bridge with Confidence Scoring & Noise Control
- **Confidence Scoring Pipeline**: Multi-factor scoring (0-100) based on pattern match strength, context analysis, code complexity, and severity
- **Deduplication Service**: SHA256 signature-based grouping to prevent duplicate alerts
- **Cooldown Mechanism**: Time-based throttling with configurable cooldown period (default 30s)
- **Math Safety Detector**: New detector for division by zero risk and overflow patterns
- **VS Code Settings Integration**: Real-time configuration via webview panel (confidence threshold, deduplication, cooldown, detector toggles)
- **Modular UI**: Extracted HTML template for C# settings panel to reduce file line count
- **Test Infrastructure**: Added Jest configuration, comprehensive npm test scripts, GitHub Actions CI workflow
- **Documentation Updates**: Updated README scripts section, testing section, and professional standards

#### Test Tooling Improvements
- Added npm scripts: test, test:integration, test:protocol, test:schemas, test:csharp, build, lint, format, commit
- Created Jest configuration for ESM mode
- Fixed lib/testing.js helper (initialized warnings array, improved error handling)
- Added GitHub Actions CI workflow for automated testing and packaging

### [1.1.3] - 2026-04-05

#### Bug Fixes
- Fixed obey_me_status missing inputSchema property

### [1.1.2] - 2026-04-05

#### Bug Fixes
- Fixed C# Bridge handlers not being registered in toolHandlers object
- Added missing v1.1.0 C# Bridge handlers to MCP server registration
- Fixed fs import in csharp-bridge.js to use fs/promises for async/await
- Fixed null reference errors in error rule check functions (all check functions now handle null matches)
- Fixed invalid inputSchema for 7 MCP tools (get_architectural_directive, get_session_context, get_workflow_status, query_the_oracle, get_config, reset_config, get_config_schema)
- All 6 C# Bridge tools now properly available and tested (get_csharp_errors, get_csharp_errors_for_file, get_integrity_report, toggle_csharp_error_type, set_csharp_ai_informed, undo_last_surgical_edit)

### [1.1.1] - 2026-04-04

#### Bug Fixes
- Fixed regex null check in listBackups function to handle malformed backup filenames
- Fixed error.color undefined check in C# Bridge error injection
- Fixed csharpAnalysis null check in Keep AI Informed feature
- Added defensive checks for global.csharpAiInformed === true

### [1.1.0] - 2026-04-04

#### C# Bridge with Pattern-Based Analysis
- **C# Analysis Engine**: Pattern-based error detection for 11 error categories (missing using, empty catch, deep nesting, unhandled async, IDisposable leaks, string concatenation, null reference, async suffix, event handler leaks, static mutation, cross-thread access)
- **Diagnostic Rainbow**: Severity-based coloring (Red=Critical, Orange=Warning, Cyan=Info, Magenta=Environmental Drift, Purple=Memory Leak, Silver=Ternary State)
- **Environmental Drift Detection**: Ternary Math approach for architectural instability detection (not syntax-illegal but unstable)
- **Edit, Don't Replace Rule**: Only returns broken nodes (line ranges), not entire file

#### MCP Tools for AI Awareness
- `get_csharp_errors`: Returns current errors in workspace with severity colors and line ranges
- `get_csharp_errors_for_file`: Returns errors for specific file with line ranges
- `get_integrity_report`: Returns detailed integrity report with error context in relation to high-value rules
- `toggle_csharp_error_type`: Enable/disable specific error checks
- `set_csharp_ai_informed`: Toggle "Keep AI Informed" feature
- `undo_last_surgical_edit`: Revert file to last state with Integrity Score > 90

#### Surgical Integrity Score Throttling
- **Keep AI Informed**: Automatically injects C# errors into file reads based on severity
- **High-severity (Red)**: Immediate injection into file reads
- **Medium-severity (Orange)**: Inject if Integrity Score > 80
- **Low-severity (Cyan/Silver)**: Wait for explicit tool call (no auto-injection)
- Prevents context-flooding by prioritizing critical errors

#### Configuration
- **Activity Bar Icon**: Added activity bar contribution for C# Bridge settings
- **Configuration Schema**: Added sweObeyMe.csharpBridge.enabled, sweObeyMe.csharpBridge.keepAiInformed, sweObeyMe.csharpBridge.severityThreshold
- **Version bumped to 1.1.0**

### [1.0.20] - 2026-04-04

#### MCP Protocol Built-In Enforcement
- **Enhanced tool descriptions** - Added "MUST use this tool" and "ONLY way" language to critical tools (list_directory, enforce_surgical_rules, validate_change_before_apply, dry_run_write_file, verify_syntax, get_file_context) to emphasize mandatory usage
- **Improved parameter validation** - Added explicit parameter type checking in handlers (obey_surgical_plan, read_file) with specific error messages
- **Actionable error messages** - Enhanced error responses with specific guidance, examples, and next steps (e.g., "Use 'refactor_move_block' or 'extract_to_new_file' to reduce file size")
- **Clearer tool discovery** - Tools now provide examples and context in descriptions to help AI models understand when and how to use them
- **Error recovery guidance** - Error messages include specific tool suggestions and actionable next steps

#### Error Feedback Loops
- **Consecutive failure tracking** - Tracks consecutive errors across all tool calls
- **Constitution reading trigger** - When consecutive failures reach ERROR_THRESHOLD (3), AI is forced to call get_architectural_directive to review the Constitution
- **Learning from failures** - Each failure reduces surgical integrity score, each success increases it
- **Progressive pressure** - More failures = more strict enforcement and stronger guidance

#### Tool Response Design
- **Clear error messages** - Specific error messages with context (e.g., "ERROR: 'target_file' parameter is REQUIRED and must be a string")
- **Actionable guidance** - Error messages include next steps and tool suggestions (e.g., "Call get_architectural_directive before proceeding")
- **Contextual feedback** - Error messages explain what was violated and why (e.g., "This violates project contract section X")
- **Next-step hints** - Suggestions for alternative approaches (e.g., "Try using refactor_move_block for file reorganization")

#### Surgical Integrity Score
- **Visible to AI** - Surgical integrity score is displayed in all tool responses (e.g., "[SURGICAL INTEGRITY: 95/100]")
- **Consequences** - Low score triggers more strict enforcement and Constitution reading
- **Progressive pressure** - More failures = lower score = more forced tool usage
- **Transparent feedback** - AI can see its compliance score and consecutive failure count in real-time
- **Score tracking** - Successes increase score (+1 to +2), failures decrease score (-5 to -15 depending on severity)

#### Configuration
- **Version bumped to 1.0.20**

### [1.0.19] - 2026-04-04

#### MCP Protocol Built-In Enforcement
- **Enhanced tool descriptions** - Added "MUST use this tool" and "ONLY way" language to critical tools (list_directory, enforce_surgical_rules, validate_change_before_apply, dry_run_write_file, verify_syntax, get_file_context) to emphasize mandatory usage
- **Improved parameter validation** - Added explicit parameter type checking in handlers (obey_surgical_plan, read_file) with specific error messages
- **Actionable error messages** - Enhanced error responses with specific guidance, examples, and next steps (e.g., "Use 'refactor_move_block' or 'extract_to_new_file' to reduce file size")
- **Clearer tool discovery** - Tools now provide examples and context in descriptions to help AI models understand when and how to use them
- **Error recovery guidance** - Error messages include specific tool suggestions and actionable next steps

#### Configuration
- **Version bumped to 1.0.19**

### [1.0.18] - 2026-04-04

#### ARES 2026 Professional Standards
- **Applied os.homedir() for cross-platform path resolution** - Replaced process.env.USERPROFILE with os.homedir() for better cross-platform compatibility
- **Added path.resolve() for absolute path guarantees** - Ensures all paths are absolute before file operations
- **Implemented surgical uninstall cleanup** - Added deactivate() function to cleanly remove MCP server key from config on uninstall
- **Added workspace detection** - Only auto-configures MCP when running from installed location (not workspace) to prevent path corruption
- **Added console logging for path verification** - Logs resolved paths for debugging and verification
- **All 45 MCP tools tested and verified functional** - Comprehensive testing completed on D:\MasterControl project
- **Cleaned up repository** - Removed temp_vsix_check2 directory and old test files
- **Updated .gitignore** - Added exclusions for tests/ directory and dump files

#### Configuration
- **Removed VS Code MCP API support** - Windsurf doesn't support vscode.lm.registerMcpServerDefinitionProvider API
- **Reverted to config file approach** - Using atomic read-modify-write pattern for mcp_config.json
- **Preserved atomic injection pattern** - Maintains user's other MCP servers in config

### [1.0.17] - 2026-04-02

#### Governor Pattern Implementation (MAJOR UPDATE)
- **Implemented the Governor Pattern** - The ultimate architectural enforcement system
- **Workspace Operation Interception**: Overrides all VS Code workspace APIs:
  - `vscode.workspace.fs.writeFile` - Routes through MCP `write_file` tool
  - `vscode.workspace.fs.rename` - Routes through MCP `refactor_move_block` tool
  - `vscode.workspace.fs.delete` - Placeholder for future `confirm_dangerous_operation` routing
  - `vscode.workspace.applyEdit` - Routes through MCP `validate_change_before_apply` tool
- **Zero Trust Architecture**: AI models cannot bypass governance to directly modify files
- **Predictable Execution**: Forces AI to follow architectural blueprint exactly
- **Prevents Hallucination**: AI cannot deviate from defined toolsets
- **Tool Routing Layer**: Intercepts operations at the extension level and routes through MCP tools
- **Architectural Enforcement**: Ensures all changes go through surgical validation

#### Testing & Quality
- **Fixed Jest Configuration**: Resolved ES module configuration issues
- **All Tests Passing**: 12 tests across 3 test suites (utils, tool-routing, server)
- **Tool Routing Tests**: Added comprehensive tests for governor pattern functionality
- **Test Coverage**: Verified all workspace operations are properly intercepted and routed

#### Documentation
- **Comprehensive README Update**: Added Governor Pattern documentation
- **Future Work Section**: Detailed roadmap of planned enhancements
- **Support & Feedback**: Added GitHub repository link for community feedback
- **Patreon Integration**: Added Patreon link for development support
- **Full Change Log**: Complete documentation of all changes in v1.0.17

### [1.0.16] - 2026-04-02

#### ESM Compatibility Fixes
- **Fixed VS Code Extension Import**: Resolved `vscode` import issues for Windsurf Next
- **Fixed __dirname for ESM**: Implemented proper __dirname polyfill for ES modules
- **Windsurf Next Compatibility**: Ensured extension works with latest Windsurf Next (Phoenix Alpha Fast)
- **Build Script Updates**: Updated build process to handle ESM/CommonJS conflicts
- **Jest Configuration**: Fixed Jest to work with ES module project structure

#### Documentation
- **Updated CHANGELOG.md**: Documented ESM compatibility fixes
- **Updated README.md**: Added ESM compatibility information for Windsurf Next users

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
