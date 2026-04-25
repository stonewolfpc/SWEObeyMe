# SWEObeyMe FAQ

Frequently asked questions about SWEObeyMe.

## General Questions

### What is SWEObeyMe?

SWEObeyMe is a surgical governance system for VS Code with MCP server integration. It enforces file size limits, prevents forbidden patterns, ensures code quality through automated validation, and provides AI models with architectural context to prevent technical debt.

### What is the Governor Pattern?

The Governor Pattern (v1.0.17) is an enforcement mechanism that intercepts all VS Code workspace operations and routes them through MCP tools. This ensures AI models cannot bypass your architectural rules or make uncontrolled changes to your codebase.

### What is the Workflow Automation System?

The Workflow Automation System (v1.3.0) enforces 7 strict behavior rules (search-before-edit, explain-before-act, tools-before-manual, no-hallucination, maintain-project-map, follow-conventions, documentation-required) with automatic compliance checking and violation tracking.

### What is the C# Bridge?

The C# Bridge (v1.0.13) provides advanced error detection for C# files, including bracket validation, complexity analysis, try-catch detection, async/await validation, resource management, and math safety checks.

### Is SWEObeyMe free?

SWEObeyMe is dual-licensed:

- **Community License (Free):** Free for individuals, indie devs, companies under $10M revenue, research, and education
- **Enterprise License (Commercial):** Required for companies over $10M, enterprise deployments, commercial integration, and SaaS platforms

See [LICENSE](LICENSE) for complete details.

## Installation & Setup

### How do I install SWEObeyMe?

1. Clone the repository
2. Run `npm install`
3. Install the VS Code extension from the `.vsix` file
4. Configure Windsurf to use the MCP server (automatic)

See [QUICKSTART.md](QUICKSTART.md) for detailed instructions.

### What are the prerequisites?

- Node.js 18.0.0 or higher
- Windsurf Next (Phoenix Alpha Fast) or later with ESM support
- Git (optional, for some features)

### Does SWEObeyMe work with other IDEs?

SWEObeyMe is designed for Windsurf with MCP server integration. It may work with other MCP-compatible IDEs, but is optimized for Windsurf.

### Can I use SWEObeyMe with VS Code directly?

SWEObeyMe requires MCP server integration, which is available in Windsurf. It does not work directly with standard VS Code without MCP support.

## Configuration

### How do I configure SWEObeyMe?

Configuration is done through Windsurf Settings (Ctrl+,). Search for "SWEObeyMe" to see all available options.

See [CONFIGURATION_EXAMPLES.md](CONFIGURATION_EXAMPLES.md) for sample configurations.

### What are the scan behavior options?

- `scanOnNewProject`: Scan when opening a new project
- `scanOnLoad`: Scan when Windsurf loads
- `scanOnlyWhenAsked`: Scan only when manually requested
- `scanOnlyOnProjectMapChange`: Scan only when project structure changes
- `neverScan`: Never scan (disables all scanning)

### What is the 700-line file limit?

SWEObeyMe enforces a maximum of 700 lines per file to prevent technical debt. Files exceeding this limit will be rejected for writing. Use `refactor_move_block` to split large files.

### Can I change the 700-line limit?

Yes, you can change it using the surgical rules configuration:

```json
{
  "mcpMaxLines": 1000
}
```

However, the default 700-line limit is recommended for maintainability.

### What are forbidden patterns?

Forbidden patterns are code patterns that SWEObeyMe prevents:

- `console.log` statements
- `TODO` comments
- `debugger` statements
- `eval()` calls

These are automatically removed or rejected before writing.

### Can I add custom forbidden patterns?

Yes, you can add custom patterns:

```json
{
  "mcpForbiddenPatterns": [
    "console.log",
    "debugger",
    "eval",
    "TODO",
    "FIXME",
    "HACK",
    "XXX",
    "YOUR_CUSTOM_PATTERN"
  ]
}
```

## Usage

### How do I use SWEObeyMe tools?

SWEObeyMe provides 68 MCP tools that AI models can use. Ask the AI to use a specific tool:

```json
{
  "tool": "obey_surgical_plan",
  "arguments": {
    "target_file": "./src/index.js",
    "current_line_count": 650,
    "estimated_addition": 100
  }
}
```

See [README.md](README.md) for the complete tool list.

### What is the difference between read_file and standard file reading?

The SWEObeyMe `read_file` tool provides enhanced context including:

- Project structure information
- File dependency hints
- Suggested next tools
- Architectural warnings

### How do I split a large file?

Use the `refactor_move_block` tool:

```json
{
  "tool": "refactor_move_block",
  "arguments": {
    "source_path": "./src/large-file.js",
    "target_path": "./lib/utils.js",
    "code_block": "function myLargeFunction() { /* ... */ }"
  }
}
```

### How do I validate changes before writing?

Use the `obey_surgical_plan` tool:

