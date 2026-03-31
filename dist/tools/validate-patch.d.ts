import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { PatchValidationResult } from '../types/patch-validation.js';
/**
 * Validate Patch Tool
 *
 * MCP tool that validates proposed patches for syntax, structure,
 * duplicates, and consistency before they are applied.
 */
export declare function createValidatePatchTool(): Tool;
/**
 * Handle validate patch tool call
 */
export declare function handleValidatePatch(args: {
    originalContent: string;
    patchedContent: string;
    filePath?: string;
    options?: {
        allowNamespaceChanges?: boolean;
        allowStructuralChanges?: boolean;
        allowNewImports?: boolean;
        strict?: boolean;
    };
}): Promise<PatchValidationResult>;
//# sourceMappingURL=validate-patch.d.ts.map