# SWEObeyMe Configuration Examples

Complete configuration examples for different use cases.

## Full Configuration (All Settings)

```json
{
  "sweObeyMe.enabled": true,
  "sweObeyMe.backupPath": "",
  "sweObeyMe.csharpBridge.enabled": true,
  "sweObeyMe.csharpBridge.keepAiInformed": true,
  "sweObeyMe.csharpBridge.severityThreshold": 0,
  "sweObeyMe.csharpBridge.confidenceThreshold": 70,
  "sweObeyMe.csharpBridge.deduplicateAlerts": true,
  "sweObeyMe.csharpBridge.alertCooldown": 30,
  "sweObeyMe.csharpBridge.logVerbosity": "errors",
  "sweObeyMe.csharpBridge.detectors": {
    "missingUsing": true,
    "emptyCatch": true,
    "deepNesting": true,
    "asyncAwait": true,
    "resourceLeaks": true,
    "mathSafety": true,
    "nullReference": true,
    "staticMutation": true,
    "stringConcatenation": true
  },
  "sweObeyMe.initialization.scanOnNewProject": true,
  "sweObeyMe.initialization.scanOnLoad": false,
  "sweObeyMe.initialization.scanOnlyWhenAsked": false,
  "sweObeyMe.initialization.scanOnlyOnProjectMapChange": false,
  "sweObeyMe.initialization.neverScan": false,
  "sweObeyMe.initialization.reportDetailLevel": "standard",
  "sweObeyMe.initialization.digitalDebtThreshold": "20",
  "sweObeyMe.initialization.autoFixNaming": false,
  "sweObeyMe.initialization.autoFixFolderStructure": false,
  "sweObeyMe.initialization.autoFixDocumentation": false,
  "sweObeyMe.initialization.autoFixTests": false,
  "sweObeyMe.initialization.autoFixDigitalDebt": false,
  "sweObeyMe.initialization.neverAutoFix": true,
  "sweObeyMe.initialization.toolPriority": "mcp",
  "sweObeyMe.initialization.transparencyMode": "major"
}
```

## Configuration 1: Strict Production

```json
{
  "sweObeyMe.enabled": true,
  "sweObeyMe.csharpBridge.enabled": true,
  "sweObeyMe.csharpBridge.keepAiInformed": true,
  "sweObeyMe.csharpBridge.severityThreshold": 0,
  "sweObeyMe.csharpBridge.confidenceThreshold": 70,
  "sweObeyMe.csharpBridge.deduplicateAlerts": true,
  "sweObeyMe.csharpBridge.alertCooldown": 30,
  "sweObeyMe.csharpBridge.detectors": {
    "missingUsing": true,
    "emptyCatch": true,
    "deepNesting": true,
    "asyncAwait": true,
    "resourceLeaks": true,
    "mathSafety": true,
    "nullReference": true,
    "staticMutation": true,
    "stringConcatenation": true
  },
  "sweObeyMe.initialization.scanOnNewProject": true,
  "sweObeyMe.initialization.reportDetailLevel": "full",
  "sweObeyMe.initialization.digitalDebtThreshold": "10",
  "sweObeyMe.initialization.neverAutoFix": true,
  "sweObeyMe.initialization.toolPriority": "mcp",
  "sweObeyMe.initialization.transparencyMode": "everything"
}
```

## Configuration 2: Rapid Prototyping

```json
{
  "sweObeyMe.enabled": true,
  "sweObeyMe.csharpBridge.enabled": false,
  "sweObeyMe.initialization.scanOnNewProject": false,
  "sweObeyMe.initialization.scanOnlyWhenAsked": true,
  "sweObeyMe.initialization.reportDetailLevel": "minimal",
  "sweObeyMe.initialization.digitalDebtThreshold": "always",
  "sweObeyMe.initialization.neverAutoFix": false,
  "sweObeyMe.initialization.toolPriority": "none",
  "sweObeyMe.initialization.transparencyMode": "silent"
}
```

## Configuration 3: Large Codebase

