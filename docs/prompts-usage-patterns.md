# MCP Prompts Usage Patterns

This document describes the usage patterns for MCP Prompts in SWEObeyMe, including when each prompt triggers, its purpose, and how to use it effectively.

## Overview

MCP Prompts are parameterized prompts that intervene when the AI model exhibits behavior that requires architectural guidance. They are triggered automatically based on detected patterns in the model's behavior.

## Available Prompts

### 1. Rule Templates (`rule-templates`)

**Category:** governance  
**Persona:** senior-engineer  
**Governance Level:** strict  
**Triggers:** ambiguity, hesitation, structural-drift, tool-forgetting

**Purpose:** Reasserts enforcement rules and constitution when the model shows signs of forgetting or violating architectural rules.

**When it triggers:**
- Model expresses uncertainty ("I think", "maybe", "not sure")
- Model hesitates to use tools ("should I", "how about")
- Model attempts manual edits or direct file access
- Model forgets to use provided tools
- Model shows signs of structural drift

**Usage:**
- Automatically triggered when ambiguity or hesitation is detected
- Can be manually retrieved via `prompts/get` with arguments:
  - `projectType`: The type of project (node, python, godot, etc.)
  - `integrityScore`: Current surgical integrity score (0-100)
  - `severity`: Severity of the violation (info, warning, error)

**Example:**
```
prompts/get?name=rule-templates&arguments={"projectType":"node","integrityScore":75}
```

---

### 2. Project Awareness (`project-awareness`)

**Category:** project-awareness  
**Persona:** senior-engineer  
**Governance Level:** strict  
**Triggers:** ambiguity, structural-drift

**Purpose:** Detects project type, loads rule sets, and announces architectural boundaries with project-specific guidance.

**When it triggers:**
- Model is unsure about project structure or conventions
- Model shows signs of not understanding the project context
- Model attempts operations that may not fit the project type

**Usage:**
- Automatically triggered when project context is unclear
- Can be manually retrieved via `prompts/get` with arguments:
  - `currentProject`: Current project path
  - `detectedProjectType`: Detected project type
  - `forceRefresh`: Force reload of project context (boolean)

**Example:**
```
prompts/get?name=project-awareness&arguments={"currentProject":"d:/my-project","detectedProjectType":"node"}
```

---

### 3. Context Switching (`context-switching`)

**Category:** project-awareness  
**Persona:** senior-engineer  
**Governance Level:** strict  
**Triggers:** structural-drift

**Purpose:** Enables explicit context switching between projects with state preservation and validation.

**When it triggers:**
- Model attempts to work on a different project without explicit switch
- Model shows signs of confusion between project contexts
- Model needs to preserve state between projects

**Usage:**
- Manually triggered when switching between projects
- Retrieved via `prompts/get` with arguments:
  - `targetProject`: Path to target project
  - `preserveState`: Whether to preserve current state (boolean)
  - `currentProject`: Current project path

**Example:**
```
prompts/get?name=context-switching&arguments={"targetProject":"d:/new-project","preserveState":true,"currentProject":"d:/SWEObeyMe-restored"}
```

---

### 4. Preflight Correction (`preflight-correction`)

**Category:** preflight  
**Persona:** senior-engineer  
**Governance Level:** strict  
**Triggers:** line-limit-violation, monolithic-file-detection, structural-drift, preflight-violation

**Purpose:** Pre-flight validation that checks for rule violations and enforces surgical compliance before file modifications.

**When it triggers:**
- File approaches or exceeds 700-line limit
- Preflight validation fails
- Line limit violations are detected
- Separation of concerns violations are detected

**Usage:**
- Automatically triggered by `preflight_change` handler when violations are detected
- Retrieved via `prompts/get` with arguments:
  - `targetFile`: Path to file being modified
  - `currentLineCount`: Current line count of target file
  - `estimatedAddition`: Estimated lines to be added
  - `proposedChange`: Description of proposed change
  - `violations`: Array of detected violations

**Example:**
```
prompts/get?name=preflight-correction&arguments={"targetFile":"index.js","currentLineCount":680,"estimatedAddition":50}
```

---

### 5. Governor Rewrite (`governor-rewrite`)

**Category:** rewrite  
**Persona:** senior-engineer  
**Governance Level:** strict  
**Triggers:** structural-drift, line-limit-violation, monolithic-file-detection

**Purpose:** Enforces optimal implementations over literal ones, prevents bad patterns, ensures architectural quality with governor-style review.

**When it triggers:**
- Proposed changes violate architectural standards
- Model suggests suboptimal implementations
- Structural drift or line limit violations are detected

**Usage:**
- Automatically triggered when architectural violations are detected
- Retrieved via `prompts/get` with arguments:
  - `targetFile`: Path to file being rewritten
  - `proposedChange`: Description of proposed change
  - `violations`: Array of detected rule violations
  - `betterApproach`: Suggested optimal implementation (optional)

**Example:**
```
prompts/get?name=governor-rewrite&arguments={"targetFile":"utils.js","proposedChange":"Add new function","violations":["SEPARATION_OF_CONCERNS"]}
```

