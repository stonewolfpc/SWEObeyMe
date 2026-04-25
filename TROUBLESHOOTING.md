# SWEObeyMe Troubleshooting Guide

Common issues and solutions for SWEObeyMe.

## MCP Server Issues

### MCP Server Not Loading

**Symptoms:**

- Extension shows as inactive
- MCP tools not available in Windsurf
- Error: "MCP server not found"

**Solutions:**

1. Check extension activation:
   - Open Windsurf
   - Go to Extensions (Ctrl+Shift+X)
   - Verify SWEObeyMe is enabled
   - Reload Windsurf (Ctrl+Shift+P → "Reload Window")

2. Check MCP configuration:
   - Open Windsurf Settings (Ctrl+,)
   - Search for "MCP"
   - Verify SWEObeyMe is listed in MCP servers
   - Check command path: `node --no-warnings file:///d:/SWEObeyMe-restored/index.js`

3. Check Node.js version:
   - Run `node --version` in terminal
   - Must be 18.0.0 or higher
   - Update if needed: `nvm install 18`

4. Check for duplicate servers:
   - Extension automatically cleans up stale instances
   - If issue persists, manually delete PID file: `%LOCALAPPDATA%\SWEObeyMe\.sweobeyme-pid`

### MCP Server Crashes on Startup

**Symptoms:**

- Extension activates but server immediately crashes
- Error in console: "Process exited with code 1"

**Solutions:**

1. Enable debug mode:

   ```json
   {
     "SWEOBEYME_DEBUG": "1"
   }
   ```

2. Check console output for specific error
3. Verify all dependencies are installed: `npm install`
4. Check file permissions on backup directory
5. Verify Node.js version compatibility

## File Operation Issues

### File Write Rejected

**Symptoms:**

- AI attempts to write file but operation is rejected
- Error: "Line count exceeds limit"
- Error: "Forbidden pattern detected"

**Solutions:**

**Line count exceeds limit:**

- Current limit: 700 lines per file
- Use `refactor_move_block` to split large files
- Extract functions/modules to separate files
- Example:
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

**Forbidden pattern detected:**

- Remove `console.log` statements
- Remove `TODO` comments
- Remove `debugger` statements
- Remove `eval()` calls
- Or disable auto-correction in settings

**Duplicate file detected:**

- Check if file already exists
- Use different filename
- Or delete existing file first

### Backup Failed

**Symptoms:**

- File write rejected due to backup failure
- Error: "Backup failed"
- Error: "Backup directory not accessible"

**Solutions:**

1. Check backup directory permissions:
   - Default: `%LOCALAPPDATA%\SWEObeyMe\.sweobeyme-backups`
   - Ensure write access
   - Or set custom backup path in settings

2. Check disk space:
   - Ensure sufficient disk space for backups
   - Clean up old backups if needed

3. Verify backup directory exists:
   - Extension creates automatically
   - If manual deletion, restart extension

### File Read Shows No Context

**Symptoms:**

- `read_file` returns file content without enhanced context
- No project structure information
- No suggested next tools

**Solutions:**

1. Verify project memory is initialized:
   ```json
   {
     "tool": "index_project_structure"
   }
   ```

````

2. Check scan settings:
 - Ensure `scanOnNewProject` or `scanOnLoad` is enabled
 - Or manually run project scan

3. Verify project has files:
 - Empty projects may not have structure to index

## C# Bridge Issues

### C# Errors Not Showing

**Symptoms:**
- C# files don't show error annotations
- No errors in file reads
- C# Bridge appears inactive

**Solutions:**
1. Enable C# Bridge in settings:
 - Open Windsurf Settings
 - Navigate to SWEObeyMe → C# Bridge
 - Enable "Enable C# Bridge"
 - Enable "Keep AI Informed"

2. Check file extension:
 - Must be `.cs` or `.csx`
 - Verify file is recognized as C#

3. Check detector settings:
 - Ensure at least one detector is enabled
 - Common: missingUsing, emptyCatch, deepNesting

4. Restart Windsurf after changing settings

### C# Bridge Performance Issues

**Symptoms:**
- Slow file reads with C# files
- High CPU usage
- Lag in IDE

**Solutions:**
1. Reduce detector count:
 - Disable detectors you don't need
 - Focus on critical ones (missingUsing, emptyCatch)

2. Increase alert cooldown:
 - Default: 30 seconds
 - Increase to 60-120 seconds for large projects

3. Enable deduplication:
 - Group identical warnings to reduce noise
 - Already enabled by default

4. Increase confidence threshold:
 - Default: 70%
 - Increase to 80-90% to reduce false positives

## Configuration Issues

### Settings Not Applied

**Symptoms:**
- Changed settings but no effect
- Extension uses default values

**Solutions:**
1. Reload Windsurf after changing settings
2. Check settings file path:
 - Windsurf settings: `%APPDATA%\Windsurf\User\settings.json`
 - Verify SWEObeyMe section exists
