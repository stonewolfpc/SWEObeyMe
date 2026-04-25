/**
 * Tool Arbitration Test
 * Simulates model misbehavior, hallucinations, parameter errors
 */

import { fileURLToPath } from 'url';
import { join } from 'path';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

class ToolArbitrationTest {
  constructor(options = {}) {
    this.options = options;
    this.results = {
      tests: [],
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0,
    };

    this.testDir = join(__dirname, '..', 'fixtures', 'tool-arbitration');
    this.ensureTestDir();
  }

  ensureTestDir() {
    if (!existsSync(this.testDir)) {
      mkdirSync(this.testDir, { recursive: true });
    }
  }

  async run() {
    console.log('[ToolArbitrationTest] Starting tool arbitration test...');

    const tests = [
      'model-ignoring-instructions',
      'model-hallucinating-tool-names',
      'model-calling-wrong-tools',
      'model-calling-missing-parameters',
      'model-calling-invalid-parameters',
      'model-refusing-tools',
      'model-looping-tool-calls',
      'model-bypassing-resolve-tool',
    ];

    for (const test of tests) {
      await this.runTest(test);
    }

    this.results.total = this.results.tests.length;
    return this.results;
  }

  async runTest(testName) {
    console.log(`[ToolArbitrationTest] Running: ${testName}...`);

    let passed = false;
    let error = null;

    try {
      switch (testName) {
        case 'model-ignoring-instructions':
          passed = await this.testModelIgnoringInstructions();
          break;
        case 'model-hallucinating-tool-names':
          passed = await this.testModelHallucinatingToolNames();
          break;
        case 'model-calling-wrong-tools':
          passed = await this.testModelCallingWrongTools();
          break;
        case 'model-calling-missing-parameters':
          passed = await this.testModelCallingMissingParameters();
          break;
        case 'model-calling-invalid-parameters':
          passed = await this.testModelCallingInvalidParameters();
          break;
        case 'model-refusing-tools':
          passed = await this.testModelRefusingTools();
          break;
        case 'model-looping-tool-calls':
          passed = await this.testModelLoopingToolCalls();
          break;
        case 'model-bypassing-resolve-tool':
          passed = await this.testModelBypassingResolveTool();
          break;
      }
    } catch (e) {
      error = e.message;
    }

    this.results.tests.push({
      id: testName,
      name: `Tool Arbitration - ${testName}`,
      passed,
      error,
    });

    if (passed) {
      this.results.passed++;
      console.log(`[ToolArbitrationTest] ✅ ${testName}`);
    } else {
      this.results.failed++;
      console.log(`[ToolArbitrationTest] ❌ ${testName}: ${error}`);
    }
  }

  async testModelIgnoringInstructions() {
    // Simulate model ignoring tool instructions
    const toolCall = {
      tool: 'read_file',
      parameters: {},
      instructionIgnored: true,
    };

    const arbitration = this.arbitrateToolCall(toolCall);

    // Should catch and enforce
    return arbitration.enforced === true && arbitration.correction === 'instruction-enforced';
  }

  async testModelHallucinatingToolNames() {
    // Simulate model hallucinating non-existent tool names
    const toolCall = {
      tool: 'magical_tool_that_does_not_exist',
      parameters: {},
    };

    const arbitration = this.arbitrateToolCall(toolCall);

    // Should catch and correct
    return arbitration.enforced === true && arbitration.correction === 'invalid-tool-name';
  }

  async testModelCallingWrongTools() {
    // Simulate model calling wrong tool for the task
    const toolCall = {
      tool: 'write_file',
      parameters: { file: 'test.txt', content: 'test' },
      context: { task: 'read file' },
    };

    const arbitration = this.arbitrateToolCall(toolCall);

    // Should detect and suggest correct tool
    return arbitration.enforced === true && arbitration.correction === 'wrong-tool-for-task';
  }

  async testModelCallingMissingParameters() {
    // Simulate model calling tool with missing required parameters
    const toolCall = {
      tool: 'read_file',
      parameters: {}, // Missing file_path
    };

    const arbitration = this.arbitrateToolCall(toolCall);

    // Should catch and request missing parameters
    return arbitration.enforced === true && arbitration.correction === 'missing-parameters';
  }

  async testModelCallingInvalidParameters() {
    // Simulate model calling tool with invalid parameter types
    const toolCall = {
      tool: 'read_file',
      parameters: { file_path: 123 }, // Should be string
    };

    const arbitration = this.arbitrateToolCall(toolCall);

    // Should catch and validate types
    return arbitration.enforced === true && arbitration.correction === 'invalid-parameter-type';
  }

  async testModelRefusingTools() {
    // Simulate model refusing to call required tools
    const toolCall = {
      tool: null,
      reason: 'I refuse to call tools',
    };

    const arbitration = this.arbitrateToolCall(toolCall);

    // Should escalate and enforce
    return arbitration.enforced === true && arbitration.correction === 'tool-refusal-escalated';
  }

  async testModelLoopingToolCalls() {
    // Simulate model calling same tool repeatedly
    const toolCalls = [];
    for (let i = 0; i < 10; i++) {
      toolCalls.push({
        tool: 'read_file',
        parameters: { file_path: 'test.txt' },
      });
    }

    const arbitration = this.arbitrateToolSequence(toolCalls);

    // Should detect loop and break
    return arbitration.loopDetected === true && arbitration.broken === true;
  }

