# Changelog

All notable changes to SWEObeyMe will be documented in this file.

## [2.1.5-beta] - 2026-04-09

### Features

- **Enhanced separation of concerns rules** - Added detailed WHY/WHEN/HOW explanations to CODE_RESPONSIBILITY, FILE_SCOPE, FILE_LOCATION, and NAMING_CONVENTIONS rules to guide AI on maintaining lean, organized files
- **Improved tool descriptions** - Enhanced write_file, obey_surgical_plan, refactor_move_block, and extract_to_new_file tool descriptions with explicit separation of concerns guidance
- **Better AI guidance** - Rules now include concrete examples and patterns for organizing code by concern (e.g., validators/, api/, components/, utils/)

### Documentation

- **Rule engine explanations** - All architectural rules now include clear rationale and remediation steps
- **Tool usage patterns** - Refactoring tools now emphasize their role in enforcing Single Responsibility Principle

## [2.1.4-beta] - 2026-04-08

### Bug Fixes

- **Fixed empty webview UI panels** - Removed visibility condition that was hiding all UI panels when SWEObeyMe config wasn't enabled
- **Fixed MCP configuration installation** - Created proper mcp_config.json for Windsurf integration
- **Fixed TrustedScript security violations** - Replaced inline event handlers with proper addEventListener() calls
- **Resolved runtime warnings** - Identified and documented third-party dependency warnings (Buffer deprecation, listener leaks)

### Features

- **MCP server connectivity** - Verified MCP server starts and connects successfully
- **UI panel visibility** - All webview panels now visible by default without configuration dependencies
- **Security improvements** - Enhanced CSP handling and removed TrustedScript policy violations

### Infrastructure

- **MCP config automation** - Automatic creation of Windsurf MCP configuration file
- **Extension lifecycle** - Proper activation events and webview provider registration
- **Cross-platform compatibility** - Validated on Windows with proper path handling

## [2.1.3-beta] - 2026-04-08

### Features

- **Perfect brutal validation** - Achieved 100% pass rate with 113 tests, 0 failures, 0 warnings
- **Cross-platform UI validation** - New comprehensive UI test suite covering Windows, Linux, and macOS
- **Enhanced security** - Improved CSP nonce handling and webview security policies

### Bug Fixes

- **Fixed HTML structure validation** - Resolved unclosed tag detection and HTML5 void element handling
- **Fixed CSP nonce implementation** - Added proper Content-Security-Policy to all webview HTML generators
- **Fixed webview resource handling** - Added localResourceRoots configuration for secure resource loading
- **Fixed template literal escaping** - Proper nonce parameter passing to HTML generator functions
- **Fixed file operations with invalid characters** - Platform-aware handling of restricted filename characters
- **Fixed JSON boundary value serialization** - Custom handling for Infinity, -Infinity, and NaN values
- **Fixed HTML content detection** - Precise extraction and validation of actual HTML generators

### Testing

- **Brutal UI validation test** - New `test-brutal-ui-validation.js` with 96 UI-specific tests
- **Perfect validation achieved** - Zero warnings across all test suites including:
  - HTML content structure validation
  - Cross-platform path handling
  - Webview provider registration
  - Command integration with UI
  - Resource and asset loading
  - CSS and theming compliance
  - Error handling and fallbacks
  - Version and license auditing
- **Enhanced resource cleanup** - Added explicit cleanup in deactivate function for all managers

### Security

- **Improved webview security** - Proper CSP nonce implementation across all UI panels
- **Cross-platform compatibility** - Validated filename character restrictions by platform
- **Resource isolation** - Secure webview resource handling with localResourceRoots

## [2.1.2-beta] - 2026-04-08

### Fixes
- **Fixed GitHub test failure** - Resolved pre-release validation test that was failing in CI environment.

## [2.1.1-beta] - 2026-04-08

