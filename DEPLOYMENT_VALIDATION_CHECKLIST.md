# SWEObeyMe Deployment Validation Checklist

**Absolute Certainty Checklist for Cross-Platform MCP Server Deployment**

Use this checklist before every release to ensure SWEObeyMe works flawlessly for every user on Windsurf, Cursor, VS Code, and LM Studio.

---

## Pre-Release Validation

### 1. Code Quality ✅

- [ ] All files compile without errors
- [ ] No TypeScript/JavaScript linting errors
- [ ] No console.log or debugger statements in production code
- [ ] All forbidden patterns removed (TODO, FIXME, etc.)
- [ ] Line count limits enforced (max 700 lines per file)
- [ ] Bracket validation passes

### 2. Build Process ✅

- [ ] `npm run build` succeeds
- [ ] `dist/extension.js` exists (VS Code extension)
- [ ] `dist/mcp/server.js` exists (MCP server)
- [ ] Bundle sizes are reasonable (< 2mb for MCP server)
- [ ] Build completes in < 60 seconds
- [ ] No build warnings

### 3. Dependencies ✅

- [ ] `npm install` succeeds without errors
- [ ] All dependencies are up to date
- [ ] No security vulnerabilities in dependencies
- [ ] Node.js version requirement specified (v18+)
- [ ] Python requirement documented (3.10+ optional)

---

## Platform-Specific Validation

### Windsurf ✅

- [ ] `mcp-configs/windsurf-mcp.json` exists
- [ ] Config format matches Windsurf requirements
- [ ] Command is "node"
- [ ] Args include server path
- [ ] Env object present (can be empty)
- [ ] Config is valid JSON
- [ ] Installation guide includes Windsurf steps
- [ ] Path placeholders documented

### Cursor ✅

- [ ] `mcp-configs/cursor-mcp.json` exists
- [ ] Config format matches Cursor requirements
- [ ] Command is "node"
- [ ] Args include server path
- [ ] Env object present (can be empty)
- [ ] Config is valid JSON
- [ ] Installation guide includes Cursor steps
- [ ] Global and project-specific configs documented

### VS Code ✅

- [ ] `package.json` has `contributes.mcpServers`
- [ ] MCP server registered with correct ID
- [ ] Command is "node"
- [ ] Args include server path
- [ ] Extension metadata complete
- [ ] VS Code version requirement specified
- [ ] Marketplace listing ready
- [ ] Extension icon present

### LM Studio ✅

- [ ] `mcp-configs/lmstudio-mcp.json` exists
- [ ] Config format matches Cursor notation (LM Studio follows Cursor)
- [ ] Command is "node"
- [ ] Args include server path
- [ ] Env object present (can be empty)
- [ ] Config is valid JSON
- [ ] Installation guide includes LM Studio steps
- [ ] Version requirement documented (0.3.17+)

---

## MCP Server Validation

### Server Startup ✅

- [ ] Server starts without errors
- [ ] Server logs "connected and ready" message
- [ ] Server responds to MCP protocol handshake
- [ ] Server advertises correct tools
- [ ] Server handles stdio transport correctly
- [ ] Server doesn't crash on startup
- [ ] Server handles graceful shutdown

### Tool Registration ✅

- [ ] All 95+ tools are registered
- [ ] Tool names are unique
- [ ] Tool descriptions are clear
- [ ] Tool input schemas are valid
- [ ] Tool handlers exist for all tools
- [ ] Tool priority values are set correctly
- [ ] No duplicate tool definitions

### Tool Functionality ✅

- [ ] Read file tools work
- [ ] Write file tools work
- [ ] File operations respect surgical rules
- [ ] Bracket validation works
- [ ] Multi-agent orchestration tools work
- [ ] Spec-driven development tools work
- [ ] Autonomous execution tools work
- [ ] Governance tools work

---

## Integration Tests

### Cross-Platform Integration Test ✅

- [ ] `node tests/cross-platform-integration-test.js` passes
- [ ] Build artifacts test passes
- [ ] Config files test passes
- [ ] MCP server startup test passes
- [ ] Windsurf config test passes
- [ ] Cursor config test passes
- [ ] VS Code config test passes
- [ ] LM Studio config test passes

