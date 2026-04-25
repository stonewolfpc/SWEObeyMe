# SWEObeyMe Anti-Patterns Guide

Common mistakes AI makes and how to avoid them.

## Overview

This document outlines common anti-patterns and mistakes that AI models make when using SWEObeyMe tools. Avoiding these anti-patterns will improve code quality, reduce errors, and maintain surgical compliance.

## Anti-Pattern 1: Edit Without Search

**Description:** Making edits without first searching for existing code or understanding the context.

**Example:**

```
AI: I'll add a new function called getUserData
(Doesn't search for existing getUserData function)
(Creates duplicate function)
```

**Why It's Bad:**

- Creates duplicate code
- Misses existing implementations
- Breaks DRY principle
- Increases technical debt

**How to Avoid:**

```
1. Use search_code_files to find existing code
2. Use get_file_context to understand context
3. Use analyze_change_impact to check ripple effects
4. Only then make changes
```

## Anti-Pattern 2: Write Without Validation

**Description:** Writing files without validating syntax, imports, or surgical compliance.

**Example:**

```
AI: I'll write the new file
(Doesn't check line count)
(Doesn't check for forbidden patterns)
(Write rejected)
```

**Why It's Bad:**

- High rejection rate
- Wastes time on rewrites
- Broken code gets written
- Frustrates users

**How to Avoid:**

```
1. Use obey_surgical_plan to check line count
2. Use verify_syntax to check syntax
3. Use verify_imports to check dependencies
4. Use preflight_change for comprehensive validation
5. Only then use write_file
```

## Anti-Pattern 3: Refactor Without Context

**Description:** Refactoring code without understanding dependencies or usage.

**Example:**

```
AI: I'll rename this function from getUser to fetchUser
(Doesn't check where it's used)
(Breaks all callers)
```

**Why It's Bad:**

- Breaking changes
- Incomplete refactoring
- Regressions
- Difficult to debug

**How to Avoid:**

```
1. Use get_file_context to understand dependencies
2. Use analyze_change_impact to check ripple effects
3. Use get_symbol_references to find all usages
4. Update all usages
5. Use run_related_tests to verify
```

## Anti-Pattern 4: Ignore Line Count Limits

**Description:** Attempting to write files that exceed the 700-line limit.

**Example:**

```
AI: I'll add all these functions to index.js
(File becomes 850 lines)
(Write rejected)
```

**Why It's Bad:**

- Write rejected
- File bloat
- Technical debt
- Maintenance issues

**How to Avoid:**

```
1. Use obey_surgical_plan before writing
2. If rejected, use refactor_move_block to split
3. Or use extract_to_new_file to create modules
4. Keep files under 700 lines
```

## Anti-Pattern 5: Skip Testing

**Description:** Making changes without running tests to verify.

**Example:**

```
AI: I've fixed the bug
(Doesn't run tests)
(Bug still exists or introduced new bugs)
```

**Why It's Bad:**

- Regressions
- Broken code in production
- Difficult to debug later
- Poor quality

**How to Avoid:**

```
1. Use run_related_tests after changes
2. If tests fail, fix code
3. Re-run tests
4. Only consider complete when tests pass
```

## Anti-Pattern 6: Ignore Forbidden Patterns

**Description:** Including forbidden patterns like console.log, TODO, debugger.

**Example:**

```
AI: I'll add a console.log for debugging
(Write rejected due to forbidden pattern)
```

**Why It's Bad:**

- Write rejected
- Debug code in production
- Poor code quality
- Security issues

**How to Avoid:**

```
1. Remove all console.log statements
2. Remove all TODO comments
3. Remove all debugger statements
4. Remove all eval() calls
5. Use enforce_surgical_rules to check
```

## Anti-Pattern 7: Invent Files

**Description:** Assuming files exist or inventing file paths without verification.

**Example:**

```
AI: I'll edit the config file at ./config/settings.json
(File doesn't exist)
(Operation fails)
```

