# .NET 10 Analysis Engine Implementation Plan

> **Status**: Enhanced existing JavaScript-based analysis engine instead of .NET 10 implementation (v1.1.4 - 2026-04-05)
>
> **Note**: Due to environment limitations (no internet access for NuGet packages, .NET 10 SDK not installed), the analysis engine was enhanced using the existing JavaScript-based pattern matching system in `lib/csharp-bridge.js` with confidence scoring, deduplication, and cooldown mechanisms. This provides the same noise control benefits without requiring .NET infrastructure.
>
> **Latest Update (v1.1.5 - 2026-04-05)**: Added offline documentation suite for AI development including llama.cpp documentation and mathematical reference library. This supports users building llama.cpp replacements or working with LLM integration.

## Overview

Build high-confidence C# and Java analysis engines for Windsurf X-ray vision using .NET 10, minimizing false positives through multi-layered confidence scoring.

## Architecture

### Core Components

1. **Analysis Engine Service** (.NET 10)
   - Hosts all detectors
   - Manages confidence scoring pipeline
   - Handles deduplication and cooldown
   - Exposes MCP server interface

2. **Detector Pipeline**
   - Roslyn-based C# analysis (Microsoft.CodeAnalysis)
   - Java parser integration (Eclipse JDT or similar)
   - Each detector returns structured findings with confidence scores

3. **Confidence Scoring System**
   - Multi-factor scoring (0-100)
   - Factors: pattern match strength, context analysis, code complexity, historical accuracy
   - Configurable threshold filtering

4. **Noise Control Layer**
   - Signature-based deduplication
   - Time-based cooldown cache
   - Per-rule suppression lists

## Implementation Order

### Phase 1: Foundation (High Priority)

#### 1. Architecture & Roslyn Setup

- Create .NET 10 project structure
- Add Microsoft.CodeAnalysis.\* packages
- Implement file watcher and analysis trigger system
- Build basic MCP server interface (HTTP/JSON-RPC)

#### 2. Confidence Scoring Pipeline

- Design scoring model (weighted factors)
- Implement confidence calculator
- Add threshold filtering
- Create scoring configuration

#### 3. Deduplication System

- Design signature algorithm (hash of detector type + file + line + pattern)
- Implement deduplication cache (in-memory + optional persistence)
- Add grouping logic for similar alerts

#### 4. Alert Cooldown Mechanism

- Implement time-based cache (alert signature + timestamp)
- Add configurable cooldown periods
- Create cooldown expiration logic

### Phase 2: C# Detectors (High Priority)

#### 5. Missing Using Detector

**Approach:**

- Use Roslyn to find object creation of IDisposable types
- Track variable scope and disposal
- Flag if Dispose() not called before scope exit
- Confidence factors: type is known IDisposable, no using statement, no explicit Dispose()

**False Positive Mitigation:**

- Ignore if object is passed to another method
- Check for factory patterns that handle disposal
- Allow user suppression via comments

#### 6. Empty Catch Detector

**Approach:**

- Find catch blocks with no statements or only comments
- Check for logging statements (console.log, logger, etc.)
- Flag silent exception swallowing
- Confidence factors: empty block, no logging, critical exception types

**False Positive Mitigation:**

- Allow intentional suppression comments
- Ignore re-throw patterns
- Check for documentation explaining intentional swallow

#### 7. Deep Nesting Detector

**Approach:**

- Calculate nesting depth (if/for/while/try/switch)
- Cyclomatic complexity analysis
- Flag depth > 5 or complexity > 10
- Confidence factors: actual depth, complexity score, method length

**False Positive Mitigation:**

- Allow configuration of depth thresholds
- Ignore generated code regions
- Provide refactor suggestions (extract method)

#### 8. Async/Await Detector

**Approach:**

- Find async methods without await
- Detect async void (should be async Task)
- Find ConfigureAwait(false) missing in library code
- Confidence factors: method signature, await presence, return type

**False Positive Mitigation:**

- Allow async void for event handlers
- Ignore Task.Run patterns
- Check for intentional fire-and-fork patterns

#### 9. Resource Leaks Detector

**Approach:**

- Track event handler subscriptions (+=)
- Find missing -= unsubscriptions
- Check for IDisposable fields not disposed
- Confidence factors: subscription without unsubscription, IDisposable field without disposal

**False Positive Mitigation:**

- Allow weak event patterns
- Ignore singleton patterns
- Check for disposal in finalizers

#### 10. Math Safety Detector

**Approach:**

- Find division operations without zero checks
- Detect potential integer overflow (unchecked context)
- Check for floating-point precision issues
- Confidence factors: literal division, unchecked operations, large number operations

**False Positive Mitigation:**

- Ignore checked contexts
- Allow user-supplied range assertions
- Check for validation before operations

#### 11. Null Reference Detector

**Approach:**

- Leverage nullable reference types
- Find potential null dereferences
- Detect null-conditional operator misuse
- Confidence factors: nullable type, no null check, dereference operation

**False Positive Mitigation:**

- Respect nullable annotations
- Allow null-forgiving operator (!) with documentation
- Check for guard clauses

### Phase 3: Additional Detectors (Medium Priority)

#### 12. Static Mutation Detector