### Additional Tests ✅

- [ ] `npm run test:tools` passes
- [ ] `npm run test:server` passes
- [ ] `npm run test:mcp` passes
- [ ] `npm run test:config` passes
- [ ] All test suites pass

### Comprehensive Test Suite ✅

- [ ] `npm run test:comprehensive` passes
- [ ] `npm run test:cross-platform` passes
- [ ] `npm run test:schema-validation` passes
- [ ] `npm run test:concurrency` passes
- [ ] `npm run test:file-safety` passes
- [ ] `npm run test:manifest` passes
- [ ] `npm run test:packaging` passes
- [ ] `npm run test:spec-drift` passes
- [ ] `npm run test:multi-agent` passes
- [ ] `npm run test:ui-ide` passes
- [ ] `npm run test:ux-safety` passes
- [ ] `npm run test:chaos` passes
- [ ] `npm run test:user-from-hell` passes

### Backend/MCP Tests ✅

- [ ] Schema validation tests pass (invalid params, missing params, extra params, wrong types, null vs undefined, large payloads, circular JSON)
- [ ] Concurrency tests pass (20 parallel tool calls, 50 parallel agent logs, 100 parallel spec checks, no race conditions, no deadlocks, no partial writes)
- [ ] File system safety tests pass (locked files, read-only files, missing directories, corrupted JSON, permission errors, path traversal)

### UI/IDE Integration Tests ✅

- [ ] Tool palette rendering test passes
- [ ] Tool parameter schemas test passes
- [ ] No hidden/internal fields test passes
- [ ] Large objects handling test passes
- [ ] Long-session stability test passes (2-6 hours simulated)
- [ ] 500+ tool calls test passes
- [ ] 100+ file edits test passes
- [ ] No memory leaks test passes
- [ ] No UI freezes test passes
- [ ] No tool palette desync test passes
- [ ] Error bubble display test passes
- [ ] Errors don't crash extension test passes
- [ ] Errors don't break MCP connection test passes
- [ ] Errors don't produce empty tool lists test passes

### Multi-Agent Orchestration Tests ✅

- [ ] Two agents editing same file test passes
- [ ] Two agents editing same function test passes
- [ ] Two agents editing same import test passes
- [ ] Agent vs auto-enforcement test passes
- [ ] Agent vs audit test passes
- [ ] Agent crash recovery test passes
- [ ] Agent timeout handling test passes
- [ ] Agent infinite loop detection test passes
- [ ] Agent deadlock detection test passes
- [ ] Agent memory spike detection test passes
- [ ] Agent log overflow detection test passes
- [ ] Auto-restart test passes
- [ ] Auto-rollback test passes
- [ ] Auto-cleanup test passes
- [ ] Auto-reassign test passes

### User-Experience Tests ✅

- [ ] No jargon in output test passes
- [ ] No partial implementations test passes
- [ ] No TODOs in code test passes
- [ ] No "in real implementation" excuses test passes
- [ ] No broken code test passes
- [ ] No missing imports test passes
- [ ] No unsafe operations test passes
- [ ] 3AM Autopilot task plan test passes
- [ ] 3AM Autopilot execution test passes
- [ ] 3AM Autopilot no questions test passes
- [ ] 3AM Autopilot no drift test passes
- [ ] 3AM Autopilot no abandonment test passes
- [ ] 3AM Autopilot no half-done test passes
- [ ] OOM simulation test passes
- [ ] Infinite recursion prevention test passes
- [ ] Giant file load test passes
- [ ] Large diff handling test passes
- [ ] Corrupted project handling test passes
- [ ] Missing dependencies handling test passes

### Chaos Engineering Tests ✅

- [ ] Random tool failures test passes
- [ ] Random network drops test passes
- [ ] Random partial responses test passes
- [ ] Random corrupted messages test passes
- [ ] Random agent crashes test passes
- [ ] Random spec divergence test passes
- [ ] No corruption test passes
- [ ] No lost tasks test passes
- [ ] No lost agents test passes
- [ ] No lost specs test passes
- [ ] No lost memory test passes
- [ ] No lost context test passes
- [ ] No silent failures test passes