```json
{
  "sweObeyMe.enabled": true,
  "sweObeyMe.csharpBridge.enabled": true,
  "sweObeyMe.csharpBridge.keepAiInformed": true,
  "sweObeyMe.csharpBridge.severityThreshold": 1,
  "sweObeyMe.csharpBridge.confidenceThreshold": 80,
  "sweObeyMe.csharpBridge.deduplicateAlerts": true,
  "sweObeyMe.csharpBridge.alertCooldown": 60,
  "sweObeyMe.csharpBridge.detectors": {
    "missingUsing": true,
    "emptyCatch": true,
    "deepNesting": true,
    "asyncAwait": true,
    "resourceLeaks": true,
    "mathSafety": false,
    "nullReference": true,
    "staticMutation": true,
    "stringConcatenation": false
  },
  "sweObeyMe.initialization.scanOnNewProject": false,
  "sweObeyMe.initialization.scanOnlyOnProjectMapChange": true,
  "sweObeyMe.initialization.reportDetailLevel": "standard",
  "sweObeyMe.initialization.digitalDebtThreshold": "50",
  "sweObeyMe.initialization.neverAutoFix": true,
  "sweObeyMe.initialization.toolPriority": "mcp"
}
```

## Configuration 4: Small Project

```json
{
  "sweObeyMe.enabled": true,
  "sweObeyMe.csharpBridge.enabled": true,
  "sweObeyMe.csharpBridge.keepAiInformed": true,
  "sweObeyMe.csharpBridge.severityThreshold": 0,
  "sweObeyMe.csharpBridge.confidenceThreshold": 70,
  "sweObeyMe.csharpBridge.alertCooldown": 30,
  "sweObeyMe.csharpBridge.detectors": {
    "missingUsing": true,
    "emptyCatch": true,
    "deepNesting": true,
    "asyncAwait": true,
    "resourceLeaks": true,
    "mathSafety": true,
    "nullReference": true,
    "staticMutation": true,
    "stringConcatenation": true
  },
  "sweObeyMe.initialization.scanOnNewProject": true,
  "sweObeyMe.initialization.reportDetailLevel": "standard",
  "sweObeyMe.initialization.digitalDebtThreshold": "20",
  "sweObeyMe.initialization.neverAutoFix": false,
  "sweObeyMe.initialization.toolPriority": "mcp"
}
```

## Configuration 5: JavaScript / TypeScript Only

```json
{
  "sweObeyMe.enabled": true,
  "sweObeyMe.csharpBridge.enabled": false,
  "sweObeyMe.initialization.scanOnNewProject": true,
  "sweObeyMe.initialization.reportDetailLevel": "standard",
  "sweObeyMe.initialization.digitalDebtThreshold": "20",
  "sweObeyMe.initialization.neverAutoFix": false,
  "sweObeyMe.initialization.toolPriority": "mcp",
  "sweObeyMe.initialization.transparencyMode": "major"
}
```

## Configuration 6: C# .NET Development

```json
{
  "sweObeyMe.enabled": true,
  "sweObeyMe.csharpBridge.enabled": true,
  "sweObeyMe.csharpBridge.keepAiInformed": true,
  "sweObeyMe.csharpBridge.severityThreshold": 0,
  "sweObeyMe.csharpBridge.confidenceThreshold": 70,
  "sweObeyMe.csharpBridge.deduplicateAlerts": true,
  "sweObeyMe.csharpBridge.alertCooldown": 30,
  "sweObeyMe.csharpBridge.logVerbosity": "verbose",
  "sweObeyMe.csharpBridge.detectors": {
    "missingUsing": true,
    "emptyCatch": true,
    "deepNesting": true,
    "asyncAwait": true,
    "resourceLeaks": true,
    "mathSafety": true,
    "nullReference": true,
    "staticMutation": true,
    "stringConcatenation": true
  },
  "sweObeyMe.initialization.scanOnNewProject": true,
  "sweObeyMe.initialization.reportDetailLevel": "full",
  "sweObeyMe.initialization.digitalDebtThreshold": "20",
  "sweObeyMe.initialization.neverAutoFix": false,
  "sweObeyMe.initialization.toolPriority": "mcp",
  "sweObeyMe.initialization.transparencyMode": "major"
}
```

## Configuration 7: Teaching / Learning

