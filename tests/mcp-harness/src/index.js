/**
 * CLI Entry Point
 *
 * Command-line interface for the MCP harness.
 * Usage: node index.js --scenario <name> [--spawn-profile <path>] [--verbose] [--report-dir <dir>]
 */

import { parseArgs } from 'node:util';
import path from 'path';
import { fileURLToPath } from 'url';
import Logger from './logger.js';
import ServerSpawner from './server-spawner.js';
import MCPClient from './mcp-client.js';
import TransportMonitor from './transport-monitor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse CLI arguments
const { values } = parseArgs({
  options: {
    scenario: { type: 'string' },
    'spawn-profile': { type: 'string' },
    verbose: { type: 'boolean', default: false },
    'report-dir': { type: 'string' },
  },
});

const scenarioName = values.scenario || 'source-directory';
const spawnProfilePath = values['spawn-profile'];
const verbose = values.verbose;
const reportDir = values['report-dir'] || path.join(__dirname, '..', 'reports');
const logDir = path.join(__dirname, '..', 'logs');

console.log('MCP Harness - Scenario: ' + scenarioName);
if (spawnProfilePath) {
  console.log('Spawn profile: ' + spawnProfilePath);
}
console.log('Log directory: ' + logDir);
console.log('Report directory: ' + reportDir);
console.log('');

// Initialize logger
const logger = new Logger(logDir, scenarioName);
logger.init();

// Initialize spawner
const spawner = new ServerSpawner(logger);

async function runScenario() {
  try {
    logger.info('cli', 'start', { scenario: scenarioName, spawnProfile: spawnProfilePath });

    let spawnProfile = null;
    let serverPath, cwd;

    if (spawnProfilePath) {
      // Load spawn profile
      spawnProfile = spawner.loadSpawnProfile(spawnProfilePath);
      serverPath = spawnProfile.args[0]; // First arg is server path
      cwd = spawnProfile.cwd;
    } else {
      // Use local build path for testing
      serverPath = path.join(__dirname, '..', '..', '..', 'dist', 'mcp', 'server.js');
      cwd = path.join(__dirname, '..', '..', '..');

      if (scenarioName === 'external-directory') {
        cwd = 'D:/ARES';
      }
    }

    // Spawn server
    const { process, stdin, stdout, stderr } = spawner.spawn(serverPath, cwd, {}, spawnProfile);
    logger.info('cli', 'spawn_complete', { pid: process.pid });

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

    // Run MCP sequence
    logger.info('cli', 'mcp_sequence_start', {});

    const initResult = await client.initialize();
    logger.info('cli', 'initialize_complete', initResult);

    const toolsResult = await client.listTools();
    logger.info('cli', 'list_tools_complete', {
      toolCount: toolsResult.tools ? toolsResult.tools.length : 0,
    });

    // Call get_server_diagnostics
    const diagResult = await client.callTool('get_server_diagnostics');
    logger.info('cli', 'diagnostics_complete', diagResult);

    // Shutdown
    await client.shutdown();
    logger.info('cli', 'shutdown_complete', {});

    // Stop monitor
    monitor.stop();

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

    logger.info('cli', 'metrics', allMetrics);

    console.log('');
    console.log('Harness test complete.');
    console.log('Metrics: ' + JSON.stringify(allMetrics, null, 2));

    // Check for errors
    const errorCodes = monitor.getErrorCodes();
    if (errorCodes.length > 0) {
      console.log('');
      console.log('Error codes detected: ' + errorCodes.join(', '));
      process.exit(1);
    }
  } catch (error) {
    logger.error('cli', 'fatal_error', { message: error.message, stack: error.stack });
    logger.close();
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

runScenario();
