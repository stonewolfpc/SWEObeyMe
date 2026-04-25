# SWEObeyMe Extension Audit Report

**Audit Date**: 2026-04-07
**Audited Against**: Windsurf MCP Documentation, MCP Specification, VS Code Extension API
**Focus**: MCP servers, Windsurf-Next integration, configuration, installation, UI

---

## CRITICAL ISSUES

### 1. MCP Config Path Mismatch (SEVERITY: CRITICAL)

**Location**: `extension.js` lines 179-181 vs 490-491

**Issue**:

- **activate()** uses: `%LOCALAPPDATA%\Windsurf\mcp.json` (Windows-specific)
- **deactivate()** uses: `~/.codeium/windsurf-next/mcp_config.json` (Unix-style)
- **Windsurf Documentation** states: `~/.codeium/mcp_config.json` is the correct path

**Impact**:

- The activate and deactivate functions use different paths, causing cleanup to fail
- Neither path matches the documented Windsurf config location
- This will cause the extension to write to the wrong file on install and fail to clean up on uninstall
- Users will need to manually clean up MCP config

**Evidence from Documentation**:

```markdown
## mcp_config.json

The `~/.codeium/mcp_config.json` file is a JSON file that contains a list of servers that Cascade can connect to.
```

Source: `ide_mcp_corpus/windsurf/mcp_config.md` line 20

**Recommendation**:

```javascript
// Use the correct Windsurf MCP config path
const configDir = path.join(os.homedir(), '.codeium');
const mcpConfigPath = path.join(configDir, 'mcp_config.json');
```

---

### 2. Missing Environment Variable Interpolation (SEVERITY: HIGH)

**Location**: `extension.js` lines 232-241

**Issue**:

- The extension writes hardcoded absolute paths to mcp_config.json
- Windsurf documentation shows support for `${env:VAR}` interpolation in config fields
- This causes cross-platform compatibility issues

**Impact**:

- Hardcoded Windows paths won't work on Linux/Mac
- Users on different platforms will have broken configurations
- Makes distribution unreliable

**Evidence from Documentation**:

````markdown
### Config Interpolation

The `~/.codeium/mcp_config.json` file handles interpolation of
environment variables in these fields: `command`, `args`, `env`, `serverUrl`, `url`, and
`headers`.

Here's an example configuration, which uses an `AUTH_TOKEN` environment variable
in `headers`.

```json
{
  "mcpServers": {
    "remote-http-mcp": {
      "serverUrl": "<your-server-url>/mcp",
      "headers": {
        "API_KEY": "Bearer ${env:AUTH_TOKEN}"
      }
    }
  }
}
```
````

````
Source: `ide_mcp_corpus/windsurf/mcp_remote_http.md` lines 22-38

**Recommendation**:
Use environment variable interpolation for paths:
```javascript
config.mcpServers['swe-obey-me'] = {
  command: 'node',
  args: ['--no-warnings', '${env:SWEOBEYME_INDEX_PATH}'],
  env: {
    NODE_ENV: 'production',
    SWEOBEYME_BACKUP_DIR: '${env:SWEOBEYME_BACKUP_DIR}',
    SWEOBEYME_DEBUG: '0',
  },
  disabled: false,
};
````

---

### 3. Incomplete Path Normalization (SEVERITY: MEDIUM)

**Location**: `extension.js` line 229

**Issue**:

- Only the index path is normalized to forward slashes
- The backup directory path is not normalized
- Config paths should be consistently normalized

**Impact**:

- Inconsistent path formatting in config file
- Could cause issues on Windows where backslashes are common
- Makes config harder to read and debug

**Recommendation**:

```javascript
const normalizedIndexPath = indexPath.replace(/\\/g, '/');
const normalizedBackupDir = backupDir.replace(/\\/g, '/');
```

---

## MCP SPECIFICATION COMPLIANCE

### 4. Stdio Transport Implementation (SEVERITY: LOW - COMPLIANT)

**Location**: `index.js` lines 27, 33-36, 134, 136, 148

**Status**: ✅ COMPLIANT

**Evidence**:

- All logging goes to `stderr` (lines 27, 33-36, 134, 136, 148)
- No stdout pollution
- Uses `StdioServerTransport` from official SDK
- Protocol version: `2024-11-05` (line 67)

**Evidence from Documentation**:

```markdown
- The server **MAY** write UTF-8 strings to its standard error (`stderr`) for any
  logging purposes including informational, debug, and error messages.
