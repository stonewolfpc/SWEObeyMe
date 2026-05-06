/**
 * Scenario Runner
 *
 * Executes config-driven test scenarios.
 * Loads scenario JSON from config/scenarios/.
 * Sets up environment (cwd, PATH, env vars).
 * Spawns server via server-spawner.js.
 * Runs MCP client sequence.
 * Captures all metrics via transport-monitor.js.
 * Logs structured output via logger.js.
 */

import fs from 'fs';
import path from 'path';
import Logger from './logger.js';
import ServerSpawner from './server-spawner.js';
import MCPClient from './mcp-client.js';
import TransportMonitor from './transport-monitor.js';

class ScenarioRunner {
  constructor(configDir, logDir, reportDir) {
    this.configDir = configDir;
    this.logDir = logDir;
    this.reportDir = reportDir;
  }

  /**
   * Load scenario from JSON file
   */
  loadScenario(scenarioName) {
    const scenarioPath = path.join(this.configDir, 'scenarios', scenarioName + '.json');

    try {
      const raw = fs.readFileSync(scenarioPath, 'utf8');
      return JSON.parse(raw);
    } catch (error) {
      throw new Error('Failed to load scenario: ' + scenarioName + ' - ' + error.message);
    }
  }

  /**
   * Run a scenario
   */
  async runScenario(scenarioName) {
    const scenario = this.loadScenario(scenarioName);

    const logger = new Logger(this.logDir, scenario.name);
    logger.init();

    logger.info('runner', 'scenario_start', {
      name: scenario.name,
      description: scenario.description,
      cwd: scenario.cwd,
      serverPath: scenario.serverPath,
    });

    const spawner = new ServerSpawner(logger);
    const results = {
      steps: [],
      passed: true,
      errorCodes: [],
    };

    try {
      // Resolve absolute paths
      const serverPath = path.isAbsolute(scenario.serverPath)
        ? scenario.serverPath
        : path.join(process.cwd(), scenario.serverPath);

      const cwd = scenario.cwd;

      // Spawn server
      logger.info('runner', 'spawn_start', { serverPath, cwd });
      const { process, stdin, stdout, stderr } = spawner.spawn(serverPath, cwd);
      logger.info('runner', 'spawn_success', { pid: process.pid });

      // Initialize transport monitor
      const monitor = new TransportMonitor(stdout, stderr, logger, {
        stdoutStarvationThresholdMs: 10000,
        stderrStarvationThresholdMs: 15000,
        timingAnomalyThresholdMs: 5000,
      });
      monitor.start();

      // Initialize MCP client
      const client = new MCPClient(stdin, stdout, logger);

      // Wait for server to be ready
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Run sequence
      for (const step of scenario.sequence) {
        const stepResult = await this._runStep(step, client, logger);
        results.steps.push(stepResult);

        if (!stepResult.passed) {
          results.passed = false;
        }
      }

      // Shutdown
      try {
        await client.shutdown();
      } catch (error) {
        logger.warn('runner', 'shutdown_failed', { error: error.message });
      }

      // Stop monitor
      monitor.stop();
      results.errorCodes = monitor.getErrorCodes();

      // Kill server
      spawner.kill();

      // Get metrics
      const spawnerMetrics = spawner.getMetrics();
      const clientMetrics = client.getMetrics();
      const monitorMetrics = monitor.getMetrics();
      const loggerMetrics = logger.close();

      const allMetrics = {
        spawner: spawnerMetrics,
        client: clientMetrics,
        monitor: monitorMetrics,
        logger: loggerMetrics,
      };

      logger.info('runner', 'scenario_complete', {
        passed: results.passed,
        errorCodes: results.errorCodes,
        metrics: allMetrics,
      });

      return {
        scenario: scenario.name,
        passed: results.passed,
        errorCodes: results.errorCodes,
        steps: results.steps,
        metrics: allMetrics,
      };
    } catch (error) {
      logger.error('runner', 'scenario_error', {
        message: error.message,
        stack: error.stack,
      });
      logger.close();

      return {
        scenario: scenario.name,
        passed: false,
        errorCodes: ['SCENARIO_FATAL_ERROR'],
        error: error.message,
      };
    }
  }

  /**
   * Run a single step
   */
  async _runStep(step, client, logger) {
    const timeout = step.timeout || 30000;
    const startTime = Date.now();

    logger.info('runner', 'step_start', {
      action: step.action,
      tool: step.tool,
      timeout,
    });

    try {
      let result;

      switch (step.action) {
        case 'initialize':
          result = await client.initialize();
          break;
        case 'list_tools':
          result = await client.listTools();
          break;
        case 'call_tool':
          result = await client.callTool(step.tool, step.args);
          break;
        case 'shutdown':
          result = await client.shutdown();
          break;
        default:
          throw new Error('Unknown action: ' + step.action);
      }

      const duration = Date.now() - startTime;

      logger.info('runner', 'step_success', {
        action: step.action,
        duration,
      });

      return {
        action: step.action,
        passed: true,
        duration,
        result,
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error('runner', 'step_failed', {
        action: step.action,
        duration,
        error: error.message,
      });

      return {
        action: step.action,
        passed: false,
        duration,
        error: error.message,
      };
    }
  }
}

export default ScenarioRunner;
