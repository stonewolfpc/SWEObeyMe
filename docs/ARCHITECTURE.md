# SWEObeyMe Architecture

## System Overview

SWEObeyMe is a surgical governance system for AI-assisted software development, built as a Model Context Protocol (MCP) server with VS Code extension integration.

## High-Level Architecture

```mermaid
graph TB
    subgraph "VS Code Environment"
        A[VS Code IDE] --> B[SWEObeyMe Extension]
        B --> C[Windsurf/Cascade AI]
    end

    subgraph "MCP Server"
        D[index.js - Entry Point] --> E[lib/ - Core Modules]
        E --> F[lib/tools/ - Tool Handlers]
        F --> G[lib/tools/registry.js - Tool Definitions]
    end

    subgraph "Governance Layer"
        H[enforcement.js - Validation Rules]
        I[rule-engine.js - Rule Engine]
        J[workflow.js - Workflow Orchestration]
    end

    subgraph "Memory & State"
        K[session.js - Session Memory]
        L[project-memory.js - Project Memory]
        M[backup.js - Backup System]
    end

    subgraph "External Integrations"
        N[C# Bridge - Error Detection]
        O[Project Map - Architecture Rules]
    end

    C -->|MCP Protocol| D
    E --> H
    E --> I
    E --> J
    E --> K
    E --> L
    E --> M
    E --> N
    E --> O
```

## Module Architecture

```mermaid
graph LR
    subgraph "Entry Points"
        A[index.js] --> B[extension.js]
    end

    subgraph "Core Library (lib/)"
        B --> C[utils.js]
        B --> D[backup.js]
        B --> E[enforcement.js]
        B --> F[session.js]
        B --> G[project.js]
        B --> H[workflow.js]
        B --> I[rule-engine.js]
        B --> J[project-memory.js]
        B --> K[fallback-system.js]
    end

    subgraph "Tools (lib/tools/)"
        B --> L[tools.js]
        L --> M[handlers.js]
        L --> N[registry.js]

        subgraph "Split Handler Modules"
            M --> M1[handlers-status.js]
            M --> M2[handlers-workflow.js]
            M --> M3[handlers-refactoring.js]
            M --> M4[handlers-preflight.js]
            M --> M5[handlers-oracle.js]
        end

        subgraph "Split Registry Modules"
            N --> N1[registry-core.js]
            N --> N2[registry-config.js]
            N --> N3[registry-validation.js]
            N --> N4[registry-context.js]
            N --> N5[registry-safety-feedback.js]
            N --> N6[registry-csharp.js]
            N --> N7[registry-code-search.js]
            N --> N8[registry-project.js]
        end
    end

    subgraph "Project Memory (lib/)"
        J --> P[project-memory-core.js]
        J --> Q[project-memory-utils.js]
        J --> R[project-memory-structure.js]
        J --> S[project-memory-conventions.js]
        J --> T[project-memory-detection.js]
        J --> U[project-memory-validation.js]
        J --> V[project-memory-location.js]
    end
```

## Tool Execution Flow

```mermaid
sequenceDiagram
    participant AI as AI Model
    participant MCP as MCP Server
    participant Registry as Tool Registry
    participant Handler as Tool Handler
    participant Validator as Enforcement
    participant Backup as Backup System

    AI->>MCP: Tool Call Request
    MCP->>Registry: Validate Tool Exists
    Registry-->>MCP: Tool Definition
    MCP->>Handler: Execute Tool
    Handler->>Validator: Validate Operation
    Validator-->>Handler: Validation Result
    alt Validation Passes
        Handler->>Backup: Create Backup
        Backup-->>Handler: Backup Created
        Handler->>Handler: Execute Operation
        Handler-->>MCP: Success Response
        MCP-->>AI: Tool Response
    else Validation Fails
        Handler-->>MCP: Error Response
        MCP-->>AI: Error with Guidance
    end
```

## Surgical Governance Flow

