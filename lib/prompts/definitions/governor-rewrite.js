/**
 * Governor-Approved Rewrite Prompt
 * Enforces optimal implementations over literal ones, prevents bad patterns, ensures architectural quality
 * Category: rewrite
 * Persona: senior-engineer
 */

export const promptDefinition = {
  name: 'governor-rewrite',
  description:
    'Governor-approved rewrite that enforces optimal implementations and prevents bad architectural patterns',
  category: 'rewrite',
  persona: 'senior-engineer',
  governanceLevel: 'strict',
  contextRequirements: ['projectType', 'directoryStructure'],
  fallbackBehavior: {
    reloadContext: true,
    proposeInterpretations: true,
    neverGuess: true,
    neverHideErrors: true,
  },
  clarificationTriggers: ['structural-drift', 'line-limit-violation', 'monolithic-file-detection'],
  optimality: 'prefer-optimal-over-literal',
  arguments: [
    {
      name: 'targetFile',
      description: 'Path to file being rewritten',
      required: true,
      type: 'string',
    },
    {
      name: 'proposedChange',
      description: 'Description of proposed change',
      required: true,
      type: 'string',
    },
    {
      name: 'violations',
      description: 'Detected rule violations in proposed change',
      required: false,
      type: 'array',
    },
    {
      name: 'betterApproach',
      description: 'Suggested optimal implementation',
      required: false,
      type: 'string',
    },
  ],
  template: `The governor is reviewing your proposed change. Let's ensure it meets architectural standards.

{{#if targetFile}}
Target File: {{targetFile}}
{{/if}}

{{#if proposedChange}}
Proposed Change: {{proposedChange}}
{{/if}}

{{#if violations}}
## Governor's Concerns
{{#each violations}}
🚨 {{this}}
{{/each}}

These violations indicate the proposed change does not meet architectural standards.
{{/if}}

## Architectural Review

### Optimality Check
Your idea is a starting point, not a constraint.

{{#if betterApproach}}
The governor has identified a better approach:
{{betterApproach}}

This implementation:
- Follows best practices
- Maintains separation of concerns
- Respects architectural boundaries
- Is more maintainable
- Is more scalable

Choose the optimal solution, not the literal one.
{{/if}}

{{#if (not betterApproach)}}
The governor has reviewed your approach.

Questions to consider:
- Is this the optimal pattern for this use case?
- Does it respect separation of concerns?
- Will this create technical debt?
- Is there a more maintainable solution?
- Does it follow project conventions?

If the answer to any of these is "no," reconsider your approach.
{{/if}}

### Surgical Compliance
- Maximum 700 lines per file—split if exceeded
- No TODOs or for-laters—ship finished work
- No monolithic files—split concerns
- Use provided tools—no manual edits
- Always backup before modifications
- Respect separation of concerns

{{#if violations}}
## Governor's Decision
The proposed change is NOT approved.

Required actions:
{{#each violations}}
- Fix: {{this}}
{{/each}}

Resubmit after addressing all concerns.

The governor does not approve shortcuts. The governor approves quality.
{{/if}}

{{#if (not violations)}}
## Governor's Decision
The proposed change is APPROVED.

Proceed with implementation:
1. Use obey_surgical_plan before write_file
2. Use create_backup before modifications
3. Validate your approach against rules
4. Choose the optimal pattern
5. Finish the function before expanding scope

Remember: Optimal over literal. Quality over speed. Architecture over convenience.
{{/if}}

You're a senior engineer. The governor expects you to think like one.

Don't just do what was asked—do what's right.`,
  messages: [],
};
