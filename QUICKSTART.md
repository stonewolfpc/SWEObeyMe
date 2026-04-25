# SWEObeyMe Quick Start Guide

Get up and running with SWEObeyMe in 5 minutes.

## Prerequisites

- Node.js 18.0.0 or higher
- Windsurf Next (Phoenix Alpha Fast) or later
- Git (optional, for some features)

## Installation

### Step 1: Clone and Install

```bash
git clone https://github.com/stonewolfpc/SWEObeyMe.git
cd SWEObeyMe-restored
npm install
```

### Step 2: Install the Extension

1. Open Windsurf
2. Go to Extensions (Ctrl+Shift+X)
3. Click "Install from VSIX"
4. Select the `.vsix` file from the repository (or use `npm run package` to build one)

### Step 3: Configure MCP Server

The extension automatically configures the MCP server. To verify:

1. Open Windsurf Settings (Ctrl+,)
2. Search for "SWEObeyMe"
3. Ensure "SWEObeyMe: Enabled" is checked

## Common Use Cases

### Use Case 1: Enforce File Size Limits

SWEObeyMe automatically enforces the 700-line file limit. When a file exceeds this limit:

1. AI will receive a warning before writing
2. You can use the `refactor_move_block` tool to split large files
3. Backups are automatically created before any changes

**Example:**

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

### Use Case 2: Prevent Forbidden Patterns

SWEObeyMe automatically prevents:

- `console.log` statements
- `TODO` comments
- `debugger` statements
- `eval()` calls

These are automatically removed or rejected before writing.

### Use Case 3: C# Error Detection

For C# projects, SWEObeyMe provides advanced error detection:

1. Enable C# Bridge in settings
2. Errors are automatically injected into file reads
3. Configure which detectors to enable (missing using, empty catch, deep nesting, etc.)

**Settings:**

- Enable C# Bridge: `true`
- Keep AI Informed: `true`
- Severity Threshold: `0` (show all errors)

### Use Case 4: Project Memory and Context

SWEObeyMe maintains persistent project memory:

- Automatic indexing of project structure
- Convention detection (naming patterns, folder organization)
- Decision recording
- File purpose tracking

**Tools:**

- `index_project_structure` - Index entire project
- `analyze_project_conventions` - Detect patterns
- `get_project_memory_summary` - View project state

### Use Case 5: Error Recovery

When errors occur, SWEObeyMe provides intelligent fallback:

- Automatic retry with context-aware suggestions
- 7 failure types handled (file-not-found, tool-failure, permission-denied, etc.)
- Escalation to project scan or dependency check if needed

## Quick Configuration

### For Strict Compliance (Production)

```json
{
  "sweObeyMe.initialization.neverAutoFix": true,
  "sweObeyMe.initialization.scanOnNewProject": true,
  "sweObeyMe.initialization.reportDetailLevel": "full"
}
```

### For Rapid Prototyping (Development)

```json
{
  "sweObeyMe.initialization.neverAutoFix": false,
  "sweObeyMe.initialization.scanOnlyWhenAsked": true,
  "sweObeyMe.initialization.reportDetailLevel": "minimal"
}
```

### For Large Projects

```json
{
  "sweObeyMe.initialization.scanOnNewProject": false,
  "sweObeyMe.initialization.scanOnlyOnProjectMapChange": true,
  "sweObeyMe.initialization.digitalDebtThreshold": "50"
}
```

## First-Time Setup

### 1. Create Project Contract (Optional)

Create `.sweobeyme-contract.md` in your project root:

```markdown
# Project Architectural Contract

## File Structure

- All source files in `src/`
- Tests in `tests/`
- Utilities in `lib/utils/`

## Naming Conventions

- Components: PascalCase
- Functions: camelCase
- Constants: UPPER_SNAKE_CASE

## Forbidden Patterns

- No direct DOM manipulation
- No console.log in production code
```

### 2. Configure Scan Behavior

Choose when to scan:

- **Always**: `scanOnNewProject: true`
- **On Load**: `scanOnLoad: true`
- **Manual**: `scanOnlyWhenAsked: true`
- **Never**: `neverScan: true`

### 3. Enable C# Bridge (if using C#)

1. Open Windsurf Settings
2. Navigate to SWEObeyMe → C# Bridge
3. Enable "Enable C# Bridge"
4. Configure detectors as needed

## Verification

### Check Server Status

Ask the AI to run:

```json
{
  "tool": "obey_me_status"
}
```

### Test File Operations

Try reading a file:

```json
{
  "tool": "read_file",
  "arguments": {
    "path": "./package.json"
  }
}
```

You should see enhanced context including project structure and suggested next tools.

### Test Surgical Plan

Try validating a change:

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

This should reject the change (exceeds 700-line limit) and suggest refactoring.

## Troubleshooting

### MCP Server Not Loading

1. Check if extension is activated
2. Verify Windsurf supports MCP servers
3. Check console for error messages

### File Write Rejected

1. Check line count (must be < 700)
2. Check for forbidden patterns (console.log, TODO, debugger)
3. Verify file doesn't already exist (duplicate prevention)

### High Credit Usage

SWEObeyMe performs extensive validation. To reduce usage:

- Set `scanOnlyWhenAsked: true`
- Reduce `reportDetailLevel` to "minimal"
- Disable C# Bridge if not needed

## Next Steps

- Read [BEST_PRACTICES.md](BEST_PRACTICES.md) for configuration guidance
- Read [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common issues
- Read [FAQ.md](FAQ.md) for frequently asked questions
- Read [PERFORMANCE_TIPS.md](PERFORMANCE_TIPS.md) for optimization

## Support

- GitHub: https://github.com/stonewolfpc/SWEObeyMe
- PayPal Donate: [Donate Button](README.md)
- Patreon: https://patreon.com/StoneWolfSystems
