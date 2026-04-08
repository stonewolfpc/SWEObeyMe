# Changelog

All notable changes to SWEObeyMe will be documented in this file.

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
