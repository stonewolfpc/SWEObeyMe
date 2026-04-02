# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.13] - 2026-04-02

### Major Refactoring

#### Code Organization
- **Reduced index.js from 944 to 156 lines** (83% reduction) by extracting logical modules
- Created modular architecture with `lib/` directory structure
- Applied single responsibility principle throughout the codebase
- All source files now under 500 lines (largest: lib/tools/handlers.js at 387 lines)
- Improved maintainability and testability through modular design

#### New Module Structure
- `lib/utils.js` - URI normalization and backup directory utilities
- `lib/backup.js` - Enhanced backup system with atomic operations
- `lib/enforcement.js` - Validation rules and enforcement logic
- `lib/session.js` - Session memory and action recording
- `lib/project.js` - Project configuration and .sweignore handling
- `lib/workflow.js` - Workflow orchestration
- `lib/tools.js` - Tool initialization and quotes
- `lib/tools/handlers.js` - Tool implementations (387 lines)
- `lib/tools/registry.js` - Tool definitions with dependencies (222 lines)

### Enhanced Backup System

#### Atomic Operations
- **Atomic file operations** using temp files for safe writes
- Write to temp file first, then atomic rename for final commit
- Prevents partial writes and corrupted backups
- Safe across crashes and power failures

#### Integrity Verification
- **SHA-256 hash verification** for backup integrity
- Verifies backup content matches original after creation
- Automatic cleanup of failed backups
- Hash logging for audit trail

#### Concurrent Operations
- **Concurrent operation handling** with write locks
- Duplicate backup prevention for same file
- Active backup tracking to prevent race conditions
- Write lock timeout (30 seconds) to prevent deadlocks

#### Retention Management
- **Automatic retention management** (max 10 backups per file)
- Automatic cleanup of old backups
- Configurable retention limits
- Backup statistics API with `listBackups()` and `getBackupStats()` functions

#### Error Handling
- **Enhanced error logging** with detailed context
- Graceful error recovery
- Detailed error messages for troubleshooting
- Backup directory validation on startup

### MCP Server Lifecycle Management

#### Duplicate Detection
- **PID file tracking** for duplicate detection
- Automatic detection of existing MCP server instances
- Prevents multiple server instances from running
- Clean startup on extension reload

#### Instance Cleanup
- **Automatic cleanup of stale instances** on extension activation
- Graceful termination of orphaned processes
- SIGTERM followed by SIGKILL for hung processes
- PID file cleanup on deactivation

#### Graceful Shutdown
- **Graceful shutdown** without process.exit() calls
- Proper resource cleanup on shutdown
- No VS Code extension host crashes
- Clean MCP server termination

#### Extension Reload Support
- **Extension reload support** - no need to disable/uninstall
- Preserved MCP config on deactivation
- Seamless extension reload without user intervention
- Automatic reconfiguration on reload

#### Configuration Management
- **Configuration change detection** with auto-restart
- Automatic MCP server restart on config changes
- Watch for .sweobeyme-contract.md changes
- Dynamic backup directory updates

#### User Commands
- New `sweObeyMe.restartMCP` command for manual restarts
- Manual MCP server restart capability
- User control over server lifecycle
- Status feedback for restart operations

### Tool Compliance Improvements

#### Enhanced Descriptions
- **Comprehensive tool descriptions** with dependencies
- Clear usage examples for all 19 tools
- Detailed parameter descriptions
- Return value documentation

#### Ordering Guidance
- **CRITICAL/MUST keywords** to enforce proper tool usage sequences
- Explicit prerequisite relationships (e.g., obey_surgical_plan before write_file)
- Workflow guidance for complex operations
- Step-by-step operation sequences

#### Progressive Enforcement
- **Progressive enforcement hints** with actionable alternatives
- Clear guidance when operations are blocked
- Suggested alternatives for rejected operations
- Recovery paths for common failure scenarios

#### Recovery Mechanisms
- **Recovery mechanisms** for stuck sessions
- Session reset capability with `request_surgical_recovery`
- Loop detection and prevention
- Automatic session cleanup after failures