3. Check for syntax errors in settings JSON
4. Restart MCP server:
 - Disable extension
 - Re-enable extension

### Scan Behavior Not Working

**Symptoms:**
- Project not scanning on new/open
- No project memory created

**Solutions:**
1. Verify scan settings:
 - At least one scan option must be enabled
 - Cannot have all options disabled

2. Check for conflicts:
 - `neverScan` overrides all other scan options
 - Ensure `neverScan` is disabled

3. Manually trigger scan:
 ```json
 {
  "tool": "index_project_structure"
}
````

## Performance Issues

### High Credit Usage

**Symptoms:**

- Higher than normal credit consumption
- Slow response times

**Causes:**

- SWEObeyMe performs extensive validation
- Maintains persistent project memory
- Enforces strict discipline through multiple tool calls

**Solutions:**

1. Reduce scan frequency:
   ```json
   {
     "sweObeyMe.initialization.scanOnlyWhenAsked": true
   }
   ```

````

2. Reduce report detail:
 ```json
 {
   "sweObeyMe.initialization.reportDetailLevel": "minimal"
 }
````

3. Disable C# Bridge if not needed:
   ```json
   {
     "sweObeyMe.csharpBridge.enabled": false
   }
   ```

````

4. Use free AI models:
 - SWEObeyMe designed for free models
 - Premium models may have higher costs

### Slow File Operations

**Symptoms:**
- File reads/writes take longer than expected
- IDE feels sluggish

**Solutions:**
1. Check project size:
 - Large projects (10,000+ files) may be slow
 - Consider using `scanOnlyOnProjectMapChange`

2. Disable auto-fix:
 ```json
 {
   "sweObeyMe.initialization.neverAutoFix": true
 }
````

3. Reduce backup retention:
   ```json
   {
     "mcpMaxBackupsPerFile": 5
   }
   ```

````

4. Disable loop detection if not needed:
 ```json
 {
   "mcpEnableLoopDetection": false
 }
````

## Extension Issues

### Extension Won't Install

**Symptoms:**

- Installation fails
- Error: "Extension not compatible"
- Error: "Missing dependencies"

**Solutions:**

1. Check VS Code/Windsurf version:
   - Requires VS Code 1.60.0 or higher
   - Requires Windsurf Next (Phoenix Alpha Fast) or later

2. Build .vsix manually:

   ```bash
   npm run package
   ```

   Then install the generated .vsix file

3. Check dependencies:

   ```bash
   npm install
   ```

4. Check for conflicts:
   - Disable other MCP extensions temporarily
   - Check for duplicate tool names

### Extension Not Showing in Activity Bar

**Symptoms:**

- SWEObeyMe icon not visible
- Settings panel not accessible

**Solutions:**

1. Check extension activation:
   - Extension activates on `onStartupFinished`
   - May take a few seconds after Windsurf loads

2. Check configuration:
   ```json
   {
     "sweObeyMe.enabled": true
   }
   ```

````

3. Reload Windsurf:
 - Ctrl+Shift+P → "Reload Window"

## Error Messages

### "Unknown Error"

**Symptoms:**
- Generic error message with no details
- No clear indication of what went wrong

**Solutions:**
1. Enable debug mode:
 ```json
 {
   "SWEOBEYME_DEBUG": "1"
 }
````

2. Check error log:
   - Location: `error_log.json` in project root
   - Review for detailed error information

3. Check console output:
   - Open Windsurf Developer Tools
   - Check for stack traces

### "Tool Not Found"

**Symptoms:**

- AI tries to use a tool that doesn't exist
- Error: "Tool not found: tool_name"

**Solutions:**

1. Verify tool name:
   - Check tool registry: `lib/tools/registry.js`
   - Ensure correct spelling and casing

2. Check if tool is disabled:
   - Some tools may be conditionally enabled
   - Check tool dependencies

3. Use `obey_me_status` to see available tools:
   ```json
   {
     "tool": "obey_me_status"
   }
   ```

````

## Getting Help

### Still Having Issues?

1. Check documentation:
 - [QUICKSTART.md](QUICKSTART.md)
 - [BEST_PRACTICES.md](BEST_PRACTICES.md)
 - [FAQ.md](FAQ.md)
 - [PERFORMANCE_TIPS.md](PERFORMANCE_TIPS.md)

2. Enable debug logging:
 ```json
 {
   "SWEOBEYME_DEBUG": "1"
 }
````

3. Check error log:
   - `error_log.json` in project root
   - Review for detailed error information

4. Report issue on GitHub:
   - https://github.com/stonewolfpc/SWEObeyMe/issues
   - Include error log
   - Include configuration
   - Include Windsurf version

### Support Channels

- GitHub: https://github.com/stonewolfpc/SWEObeyMe
- PayPal Donate: [Donate Button](README.md)
- Patreon: https://patreon.com/StoneWolfSystems