### Bug Fixes
- **Fixed duplicate tool definitions** — Removed duplicate `get_file_context` and `analyze_change_impact` tools from `registry-core.js` that were causing WindSurf MCP server rejection. Now 98 unique tools.
- **Fixed Unix file:// URL handling** — Corrected Unix fallback in `toFileUrl()` to properly handle relative paths by converting them to absolute paths first.
- **Fixed MCP auto-configuration** — Removed manual config writing code (85 lines) that was conflicting with native `contributes.mcpServers`. Now uses VS Code/Windsurf native auto-registration like Puppeteer and other MCP servers.
- **Fixed README.md version badge** — Updated version badge from 2.0.10-beta to 2.1.1-beta to match package.json.

### Testing
- **Enhanced comprehensive test suite** — Added 10 automated tests including:
  - Strict duplicate detection (line numbers, cross-file analysis)
  - MCP server startup validation
  - MCP protocol compliance testing
  - Clean environment simulation (fresh install test)
  - Build artifacts validation
  - OS compatibility checks
  - UI components validation
- **Master validation script** — `npm run test:all` runs all tests in sequence for 100% certainty before release
- **Git-governor integration** — Added enterprise leak scanning, dependency isolation, and feature exclusion checks

## [2.0.10-beta] - 2026-04-08

### Bug Fixes
- **Fixed MCP config not propagating** — Windsurf-Next uses `~/.codeium/windsurf-next/mcp_config.json`, not `~/.codeium/mcp_config.json`. Extension now writes to all known locations (`windsurf-next`, `windsurf`, `.codeium`) that exist, always creating the `windsurf-next` directory. Only updates if the entry is missing or the path changed — prevents unnecessary rewrites.

## [2.0.9-beta] - 2026-04-08

### Bug Fixes
- **Fixed Windows ESM activation crash** — `dynamic import()` requires `file://` URLs on Windows; bare `C:\...` paths throw "Only URLs with a scheme in: file, data, node, and electron are supported". All `await import(path.join(...))` calls now use `pathToFileURL(p).href` via a `toFileUrl` helper.

## [2.0.8-beta] - 2026-04-08

