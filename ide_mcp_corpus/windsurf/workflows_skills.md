# Windsurf Workflows, Skills, and AGENTS.md

Source: https://docs.windsurf.com/windsurf/cascade/workflows + /skills + /agents-md
Last updated: 2026-04-27 (Wave 14+, Windsurf 2.0 era)

## Workflows

Workflows are structured sequences of steps that guide Cascade through interconnected tasks at the **trajectory level** (vs. Rules which operate at the prompt level).

### How to invoke
- Use slash command: `/[workflow-name]` in Cascade input
- Cascade sequentially processes each step defined in the workflow
- Workflows can call other workflows: e.g. `/workflow-1` can include "Call /workflow-2"

### How to create
1. Click Customizations icon → Workflows panel → `+ Workflow`
2. Or create markdown files manually in `.windsurf/workflows/`

### File format
```markdown
---
description: Deploy the application to production
---

1. Run tests with `npm test`
2. Build the project with `npm run build`
3. Deploy using the deployment script
```

### Storage / Discovery
- Saved as `.md` files in `.windsurf/workflows/` directories
- Windsurf discovers from: current workspace, sub-directories, up to git root
- Multiple workspace: deduplicated, shortest relative path shown
- System-level (Enterprise): deployed via MDM policies

### Best for
- Deployments, PR reviews, release checklists
- Any repeatable multi-step task
- Procedures that need to be consistent across team

## Skills

Skills bundle complex multi-step procedures with supporting reference files (scripts, templates, checklists).

### Key concept: Progressive disclosure
Only the skill's `name` and `description` are shown to the model by default. Full `SKILL.md` content and supporting files are loaded **only when Cascade decides to invoke the skill** (or when you `@mention` it). This keeps context window lean.

### SKILL.md file format

```markdown
---
name: deploy-to-production
description: Deploy the application to production including all validation steps
version: 1.0.0
---

## Steps

1. Run full test suite
2. Build production artifacts
3. Validate deployment config
4. Execute deployment script
5. Verify deployment health
```

### Required frontmatter fields
- `name`: Unique skill identifier
- `description`: What the skill does (shown to model for decision)
- `version`: Semantic version

### Invocation
- **Automatic**: Model invokes when it determines the skill is relevant
- **Manual**: `@mention` the skill name in Cascade input

### Skill Scopes
- User-level: `~/.codeium/windsurf/skills/`
- Workspace-level: `.windsurf/skills/`
- System-level (Enterprise): OS-specific deployment

### Skills vs Rules vs Workflows

| | Rules | Workflows | Skills |
|---|---|---|---|
| Activation | trigger modes | Manual slash command | Automatic or @mention |
| Content | Behavior guidelines | Step-by-step instructions | Procedures + supporting files |
| Context cost | Per activation mode | Full on invocation | Progressive disclosure |
| Best for | Style guides, constraints | Repeatable checklists | Complex multi-step procedures |

## AGENTS.md

Processed by same Rules engine as `.windsurf/rules/` — zero frontmatter config needed.

### Activation by location
- Root `AGENTS.md`: Always-on (included in system prompt every message)
- Subdirectory `AGENTS.md`: Glob-activated for `<directory>/**` pattern only

### Use cases
- Directory-specific conventions without cluttering global config
- Repository conventions shared with all contributors (version-controlled)
- Fine-grained per-component or per-module guidance

### Example
```
project/
├── AGENTS.md              # Global: always-on
├── lib/
│   └── AGENTS.md          # Glob: applied when editing lib/**
└── qa/
    └── AGENTS.md          # Glob: applied when editing qa/**
```
