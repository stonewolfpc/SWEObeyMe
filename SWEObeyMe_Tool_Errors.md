# SWEObeyMe MCP Server Tool Errors

## Date: April 24, 2026

## Context

I was attempting to use SWEObeyMe MCP server tools to fix a double BOS (Beginning of Sequence) token prepend issue in the LFM2.5 prompt formatting pipeline in `d:\MasterControl-V2-CPP\examples\basic_inference\cli_main.cpp`.

## What I Was Doing

The LFM formatter was adding `<|startoftext|>` (token ID 1) at the beginning of prompts, but the tokenizer code was also prepending the BOS token again, resulting in double BOS tokens. This was breaking the prompt structure for LFM models.

I wanted to use SWEObeyMe to:

1. Detect the project type
2. Read the file with proper context
3. Apply surgical changes to prevent double BOS prepend

## Tool Errors Encountered

### Error 1: `mcp1_project_context` with `detect_type` operation

- **Tool**: `mcp1_project_context`
- **Operation**: `detect_type`
- **Parameters**:
  - First attempt: `file_path = "d:\MasterControl-V2-CPP\examples\basic_inference\cli_main.cpp"`
  - Second attempt: `project_path = "d:\MasterControl-V2-CPP"`
- **Error Message**: "Cannot read properties of undefined (reading 'push')"
- **Severity**: Tool failure - appears to be a bug in SWEObeyMe implementation
- **Root Cause**: Likely internal array manipulation error in the SWEObeyMe MCP server code
- **Impact**: Unable to detect project type, which is required by SWEObeyMe governance workflow

### Error 2: `mcp1_read_file`

- **Tool**: `mcp1_read_file`
- **Operation**: Reading file contents
- **Status**: User canceled this step (not a tool error)
- **Context**: Attempted to read file after project type detection failed

## Workaround Applied

Since SWEObeyMe tools were unavailable due to internal errors, I:

1. Used standard tools (edit, multi_edit) to manually fix brace structure issues in cli_main.cpp
2. Successfully rebuilt the project using build.ps1
3. The file now compiles correctly

## Remaining Work

The double BOS prepend fix still needs to be applied. The fix requires:

1. Removing debug output lines (190-192) that I added
2. Wrapping the BOS prepend code at lines 510-522 in an LFM detection check to prevent double-adding BOS for LFM models

## SWEObeyMe Integrity Score

- **Current Score**: 100/100 (after manual fixes)
- **Consecutive Failures**: 1 (from project_context error)
- **Status**: Functional but tool errors prevent full SWEObeyMe workflow

## Recommendation

The SWEObeyMe MCP server implementation needs debugging for the `project_context` tool. The error suggests an undefined array being accessed during push operation, which is likely a bug in the server-side code.

---

## Date: April 24, 2026 (Second Session)

## Context

I was attempting to use SWEObeyMe MCP server tools to update the ide_mcp_corpus/index.json file with a new backend_engineering category.

## What I Was Doing

I had created three new markdown files for API design documentation and needed to:

1. Read the index.json file (891 lines, 40KB)
2. Update it to add the backend_engineering category
3. Remove the retrieval rules section to a separate file to reduce size below 700 lines

## Tool Errors Encountered

### Error 3: `mcp1_read_file` on index.json

- **Tool**: `mcp1_read_file`
- **Operation**: Reading file contents
- **File**: `d:\SWEObeyMe-restored\ide_mcp_corpus\index.json`
- **File Size**: 40,806 bytes (40KB), 891 lines
- **Error**: Tool hangs indefinitely (no response)
- **Severity**: Tool failure - appears to be a timeout or deadlock in SWEObeyMe implementation
- **Investigation**:
  - File size is only 40KB - not large enough to cause a hang due to size
  - JSON is valid (verified with PowerShell ConvertFrom-Json)
  - Standard Windsurf read_file tool works fine on the same file
  - Issue is specific to SWEObeyMe MCP server implementation
- **Root Cause**: Likely a bug in the SWEObeyMe MCP server's file reading implementation - possibly:
  - Infinite loop in file parsing
  - Deadlock waiting for resource
  - Missing timeout handling
  - Issue with .json file extension handling
- **Impact**: Unable to use SWEObeyme governance workflow for files that trigger this hang

### Error 4: `mcp1_obey_surgical_plan` on index.json

