# SWEObeyMe Decision Tree Documentation

Visual guide for tool selection logic.

## Overview

This document provides decision trees to help AI models (and users) select the right SWEObeyMe tool for any given task. Each decision tree starts with a question and guides you through the selection process.

## File Operation Decision Tree

```text
START: What do you want to do with files?
│
├─ Read a file?
│  └─ Use: read_file
│     ├─ Need deeper analysis?
│     │  └─ Use: get_file_context
│     │     ├─ Planning refactoring?
│     │     │  └─ Use: analyze_change_impact
│     │     │     └─ Need symbol references?
│     │     │        └─ Use: get_symbol_references
│     │     └─ Planning to modify?
│     │        └─ Use: obey_surgical_plan
│     └─ Just reading content?
│        └─ Done
│
├─ Write/create a file?
│  ├─ Trivial change (typo fix)?
│  │  └─ Use: obey_surgical_plan → write_file
│  │
│  ├─ Significant change?
│  │  └─ Use: preflight_change
│  │     ├─ Validation passes?
│  │     │  └─ Use: write_file
│  │     │     └─ Use: run_related_tests
│  │     │     └─ Use: generate_change_summary
│  │     └─ Validation fails?
│  │        └─ Address issues → Retry preflight_change
│  │
│  ├─ File too large (>700 lines)?
│  │  └─ Use: refactor_move_block OR extract_to_new_file
│  │     └─ Then retry write operation
│  │
│  └─ Need validation before write?
│     └─ Use: validate_change_before_apply
│        ├─ Passes?
│        │  └─ Use: write_file
│        └─ Fails?
│           └─ Fix issues → Retry
│
├─ Search for code?
│  ├─ Simple text search?
│  │  └─ Use: search_code_files
│  │
│  ├─ Regex pattern search?
│  │  └─ Use: search_code_pattern
│  │
│  ├─ Find files by language?
│  │  └─ Use: find_code_files
│  │
│  └─ List directory?
│     └─ Use: list_directory
│
└─ Other file operation?
   └─ See: Specialized Tools Decision Tree
```

## Refactoring Decision Tree

```text
START: What type of refactoring?
│
├─ Rename function/class?
│  └─ Use: get_file_context
│     └─ Use: analyze_change_impact
│        └─ Use: get_symbol_references
│           └─ Use: obey_surgical_plan
│              └─ Use: write_file
│                 └─ Use: run_related_tests
│
├─ Extract code to new file?
│  └─ Use: extract_to_new_file
│     └─ Use: verify_imports
│        └─ Use: write_file
│
├─ Move code between files?
│  └─ Use: refactor_move_block
│     └─ Use: verify_imports
│        └─ Use: write_file
│
├─ Split large file?
│  └─ Use: get_file_context
│     └─ Use: analyze_file_health
│        └─ Use: refactor_move_block (repeat as needed)
│           └─ Use: verify_imports
│              └─ Use: write_file
│
└─ Complex multi-step refactoring?
   └─ Use: initiate_surgical_workflow
      └─ Use: get_workflow_status (track progress)
```

## Validation Decision Tree

```text
START: What needs validation?
│
├─ Code syntax?
│  └─ Use: verify_syntax
│     ├─ JavaScript/TypeScript?
│     │  └─ Use: verify_syntax (language: javascript/typescript)
│     └─ Other language?
│        └─ Use: language-specific tools
│
├─ Code quality/smells?
│  └─ Use: check_for_anti_patterns
│     ├─ God functions?
│     │  └─ Extract functions
│     ├─ Deep nesting?
│     │  └─ Refactor to reduce nesting
│     ├─ Magic numbers?
│     │  └─ Extract constants
│     └─ Other issues?
│        └─ Address accordingly
│
├─ Naming conventions?
│  └─ Use: validate_naming_conventions
│     ├─ Violations found?
│     │  └─ Fix naming
│     └─ Clean?
│        └─ Continue
│
├─ Imports?
│  └─ Use: verify_imports
│     ├─ Missing imports?
│     │  └─ Add imports
│     ├─ Circular dependencies?
│     │  └─ Refactor to break cycles
│     └─ Clean?
│        └─ Continue
│
├─ Documentation?
│  └─ Use: require_documentation
│     ├─ Missing docs?
│     │  └─ Add documentation
│     └─ Clean?
│        └─ Continue
│
├─ Test coverage?
│  └─ Use: check_test_coverage
│     ├─ Low coverage?
│     │  └─ Add tests
│     └─ Good coverage?
│        └─ Continue
│
└─ Comprehensive validation?
   └─ Use: preflight_change
      ├─ All checks pass?
      │  └─ Proceed with changes
      └─ Issues found?
         └─ Fix issues → Retry
```