```json
{
  "tool": "obey_surgical_plan",
  "arguments": {
    "target_file": "./src/index.js",
    "current_line_count": 650,
    "estimated_addition": 100
  }
}
```

### How do I check for anti-patterns?

Use the `check_for_anti_patterns` tool:

```json
{
  "tool": "check_for_anti_patterns",
  "arguments": {
    "path": "./src/index.js"
  }
}
```

### How do I verify imports after changes?

Use the `verify_imports` tool:

```json
{
  "tool": "verify_imports",
  "arguments": {
    "content": "// Your code here",
    "path": "./src/index.js"
  }
}
```

## C# Bridge

### What is the C# Bridge?

The C# Bridge provides advanced error detection for C# files, including bracket validation, complexity analysis, try-catch detection, async/await validation, resource management, and math safety checks.

### How do I enable the C# Bridge?

1. Open Windsurf Settings (Ctrl+,)
2. Navigate to SWEObeyMe → C# Bridge
3. Enable "Enable C# Bridge"
4. Enable "Keep AI Informed"

### What C# detectors are available?

- `missingUsing`: Detects missing using statements
- `emptyCatch`: Detects empty catch blocks
- `deepNesting`: Detects deeply nested code
- `asyncAwait`: Validates async/await patterns
- `resourceLeaks`: Checks for missing using statements
- `mathSafety`: Validates mathematical expressions
- `nullReference`: Detects potential null reference issues
- `staticMutation`: Detects static field mutations
- `stringConcatenation`: Detects string concatenation in loops

### How do I adjust C# error sensitivity?

Adjust the `severityThreshold`:

- `0`: Show all errors (info, warnings, errors)
- `1`: Show warnings and errors only
- `2`: Show errors only

### How do I reduce false positives?

Adjust the `confidenceThreshold` (default: 70%):

- Higher values (80-90%) reduce false positives but may miss some errors
- Lower values (50-60%) catch more errors but may have more false positives

## Performance

### Why is my credit usage higher than normal?

SWEObeyMe performs extensive validation, maintains persistent project memory, and enforces strict discipline through multiple tool calls. This results in higher token consumption than basic coding assistants.

To reduce usage:

- Set `scanOnlyWhenAsked: true`
- Reduce `reportDetailLevel` to "minimal"
- Disable C# Bridge if not needed
- Use free AI models (designed for free models)

### How do I optimize for large projects?

For projects with 10,000+ files:

- Set `scanOnNewProject: false`
- Set `scanOnlyOnProjectMapChange: true`
- Increase C# alert cooldown to 60-120 seconds
- Enable deduplication
- Increase confidence threshold to 80%

### How do I optimize for speed?

- Set `reportDetailLevel: "minimal"`
- Disable auto-fix
- Reduce backup retention
- Disable loop detection
- Disable non-critical C# detectors

## Troubleshooting

### MCP server not loading?

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for detailed solutions. Common causes:

- Extension not activated
- Node.js version too old
- Duplicate server detected

### File write rejected?

Common causes:

- Line count exceeds 700 lines
- Forbidden pattern detected
- Duplicate file detected
- Backup failed

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for solutions.

### C# errors not showing?

Common causes:

- C# Bridge not enabled
- Keep AI Informed not enabled
- File not recognized as C#
- No detectors enabled

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for solutions.

## Features

### What is project memory?

Project memory is a persistent system that maintains:

- Automatic indexing of project structure
- Convention detection (naming patterns, folder organization)
- Decision recording
- File purpose tracking

### How do I use project memory?

Index project structure:

```json
{
  "tool": "index_project_structure"
}
```

Analyze conventions:

```json
{
  "tool": "analyze_project_conventions"
}
```

View project state:

```json
{
  "tool": "get_project_memory_summary"
}
```

### What is the fallback system?

The fallback system provides intelligent fallback strategies for 7 failure types:

- File not found
- Tool failure
- Permission denied
- Syntax error
- Import error
- Loop detected
- Unknown error

### What is anti-hallucination protection?

Anti-hallucination protection prevents AI from inventing files or tools by:

- Path verification before operations
- File existence checks
- Tool validation before use
- Project structure awareness

### What is the tool priority system?

The tool priority system ensures SWEObeyMe tools are ranked above Windsurf built-ins:

- Priority 100: Critical tools
- Priority 95: High-priority workflows
- Priority 80: Context tools
- Priority 50: Status tools
- Priority 10: Default

## Best Practices

### When should I use SWEObeyMe?

SWEObeyMe is beneficial for:

- Production code requiring strict compliance
- Large codebases needing governance
- Teams wanting consistent code quality
- Projects with technical debt concerns
- C# .NET development

### When should I not use SWEObeyMe?

SWEObeyMe may not be suitable for:

- Rapid prototyping (use relaxed config)
- Very small projects (overhead may not be justified)
- Projects with non-standard architectures
- Learning environments (use teaching config)