**Why It's Bad:**

- Operations fail
- Wastes time
- Frustrating for users
- Breaks trust

**How to Avoid:**

```
1. Use list_directory to check if file exists
2. Use find_code_files to search for files
3. Only operate on existing files
4. Use confirm_dangerous_operation for destructive actions
```

## Anti-Pattern 8: Ignore Project Conventions

**Description:** Not following project naming conventions or folder structure.

**Example:**

```
AI: I'll create a new file called my_new_file.js
(Project uses PascalCase for files)
(Convention violation)
```

**Why It's Bad:**

- Inconsistent code
- Confusing for developers
- Violates project standards
- Harder to maintain

**How to Avoid:**

```
1. Use analyze_project_conventions to detect patterns
2. Follow naming conventions (camelCase, PascalCase, etc.)
3. Follow folder structure conventions
4. Use validate_naming_conventions to verify
```

## Anti-Pattern 9: Massive Refactor in One Step

**Description:** Attempting to refactor large codebases in a single operation.

**Example:**

```
AI: I'll refactor the entire src directory
(Attempts massive change)
(Fails due to complexity)
```

**Why It's Bad:**

- High failure rate
- Difficult to debug
- Hard to rollback
- Risky

**How to Avoid:**

```
1. Use initiate_surgical_workflow for complex tasks
2. Break into small steps
3. Use get_workflow_status to track progress
4. Test each step
5. Incremental refactoring
```

## Anti-Pattern 10: Ignore Error Messages

**Description:** Not reading or understanding error messages and trying the same approach repeatedly.

**Example:**

```
AI: Write rejected for line count
(Tries to write again with same content)
(Rejected again)
```

**Why It's Bad:**

- Infinite loops
- Wastes time
- Frustrating
- No progress

**How to Avoid:**

```
1. Use explain_rejection to understand why
2. Use suggest_alternatives to find alternatives
3. Adjust approach based on feedback
4. After 3 failures, use request_surgical_recovery
```

## Anti-Pattern 11: Skip Documentation

**Description:** Not adding documentation to functions, classes, or complex code.

**Example:**

```
AI: I'll add this complex function
(No JSDoc comments)
(No inline comments)
(Hard to understand)
```

**Why It's Bad:**

- Poor maintainability
- Difficult to understand
- Violates documentation requirements
- Technical debt

**How to Avoid:**

```
1. Add JSDoc comments to all functions/classes
2. Add inline comments for complex logic
3. Use require_documentation to check
4. Use detect_architectural_drift to verify
```

## Anti-Pattern 12: Use Wrong Tools

**Description:** Using the wrong tool for the task or not using SWEObeyMe tools at all.

**Example:**

```
AI: I'll use the built-in file editor
(Should use write_file)
(Bypasses surgical rules)
```

**Why It's Bad:**

- Bypasses surgical enforcement
- No validation
- No backups
- Breaks governance

**How to Avoid:**

```
1. Always use read_file for reading
2. Always use write_file for writing
3. Always use obey_surgical_plan before writing
4. Use DECISION_TREE.md to select tools
```

## Anti-Pattern 13: Ignore C# Errors

**Description:** Not checking or addressing C# errors in C# projects.

**Example:**

```
AI: I'll fix the bug in Program.cs
(Doesn't check C# errors)
(Introduces new errors)
```

**Why It's Bad:**

- Compilation errors
- Broken code
- Poor quality
- Frustrating

**How to Avoid:**

```
1. Use get_csharp_errors_for_file before changes
2. Fix existing errors
3. Use get_csharp_errors_for_file after changes
4. Ensure no new errors introduced
```

## Anti-Pattern 14: Duplicate Code

**Description:** Creating duplicate implementations instead of reusing existing code.

**Example:**

```
AI: I'll create a new utility function
(Function already exists in utils.js)
(Duplicate code)
```

**Why It's Bad:**

- Violates DRY principle
- Maintenance burden
- Inconsistent behavior
- Technical debt

