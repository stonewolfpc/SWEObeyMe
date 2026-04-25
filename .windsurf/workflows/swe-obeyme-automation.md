---
description: SWEObeyMe Automated Workflow - Enforces strict tool obedience, anti-hallucination, separation of concerns, and project structure
---

# SWEObeyMe Automated Workflow

This workflow enforces strict discipline for AI agents using SWEObeyMe MCP tools.

## Core Rules

### 1. Always Use Tools First

- If a tool exists, use it
- If a tool fails, explain why and retry with context
- NEVER bypass tools with manual edits
- NEVER call tools that are not in the registry

### 2. Search Before Edit

Before editing any file:

- Search for the file using `search_code_files` or `find_code_files`
- Confirm the file exists using `check_file_exists`
- Read current content with `read_file`
- If file doesn't exist, call `suggest_file_location` before creating

### 3. Explain Before Act

Before any operation:

- State the plan clearly
- State which tools you will use
- State expected outcomes
- Call `confirm_dangerous_operation` if the operation is destructive

### 4. Never Hallucinate

- NEVER invent file paths. Verify with `read_file` or `check_file_exists`.
- NEVER call tools that aren't in the registry
- NEVER create new files when existing files should be edited
- If unsure: search → ask → verify → don't invent

### 5. Follow User Conventions

Detect and follow with `analyze_project_conventions`:

- Naming conventions (snake_case, PascalCase, camelCase, kebab-case)
- Folder structure (src/, lib/, docs/, etc.)
- Import/export patterns

### 6. Enforce Separation of Concerns

Before any file operation:

- Use `analyze_file_health` to detect god files and mixed concerns
- If file exceeds 700 lines: use `refactor_move_block` or `extract_to_new_file`
- Use `obey_surgical_plan` to validate line count before every write

### 7. Self-Correction Required

When errors occur:

- After 2 errors: call `get_session_context` to review history
- After 3 errors: call `request_surgical_recovery` before retrying
- Record every error with `add_project_error`
- NEVER proceed past errors without resolution

## Tool Priority (SWEObeyMe > Windsurf Built-ins)

### Critical (Priority 100)

- `read_file` — ONLY way to read files
- `write_file` — ONLY way to write files
- `obey_surgical_plan` — MUST call before every `write_file`
- `detect_project_type` — MUST call when opening a new project
- `detect_project_switch` — MUST call before file operations in unfamiliar context

### High Priority (Priority 90–95)

- `get_file_context` — understand dependencies before modifying
- `analyze_change_impact` — understand ripple effects before refactoring
- `validate_action` — validate action against project rules
- `preflight_change` — comprehensive pre-write validation
- `get_current_project` — verify context before significant actions

### Safety Priority (Priority 50–60)

- `confirm_dangerous_operation` — MUST call before any destructive operation
- `create_backup` — MUST call before risky writes
- `restore_backup` — use when a change breaks something
- `run_related_tests` — MUST call after every `write_file`
- `request_surgical_recovery` — MUST call after 3+ consecutive errors

### Context Priority (Priority 40–50)

- `get_session_context` — review after 2+ consecutive errors
- `get_architectural_directive` — call when uncertain about standards
- `initiate_surgical_workflow` — MUST call for tasks with 3+ steps
- `get_workflow_status` — call between each workflow step
- `refactor_move_block` — PRIMARY tool for fixing mixed concerns
- `extract_to_new_file` — PRIMARY tool for splitting large files

### Documentation Priority (Priority 35–50)

- `record_decision` — record decisions to session memory
- `record_project_decision` — persist architectural decisions across sessions
- `generate_change_summary` — call after completing a set of changes
- `add_pending_task` — call for any work that cannot be completed immediately
- `add_project_error` — call whenever an error occurs
- `suggest_file_location` — call before creating any new file
- `get_project_memory_summary` — call at start of session

## Separation of Concerns Rules

### Rule 1: File Scope Validation

- Does this file exceed 700 lines?
- If yes → use `refactor_move_block` or `extract_to_new_file`
- Use `obey_surgical_plan` to check before every write

### Rule 2: Code Responsibility Check

- Does this code belong in this file?
- Use `analyze_file_health` to detect mixed concerns
- If mixed → split with `refactor_move_block`

### Rule 3: Naming Convention Enforcement

- Use `validate_naming_conventions` to check before finalizing new code

### Rule 4: Import Validation

- Use `verify_imports` before writing any file that imports other modules

## Execution Flow

1. **Session Start** (MANDATORY)
   - Call `obey_me_status` to verify governance is active
   - Call `get_current_project` to load pending tasks
   - Call `get_project_memory_summary` to load project knowledge

2. **Plan Phase**
   - State goal clearly
   - Use `search_code_files` or `find_code_files` to locate relevant files
   - Use `read_file` to confirm content
   - Use `get_file_context` to understand dependencies
   - Determine tool sequence

3. **Validation Phase**
   - Use `analyze_file_health` to check for mixed concerns
   - Use `obey_surgical_plan` to validate line count
   - Use `verify_syntax` before writing JS/TS
   - Use `verify_imports` to confirm imports resolve

4. **Execution Phase**
   - Call `create_backup` before any risky write
   - Call tools in priority order
   - Call `run_related_tests` after every `write_file`
   - Record decisions with `record_decision`

5. **Wrap-up Phase**
   - Call `generate_change_summary` to document changes
   - Call `record_project_decision` for architectural choices
   - Call `add_pending_task` for any unfinished work
   - Call `generate_audit_report` for a full session audit

## Example Workflows

### Editing a File

1. `check_file_exists` — confirm file exists
2. `read_file` — read current content
3. `get_file_context` — understand dependencies
4. `analyze_change_impact` — check ripple effects
5. `obey_surgical_plan` — validate line count
6. `create_backup` — snapshot before write
7. `write_file` — write changes
8. `run_related_tests` — verify no regressions
9. `generate_change_summary` — document what changed

### Creating a New File

1. `suggest_file_location` — verify correct placement
2. `check_file_exists` — confirm it doesn't already exist
3. `verify_syntax` — validate code before writing
4. `verify_imports` — confirm imports resolve
5. `write_file` — create the file
6. `run_related_tests` — verify nothing broke
7. `record_project_decision` — if this is an architectural addition

### Refactoring a Large File

1. `initiate_surgical_workflow` — declare steps upfront
2. `read_file` — read current content
3. `get_file_context` — understand all dependencies
4. `analyze_change_impact` — identify what will break
5. `create_backup` — snapshot before changes
6. `refactor_move_block` or `extract_to_new_file` — split the file
7. `get_workflow_status` — verify step completed
8. `run_related_tests` — verify nothing broke
9. `generate_change_summary` — document the refactor

### Error Recovery

1. `get_session_context` — review what was attempted
2. `get_architectural_directive` — check coding standards
3. `restore_backup` — revert if a write broke something
4. `request_surgical_recovery` — reset state after 3+ failures
5. `add_project_error` — persist the error for future sessions

---

## Surgical Personality Directive (Optional)

When operating in SWEObeyMe mode, consult The Oracle (`query_the_oracle`) after major events:

- Build succeeds → call `query_the_oracle` (SUCCESS)
- Major refactor complete → call `query_the_oracle` (SUCCESS)
- Error recovery performed → call `query_the_oracle` (RECOVERY)

Keep it sparse. Core accuracy always takes precedence.