- The server **MUST NOT** write anything to its `stdout` that is not a valid MCP message.
```

Source: `ide_mcp_corpus/mcp_spec/transports.md` lines 12-14

**Recommendation**: None - implementation is correct

---

### 5. Tool Schema Compliance (SEVERITY: LOW - COMPLIANT)

**Location**: `lib/tools/registry-core.js` lines 12-18, 25-35, 42-59

**Status**: ✅ COMPLIANT

**Evidence**:

- All tools have proper `inputSchema` with `type: 'object'`
- `properties` field defines parameters
- `required` field specifies mandatory parameters
- Schema follows JSON Schema format

**Evidence from Documentation**:

```markdown
The Model Context Protocol (MCP) allows servers to expose tools that can be invoked by
language models. Tools enable models to interact with external systems, such as querying
databases, calling APIs, or performing computations. Each tool is uniquely identified by
a name and includes metadata describing its schema.
```

Source: `ide_mcp_corpus/mcp_spec/tools.md` lines 1-4

**Recommendation**: None - implementation is correct

---

### 6. Protocol Version (SEVERITY: LOW)

**Location**: `index.js` line 67

**Issue**:

- Protocol version is set to `2024-11-05`
- MCP specification has evolved (current docs reference `2025-11-25`)

**Impact**:

- May not support newer MCP features
- Could cause compatibility issues with future Windsurf updates

**Recommendation**:
Update to latest protocol version:

```javascript
return {
  protocolVersion: '2025-11-25',
  capabilities: { tools: {} },
  serverInfo: { name: 'SWEObeyMe', version: VERSION },
};
```

---

## WINDSURF-SPECIFIC ISSUES

### 7. Missing Admin Controls Support (SEVERITY: MEDIUM)

**Location**: Not implemented

**Issue**:

- Extension does not implement admin controls or whitelisting features
- Windsurf documentation describes team admin capabilities for MCP server whitelisting
- Enterprise deployments may require whitelisting compliance

**Impact**:

- Enterprise users may not be able to use the extension if their team has whitelisting enabled
- Could block adoption in corporate environments

**Evidence from Documentation**:

```markdown
## Admin Controls (Teams & Enterprises)

Team admins can toggle MCP access for their team, as well as whitelist approved MCP servers for their team to use.

By default, users within a team will be able to configure their own MCP servers. However, once you whitelist even a single MCP server, **all non-whitelisted servers will be blocked** for your team.
```

Source: `ide_mcp_corpus/windsurf/mcp_admin_controls.md` lines 1-9

**Recommendation**:
Document the server configuration pattern for whitelisting:

```json
{
  "command": "node",
  "args": ["--no-warnings", "/path/to/index.js"],
  "env": {
    "NODE_ENV": "production",
    "SWEOBEYME_BACKUP_DIR": "/path/to/backups"
  }
}
```

Provide instructions for team admins to whitelist this pattern.

---

### 8. Missing Remote HTTP Transport Support (SEVERITY: LOW)

**Location**: Not implemented

**Issue**:

- Extension only supports stdio transport
- Windsurf supports stdio, Streamable HTTP, and SSE transports
- Remote HTTP could be useful for certain deployment scenarios

**Impact**:

- Limited deployment flexibility
- Cannot use remote server capabilities

**Recommendation**:
Consider adding remote HTTP transport support for enterprise deployments where remote server hosting is required.

---

## VS CODE EXTENSION API COMPLIANCE

### 9. Extension Activation (SEVERITY: LOW - COMPLIANT)

**Location**: `package.json` line 27-29, `extension.js` line 141

**Status**: ✅ COMPLIANT

**Evidence**:

- Uses `onStartupFinished` activation event (appropriate for MCP servers)
- Proper command registration
- Status bar item creation
- Diagnostic collection setup

**Recommendation**: None - implementation is correct

---

### 10. Configuration Schema (SEVERITY: LOW - COMPLIANT)

**Location**: `package.json` lines 99-302

**Status**: ✅ COMPLIANT

**Evidence**:

- Comprehensive configuration schema
- Proper type definitions
- Default values provided
- Descriptions included

**Recommendation**: None - implementation is correct

---

## INSTALLATION ISSUES

### 11. Extension Detection Logic (SEVERITY: MEDIUM)

**Location**: `extension.js` lines 175-176

**Issue**:

```javascript
const isInstalled =
  extensionPath.includes('.windsurf-next\\extensions') ||
  extensionPath.includes('.vscode\\extensions');
```

**Impact**:

- Windows-specific path check (backslashes)
- Won't detect Windsurf-Next on Linux/Mac
- Could cause auto-configuration to fail on non-Windows platforms

**Recommendation**:
Use platform-agnostic path detection:

```javascript
const isInstalled =
  extensionPath.includes(path.join('.windsurf-next', 'extensions')) ||
  extensionPath.includes(path.join('.vscode', 'extensions'));
