import * as vscode from 'vscode';
import * as os from 'os';

class MetricsManager {
  constructor() {
    // Configuration disabled in public build
    this.enabled = false;
    this.endpoint = '';
    this.format = 'prometheus';
    
    this.metrics = new Map();
    this.counters = new Map();
    this.gauges = new Map();
    this.histograms = new Map();
    
    this.startTime = Date.now();
    this.initialize();
  }

  initialize() {
    if (!this.enabled) {
      return;
    }
    
    // Initialize default metrics
    this.registerCounter('sweobeyme_operations_total', 'Total number of operations');
    this.registerCounter('sweobeyme_errors_total', 'Total number of errors');
    this.registerCounter('sweobeyme_checkpoints_created', 'Total checkpoints created');
    this.registerCounter('sweobeyme_checkpoints_reverted', 'Total checkpoints reverted');
    this.registerCounter('sweobeyme_files_written', 'Total files written');
    this.registerCounter('sweobeyme_tool_calls_total', 'Total tool calls');
    
    this.registerGauge('sweobeyme_active_operations', 'Number of active operations');
    this.registerGauge('sweobeyme_memory_usage_bytes', 'Memory usage in bytes');
    this.registerGauge('sweobeyme_uptime_seconds', 'Uptime in seconds');
    
    this.registerHistogram('sweobeyme_operation_duration_seconds', 'Operation duration in seconds', [0.1, 0.5, 1, 2, 5, 10]);
    this.registerHistogram('sweobeyme_file_size_bytes', 'File size in bytes', [1024, 10240, 102400, 1048576, 10485760]);
    
    // Start metrics collection interval
    this.startCollectionInterval();
  }

  registerCounter(name, help) {
    this.counters.set(name, {
      name,
      help,
      value: 0,
      labels: new Map(),
    });
  }

  registerGauge(name, help) {
    this.gauges.set(name, {
      name,
      help,
      value: 0,
      labels: new Map(),
    });
  }

  registerHistogram(name, help, buckets) {
    this.histograms.set(name, {
      name,
      help,
      buckets,
      samples: [],
      sum: 0,
      count: 0,
    });
  }

  incrementCounter(name, labels = {}, value = 1) {
    if (!this.counters.has(name)) {
      return;
    }
    
    const counter = this.counters.get(name);
    const labelKey = JSON.stringify(labels);
    
    if (!counter.labels.has(labelKey)) {
      counter.labels.set(labelKey, { labels, value: 0 });
    }
    
    counter.labels.get(labelKey).value += value;
    counter.value += value;
  }

  setGauge(name, value, labels = {}) {
    if (!this.gauges.has(name)) {
      return;
    }
    
    const gauge = this.gauges.get(name);
    const labelKey = JSON.stringify(labels);
    
    if (!gauge.labels.has(labelKey)) {
      gauge.labels.set(labelKey, { labels, value: 0 });
    }
    
    gauge.labels.get(labelKey).value = value;
    gauge.value = value;
  }

  observeHistogram(name, value, labels = {}) {
    if (!this.histograms.has(name)) {
      return;
    }
    
    const histogram = this.histograms.get(name);
    
    histogram.samples.push({ value, labels, timestamp: Date.now() });
    histogram.sum += value;
    histogram.count += 1;
    
    // Keep only last 1000 samples
    if (histogram.samples.length > 1000) {
      histogram.samples.shift();
    }
  }

  startCollectionInterval() {
    setInterval(() => {
      this.collectSystemMetrics();
    }, 60000); // Collect every minute
  }

  collectSystemMetrics() {
    const memoryUsage = process.memoryUsage();
    this.setGauge('sweobeyme_memory_usage_bytes', memoryUsage.heapUsed);
    this.setGauge('sweobeyme_uptime_seconds', (Date.now() - this.startTime) / 1000);
  }

  recordOperation(operation, duration, success) {
    this.incrementCounter('sweobeyme_operations_total', { operation, success: String(success) });
    this.observeHistogram('sweobeyme_operation_duration_seconds', duration, { operation });
    
    if (!success) {
      this.incrementCounter('sweobeyme_errors_total', { operation });
    }
  }

  recordCheckpoint(action, name) {
    if (action === 'create') {
      this.incrementCounter('sweobeyme_checkpoints_created', { name });
    } else if (action === 'revert') {
      this.incrementCounter('sweobeyme_checkpoints_reverted', { name });
    }
  }

