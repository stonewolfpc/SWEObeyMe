# SWEObeyMe Best Practices Guide

Configuration guidelines for different scenarios and use cases.

## Scenario 1: Production Environment

**Use Case:** Enterprise or production code with strict compliance requirements

**Configuration:**
```json
{
  "sweObeyMe.initialization.neverAutoFix": true,
  "sweObeyMe.initialization.scanOnNewProject": true,
  "sweObeyMe.initialization.reportDetailLevel": "full",
  "sweObeyMe.initialization.digitalDebtThreshold": "10",
  "sweObeyMe.initialization.toolPriority": "mcp",
  "sweObeyMe.initialization.transparencyMode": "everything"
}
```

**Rationale:**
- `neverAutoFix: true` - Prevents automatic changes in production
- `scanOnNewProject: true` - Ensures full project analysis
- `reportDetailLevel: "full"` - Maximum transparency for audits
- `digitalDebtThreshold: "10"` - Strict debt tolerance
- `toolPriority: "mcp"` - Enforces surgical tool usage
- `transparencyMode: "everything"` - Full decision logging

**Additional Recommendations:**
- Enable all C# detectors for C# projects
- Set `severityThreshold: 0` to catch all errors
- Keep backup retention high (10 backups)
- Enable loop detection

## Scenario 2: Rapid Prototyping

**Use Case:** Fast development, experimentation, MVP building

**Configuration:**
```json
{
  "sweObeyMe.initialization.neverAutoFix": false,
  "sweObeyMe.initialization.scanOnlyWhenAsked": true,
  "sweObeyMe.initialization.reportDetailLevel": "minimal",
  "sweObeyMe.initialization.digitalDebtThreshold": "always",
  "sweObeyMe.initialization.toolPriority": "none",
  "sweObeyMe.initialization.transparencyMode": "silent"
}
```

**Rationale:**
- `neverAutoFix: false` - Allows automatic fixes for speed
- `scanOnlyWhenAsked: true` - Reduces overhead
- `reportDetailLevel: "minimal"` - Less noise
- `digitalDebtThreshold: "always"` - No debt warnings
- `toolPriority: "none"` - No tool restrictions
- `transparencyMode: "silent"` - Minimal logging

**Additional Recommendations:**
- Disable C# Bridge if not using C#
- Disable loop detection
- Reduce backup retention (3 backups)
- Disable auto-repair

## Scenario 3: Large Codebase

**Use Case:** Projects with 10,000+ files, monorepos, enterprise applications

**Configuration:**
```json
{
  "sweObeyMe.initialization.neverAutoFix": true,
  "sweObeyMe.initialization.scanOnNewProject": false,
  "sweObeyMe.initialization.scanOnlyOnProjectMapChange": true,
  "sweObeyMe.initialization.reportDetailLevel": "standard",
  "sweObeyMe.initialization.digitalDebtThreshold": "50",
  "sweObeyMe.initialization.toolPriority": "mcp"
}
```

**Rationale:**
- `scanOnNewProject: false` - Avoids full scans on large projects
- `scanOnlyOnProjectMapChange: true` - Only scans when structure changes
- `reportDetailLevel: "standard"` - Balanced detail
- `digitalDebtThreshold: "50"` - Reasonable debt tolerance
- `toolPriority: "mcp"` - Still enforces surgical tools

**Additional Recommendations:**
- Increase C# alert cooldown to 60-120 seconds
- Enable deduplication
- Increase confidence threshold to 80%
- Disable non-critical C# detectors
- Consider selective file scanning

## Scenario 4: Small Project / Personal

**Use Case:** Personal projects, small teams, learning

**Configuration:**
```json
{
  "sweObeyMe.initialization.neverAutoFix": false,
  "sweObeyMe.initialization.scanOnNewProject": true,
  "sweObeyMe.initialization.reportDetailLevel": "standard",
  "sweObeyMe.initialization.digitalDebtThreshold": "20",
  "sweObeyMe.initialization.toolPriority": "mcp"
}
```

**Rationale:**
- `neverAutoFix: false` - Helpful for learning
- `scanOnNewProject: true` - Full analysis on small projects
- `reportDetailLevel: "standard"` - Good balance
- `digitalDebtThreshold: "20"` - Moderate tolerance
- `toolPriority: "mcp"` - Enforces good habits

