/**
 * Prompt Validator
 * Validates prompt definitions against schema and metadata requirements
 * Ensures no broken prompts reach Windsurf
 */

import { PROMPT_METADATA_SCHEMA } from './registry.js';

/**
 * Validation result
 */
class ValidationResult {
  constructor() {
    this.valid = true;
    this.errors = [];
    this.warnings = [];
  }

  addError(message) {
    this.valid = false;
    this.errors.push(message);
  }

  addWarning(message) {
    this.warnings.push(message);
  }

  isValid() {
    return this.valid;
  }

  getErrors() {
    return this.errors;
  }

  getWarnings() {
    return this.warnings;
  }

  format() {
    let output = '';
    if (this.errors.length > 0) {
      output += 'ERRORS:\n';
      output += this.errors.map(e => `  - ${e}`).join('\n');
      output += '\n';
    }
    if (this.warnings.length > 0) {
      output += 'WARNINGS:\n';
      output += this.warnings.map(w => `  - ${w}`).join('\n');
    }
    return output;
  }
}

/**
 * Prompt Validator
 */
export class PromptValidator {
  constructor() {
    this.validPersonas = ['senior-engineer', 'junior-engineer', 'architect', 'auditor'];
    this.validGovernanceLevels = ['strict', 'moderate', 'advisory'];
    this.validCategories = ['governance', 'architecture', 'project-awareness', 'preflight', 'rewrite', 'workflow', 'debugging'];
    this.validTriggers = ['ambiguity', 'hesitation', 'structural-drift', 'tool-forgetting', 'line-limit-violation', 'monolithic-file-detection', 'preflight-violation'];
    this.validOptimality = ['prefer-optimal-over-literal', 'literal-only'];
  }

  /**
   * Validate a prompt definition
   */
  validate(definition) {
    const result = new ValidationResult();

    // Check required fields
    if (!definition.name) {
      result.addError('Missing required field: name');
    }
    if (!definition.description) {
      result.addError('Missing required field: description');
    }

    // Validate category
    if (definition.category && !this.validCategories.includes(definition.category)) {
      result.addError(`Invalid category: ${definition.category}. Must be one of: ${this.validCategories.join(', ')}`);
    }

    // Validate persona
    if (definition.persona && !this.validPersonas.includes(definition.persona)) {
      result.addError(`Invalid persona: ${definition.persona}. Must be one of: ${this.validPersonas.join(', ')}`);
    }

    // Validate governance level
    if (definition.governanceLevel && !this.validGovernanceLevels.includes(definition.governanceLevel)) {
      result.addError(`Invalid governance level: ${definition.governanceLevel}. Must be one of: ${this.validGovernanceLevels.join(', ')}`);
    }

    // Validate context requirements
    if (definition.contextRequirements) {
      if (!Array.isArray(definition.contextRequirements)) {
        result.addError('contextRequirements must be an array');
      }
    }

    // Validate fallback behavior
    if (definition.fallbackBehavior) {
      if (typeof definition.fallbackBehavior !== 'object') {
        result.addError('fallbackBehavior must be an object');
      } else {
        const validKeys = ['reloadContext', 'proposeInterpretations', 'neverGuess', 'neverHideErrors'];
        for (const key of Object.keys(definition.fallbackBehavior)) {
          if (!validKeys.includes(key)) {
            result.addWarning(`Unknown fallback behavior key: ${key}`);
          }
        }
      }
    }

    // Validate clarification triggers
    if (definition.clarificationTriggers) {
      if (!Array.isArray(definition.clarificationTriggers)) {
        result.addError('clarificationTriggers must be an array');
      } else {
        for (const trigger of definition.clarificationTriggers) {
          if (!this.validTriggers.includes(trigger)) {
            result.addError(`Invalid clarification trigger: ${trigger}. Must be one of: ${this.validTriggers.join(', ')}`);
          }
        }
      }
    }

    // Validate optimality flag
    if (definition.optimality && !this.validOptimality.includes(definition.optimality)) {
      result.addError(`Invalid optimality: ${definition.optimality}. Must be one of: ${this.validOptimality.join(', ')}`);
    }

    // Validate arguments
    if (definition.arguments) {
      if (!Array.isArray(definition.arguments)) {
        result.addError('arguments must be an array');
      } else {
        for (let i = 0; i < definition.arguments.length; i++) {
          const arg = definition.arguments[i];
          if (!arg.name) {
            result.addError(`Argument ${i} missing required field: name`);
          }
          if (!arg.type) {
            result.addError(`Argument ${i} missing required field: type`);
          }
        }
      }
    }

    return result;
  }

  /**
   * Validate schema correctness
   */
  validateSchema(definition) {
    const result = new ValidationResult();

    // Check for unknown fields
    const knownFields = [
      'name', 'description', 'category', 'persona', 'governanceLevel',
      'contextRequirements', 'fallbackBehavior', 'clarificationTriggers',
      'optimality', 'arguments', 'template', 'messages'
    ];

    for (const key of Object.keys(definition)) {
      if (!knownFields.includes(key)) {
        result.addWarning(`Unknown field in prompt definition: ${key}`);
      }
    }

    return result;
  }

  /**
   * Validate multiple prompts
   */
  validateBatch(definitions) {
    const results = [];
    let hasErrors = false;

    for (const definition of definitions) {
      const schemaResult = this.validateSchema(definition);
      const validation = this.validate(definition);

      results.push({
        name: definition.name || 'unnamed',
        valid: validation.isValid() && schemaResult.isValid(),
        errors: [...validation.getErrors(), ...schemaResult.getErrors()],
        warnings: [...validation.getWarnings(), ...schemaResult.getWarnings()],
      });

      if (!validation.isValid() || !schemaResult.isValid()) {
        hasErrors = true;
      }
    }

    return {
      valid: !hasErrors,
      results,
    };
  }
}

/**
 * Global validator instance
 */
let globalValidator = null;

/**
 * Get global prompt validator
 */
export function getPromptValidator() {
  if (!globalValidator) {
    globalValidator = new PromptValidator();
  }
  return globalValidator;
}
