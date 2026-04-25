# SWEObeyMe - Surgical Code Enforcement

Welcome to SWEObeyMe! This guide will help you get started with surgical code enforcement for your projects.

## Quick Start

1. **Installation**: SWEObeyMe automatically configures itself when installed in Windsurf/VS Code
2. **MCP Integration**: The extension automatically writes to `~/.codeium/mcp_config.json` to enable MCP server functionality
3. **First-Time Setup**: On first activation, a config file `.sweobeyme-config.json` is created in your workspace root

## Key Features

### Checkpoints

- **Named Checkpoints**: Create named snapshots of your project state
- **Revert Functionality**: Roll back to any checkpoint with one click
- **Auto-Create**: Automatically create checkpoints before major operations
- **Access**: Use `Ctrl+Shift+S` (or `Cmd+Shift+S` on Mac) to open settings, or use the checkpoint commands

**Keyboard Shortcuts:**

- `Ctrl+Shift+S` / `Cmd+Shift+S` - Open C# Bridge Settings
- Command Palette: "SWEObeyMe: Create Checkpoint"
- Command Palette: "SWEObeyMe: List Checkpoints"

### Provider Support

- **Ollama**: Local AI model support (enable in settings)
- **OpenAI**: OpenAI API integration (enable in settings)
- **Anthropic**: Claude API integration (enable in settings)

**Configuration:**

1. Open VS Code Settings
2. Navigate to "SWEObeyMe" → "Providers"
3. Enable desired providers and configure endpoints/API keys

### Diff Review

- **Before Approval**: Review changes before they're applied
- **Side-by-Side View**: Compare original and modified code
- **Require Approval**: Confirm changes before application

**Configuration:**

- Settings → "SWEObeyMe" → "Diff Review"
- Enable/disable diff review and approval requirements

### Tool Controls

- **Per-Agent Permissions**: Control which tools agents can use
- **File Access**: Allow, ask, or deny file access
- **Terminal Access**: Control terminal command execution
- **Network Access**: Manage network request permissions

**Configuration:**

- Settings → "SWEObeyMe" → "Tool Controls"
- Set permission levels for each access type

### C# Bridge Diagnostics

- **Real-time Error Detection**: C# errors detected as you type
- **Multiple Detectors**: Missing using, empty catch, deep nesting, async/await, resource leaks, math safety, null reference, static mutation, string concatenation
- **Severity Levels**: Info, Warning, Error
- **Keep AI Informed**: Automatically inject errors into file reads for AI awareness

**Configuration:**

- Settings → "SWEObeyMe" → "C# Bridge"
- Enable/disable specific detectors
- Set severity threshold and confidence level

## Keyboard Shortcuts

| Command            | Windows/Linux | Mac         |
| ------------------ | ------------- | ----------- |
| Query Oracle       | Ctrl+Shift+O  | Cmd+Shift+O |
| Show Menu          | Ctrl+Shift+M  | Cmd+Shift+M |
| C# Bridge Settings | Ctrl+Shift+S  | Cmd+Shift+S |
| Analyze C# File    | Ctrl+Shift+A  | Cmd+Shift+A |
| Show Diagnostics   | Ctrl+Shift+D  | Cmd+Shift+D |
| Git Status         | Ctrl+Shift+G  | Cmd+Shift+G |
| Git Branch         | Ctrl+Shift+B  | Cmd+Shift+B |

## Configuration Reference

### General Settings

- `sweObeyMe.enabled` - Enable/disable the extension
- `sweObeyMe.backupPath` - Custom backup directory
- `sweObeyMe.general.statusBarEnabled` - Show status bar indicator
- `sweObeyMe.general.codeLensEnabled` - Show CodeLens for C# files
- `sweObeyMe.general.hotReloadEnabled` - Enable hot-reload for development

### C# Bridge Settings