**Additional Recommendations:**
- Enable all helpful auto-fixes
- Keep default backup retention
- Enable loop detection
- Use standard C# detector settings

## Scenario 5: C# .NET Development

**Use Case:** C# projects, .NET applications, enterprise C# codebases

**Configuration:**
```json
{
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
  }
}
```

**Rationale:**
- All detectors enabled for comprehensive C# analysis
- `severityThreshold: 0` - Catch all errors
- `confidenceThreshold: 70` - Balanced false positive rate
- `keepAiInformed: true` - AI sees errors in context

**Additional Recommendations:**
- Increase cooldown for large C# projects
- Disable stringConcatenation if not needed
- Enable mathSafety for financial/scientific code
- Use "verbose" log verbosity for debugging

## Scenario 6: JavaScript / TypeScript Development

**Use Case:** JS/TS projects, web applications, Node.js services

**Configuration:**
```json
{
  "sweObeyMe.initialization.neverAutoFix": false,
  "sweObeyMe.initialization.scanOnNewProject": true,
  "sweObeyMe.initialization.reportDetailLevel": "standard",
  "sweObeyMe.initialization.toolPriority": "mcp",
  "sweObeyMe.csharpBridge.enabled": false
}
```

**Rationale:**
- Disable C# Bridge (not needed for JS/TS)
- Standard surgical enforcement
- Auto-fix helpful for JS/TS development

**Additional Recommendations:**
- Focus on file size limits (common issue in JS)
- Enable loop detection (JS prone to infinite loops)
- Use project memory for package.json analysis
- Enable naming convention validation

## Scenario 7: Multi-Language Project

**Use Case:** Projects with multiple languages (monorepos, polyglot systems)

**Configuration:**
```json
{
  "sweObeyMe.initialization.scanOnNewProject": false,
  "sweObeyMe.initialization.scanOnlyOnProjectMapChange": true,
  "sweObeyMe.initialization.reportDetailLevel": "standard",
  "sweObeyMe.csharpBridge.enabled": true,
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
  }
}
```

**Rationale:**
- Selective C# detectors (disable language-specific ones)
- Project map change scanning for efficiency
- Standard report detail

**Additional Recommendations:**
- Use project memory to track language-specific conventions
- Create language-specific contracts in subdirectories
- Configure naming conventions per language
- Use file extensions to guide tool selection

## Scenario 8: Open Source Contribution

**Use Case:** Contributing to open source projects, PR reviews

**Configuration:**
```json
{
  "sweObeyMe.initialization.neverAutoFix": true,
  "sweObeyMe.initialization.scanOnlyWhenAsked": true,
  "sweObeyMe.initialization.reportDetailLevel": "full",
  "sweObeyMe.initialization.toolPriority": "mcp",
  "sweObeyMe.initialization.transparencyMode": "major"
}
```

**Rationale:**
- `neverAutoFix: true` - Respect existing code style
- `scanOnlyWhenAsked: true` - Don't modify without permission
- `reportDetailLevel: "full"` - Detailed analysis for PRs
- `transparencyMode: "major"` - Log important decisions

**Additional Recommendations:**
- Use project memory to understand project conventions
- Check CONTRIBUTING.md before making changes
- Respect existing file structure
- Use preflight validation before changes

## Scenario 9: Teaching / Learning

**Use Case:** Coding bootcamps, tutorials, learning environments

**Configuration:**
```json
{
  "sweObeyMe.initialization.neverAutoFix": false,
  "sweObeyMe.initialization.scanOnNewProject": true,
  "sweObeyMe.initialization.reportDetailLevel": "full",
  "sweObeyMe.initialization.transparencyMode": "everything",
  "sweObeyMe.initialization.toolPriority": "windsurf"
}
```

**Rationale:**
- `neverAutoFix: false` - Show automatic fixes for learning
- `reportDetailLevel: "full"` - Maximum educational value
- `transparencyMode: "everything"` - Explain all decisions
- `toolPriority: "windsurf"` - Allow built-in tools for learning

