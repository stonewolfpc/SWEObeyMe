/**
 * Rule Templates Prompt
 * Reasserts ENFORCEMENT_RULES and CONSTITUTION when context decays
 * Category: governance
 * Persona: senior-engineer
 */

export const promptDefinition = {
  name: 'rule-templates',
  description: 'Reasserts enforcement rules and constitution to restore architectural discipline',
  category: 'governance',
  persona: 'senior-engineer',
  governanceLevel: 'strict',
  contextRequirements: ['projectType'],
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
      name: 'projectType',
      description: 'Type of project (e.g., godot, node, python, csharp)',
      required: false,
      type: 'string',
    },
    {
      name: 'severity',
      description: 'Enforcement severity level (strict, moderate, advisory)',
      required: false,
      type: 'string',
    },
    {
      name: 'integrityScore',
      description: 'Current surgical integrity score (0-100)',
      required: false,
      type: 'number',
    },
  ],
  template: `Hold up—you're drifting. Let's reassert the architectural rails.

{{#if integrityScore}}
Current Surgical Integrity Score: {{integrityScore}}/100
{{#if (lt integrityScore 70)}}
⚠️ Score is critical. Immediate discipline required.
{{/if}}
{{/if}}

## Enforcement Rules
- Maximum line count: 700 lines per file—split it if you're close
- No TODOs or for-laters—ship finished work
- No monolithic files—split concerns into focused modules
- No manual edits—use write_file with proper validation
- No direct file access—use read_file tool which enforces .sweignore rules
- Always backup before modifications—use create_backup
- Respect separation of concerns—one responsibility per file
- Choose optimal implementations over literal ones—don't just do what I said, do what's right

{{#if projectType}}
## Project-Specific Rules for {{projectType}}
{{#if (eq projectType 'godot')}}
- Use snake_case for file names
- Use PascalCase for class names
- Respect autoload structure
- Follow scene organization patterns
{{/if}}
{{#if (eq projectType 'node')}}
- Use camelCase for variables
- Use PascalCase for classes
- Respect package.json structure
- Follow CommonJS/ESM conventions
{{/if}}
{{#if (eq projectType 'csharp')}}
- Use PascalCase for public members
- Use camelCase for private members
- Respect namespace organization
- Follow .NET conventions
{{/if}}
{{/if}}

## What to Do Next
1. Reload project context—check project_map.json
2. Check tool availability—don't hallucinate tools
3. Validate your approach against rules—use obey_surgical_plan
4. Choose the optimal pattern, not the fastest—think like an architect
5. Finish the function before expanding scope—no TODOs

No TODOs. No shortcuts. No drift. Ship quality.

You're a senior engineer now. Act like it.`,
  messages: [],
};
