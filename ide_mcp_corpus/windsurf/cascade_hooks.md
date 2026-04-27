# Windsurf Cascade Hooks

Source: https://docs.windsurf.com/windsurf/cascade/hooks
Last updated: 2026-04-27 (Wave 13 / Merry Shipmas release — now stable)

Execute custom shell commands at key points during Cascade's workflow for logging, security, quality assurance, and governance.

## What Hooks Enable

- **Logging & Analytics**: Track every file read, code change, command executed, user prompt, or Cascade response
- **Security Controls**: Block Cascade from accessing sensitive files, running dangerous commands, or processing policy-violating prompts
- **Quality Assurance**: Run linters, formatters, or tests automatically after code modifications
- **Custom Workflows**: Integrate with issue trackers, notification systems, or deployment pipelines
- **Team Standardization**: Enforce coding standards across your organization

## How Hooks Work

1. Hook receives context (JSON) via **standard input**
2. Your script executes (Python, Bash, Node.js, or any executable)
3. Returns result via **exit code** and output streams

**Pre-hooks** can **block the action** by exiting with exit code `2`.

## Configuration File Locations

Hooks are configured in JSON files at three levels. All levels are **merged** (system → user → workspace):

### System-Level
- Windows: `C:\ProgramData\Windsurf\hooks.json`
- macOS: `/Library/Application Support/Windsurf/hooks.json`
- Linux/WSL: `/etc/windsurf/hooks.json`

### User-Level
- Windsurf IDE: `~/.codeium/windsurf/hooks.json`
- JetBrains Plugin: `~/.codeium/hooks.json`

### Workspace-Level
- `.windsurf/hooks.json` in workspace root (version-controlled with team)

## Hook Events

### pre_mcp_tool_use
Triggered **before** Cascade invokes an MCP tool. Can **block** (exit code 2).

Input JSON:
```json
{
  "agent_action_name": "pre_mcp_tool_use",
  "tool_info": {
    "mcp_server_name": "github",
    "mcp_tool_name": "create_issue",
    "mcp_tool_arguments": { "owner": "...", "repo": "...", "title": "..." }
  }
}
```

### post_mcp_tool_use
Triggered **after** Cascade successfully invokes an MCP tool.

### pre_write_code
Triggered **before** Cascade writes or modifies a code file. Can **block**.

Input JSON:
```json
{
  "agent_action_name": "pre_write_code",
  "tool_info": { "file_path": "/path/to/file.py" }
}
```

### post_write_code
Triggered **after** Cascade writes or modifies a code file. Use for linters, formatters, tests.

Input JSON includes `edits` array with `old_string`/`new_string` pairs.

### pre_run_command
Triggered **before** Cascade executes a terminal command. Can **block**.

Input JSON:
```json
{
  "agent_action_name": "pre_run_command",
  "tool_info": { "command_line": "npm install package-name", "cwd": "/path/to/project" }
}
```

### post_run_command
Triggered **after** Cascade executes a terminal command.

### pre_user_prompt
Triggered **before** Cascade processes a user's prompt text. Can **block**.

Input JSON:
```json
{
  "agent_action_name": "pre_user_prompt",
  "tool_info": { "user_prompt": "can you run echo hello" }
}
```
Note: `show_output` config does NOT apply to this hook.

### post_cascade_response
Triggered **asynchronously after** Cascade completes a full response. Contains full response since last user input.

Input JSON:
```json
{
  "agent_action_name": "post_cascade_response",
  "tool_info": { "response": "### Planner Response\n..." }
}
```
Note: Response is markdown-formatted, includes which rules were triggered. `show_output` does NOT apply.

### pre_read_code / post_read_code
Triggered before/after Cascade reads a code file.

### post_setup_worktree
Triggered after a Git worktree is set up.

### post_cascade_response_with_transcript
Triggered after response, includes full conversation transcript.

## Exit Codes

| Code | Meaning |
|---|---|
| 0 | Success — action proceeds |
| 1 | Hook error — logged but action still proceeds |
| 2 | **Block** — pre-hooks only; action is BLOCKED |

## SWEObeyMe Relevance

Cascade Hooks are a **governance enforcement mechanism** that runs OUTSIDE of MCP tool calls. They complement our MCP server:
- `pre_mcp_tool_use`: Can audit/block specific MCP tool calls before they execute
- `post_write_code`: Can run our validation engine after every file write
- `pre_run_command`: Can block dangerous commands
- `post_cascade_response`: Can log all AI responses for compliance

Our MCP-based governance intercepts at the tool call level; hooks intercept at the Cascade workflow level. Both are needed for complete coverage.