### Simulated User From Hell Test ✅

- [ ] Garbage input handling test passes
- [ ] Half-sentences handling test passes
- [ ] Contradictory instructions handling test passes
- [ ] Long rambles handling test passes
- [ ] Out of order instructions handling test passes
- [ ] Input while agents run test passes
- [ ] Input while specs update test passes
- [ ] Input while refactors happen test passes
- [ ] System never breaks test passes
- [ ] System never corrupts test passes
- [ ] System never drifts test passes
- [ ] System never loses context test passes
- [ ] System never produces unsafe code test passes
- [ ] System never crashes test passes
- [ ] System never freezes test passes
- [ ] System never asks for clarification test passes

---

### Windsurf Runtime Behavior Test ✅

- [ ] `npm run test:windsurf` passes
- [ ] Path normalization test passes
- [ ] Executable resolution test passes
- [ ] Environment variable interpolation test passes
- [ ] Working directory correctness test passes
- [ ] Spawn timing test passes (< 10s)
- [ ] Handshake timing test passes
- [ ] Tool schema validation test passes
- [ ] Tool list hydration test passes (31+ tools)
- [ ] Extension activation order test passes
- [ ] Slow startup test passes
- [ ] Delayed stdout test passes
- [ ] Partial handshake test passes
- [ ] Malformed handshake test passes
- [ ] Missing tool list test passes
- [ ] Oversized tool list test passes
- [ ] Empty tool list test passes
- [ ] Duplicate tool names test passes (0 duplicates)
- [ ] Invalid JSON first packet test passes
- [ ] Chunked JSON test passes
- [ ] Partial JSON test passes
- [ ] Delayed JSON test passes
- [ ] Interleaved logs + JSON test passes
- [ ] Stdout noise tolerance test passes
- [ ] Stderr noise tolerance test passes
- [ ] Mixed encoding test passes
- [ ] BOM-prefixed output test passes
- [ ] Tools appear after handshake test passes
- [ ] Tools refresh on reconnect test passes
- [ ] Tools refresh on file change test passes
- [ ] Tools refresh on extension reload test passes
- [ ] Tools refresh on model swap test passes
- [ ] Model swap mid-session test passes
- [ ] Extension reload test passes
- [ ] Tool list refresh test passes
- [ ] Tool schema change test passes
- [ ] Tool removal test passes
- [ ] Tool renaming test passes
- [ ] Tool parameter mismatch test passes
- [ ] 4-hour session simulation test passes
- [ ] 8-hour session simulation test passes
- [ ] 500+ tool calls test passes
- [ ] 100+ file edits test passes
- [ ] 50+ agent spawns test passes
- [ ] 20+ spec updates test passes
- [ ] 10+ reconnections test passes
- [ ] Memory leak over time test passes
- [ ] Stale tool list test passes
- [ ] Stale agent states test passes
- [ ] Stale MCP connections test passes
- [ ] Thrown errors test passes
- [ ] Rejected promises test passes
- [ ] Invalid tool output test passes
- [ ] Oversized tool output test passes
- [ ] Missing fields test passes
- [ ] Null fields test passes
- [ ] Undefined fields test passes
- [ ] Circular JSON test passes
- [ ] Error - Windsurf stays alive test passes
- [ ] Error - extension stays alive test passes
- [ ] Error - MCP server stays alive test passes
- [ ] Error - tool palette stays alive test passes
- [ ] Error - no crash extension test passes
- [ ] Error - no crash server test passes
- [ ] Locked files test passes
- [ ] Missing files test passes
- [ ] Corrupted files test passes
- [ ] Read-only files test passes
- [ ] Race conditions test passes
- [ ] Partial writes test passes
- [ ] Path traversal test passes
- [ ] Your agents + Windsurf agents test passes
- [ ] File edits from both sides test passes
- [ ] Agent race conditions test passes
- [ ] Agent conflict detection test passes
- [ ] Agent conflict resolution test passes
- [ ] Claude→Kimi swap test passes
- [ ] Kimi→Claude swap test passes
- [ ] Claude→GPT swap test passes
- [ ] GPT→Claude swap test passes
- [ ] Model crash test passes
- [ ] Model timeout test passes
- [ ] Cold reload test passes
- [ ] Warm reload test passes
- [ ] Partial reload test passes
- [ ] Corrupted reload test passes
- [ ] Reload during agent run test passes
- [ ] Reload during spec update test passes
- [ ] Windsurf Polygraph - spawn test passes
- [ ] Windsurf Polygraph - load extension test passes
- [ ] Windsurf Polygraph - start MCP server test passes
- [ ] Windsurf Polygraph - run every tool test passes
- [ ] Windsurf Polygraph - run chaos events test passes
- [ ] Windsurf Polygraph - run reconnections test passes
- [ ] Windsurf Polygraph - run model swaps test passes
- [ ] Windsurf Polygraph - run file edits test passes
- [ ] Windsurf Polygraph - run conflicts test passes
- [ ] Windsurf Polygraph - run recovery test passes
- [ ] Windsurf Polygraph - 10/10 steps pass

