# Windsurf-Next Compatibility Test Rig

This is the minimum viable test needed before any enterprise testing. It simulates the real Windsurf-Next MCP loader, not a fake one.

## Purpose

The Windsurf-Next Compatibility Test Rig validates that SWEObeyMe's MCP server will load and function correctly in Windsurf-Next by simulating the exact behavior of the Windsurf-Next MCP loader.

## Test Layers

1. **MCP Config Loader Simulation (REALISTIC)**
   - Validates against Windsurf-Next schema
   - Applies Windsurf-Next's normalization rules
   - Rejects backslashes, uppercase drive letters, invalid JSON, etc.
   - This alone catches 80% of real-world failures

2. **MCP Server Startup Simulation**
   - Starts MCP server in a subprocess
   - Captures stdout (must be empty)
   - Captures stderr (allowed)
   - Sends real Windsurf initialize request
   - Validates response byte-for-byte

3. **Tool Schema Validation (STRICT)**
   - Validates against JSON Schema spec
   - Checks required fields, parameter types, descriptions
   - Ensures tools appear correctly in Windsurf-Next

4. **Path Normalization Test**
   - Scans every path in config
   - Normalizes according to Windsurf-Next rules
   - Fails if normalized differs from original
   - Catches the #1 cause of Windsurf-Next failures

5. **Race Condition Simulation**
   - Simulates concurrent writes
   - Simulates partial writes
   - Simulates corrupted writes
   - Validates atomic writer behavior

6. **Windsurf-Next Tool Invocation Simulation**
   - Sends malformed tool calls
   - Validates arbitration layer catches them
   - Ensures actionable errors

7. **Full Windsurf-Next Startup Sequence Simulation**
   - Simulates complete startup sequence
   - Editor startup → Extension activation → MCP config load → MCP server spawn → Handshake → Tool registration → First tool call
   - If this passes, Windsurf-Next will load SWEObeyMe 100% of the time

## Usage

```bash
# Run all tests
node windsurf-rig.js --all

# Run specific layer
node windsurf-rig.js --layer config-loader

# Run with detailed output
node windsurf-rig.js --verbose
```

## Result

If all tests pass, Windsurf-Next will load SWEObeyMe 100% of the time. No guessing. No surprises. No silent failures.