  recordFileWrite(filePath, size) {
    this.incrementCounter('sweobeyme_files_written', { extension: this.getExtension(filePath) });
    this.observeHistogram('sweobeyme_file_size_bytes', size, { extension: this.getExtension(filePath) });
  }

  recordToolCall(toolName, success) {
    this.incrementCounter('sweobeyme_tool_calls_total', { tool: toolName, success: String(success) });
  }

  getExtension(filePath) {
    const parts = filePath.split('.');
    return parts.length > 1 ? parts.pop() : 'unknown';
  }

  exportPrometheus() {
    let output = '';
    
    // Export counters
    for (const [name, counter] of this.counters.entries()) {
      output += `# HELP ${name} ${counter.help}\n`;
      output += `# TYPE ${name} counter\n`;
      
      for (const [labelKey, data] of counter.labels.entries()) {
        const labels = this.formatLabels(data.labels);
        output += `${name}${labels} ${data.value}\n`;
      }
    }
    
    // Export gauges
    for (const [name, gauge] of this.gauges.entries()) {
      output += `# HELP ${name} ${gauge.help}\n`;
      output += `# TYPE ${name} gauge\n`;
      
      for (const [labelKey, data] of gauge.labels.entries()) {
        const labels = this.formatLabels(data.labels);
        output += `${name}${labels} ${data.value}\n`;
      }
    }
    
    // Export histograms
    for (const [name, histogram] of this.histograms.entries()) {
      output += `# HELP ${name} ${histogram.help}\n`;
      output += `# TYPE ${name} histogram\n`;
      
      // Calculate bucket counts
      const bucketCounts = {};
      histogram.buckets.forEach(bucket => bucketCounts[bucket] = 0);
      
      for (const sample of histogram.samples) {
        for (const bucket of histogram.buckets) {
          if (sample.value <= bucket) {
            bucketCounts[bucket]++;
          }
        }
      }
      
      // Export bucket metrics
      for (const [labelKey, data] of histogram.labels.entries()) {
        const labels = this.formatLabels(data.labels);
        
        for (const bucket of histogram.buckets) {
          output += `${name}_bucket{le="${bucket}"${labels}} ${bucketCounts[bucket]}\n`;
        }
        
        output += `${name}_bucket{le="+Inf"${labels}} ${histogram.count}\n`;
        output += `${name}_sum${labels} ${histogram.sum}\n`;
        output += `${name}_count${labels} ${histogram.count}\n`;
      }
    }
    
    return output;
  }

  exportJSON() {
    const output = {
      counters: {},
      gauges: {},
      histograms: {},
    };
    
    for (const [name, counter] of this.counters.entries()) {
      output.counters[name] = {
        help: counter.help,
        value: counter.value,
        byLabels: Object.fromEntries(
          Array.from(counter.labels.entries()).map(([k, v]) => [k, v.value])
        ),
      };
    }
    
    for (const [name, gauge] of this.gauges.entries()) {
      output.gauges[name] = {
        help: gauge.help,
        value: gauge.value,
        byLabels: Object.fromEntries(
          Array.from(gauge.labels.entries()).map(([k, v]) => [k, v.value])
        ),
      };
    }
    
    for (const [name, histogram] of this.histograms.entries()) {
      output.histograms[name] = {
        help: histogram.help,
        sum: histogram.sum,
        count: histogram.count,
        buckets: histogram.buckets,
        samples: histogram.samples.slice(0, 100), // Limit samples
      };
    }
    
    return output;
  }

  exportInfluxDB() {
    const lines = [];
    
    for (const [name, counter] of this.counters.entries()) {
      for (const [labelKey, data] of counter.labels.entries()) {
        const tags = this.formatInfluxTags(data.labels);
        lines.push(`${name}${tags} value=${data.value} ${Date.now()}000000`);
      }
    }
    
    for (const [name, gauge] of this.gauges.entries()) {
      for (const [labelKey, data] of gauge.labels.entries()) {
        const tags = this.formatInfluxTags(data.labels);
        lines.push(`${name}${tags} value=${data.value} ${Date.now()}000000`);
      }
    }
    
    return lines.join('\n');
  }