## C# Development Decision Tree

```text
START: Working with C# code?
│
├─ Need to check errors?
│  ├─ Check entire workspace?
│  │  └─ Use: get_csharp_errors
│  │     ├─ Errors found?
│  │     │  └─ Fix errors
│  │     └─ Clean?
│  │        └─ Continue
│  │
│  └─ Check specific file?
│     └─ Use: get_csharp_errors_for_file
│        ├─ Errors found?
│        │  └─ Fix errors
│        └─ Clean?
│           └─ Continue
│
├─ Need to adjust C# Bridge settings?
│  ├─ Enable/disable detector?
│  │  └─ Use: toggle_csharp_error_type
│  │
│  ├─ Update configuration?
│  │  └─ Use: update_csharp_config
│  │
│  └─ Toggle "Keep AI Informed"?
│     └─ Use: set_csharp_ai_informed
│
└─ Need C# error context?
   └─ Use: get_integrity_report
      └─ Review architectural impact
```

## Project Analysis Decision Tree

```text
START: What project analysis needed?
│
├─ Explore project structure?
│  ├─ List directory?
│  │  └─ Use: list_directory
│  │
│  ├─ Find code files?
│  │  └─ Use: find_code_files
│  │
│  └─ Get language stats?
│     └─ Use: get_code_language_stats
│
├─ Understand project conventions?
│  └─ Use: analyze_project_conventions
│     ├─ Naming patterns?
│     │  └─ Document for reference
│     ├─ Folder structure?
│     │  └─ Document for reference
│     └─ Other conventions?
│        └─ Document for reference
│
├─ Index project structure?
│  └─ Use: index_project_structure
│     ├─ Full index?
│     │  └─ Use without excludeDirs
│     └─ Selective index?
│        └─ Use with excludeDirs
│
├─ Check project memory?
│  └─ Use: get_project_memory_summary
│     ├─ Need more detail?
│     │  └─ Use: get_project_state
│     └─ Summary enough?
│        └─ Continue
│
└─ Search for specific code?
   ├─ Text search?
   │  └─ Use: search_code_files
   ├─ Pattern search?
   │  └─ Use: search_code_pattern
   └─ Symbol search?
      └─ Use: get_symbol_references
```

## Error Recovery Decision Tree

```text
START: Encountered an error?
│
├─ Write operation rejected?
│  ├─ Line count error?
│  │  └─ Use: refactor_move_block OR extract_to_new_file
│  │     └─ Retry write
│  │
│  ├─ Forbidden pattern?
│  │  └─ Remove pattern → Retry write
│  │
│  ├─ Syntax error?
│  │  └─ Use: verify_syntax
│  │     └─ Fix syntax → Retry
│  │
│  ├─ Import error?
│  │  └─ Use: verify_imports
│  │     └─ Fix imports → Retry
│  │
│  └─ Other error?
│     └─ Use: explain_rejection
│        └─ Use: suggest_alternatives
│           └─ Try alternative
│
├─ Tool failure?
│  ├─ Need guidance?
│  │  └─ Use: get_operation_guidance
│  │
│  ├─ Need alternatives?
│  │  └─ Use: suggest_alternatives
│  │
│  └─ Need recovery?
│     └─ Use: request_surgical_recovery
│
├─ Repeated failures (3+)?
│  └─ Use: request_surgical_recovery
│     └─ Start fresh
│
├─ Stuck in loop?
│  └─ Use: check_for_repetitive_patterns
│     ├─ Loop detected?
│     │  └─ Break pattern → Try different approach
│     └─ No loop?
│        └─ Continue debugging
│
└─ Need to revert changes?
   └─ Use: restore_backup
      ├─ Need specific backup?
      │  └─ Specify backup_index
      └─ Need latest?
         └─ Use backup_index: 0
```