**Approach:**

- Find static field modifications outside constructors
- Detect thread-unsafe patterns
- Check for missing lock statements
- Confidence factors: static field, modification location, no synchronization

**False Positive Mitigation:**

- Allow immutable patterns
- Ignore thread-local storage
- Check for thread-safe collections

#### 13. String Concatenation Detector

\*\*Approach:

- Find string concatenation in loops
- Detect StringBuilder alternatives not used
- Calculate estimated allocation overhead
- Confidence factors: loop context, concatenation operator, iteration count

**False Positive Mitigation:**

- Allow small fixed-size loops
- Ignore compile-time constants
- Check for interpolated strings

### Phase 4: Noise Control & Integration (High Priority)

#### 14. MCP Server Interface

- Implement JSON-RPC 2.0 server
- Expose analysis endpoints (analyze file, get errors, toggle detectors)
- Add configuration synchronization with VS Code settings
- Implement streaming for large analysis results

#### 15. Integration Testing

- Test full pipeline (file change → analysis → UI update)
- Verify confidence scoring accuracy
- Test deduplication and cooldown
- Validate MCP protocol compliance

### Phase 5: Java Support (Medium Priority)

#### 16. Java Detectors

- Integrate Eclipse JDT or similar parser
- Implement try-with-resources detector
- Add null safety analysis (Optional types)
- Detect resource leaks similar to C#
- Reuse confidence scoring pipeline

## Technical Stack

### .NET 10 Project

```
SweObeyMe.AnalysisEngine/
├── SweObeyMe.AnalysisEngine.csproj
├── Detectors/
│   ├── CSharp/
│   │   ├── MissingUsingDetector.cs
│   │   ├── EmptyCatchDetector.cs
│   │   ├── DeepNestingDetector.cs
│   │   ├── AsyncAwaitDetector.cs
│   │   ├── ResourceLeakDetector.cs
│   │   ├── MathSafetyDetector.cs
│   │   ├── NullReferenceDetector.cs
│   │   ├── StaticMutationDetector.cs
│   │   └── StringConcatenationDetector.cs
│   └── Java/
│       ├── TryWithResourcesDetector.cs
│       └── NullSafetyDetector.cs
├── Scoring/
│   ├── ConfidenceCalculator.cs
│   └── ScoringFactors.cs
├── NoiseControl/
│   ├── DeduplicationService.cs
│   └── CooldownService.cs
├── Mcp/
│   ├── McpServer.cs
│   └── McpHandlers.cs
└── Models/
    ├── AnalysisResult.cs
    ├── DetectorFinding.cs
    └── ScoringConfig.cs
```

### Dependencies

- Microsoft.CodeAnalysis.CSharp
- Microsoft.CodeAnalysis
- Microsoft.Net.Sdk (for .NET 10)
- Eclipse JDT (for Java analysis)
- System.Text.Json (for MCP serialization)

## Confidence Scoring Model

### Factors (0-100 each, weighted average)

1. **Pattern Match Strength** (40%)
   - Exact match: 100
   - Probable match: 70
   - Weak match: 40

2. **Context Analysis** (30%)
   - Clear violation context: 100
   - Ambiguous context: 60
   - Unclear context: 30

3. **Code Complexity** (15%)
   - Simple code: 100
   - Moderate complexity: 70
   - High complexity: 40

4. **Historical Accuracy** (15%)
   - Previously validated: 100
   - New pattern: 70
   - Known false positive pattern: 30

### Thresholds

- **Critical (Red)**: 90-100
- **Warning (Orange)**: 70-89
- **Info (Cyan)**: 50-69
- **Filtered out**: < 50

## Deduplication Strategy

### Signature Generation

```
signature = SHA256(detectorId + filePath + lineNumber + patternHash)
```

### Grouping Logic

- Same signature within 5 minutes → group
- Similar patterns in same method → suggest grouping
- Display count: "3 similar issues in this method"

## Cooldown Strategy

### Cache Structure

```
Key: signature
Value: { timestamp, count, lastNotified }
```

### Rules

- First occurrence: notify immediately
- Subsequent within cooldown: skip
- After cooldown expires: notify again if still present
- Escalation: 3+ occurrences → increase severity

## Testing Strategy

### Unit Tests

- Each detector tested with positive/negative cases
- Confidence scoring tested with known scenarios
- Deduplication tested with duplicate patterns
- Cooldown tested with timing simulations

### Integration Tests

- Full pipeline with sample C# projects
- MCP protocol compliance
- VS Code settings synchronization
- Performance with large codebases

### False Positive Analysis

- Test on open-source projects
- Measure precision/recall
- Tune scoring factors based on results
- Collect user feedback for suppression rules

## Performance Targets

- File analysis: < 500ms for 1000-line file
- Incremental analysis: < 100ms for single file change
- Memory: < 200MB for typical workspace
- Startup: < 2 seconds

## Next Steps

1. Create .NET 10 project structure
2. Implement Roslyn integration foundation
3. Build confidence scoring pipeline
4. Implement detectors in priority order
5. Add noise control features
6. Integrate with MCP server
7. Test and tune for minimal false positives
8. Add Java support
9. Full integration testing with Windsurf
