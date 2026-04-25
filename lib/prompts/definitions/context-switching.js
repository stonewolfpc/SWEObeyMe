/**
 * Context-Switching Prompt
 * Explicit context switch between projects with state preservation
 * Category: project-awareness
 * Persona: senior-engineer
 */

export const promptDefinition = {
  name: 'context-switching',
  description:
    'Explicitly switches context between projects with state preservation, rule set loading, and validation',
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
  clarificationTriggers: ['ambiguity', 'hesitation', 'structural-drift'],
  optimality: 'prefer-optimal-over-literal',
  arguments: [
    {
      name: 'targetProject',
      description: 'Path to target project directory',
      required: true,
      type: 'string',
    },
    {
      name: 'preserveState',
      description: 'Whether to preserve pending tasks and warnings',
      required: false,
      type: 'boolean',
    },
    {
      name: 'currentProject',
      description: 'Current project path',
      required: false,
      type: 'string',
    },
  ],
  template: `Switching contexts. Let's do this cleanly.

{{#if currentProject}}
Leaving: {{currentProject}}
{{/if}}
Entering: {{targetProject}}

## Context Switch In Progress
{{#if preserveState}}
Preserving state: Pending tasks and warnings will be carried over.
{{else}}
State reset: Starting fresh in new project context.
{{/if}}

## Loading Project Context
Detecting project type...
Loading rule set...
Validating SoC boundaries...
Checking protected files...

{{#if preserveState}}
## State Preservation
Pending tasks preserved: {{pendingTaskCount}}
Warnings preserved: {{warningCount}}
Errors preserved: {{errorCount}}
{{/if}}

## Rule Set Loaded
Project-specific rules are now active.
Architectural boundaries are enforced.
Protected files are respected.

## Validation Complete
{{#if (eq validationResult 'pass')}}
✓ Context switch successful
✓ Rule set validated
✓ SoC boundaries confirmed
✓ Ready to work
{{else}}
⚠️ Context switch completed with warnings
- Review validation output
- Check for rule conflicts
- Verify file permissions
{{/if}}

## You Are Now In {{targetProject}}
The rules have changed. The patterns have changed. The boundaries have changed.

Adapt. Don't carry over assumptions from the last project.

{{#if preserveState}}
Your pending tasks came with you. Finish them in this context.
{{else}}
Fresh start. New patterns. New rules.
{{/if}}

Context switch complete. Proceed with discipline.`,
  messages: [],
};
