---
description: SWEObeyMe Automated Workflow - Enforces strict tool obedience, anti-hallucination, separation of concerns, and project structure
---

# SWEObeyMe Automated Workflow

This workflow enforces strict discipline for AI agents using SWEObeyMe MCP tools with **automated separation of concerns** and **project map synchronization**.

## Core Rules

### 1. Always Use Tools First
- If a tool exists, use it
- If a tool fails, explain why and retry with context
- If a tool is missing, ask for it
- NEVER bypass tools with manual edits

### 2. Search Before Edit
Before editing any file:
- Search for the file using `search_code_files` or `find_code_files`
- Confirm the file exists using `read_file`
- Confirm the content matches expectations
- Confirm the correct location
- If file doesn't exist, state "File not found, searching..." before creating

### 3. Explain Before Act
Before any operation:
- State the plan clearly
- State the reasoning for the plan
- State which tools you will use
- State expected outcomes
- Wait for confirmation if operation is destructive

### 4. Never Hallucinate
- NEVER invent file paths that don't exist
- NEVER call tools that aren't defined
- NEVER create new files when existing files should be edited
- If unsure: search → ask → verify → don't invent

### 5. Maintain Project Map (Source of Truth)
Always maintain awareness of:
- **project_map.json** is the single source of truth for project structure
- Every file belongs to a domain (auth, database, models, services, controllers, utils, interfaces)
- Every file has a purpose and module
- Root directory may only contain: README, LICENSE, project_map.json, package.json, config files
- Use `read_project_map` to view current state
- Use `write_project_map` to update after file operations

### 6. Follow User Conventions
Detect and follow:
- Naming conventions (snake_case, PascalCase, camelCase, kebab-case)
- Folder structure (src/, lib/, docs/, etc.)
- File organization patterns
- Import/export patterns
- Domain-based organization

### 7. Maintain Documentation Automatically
Every structural change MUST trigger:
- Update `project_map.json` (ALWAYS required)
- Update README if user-facing changes
- Update architecture.md if structural changes
- Update CHANGELOG.md for versioned changes
- Use `update_documentation` tool for automatic updates

### 8. Enforce Separation of Concerns
Before any file operation:
- Use `validate_against_project_map` to check file location
- Use `detect_code_domain` to identify code domain
- Use `evaluate_file_for_split` to check if file should be split
- If file in root (not config/docs): move to appropriate domain folder
- If file has multiple conceptual units: split into separate files
- If file exceeds 700 lines: use `refactor_move_block` or `extract_to_new_file`

### 9. Self-Correction Required
When errors occur:
- "I see a mismatch, let me fix it"
- "This file doesn't exist, let me search"
- "This tool failed, let me retry with context"
- NEVER proceed past errors without resolution

### 10. Version Tracking and Permission Gates
Before any push operation:
- Use `check_version_status` to view current version and pending changes
- Use `suggest_version_bump` to determine appropriate version increment
- Use `request_push_permission` to request user authorization
- **WAIT for user to grant permission** using `grant_push_permission`
- If permission denied: `revoke_push_permission` and explain why
- After successful push: use `clear_changes` to reset version state
- **NEVER push without explicit user permission**

### 11. Project Initialization (MANDATORY)
Before ANY task on a new or unfamiliar project:
- Use `check_project_scan_needed` to verify if scan is required
- If scan required: use `run_initialization_workflow`
- This performs: full project scan → build project map → generate health report
- **WAIT for user to review report and grant approval** using `grant_project_approval`
- **NEVER proceed with task without user approval after scan**
- Only after approval: proceed with the requested task
- This prevents hallucination, drift, and incorrect assumptions

### 12. Publish Validation (MANDATORY)
Before ANY publish operation (npm publish, vsce publish, git push, etc.):
- Use `check_publish_readiness` to validate project readiness
- This checks: package.json, version bump, README, CHANGELOG, documentation sync, project map, code quality
- If validation fails: fix critical issues before proceeding
- If validation passes: use `request_publish_permission` to request user authorization
- **WAIT for user to grant permission** using `grant_publish_permission`
- If permission denied: `deny_publish_permission` and explain why
- **NEVER publish without explicit user permission**
- Only after permission granted: proceed with publish operation

## Version Tracking Rules

### Change Classification
- **MAJOR**: Breaking changes, API changes, architectural restructuring
- **MINOR**: New features, backward-compatible additions
- **PATCH**: Bug fixes, documentation updates, minor improvements

### Permission Gate Flow
1. Record changes automatically via `update_documentation`
2. Before push: use `check_push_permitted` to verify permission status
3. If not permitted: use `request_push_permission` to request authorization
4. **WAIT** for user to use `grant_push_permission`
5. If granted: proceed with version bump and push
6. After push: use `clear_changes` to reset state
7. Permission is automatically revoked after successful push or new changes

### Version Bump Workflow
1. Use `check_version_status` to view current state
2. Use `suggest_version_bump` to get recommendation
3. Use `apply_version_bump` with recommended type (major/minor/patch)
4. This updates package.json automatically
5. Then request push permission before pushing

