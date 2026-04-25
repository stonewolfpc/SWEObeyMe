/**
 * Project-Awareness Prompt
 * Re-anchors model to project type, structure, and boundaries
 * Category: project-awareness
 * Persona: senior-engineer
 */

export const promptDefinition = {
  name: 'project-awareness',
  description:
    'Detects project type, loads rule set, and announces context switch to restore architectural awareness',
  category: 'project-awareness',
  persona: 'senior-engineer',
  governanceLevel: 'moderate',
  contextRequirements: ['projectType', 'directoryStructure'],
  fallbackBehavior: {
    reloadContext: true,
    proposeInterpretations: true,
    neverGuess: true,
    neverHideErrors: true,
  },
  clarificationTriggers: ['ambiguity', 'hesitation', 'structural-drift', 'tool-forgetting'],
  optimality: 'prefer-optimal-over-literal',
  arguments: [
    {
      name: 'filePath',
      description: 'Path to file for project detection',
      required: false,
      type: 'string',
    },
    {
      name: 'forceRefresh',
      description: 'Force project context reload',
      required: false,
      type: 'boolean',
    },
    {
      name: 'detectedProjectType',
      description: 'Detected project type',
      required: false,
      type: 'string',
    },
  ],
  template: `You're asking about file placement—good instinct. Let's re-establish project context.

{{#if filePath}}
Analyzing: {{filePath}}
{{/if}}

{{#if detectedProjectType}}
## Detected Project Type: {{detectedProjectType}}
{{#if (eq detectedProjectType 'godot')}}
This is a Godot project.
- File naming: snake_case (.gd files)
- Class naming: PascalCase
- Directory structure: scenes/, scripts/, resources/, autoload/
- Protected files: project.godot, .godot/
- SoC boundary: Scenes are composition, scripts are logic
{{/if}}
{{#if (eq detectedProjectType 'node')}}
This is a Node.js project.
- File naming: camelCase for code, kebab-case for packages
- Directory structure: src/, lib/, tests/, package.json
- Protected files: package.json, node_modules/, .npm/
- SoC boundary: src/ is source, lib/ is shared, tests/ is validation
{{/if}}
{{#if (eq detectedProjectType 'python')}}
This is a Python project.
- File naming: snake_case
- Directory structure: src/, tests/, requirements.txt, setup.py
- Protected files: __pycache__/, .venv/, *.pyc
- SoC boundary: src/ is implementation, tests/ is validation
{{/if}}
{{#if (eq detectedProjectType 'csharp')}}
This is a C# project.
- File naming: PascalCase for public, camelCase for private
- Directory structure: src/, Properties/, bin/, obj/
- Protected files: bin/, obj/, *.csproj, *.sln
- SoC boundary: Namespaces define boundaries, classes define responsibilities
{{/if}}
{{/if}}

## Architectural Boundaries
{{#if detectedProjectType}}
Given this is a {{detectedProjectType}} project{{#if (eq detectedProjectType 'csharp')}} with async boundaries{{/if}}, use the appropriate patterns.

{{#if (eq detectedProjectType 'csharp')}}
- This belongs in the Services layer, not Utilities
- Use async/await for I/O operations
- Respect namespace organization
- Follow .NET conventions
{{/if}}

{{#if (eq detectedProjectType 'node')}}
- This belongs in the src/ directory, not root
- Use CommonJS/ESM conventions consistently
- Respect package.json dependencies
- Follow Node.js best practices
{{/if}}
{{/if}}

## Context Switch Announced
{{#if forceRefresh}}
Project context forcibly reloaded.
{{/if}}
Rule set loaded for {{detectedProjectType}}.
Architectural boundaries re-established.

Now you know where you are. Act like it.

This file belongs in the right place. Don't guess—check the structure.`,
  messages: [],
};
