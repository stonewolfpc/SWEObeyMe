# Refactoring Tool Error Patterns

This document documents error patterns encountered during refactoring work to prevent future occurrences and enable test coverage.

## Error Types Encountered

### 1. SWEObeyMe MCP Tool Failure
**Error:** `Cannot read properties of undefined (reading 'push')`
**Context:** Occurred when calling `mcp1_project_context` during refactoring workflow
**Cause:** Internal SWEObeyMe MCP server issue - undefined state in tool registry
**Fix:** Proceeded with standard tools when SWEObeyMe tools unavailable
**Test Coverage Needed:** 
- Detect when MCP tools are unavailable
- Graceful fallback to standard tools
- Validation that fallback produces correct results

### 2. Backup Directory Missing
**Error:** `ENOENT: no such file or directory, access 'D:\SWEObeyMe-restored\dist\.swe-backups'`
**Context:** SWEObeyMe server diagnostics check
**Cause:** Backup directory not created during initial setup
**Fix:** Created `dist/.swe-backups` directory manually
**Test Coverage Needed:**
- Verify backup directory exists on startup
- Auto-create backup directory if missing
- Test backup operations with newly created directory

### 3. Syntax Errors from Incomplete Edits
**Error:** `Declaration or statement expected` at multiple lines
**Context:** handlers-refactoring.js after refactoring
**Cause:** Leftover code from previous edit not properly removed
**Fix:** Removed leftover code (lines 98-108) that was causing syntax errors
**Test Coverage Needed:**
- Validate JavaScript syntax after any edit operation
- Check for incomplete code blocks
- Verify file compiles before committing changes

### 4. Duplicate Function Declarations
**Error:** `The symbol "findDuplicateFiles" has already been declared` (and similar for other functions)
**Context:** lib/file-registry.js after extracting modules
**Cause:** Imported functions had same names as exported wrapper functions
**Fix:** Renamed imports with "Impl" suffix and re-exported with original names
**Test Coverage Needed:**
- Detect duplicate symbol declarations before build
- Validate no naming conflicts between imports and exports
- Check for duplicate function/class definitions

### 5. Missing Export After Refactoring
**Error:** `No matching export in "lib/file-registry.js" for import "findDuplicateFiles"`
**Context:** Other files importing functions that were removed during refactoring
**Cause:** Removed exported functions without maintaining backward compatibility
**Fix:** Re-exported functions with proper name mapping
**Test Coverage Needed:**
- Verify all imports have matching exports
- Check backward compatibility after refactoring
- Test that dependent modules still work after changes

## Prevention Strategies

1. **Always rebuild after refactoring** - Catch build errors immediately
2. **Validate syntax before committing** - Use linter and compiler checks
3. **Check import/export consistency** - Ensure all imports have matching exports
4. **Test SWEObeyMe tool availability** - Graceful fallback when MCP tools fail
5. **Verify directory structure** - Ensure required directories exist
6. **Review edits for leftover code** - Check for incomplete removals

## Test Recommendations

Add tests to detect:
- MCP tool availability and fallback behavior
- Backup directory existence and auto-creation
- Syntax validation after edits
- Import/export consistency
- Duplicate symbol detection
- Backward compatibility after refactoring