## Separation of Concerns Rules

### Rule 1: File Location Validation
- Does this file belong in this folder?
- If not → move it to appropriate domain folder
- Root directory restrictions: only config and docs allowed
- Use `validate_against_project_map` to check

### Rule 2: Code Responsibility Check
- Does this code belong in this file?
- If not → split it into separate files
- Max 1 conceptual unit per file
- Use `evaluate_file_for_split` to check

### Rule 3: File Scope Validation
- Does this file exceed its responsibility?
- If yes → split it
- Max 700 lines per file
- Use `obey_surgical_plan` to check line count

### Rule 4: Naming Convention Enforcement
- Does this file violate naming conventions?
- If yes → rename it
- Files should use kebab-case
- Classes should use PascalCase
- Constants should use UPPER_SNAKE_CASE
- Use `validate_naming_conventions` to check

### Rule 5: Documentation Updates
- Does this change require documentation updates?
- If yes → update docs automatically
- Structural changes require README, architecture.md, CHANGELOG.md updates
- Use `update_documentation` tool

### Rule 6: Project Map Synchronization
- Does this change require updating project_map.json?
- **ALWAYS YES** - project_map.json is the source of truth
- Every file operation must update project_map.json
- Use `write_project_map` to update

## Tool Priority (SWEObeyMe > Windsurf Built-ins)

### Critical (Priority 100)
- `check_project_scan_needed` - MUST call before any task on new project
- `run_initialization_workflow` - MUST call if scan needed (MANDATORY)
- `grant_project_approval` - User approval required after scan (MANDATORY)
- `check_publish_readiness` - MUST call before any publish operation (MANDATORY)
- `request_publish_permission` - MUST call before publishing (MANDATORY)
- `grant_publish_permission` - User approval required before publishing (MANDATORY)
- `read_file` - ONLY way to read files
- `write_file` - ONLY way to write files
- `obey_surgical_plan` - MUST call before write_file
- `preflight_change` - MUST call for non-trivial changes
- `write_project_map` - MUST call after file operations (CRITICAL)
- `check_push_permitted` - MUST call before any push operation (CRITICAL)

### High Priority (Priority 95)
- `get_file_context` - Understand dependencies before modifying
- `analyze_change_impact` - Understand ripple effects
- `verify_syntax` - Validate syntax before writing
- `validate_against_project_map` - Check file location and domain
- `evaluate_file_for_split` - Check if file should be split
- `check_version_status` - View current version and pending changes
- `suggest_version_bump` - Determine appropriate version increment

### Context Priority (Priority 80)
- `read_project_map` - View project structure (source of truth)
- `list_directory` - ONLY way to explore structure
- `search_code_files` - Search with language-aware ranking
- `get_code_language_stats` - Understand project composition
- `detect_code_domain` - Identify code domain for placement
- `suggest_file_location` - Get location suggestions based on domain

### Documentation Priority (Priority 75)
- `update_documentation` - Auto-update docs on structural changes
- `record_decision` - Record architectural decisions
- `record_change` - Record changes for version tracking

### Version Management Priority (Priority 70)
- `request_push_permission` - Request user authorization for push
- `grant_push_permission` - User grants push permission
- `revoke_push_permission` - User denies push permission
- `apply_version_bump` - Apply version increment to package.json
- `clear_changes` - Reset version state after successful push

### Fallback Priority (Priority 50)
- `get_session_context` - Check when stuck
- `get_architectural_directive` - Review when failing
- `suggest_alternatives` - Get alternatives when tools fail

## Domain-Based Organization

Projects should be organized by domain:

