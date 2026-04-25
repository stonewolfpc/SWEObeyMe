# SWEObeyMe Common Patterns Guide

Successful patterns AI should follow when using SWEObeyMe.

## Overview

This document outlines successful patterns and workflows that AI models should follow when using SWEObeyMe tools. These patterns have been proven to work well and help avoid common pitfalls.

## Pattern 1: Search-Before-Edit

**Description:** Always search for relevant code before making edits to understand the context and avoid duplicate work.

**Workflow:**

```
1. Use search_code_files to find relevant code
2. Use get_file_context to understand dependencies
3. Use analyze_change_impact to check ripple effects
4. Make changes with obey_surgical_plan → write_file
5. Use run_related_tests to verify
```

**Example:**

```json
{
  "tool": "search_code_files",
  "arguments": {
    "query": "function getUserData",
    "directory": "./src"
  }
}
```

**Why This Works:**

- Prevents duplicate implementations
- Identifies existing solutions
- Reveals dependencies before breaking them
- Reduces technical debt

## Pattern 2: Validate-Before-Write

**Description:** Always validate code before writing to prevent broken code and surgical violations.

**Workflow:**

```
1. Use obey_surgical_plan to check line count
2. Use verify_syntax to check syntax
3. Use verify_imports to check dependencies
4. Use validate_change_before_apply for comprehensive validation
5. Use write_file only after all validations pass
```

**Example:**

```json
{
  "tool": "preflight_change",
  "arguments": {
    "path": "./src/index.js",
    "content": "// Your code here",
    "changes": "Add new function"
  }
}
```

**Why This Works:**

- Prevents broken code from being written
- Catches surgical violations early
- Reduces rollback frequency
- Maintains code quality

## Pattern 3: Context-Aware Refactoring

**Description:** Always understand file context before refactoring to prevent breaking changes.

**Workflow:**

```
1. Use get_file_context to understand dependencies
2. Use analyze_change_impact to check ripple effects
3. Use get_symbol_references to find all usages
4. Make changes with obey_surgical_plan → write_file
5. Use run_related_tests to verify
```

**Example:**

```json
{
  "tool": "get_file_context",
  "arguments": {
    "path": "./src/utils.js"
  }
}
```

**Why This Works:**

- Prevents breaking changes
- Identifies all affected code
- Ensures complete refactoring
- Reduces regressions

## Pattern 4: Incremental File Splitting

**Description:** Split large files incrementally rather than attempting massive refactors.

**Workflow:**

```
1. Use get_file_context to identify large functions
2. Use obey_surgical_plan to check current state
3. Use refactor_move_block to move one function
4. Use verify_imports to check dependencies
5. Use write_file to apply change
6. Repeat until file is under limit
```

**Example:**

```json
{
  "tool": "refactor_move_block",
  "arguments": {
    "source_path": "./src/large-file.js",
    "target_path": "./lib/utils.js",
    "code_block": "function myLargeFunction() { /* ... */ }"
  }
}
```

**Why This Works:**

- Reduces risk of large refactors
- Allows testing each step
- Easier to debug issues
- Maintains code stability

## Pattern 5: Test-Driven Changes

**Description:** Run tests after every change to catch regressions immediately.

**Workflow:**

```
1. Make changes with obey_surgical_plan → write_file
2. Use run_related_tests to verify
3. If tests fail, fix code and retry
4. Use generate_change_summary to document
```

**Example:**

```json
{
  "tool": "run_related_tests",
  "arguments": {
    "path": "./src/index.js"
  }
}
```

**Why This Works:**

- Catches regressions immediately
- Reduces debugging time
- Maintains test coverage
- Ensures code quality

## Pattern 6: Documentation-First Development

**Description:** Add documentation before or with code changes to maintain documentation ratio.

**Workflow:**

```
1. Use require_documentation to check current state
2. Add JSDoc comments to functions/classes
3. Add inline comments for complex logic
4. Use write_file with documented code
5. Use detect_architectural_drift to verify
```

**Example:**

```json
{
  "tool": "require_documentation",
  "arguments": {
    "path": "./src/index.js",
    "content": "// Your documented code"
  }
}
```

**Why This Works:**

- Maintains documentation ratio
- Improves code readability
- Reduces technical debt
- Helps future maintenance

## Pattern 7: Convention-Following

**Description:** Follow project conventions detected by analyze_project_conventions.

**Workflow:**

```
1. Use analyze_project_conventions to detect patterns
2. Apply naming conventions (camelCase, PascalCase, etc.)
3. Follow folder structure conventions
4. Use validate_naming_conventions to verify
5. Make changes with write_file
```

**Example:**

```json
{
  "tool": "validate_naming_conventions",
  "arguments": {
    "path": "./src/index.js"
  }
}
```

**Why This Works:**

- Maintains consistency
- Reduces cognitive load
- Improves code readability
- Follows team standards

## Pattern 8: Error-Recovery Loop

**Description:** Follow structured error recovery when operations fail.

**Workflow:**

