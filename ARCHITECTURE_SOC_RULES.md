# SWEObeyMe Separation of Concerns - Senior Engineer Standards

**Version:** 3.0.0  
**Status:** MANDATORY - ZERO TOLERANCE  
**Authority:** Senior Architect Grade - AI Must Not Question  
**Effective:** 2026-04-10

---

## 1. The Iron Rule of Separation of Concerns

### Definition

**Separation of Concerns (SoC)** is the architectural principle that a software module should have **one, and only one, primary responsibility**. Mixing concerns creates **tight coupling**, **reduced testability**, and **technical debt**.

### The Three Concern Categories

| Category              | Responsibility                          | Examples                                         |
| --------------------- | --------------------------------------- | ------------------------------------------------ |
| **Presentation (UI)** | User interface, webviews, HTML/CSS      | Sidebar panels, settings UI, status messages     |
| **Business Logic**    | Domain rules, orchestration, workflows  | Tool orchestration, validation logic, governance |
| **Data Access**       | File operations, API calls, persistence | MCP server communication, file I/O, storage      |

### The Forbidden Pattern

```javascript
// ❌ GOD FILE - VIOLATES SoC
// File: extension.js (1130 lines)
// Concerns: UI + Business Logic + Data Access + Configuration + HTML Generation
```

---

## 2. Mandatory Architectural Constraints

### 2.1 File Size Limits (NON-NEGOTIABLE)

| Metric             | Maximum | Enforcement                                |
| ------------------ | ------- | ------------------------------------------ |
| Lines of Code      | 700     | Hard limit - files exceeding must be split |
| Functions per file | 10      | Soft limit - consider extraction           |
| Responsibilities   | 1       | Hard limit - single primary concern        |

### 2.2 Module Organization

```
lib/
├── ui/                    # Presentation layer only
│   ├── webview-provider.js
│   ├── sidebar-panel.js
│   └── html-generators/
├── business/              # Business logic only
│   ├── orchestration/
│   ├── validation/
│   └── governance/
├── data/                  # Data access only
│   ├── mcp-client/
│   ├── file-operations/
│   └── api/
└── tools/                 # Tool handlers (single concern each)
    ├── csharp/
    ├── godot/
    └── validation/
```

### 2.3 Dependency Direction

```
UI (Presentation)
    ↓ (depends on)
Business Logic (Orchestration)
    ↓ (depends on)
Data Access (Persistence)
    ↓ (depends on)
External APIs / File System
```

**VIOLATION:** Data layer must NEVER depend on UI layer.

---

## 3. SoC Violation Detection Rules

### 3.1 Automatic Detection Patterns

| Pattern                 | Detection                                | Severity |
| ----------------------- | ---------------------------------------- | -------- |
| **God File**            | >700 lines                               | CRITICAL |
| **Mixed Concerns**      | UI + Business + Data in one file         | CRITICAL |
| **Circular Dependency** | Module A imports B, B imports A          | HIGH     |
| **UI Leakage**          | Data layer references vscode API         | HIGH     |
| **Logic in UI**         | Business rules in HTML generators        | MEDIUM   |
| **Multiple Domains**    | C# handlers + Godot handlers in one file | MEDIUM   |

### 3.2 Current Violations (v3.0.0)

#### CRITICAL: extension.js - God File

- **Lines:** 1130 (61% OVER LIMIT)
- **Concerns Mixed:**
  1. Extension activation/lifecycle
  2. Webview provider management
  3. UI state management
  4. Tool orchestration
  5. Provider coordination
  6. Diff review management
  7. HTML generation
  8. Message handling
  9. Configuration management
  10. Sidebar panel implementation

**Required Action:** Extract to 5-7 separate files

#### CRITICAL: csharp-handlers.js - Over Limit

- **Lines:** 765 (9% OVER LIMIT)
- **Responsibilities:**
  1. C# error detection
  2. C# error reporting
  3. Backup management
  4. File operations
  5. Validation

**Required Action:** Split into handlers + services

#### HIGH: handlers.js - Mixed Responsibilities

- **Lines:** ~450
- **Concerns:** Multiple tool handler domains mixed

**Required Action:** Domain-specific handler files

---

## 4. Refactoring Standards

### 4.1 Extraction Pattern

When a file exceeds 700 lines or mixes concerns:

```javascript
// BEFORE: god-handlers.js (900 lines)
export const handlers = {
  csharp_detection,
  csharp_reporting,
  csharp_backup,
  godot_detection,
  godot_validation,
  // ... 20 more handlers
};

// AFTER: Separated by domain
// lib/tools/handlers-csharp.js
export const csharpHandlers = { detection, reporting };

// lib/tools/handlers-godot.js
export const godotHandlers = { detection, validation };

// lib/services/backup-service.js
export class BackupService { ... }
```

### 4.2 Service Extraction

Business logic must be extracted to services:

```javascript
// lib/services/tool-orchestrator.js
export class ToolOrchestrator {
  async execute(toolName, args) {
    // Orchestration logic only
  }
}

// lib/services/validation-service.js
export class ValidationService {
  validateSoC(filePath) {
    // Validation logic only
  }
}
```