  async testModelBypassingResolveTool() {
    // Simulate model trying to bypass resolve_tool
    const toolCall = {
      tool: 'write_file',
      parameters: { file: 'sensitive.txt', content: 'secret' },
      bypassAttempt: true,
    };

    const arbitration = this.arbitrateToolCall(toolCall);

    // Should catch bypass attempt
    return arbitration.enforced === true && arbitration.correction === 'bypass-attempt-blocked';
  }

  // Arbitration logic
  arbitrateToolCall(toolCall) {
    const result = {
      enforced: false,
      correction: null,
      message: null,
    };

    // Check if tool exists
    const validTools = ['read_file', 'write_file', 'edit', 'search', 'resolve_tool'];

    // Check for tool refusal BEFORE invalid tool check
    if (toolCall.tool === null && toolCall.reason) {
      result.enforced = true;
      result.correction = 'tool-refusal-escalated';
      result.message = 'Tool refusal escalated to enforcement';
      return result;
    }

    if (!toolCall.tool || !validTools.includes(toolCall.tool)) {
      result.enforced = true;
      result.correction = 'invalid-tool-name';
      result.message = 'Tool does not exist. Valid tools: ' + validTools.join(', ');
      return result;
    }

    // Check if instruction was ignored
    if (toolCall.instructionIgnored) {
      result.enforced = true;
      result.correction = 'instruction-enforced';
      result.message = 'Instructions must be followed';
      return result;
    }

    // Check for bypass attempts
    if (toolCall.bypassAttempt) {
      result.enforced = true;
      result.correction = 'bypass-attempt-blocked';
      result.message = 'Bypass attempt blocked';
      return result;
    }

    // Validate parameters
    const validation = this.validateParameters(toolCall.tool, toolCall.parameters);
    if (!validation.valid) {
      result.enforced = true;
      result.correction = validation.error;
      result.message = validation.message;
      return result;
    }

    // Check if tool is appropriate for task
    if (toolCall.context) {
      const appropriateness = this.checkToolAppropriateness(toolCall.tool, toolCall.context.task);
      if (!appropriateness.appropriate) {
        result.enforced = true;
        result.correction = 'wrong-tool-for-task';
        result.message = 'Suggested tool: ' + appropriateness.suggested;
        return result;
      }
    }

    return result;
  }

  arbitrateToolSequence(toolCalls) {
    const result = {
      loopDetected: false,
      broken: false,
      message: null,
    };

    // Detect loops
    const callCounts = {};
    for (const call of toolCalls) {
      const key = call.tool + JSON.stringify(call.parameters);
      callCounts[key] = (callCounts[key] || 0) + 1;

      if (callCounts[key] > 3) {
        result.loopDetected = true;
        result.broken = true;
        result.message = 'Loop detected: tool called ' + callCounts[key] + ' times';
        return result;
      }
    }

    return result;
  }

  validateParameters(tool, parameters) {
    const schemas = {
      read_file: {
        required: ['file_path'],
        types: { file_path: 'string' },
      },
      write_file: {
        required: ['file', 'content'],
        types: { file: 'string', content: 'string' },
      },
      edit: {
        required: ['file_path', 'old_string', 'new_string'],
        types: { file_path: 'string', old_string: 'string', new_string: 'string' },
      },
      search: {
        required: ['query'],
        types: { query: 'string' },
      },
      resolve_tool: {
        required: [],
        types: {},
      },
    };

    const schema = schemas[tool];
    if (!schema) {
      return { valid: true };
    }

    // Check required parameters
    for (const required of schema.required) {
      if (
        !(required in parameters) ||
        parameters[required] === null ||
        parameters[required] === undefined
      ) {
        return {
          valid: false,
          error: 'missing-parameters',
          message: 'Missing required parameter: ' + required,
        };
      }
    }

    // Check parameter types
    for (const [param, expectedType] of Object.entries(schema.types)) {
      if (param in parameters) {
        const actualType = typeof parameters[param];
        if (actualType !== expectedType) {
          return {
            valid: false,
            error: 'invalid-parameter-type',
            message: `Parameter ${param} should be ${expectedType}, got ${actualType}`,
          };
        }
      }
    }

    return { valid: true };
  }

  checkToolAppropriateness(tool, task) {
    const toolTaskMap = {
      read_file: ['read', 'view', 'inspect', 'examine'],
      write_file: ['write', 'create', 'save', 'output'],
      edit: ['modify', 'change', 'update', 'refactor'],
      search: ['find', 'search', 'locate', 'grep'],
    };

    const appropriateTasks = toolTaskMap[tool];
    if (!appropriateTasks) {
      return { appropriate: true };
    }

    const taskLower = task.toLowerCase();
    const isAppropriate = appropriateTasks.some((t) => taskLower.includes(t));

    if (!isAppropriate) {
      // Suggest appropriate tool
      for (const [suggestedTool, tasks] of Object.entries(toolTaskMap)) {
        if (tasks.some((t) => taskLower.includes(t))) {
          return { appropriate: false, suggested: suggestedTool };
        }
      }
    }

    return { appropriate: true };
  }
}

export default ToolArbitrationTest;