```mermaid
graph TD
    A[File Operation Request] --> B{Check Surgical Plan}
    B -->|Not Validated| C[Call obey_surgical_plan]
    B -->|Validated| D[Check Line Count}

    C --> E{Within Limits?}
    E -->|Yes| D
    E -->|No| F[Suggest Refactoring]

    D -->|Within Limits| G[Check Forbidden Patterns]
    D -->|Exceeds Limits| F

    G -->|Clean| H{Requires Backup?}
    G -->|Has Patterns| I[Auto-Correction]

    I --> J[Remove Patterns]
    J --> H

    H -->|Yes| K[Create Backup]
    H -->|No| L[Execute Write]

    K --> M[Verify Backup]
    M -->|Success| L
    M -->|Failure| N[Error: Backup Failed]

    L --> O{Loop Detection}
    O -->|Loop Detected| P[Block Operation]
    O -->|No Loop| Q[Success]

    F --> R[Call refactor_move_block or extract_to_new_file]
    N --> S[Error Response]
    P --> S
    Q --> T[Return Success]
```

## Project Memory Architecture

```mermaid
graph TB
    subgraph "Project Memory System"
        A[project-memory.js - Main Class]
        A --> B[project-memory-core.js - Core Logic]
        A --> C[project-memory-utils.js - Utilities]
        A --> D[project-memory-structure.js - Structure Indexing]
        A --> E[project-memory-conventions.js - Convention Analysis]
        A --> F[project-memory-detection.js - Pattern Detection]
        A --> G[project-memory-validation.js - Validation Rules]
        A --> H[project-memory-location.js - File Location]
    end

    subgraph "Data Storage"
        I[.sweobeyme-memory.json]
        J[project_map.json]
    end

    B --> I
    B --> J

    subgraph "Memory Contents"
        K[Structure - Directories & Files]
        L[Conventions - Naming & Patterns]
        M[Decisions - Architectural Decisions]
        N[File Purposes - Purpose Tracking]
    end

    I --> K
    I --> L
    I --> M
    I --> N
```

## C# Bridge Architecture

```mermaid
graph LR
    subgraph "C# Bridge"
        A[C# Bridge Module]
        A --> B[Error Detectors]
        B --> C[Pattern Matchers]
        B --> D[Severity Scoring]
        B --> E[Deduplication]
        B --> F[Cooldown Manager]

        C --> G[Missing Using]
        C --> H[Empty Catch]
        C --> I[Deep Nesting]
        C --> J[Async/Await]
        C --> K[Resource Leaks]
        C --> L[Math Safety]
        C --> M[Null Reference]
        C --> N[Static Mutation]
        C --> O[String Concatenation]
    end

    subgraph "Integration"
        D --> P[Confidence Threshold]
        E --> Q[SHA256 Grouping]
        F --> R[Time-based Throttling]
    end

    subgraph "VS Code"
        S[Settings Panel]
        S --> P
        S --> R
        S --> B
    end
```

## Data Flow Diagram

```mermaid
graph LR
    subgraph "Input"
        A[AI Model Request]
    end

    subgraph "Processing"
        B[MCP Server]
        B --> C[Tool Registry]
        C --> D[Tool Handler]
        D --> E[Validation Layer]
        E --> F[Rule Engine]
        F --> G[Workflow Orchestrator]
    end

    subgraph "State Management"
        H[Session Memory]
        I[Project Memory]
        J[Backup System]
    end

    subgraph "Output"
        K[Tool Response]
        L[Error Response]
        M[Suggestions]
    end

    A --> B
    G --> H
    G --> I
    G --> J
    G --> K
    E --> L
    E --> M
```

## Configuration Flow

```mermaid
graph TD
    A[VS Code Settings] --> B[extension.js]
    B --> C[index.js]
    C --> D[lib/project.js]
    D --> E[.sweobeyme-contract.md]
    D --> F[.sweignore]
    D --> G[project_map.json]

    subgraph "Runtime Configuration"
        H[Environment Variables]
        I[NODE_ENV]
        J[SWEOBEYME_BACKUP_DIR]
        K[SWEOBEYME_DEBUG]
    end

    C --> H

    subgraph "Tool Configuration"
        L[lib/tools/registry.js]
        M[Tool Definitions]
        N[Input Schemas]
        O[Priorities]
    end

    C --> L
```