---

## Documentation Validation

### Installation Guide ✅

- [ ] `INSTALLATION.md` exists
- [ ] Prerequisites documented clearly
- [ ] Windsurf installation steps complete
- [ ] Cursor installation steps complete
- [ ] VS Code installation steps complete
- [ ] LM Studio installation steps complete
- [ ] Troubleshooting section present
- [ ] Verification steps documented
- [ ] Update instructions included
- [ ] Uninstallation instructions included

### README.md ✅

- [ ] Overview section clear
- [ ] Features documented
- [ ] Installation link present
- [ ] Quick start guide present
- [ ] Configuration examples present
- [ ] Troubleshooting section present
- [ ] License information present
- [ ] Contact information present

### Platform-Specific Docs ✅

- [ ] Windsurf-specific notes documented
- [ ] Cursor-specific notes documented
- [ ] VS Code-specific notes documented
- [ ] LM Studio-specific notes documented

---

## Package.json Validation

### Metadata ✅

- [ ] Name is correct
- [ ] Version is incremented
- [ ] Description is accurate
- [ ] Publisher is correct
- [ ] Repository URL is correct
- [ ] License is specified

### Dependencies ✅

- [ ] MCP SDK version is correct
- [ ] All dependencies are necessary
- [ ] No unused dependencies
- [ ] Dependency versions are compatible
- [ ] Dev dependencies are appropriate

### Scripts ✅

- [ ] Build script works
- [ ] Test script works
- [ ] Package script works
- [ ] Publish script works
- [ ] Compile script works

### Configuration ✅

- [ ] VS Code engine version specified
- [ ] Categories are appropriate
- [ ] Keywords include "mcp", "ai"
- [ ] Activation events are correct
- [ ] Commands are defined
- [ ] Configuration schema is valid
- [ ] MCP servers are registered

---

## File Structure Validation

### Required Files ✅

- [ ] `package.json` exists
- [ ] `index.js` exists
- [ ] `extension.js` exists
- [ ] `lib/` directory exists
- [ ] `dist/` directory created after build
- [ ] `mcp-configs/` directory exists
- [ ] `INSTALLATION.md` exists
- [ ] `README.md` exists
- [ ] `LICENSE` exists

### Build Artifacts ✅

- [ ] `dist/extension.js` exists after build
- [ ] `dist/mcp/server.js` exists after build
- [ ] `dist/lib/` copied after build
- [ ] `dist/mcp/package.json` copied after build
- [ ] No missing files in dist/

---

## Platform-Specific Testing

### Windsurf Testing ✅

- [ ] Tested on latest Windsurf version
- [ ] Config file loads correctly
- [ ] Server starts in Windsurf
- [ ] Tools appear in Windsurf
- [ ] Tool execution works in Windsurf
- [ ] No console errors in Windsurf
- [ ] Dashboard displays correctly

### Cursor Testing ✅

- [ ] Tested on latest Cursor version
- [ ] Config file loads correctly
- [ ] Server starts in Cursor
- [ ] Tools appear in Cursor
- [ ] Tool execution works in Cursor
- [ ] No console errors in Cursor
- [ ] Agent mode works with MCP tools