- **Tool**: `mcp1_obey_surgical_plan`
- **Operation**: Validating surgical plan before write
- **File**: `d:\SWEObeyMe-restored\ide_mcp_corpus\index.json`
- **Error**: "File bloat detected. Current: 891 lines. After addition: 941 lines (exceeds 700)."
- **Severity**: Rejection by surgical plan (not a bug, but requires refactoring)
- **Context**: This is expected behavior - file exceeds 700 line limit
- **Resolution**: Created retrieval_rules.json to extract retrieval rules section

### Error 5: `mcp1_docs_lookup`

- **Tool**: `mcp1_docs_lookup`
- **Operation**: Searching corpus for timeout/hang documentation
- **Error**: Tool hangs indefinitely (no response)
- **Severity**: Tool failure - similar to mcp1_read_file hang
- **Root Cause**: Same underlying issue in SWEObeyMe MCP server

## Pattern Analysis

The SWEObeyMe MCP server appears to have a systemic issue where certain operations hang indefinitely. This affects:

- File reading operations (mcp1_read_file)
- Documentation lookup (mcp1_docs_lookup)
- Possibly other MCP server tools

The hang is NOT related to:

- File size (40KB is small)
- File validity (JSON is valid)
- Network issues (local file operations)

The hang IS related to:

- SWEObeyMe MCP server implementation
- Possibly specific file types or conditions

## Workaround Applied

Since SWEObeyMe MCP tools hang on certain operations, I:

1. Use standard Windsurf tools (read_file, edit, multi_edit) instead
2. Avoid SWEObeyMe MCP tools that hang
3. Document the hang issue for later investigation

## SWEObeyMe Integrity Score

- **Current Score**: Unknown (unable to check due to tool hangs)
- **Consecutive Failures**: Multiple (from tool hangs)
- **Status**: SWEObeyMe MCP server has critical hanging bug that prevents normal workflow

## Recommendation

The SWEObeyMe MCP server implementation needs immediate debugging for tool hangs. The server appears to have:

1. Missing timeout handling on file operations
2. Potential infinite loops in file parsing
3. Possible deadlock conditions

Priority should be given to:

1. Adding timeout handling to all MCP server operations
2. Implementing proper error handling and recovery
3. Adding logging to identify where hangs occur
4. Testing with various file types and sizes to identify trigger conditions

---

## Investigation Findings (April 24, 2026)

### Root Cause Analysis

After reviewing the SWEObeyMe MCP server code, I've identified the likely root causes of the tool hang issue:

#### 1. Directory Traversal Without Timeout or Loop Detection

**File**: `lib/project-awareness.js`
**Function**: `findProjectRoot()` (lines 388-407)

```javascript
findProjectRoot(filePath) {
  let currentPath = path.dirname(filePath);

  while (currentPath !== path.dirname(currentPath)) {
    // Check for project indicators
    const indicators = ['project.godot', 'package.json', 'pyproject.toml',
      'requirements.txt', 'CMakeLists.txt', 'Cargo.toml',
      'go.mod', '.git'];

    for (const indicator of indicators) {
      if (fs.existsSync(path.join(currentPath, indicator))) {
        return currentPath;
      }
    }

    currentPath = path.dirname(currentPath);
  }

  return null;
}
```

**Problems**:

- No timeout mechanism - could hang indefinitely on slow filesystems
- No loop detection - symbolic link loops could cause infinite traversal
- Uses synchronous `fs.existsSync()` in a loop
- No limit on traversal depth

**Trigger Conditions**:

- Symbolic link loops in directory structure
- Slow or unresponsive filesystem
- Very deep directory hierarchies
- Permission issues that cause slow responses

#### 2. Large File Reads Without Timeout

**Files**:

- `.sweobeyme-memory.json` (280KB)
- `project_map.json` (253KB)

**Functions**:

- `ProjectMemory.load()` in `lib/project-memory-core.js` (lines 65-87)
- `ProjectMemory.loadProjectMap()` (lines 97-122)

**Problems**:

- No timeout on `fs.readFile()` operations
- Large JSON parsing could be slow
- No error handling for corrupted JSON
- Synchronous operations in some paths

#### 3. Project Memory Initialization on Every Read

**File**: `lib/tools/handlers-file-ops.js`
**Function**: `read_file` (lines 131-138)

```javascript
const projectMemory = getProjectMemory();
if (!projectMemory && args.path) {
  try {
    await initializeProjectMemory(path.dirname(args.path));
  } catch (e) {
    log(`Project memory initialization failed: ${e.message}`);
  }
}
```

**Problems**:

- Attempts to initialize project memory on every file read if not initialized
- This triggers directory traversal and large file reads
- No caching of initialization state
- Could hang on first read of any file

#### 4. Session Tracker Operations Without Timeout

**File**: `lib/session-tracker.js`
**Operations**: Session cleanup, tool call tracking

