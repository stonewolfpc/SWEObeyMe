# Implementation Knowledge System - Usage Guide

## Overview

The Implementation Knowledge System extends the existing project memory system to track experimental attempts, assumptions, working patterns, context annotations, and dependency impacts. This helps AI agents avoid repeating mistakes and understand non-standard patterns in complex projects.

## Key Concepts

### Implementation Knowledge vs Architectural Knowledge

#### Architectural Knowledge (existing)

Decisions, patterns, architecture - static design choices

#### Implementation Knowledge (new)

Experimental attempts, validation references, non-standard patterns - dynamic learning from what works/doesn't work

## Extended Fields

### Extended `recordError`

- `outcome`: SUCCESS/FAILURE/PARTIAL - tracks attempt results beyond just errors
- `validationReference`: External validation (e.g., "works in LM Studio")
- `relatedAttemptId`: Link to previous attempts for chaining

### Extended `recordPattern`

- `overrideReason`: Why this pattern overrides standard approach
- `whenToUse`: When to apply this pattern
- `isNonStandard`: Boolean flag for non-standard patterns

### Extended `recordDecision`

- `assumptionStatus`: ASSUMED/VALIDATED/INVALIDATED
- `validationEvidence`: Proof or disproof of assumption

### New Methods

**`recordContextAnnotation(filePath, annotationType, notes, relatedAttemptId)`**

- Tags files with context flags
- Types: NON-STANDARD, REQUIRES_SPECIAL_HANDLING, EXPERIMENTAL, STABLE
- Helps AI know when to be careful

**`recordDependencyImpact(sourceFile, affectedFiles, impactChain, mitigationSteps)`**

- Records cross-module impact chains
- Helps AI understand ripple effects before changes

## Query Tool

**`query_implementation_knowledge`** (hidden AI-query-only)

Input:

- `queryType`: attempts, assumptions, patterns, annotations, impacts, all
- `filters`: { outcome, status, annotationType, isNonStandard }
- `relatedTo`: Filter by file or module

Output:

- Matching entries with context
- Warnings for INVALIDATED assumptions
- Recommendations for NON-STANDARD patterns
- Related entries for cross-reference

## Automatic Recording

The system automatically records implementation knowledge when:

**codebase_explore** runs:

- Records NON-STANDARD annotations for non-standard module types (custom, legacy, experimental, internal)

**dependency_analysis** runs:

- Records dependency impact for hub files (files imported by 3+ modules)
- Provides mitigation steps: "Check dependent modules before modifying"

## Usage Patterns

### Pattern 1: Recording Experimental Attempts

When trying something that might fail:

```javascript
manager.recordError({
  error: 'Attempted to load LNN GGUF with standard tensor alignment',
  outcome: 'FAILURE',
  validationReference: 'Works in LM Studio with custom alignment',
  relatedAttemptId: previousAttemptId,
});
```

### Pattern 2: Validating Assumptions

When making an assumption:

```javascript
manager.recordDecision({
  description: 'GGUF loading follows standard pattern',
  assumptionStatus: 'ASSUMED',
});
```

### Pattern 3: Recording Working Patterns

When finding a pattern that works:

```javascript
manager.recordPattern({
  pattern: 'Custom tensor alignment for LNN GGUF',
  overrideReason: 'Standard alignment fails for LNN models',
  whenToUse: 'Loading LNN models in GGUF format',
  isNonStandard: true,
});
```

### Pattern 4: Annotating Context

When a file needs special handling:

```javascript
manager.recordContextAnnotation(
  'model-loader/lnn-handler.js',
  'REQUIRES_SPECIAL_HANDLING',
  'LNN models need custom tensor alignment, do not use standard GGUF functions'
);
```

### Pattern 5: Tracking Dependencies

When modifying hub files:

```javascript
manager.recordDependencyImpact(
  'lib/tools/handlers.js',
  ['lib/tools/codebase-orientation-handlers.js', 'lib/tools/registry.js'],
  'Hub file imported by 47 modules',
  'Check dependent modules before modifying'
);
```

## Query Examples

### Query all implementation knowledge for a file

```javascript
query_implementation_knowledge({
  queryType: 'all',
  relatedTo: 'model-loader/lnn-handler.js',
});
```

### Query invalidated assumptions

```javascript
query_implementation_knowledge({
  queryType: 'assumptions',
  filters: { status: 'INVALIDATED' },
});
```

### Query non-standard patterns

```javascript
query_implementation_knowledge({
  queryType: 'patterns',
  filters: { isNonStandard: true },
});
```

### Query failed attempts

```javascript
query_implementation_knowledge({
  queryType: 'attempts',
  filters: { outcome: 'FAILURE' },
});
```

## Integration with Existing SWEObeyMe

**No new MCP tools added** - extends existing project memory system:

- Uses existing `getProjectMemoryManager`
- Extends existing `recordError`, `recordPattern`, `recordDecision`
- Adds new methods to existing `ProjectMemoryManager` class
- Single query handler: `query_implementation_knowledge` (hidden AI-query-only)

**Complements, doesn't duplicate:**

- Codebase orientation: This is implementation knowledge, not structure
- Project memory: This is experimental knowledge, not architectural decisions
- Session state: This is persistent knowledge, not current context

## Best Practices

1. **Record validation references**: When something works in external tools (LM Studio, etc.), record it
2. **Track assumption status**: Mark assumptions as VALIDATED/INVALIDATED when discovered
3. **Annotate non-standard files**: Help future AI agents know what needs special handling
4. **Link related attempts**: Use `relatedAttemptId` to chain attempts together
5. **Query before changing**: Check implementation knowledge before modifying hub files or non-standard patterns

## Limitations

- **Silent failures**: Recording failures don't stop execution (non-critical)
- **Manual recording**: Most recording requires explicit calls (automatic only for codebase_explore and dependency_analysis)
- **Project-scoped**: Knowledge is per-project, not global across projects
- **No automatic detection**: Doesn't automatically detect non-standard patterns (manual annotation required)

## When to Use

**Use this system when:**

- Working with non-standard tech (LNN models, custom formats)
- Trying multiple approaches before finding what works
- Making assumptions that might be wrong
- Modifying hub files that affect many modules
- Need to remember "this works but standard doesn't"

**Don't use this system for:**

- Standard architectural decisions (use project memory)
- General code patterns (use existing pattern recording)
- Session-specific context (use session state)
- File history (use file history tracking)
