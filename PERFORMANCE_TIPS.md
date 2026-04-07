# SWEObeyMe Performance Tips

Optimization recommendations for SWEObeyMe.

## Understanding Performance Impact

SWEObeyMe performs extensive validation, maintains persistent project memory, and enforces strict discipline through multiple tool calls. This results in higher token consumption than basic coding assistants, but provides significant value in code quality and architectural compliance.

**Performance Factors:**
- Project scanning and indexing
- File validation and verification
- Backup operations
- C# error detection
- Project memory maintenance
- Tool priority enforcement
- Loop detection

## Configuration Optimization

### Reduce Scan Frequency

**For Large Projects (10,000+ files):**
```json
{
  "sweObeyMe.initialization.scanOnNewProject": false,
  "sweObeyMe.initialization.scanOnlyOnProjectMapChange": true
}
```

**For Rapid Development:**
```json
{
  "sweObeyMe.initialization.scanOnlyWhenAsked": true
}
```

**For Minimal Overhead:**
```json
{
  "sweObeyMe.initialization.neverScan": true
}
```

### Reduce Report Detail

**Minimal Reporting:**
```json
{
  "sweObeyMe.initialization.reportDetailLevel": "minimal"
}
```

**Standard Reporting:**
```json
{
  "sweObeyMe.initialization.reportDetailLevel": "standard"
}
```

**Full Reporting (for audits):**
```json
{
  "sweObeyMe.initialization.reportDetailLevel": "full"
}
```

### Disable Auto-Fix

**Disable All Auto-Fix:**
```json
{
  "sweObeyMe.initialization.neverAutoFix": true
}
```

**Enable Specific Auto-Fix:**
```json
{
  "sweObeyMe.initialization.neverAutoFix": false,
  "sweObeyMe.initialization.autoFixNaming": true,
  "sweObeyMe.initialization.autoFixDocumentation": false
}
```

### Adjust Tool Priority

**No Tool Restrictions:**
```json
{
  "sweObeyMe.initialization.toolPriority": "none"
}
```

**Windsurf Tools First:**
```json
{
  "sweObeyMe.initialization.toolPriority": "windsurf"
}
```

**SWEObeyMe Tools First (recommended):**
```json
{
  "sweObeyMe.initialization.toolPriority": "mcp"
}
```

### Adjust Transparency Mode

**Silent Mode:**
```json
{
  "sweObeyMe.initialization.transparencyMode": "silent"
}
```

**Major Decisions Only:**
```json
{
  "sweObeyMe.initialization.transparencyMode": "major"
}
```

**Everything (for debugging):**
```json
{
  "sweObeyMe.initialization.transparencyMode": "everything"
}
```

## C# Bridge Optimization

### Reduce Detector Count

**Enable Only Critical Detectors:**
```json
{
  "sweObeyMe.csharpBridge.detectors": {
    "missingUsing": true,
    "emptyCatch": true,
    "resourceLeaks": true,
    "nullReference": true
  }
}
```

**Disable Non-Critical Detectors:**
```json
{
  "sweObeyMe.csharpBridge.detectors": {
    "missingUsing": true,
    "emptyCatch": true,
    "deepNesting": false,
    "asyncAwait": true,
    "resourceLeaks": true,
    "mathSafety": false,
    "nullReference": true,
    "staticMutation": false,
    "stringConcatenation": false
  }
}
```

### Increase Alert Cooldown

**For Large Projects:**
```json
{
  "sweObeyMe.csharpBridge.alertCooldown": 60
}
```

**For Very Large Projects:**
```json
{
  "sweObeyMe.csharpBridge.alertCooldown": 120
}
```

**Default:**
```json
{
  "sweObeyMe.csharpBridge.alertCooldown": 30
}
```

### Increase Confidence Threshold

**Reduce False Positives:**
```json
{
  "sweObeyMe.csharpBridge.confidenceThreshold": 80
}
```

**Reduce False Positives Further:**
```json
{
  "sweObeyMe.csharpBridge.confidenceThreshold": 90
}
```

**Default:**
```json
{
  "sweObeyMe.csharpBridge.confidenceThreshold": 70
}
```

### Increase Severity Threshold

**Show Only Errors:**
```json
{
  "sweObeyMe.csharpBridge.severityThreshold": 2
}
```

**Show Warnings and Errors:**
```json
{
  "sweObeyMe.csharpBridge.severityThreshold": 1
}
```

**Show Everything:**
```json
{
  "sweObeyMe.csharpBridge.severityThreshold": 0
}
```