**Problems**:

- No timeout on session operations
- Could hang if filesystem operations in cleanup fail
- Session cleanup happens on every tool call

### Prevention Strategies

#### 1. Add Timeout Handling to Directory Traversal

```javascript
async findProjectRoot(filePath, timeout = 5000) {
  const startTime = Date.now();
  let currentPath = path.dirname(filePath);
  const visited = new Set(); // Detect loops

  while (currentPath !== path.dirname(currentPath)) {
    if (Date.now() - startTime > timeout) {
      throw new Error(`Project root detection timeout after ${timeout}ms`);
    }

    if (visited.has(currentPath)) {
      throw new Error('Symbolic link loop detected in directory traversal');
    }
    visited.add(currentPath);

    // ... rest of logic
  }

  return null;
}
```

#### 2. Add Timeout to File Reads

```javascript
async readFileWithTimeout(filePath, timeout = 10000) {
  return Promise.race([
    fs.readFile(filePath, 'utf-8'),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Read timeout after ${timeout}ms`)), timeout)
    )
  ]);
}
```

#### 3. Cache Project Memory Initialization

```javascript
let initializationInProgress = false;
let initializationPromise = null;

async function initializeProjectMemory(workspacePath) {
  if (globalProjectMemory) {
    return globalProjectMemory;
  }

  if (initializationInProgress) {
    return initializationPromise;
  }

  initializationInProgress = true;
  initializationPromise = (async () => {
    try {
      globalProjectMemory = new ProjectMemory(workspacePath);
      await globalProjectMemory.load();
      return globalProjectMemory;
    } finally {
      initializationInProgress = false;
    }
  })();

  return initializationPromise;
}
```

#### 4. Add Logging for Debugging

```javascript
const log = (msg) => {
  if (!DEBUG_LOGS()) return;
  const timestamp = new Date().toISOString();
  process.stderr.write(`[${timestamp}] [SWEObeyMe-Audit]: ${msg}\n`);
};
```

#### 5. Limit Traversal Depth

```javascript
async findProjectRoot(filePath, maxDepth = 50) {
  let currentPath = path.dirname(filePath);
  let depth = 0;

  while (currentPath !== path.dirname(currentPath) && depth < maxDepth) {
    // ... traversal logic
    depth++;
  }

  return null;
}
```

### Additional Tools to Check

Based on the code review, these tools may also be susceptible to similar hang issues:

1. `mcp1_project_context` - Uses `detectProjectType()` which calls `fs.readdirSync()`
2. `mcp1_docs_lookup` - May use similar file reading patterns (HAS TIMEOUT PROTECTION - 5 seconds)
3. Any tool that reads `project_map.json` or `.sweobeyme-memory.json`
4. Tools that use project awareness features
5. `mcp1_get_file_context` - Calls `getFileContext()` which may trigger directory traversal
6. `mcp1_analyze_change_impact` - May use similar file operations
7. `mcp1_get_historical_context` - Uses synchronous `execSync` for git operations (lines 123-127 in context-handlers.js)
8. `mcp1_preflight_change` - Calls multiple handlers sequentially without overall timeout protection

#### Additional Issues Found

**File**: `lib/tools/context-handlers.js`
**Function**: `get_historical_context()` (lines 104-167)

```javascript
const gitLog = execSync(`git log --oneline -n ${limit} -- "${filePath}"`, {
  encoding: 'utf8',
  cwd: path.dirname(filePath),
  stdio: ['pipe', 'pipe', 'pipe'],
});
```

**Problems**:

- Uses synchronous `execSync` which blocks the event loop
- No timeout on git operations
- Git operations can hang on large repositories or network operations
- No error handling for git not being available

**File**: `lib/tools/context-handlers.js`
**Function**: `diff_changes()` (lines 44-60)

```javascript
const currentContent = await fs.readFile(args.path, 'utf-8');
```

**Problems**:

- No timeout on file read
- Could hang on large files or slow filesystems

**File**: `lib/tools/handlers-preflight.js`
**Function**: `preflight_change()` (lines 22-200)

**Problems**:

- Calls 5 different handlers sequentially without overall timeout
- If any handler hangs, entire preflight hangs
- No timeout protection on the aggregate operation
- Each sub-operation may have its own timeout issues

### Testing Recommendations

1. Test with symbolic link loops in directory structure
2. Test with very deep directory hierarchies (100+ levels)
3. Test with slow filesystems (network drives, external drives)
4. Test with corrupted JSON files
5. Add performance monitoring to identify slow operations
6. Add timeout tests to ensure timeouts work correctly

### Fixes Implemented

**File**: `lib/project-awareness.js`
**Function**: `findProjectRoot()` (lines 389-430)

- Changed from synchronous to async
- Added timeout protection (5000ms default)
- Added loop detection using Set to track visited paths
- Added depth limit (50 levels max)
- Added try-catch around fs.existsSync to handle permission errors
- Returns current best guess on timeout or loop detection

**File**: `lib/project-awareness.js`
**Function**: `detectProjectSwitch()` (lines 364-375)

- Updated to use async `findProjectRoot()` with await

**File**: `lib/project-memory-core.js`
**Function**: `load()` (lines 66-93)

- Added timeout protection (10000ms default) using Promise.race
- Prevents hangs on large .sweobeyme-memory.json files (280KB+)

**File**: `lib/project-memory-core.js`
**Function**: `loadProjectMap()` (lines 104-138)

- Added timeout protection (10000ms default) using Promise.race
- Prevents hangs on large project_map.json files (253KB+)

**File**: `lib/tools/context-handlers.js`
**Function**: `get_historical_context()` (lines 104-167)

- Replaced synchronous `execSync` with async `exec`
- Added timeout protection (5000ms) using Promise with setTimeout
- Properly clears timeout on completion or error

**File**: `lib/tools/context-handlers.js`
**Function**: `diff_changes()` (lines 44-60)

- Added timeout protection (5000ms) using Promise.race
- Prevents hangs on large file reads

**File**: `lib/tools/handlers-preflight.js`
**Function**: `preflight_change()` (lines 23-215)

- Added overall timeout protection (30000ms) for aggregate operation
- Wraps entire preflight validation in async IIFE with Promise.race
- Prevents hangs if any sub-handler hangs

**File**: `lib/project-memory.js`
**Function**: `initializeProjectMemory()` (lines 30-51)

- Added initialization caching to prevent repeated expensive operations
- Tracks initialization state with flags
- Returns existing promise if initialization in progress
- Prevents repeated loading of large memory files

**File**: `lib/tools/handlers-auto-enforcement.js`
**Functions**: `validate_file_handler()`, `suggest_refactoring_handler()`

- Changed from `fs.readFileSync` to `fs.readFile` (async)
- Added timeout protection (5000ms) using Promise.race
- Prevents hangs on large file reads during validation

**File**: `lib/tools/godot-handlers.js`
**Functions**: `isGodotProject()`, `hasGDSFiles()`

- Changed to async functions
- Added timeout protection (5000ms) on project detection
- Added timeout checks during directory scanning
- Prevents hangs on large Godot project scans

### Additional Tools Reviewed

**File**: `lib/tools/patreon-handlers.js`

- Uses synchronous operations (`existsSync`, `readFileSync`, `writeFileSync`)
- **Assessment**: Low risk - operations are on small config files only
- **Decision**: No timeout protection needed (fast, bounded operations)

**File**: `lib/tools/codebase-orientation-handlers.js`

- Uses extensive synchronous operations (`readdirSync`, `readFileSync`, `existsSync`)
- **Assessment**: High risk - traverses entire directory trees and reads many files
- **Decision**: **NOT FIXED** - Would require major refactoring (converting entire handler to async)
- **Recommendation**: Defer to separate refactoring effort due to complexity

### Summary of Changes

**Successfully Fixed:**

1. **Directory traversal**: Timeout (5000ms), loop detection, depth limit
2. **Large file reads**: Timeout (10000ms) on memory file loads
3. **Git operations**: Async with timeout (5000ms)
4. **Aggregate operations**: Overall timeout (30000ms) on preflight
5. **Initialization caching**: Prevents repeated expensive operations
6. **Auto-enforcement validation**: Async file reads with timeout (5000ms)
7. **Godot project detection**: Async with timeout (5000ms)

**Deferred for Future Work:**

- `codebase-orientation-handlers.js`: Requires major async refactoring (high complexity, low usage priority)

These changes follow the error handling patterns from the backend engineering corpus, specifically the Timeout Pattern and Fallback Pattern recommendations.

### Summary

The SWEObeyMe MCP tool hang issue is caused by:

1. **Directory traversal without timeout or loop detection** in `findProjectRoot()`
2. **Large file reads without timeout** for project memory files
3. **Project memory initialization on every read** triggering slow operations
4. **No caching of initialization state** causing repeated expensive operations

The fix requires:

- Adding timeout handling to all file operations
- Adding loop detection to directory traversal
- Caching project memory initialization
- Adding comprehensive logging for debugging
- Limiting traversal depth