```
1. If operation fails, use explain_rejection
2. Use suggest_alternatives to find alternatives
3. Try alternative approach
4. If still fails after 3 attempts, use request_surgical_recovery
5. Start fresh with different approach
```

**Example:**

```json
{
  "tool": "explain_rejection",
  "arguments": {
    "reason": "Line count exceeds limit"
  }
}
```

**Why This Works:**

- Prevents infinite loops
- Provides structured recovery
- Reduces frustration
- Maintains progress

## Pattern 9: Project-Memory Utilization

**Description:** Use project memory to understand project structure and conventions.

**Workflow:**

```
1. Use index_project_structure to build memory
2. Use analyze_project_conventions to detect patterns
3. Use get_project_memory_summary to check state
4. Make decisions based on project context
5. Use record_decision to document choices
```

**Example:**

```json
{
  "tool": "index_project_structure",
  "arguments": {
    "excludeDirs": ["node_modules", "dist"]
  }
}
```

**Why This Works:**

- Provides project context
- Detects conventions automatically
- Reduces manual configuration
- Improves decision quality

## Pattern 10: Backup-Safe Operations

**Description:** Always ensure backups exist before risky operations.

**Workflow:**

```
1. Use create_backup before risky changes
2. Make changes with write_file (auto-backups)
3. If issues arise, use restore_backup
4. Use get_historical_context to track changes
```

**Example:**

```json
{
  "tool": "create_backup",
  "arguments": {
    "path": "./src/index.js"
  }
}
```

**Why This Works:**

- Prevents data loss
- Enables quick recovery
- Reduces risk anxiety
- Encourages experimentation

## Pattern 11: Anti-Pattern Avoidance

**Description:** Check for anti-patterns before and after changes.

**Workflow:**

```
1. Use check_for_anti_patterns before changes
2. Address identified issues
3. Make changes
4. Use check_for_anti_patterns after changes
5. Ensure no new anti-patterns introduced
```

**Example:**

```json
{
  "tool": "check_for_anti_patterns",
  "arguments": {
    "path": "./src/index.js"
  }
}
```

**Why This Works:**

- Prevents code smells
- Maintains code quality
- Reduces technical debt
- Improves maintainability

## Pattern 12: C# Error-Aware Development

**Description:** Check C# errors before and after changes for C# projects.

**Workflow:**

```
1. Use get_csharp_errors_for_file before changes
2. Fix existing errors
3. Make changes
4. Use get_csharp_errors_for_file after changes
5. Ensure no new errors introduced
```

**Example:**

```json
{
  "tool": "get_csharp_errors_for_file",
  "arguments": {
    "path": "./Program.cs",
    "severity_threshold": 0
  }
}
```

**Why This Works:**

- Catches C# errors early
- Maintains code quality
- Reduces compilation issues
- Improves reliability

## Pattern 13: Workflow-Orchestration for Complex Tasks

**Description:** Use initiate_surgical_workflow for complex multi-step operations.

**Workflow:**

```
1. Use initiate_surgical_workflow with all steps
2. Use get_workflow_status to track progress
3. Complete steps in order
4. Use generate_change_summary at end
```

**Example:**

```json
{
  "tool": "initiate_surgical_workflow",
  "arguments": {
    "goal": "Split large file into modules",
    "steps": [
      { "name": "Analyze file", "tool": "get_file_context" },
      { "name": "Move function 1", "tool": "refactor_move_block" },
      { "name": "Move function 2", "tool": "refactor_move_block" },
      { "name": "Verify imports", "tool": "verify_imports" }
    ]
  }
}
```

**Why This Works:**

- Provides structure to complex tasks
- Tracks progress automatically
- Reduces missed steps
- Improves reliability

## Pattern 14: Oracle Consultation for Complex Tasks

**Description:** Query the Oracle for guidance on complex or unclear tasks.

**Workflow:**

```
1. Use query_the_oracle for motivation/guidance
2. Use get_architectural_directive for standards
3. Use get_operation_guidance for specific tools
4. Apply guidance to task
```

**Example:**

```json
{
  "tool": "query_the_oracle",
  "arguments": {}
}
```

**Why This Works:**

- Provides motivation for difficult tasks
- Clarifies architectural standards
- Improves decision quality
- Reduces uncertainty

## Pattern 15: Session Memory for Accountability

**Description:** Use session memory to track decisions and progress.

**Workflow:**

```
1. Use get_session_context to check history
2. Use record_decision to document choices
3. Use get_session_context to review progress
4. Maintain accountability throughout session
```

**Example:**

```json
{
  "tool": "record_decision",
  "arguments": {
    "decision": "Chose to extract function to utils.js for better organization"
  }
}
```

**Why This Works:**

- Provides audit trail
- Improves accountability
- Helps with debugging
- Documents reasoning

## Pattern 16: Dry-Run for Risky Changes

**Description:** Use dry_run_write_file to test risky changes before applying.

**Workflow:**

```
1. Use dry_run_write_file to simulate change
2. Review results
3. If issues, fix and retry
4. If clean, use write_file
```

**Example:**

```json
{
  "tool": "dry_run_write_file",
  "arguments": {
    "path": "./src/index.js",
    "content": "// Your code here"
  }
}
```