  formatLabels(labels) {
    if (Object.keys(labels).length === 0) {
      return '';
    }
    
    const labelPairs = Object.entries(labels).map(([k, v]) => `${k}="${v}"`);
    return `{${labelPairs.join(',')}}`;
  }

  formatInfluxTags(labels) {
    if (Object.keys(labels).length === 0) {
      return '';
    }
    
    const tagPairs = Object.entries(labels).map(([k, v]) => `${k}=${v}`);
    return `,${tagPairs.join(',')}`;
  }

  async exportMetrics() {
    if (!this.enabled || !this.endpoint) {
      return;
    }
    
    let data;
    let contentType;
    
    switch (this.format) {
      case 'prometheus':
        data = this.exportPrometheus();
        contentType = 'text/plain; version=0.0.4';
        break;
      case 'json':
        data = JSON.stringify(this.exportJSON());
        contentType = 'application/json';
        break;
      case 'influxdb':
        data = this.exportInfluxDB();
        contentType = 'text/plain';
        break;
      default:
        return;
    }
    
    // In a real implementation, this would send data to the endpoint
    // For now, we just log it
    console.log(`[MetricsManager] Would export metrics to ${this.endpoint}`);
  }

  getMetricsSummary() {
    return {
      operations: this.counters.get('sweobeyme_operations_total')?.value || 0,
      errors: this.counters.get('sweobeyme_errors_total')?.value || 0,
      checkpointsCreated: this.counters.get('sweobeyme_checkpoints_created')?.value || 0,
      checkpointsReverted: this.counters.get('sweobeyme_checkpoints_reverted')?.value || 0,
      filesWritten: this.counters.get('sweobeyme_files_written')?.value || 0,
      toolCalls: this.counters.get('sweobeyme_tool_calls_total')?.value || 0,
      memoryUsage: this.gauges.get('sweobeyme_memory_usage_bytes')?.value || 0,
      uptime: this.gauges.get('sweobeyme_uptime_seconds')?.value || 0,
    };
  }

  reset() {
    for (const counter of this.counters.values()) {
      counter.value = 0;
      counter.labels.clear();
    }
    
    for (const histogram of this.histograms.values()) {
      histogram.samples = [];
      histogram.sum = 0;
      histogram.count = 0;
    }
  }
}

class HealthCheckManager {
  constructor() {
    // Configuration disabled in public build
    this.enabled = true;
    this.interval = 60;
    
    this.checks = new Map();
    this.lastResults = new Map();
    this.intervalId = null;
    
    this.initialize();
  }

  initialize() {
    if (!this.enabled) {
      return;
    }
    
    // Register default health checks
    this.registerCheck('memory', 'Memory usage check', () => this.checkMemory());
    this.registerCheck('disk', 'Disk space check', () => this.checkDisk());
    this.registerCheck('mcp_connection', 'MCP connection check', () => this.checkMCPConnection());
    this.registerCheck('configuration', 'Configuration check', () => this.checkConfiguration());
    
    // Start health check interval
    this.startHealthCheckInterval();
  }

  registerCheck(id, name, checkFunction) {
    this.checks.set(id, {
      id,
      name,
      check: checkFunction,
    });
  }

  async runCheck(id) {
    const check = this.checks.get(id);
    if (!check) {
      return { id, status: 'unknown', error: 'Check not found' };
    }
    
    try {
      const result = await check.check();
      this.lastResults.set(id, {
        id,
        name: check.name,
        status: result.healthy ? 'healthy' : 'unhealthy',
        message: result.message,
        timestamp: new Date().toISOString(),
      });
      
      return this.lastResults.get(id);
    } catch (error) {
      this.lastResults.set(id, {
        id,
        name: check.name,
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString(),
      });
      
      return this.lastResults.get(id);
    }
  }

  async runAllChecks() {
    const results = [];
    
    for (const id of this.checks.keys()) {
      const result = await this.runCheck(id);
      results.push(result);
    }
    
    return results;
  }