---

## Trigger Detection System

The trigger detection system analyzes the model's behavior and automatically recommends appropriate prompts.

### Available Triggers

1. **ambiguity** (confidence: 0.7)
   - Detects uncertainty in model messages
   - Keywords: "I think", "maybe", "not sure", "could be"

2. **hesitation** (confidence: 0.8)
   - Detects hesitation to take action
   - Keywords: "should I", "would you like", "how about"

3. **structural-drift** (confidence: 0.9)
   - Detects manual edits or direct file access
   - Detects large file additions (> 200 lines)
   - Detects separation of concerns violations

4. **tool-forgetting** (confidence: 0.85)
   - Detects when model forgets to use provided tools
   - Keywords: "I can", "let me just"
   - Detects tool not found errors

5. **line-limit-violation** (confidence: 0.95)
   - Detects files exceeding 700-line limit
   - Detects merge/combine operations

6. **monolithic-file-detection** (confidence: 0.9)
   - Detects creation of large files (> 500 lines added)
   - Keywords: "put everything in", "single file"

7. **preflight-violation** (confidence: 0.95)
   - Detects preflight validation failures
   - Detects line limit and separation of concerns violations

---

## Performance Characteristics

Based on performance benchmarks:

- **Registry initialization:** < 500ms (actual: ~7ms)
- **Single trigger analysis:** < 50ms (actual: < 1ms)
- **5 trigger analyses:** < 200ms (actual: ~1ms)
- **100 prompt retrievals:** < 100ms (actual: < 1ms)
- **Dry-run simulation:** < 100ms (actual: < 1ms)
- **100 template renders:** < 50ms (actual: ~1ms)
- **Memory footprint:** < 10MB (actual: ~0MB)
- **10 concurrent analyses:** < 200ms (actual: < 1ms)
- **Full workflow:** < 500ms (actual: < 1ms)

The prompt system has minimal performance impact and can be used frequently without concern.

---

## Integration with Preflight Handlers

The `preflight_change` handler automatically includes prompt trigger detection as Step 6 of the validation process. When violations are detected, the handler recommends appropriate prompts in the validation report.

**Example output:**
```
=== PREFLIGHT VALIDATION REPORT ===

File: index.js
Changes: Add new function

Validation Steps:
1. get_file_context: PASSED - File context retrieved successfully
2. analyze_change_impact: PASSED - Change impact analyzed
3. verify_imports: PASSED - Imports validated
4. check_test_coverage: PASSED - Test coverage checked
5. dry_run_write_file: PASSED - Dry run successful
6. prompt_trigger_detection: PASSED - Triggers detected, 2 prompts recommended

Overall Status: ✓ PASSED

⚠️ ARCHITECTURAL GUIDANCE:
The following prompts are recommended based on detected triggers:
- preflight-correction
- governor-rewrite

Use prompts/get to retrieve these prompts for architectural guidance.
```

---

## Best Practices

1. **Let triggers work automatically:** The system is designed to detect and recommend prompts automatically. Manual intervention is rarely needed.

2. **Use prompts for guidance, not commands:** Prompts provide architectural guidance and context. They should inform decisions, not dictate them.

3. **Check preflight reports:** Always review the preflight validation report for prompt recommendations before proceeding with file modifications.

4. **Respect trigger thresholds:** The thresholds are tuned to reduce false positives while catching real issues. Trust the system's recommendations.

5. **Use context-switching when changing projects:** Always use the context-switching prompt when working on different projects to ensure proper state management.

6. **Monitor integrity score:** The rule-templates prompt includes the current surgical integrity score. Use this to gauge overall compliance.

---

## Troubleshooting

### Prompt not triggering when expected

1. **Check trigger thresholds:** Ensure the behavior exceeds the detection threshold (e.g., file > 700 lines for line-limit-violation)
2. **Verify trigger is registered:** Use `prompts/list` to see all available prompts and their triggers
3. **Check context:** Ensure the context includes the necessary information for trigger detection

### Too many false positives

1. **Review trigger thresholds:** Adjust thresholds in `lib/prompts/trigger-detection.js` if needed
2. **Check trigger confidence:** Higher confidence triggers (0.9+) are more reliable
3. **Verify context accuracy:** Ensure context data is accurate and complete

### Performance issues

1. **Benchmark current performance:** Run `test-tools/test-prompts-performance.js` to measure actual impact
2. **Check for loops:** Ensure trigger detection isn't being called in a loop
3. **Monitor memory usage:** Use performance test to verify memory footprint is acceptable

---

## Future Enhancements

Potential future improvements:

- **Machine learning triggers:** Use ML to detect more subtle behavioral patterns
- **Custom trigger thresholds:** Allow project-specific threshold configuration
- **Prompt analytics:** Track prompt usage patterns to improve recommendations
- **Adaptive confidence:** Dynamically adjust trigger confidence based on history
- **Prompt chaining:** Automatically sequence related prompts for complex scenarios