**How to Avoid:**

```
1. Use search_code_files to find existing code
2. Reuse existing implementations
3. Only create new code when necessary
4. Follow DRY principle
```

## Anti-Pattern 15: Hard-Code Values

**Description:** Using magic numbers or hard-coded values instead of constants.

**Example:**

```
AI: I'll add this timeout value: 5000
(Should be a constant)
(Magic number)
```

**Why It's Bad:**

- Difficult to maintain
- No context for values
- Hard to change
- Poor quality

**How to Avoid:**

```
1. Extract constants for magic numbers
2. Use descriptive names
3. Define constants at module level
4. Use check_for_anti_patterns to detect
```

## Anti-Pattern 16: Deep Nesting

**Description:** Creating deeply nested code that's hard to read and maintain.

**Example:**

```
AI: I'll add this logic
(Nested 8 levels deep)
(Hard to read)
```

**Why It's Bad:**

- Difficult to read
- Hard to maintain
- Cognitive load
- Poor quality

**How to Avoid:**

```
1. Extract nested logic to functions
2. Use early returns
3. Use guard clauses
4. Use check_for_anti_patterns to detect
5. Use analyze_file_health to check
```

## Anti-Pattern 17: Empty Catch Blocks

**Description:** Using empty catch blocks that swallow errors without handling.

**Example:**

```
AI: I'll add error handling
try { ... } catch (e) {}
(Swallows errors)
```

**Why It's Bad:**

- Swallows errors
- Hard to debug
- Poor error handling
- Security risk

**How to Avoid:**

```
1. Always handle errors in catch blocks
2. Log errors appropriately
3. Consider re-throwing
4. Use check_for_anti_patterns to detect
```

## Anti-Pattern 18: God Functions

**Description:** Creating functions that do too many things.

**Example:**

```
AI: I'll create a function that handles everything
(Function does 10 different things)
(Hard to test, hard to maintain)
```

**Why It's Bad:**

- Violates single responsibility
- Hard to test
- Hard to maintain
- Poor quality

**How to Avoid:**

```
1. Split functions by responsibility
2. Use composition over complexity
3. Follow single responsibility principle
4. Use check_for_anti_patterns to detect
5. Use analyze_file_health to check
```

## Anti-Pattern 19: Circular Dependencies

**Description:** Creating circular import dependencies.

**Example:**

```
AI: I'll import this module
(Creates circular dependency)
(Breaks code)
```

**Why It's Bad:**

- Breaks code
- Runtime errors
- Poor architecture
- Difficult to debug

**How to Avoid:**

```
1. Use verify_imports to check
2. Refactor to break cycles
3. Use dependency injection
4. Review architecture
```

## Anti-Pattern 20: Ignore Backups

**Description:** Not using backups before risky operations.

**Example:**

```
AI: I'll delete this file
(No backup)
(Can't recover if needed)
```

**Why It's Bad:**

- Data loss risk
- No recovery option
- Risky behavior
- Poor practice

**How to Avoid:**

```
1. Use create_backup before risky operations
2. Write_file automatically creates backups
3. Use restore_backup if needed
4. Always have recovery option
```

## Anti-Pattern 21: Skip Import Verification

**Description:** Not verifying that imports exist and are accessible.

**Example:**

```
AI: I'll import this module
(Module doesn't exist)
(Runtime error)
```

**Why It's Bad:**

- Runtime errors
- Broken code
- Poor quality
- Frustrating

**How to Avoid:**

```
1. Use verify_imports before writing
2. Check that imported files exist
3. Check for circular dependencies
4. Fix issues before writing
```

## Anti-Pattern 22: Ignore Project Memory

**Description:** Not using project memory to understand project structure and conventions.

**Example:**

```
AI: I'll create this file
(Doesn't check project structure)
(Puts file in wrong location)
```

**Why It's Bad:**

- Wrong file location
- Violates conventions
- Confusing structure
- Poor organization

