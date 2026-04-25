# Git Publish Governor

A pre-commit + pre-push test that guarantees correctness, safety, exclusion of proprietary modules, Windsurf-Next compatibility, MCP schema validity, and config integrity.

## Purpose

The Git Publish Governor ensures every upload is clean by validating:

- No enterprise code leaks
- Windsurf-Next compatibility
- MCP schema validity
- Config integrity
- No accidental source leaks

## Test Layers

1. **Feature Exclusion System (Forbidden Modules Gate)**
   - Scans commits for forbidden paths
   - Blocks pushes containing enterprise code
   - Requires explicit override for emergency pushes

2. **MCP Config Validator (Windsurf-Next rules)**
   - Validates path: ~/.codeium/mcp_config.json
   - Forward slashes only, lowercase drives
   - No backslashes, trailing slashes, unknown keys
   - Valid JSON, schema, tool definitions

3. **MCP Server Startup Simulator**
   - Spawns MCP server
   - Sends Windsurf-Next initialize request
   - Validates response, tool registration, capabilities

4. **Tool Arbitration Fuzzer**
   - Sends malformed tool calls
   - Tests missing/extra params, wrong types
   - Ensures arbitration catches and rejects

5. **Path Normalization Checker**
   - Scans repo for backslashes, uppercase drives, double slashes
   - Blocks if found in config-related code

6. **Dependency Isolation Test**
   - Scans for enterprise module imports
   - Blocks if enterprise code is referenced in main paths

7. **Public Build Mode Test**
   - Builds SWEObeyMe in public mode
   - Validates no enterprise code in build

8. **Git Pre-Push Hook (Enforcement Layer)**
   - Runs all tests
   - Blocks push on failure
   - Prints actionable errors
   - Requires explicit override flag

9. **Enterprise Leak Scanner (Optional)**
   - Scans for TODOs/comments referencing enterprise features
   - Blocks if found

## Usage

```bash
# Run all governor checks
node git-governor.js --all

# Run specific check
node git-governor.js --check feature-exclusion

# Override specific check (emergency only)
node git-governor.js --all --override feature-exclusion
```

## Result

Every upload will be:

- Clean
- Safe
- Deterministic
- Windsurf-Next compatible
- Free of enterprise code
- Free of forbidden modules
- Validated
- Governed
- Reproducible