#### Workflow Support
- **Workflow guidance** for complex multi-step operations
- `initiate_surgical_workflow` for orchestrated operations
- `get_workflow_status` for progress tracking
- Step-by-step workflow enforcement

### Bug Fixes

#### Configuration
- **Fixed .cz-config.js syntax errors** - converted from JSON to proper JavaScript format
- Corrected Commitizen configuration structure
- Fixed missing semicolons and proper exports
- Resolved IDE linting errors

#### Import Paths
- Fixed import path errors in lib/tools.js (changed "../utils.js" to "./utils.js")
- Corrected import paths in lib/tools/handlers.js for all lib modules
- Fixed relative import paths for all extracted modules
- Resolved module resolution errors

#### Extension
- Fixed extension lifecycle management
- Corrected deactivation behavior
- Fixed PID file cleanup issues
- Resolved duplicate instance detection

### Documentation

#### README Updates
- Updated README.md with comprehensive v1.0.13 improvements
- Updated project structure documentation
- Added architecture improvements section
- Enhanced troubleshooting guide
- Added professional standards section

#### Code Documentation
- Added comprehensive JSDoc comments to all modules
- Documented all exported functions
- Added usage examples in tool descriptions
- Improved inline code comments

### Performance

#### Backup Operations
- Improved backup performance with atomic operations
- Reduced backup creation time
- Optimized concurrent backup handling
- Enhanced backup verification speed

#### Module Loading
- Faster module loading with ES modules
- Reduced startup time
- Optimized import dependencies
- Improved memory usage

### Security

#### Backup Security
- Read-only backup files to prevent accidental modification
- Hash verification ensures backup integrity
- Secure temp file handling
- Proper permission management

#### Process Security
- No process.exit() calls to prevent crashes
- Proper signal handling
- Graceful shutdown without forceful termination
- Secure PID file management

### Developer Experience

#### Code Quality
- Improved code organization and maintainability
- Better separation of concerns
- Easier to understand and modify
- Reduced cognitive load for developers

#### Testing
- Modular structure enables better unit testing
- Isolated module testing possible
- Easier to mock dependencies
- Better test coverage

#### Debugging
- Enhanced error logging with context
- Better error messages
- Improved stack traces
- Easier troubleshooting

### C# .NET 8/10 Enhancements

#### C# Validation Module (lib/csharp-validation.js)
- **Comprehensive C# code validation** with multiple analysis dimensions
- Bracket/Scope validation for deeply nested structures
- Complexity analysis with cyclomatic complexity metrics
- Try-catch depth detection to prevent nested exception handling
- Empty catch block detection
- Missing using statement detection for IDisposable objects
- Async/await pattern validation
- Scope depth visualization with tree structure

#### Math Safety Module (lib/math-safety.js)
- **Mathematical expression safety validation** for C# code
- Operator precedence analysis
- Potential overflow detection (int, long, decimal)
- Precision loss detection (decimal vs double)
- Division by zero risk detection
- Complex expression identification
- Math improvement suggestions

#### C# Handlers (lib/tools/csharp-handlers.js)
- 10 new C# specific tools:
  - `validate_csharp_code` - Comprehensive C# code validation
  - `validate_csharp_brackets` - Bracket matching validation
  - `analyze_csharp_complexity` - Complexity metrics analysis
  - `detect_nested_try_catch` - Nested try-catch detection
  - `visualize_scope_depth` - Scope depth visualization
  - `validate_math_safety` - Math expression validation
  - `analyze_math_expressions` - Math expression analysis
  - `validate_csharp_math` - C# math pattern validation
  - `suggest_math_improvements` - Math improvement suggestions
  - `csharp_health_check` - Comprehensive C# health check

#### Enhanced C# Support
- Enhanced `read_file` handler with C# complexity warnings
- C# complexity scoring (0-100 scale)
- Automatic complexity warnings when reading C# files
- Enhanced `enforcement.js` with C# bracket and depth validation
- Enhanced `context.js` with C# complexity metrics

### File Management Enhancements

