# Codebase Orientation Tools - Usage Patterns

## Overview

The codebase orientation tools help AI agents understand project structure without overwhelming context. They provide structural understanding (module boundaries, entry points, critical dependencies) rather than implementation details.

## Available Tools

### 1. codebase_orientation

**Purpose**: Generate architecture map of a codebase

**When to use**:

- First time exploring a new codebase

- Need to understand overall project structure

- Identifying where to start work

- Understanding module organization

**Input**:

```json
{
  "project_root": "/path/to/project" // optional, defaults to CWD
}
```

**Output**:

```json
{
  "success": true,
  "project_root": "/path/to/project",
  "project_type": ["javascript", "typescript"],
  "entry_points": [{ "file": "index.js", "type": "main" }],
  "modules": [
    {
      "path": "lib",
      "type": "utils",
      "inferredResponsibility": "utils layer - contains utils related code"
    }
  ],
  "directory_structure": ["├── lib/", "├── src/", "└── tests/"],
  "summary": {
    "total_modules": 36,
    "total_entry_points": 1,
    "detected_languages": "javascript, typescript"
  }
}
```

**Example usage**:

```text
AI: "What's the architecture of this codebase?"
→ codebase_orientation tool
→ Returns module structure, entry points, framework
```

### 2. dependency_analysis

**Purpose**: Analyze codebase dependencies and build dependency graph

**When to use**:

- Planning refactoring
- Checking impact of changes
- Understanding module relationships
- Identifying hub files (files imported by many modules)

**Input**:

```json
{
  "project_root": "/path/to/project" // optional, defaults to CWD
}
```

**Output**:

```json
{
  "success": true,
  "project_root": "/path/to/project",
  "total_files_analyzed": 464,
  "hub_files": [
    { "file": "path", "importCount": 271 },
    { "file": "fs", "importCount": 204 }
  ],
  "external_dependencies": ["url", "path", "fs"],
  "summary": {
    "total_dependencies": 464,
    "total_external_deps": 50,
    "critical_hub_count": 20
  }
}
```

**Example usage**:

```text
AI: "I need to change AuthService"
→ dependency_analysis tool
→ Returns: AuthService is a hub, imported by 47 modules
→ AI knows to check those modules
```

### 3. entry_point_mapper

**Purpose**: Map entry points and document API contracts

**When to use**:

- Understanding how to integrate with a module
- Finding API documentation
- Checking interface contracts
- Understanding initialization sequences

**Input**:

```json
{
  "project_root": "/path/to/project" // optional, defaults to CWD
}
```

**Output**:

```json
{
  "success": true,
  "project_root": "/path/to/project",
  "entry_points": [
    {
      "file": "index.js",
      "type": "main",
      "functions": ["initialize", "start"],
      "exports": ["toolHandlers", "getToolDefinitions"],
      "line_count": 984
    }
  ],
  "summary": {
    "total_entry_points": 1,
    "total_functions": 2,
    "total_exports": 2
  }
}
```

**Example usage**:

```text
AI: "What functions does the main entry point export?"
→ entry_point_mapper tool
→ Returns: exports, functions, line count
```

### 4. codebase_explore

**Purpose**: On-demand codebase exploration guidance

**When to use**:

- Starting a new feature
- Unsure where to add code
- Needing guidance on codebase navigation
- Asking "where should I..." questions

**Input**:

```json
{
  "query": "Where should I add a new API endpoint?",
  "project_root": "/path/to/project" // optional, defaults to CWD
}
```

**Output**:

```json
{
  "success": true,
  "query": "Where should I add a new API endpoint?",
  "guidance": {
    "entry_points": [],
    "modules_to_consider": [
      { "path": "src/api", "type": "api", "inferredResponsibility": "api layer" }
    ],
    "critical_dependencies": [{ "file": "path", "importCount": 271 }],
    "suggested_files": []
  },
  "architecture_summary": {
    "project_type": ["javascript"],
    "total_modules": 36,
    "hub_files": 20
  }
}
```