### 4.3 UI Separation

All HTML/UI generation must be isolated:

```javascript
// lib/ui/html-generators/settings-html.js
export function generateSettingsHtml(config) {
  // HTML generation only - no business logic
}

// lib/ui/providers/sidebar-provider.js
export class SidebarProvider {
  // Webview management only
}
```

---

## 5. Enforcement Rules (AI MUST FOLLOW)

### 5.1 Before Any File Operation

The AI MUST ask:

1. Does this file exceed 700 lines?
2. Does this file mix concerns (UI/Business/Data)?
3. Would this change increase coupling?
4. Can this logic be in a dedicated service?

### 5.2 When Violations Detected

**AI Response Protocol:**

```
1. STOP immediately
2. Report violation with specific details
3. Propose extraction plan
4. Do NOT proceed until SoC is restored
```

### 5.3 Refactoring Commands

When told to refactor:

1. **Identify** all concerns in the file
2. **Extract** each concern to dedicated file
3. **Update** imports in dependent files
4. **Verify** no circular dependencies created
5. **Document** the new structure

---

## 6. Directory Structure Compliance

### 6.1 Approved Structure

```
SWEObeyMe/
├── extension.js              # MAX 200 lines - entry point only
├── lib/
│   ├── ui/                   # Presentation layer
│   │   ├── providers/        # Webview providers
│   │   └── generators/       # HTML generators
│   ├── business/             # Business logic
│   │   ├── orchestration/    # Tool orchestration
│   │   ├── validation/       # SoC/quality checks
│   │   └── governance/       # Policy enforcement
│   ├── data/                 # Data access
│   │   ├── mcp/              # MCP server client
│   │   └── persistence/      # File/storage operations
│   ├── tools/                # Tool handlers
│   │   ├── csharp/           # C# domain handlers
│   │   ├── godot/            # Godot domain handlers
│   │   └── validation/       # Validation handlers
│   └── services/             # Shared services
│       ├── backup/           # Backup management
│       └── audit/            # Audit logging
└── tests/
```

### 6.2 Forbidden Patterns

```javascript
// ❌ NEVER: Business logic in UI file
// lib/ui/sidebar.js
export function handleToolExecution() {
  // VIOLATION!
  // Tool execution logic should be in business layer
}

// ❌ NEVER: UI references in data layer
// lib/data/mcp-client.js
vscode.window.showInformationMessage('...'); // VIOLATION!

// ❌ NEVER: Multiple domains in one handler file
// lib/tools/handlers.js
export const handlers = {
  csharp_detect, // Different domain
  godot_detect, // Different domain
  validate_soc, // Different domain
};
```

---

## 7. Quality Metrics

### 7.1 SoC Health Score

| Metric                   | Weight | Target |
| ------------------------ | ------ | ------ |
| Files under 700 lines    | 30%    | 100%   |
| Single concern per file  | 30%    | 100%   |
| No circular dependencies | 20%    | 100%   |
| Proper layer separation  | 20%    | 100%   |

### 7.2 Current Project Score: 72/100

**Violations:**

- 3 files over 700 lines (-9 points)
- 5 files with mixed concerns (-15 points)
- 2 circular dependencies (-4 points)

**Required Score for v3.0.1:** 95/100

---

## 8. Action Items for v3.0.1

### 8.1 Immediate (Blocking)

1. **Split extension.js** → 7 files
   - lib/extension/activation.js
   - lib/ui/providers/sidebar.js
   - lib/ui/generators/settings-html.js
   - lib/business/orchestrator.js
   - lib/business/provider-manager.js
   - lib/business/diff-manager.js
   - lib/extension/commands.js

2. **Split csharp-handlers.js** → 3 files
   - lib/tools/csharp/handlers.js
   - lib/services/csharp/error-service.js
   - lib/services/backup/backup-manager.js

### 8.2 High Priority

3. **Audit all handler files** for domain separation
4. **Extract business logic** from UI files
5. **Create service layer** for shared operations

### 8.3 Documentation

6. Update all file headers with responsibility
7. Create architecture decision records (ADRs)
8. Document dependency graph

---

## 9. AI Compliance Statement

**BY INTERACTING WITH SWEOBEYME CODEBASE, THE AI ACKNOWLEDGES:**

1. SoC rules are **architectural law**, not suggestions
2. **No exceptions** without senior architect approval
3. Violations **must be reported**, not silently fixed
4. Refactoring **must be surgical**, not band-aid
5. Quality metrics **must improve**, never regress

**Violation of these rules constitutes technical debt creation and will be blocked.**

---

## 10. References

- [Architecture Patterns](./docs/architecture-patterns.md)
- [Refactoring Guide](./docs/refactoring-guide.md)
- [SoC Violation Examples](./docs/soc-violations.md)

---

**Document Owner:** SWEObeyMe Architecture Team  
**Last Review:** 2026-04-10  
**Next Review:** 2026-07-10  
**Distribution:** All AI Systems - MANDATORY READING

**END OF MANDATORY ARCHITECTURAL STANDARDS**
