# Codebase Orientation Refactor Design Document

## Overview

Refactor `lib/tools/codebase-orientation-handlers.js` to convert synchronous file system operations to async with timeout protection, following the pattern established in v4.2.2 for other tools.

## Current State Analysis

### File: `lib/tools/codebase-orientation-handlers.js`

- **Lines**: 491/500 (near limit)
- **Issue**: Uses synchronous fs operations that can block event loop
- **Synchronous operations**:
  - `fs.readdirSync` (line 31, 100, 154, 227, 268)
  - `fs.existsSync` (lines 35, 53, 60, 64, 75, 82, 86, 115)
  - `fs.readFileSync` (lines 166, 203, 236)

### Problems

1. **Event loop blocking** - Synchronous operations can hang on large directories
2. **No timeout protection** - No guard against indefinite hangs
3. **Mixed sync/async** - Some handlers are async, helpers are sync
4. **Line count pressure** - 491 lines close to 500 limit

## Refactor Goals

### Primary Goals

1. Convert all fs operations to async (fs/promises)
2. Add timeout protection using Promise.race pattern
3. Maintain backward compatibility with existing MCP tool interface
4. Improve error handling with proper try/catch

### Secondary Goals

1. Reduce file size by extracting helper functions
2. Add comprehensive logging for debugging
3. Improve code organization and separation of concerns

## Design Decisions

### 1. Async Conversion Strategy

- Replace `fs.readdirSync` → `await fs.readdir`
- Replace `fs.existsSync` → `await fs.access` (or keep for existence checks)
- Replace `fs.readFileSync` → `await fs.readFile`
- Add timeout wrapper: `withTimeout(fn, timeoutMs)`

### 2. Timeout Durations

- Directory reads: 5000ms (5 seconds)
- File reads: 10000ms (10 seconds)
- Aggregate operations: 30000ms (30 seconds)
- Existence checks: 1000ms (1 second)

### 3. File Structure

Keep single file but extract helper functions to reduce complexity:

- `withTimeout()` - Timeout wrapper utility
- `detectProjectType()` - Convert to async
- `identifyEntryPoints()` - Convert to async
- `inferModuleStructure()` - Convert to async
- Handlers remain async as they already are

### 4. Separation of Concerns

- File system operations → isolated in helper functions
- Business logic → in handlers
- Error handling → centralized in withTimeout wrapper

## Async Boundary Mapping

### Current Sync Functions (to be converted)

```
detectProjectType(rootPath) → async detectProjectType(rootPath, timeout = 5000)
identifyEntryPoints(rootPath, projectType) → async identifyEntryPoints(rootPath, projectType, timeout = 5000)
inferModuleStructure(rootPath) → async inferModuleStructure(rootPath, timeout = 5000)
```

### Current Async Functions (remain async)

```
codebase_orientation_handler(args) - already async
dependency_analysis_handler(args) - already async
entry_point_mapper_handler(args) - already async
codebase_explore_handler(args) - already async
```

### Call Chain

```
Handler → Helper Functions (sync) → File Operations (sync)
              ↓
Handler → Helper Functions (async) → File Operations (async with timeout)
```

## New Invariants

### 1. Timeout Invariant

**Invariant**: All file system operations complete within timeout or throw timeout error

```javascript
// Property: For any fs operation op with timeout T:
// - op completes in < T ms, OR
// - op throws TimeoutError
```

### 2. Async Boundary Invariant

**Invariant**: No synchronous file operations in public API

```javascript
// Property: All exported functions are async
// - All fs operations use fs/promises
// - No fs.readFileSync, readdirSync, etc.
```

### 3. Error Handling Invariant

**Invariant**: All errors are caught and returned in consistent format

```javascript
// Property: For any error e:
// - Handler returns { success: false, error: e.message }
// - No uncaught rejections
```

### 4. Resource Cleanup Invariant

**Invariant**: No file handles left open

```javascript
// Property: All file operations close handles
// - fs.readFile auto-closes
// - fs.readdir auto-closes
```

## Property-Based Tests

### Test 1: Timeout Enforcement

```javascript
// Property: detectProjectType completes within timeout or throws
await propertyTest(async () => {
  const result = await detectProjectType(rootPath, 100); // 100ms timeout
  // Either succeeds (fast) or throws timeout
  assert(result.success === true || result.error.includes('timeout'));
});
```

### Test 2: Async Non-Blocking

```javascript
// Property: Multiple calls don't block event loop
await propertyTest(async () => {
  const start = Date.now();
  await Promise.all([detectProjectType(rootPath), identifyEntryPoints(rootPath, ['javascript'])]);
  const duration = Date.now() - start;
  assert(duration < 20000); // Should be parallel, not sequential
});
```

### Test 3: Idempotence

```javascript
// Property: Multiple calls with same input produce same output
await propertyTest(async () => {
  const result1 = await detectProjectType(rootPath);
  const result2 = await detectProjectType(rootPath);
  assert(JSON.stringify(result1) === JSON.stringify(result2));
});
```