  startHealthCheckInterval() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    this.intervalId = setInterval(() => {
      this.runAllChecks();
    }, this.interval * 1000);
  }

  stopHealthCheckInterval() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  checkMemory() {
    const memoryUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const usagePercent = (memoryUsage.heapUsed / totalMemory) * 100;
    
    if (usagePercent > 90) {
      return {
        healthy: false,
        message: `Memory usage critical: ${usagePercent.toFixed(2)}%`,
      };
    } else if (usagePercent > 75) {
      return {
        healthy: true,
        message: `Memory usage high: ${usagePercent.toFixed(2)}%`,
      };
    }
    
    return {
      healthy: true,
      message: `Memory usage normal: ${usagePercent.toFixed(2)}%`,
    };
  }

  checkDisk() {
    try {
      const fs = require('fs');
      const os = require('os');
      
      const platform = os.platform();
      let freeSpace = 0;
      let totalSpace = 0;
      
      if (platform === 'win32') {
        // Windows: use exec to run wmic
        const { execSync } = require('child_process');
        const output = execSync('wmic logicaldisk get size,freespace', { encoding: 'utf8' });
        const lines = output.split('\n').filter(line => line.trim());
        if (lines.length > 1) {
          const values = lines[1].trim().split(/\s+/);
          if (values.length >= 2) {
            freeSpace = parseInt(values[0]) || 0;
            totalSpace = parseInt(values[1]) || 0;
          }
        }
      } else {
        // Unix-like: use statfs
        const stats = fs.statSyncSync ? fs.statSyncSync('/') : fs.statSync('/');
        if (stats && stats.blocks && stats.bavail && stats.bsize) {
          totalSpace = stats.blocks * stats.bsize;
          freeSpace = stats.bavail * stats.bsize;
        }
      }
      
      if (totalSpace === 0) {
        return {
          healthy: true,
          message: 'Unable to determine disk space',
        };
      }
      
      const freePercent = (freeSpace / totalSpace) * 100;
      const healthy = freePercent > 10; // Less than 10% free is unhealthy
      
      return {
        healthy,
        message: `Disk space: ${(freeSpace / (1024 ** 3)).toFixed(2)} GB free of ${(totalSpace / (1024 ** 3)).toFixed(2)} GB (${freePercent.toFixed(1)}%)`,
      };
    } catch (error) {
      return {
        healthy: true,
        message: `Disk space check unavailable: ${error.message}`,
      };
    }
  }

  checkMCPConnection() {
    try {
      // Check if MCP server is running by checking the process
      const { spawn } = require('child_process');
      const os = require('os');
      
      return new Promise((resolve) => {
        const platform = os.platform();
        let command;
        
        if (platform === 'win32') {
          command = 'tasklist';
        } else {
          command = 'ps aux';
        }
        
        const proc = spawn(command, [], { shell: true });
        let output = '';
        
        proc.stdout.on('data', (data) => {
          output += data.toString();
        });
        
        proc.on('close', (code) => {
          // Check if node process is running (MCP server runs in node)
          const hasNode = output.toLowerCase().includes('node');
          
          resolve({
            healthy: hasNode,
            message: hasNode ? 'Node processes detected (MCP server likely running)' : 'No Node processes detected (MCP server may not be running)',
          });
        });
        
        proc.on('error', () => {
          resolve({
            healthy: true,
            message: 'Unable to check MCP connection status',
          });
        });
      });
    } catch (error) {
      return {
        healthy: true,
        message: `MCP connection check unavailable: ${error.message}`,
      };
    }
  }

  checkConfiguration() {
    try {
      const config = vscode.workspace.getConfiguration('sweObeyMe');
      return {
        healthy: true,
        message: 'Configuration valid',
      };
    } catch (error) {
      return {
        healthy: false,
        message: `Configuration error: ${error.message}`,
      };
    }
  }

  getLastResult(id) {
    return this.lastResults.get(id);
  }

  getAllLastResults() {
    return Array.from(this.lastResults.values());
  }

  getOverallHealth() {
    const results = this.getAllLastResults();
    
    if (results.length === 0) {
      return { status: 'unknown', message: 'No health checks run' };
    }
    
    const unhealthy = results.filter(r => r.status === 'unhealthy' || r.status === 'error');
    
    if (unhealthy.length === 0) {
      return { status: 'healthy', message: 'All checks passing' };
    } else if (unhealthy.length < results.length) {
      return { 
        status: 'degraded', 
        message: `${unhealthy.length} of ${results.length} checks failing` 
      };
    } else {
      return { status: 'unhealthy', message: 'All checks failing' };
    }
  }
}

export { MetricsManager, HealthCheckManager };