## Configuration Decision Tree

```text
START: What configuration change?
│
├─ View current config?
│  └─ Use: get_config
│
├─ Change a setting?
│  └─ Use: set_config
│     ├─ Line count limit?
│     │  └─ Set: maxLines
│     ├─ Forbidden patterns?
│     │  └─ Set: forbiddenPatterns
│     ├─ Backup retention?
│     │  └─ Set: maxBackupsPerFile
│     ├─ Auto-correction?
│     │  └─ Set: enableAutoCorrection
│     ├─ Loop detection?
│     │  └─ Set: enableLoopDetection
│     ├─ Debug logging?
│     │  └─ Set: debugLogs
│     ├─ Documentation ratio?
│     │  └─ Set: minDocumentationRatio
│     ├─ Workflow orchestration?
│     │  └─ Set: enableWorkflowOrchestration
│     ├─ Session memory?
│     │  └─ Set: enableSessionMemory
│     ├─ Oracle?
│     │  └─ Set: enableOracle
│     └─ Other?
│        └─ See: get_config_schema
│
├─ Reset to defaults?
│  └─ Use: reset_config
│
├─ View config schema?
│  └─ Use: get_config_schema
│
└─ C# Bridge config?
   ├─ Update settings?
   │  └─ Use: update_csharp_config
   ├─ Toggle detector?
   │  └─ Use: toggle_csharp_error_type
   └─ Toggle "Keep AI Informed"?
      └─ Use: set_csharp_ai_informed
```

## Documentation Decision Tree

```text
START: What documentation task?
│
├─ Check documentation coverage?
│  ├─ Check specific file?
│  │  └─ Use: require_documentation
│  │
│  └─ Check architectural drift?
│     └─ Use: detect_architectural_drift
│
├─ Add documentation?
│  ├─ Function/class comments?
│  │  └─ Add JSDoc/Doc comments
│  │
│  ├─ Inline comments?
│  │  └─ Add explanatory comments
│  │
│  └─ File-level docs?
│     └─ Add file header
│
├─ Search documentation?
│  ├─ Llama.cpp docs?
│  │  └─ Use: search_llama_docs
│  │
│  ├─ Math docs?
│  │  └─ Use: search_math_docs
│  │
│  └─ List available docs?
│     └─ Use: list_llama_docs OR list_math_docs
│
└─ Need guidance?
   └─ Use: get_architectural_directive
```

## Testing Decision Tree

```text
START: Testing task?
│
├─ Run tests?
│  ├─ For specific file?
│  │  └─ Use: run_related_tests
│  │     ├─ Tests pass?
│  │     │  └─ Continue
│  │     └─ Tests fail?
│  │        └─ Fix code → Retry
│  │
│  └─ Check coverage?
│     └─ Use: check_test_coverage
│        ├─ Low coverage?
│        │  └─ Add tests
│        └─ Good coverage?
│           └─ Continue
│
├─ Test validation?
│  └─ Use: validate_change_before_apply
│     ├─ Includes test check?
│     │  └─ Review test results
│     └─ No test check?
│        └─ Use: run_related_tests separately
│
└─ Need test guidance?
   └─ Use: get_operation_guidance (operation: "run_related_tests")
```

## Specialized Tools Decision Tree

```text
START: Specialized task?
│
├─ Need backup?
│  ├─ Manual backup?
│  │  └─ Use: create_backup
│  ├─ Restore backup?
│  │  └─ Use: restore_backup
│  └─ Check history?
│     └─ Use: get_historical_context
│
├─ Need diff?
│  ├─ Compare changes?
│  │  └─ Use: diff_changes
│  └─ View changes?
│     └─ Use: generate_change_summary
│
├─ Need session info?
│  ├─ Current session?
│  │  └─ Use: get_session_context
│  ├─ Record decision?
│  │  └─ Use: record_decision
│  └─ Check workflow?
│     └─ Use: get_workflow_status
│
├─ Need guidance?
│  ├─ Surgical wisdom?
│  │  └─ Use: query_the_oracle
│  ├─ Operation guidance?
│  │  └─ Use: get_operation_guidance
│  ├─ Architectural directive?
│  │  └─ Use: get_architectural_directive
│  └─ Explain rejection?
│     └─ Use: explain_rejection
│
├─ Complex workflow?
│  └─ Use: initiate_surgical_workflow
│     └─ Track with: get_workflow_status
│
├─ Dangerous operation?
│  └─ Use: confirm_dangerous_operation
│     ├─ Approved?
│     │  └─ Proceed
│     └─ Rejected?
│        └─ Abort or modify
│
└─ Need recovery?
   ├─ Repeated failures?
   │  └─ Use: request_surgical_recovery
   └─ Stuck?
      └─ Use: check_for_repetitive_patterns
```