### Should I use auto-fix?

Auto-fix is useful for:

- Learning environments
- Legacy code migration
- Rapid prototyping

Auto-fix should be disabled for:

- Production code
- Strict compliance environments
- Open source contributions

### How do I choose scan behavior?

- `scanOnNewProject`: Best for small projects
- `scanOnLoad`: Best for development
- `scanOnlyWhenAsked`: Best for large projects
- `scanOnlyOnProjectMapChange`: Best for monorepos
- `neverScan`: Best for minimal usage

## Licensing

### Is SWEObeyMe open source?

Yes, SWEObeyMe is open source with a dual-license model:

- Community License (free for most uses)
- Enterprise License (commercial use)

### Do I need to pay for SWEObeyMe?

You need to pay only if:

- Your company has annual revenue over $10M USD
- You're doing enterprise deployments
- You're integrating commercially into products
- You're using it in a SaaS platform

### How do I get an Enterprise License?

Contact:

- Email: stonewolfpc@github.com
- GitHub: https://github.com/stonewolfpc/SWEObeyMe

## Support

### Where can I get help?

- GitHub Issues: https://github.com/stonewolfpc/SWEObeyMe/issues
- Documentation: [README.md](README.md)
- Quick Start: [QUICKSTART.md](QUICKSTART.md)
- Troubleshooting: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- Best Practices: [BEST_PRACTICES.md](BEST_PRACTICES.md)

### How do I report a bug?

Report bugs on GitHub with:

- Error log (if applicable)
- Configuration
- Windsurf version
- Steps to reproduce

### How do I request a feature?

Request features on GitHub Issues with:

- Feature description
- Use case
- Proposed implementation

### How can I support development?

- GitHub: https://github.com/stonewolfpc/SWEObeyMe
- PayPal Donate: [Donate Button](README.md)
- Patreon: https://patreon.com/StoneWolfSystems

## Technical

### What is MCP?

MCP (Model Context Protocol) is a protocol for AI model context management. SWEObeyMe implements an MCP server to provide tools and context to AI models.

### What is the surgical integrity score?

The surgical integrity score (0-100) measures compliance with architectural rules. Successes increase the score, failures decrease it based on severity.

### How does loop detection work?

Loop detection prevents repetitive operations on the same file by tracking recent operations and detecting patterns. After 3 attempts on the same file, it triggers a recovery mechanism.

### How does backup work?

Backups are automatically created before file writes:

- Atomic operations using temp files
- SHA-256 hash verification for integrity
- Maximum 10 backups per file (configurable)
- Stored in `%LOCALAPPDATA%\SWEObeyMe\.sweobeyme-backups`

### Can I customize the backup directory?

Yes, set a custom backup directory:

```json
{
  "sweObeyMe.backupPath": "D:/Custom/Backup/Path"
}
```

Or via MCP server environment variable:

```json
{
  "env": {
    "SWEOBEYME_BACKUP_DIR": "D:/Custom/Backup/Path"
  }
}
```

## Migration

### How do I upgrade from v1.2.1 to v1.3.0?

New features in v1.3.0:

- Rule Engine (7 strict behavior rules)
- Persistent Project Memory
- Fallback Behavior System
- Anti-Hallucination Protection
- Tool Priority System

Required changes:

1. Enable rule compliance (automatic)
2. Configure scan behavior for project memory
3. Set tool priority (default: "mcp")

See [BEST_PRACTICES.md](BEST_PRACTICES.md) for migration guide.

### How do I upgrade from v1.0.x to v1.3.0?

Major changes:

- Governor Pattern added (v1.0.17)
- C# Bridge added (v1.0.13)
- Workflow Automation added (v1.3.0)

See [BEST_PRACTICES.md](BEST_PRACTICES.md) for migration guide.

## Miscellaneous

### Does SWEObeyMe work with TypeScript?

Yes, SWEObeyMe works with TypeScript, JavaScript, and other languages. The C# Bridge is specific to C# files.

### Does SWEObeyMe work with Python?

Yes, SWEObeyMe works with Python. The surgical rules apply to all file types. C# Bridge only applies to C# files.

### Can I use SWEObeyMe with multiple projects?

Yes, SWEObeyMe works with multiple projects. Project memory is maintained per project.

### Does SWEObeyMe store my code?

SWEObeyMe stores:

- Project structure metadata
- Convention patterns
- Decision records
- Backup files

It does not store your full codebase outside of backups.

### Is my data private?

SWEObeyMe runs locally on your machine. No data is sent to external servers. All processing happens locally.

### Can I disable SWEObeyMe?

Yes, you can disable the extension in Windsurf or set `sweObeyMe.enabled: false` in settings.

### What happens if I disable SWEObeyMe?

Disabling SWEObeyMe:

- Stops MCP server
- Removes surgical enforcement
- Disables all SWEObeyMe tools
- Keeps existing backups

Your code remains unchanged.
