# Codebase Architecture Guide

## Purpose

This guide helps AI agents understand codebase structure without overwhelming context. It provides structural understanding (module boundaries, entry points, critical dependencies) rather than implementation details.

## What AI Needs (Not What We Think It Needs)

### AI Actually Needs:

1. **Entry Points** - Where to start looking (main files, API routes, core modules)
2. **Module Boundaries** - What's separate from what (domain vs infrastructure vs UI)
3. **Critical Dependencies** - What breaks if I touch this (shared utilities, core services)
4. **Architecture Patterns** - How things connect conceptually (not implementation details)

### AI Does NOT Need:

- Full file contents (that's what read_file is for)
- Every function signature (that's what Grep/find_by_name are for)
- Call graphs for everything (only need critical paths)
- Implementation details (that's context bloat)

## Module Types

Based on directory naming conventions:

### API Layer

- Directories: `api`, `routes`, `controllers`, `handlers`, `endpoints`
- Responsibility: HTTP endpoints, request/response handling
- Dependencies: Domain layer, infrastructure layer

### Domain Layer

- Directories: `domain`, `models`, `entities`, `business`, `logic`
- Responsibility: Core business logic, domain models
- Dependencies: None (should be independent)

### Infrastructure Layer

- Directories: `infrastructure`, `config`, `database`, `db`, `storage`
- Responsibility: External systems, databases, configuration
- Dependencies: Domain layer interfaces

### UI Layer

- Directories: `ui`, `components`, `views`, `templates`, `frontend`, `client`
- Responsibility: User interface, presentation logic
- Dependencies: API layer

### Utilities

- Directories: `utils`, `helpers`, `common`, `shared`, `lib`
- Responsibility: Shared helper functions
- Dependencies: None (should be pure functions)

### Tests

- Directories: `tests`, `test`, `__tests__`, `spec`, `specs`
- Responsibility: Test code
- Dependencies: Implementation being tested

### Documentation

- Directories: `docs`, `documentation`, `doc`
- Responsibility: Project documentation
- Dependencies: None

## Critical Dependencies

A "hub file" is a file imported by many other modules. These are critical because:

- Changes to hub files affect many modules
- Hub files often contain shared utilities or core abstractions
- Breaking changes to hub files require careful migration

When working with hub files:

1. Check which modules import it (use Grep to find references)
2. Consider backward compatibility
3. Document breaking changes
4. Coordinate with team if multiple developers affected

## Entry Points

Common entry points by project type:

### JavaScript/TypeScript

- `index.js`, `index.ts` - Module entry
- `main.js`, `main.ts` - Application entry
- `app.js`, `app.ts` - Express/Node app
- `server.js`, `server.ts` - HTTP server

### Python

- `main.py` - Application entry
- `app.py` - Flask/Django app
- `run.py` - Application runner
- `__main__.py` - Package entry

### Java

- `src/main/java/.../Main.java` - Application entry
- `src/main/java/.../Application.java` - Spring Boot entry

### C#

- `Program.cs` - Application entry
- `Startup.cs` - ASP.NET Core configuration

## Usage Pattern

### Initial Orientation (once per project)

```
AI: "What's the architecture of this codebase?"
→ codebase_orientation tool
→ Returns module structure, entry points, framework
```

### During Work (on-demand)

```
AI: "I need to change AuthService"
→ dependency_analysis tool
→ Returns: AuthService is a hub, imported by 47 modules
→ AI knows to check those modules
```

### Exploration (guided)

```
AI: "Where should I add this new feature?"
→ codebase_explore tool
→ Returns: Add to /src/domain, depends on /src/common
→ AI has clear path, doesn't get lost
```

## Integration with SWEObeyMe

This system complements existing SWEObeyMe features:

**Existing System (Dynamic State):**

- Session state (what you're doing now)
- Project awareness (current project state)
- Task tracking (pending tasks, workflow)
- Memory system (decisions, patterns, errors, architecture)

**New System (Static Structure):**

- Codebase structure (what the codebase is)
- Module relationships (architectural, not operational)
- Entry point mapping (for initial orientation)
- Critical dependency identification (for impact analysis)

**The Distinction:**

- Existing system = dynamic state (what you're doing now)
- New system = static structure (what the codebase is)
- They serve different purposes and don't duplicate

## Best Practices

1. **Use codebase_orientation first** - When exploring a new codebase, start here to understand structure
2. **Check dependencies before changes** - Use dependency_analysis to understand impact
3. **Map entry points for integration** - Use entry_point_mapper to understand APIs
4. **Ask guided questions** - Use codebase_explore for specific "where do I..." questions
5. **Don't rely solely on this** - This provides structure, but you still need read_file for details