- `sweObeyMe.csharpBridge.enabled` - Enable C# error detection
- `sweObeyMe.csharpBridge.keepAiInformed` - Auto-inject errors in file reads
- `sweObeyMe.csharpBridge.severityThreshold` - Minimum severity (0=Info, 1=Warning, 2=Error)
- `sweObeyMe.csharpBridge.confidenceThreshold` - Confidence percentage (0-100)
- `sweObeyMe.csharpBridge.deduplicateAlerts` - Group identical warnings
- `sweObeyMe.csharpBridge.alertCooldown` - Cooldown in seconds
- `sweObeyMe.csharpBridge.logVerbosity` - silent, errors, or verbose
- `sweObeyMe.csharpBridge.detectors` - Enable/disable specific detectors

### Checkpoint Settings

- `sweObeyMe.checkpoints.enabled` - Enable checkpoint functionality
- `sweObeyMe.checkpoints.maxCount` - Maximum checkpoints to retain (default: 10)
- `sweObeyMe.checkpoints.autoCreate` - Auto-create before major operations

### Provider Settings

- `sweObeyMe.providers.ollama.enabled` - Enable Ollama
- `sweObeyMe.providers.ollama.endpoint` - Ollama API endpoint (default: http://localhost:11434)
- `sweObeyMe.providers.ollama.models` - Available Ollama models
- `sweObeyMe.providers.openai.enabled` - Enable OpenAI
- `sweObeyMe.providers.openai.apiKey` - OpenAI API key
- `sweObeyMe.providers.anthropic.enabled` - Enable Anthropic
- `sweObeyMe.providers.anthropic.apiKey` - Anthropic API key

### Diff Review Settings

- `sweObeyMe.diffReview.enabled` - Enable diff review
- `sweObeyMe.diffReview.showSideBySide` - Show side-by-side view
- `sweObeyMe.diffReview.requireApproval` - Require approval before applying

### Tool Control Settings

- `sweObeyMe.toolControls.perAgent` - Enable per-agent controls
- `sweObeyMe.toolControls.fileAccess` - allow, ask, or deny
- `sweObeyMe.toolControls.terminalAccess` - allow, ask, or deny
- `sweObeyMe.toolControls.networkAccess` - allow, ask, or deny

### Onboarding Settings

- `sweObeyMe.onboarding.showWelcome` - Show welcome on first activation
- `sweObeyMe.onboarding.showTips` - Show inline tips
- `sweObeyMe.onboarding.tutorialEnabled` - Enable interactive tutorial

## Troubleshooting

### MCP Server Not Starting

- Check that Windsurf is properly installed
- Verify write permissions for `~/.codeium/mcp_config.json`
- Try manually reloading the window
- Check the output panel for error messages

### Checkpoints Not Working

- Ensure checkpoint functionality is enabled in settings
- Check that global storage is accessible
- Verify sufficient disk space
- Try creating a checkpoint manually via command palette

### Provider Connection Issues

- Verify provider is enabled in settings
- Check endpoint URL is correct
- Ensure API keys are set (for API providers)
- Test provider availability using "Refresh Provider Status" command

### C# Bridge Not Detecting Errors

- Ensure C# Bridge is enabled in settings
- Check severity threshold isn't too high
- Verify file is saved (detection runs on save)
- Check log verbosity for debug information

## Advanced Features

### Surgical Enforcement

SWEObeyMe enforces architectural rules through MCP protocol compliance:

- Line count limits (max 700 lines per file)
- Forbidden pattern detection
- Loop detection for repetitive operations
- Documentation ratio enforcement
- Architectural drift detection

### Error Feedback Loops

- Tracks consecutive errors
- Triggers Constitution reading after 3 failures
- Surgical Integrity Score (0-100)
- Progressive pressure for compliance

### Git Integration

- Automatic git status tracking
- Branch switching support
- Commit message generation
- Hot-reload of extension files

## Getting Help

- **Documentation**: https://github.com/stonewolfpc/SWEObeyMe
- **Issues**: Report bugs on GitHub
- **Discussions**: Ask questions in GitHub Discussions

## License

See LICENSE file for details.