### Disable C# Bridge

**If Not Using C#:**
```json
{
  "sweObeyMe.csharpBridge.enabled": false
}
```

## Surgical Rules Optimization

### Increase Line Limit

**For Large Files:**
```json
{
  "mcpMaxLines": 1000
}
```

**For Very Large Files:**
```json
{
  "mcpMaxLines": 1500
}
```

**Default (recommended):**
```json
{
  "mcpMaxLines": 700
}
```

### Disable Loop Detection

**If Not Needed:**
```json
{
  "mcpEnableLoopDetection": false
}
```

### Reduce Backup Retention

**For Disk Space:**
```json
{
  "mcpMaxBackupsPerFile": 3
}
```

**Default:**
```json
{
  "mcpMaxBackupsPerFile": 10
}
```

### Disable Auto-Correction

**For Performance:**
```json
{
  "mcpEnableAutoCorrection": false
}
```

### Disable Workflow Orchestration

**If Not Needed:**
```json
{
  "mcpEnableWorkflowOrchestration": false
}
```

### Disable Session Memory

**If Not Needed:**
```json
{
  "mcpEnableSessionMemory": false
}
```

## Project-Specific Optimization

### Small Projects (< 1,000 files)

**Recommended Configuration:**
```json
{
  "sweObeyMe.initialization.scanOnNewProject": true,
  "sweObeyMe.initialization.reportDetailLevel": "standard",
  "sweObeyMe.csharpBridge.alertCooldown": 30,
  "sweObeyMe.csharpBridge.confidenceThreshold": 70
}
```

**Rationale:** Full scanning is fast for small projects, providing maximum value.

### Medium Projects (1,000 - 10,000 files)

**Recommended Configuration:**
```json
{
  "sweObeyMe.initialization.scanOnNewProject": false,
  "sweObeyMe.initialization.scanOnlyOnProjectMapChange": true,
  "sweObeyMe.initialization.reportDetailLevel": "standard",
  "sweObeyMe.csharpBridge.alertCooldown": 60,
  "sweObeyMe.csharpBridge.confidenceThreshold": 80
}
```

**Rationale:** Scan on change reduces overhead while maintaining value.

### Large Projects (10,000+ files)

**Recommended Configuration:**
```json
{
  "sweObeyMe.initialization.scanOnNewProject": false,
  "sweObeyMe.initialization.scanOnlyWhenAsked": true,
  "sweObeyMe.initialization.reportDetailLevel": "minimal",
  "sweObeyMe.csharpBridge.alertCooldown": 120,
  "sweObeyMe.csharpBridge.confidenceThreshold": 85,
  "sweObeyMe.csharpBridge.detectors": {
    "missingUsing": true,
    "emptyCatch": true,
    "resourceLeaks": true,
    "nullReference": true
  }
}
```

**Rationale:** Manual scanning and reduced detector count minimize overhead.

### Monorepos

**Recommended Configuration:**
```json
{
  "sweObeyMe.initialization.scanOnNewProject": false,
  "sweObeyMe.initialization.scanOnlyOnProjectMapChange": true,
  "sweObeyMe.initialization.reportDetailLevel": "standard",
  "sweObeyMe.csharpBridge.alertCooldown": 90,
  "sweObeyMe.csharpBridge.confidenceThreshold": 80
}
```

**Rationale:** Scan on change balances overhead with value for multi-package projects.

## Tool Usage Optimization

### Use Preflight Validation

Instead of individual validations, use preflight:
```json
{
  "tool": "preflight_change",
  "arguments": {
    "path": "./src/index.js",
    "content": "// Your code here"
  }
}
```

This runs all validations in one operation.

### Batch File Operations

When working with multiple files, batch operations to reduce overhead:
1. Index project structure once
2. Analyze conventions once
3. Validate all changes at once

### Use Dry Run

Test changes before applying:
```json
{
  "tool": "dry_run_write_file",
  "arguments": {
    "path": "./src/index.js",
    "content": "// Your code here"
  }
}
```

This validates without creating backups.

### Skip Validation for Trivial Changes

For very small changes (e.g., typo fixes), consider:
- Using standard file operations (if tool priority allows)
- Disabling validation temporarily
- Using minimal report detail

## Memory Optimization

### Reduce Project Memory Size

**Selective Indexing:**
```json
{
  "tool": "index_project_structure",
  "arguments": {
    "excludeDirs": ["node_modules", "dist", "build"]
  }
}
```

**Clear Old Memory:**
Manually delete project memory files when not needed.

