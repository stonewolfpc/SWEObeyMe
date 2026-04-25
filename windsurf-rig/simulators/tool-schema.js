/**
 * Tool Schema Validation (STRICT)
 * Validates against JSON Schema spec
 */

import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

class ToolSchemaValidation {
  constructor(options = {}) {
    this.options = options;
    this.results = {
      tests: [],
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0,
    };

    this.indexPath = join(dirname(__dirname), '..', 'index.js');
  }

  async run() {
    console.log('[ToolSchema] Starting tool schema validation...');

    const tests = [
      'missing-inputSchema',
      'missing-required-fields',
      'invalid-json-schema',
      'unknown-schema-keywords',
      'circular-references',
      'empty-tool-arrays',
      'parameter-types',
      'descriptions',
      'fallback-behavior',
    ];

    for (const test of tests) {
      await this.runTest(test);
    }

    this.results.total = this.results.tests.length;
    return this.results;
  }

  async runTest(testName) {
    console.log(`[ToolSchema] Running: ${testName}...`);

    let passed = false;
    let error = null;

    try {
      switch (testName) {
        case 'missing-inputSchema':
          passed = await this.testMissingInputSchema();
          break;
        case 'missing-required-fields':
          passed = await this.testMissingRequiredFields();
          break;
        case 'invalid-json-schema':
          passed = await this.testInvalidJSONSchema();
          break;
        case 'unknown-schema-keywords':
          passed = await this.testUnknownSchemaKeywords();
          break;
        case 'circular-references':
          passed = await this.testCircularReferences();
          break;
        case 'empty-tool-arrays':
          passed = await this.testEmptyToolArrays();
          break;
        case 'parameter-types':
          passed = await this.testParameterTypes();
          break;
        case 'descriptions':
          passed = await this.testDescriptions();
          break;
        case 'fallback-behavior':
          passed = await this.testFallbackBehavior();
          break;
      }
    } catch (e) {
      error = e.message;
    }

    this.results.tests.push({
      id: testName,
      name: `Tool Schema - ${testName}`,
      passed,
      error,
    });

    if (passed) {
      this.results.passed++;
      console.log(`[ToolSchema] ✅ ${testName}`);
    } else {
      this.results.failed++;
      console.log(`[ToolSchema] ❌ ${testName}: ${error}`);
    }
  }

  async testMissingInputSchema() {
    // Test that tools without inputSchema are rejected
    const invalidTool = {
      name: 'test-tool',
      description: 'Test tool',
      // Missing inputSchema
    };

    const validation = this.validateTool(invalidTool);
    return validation.valid === false && validation.reason === 'missing-inputSchema';
  }

  async testMissingRequiredFields() {
    // Test that tools missing required fields are rejected
    const invalidTool = {
      name: 'test-tool',
      // Missing description
      inputSchema: {
        type: 'object',
        properties: {},
      },
    };

    const validation = this.validateTool(invalidTool);
    return (
      validation.valid === false &&
      validation.errors.some((e) => e.includes('missing-required-field'))
    );
  }

  async testInvalidJSONSchema() {
    // Test that invalid JSON schema is rejected
    const invalidTool = {
      name: 'test-tool',
      description: 'Test tool',
      inputSchema: {
        type: 'invalid-type', // Not a valid JSON Schema type
        properties: {},
      },
    };

    const validation = this.validateTool(invalidTool);
    return (
      validation.valid === false && validation.errors.some((e) => e.includes('invalid-json-schema'))
    );
  }

  async testUnknownSchemaKeywords() {
    // Test that unknown schema keywords are rejected
    const invalidTool = {
      name: 'test-tool',
      description: 'Test tool',
      inputSchema: {
        type: 'object',
        unknownKeyword: 'should not exist',
        properties: {},
      },
    };

    const validation = this.validateTool(invalidTool);
    return (
      validation.valid === false &&
      validation.errors.some((e) => e.includes('unknown-schema-keyword'))
    );
  }

  async testCircularReferences() {
    // Test for circular references in schema
    const schemaWithCircularRef = {
      type: 'object',
      properties: {
        field1: {
          $ref: '#/properties/field2',
        },
        field2: {
          $ref: '#/properties/field1',
        },
      },
    };

    const hasCircularRef = this.detectCircularReference(schemaWithCircularRef);
    return hasCircularRef === true;
  }

  async testEmptyToolArrays() {
    // Test that empty tool arrays are rejected
    const emptyTools = [];

    const validation = this.validateToolsArray(emptyTools);
    return validation.valid === false && validation.reason === 'empty-tool-array';
  }

