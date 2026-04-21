/**
 * Preflight Correction Prompt
- Triggers before file modifications to check for rule violations and enforce surgical compliance
 * Category: preflight
 * Persona: senior-engineer
 */

export const promptDefinition = {
  name: 'preflight-correction',
  description: 'Pre-flight validation that checks for rule violations and enforces surgical compliance before file modifications',
  category: 'preflight',
  persona: 'senior-engineer',
  governanceLevel: 'strict',
  contextRequirements: ['projectType', 'directoryStructure'],
  fallbackBehavior: {
    reloadContext: true,
    proposeInterpretations: true,
    neverGuess: true,
    neverHideErrors: true,
  },
  clarificationTriggers: ['line-limit-violation', 'monolithic-file-detection', 'structural-drift', 'preflight-violation'],
  optimality: 'prefer-optimal-over-literal',
  arguments: [
    {
      name: 'targetFile',
      description: 'Path to file being modified',
      required: true,
      type: 'string',
    },
    {
      name: 'currentLineCount',
      description: 'Current line count of target file',
      required: false,
      type: 'number',
    },
    {
      name: 'estimatedAddition',
      description: 'Estimated lines to be added',
      required: false,
      type: 'number',
    },
    {
      name: 'proposedChange',
      description: 'Description of proposed change',
      required: false,
      type: 'string',
    },
    {
      name: 'violations',
      description: 'Detected rule violations',
      required: false,
      type: 'array',
    },
  ],
  template: `Hold up—before you touch that file, let's run pre-flight.

{{#if targetFile}}
Target File: {{targetFile}}
{{/if}}

{{#if currentLineCount}}
Current Line Count: {{currentLineCount}}/700
{{#if (gt currentLineCount 650)}}
⚠️ WARNING: File is approaching line limit
{{/if}}
{{#if (gt currentLineCount 700)}}
🚨 CRITICAL: File exceeds line limit—SPLIT IT NOW
{{/if}}
{{/if}}

{{#if estimatedAddition}}
Estimated Addition: +{{estimatedAddition}} lines
{{#if currentLineCount}}
{{#if (gt (+ currentLineCount estimatedAddition) 700)}}
🚨 CRITICAL: This change will exceed 700-line limit
{{/if}}
{{/if}}
{{/if}}

{{#if violations}}
## Detected Violations
{{#each violations}}
- {{this}}
{{/each}}
{{/if}}

## Pre-Flight Checklist
{{#if (gt currentLineCount 650)}}
- [ ] File is near limit—consider splitting before modification
- [ ] Verify change doesn't push file over 700 lines
- [ ] Extract to new file if needed
{{/if}}

{{#if (gt estimatedAddition 100)}}
- [ ] Large change detected—consider splitting into smaller edits
- [ ] Verify this is the optimal approach
- [ ] Check if new file is more appropriate
{{/if}}

{{#if violations}}
- [ ] Address all violations before proceeding
- [ ] Never bypass validation
- [ ] Never hide errors
{{/if}}

## Surgical Compliance Required
- Use obey_surgical_plan before write_file
- Use create_backup before modifications
- Respect separation of concerns
- Choose optimal over literal implementations
- No TODOs or for-laters

{{#if (gt (+ currentLineCount estimatedAddition) 700)}}
## STOP
This change will violate the 700-line limit.

Options:
1. Split the file before modification
2. Extract the change to a new file
3. Reduce the scope of this change

Do not proceed until you have a plan that respects the limit.
{{/if}}

{{#if (gt currentLineCount 650)}}
## WARNING
You're playing with fire near the line limit.

Think like an architect:
- Is this the right place for this change?
- Should this be extracted to its own module?
- Can you split the concern?

Don't just add lines—add value with discipline.
{{/if}}

{{#if (and (lt (+ currentLineCount estimatedAddition) 700) (not violations))}}
✓ Pre-flight passed
✓ Surgical compliance verified
✓ Proceed with modification

Remember: Finish the function. Validate the function. Test the function. Only then expand.
{{/if}}

You're a senior engineer. Act like it. Plan before you code.`,
  messages: [],
};