### Reduce Backup Size

**Reduce Retention:**
```json
{
  "mcpMaxBackupsPerFile": 3
}
```

**Clean Old Backups:**
Manually delete old backup files from backup directory.

### Disable Unnecessary Features

**Disable Oracle:**
```json
{
  "mcpEnableOracle": false
}
```

**Disable Session Memory:**
```json
{
  "mcpEnableSessionMemory": false
}
```

## Credit Usage Optimization

### Use Free AI Models

SWEObeyMe is designed for free AI models. Premium models may have significantly higher costs due to extensive validation.

### Reduce Token Consumption

**Minimal Configuration:**
```json
{
  "sweObeyMe.initialization.scanOnlyWhenAsked": true,
  "sweObeyMe.initialization.reportDetailLevel": "minimal",
  "sweObeyMe.initialization.transparencyMode": "silent",
  "sweObeyMe.csharpBridge.enabled": false
}
```

**Expected Reduction:** 50-70% reduction in token consumption compared to full configuration.

### Batch Operations

Combine multiple operations into single requests to reduce round-trips.

### Cache Results

SWEObeyMe automatically caches some results. Leverage this by:
- Reusing project memory
- Avoiding repeated scans
- Using dry run before actual changes

## Performance Monitoring

### Enable Debug Logging

```json
{
  "SWEOBEYME_DEBUG": "1"
}
```

This provides detailed timing information.

### Monitor Backup Performance

Check backup directory size and file count:
```bash
# Windows
dir "%LOCALAPPDATA%\SWEObeyMe\.sweobeyme-backups"

# Linux/Mac
ls -la ~/.sweobeyme-backups
```

### Monitor Project Memory Size

Check project memory file size:
```bash
# Windows
dir project_map.json
dir tool-memory.json

# Linux/Mac
ls -lh project_map.json tool-memory.json
```

## Performance Benchmarks

### Small Project (100 files)
- Full scan: 2-5 seconds
- File read with context: 0.5-1 seconds
- File write with validation: 1-2 seconds

### Medium Project (5,000 files)
- Full scan: 10-20 seconds
- File read with context: 0.5-1 seconds
- File write with validation: 1-2 seconds

### Large Project (20,000 files)
- Full scan: 30-60 seconds
- File read with context: 0.5-1 seconds
- File write with validation: 1-2 seconds

**Note:** File operations are fast regardless of project size. Scanning is the main performance factor.

## Common Performance Issues

### Issue: Slow Project Scanning

**Solutions:**
- Reduce scan frequency
- Exclude large directories (node_modules, dist)
- Use scan on change instead of full scan
- Disable non-critical detectors

### Issue: High Memory Usage

**Solutions:**
- Reduce backup retention
- Clear old project memory
- Disable session memory
- Disable oracle

### Issue: Slow File Operations

**Solutions:**
- Disable auto-correction
- Reduce backup retention
- Use dry run for testing
- Disable loop detection

### Issue: High Credit Usage

**Solutions:**
- Use free AI models
- Reduce report detail
- Disable C# Bridge if not needed
- Use minimal configuration

## Optimization Checklist

### For Maximum Performance
- [ ] Set `scanOnlyWhenAsked: true`
- [ ] Set `reportDetailLevel: "minimal"`
- [ ] Set `transparencyMode: "silent"`
- [ ] Disable C# Bridge if not needed
- [ ] Disable auto-correction
- [ ] Reduce backup retention to 3
- [ ] Disable loop detection
- [ ] Disable oracle
- [ ] Disable session memory

### For Balanced Performance
- [ ] Set `scanOnlyOnProjectMapChange: true`
- [ ] Set `reportDetailLevel: "standard"`
- [ ] Set `transparencyMode: "major"`
- [ ] Enable only critical C# detectors
- [ ] Increase C# alert cooldown to 60
- [ ] Increase C# confidence threshold to 80
- [ ] Reduce backup retention to 5

### For Maximum Value (Performance Trade-off)
- [ ] Set `scanOnNewProject: true`
- [ ] Set `reportDetailLevel: "full"`
- [ ] Set `transparencyMode: "everything"`
- [ ] Enable all C# detectors
- [ ] Enable all auto-fix options
- [ ] Enable loop detection
- [ ] Enable oracle
- [ ] Enable session memory

## Next Steps

- Apply relevant optimizations to your configuration
- Monitor performance after changes
- Adjust based on your specific needs
- See [BEST_PRACTICES.md](BEST_PRACTICES.md) for configuration guidance
- See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) if issues persist