### VS Code Testing ✅

- [ ] Tested on latest VS Code version
- [ ] Extension installs correctly
- [ ] Extension activates correctly
- [ ] MCP server starts automatically
- [ ] Tools appear in tool palette
- [ ] Tool execution works in VS Code
- [ ] Settings panel works
- [ ] Commands work correctly

### LM Studio Testing ✅

- [ ] Tested on latest LM Studio version (0.3.17+)
- [ ] Config file loads correctly
- [ ] Server starts in LM Studio
- [ ] Tools appear in LM Studio
- [ ] Tool execution works in LM Studio
- [ ] No console errors in LM Studio

---

## Error Handling Validation

### Graceful Degradation ✅

- [ ] Server handles missing config files
- [ ] Server handles invalid config files
- [ ] Server handles missing dependencies
- [ ] Server handles network errors
- [ ] Server handles tool execution errors
- [ ] Server provides clear error messages

### User Feedback ✅

- [ ] Error messages are actionable
- [ ] Error messages include next steps
- [ ] Error messages are user-friendly
- [ ] Error logs are comprehensive
- [ ] Success messages are clear

---

## Security Validation

### Code Security ✅

- [ ] No hardcoded secrets
- [ ] No eval() or dangerous functions
- [ ] Input validation on all user inputs
- [ ] Output sanitization
- [ ] Path traversal prevention
- [ ] Command injection prevention

### Configuration Security ✅

- [ ] No sensitive data in configs
- [ ] Environment variables documented
- [ ] Permission controls work
- [ ] Admin controls documented

---

## Performance Validation

### Startup Time ✅

- [ ] Server starts in < 5 seconds
- [ ] Extension activates in < 3 seconds
- [ ] Tool registration completes quickly
- [ ] No blocking operations on startup

### Runtime Performance ✅

- [ ] Tool execution is responsive
- [ ] No memory leaks
- [ ] CPU usage is reasonable
- [ ] File operations are efficient
- [ ] Large file handling works

---

## Release Preparation

### Version Bump ✅

- [ ] Version number incremented in package.json
- [ ] Changelog updated
- [ ] Release notes written
- [ ] Breaking changes documented

### Package Creation ✅

- [ ] `npm run package` succeeds
- [ ] VSIX file created
- [ ] Package size is reasonable
- [ ] Package contains all files

### Git Preparation ✅

- [ ] All changes committed
- [ ] Git tag created
- [ ] Branch is clean
- [ ] No uncommitted changes

---

## Post-Release Validation

### Marketplace ✅

- [ ] Extension published to VS Code Marketplace
- [ ] Extension appears in search
- [ ] Extension downloads successfully
- [ ] Extension installs successfully

### User Testing ✅

- [ ] Fresh install tested on clean machine
- [ ] Upgrade tested from previous version
- [ ] Installation guide followed successfully
- [ ] No user-reported errors
- [ ] Documentation is accurate

---

## Final Sign-Off

**Release Manager:** **********\_\_**********

**Date:** **********\_\_**********

**Version:** **********\_\_**********

**All Checks Passed:** ☐ YES ☐ NO

**Notes:** **********\_\_**********

---

**Approved for Release:** ☐ YES ☐ NO

**Approval Signature:** **********\_\_**********

---

## Quick Validation Command

Run this single command to validate everything before release:

```bash
npm run test:comprehensive && npm run compile
```

Or run the full pre-package validation:

```bash
npm run prepackage
```

This runs:

1. Cross-Platform Integration Test
2. Backend MCP Schema Validation Test
3. Backend MCP Concurrency Test
4. Backend MCP File System Safety Test
5. Extension Manifest Validation Test
6. Marketplace Packaging Test
7. Spec Drift Simulation Test
8. Multi-Agent Orchestration Test
9. UI/IDE Integration Test
10. User-Experience Safety Test
11. Chaos Engineering Test
12. Simulated User From Hell Test

If this command passes with exit code 0, you're ready to release with absolute certainty.