**Example usage**:

```text
AI: "Where should I add this new feature?"
→ codebase_explore tool
→ Returns: Add to /src/domain, depends on /src/common
→ AI has clear path, doesn't get lost
```

## Common Workflows

### Workflow 1: Initial Codebase Exploration

When first working with a new codebase:

1. **Start with codebase_orientation**
   - Understand overall structure
   - Identify entry points
   - Detect project type and framework

2. **Follow with dependency_analysis**
   - Identify hub files (critical dependencies)
   - Understand module relationships
   - Know what to be careful with

3. **Use entry_point_mapper**
   - Understand API contracts
   - Know what functions are available
   - Understand initialization sequence

### Workflow 2: Planning a Change

When planning to modify existing code:

1. **Use dependency_analysis**
   - Check if file is a hub file
   - Identify what depends on it
   - Understand impact scope

2. **Use codebase_explore**
   - Ask "what depends on X?"
   - Get guidance on affected modules
   - Understand ripple effects

3. **Make changes with awareness**
   - Use read_file for details
   - Check dependent modules
   - Test thoroughly

### Workflow 3: Adding a New Feature

When adding new functionality:

1. **Use codebase_explore**
   - Ask "where should I add X?"
   - Get module suggestions
   - Understand dependencies

2. **Use codebase_orientation**
   - Confirm module structure
   - Verify entry points
   - Check framework patterns

3. **Use dependency_analysis**
   - Check hub files in target module
   - Understand integration points
   - Plan dependencies

## Best Practices

1. **Start with structure, not details**
   - Use codebase_orientation first to understand the big picture
   - Don't jump into reading files until you know where you are

2. **Check dependencies before changes**
   - Always use dependency_analysis before modifying hub files
   - Understand what might break before you break it

3. **Ask guided questions**
   - Use codebase_explore for "where do I..." questions
   - It provides structured guidance, not random file suggestions

4. **Don't rely solely on these tools**
   - These provide structure, not implementation details
   - Use read_file for actual code content
   - Use Grep for specific pattern searches

5. **Combine with existing SWEObeyMe tools**
   - Use project_context for current project state
   - Use project_rules for architectural constraints
   - Use docs_lookup for documentation

## Integration with SWEObeyMe

This system complements existing SWEObeyMe features:

**Existing System (Dynamic State)**:

- Session state (what you're doing now)

- Project awareness (current project state)

- Task tracking (pending tasks, workflow)

- Memory system (decisions, patterns, errors, architecture)

**New System (Static Structure)**:

- Codebase structure (what the codebase is)

- Module relationships (architectural, not operational)

- Entry point mapping (for initial orientation)

- Critical dependency identification (for impact analysis)

**The Distinction**:

- Existing system = dynamic state (what you're doing now)

- New system = static structure (what the codebase is)

- They serve different purposes and don't duplicate

## Limitations

1. **Regex-based analysis**
   - Dependency analysis uses regex patterns

   - May have false positives in complex code

   - Not a replacement for AST parsing

2. **Heuristic module detection**
   - Module types inferred from directory names

   - May not match actual architecture

   - Use as guidance, not absolute truth

3. **No semantic understanding**
   - Tools analyze structure, not meaning

   - Can't tell you "what this code does"

   - Use read_file for semantic understanding

4. **Static analysis only**
   - Doesn't track runtime behavior

   - Doesn't understand dynamic imports

   - Use with runtime tools for complete picture

## Troubleshooting

**Tool returns no modules**:

- Check project_root parameter

- Verify directory structure exists

- Ensure code files are present

**Dependency analysis shows false positives**:

- Regex may match strings/comments

- Filter results manually

- Use as rough guidance, not exact counts

**Entry point mapper finds no functions**:

- Regex patterns may not match code style

- Different function declaration patterns

- Use Grep to find specific functions

**codebase_explore gives irrelevant suggestions**:

- Query may be too vague

- Try more specific questions

- Combine with other tools for better results