**How to Avoid:**

```
1. Use index_project_structure to build memory
2. Use analyze_project_conventions to detect patterns
3. Use get_project_memory_summary to check state
4. Follow project structure
```

## Anti-Pattern 23: Use eval() or Similar

**Description:** Using eval() or similar dangerous functions.

**Example:**

```
AI: I'll use eval() to parse this JSON
(Dangerous)
(Security risk)
```

**Why It's Bad:**

- Security risk
- Code injection
- Poor performance
- Forbidden pattern

**How to Avoid:**

```
1. Never use eval()
2. Use JSON.parse() for JSON
3. Use proper parsers
4. Use enforce_surgical_rules to check
```

## Anti-Pattern 24: Infinite Loop on Same Operation

**Description:** Repeatedly trying the same operation that keeps failing.

**Example:**

```
AI: Write file
(Fails)
(Write file again)
(Fails)
(Write file again)
(Fails)
```

**Why It's Bad:**

- Infinite loop
- Wastes time
- No progress
- Frustrating

**How to Avoid:**

```
1. Use check_for_repetitive_patterns to detect
2. Use explain_rejection to understand why
3. Use suggest_alternatives to find alternatives
4. After 3 failures, use request_surgical_recovery
5. Try different approach
```

## Anti-Pattern 25: Assume File Permissions

**Description:** Assuming you have permission to write or delete files without checking.

**Example:**

```
AI: I'll delete this file
(No permission check)
(Permission denied)
```

**Why It's Bad:**

- Operations fail
- Wastes time
- Frustrating
- Poor error handling

**How to Avoid:**

```
1. Use confirm_dangerous_operation for destructive actions
2. Check permissions if possible
3. Handle permission errors gracefully
4. Use suggest_alternatives if fails
```

## Quick Reference

### Most Common Anti-Patterns

| Anti-Pattern               | Severity | How to Avoid                    |
| -------------------------- | -------- | ------------------------------- |
| Edit Without Search        | High     | Use search_code_files first     |
| Write Without Validation   | High     | Use preflight_change            |
| Refactor Without Context   | High     | Use get_file_context            |
| Ignore Line Count Limits   | High     | Use obey_surgical_plan          |
| Skip Testing               | High     | Use run_related_tests           |
| Ignore Forbidden Patterns  | High     | Remove console.log, TODO, etc.  |
| Invent Files               | High     | Use list_directory to verify    |
| Ignore Project Conventions | Medium   | Use analyze_project_conventions |
| Massive Refactor           | High     | Use initiate_surgical_workflow  |
| Ignore Error Messages      | High     | Use explain_rejection           |

## Anti-Pattern Detection Checklist

Before any operation, check:

- [ ] Have I searched for existing code?
- [ ] Have I validated the change?
- [ ] Do I understand the context?
- [ ] Is the file under 700 lines?
- [ ] Have I removed forbidden patterns?
- [ ] Does the file actually exist?
- [ ] Am I following project conventions?
- [ ] Is this a reasonable change size?
- [ ] Have I read error messages?
- [ ] Have I added documentation?
- [ ] Am I using the right tools?
- [ ] Have I checked for C# errors (if C#)?
- [ ] Am I avoiding duplicate code?
- [ ] Are there magic numbers?
- [ ] Is the code too deeply nested?
- [ ] Are catch blocks empty?
- [ ] Is the function doing too much?
- [ ] Are there circular dependencies?
- [ ] Do I have a backup?
- [ ] Are imports verified?
- [ ] Am I using project memory?
- [ ] Am I avoiding eval()?
- [ ] Am I stuck in a loop?
- [ ] Do I have permissions?

## Next Steps

- Review this guide before starting work
- Apply pattern checks to your workflow
- See [COMMON_PATTERNS.md](COMMON_PATTERNS.md) for successful patterns
- See [DECISION_TREE.md](DECISION_TREE.md) for tool selection
- See [README.md](README.md) for complete tool list