```

---

### 12. Fallback Config Writer Race Condition (SEVERITY: MEDIUM)

**Location**: `extension.js` lines 185-274

**Issue**:

- No file locking mechanism when writing mcp_config.json
- Multiple extensions could write simultaneously
- Could cause config corruption

**Impact**:

- Config file could be corrupted if multiple extensions write simultaneously
- Users may lose other MCP server configurations

**Recommendation**:
Implement file locking or atomic write operations:

```javascript
// Use atomic write with temp file
const tempPath = mcpConfigPath + '.tmp';
fs.writeFileSync(tempPath, JSON.stringify(config, null, 2));
fs.renameSync(tempPath, mcpConfigPath);
```

---

## UI/UX ISSUES

### 13. Error Messaging (SEVERITY: LOW)

**Location**: `extension.js` lines 259-273

**Issue**:

- Error messages are informative but could be more actionable
- No link to troubleshooting documentation

**Recommendation**:
Add direct links to troubleshooting docs:

```javascript
vscode.window.showWarningMessage(
  `Failed to auto-configure SWEObeyMe MCP server.\n\nSuggestions:\n${suggestions.join('\n')}\n\nDocumentation: https://github.com/stonewolfpc/SWEObeyMe#troubleshooting`,
  'Open Documentation',
  'Dismiss'
);
```

---

### 14. Reload Prompt (SEVERITY: LOW)

**Location**: `extension.js` lines 246-253

**Issue**:

- Reload prompt is shown on every configuration update
- Could be annoying for users who frequently update

**Recommendation**:
Add a flag to track if user has already been prompted:

```javascript
const configKey = 'sweObeyMe.lastConfigHash';
const lastHash = context.globalState.get(configKey);
const currentHash = hashConfig(config);

if (needsUpdate && lastHash !== currentHash) {
  // Show reload prompt
  context.globalState.update(configKey, currentHash);
}
```

---

## SUMMARY

### Critical Issues (Must Fix)

1. **MCP Config Path Mismatch** - activate() and deactivate() use different paths, neither matches Windsurf docs
2. **Missing Environment Variable Interpolation** - Hardcoded paths break cross-platform compatibility

### High Priority Issues

3. **Incomplete Path Normalization** - Only index path normalized, not backup dir
4. **Extension Detection Logic** - Windows-specific backslashes break Linux/Mac detection
5. **Fallback Config Writer Race Condition** - No file locking could corrupt config

### Medium Priority Issues

6. **Protocol Version** - Using outdated 2024-11-05 instead of 2025-11-25
7. **Missing Admin Controls Support** - Enterprise whitelisting not documented
8. **Extension Detection** - Platform-specific path detection

### Low Priority Issues

9. **Missing Remote HTTP Transport** - Only stdio supported
10. **Error Messaging** - Could be more actionable
11. **Reload Prompt** - Could be annoying for frequent updates

### Compliant Areas

- ✅ Stdio transport implementation (logs to stderr, no stdout pollution)
- ✅ Tool schema compliance (proper inputSchema)
- ✅ VS Code extension activation
- ✅ Configuration schema

---

## IMMEDIATE ACTION ITEMS

1. **Fix MCP config path** to use `~/.codeium/mcp_config.json` consistently
2. **Add environment variable interpolation** for cross-platform compatibility
3. **Update protocol version** to `2025-11-25`
4. **Fix extension detection logic** to use platform-agnostic paths
5. **Add file locking** for config writes
6. **Document admin whitelisting pattern** for enterprise deployments

---

## TESTING RECOMMENDATIONS

1. Test extension installation on Windows, Linux, and Mac
2. Verify MCP config is written to correct location on all platforms
3. Test uninstall/cleanup removes config correctly
4. Test concurrent extension installs to verify no config corruption
5. Test with Windsurf-Next team whitelisting enabled
6. Verify stdio transport compliance with MCP spec
7. Test tool schema validation with MCP inspector

---

## DOCUMENTATION REFERENCES

- Windsurf MCP Config: `ide_mcp_corpus/windsurf/mcp_config.md`
- Windsurf Remote HTTP: `ide_mcp_corpus/windsurf/mcp_remote_http.md`
- Windsurf Admin Controls: `ide_mcp_corpus/windsurf/mcp_admin_controls.md`
- MCP Specification: `ide_mcp_corpus/mcp_spec/transports.md`
- MCP Tools: `ide_mcp_corpus/mcp_spec/tools.md`
- VS Code Extension API: `ide_mcp_corpus/vscode/extension_api_overview.md`