## Error Handling Flow

```mermaid
graph TD
    A[Error Detected] --> B{Error Type}

    B -->|Validation Error| C[Return Error with Guidance]
    B -->|File Not Found| D[Fallback: Check Similar Files]
    B -->|Permission Denied| E[Fallback: Suggest Alternative Path]
    B -->|Syntax Error| F[Fallback: Auto-Repair if Possible]
    B -->|Import Error| G[Fallback: Verify Imports]
    B -->|Loop Detected| H[Fallback: Suggest Recovery]
    B -->|Unknown Error| I[Fallback: Generic Guidance]

    C --> J[Provide Next Tool Suggestion]
    D --> J
    E --> J
    F --> J
    G --> J
    H --> J
    I --> J

    J --> K[Update Session Memory]
    K --> L{Consecutive Failures?}

    L -->|Yes, >= 3| M[Trigger Constitution Reading]
    L -->|No| N[Continue]

    M --> O[Call get_architectural_directive]
    O --> P[Reset Failure Counter]
    P --> N
```

## Component Relationships

```mermaid
erDiagram
    MCP_SERVER ||--o{ TOOL_REGISTRY : contains
    TOOL_REGISTRY ||--o{ TOOL_DEFINITION : defines
    TOOL_DEFINITION ||--|| TOOL_HANDLER : implements
    TOOL_HANDLER ||--o{ VALIDATION_RULE : uses
    TOOL_HANDLER ||--o{ BACKUP_SYSTEM : uses

    PROJECT_MEMORY ||--o{ MEMORY_ENTRY : contains
    MEMORY_ENTRY ||--|| CONVENTION : tracks
    MEMORY_ENTRY ||--|| DECISION : records

    SESSION_MEMORY ||--o{ ACTION_LOG : contains
    ACTION_LOG ||--|| INTEGRITY_SCORE : affects

    C_BRIDGE ||--o{ ERROR_DETECTOR : contains
    ERROR_DETECTOR ||--|| PATTERN_MATCHER : uses
```

## Deployment Architecture

```mermaid
graph TB
    subgraph "Development Environment"
        A[VS Code with SWEObeyMe Extension]
        A --> B[Local MCP Server]
        B --> C[Local File System]
    end

    subgraph "Production Environment"
        D[VS Code Marketplace]
        D --> E[Published Extension]
        E --> F[User Installation]
        F --> G[User's MCP Server]
        G --> H[User's Workspace]
    end

    subgraph "CI/CD"
        I[GitHub Actions]
        I --> J[Automated Tests]
        I --> K[Extension Packaging]
        I --> L[Marketplace Publishing]
    end
```

## Security Layers

```mermaid
graph TD
    A[File Operation] --> B[Workspace Boundary Check]
    B --> C[Permission Validation]
    C --> D[Pattern Validation]
    D --> E[Line Count Check]
    E --> F[Backup Verification]
    F --> G[Hash Verification]
    G --> H[Audit Logging]

    B -->|Fail| I[Reject Operation]
    C -->|Fail| I
    D -->|Fail| I
    E -->|Fail| J[Suggest Refactoring]
    F -->|Fail| I
    G -->|Fail| I
    H --> K[Allow Operation]
```

## Summary

SWEObeyMe follows a modular architecture with clear separation of concerns:

- **Entry Points**: index.js and extension.js handle initialization
- **Core Library**: lib/ contains business logic modules
- **Tools**: lib/tools/ contains split handler and registry modules
- **Governance**: enforcement.js, rule-engine.js, workflow.js enforce rules
- **Memory**: session.js, project-memory.js maintain state
- **Integrations**: C# Bridge, Project Map provide external capabilities

All file operations pass through surgical validation with automatic backups and comprehensive error handling.
