import { PatchValidator } from '../utils/patch-validator.js';
/**
 * Validate Patch Tool
 *
 * MCP tool that validates proposed patches for syntax, structure,
 * duplicates, and consistency before they are applied.
 */
export function createValidatePatchTool() {
    return {
        name: 'validate_patch',
        description: 'Validates a proposed patch for syntax, structure, duplicates, and consistency before applying changes',
        inputSchema: {
            type: 'object',
            properties: {
                originalContent: {
                    type: 'string',
                    description: 'Original file content before changes',
                },
                patchedContent: {
                    type: 'string',
                    description: 'Proposed patched content to validate',
                },
                filePath: {
                    type: 'string',
                    description: 'File path being validated (optional)',
                },
                options: {
                    type: 'object',
                    properties: {
                        allowNamespaceChanges: {
                            type: 'boolean',
                            description: 'Allow namespace changes during validation',
                            default: false,
                        },
                        allowStructuralChanges: {
                            type: 'boolean',
                            description: 'Allow structural changes during validation',
                            default: false,
                        },
                        allowNewImports: {
                            type: 'boolean',
                            description: 'Allow new imports during validation',
                            default: false,
                        },
                        strict: {
                            type: 'boolean',
                            description: 'Enable strict validation mode',
                            default: true,
                        },
                    },
                },
            },
            required: ['originalContent', 'patchedContent'],
        },
    };
}
/**
 * Handle validate patch tool call
 */
export async function handleValidatePatch(args) {
    const validator = new PatchValidator();
    const result = await validator.validatePatch(args.originalContent, args.patchedContent, {
        filePath: args.filePath,
        options: args.options,
    });
    return result;
}
//# sourceMappingURL=validate-patch.js.map