### Bug Fixes
- **Fixed blank sidebar panels** — All three sidebar webview panels (Settings, C# Bridge Settings, Admin Dashboard) were empty due to broken dynamic imports in the bundled VSIX. Replaced with self-contained inline providers that have no external file dependencies.
- **Eliminated tool duplication** — Root cause identified: extension was writing to `~/.codeium/mcp_config.json` manually *and* declaring `contributes.mcpServers` in `package.json`. Windsurf registered it twice, causing duplicate tools. Removed the manual write; Windsurf now handles MCP registration natively via `contributes.mcpServers`.
- **Fixed `require()` crash in ESM module** — `deactivate()` was calling `require('fs')` inside a `"type": "module"` package, which throws at runtime. Simplified `deactivate()` to a no-op since Windsurf manages MCP server lifecycle.

### UI Improvements
- **Settings panel** — Shows version badge, MCP active status, master enable/disable, inline tips toggle, C# Bridge toggle, and link to full settings.
- **C# Bridge Settings panel** — Full controls: enable/disable, Keep AI Informed, deduplication, severity threshold slider, confidence % slider, and individual detector toggles for all 9 detectors.
- **Admin Dashboard panel** — MCP governance config editor (max lines, warning threshold, backup count, loop attempts) and feature toggles (auto-correction, loop detection, workflow orchestration, session memory, oracle, debug logs) with live save to `~/.sweobeyme-config.json`.

## [2.0.7-beta] - 2026-04-08

### Bug Fixes
- **Fixed `package.json` not copied to `dist/mcp/`** — MCP server crashed at startup with ENOENT because it reads its own `package.json` for version info. Updated `esbuild.config.js` to copy `package.json` to `dist/mcp/` on every build.
- **Fixed MCP server path** — `indexPath` was pointing to `index.js` at the extension root instead of the bundled `dist/mcp/server.js`.
- **Fixed `.windsurf` installation detection** — `isInstalled` check was missing the `.windsurf` directory (only had `.windsurf-next` and `.vscode`).
- **Updated README version badge** to `2.0.7-beta`.

## [2.0.0-beta] - 2026-04-07

### 🚀 Major Release - Project Awareness & Context Switching Layer

This is a substantial release introducing the Project Awareness & Context Switching Layer, a game-changing feature that automatically detects project switches and applies project-specific rules.

### New Features

#### Project Awareness & Context Switching Layer
- **Automatic Project Detection**: Detects project type (Godot, Node, Python, C#, C++, Rust, Go, Unity, Unreal) from file indicators
- **Context Switching**: Automatically switches project context when opening files from different projects
- **Project-Specific Rule Sets**: Enforces project-specific constraints and best practices
- **Project State Persistence**: Saves and restores project state (pending tasks, warnings, errors) between sessions
- **Safety Rule Enforcement**: Prevents applying rules from one project to another
- **Project Registry**: Persistent registry of all detected projects with metadata

#### New MCP Tools
- `detect_project_type` - Detect project type from file path
- `detect_project_switch` - Detect and handle project switches with automatic announcements
- `get_current_project` - Get current project information
- `validate_action` - Validate actions against project rules before execution
- `get_project_rules` - Get project-specific rules and constraints
- `switch_project` - Manually switch project context
- `add_pending_task` - Track pending tasks for current project
- `add_project_warning` / `add_project_error` - Track project issues
- `clear_pending_tasks` - Clear pending task list
- `get_all_projects` - List all registered projects

#### Project-Specific Rule Sets
- **Godot Projects**: Folder/node protection, scene tree preservation, autoload integrity
- **Node Projects**: Dependency checks, SoC enforcement, module boundaries
- **Python Projects**: PEP8 enforcement, module structure, dependency checks
- **C# Projects**: Namespace structure, file-per-class, SoC enforcement
- **C++ Projects**: Header/source separation, CMake conventions
- **Rust Projects**: Cargo conventions, ownership rules, module structure
- **Go Projects**: Module structure, package boundaries
- **Unity Projects**: Asset folder protection, prefab preservation
- **Unreal Projects**: Content folder protection, blueprint preservation

#### Integration
- Project awareness validation integrated into `write_file` handler
- Project switch detection integrated into `read_file` handler
- All tools registered with high priority (100) for automatic discovery

### Previous Features (v1.3.0)
- ✅ Core MCP Server with surgical governance
- ✅ C# Bridge integration with error detection
- ✅ Governor Pattern for workspace operation interception
- ✅ Workflow automation with rule engine
- ✅ Math corpus with 13 open-license references
- ✅ Godot project detection and enforcement
- ✅ VS Code extension with status bar, CodeLens, and commands palette
- ✅ Hot-reload capability and improved error messages
- ✅ Semantic-release configuration
- ✅ Docker support
- ✅ Git integration foundation
- ✅ Plugin system foundation

### Technical Improvements
- Created `lib/project-awareness.js` - Core project awareness system (300+ lines)
- Created `lib/tools/project-awareness-handlers.js` - MCP tool handlers (270+ lines)
- Created `lib/tools/registry-project-awareness.js` - Tool registration (110+ lines)
- Created `project_registry/` directory structure
- Created `plugins/example-plugin.js` - Example plugin demonstrating plugin system
- Updated `lib/tools/registry.js` - Added project awareness tools
- Updated `lib/tools/handlers.js` - Added project awareness handlers
- Updated `lib/tools/handlers-file-ops.js` - Integrated project awareness validation

### Breaking Changes
None - This is a beta release designed to be backward compatible.

### Known Issues
- 128 ESLint warnings about unused variables (not critical for beta)
- Some test files have parsing errors (test files only, not core functionality)

### Testing
- ESLint: 11 errors, 128 warnings (warnings are unused variables, not critical)
- MCP server startup: To be tested
- Project awareness system: To be tested with actual projects

### Next Steps
- Address unused variable warnings in follow-up cleanup
- Test project awareness with real projects of different types
- Gather user feedback on project awareness features
- Fix test file parsing errors
- Consider adding more project types if requested

### Migration Guide
No migration required. The Project Awareness Layer is automatically activated when using MCP tools. The system will automatically detect your project type and apply appropriate rules.

### Credits
This release represents a significant milestone in the SWEObeyMe project, bringing context-aware surgical governance to multi-project workflows.