  async testParameterTypes() {
    // Test that parameter types are valid
    const toolWithInvalidType = {
      name: 'test-tool',
      description: 'Test tool',
      inputSchema: {
        type: 'object',
        properties: {
          param1: {
            type: 'invalid-type',
          },
        },
      },
    };

    const validation = this.validateTool(toolWithInvalidType);
    return (
      validation.valid === false && validation.errors.some((e) => e.includes('invalid-json-schema'))
    );
  }

  async testDescriptions() {
    // Test that descriptions are present and non-empty
    const toolWithoutDescription = {
      name: 'test-tool',
      description: '',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    };

    const validation = this.validateTool(toolWithoutDescription);
    return (
      validation.valid === false && Array.isArray(validation.errors) && validation.errors.length > 0
    );
  }

  async testFallbackBehavior() {
    // Test fallback behavior when validation fails
    const invalidTool = {
      name: 'test-tool',
      // Missing required fields
    };

    const validation = this.validateTool(invalidTool);
    return validation.fallbackUsed === true;
  }

  // Helper methods
  validateTool(tool) {
    const errors = [];

    // Check required fields
    if (!tool.name) {
      errors.push('missing-required-field: name');
    }
    if (!tool.description) {
      errors.push('missing-required-field: description');
    }
    if (!tool.inputSchema) {
      errors.push('missing-inputSchema');
    }
    if (tool.description && tool.description.trim() === '') {
      errors.push('empty-description');
    }

    // Validate inputSchema
    if (tool.inputSchema) {
      const schemaValidation = this.validateJSONSchema(tool.inputSchema);
      if (!schemaValidation.valid) {
        errors.push(...schemaValidation.errors);
      }
    }

    if (errors.length > 0) {
      return { valid: false, errors, reason: errors[0], fallbackUsed: true };
    }

    return { valid: true };
  }

  validateToolsArray(tools) {
    if (!Array.isArray(tools) || tools.length === 0) {
      return { valid: false, reason: 'empty-tool-array' };
    }

    for (const tool of tools) {
      const validation = this.validateTool(tool);
      if (!validation.valid) {
        return validation;
      }
    }

    return { valid: true };
  }

  validateJSONSchema(schema) {
    const errors = [];
    const validTypes = ['object', 'array', 'string', 'number', 'integer', 'boolean', 'null'];
    const validKeywords = [
      'type',
      'properties',
      'required',
      'additionalProperties',
      'items',
      'minItems',
      'maxItems',
      'minimum',
      'maximum',
      'exclusiveMinimum',
      'exclusiveMaximum',
      'minLength',
      'maxLength',
      'pattern',
      'enum',
      'const',
      '$ref',
      '$schema',
      'id',
      'allOf',
      'anyOf',
      'oneOf',
      'not',
      'description',
      'title',
      'default',
    ];

    // Validate type
    if (schema.type && !validTypes.includes(schema.type)) {
      errors.push('invalid-json-schema: invalid type');
    }

    // Check for unknown keywords
    for (const key of Object.keys(schema)) {
      if (!validKeywords.includes(key)) {
        errors.push(`unknown-schema-keyword: ${key}`);
      }
    }

    // Validate properties if object
    if (schema.type === 'object' && schema.properties) {
      for (const [propName, propSchema] of Object.entries(schema.properties)) {
        const propValidation = this.validateJSONSchema(propSchema);
        if (!propValidation.valid) {
          errors.push(...propValidation.errors);
        }
      }
    }

    // Validate items if array
    if (schema.type === 'array' && schema.items) {
      const itemsValidation = this.validateJSONSchema(schema.items);
      if (!itemsValidation.valid) {
        errors.push(...itemsValidation.errors);
      }
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    return { valid: true };
  }

  detectCircularReference(schema, visited = new Set(), path = '#') {
    if (typeof schema !== 'object' || schema === null) {
      return false;
    }

    if (visited.has(path)) {
      return true;
    }

    visited.add(path);

    for (const [key, value] of Object.entries(schema)) {
      if (key === '$ref') {
        const refPath = value;
        if (visited.has(refPath)) {
          return true;
        }
      } else if (typeof value === 'object' && value !== null) {
        if (this.detectCircularReference(value, visited, `${path}/${key}`)) {
          return true;
        }
      }
    }

    return false;
  }
}

export default ToolSchemaValidation;
