/**
 * MCP Tool: Run Harness Scenario
 *
 * Allows AI to programmatically run harness scenarios and get results.
 */

import ScenarioRunner from './scenario-runner.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runHarnessScenario(scenarioName) {
  const configDir = path.join(__dirname, '..', 'config');
  const logDir = path.join(__dirname, '..', 'logs');
  const reportDir = path.join(__dirname, '..', 'reports');

  const runner = new ScenarioRunner(configDir, logDir, reportDir);

  try {
    const result = await runner.runScenario(scenarioName);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error running scenario: ' + error.message,
        },
      ],
      isError: true,
    };
  }
}
