/**
 * Refactoring Engine — Language-aware code extraction and splitting
 *
 * Thin re-export module. Implementation split across submodules:
 * - extractors.js: Language-specific function extraction
 * - generators.js: File generation with proper structure
 * - validator.js: Generated code validation
 */

export {
  extractFunctions,
  extractGoFunctions,
  extractPythonFunctions,
  extractRustFunctions,
  extractJSFunctions,
  extractCSharpFunctions,
  extractJavaFunctions,
  extractKotlinFunctions,
  extractSwiftFunctions,
  extractCppFunctions,
  extractGenericFunctions,
  extractBalancedBlock,
} from './refactoring/extractors.js';

export { generateSplitFile, groupFunctionsByConcern } from './refactoring/generators.js';

export { validateGeneratedCode } from './refactoring/validator.js';