**Additional Recommendations:**
- Enable all educational features
- Use project memory to track learning progress
- Enable verbose logging
- Use explain_rejection frequently

## Scenario 10: Legacy Code Migration

**Use Case:** Migrating legacy codebases to modern standards

**Configuration:**
```json
{
  "sweObeyMe.initialization.neverAutoFix": false,
  "sweObeyMe.initialization.scanOnNewProject": true,
  "sweObeyMe.initialization.reportDetailLevel": "full",
  "sweObeyMe.initialization.digitalDebtThreshold": "always",
  "sweObeyMe.initialization.autoFixNaming": true,
  "sweObeyMe.initialization.autoFixDocumentation": true
}
```

**Rationale:**
- `neverAutoFix: false` - Allow automatic modernization
- `digitalDebtThreshold: "always"` - Ignore debt during migration
- Enable auto-fix for naming and documentation

**Additional Recommendations:**
- Use project memory to track migration progress
- Incrementally apply fixes
- Keep extensive backups
- Use refactor_move_block frequently
- Document migration decisions

## General Best Practices

### 1. Always Enable Surgical Plan Validation

Before any file write, validate the plan:
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

### 2. Use Project Memory

Index project structure early:
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

### 3. Check File Context Before Changes

Get comprehensive context:
```json
{
  "tool": "get_file_context",
  "arguments": {
    "path": "./src/index.js"
  }
}
```

### 4. Analyze Impact Before Refactoring

Understand dependencies:
```json
{
  "tool": "analyze_change_impact",
  "arguments": {
    "path": "./src/index.js",
    "changes": "Extract large function to utils"
  }
}
```

### 5. Verify Imports After Changes

Ensure no broken references:
```json
{
  "tool": "verify_imports",
  "arguments": {
    "content": "// Your code here",
    "path": "./src/index.js"
  }
}
```

### 6. Run Related Tests After Changes

Prevent regressions:
```json
{
  "tool": "run_related_tests",
  "arguments": {
    "path": "./src/index.js"
  }
}
```

### 7. Check for Anti-Patterns

Maintain code quality:
```json
{
  "tool": "check_for_anti_patterns",
  "arguments": {
    "path": "./src/index.js"
  }
}
```

### 8. Validate Naming Conventions

Consistent naming:
```json
{
  "tool": "validate_naming_conventions",
  "arguments": {
    "path": "./src/index.js"
  }
}
```

## Configuration Migration Guide

### From v1.2.1 to v1.3.0

**New Features:**
- Rule Engine (7 strict behavior rules)
- Persistent Project Memory
- Fallback Behavior System
- Anti-Hallucination Protection
- Tool Priority System

**Required Changes:**
1. Enable rule compliance in settings (automatic)
2. Configure scan behavior for project memory
3. Set tool priority (default: "mcp")

**Recommended Settings:**
```json
{
  "sweObeyMe.initialization.scanOnNewProject": true,
  "sweObeyMe.initialization.toolPriority": "mcp"
}
```

### From v1.0.x to v1.3.0

**Major Changes:**
- Governor Pattern added (v1.0.17)
- C# Bridge added (v1.0.13)
- Workflow Automation added (v1.3.0)

**Required Changes:**
1. Review and update surgical rules
2. Configure C# Bridge if using C#
3. Configure workflow automation

**Recommended Settings:**
```json
{
  "sweObeyMe.csharpBridge.enabled": true,
  "sweObeyMe.initialization.scanOnNewProject": true,
  "sweObeyMe.initialization.toolPriority": "mcp"
}
```

## Performance vs. Strictness Trade-offs

| Setting | Strict | Balanced | Performance |
|---------|--------|----------|-------------|
| Line count limit | 700 | 700 | 1000 |
| Auto-fix | Never | Selective | Always |
| Scan frequency | Always | On change | Manual |
| Report detail | Full | Standard | Minimal |
| Tool priority | MCP | MCP | None |
| Backup retention | 10 | 5 | 3 |

## Next Steps

- See [CONFIGURATION_EXAMPLES.md](CONFIGURATION_EXAMPLES.md) for detailed configs
- See [PERFORMANCE_TIPS.md](PERFORMANCE_TIPS.md) for optimization
- See [FAQ.md](FAQ.md) for common questions