#### File Registry System (lib/file-registry.js)
- **Comprehensive file tracking** for entire project
- MD5 content hashing for duplicate detection
- Directory-based organization for fast lookups
- File search capabilities with pattern matching
- Similar file detection using string similarity
- Statistics and reporting
- Import/export registry state
- Supports massive projects with thousands of files

#### File Operation Audit (lib/file-operation-audit.js)
- **Complete operation tracking** for all file operations
- Operation deduplication with time windows
- Content hash comparison for duplicate write detection
- Recent operation tracking to prevent rapid repeats
- Automatic issue detection (excessive duplicates, failures, rapid creation)
- Comprehensive audit reports
- Session statistics and monitoring

#### Reference Validation (lib/reference-validation.js)
- **Import/require validation** for JavaScript/TypeScript
- C# using statement validation
- Python import validation
- Function/class reference validation
- File reference validation
- Missing dependency detection
- Line number reporting for validation errors

#### Project Integrity Handlers (lib/tools/project-integrity-handlers.js)
- 9 new project integrity tools:
  - `index_project_files` - Index all project files into registry
  - `check_file_duplicates` - Check for duplicate files
  - `validate_file_references` - Validate file references exist
  - `check_recent_operations` - Check for recent/redundant operations
  - `validate_before_write` - Comprehensive pre-write validation
  - `get_registry_stats` - Get file registry statistics
  - `search_files` - Search files in registry
  - `generate_audit_report` - Generate operation audit report
  - `check_file_exists` - Check if file exists in registry

#### Enhanced write_file Handler
- **Automatic duplicate prevention** built into write_file
- Exact duplicate detection (blocks files with identical content)
- Same name detection (prevents same name in directory)
- Similar file detection (warns about potential duplicates)
- Recent write protection (blocks writes within 30 seconds)
- Operation recording for audit trail
- File registry update after successful write

### Testing Improvements

#### MCP Server Integration Test (test-mcp-server.js)
- **Comprehensive MCP server testing** with 22 test cases
- Tests all 65 tools
- Tests C# handlers (5 tests)
- Tests project integrity handlers (6 tests)
- Tests surgical plan validation
- Tests enforcement rules
- 100% pass rate

#### MCP Protocol Compliance Test (test-mcp-protocol-compliance.js)
- **Strict MCP 2024-11-05 specification validation**
- JSON-RPC 2.0 format compliance
- Tool schema validation
- Error response format validation
- Request/response ID matching
- Concurrent request handling
- Large response handling
- Special character handling
- Server info consistency
- Protocol version compliance
- Catches errors that Windsurf Next would catch

#### Direct Module Tests
- File registry module tests
- File operation audit module tests
- C# validation module tests
- Math safety module tests
- Handler registration tests

### Configuration Updates

#### C# Configuration Options
- `csharpMaxMethodComplexity` - Maximum method complexity threshold
- `csharpMaxNestingDepth` - Maximum nesting depth
- `csharpRequireAsyncAwaitPattern` - Require async/await patterns
- `csharpForbidEmptyCatchBlocks` - Forbid empty catch blocks
- `csharpRequireUsingStatements` - Require using statements for IDisposable
- `csharpEnableMathSafety` - Enable math safety validation
- `csharpMaxTryCatchDepth` - Maximum try-catch depth
- `csharpEnableBracketValidation` - Enable bracket validation
- `csharpWarnOnComplexMath` - Warn on complex math expressions
- `csharpMathComplexityThreshold` - Math complexity threshold

### Tool Count Increase
- **From 46 to 65 tools** (41% increase)
- 10 new C# .NET 8/10 tools
- 9 new project integrity tools
- Enhanced existing tools with new capabilities

## [1.0.12] - 2026-04-01

### Maintenance
- Updated version references
- Version alignment across all project files
- Documentation updates

## [1.0.11] - 2026-03-30

### Features
- Initial MCP server implementation
- Surgical governance system
- Backup system
- Tool handlers
- Session memory
- Project configuration
- Workflow orchestration

### Documentation
- Initial README
- Installation instructions
- Usage examples
- Configuration guide

## [1.0.10] - 2026-03-29

### Initial Release
- First stable release
- Core MCP server functionality
- VS Code extension
- Basic surgical governance
- File operations with validation