- **auth/** - Authentication and authorization logic
  - Allowed: service, controller, model, middleware
  - Tests: tests/auth/

- **database/** - Database connections, migrations, queries
  - Allowed: migration, seed, connection, repository
  - Tests: tests/database/

- **models/** - Data models and schemas
  - Allowed: model, schema, interface
  - Tests: tests/models/

- **services/** - Business logic and service layer
  - Allowed: service, manager, handler
  - Tests: tests/services/

- **controllers/** - HTTP request handlers and routing
  - Allowed: controller, router, endpoint
  - Tests: tests/controllers/

- **utils/** - Utility functions and helpers
  - Allowed: util, helper, constant
  - Tests: tests/utils/

- **interfaces/** - API contracts and type definitions
  - Allowed: interface, type, contract
  - Tests: tests/interfaces/

## Workflow Loop

After each action:
1. Re-evaluate project state
2. Check if goal is achieved
3. If not, determine next step
4. Apply all separation of concerns rules before proceeding
5. Update project_map.json (ALWAYS)
6. Update documentation if structural change
7. Repeat until goal achieved

## Anti-Hallucination System

### Path Verification
- Before using any path: verify with `read_file` or `list_directory`
- If path doesn't exist: search for it
- If file should exist but doesn't: state clearly and ask user

### Tool Verification
- Before calling any tool: check it exists in tool registry
- If tool not available: ask for alternative or explain why needed
- NEVER invent tool names or parameters

### Content Verification
- Before editing: read current content
- After editing: verify changes match intent
- If mismatch: state clearly and retry

## Project Map Integration

### Reading the Project Map
```markdown
Use: read_project_map
Output: Complete project structure, domains, boundaries, rules
```

### Updating the Project Map
```markdown
Use: write_project_map with:
- filePath: path to file
- operation: create | update | delete | move
- metadata: { purpose, domain, code, lineCount }
```

### Validating Against Project Map
```markdown
Use: validate_against_project_map with:
- filePath: path to validate
- code: file content (optional)
- filePurpose: file purpose (optional)
Output: Violations if any
```

## Execution Flow

0. **Initialization Phase** (NEW - MANDATORY)
   - Use `check_project_scan_needed` to verify if scan is required
   - If scan required: use `run_initialization_workflow`
   - This performs: full project scan → build project map → generate health report
   - **WAIT for user to review report and grant approval** using `grant_project_approval`
   - **NEVER proceed with task without user approval after scan**
   - Only after approval: proceed with the requested task
   - If scan not needed: proceed directly to Plan Phase

1. **Plan Phase**
   - State goal clearly
   - Read project_map.json to understand current structure
   - Search for relevant files
   - Verify file locations and domains
   - Determine tool sequence
   - Explain plan

2. **Validation Phase**
   - Use `validate_against_project_map` to check file location
   - Use `detect_code_domain` to identify code domain
   - Use `evaluate_file_for_split` to check if file should split
   - Address any violations before proceeding

3. **Execution Phase**
   - Call tools in priority order
   - Verify each operation
   - Handle failures with fallback
   - Record decisions

4. **Synchronization Phase**
   - Use `write_project_map` to update source of truth (ALWAYS)
   - Use `update_documentation` if structural change
   - Changes are automatically recorded in version tracker
   - Verify project_map.json reflects current state

5. **Version Tracking Phase**
   - Use `check_version_status` to view current version and pending changes
   - Use `suggest_version_bump` to determine appropriate version increment
   - If preparing to push: use `check_push_permitted` to verify permission status
   - If not permitted: use `request_push_permission` to request authorization
   - **WAIT for user to use `grant_push_permission`**
   - If granted: use `apply_version_bump` to update package.json
   - After successful push: use `clear_changes` to reset version state

6. **Publish Validation Phase** (NEW - MANDATORY for publish operations)
   - Use `check_publish_readiness` to validate project readiness
   - This checks: package.json, version bump, README, CHANGELOG, documentation sync, project map, code quality
   - If validation fails: fix critical issues before proceeding
   - If validation passes: use `request_publish_permission` to request user authorization
   - **WAIT for user to use `grant_publish_permission`**
   - If granted: proceed with publish operation (npm publish, vsce publish, git push, etc.)
   - If denied: adjust and try again
   - After successful publish: use `clear_publish_permission` to reset state

7. **Review Phase**
   - Summarize changes
   - Update project memory
   - Suggest next steps
   - Loop back if goal not achieved

## Example Workflow

### Creating a New File
1. Read project_map.json to understand domains
2. Use `detect_code_domain` to identify where file belongs
3. Use `suggest_file_location` to get folder recommendation
4. Use `validate_against_project_map` to verify location
5. Create file with `write_file`
6. Use `write_project_map` to register new file
7. Use `update_documentation` to update docs

### Editing a File
1. Read file with `read_file`
2. Use `evaluate_file_for_split` to check if file should split
3. Make edits with `write_file`
4. Use `write_project_map` to update file metadata
5. Use `update_documentation` if structural change

### Moving a File
1. Use `validate_against_project_map` to check current location
2. Use `suggest_file_location` to get new location
3. Move file
4. Use `write_project_map` with operation: move
5. Use `update_documentation` to update references

### Preparing to Push Changes
1. Use `check_version_status` to view current version and pending changes
2. Use `suggest_version_bump` to get version bump recommendation
3. Use `check_push_permitted` to verify permission status
4. If not permitted: use `request_push_permission` to request authorization
5. **WAIT for user to use `grant_push_permission`**
6. If granted: use `apply_version_bump` with recommended type (major/minor/patch)
7. Push changes
8. Use `clear_changes` to reset version state

### Starting a New Project (First Task)
1. Use `check_project_scan_needed` to verify if scan is required
2. If scan required: use `run_initialization_workflow`
3. Review the generated project health report
4. **WAIT for user to use `grant_project_approval`**
5. If approved: proceed with the requested task
6. If not approved: adjust approach based on user feedback

### Publishing a New Version
1. Use `check_publish_readiness` to validate project readiness
2. Review validation results (package.json, version, README, CHANGELOG, docs, project map, code quality)
3. Fix any critical issues if validation fails
4. If validation passes: use `request_publish_permission` to request user authorization
5. **WAIT for user to use `grant_publish_permission`**
6. If granted: proceed with publish operation (npm publish, vsce publish, git push, etc.)
7. After successful publish: use `clear_publish_permission` to reset state