### Test 4: Error Recovery

```javascript
// Property: Errors don't corrupt state
await propertyTest(async () => {
  await detectProjectType('/nonexistent/path');
  const result = await detectProjectType(rootPath);
  assert(result.success === true); // Should recover
});
```

## Fuzzer Cases

### Fuzzer 1: Timeout Stress

```javascript
// Test: Vary timeouts from 1ms to 10000ms
// Expected: Fast timeouts fail gracefully, slow timeouts succeed
for (const timeout of [1, 10, 100, 1000, 5000, 10000]) {
  await fuzz(detectProjectType, { timeout });
}
```

### Fuzzer 2: Deep Directory Traversal

```javascript
// Test: Create deeply nested directories (100+ levels)
// Expected: Timeout prevents infinite recursion
await fuzz(createDeepDirectory, { depth: 100 });
await detectProjectType(deepPath);
```

### Fuzzer 3: Large Directory

```javascript
// Test: Directory with 10,000 files
// Expected: Timeout prevents hanging
await fuzz(createLargeDirectory, { count: 10000 });
await detectProjectType(largePath);
```

### Fuzzer 4: Permission Denied

```javascript
// Test: Directory with no read permissions
// Expected: Error caught and returned gracefully
await fuzz(setNoReadPermissions, path);
await detectProjectType(path);
```

### Fuzzer 5: Concurrent Access

```javascript
// Test: 100 concurrent calls to same directory
// Expected: No race conditions, all complete or timeout
await Promise.all(
  Array(100)
    .fill()
    .map(() => detectProjectType(rootPath))
);
```

## Rollback Plan

### Pre-Refactor Backup

1. Create git branch: `refactor/codebase-orientation-async`
2. Create file backup: `lib/tools/codebase-orientation-handlers.js.backup`
3. Commit current state: `git commit -m "Pre-refactor backup"`

### Rollback Triggers

1. **Test failures**: Any test fails after refactor
2. **Timeout issues**: Timeout values too aggressive
3. **Performance regression**: Operations slower than sync version
4. **Integration failures**: MCP tools don't work correctly

### Rollback Procedure

```bash
# Option 1: Git rollback
git checkout main
git branch -D refactor/codebase-orientation-async

# Option 2: File restore
cp lib/tools/codebase-orientation-handlers.js.backup lib/tools/codebase-orientation-handlers.js
```

### Rollback Verification

1. Run existing test suite: `npm test`
2. Run MCP server: verify tools work
3. Check line count: ensure no increase

## Implementation Steps

### Phase 1: Preparation

1. Create branch `refactor/codebase-orientation-async`
2. Create backup file
3. Write property-based tests (before refactor)
4. Write fuzzer cases (before refactor)

### Phase 2: Core Refactor

1. Add `withTimeout` utility function
2. Convert `detectProjectType` to async
3. Convert `identifyEntryPoints` to async
4. Convert `inferModuleStructure` to async
5. Update handlers to use async helpers

### Phase 3: Testing

1. Run property-based tests
2. Run fuzzer cases
3. Run existing test suite
4. Manual MCP tool testing

### Phase 4: Optimization

1. Tune timeout values based on results
2. Add logging if needed
3. Check line count (target < 500)
4. Extract functions if over limit

### Phase 5: Integration

1. Update changelog
2. Commit changes
3. Create PR to main
4. Merge after approval

## Success Criteria

1. ✅ All synchronous fs operations converted to async
2. ✅ All operations have timeout protection
3. ✅ All tests pass (property-based, fuzzer, existing)
4. ✅ File size under 500 lines
5. ✅ No performance regression
6. ✅ MCP tools work correctly
7. ✅ Error handling consistent
8. ✅ Backward compatible

## Risks and Mitigations

### Risk 1: Timeout Too Aggressive

- **Mitigation**: Start with generous timeouts (5000-10000ms), tune based on testing
- **Fallback**: Increase timeouts if tests fail

### Risk 2: Performance Regression

- **Mitigation**: Benchmark sync vs async before/after
- **Fallback**: Keep sync path for critical operations if needed

### Risk 3: Breaking MCP Interface

- **Mitigation**: Keep handler signatures unchanged
- **Fallback**: Revert to sync version if tools break

### Risk 4: File Size Increase

- **Mitigation**: Extract helper functions to separate file if needed
- **Fallback**: Split into multiple files if > 500 lines

## Timeline Estimate

- Phase 1 (Preparation): 30 minutes
- Phase 2 (Core Refactor): 1 hour
- Phase 3 (Testing): 1 hour
- Phase 4 (Optimization): 30 minutes
- Phase 5 (Integration): 30 minutes

**Total**: ~3.5 hours

## References

- v4.2.2 timeout pattern in `lib/project-awareness.js`
- v4.2.2 timeout pattern in `lib/project-memory-core.js`
- Property-based testing in `tests/property-based-timeout-tests.js`
- Fuzzer infrastructure in `tests/fuzzer-*.js`