```json
{
  "sweObeyMe.enabled": true,
  "sweObeyMe.csharpBridge.enabled": true,
  "sweObeyMe.csharpBridge.keepAiInformed": true,
  "sweObeyMe.csharpBridge.severityThreshold": 0,
  "sweObeyMe.csharpBridge.confidenceThreshold": 50,
  "sweObeyMe.csharpBridge.logVerbosity": "verbose",
  "sweObeyMe.csharpBridge.detectors": {
    "missingUsing": true,
    "emptyCatch": true,
    "deepNesting": true,
    "asyncAwait": true,
    "resourceLeaks": true,
    "mathSafety": true,
    "nullReference": true,
    "staticMutation": true,
    "stringConcatenation": true
  },
  "sweObeyMe.initialization.scanOnNewProject": true,
  "sweObeyMe.initialization.reportDetailLevel": "full",
  "sweObeyMe.initialization.digitalDebtThreshold": "always",
  "sweObeyMe.initialization.neverAutoFix": false,
  "sweObeyMe.initialization.autoFixNaming": true,
  "sweObeyMe.initialization.autoFixDocumentation": true,
  "sweObeyMe.initialization.toolPriority": "windsurf",
  "sweObeyMe.initialization.transparencyMode": "everything"
}
```

## Configuration 8: Legacy Code Migration

```json
{
  "sweObeyMe.enabled": true,
  "sweObeyMe.csharpBridge.enabled": true,
  "sweObeyMe.csharpBridge.keepAiInformed": true,
  "sweObeyMe.csharpBridge.severityThreshold": 0,
  "sweObeyMe.csharpBridge.confidenceThreshold": 70,
  "sweObeyMe.csharpBridge.detectors": {
    "missingUsing": true,
    "emptyCatch": true,
    "deepNesting": true,
    "asyncAwait": true,
    "resourceLeaks": true,
    "mathSafety": false,
    "nullReference": true,
    "staticMutation": true,
    "stringConcatenation": false
  },
  "sweObeyMe.initialization.scanOnNewProject": true,
  "sweObeyMe.initialization.reportDetailLevel": "full",
  "sweObeyMe.initialization.digitalDebtThreshold": "always",
  "sweObeyMe.initialization.neverAutoFix": false,
  "sweObeyMe.initialization.autoFixNaming": true,
  "sweObeyMe.initialization.autoFixDocumentation": true,
  "sweObeyMe.initialization.autoFixDigitalDebt": true,
  "sweObeyMe.initialization.toolPriority": "mcp",
  "sweObeyMe.initialization.transparencyMode": "major"
}
```

## Configuration 9: Open Source Contribution

```json
{
  "sweObeyMe.enabled": true,
  "sweObeyMe.csharpBridge.enabled": true,
  "sweObeyMe.csharpBridge.keepAiInformed": true,
  "sweObeyMe.csharpBridge.severityThreshold": 1,
  "sweObeyMe.csharpBridge.confidenceThreshold": 80,
  "sweObeyMe.csharpBridge.detectors": {
    "missingUsing": true,
    "emptyCatch": true,
    "deepNesting": true,
    "asyncAwait": true,
    "resourceLeaks": true,
    "mathSafety": false,
    "nullReference": true,
    "staticMutation": true,
    "stringConcatenation": false
  },
  "sweObeyMe.initialization.scanOnNewProject": false,
  "sweObeyMe.initialization.scanOnlyWhenAsked": true,
  "sweObeyMe.initialization.reportDetailLevel": "full",
  "sweObeyMe.initialization.digitalDebtThreshold": "20",
  "sweObeyMe.initialization.neverAutoFix": true,
  "sweObeyMe.initialization.toolPriority": "mcp",
  "sweObeyMe.initialization.transparencyMode": "major"
}
```

## Configuration 10: Minimal (Disable Most Features)

```json
{
  "sweObeyMe.enabled": true,
  "sweObeyMe.csharpBridge.enabled": false,
  "sweObeyMe.initialization.neverScan": true,
  "sweObeyMe.initialization.neverAutoFix": true,
  "sweObeyMe.initialization.toolPriority": "none",
  "sweObeyMe.initialization.transparencyMode": "silent"
}
```

## MCP Server Configuration

### Full MCP Server Config

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

### Debug MCP Server Config

```json
{
  "mcpServers": {
    "swe-obey-me": {
      "command": "node",
      "args": ["--no-warnings", "file:///d:/SWEObeyMe-restored/index.js"],
      "env": {
        "NODE_ENV": "development",
        "SWEOBEYME_BACKUP_DIR": "C:/Users/YourName/AppData/Local/SWEObeyMe/.sweobeyme-backups",
        "SWEOBEYME_DEBUG": "1"
      },
      "disabled": false
    }
  }
}
```

### Custom Backup Directory

```json
{
  "mcpServers": {
    "swe-obey-me": {
      "command": "node",
      "args": ["--no-warnings", "file:///d:/SWEObeyMe-restored/index.js"],
      "env": {
        "NODE_ENV": "production",
        "SWEOBEYME_BACKUP_DIR": "D:/Custom/Backup/Path",
        "SWEOBEYME_DEBUG": "0"
      },
      "disabled": false
    }
  }
}
```