**Why This Works:**

- Tests changes without risk
- Catches issues early
- Reduces rollback frequency
- Increases confidence

## Pattern 17: Diff-Review Before Applying

**Description:** Use diff_changes to review exact changes before applying.

**Workflow:**

```
1. Use diff_changes to see exact changes
2. Review additions, deletions, modifications
3. If unexpected, adjust code
4. If correct, use write_file
```

**Example:**

```json
{
  "tool": "diff_changes",
  "arguments": {
    "path": "./src/index.js",
    "proposed_content": "// Your new code"
  }
}
```

**Why This Works:**

- Shows exact impact
- Catches unintended changes
- Improves code review
- Reduces surprises

## Pattern 18: Dangerous-Operation Confirmation

**Description:** Use confirm_dangerous_operation before destructive actions.

**Workflow:**

```
1. Use confirm_dangerous_operation for destructive actions
2. Wait for approval
3. If approved, proceed
4. If rejected, modify or abort
```

**Example:**

```json
{
  "tool": "confirm_dangerous_operation",
  "arguments": {
    "operation": "Delete entire src/ directory"
  }
}
```

**Why This Works:**

- Prevents accidental destruction
- Provides safety checks
- Reduces risk anxiety
- Encourages careful planning

## Pattern 19: Language-Specific Tool Selection

**Description:** Use language-specific tools when available.

**Workflow:**

```
1. Use detect_file_language to identify language
2. Use language-specific tools (C# Bridge for C#, etc.)
3. Use general tools for validation
4. Combine language-specific and general tools
```

**Example:**

```json
{
  "tool": "detect_file_language",
  "arguments": {
    "filepath": "./Program.cs"
  }
}
```

**Why This Works:**

- Provides better analysis
- Catches language-specific issues
- Improves code quality
- Reduces false positives

## Pattern 21: Configuration-Aware Development

**Description:** Check and respect project configuration before making changes.

**Workflow:**

```
1. Use get_config to check current settings
2. Respect line count limits
3. Respect forbidden patterns
4. Use set_config if changes needed (with user approval)
```

**Example:**

```json
{
  "tool": "get_config",
  "arguments": {}
}
```

**Why This Works:**

- Respects project standards
- Prevents configuration conflicts
- Maintains consistency
- Reduces rejections

## Pattern 22: Implement Directly

**Description:** Implement functionality directly and inform user, rather than stubbing, faking, or asking.

**Workflow:**

```
1. Assess if implementation is possible with available information
2. If yes, implement the functionality directly
3. Break complex tasks into smaller, testable increments
4. Implement each increment completely before moving to next
5. Inform user after each significant milestone
6. Only ask user when truly blocked
```

**Example:**

```
AI: I'll implement the authentication system
(Implements login endpoint with JWT)
(Implements user registration)
(Implements password reset)
(Informs user: Authentication system complete with login, registration, and password reset)
```

**Why This Works:**

- Delivers working code, not stubs
- Reduces technical debt
- Provides tangible progress
- Respects user's time
- Only blocks when genuinely necessary

**When to Ask User:**

- Missing credentials or API keys
- Permission/access issues
- Ambiguous requirements
- Multiple valid approaches exist
- Making destructive/irreversible changes

**When to Implement Directly:**

- Requirements are clear and unambiguous
- Standard patterns exist
- Task is complex but can be broken down
- All necessary information is available

## Quick Reference

### Most Common Workflows

**Simple File Edit:**

```
read_file → obey_surgical_plan → write_file → run_related_tests
```

**Refactoring:**

```
get_file_context → analyze_change_impact → obey_surgical_plan → write_file → run_related_tests
```

**New File:**

```
obey_surgical_plan → verify_syntax → verify_imports → write_file → run_related_tests
```

**Large File Split:**

```
get_file_context → refactor_move_block → verify_imports → write_file (repeat)
```

**Error Fixing:**

```
get_csharp_errors_for_file → fix errors → verify_syntax → write_file
```

## Pattern Selection Guide

| Task               | Primary Pattern                  | Secondary Pattern           |
| ------------------ | -------------------------------- | --------------------------- |
| Simple edit        | Validate-Before-Write            | Test-Driven Changes         |
| Refactoring        | Context-Aware Refactoring        | Search-Before-Edit          |
| New file           | Validate-Before-Write            | Convention-Following        |
| Large file split   | Incremental File Splitting       | Backup-Safe Operations      |
| Error fixing       | Error-Recovery Loop              | Test-Driven Changes         |
| Complex task       | Workflow-Orchestration           | Oracle Consultation         |
| Risky change       | Dry-Run for Risky Changes        | Diff-Review Before Applying |
| Destructive action | Dangerous-Operation Confirmation | Backup-Safe Operations      |

## Next Steps

- Apply these patterns in your workflow
- See [ANTI_PATTERNS.md](ANTI_PATTERNS.md) for common mistakes
- See [DECISION_TREE.md](DECISION_TREE.md) for tool selection
- See [README.md](README.md) for complete tool list