## Implementation Decision Tree

```
START: Should I implement functionality or ask the user?
│
├─ Requirements are clear and unambiguous?
│  ├─ Yes → IMPLEMENT DIRECTLY
│  │  ├─ Break into smaller, testable increments
│  │  ├─ Implement each increment completely
│  │  ├─ Inform user after each milestone
│  │  └─ Continue until complete
│  │
│  └─ No → ASK USER
│     └─ Clarify requirements before implementing
│
├─ Standard patterns exist for this task?
│  ├─ Yes → IMPLEMENT DIRECTLY
│  │  ├─ Apply standard patterns
│  │  ├─ Implement working functionality
│  │  └─ Inform user of completion
│  │
│  └─ No → ASK USER
│     └─ Discuss approach with user first
│
├─ All necessary information available?
│  ├─ Yes → IMPLEMENT DIRECTLY
│  │  ├─ Implement functionality
│  │  ├─ Test thoroughly
│  │  └─ Inform user of completion
│  │
│  └─ No → ASK USER
│     └─ Request missing information
│
├─ Missing credentials, API keys, or permissions?
│  ├─ Yes → ASK USER
│  │  └─ Cannot proceed without these
│  │
│  └─ No → IMPLEMENT DIRECTLY
│
├─ Multiple valid approaches exist?
│  ├─ Yes → ASK USER
│  │  └─ Get preference on approach
│  │
│  └─ No → IMPLEMENT DIRECTLY
│
├─ Making destructive or irreversible change?
│  ├─ Yes → ASK USER
│  │  └─ Get confirmation before proceeding
│  │
│  └─ No → IMPLEMENT DIRECTLY
│
├─ Task is complex but can be broken down?
│  ├─ Yes → IMPLEMENT DIRECTLY
│  │  ├─ Break into smaller tasks
│  │  ├─ Implement each task
│  │  ├─ Test each increment
│  │  └─ Inform user of progress
│  │
│  └─ No → ASK USER
│     └─ Discuss complexity with user
│
└─ Truly blocked and cannot proceed?
   └─ ASK USER
      └─ Explain the blockage and request help
```

**Key Principles:**

- Implement working code, not stubs or placeholders
- Break complex tasks into smaller, testable increments
- Inform user after each significant milestone
- Only ask when genuinely blocked
- Never create TODO/FIXME in production code
- Deliver tangible progress, not promises

## Quick Reference

### Most Common Workflows

#### 1. Simple File Edit

```text
read_file → obey_surgical_plan → write_file → run_related_tests
```

#### 2. Refactoring

```text
get_file_context → analyze_change_impact → obey_surgical_plan → write_file → run_related_tests
```

#### 3. New File Creation

```text
obey_surgical_plan → write_file → verify_imports → run_related_tests
```

#### 4. Large File Split

```text
get_file_context → refactor_move_block → verify_imports → write_file (repeat)
```

#### 5. Error Fixing**

```
get_csharp_errors_for_file → fix errors → verify_syntax → write_file
```

### Tool Priority Order

1. **Critical (Priority 100)**
   - read_file
   - write_file
   - obey_surgical_plan
   - preflight_change

2. **High (Priority 80-95)**
   - get_file_context
   - analyze_change_impact

3. **Medium (Priority 50)**
   - obey_me_status

4. **Standard (Priority 10)**
   - All other tools

## Next Steps

- Use decision trees to guide tool selection
- See [COMMON_PATTERNS.md](COMMON_PATTERNS.md) for successful patterns
- See [ANTI_PATTERNS.md](ANTI_PATTERNS.md) for common mistakes
- See [README.md](README.md) for complete tool list