## Project Contract Example

### .sweobeyme-contract.md

```markdown
# Project Architectural Contract

## File Structure
- All source files in `src/`
- Tests in `tests/`
- Utilities in `lib/utils/`
- Components in `src/components/`
- Services in `src/services/`

## Naming Conventions
- Components: PascalCase (e.g., UserProfile.tsx)
- Functions: camelCase (e.g., getUserData)
- Constants: UPPER_SNAKE_CASE (e.g., API_ENDPOINT)
- Files: kebab-case (e.g., user-profile.tsx)

## Forbidden Patterns
- No direct DOM manipulation
- No console.log in production code
- No TODO comments in production code
- No eval() calls
- No debugger statements

## File Size Limits
- Maximum 700 lines per file
- Maximum 50 functions per file
- Maximum 5 classes per file

## Import Rules
- No circular dependencies
- Import order: external, internal, relative
- Use absolute imports for internal modules

## Documentation Requirements
- All public functions must have JSDoc
- All classes must have description
- Complex logic must have inline comments

## Testing Requirements
- All functions must have unit tests
- Minimum 80% code coverage
- Integration tests for services
```

## Surgical Rules Configuration

### Default Surgical Rules

```json
{
  "mcpMaxLines": 700,
  "mcpEnableLoopDetection": true,
  "mcpMaxLoopAttempts": 3,
  "mcpMinDocumentationRatio": 0.1,
  "mcpEnableAutoCorrection": true,
  "mcpMaxBackupsPerFile": 10,
  "mcpEnableWorkflowOrchestration": true,
  "mcpEnableSessionMemory": true,
  "mcpEnableOracle": true,
  "mcpForbiddenPatterns": [
    "console.log",
    "debugger",
    "eval",
    "TODO",
    "FIXME"
  ]
}
```

### Relaxed Surgical Rules

```json
{
  "mcpMaxLines": 1000,
  "mcpEnableLoopDetection": false,
  "mcpMaxLoopAttempts": 5,
  "mcpMinDocumentationRatio": 0.05,
  "mcpEnableAutoCorrection": true,
  "mcpMaxBackupsPerFile": 5,
  "mcpEnableWorkflowOrchestration": false,
  "mcpEnableSessionMemory": true,
  "mcpEnableOracle": true,
  "mcpForbiddenPatterns": [
    "debugger",
    "eval"
  ]
}
```

### Strict Surgical Rules

```json
{
  "mcpMaxLines": 500,
  "mcpEnableLoopDetection": true,
  "mcpMaxLoopAttempts": 2,
  "mcpMinDocumentationRatio": 0.2,
  "mcpEnableAutoCorrection": false,
  "mcpMaxBackupsPerFile": 15,
  "mcpEnableWorkflowOrchestration": true,
  "mcpEnableSessionMemory": true,
  "mcpEnableOracle": true,
  "mcpForbiddenPatterns": [
    "console.log",
    "debugger",
    "eval",
    "TODO",
    "FIXME",
    "HACK",
    "XXX"
  ]
}
```

## Workflow Configuration

### Default Workflow Rules

```json
{
  "rules": {
    "searchBeforeEdit": true,
    "explainBeforeAct": true,
    "toolsBeforeManual": true,
    "noHallucination": true,
    "maintainProjectMap": true,
    "followConventions": true,
    "documentationRequired": true
  }
}
```

### Relaxed Workflow Rules

```json
{
  "rules": {
    "searchBeforeEdit": false,
    "explainBeforeAct": false,
    "toolsBeforeManual": false,
    "noHallucination": true,
    "maintainProjectMap": false,
    "followConventions": true,
    "documentationRequired": false
  }
}
```

### Strict Workflow Rules

```json
{
  "rules": {
    "searchBeforeEdit": true,
    "explainBeforeAct": true,
    "toolsBeforeManual": true,
    "noHallucination": true,
    "maintainProjectMap": true,
    "followConventions": true,
    "documentationRequired": true
  }
}
```

## Next Steps

- Copy the configuration that matches your use case
- Paste into Windsurf Settings (Ctrl+,)
- Reload Windsurf to apply changes
- See [BEST_PRACTICES.md](BEST_PRACTICES.md) for guidance
- See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) if issues arise
