# SWEObeyMe Enterprise Features

## Overview

SWEObeyMe now includes comprehensive enterprise-grade features that enable organizations to deploy and manage the extension at scale. All enterprise features are configurable and can be enabled/disabled independently to suit your organization's needs.

## Enabling Enterprise Features

To enable enterprise features, set the following configuration in your VS Code settings:

```json
{
  "sweObeyMe.enterprise.enabled": true
}
```

By default, enterprise features are disabled to maintain backward compatibility and ensure the extension works seamlessly for individual users.

## Enterprise Features

### 1. Role-Based Access Control (RBAC)

**Configuration:**

- `sweObeyMe.enterprise.rbac.enabled` - Enable RBAC system
- `sweObeyMe.enterprise.rbac.defaultRole` - Default role for new users (admin, user, readonly)
- `sweObeyMe.enterprise.rbac.permissions` - Custom role permissions configuration

**Features:**

- Granular permission management across all extension features
- Pre-defined roles: Admin (full access), User (standard access), Read Only (read-only access)
- Custom role creation with specific permissions
- User-group assignment support
- Permission checking for all operations
- Audit logging of all permission checks

**Default Permissions:**

- **Admin**: Full system access including configuration changes, role management, and all operations
- **User**: Standard access to checkpoints, diff review, tool usage (file, terminal, network)
- **Read Only**: Read-only access to attribution, analytics, checkpoints, and diff review

**Usage:**

```javascript
// Check if user has permission
const hasPermission = rbacManager.hasPermission(userId, 'checkpoint.create');

// Assign role to user
rbacManager.setUserRole(userId, 'admin');

// Create custom role
rbacManager.createRole(
  'custom-role',
  ['checkpoint.create', 'file.write'],
  'Custom role description'
);
```

### 2. Audit Logging

**Configuration:**

- `sweObeyMe.enterprise.auditLogging.enabled` - Enable audit logging
- `sweObeyMe.enterprise.auditLogging.directory` - Directory for audit logs
- `sweObeyMe.enterprise.auditLogging.retentionDays` - Retention period (default: 90 days)
- `sweObeyMe.enterprise.auditLogging.logLevel` - Log level (debug, info, warn, error)

**Features:**

- Comprehensive logging of all surgical operations
- Structured JSONL format for easy parsing
- Automatic log rotation based on retention policy
- Export capabilities for compliance reporting
- Search functionality across logs
- Support for multiple log levels

**Logged Events:**

- Checkpoint operations (create, revert, delete)
- File writes with line counts
- Tool usage with success/failure status
- Permission checks
- Configuration changes
- Role changes
- SSO logins
- Errors with stack traces

**Usage:**

```javascript
// Log checkpoint creation
auditLogger.logCheckpointCreate(userId, checkpointId, name);

// Export logs for a date range
const logs = await auditLogger.exportLogs(startDate, endDate);

// Search logs
const results = await auditLogger.searchLogs('checkpoint.create');
```

### 3. Encryption

**Configuration:**

- `sweObeyMe.enterprise.encryption.enabled` - Enable encryption for sensitive data
- `sweObeyMe.enterprise.encryption.algorithm` - Encryption algorithm (default: aes-256-gcm)
- `sweObeyMe.enterprise.encryption.keyRotationDays` - Key rotation period (default: 90 days)

**Features:**

- AES-256-GCM encryption for sensitive data
- Automatic key rotation based on schedule
- Secure key storage
- Support for encrypting strings, objects, and files
- Key metadata tracking
- Backup key support for decryption

**Usage:**

```javascript
// Encrypt text
const encrypted = encryptionManager.encrypt('sensitive data');

// Decrypt text
const decrypted = encryptionManager.decrypt(encrypted);

// Encrypt object
const encryptedObj = encryptionManager.encryptObject({ key: 'value' });

// Encrypt file
await encryptionManager.encryptFile(inputPath, outputPath);
```

### 4. Policy-as-Code

**Configuration:**

- `sweObeyMe.enterprise.systemRules.enabled` - Enable system-level rules
- `sweObeyMe.enterprise.systemRules.directory` - Directory for system-level rules
- `sweObeyMe.enterprise.systemWorkflows.enabled` - Enable system-level workflows
- `sweObeyMe.enterprise.systemWorkflows.directory` - Directory for system-level workflows
- `sweObeyMe.enterprise.systemSkills.enabled` - Enable system-level skills
- `sweObeyMe.enterprise.systemSkills.directory` - Directory for system-level skills

**Features:**

- System-level rules that apply across all workspaces
- System-level workflows for organization-wide processes
- System-level skills for enterprise skills distribution
- Policy evaluation engine with condition support
- Pre-defined policy templates (SOC2, GDPR, HIPAA, ISO27001)
- Policy precedence (system > organization > workspace > user)

**System-Level Directories:**

- **macOS**: `/Library/Application Support/Windsurf/rules/`
- **Linux**: `/etc/windsurf/rules/`
- **Windows**: `C:\ProgramData\Windsurf\rules\`

**Usage:**

```javascript
// Create policy
const policyId = policyAsCodeManager.createPolicy({
  name: 'Security Policy',
  enabled: true,
  conditions: [{ field: 'operation', operator: 'equals', value: 'network' }],
  actions: [{ type: 'require_permission', parameters: { permission: 'network_access' } }],
});

// Evaluate policy
const result = policyAsCodeManager.evaluatePolicy(policyId, context);
```

### 5. Metrics and Health Checks

**Configuration:**

- `sweObeyMe.enterprise.metrics.enabled` - Enable metrics collection
- `sweObeyMe.enterprise.metrics.endpoint` - Metrics endpoint URL
- `sweObeyMe.enterprise.metrics.format` - Export format (prometheus, json, influxdb)
- `sweObeyMe.enterprise.healthChecks.enabled` - Enable health checks
- `sweObeyMe.enterprise.healthChecks.intervalSeconds` - Health check interval

**Metrics Features:**

- Prometheus-compatible metrics export
- Counter metrics for operations, errors, checkpoints
- Gauge metrics for active operations, memory usage, uptime
- Histogram metrics for operation duration, file sizes
- Multiple export formats (Prometheus, JSON, InfluxDB)

**Health Check Features:**

- Memory usage monitoring
- Disk space checks
- MCP connection verification
- Configuration validation
- Overall health status aggregation

**Usage:**

```javascript
// Record operation
metricsManager.recordOperation('file.write', duration, true);

// Get metrics summary
const summary = metricsManager.getMetricsSummary();

// Run health checks
const results = await healthCheckManager.runAllChecks();

// Get overall health
const health = healthCheckManager.getOverallHealth();
```

### 6. Rate Limiting and Quotas

**Configuration:**

- `sweObeyMe.enterprise.rateLimiting.enabled` - Enable rate limiting
- `sweObeyMe.enterprise.rateLimiting.requestsPerMinute` - Requests per minute limit
- `sweObeyMe.enterprise.quotas.enabled` - Enable quota-based limits
- `sweObeyMe.enterprise.quotas.maxOperationsPerDay` - Daily operations limit
- `sweObeyMe.enterprise.quotas.maxOperationsPerHour` - Hourly operations limit
- `sweObeyMe.enterprise.quotas.maxCheckpoints` - Maximum checkpoints per workspace

**Features:**

- Per-identifier rate limiting
- Sliding window rate limiter
- Daily and hourly quota tracking
- Per-workspace checkpoint quotas
- Automatic quota reset on schedule
- Quota usage statistics

**Usage:**

```javascript
// Check rate limit
const limit = rateLimitManager.checkRateLimit(userId);
if (!limit.allowed) {
  console.log('Rate limited, reset at:', limit.resetAt);
}

// Check quota
const quota = quotaManager.checkDailyQuota(userId);
if (!quota.allowed) {
  console.log('Quota exceeded, reset at:', quota.resetAt);
}

// Get quota summary
const summary = quotaManager.getQuotaSummary(userId, workspaceId);
```

### 7. API Key Management

**Configuration:**

- `sweObeyMe.enterprise.apiKeys.enabled` - Enable API key management
- `sweObeyMe.enterprise.apiKeys.rotationDays` - Key rotation period (default: 30 days)

**Features:**

- Secure API key generation
- Automatic key rotation based on schedule
- Scope-based access control
- Key revocation capability
- Encrypted key storage
- Key usage tracking

**Usage:**

```javascript
// Create API key
const { id, secret, expiresAt } = await apiKeyManager.createApiKey('My Key', ['read', 'write']);

// Validate key
const validation = apiKeyManager.validateKey(secret);

// Rotate key
const newKey = await apiKeyManager.rotateKey(id);

// Revoke key
await apiKeyManager.revokeKey(id);
```

### 8. Backup and Restore

**Configuration:**

- `sweObeyMe.enterprise.disasterRecovery.enabled` - Enable disaster recovery
- `sweObeyMe.enterprise.disasterRecovery.backupSchedule` - Backup schedule (hourly, daily, weekly)
- `sweObeyMe.enterprise.disasterRecovery.retentionDays` - Backup retention period

**Features:**

- Scheduled automated backups
- Configuration backup
- Checkpoint backup
- Policy backup
- API key backup (encrypted)
- Enterprise-grade encryption for backups
- Atomic writes to prevent corruption
- Backup listing and management
- Restore from specific backup point

**Usage:**

```javascript
// Create backup
const backupId = await backupManager.createBackup();

// List backups
const backups = backupManager.listBackups();

// Restore backup
await backupManager.restoreBackup(backupId);

// Delete backup
await backupManager.deleteBackup(backupId);
```

### 9. Compliance Reporting

**Configuration:**

- `sweObeyMe.enterprise.compliance.enabled` - Enable compliance reporting
- `sweObeyMe.enterprise.compliance.standards` - Compliance standards (SOC2, GDPR, HIPAA, ISO27001)
- `sweObeyMe.enterprise.compliance.reportSchedule` - Report generation schedule

**Features:**

- SOC2 compliance checks
- GDPR compliance checks
- HIPAA compliance checks
- ISO27001 compliance checks
- Automated report generation
- Multiple export formats (JSON, CSV, HTML)
- Compliance scoring
- Report history tracking

**Compliance Checks:**

- **SOC2**: Encryption, audit logging, RBAC, log retention
- **GDPR**: Data encryption, processing records, retention policy
- **HIPAA**: Encryption at rest, audit trail, access controls
- **ISO27001**: Security policy, access control, asset management

**Usage:**

```javascript
// Generate compliance report
const report = await complianceManager.generateReport();

// Get compliance score
const score = complianceManager.getComplianceScore('SOC2');

// Export report
const html = complianceManager.exportReport(reportId, 'html');
```

### 10. Webhook Integrations

**Configuration:**

- `sweObeyMe.enterprise.webhooks.enabled` - Enable webhook notifications
- `sweObeyMe.enterprise.webhooks.endpoints` - Webhook endpoint configurations

**Features:**

- Event-driven webhook notifications
- HMAC signature verification
- Event filtering
- Retry logic
- Webhook testing
- Event queue processing

**Supported Events:**

- `checkpoint.action` - Checkpoint operations
- `file.action` - File operations
- `tool.execution` - Tool usage
- `error.occurred` - Error events
- `compliance.report` - Compliance reports
- `audit.log` - Audit log entries
- `configuration.changed` - Configuration changes
- `rbac.action` - RBAC operations
- `backup.action` - Backup operations
- `quota.limit` - Quota limit events

**Usage:**

```javascript
// Register webhook
const webhookId = webhookManager.registerWebhook({
  url: 'https://example.com/webhook',
  events: ['checkpoint.action', 'file.action'],
  secret: 'webhook-secret',
});

// Emit event
webhookManager.emitCheckpointEvent('create', checkpointData);

// Test webhook
await webhookManager.testWebhook(webhookId);
```

### 11. Configuration Inheritance

**Configuration:**

- `sweObeyMe.enterprise.configurationInheritance.enabled` - Enable configuration inheritance
- `sweObeyMe.enterprise.configurationInheritance.precedence` - Precedence order (default: system, organization, workspace, user)

**Features:**

- Multi-level configuration hierarchy
- System-level configuration
- Organization-level configuration
- Workspace-level configuration
- User-level configuration
- Configurable precedence order
- Configuration override support

**Configuration Levels:**

1. **System**: OS-specific directories (highest priority)
2. **Organization**: Per-organization configuration
3. **Workspace**: Per-workspace configuration
4. **User**: VS Code user settings (lowest priority)

**Usage:**

```javascript
// Get configuration with inheritance
const config = configInheritanceManager.getConfig('maxLines');

// Set configuration at specific level
configInheritanceManager.setConfig('maxLines', 700, 'workspace');

// Get configuration chain
const chain = configInheritanceManager.getConfigChain('maxLines');
```

### 12. Tenant Isolation

**Configuration:**

- `sweObeyMe.enterprise.multiTenant.enabled` - Enable multi-tenant isolation
- `sweObeyMe.enterprise.multiTenant.isolationLevel` - Isolation level (workspace, organization, user)

**Features:**

- Per-tenant resource isolation
- Checkpoint isolation
- Policy isolation
- Settings isolation
- Quota tracking per tenant
- Tenant metadata management
- Resource migration between tenants

**Isolation Levels:**

- **Workspace**: Isolate by workspace folder
- **Organization**: Isolate by organization ID
- **User**: Isolate by user/machine ID

**Usage:**

```javascript
// Get current tenant
const tenantId = tenantIsolationManager.getCurrentTenantId();

// Add checkpoint to tenant
tenantIsolationManager.addCheckpointToTenant(tenantId, checkpointId, checkpointData);

// Get tenant checkpoints
const checkpoints = tenantIsolationManager.getCurrentTenantCheckpoints();

// Get tenant quota usage
const usage = tenantIsolationManager.getCurrentTenantQuotaUsage();
```

### 13. Single Sign-On (SSO)

**Configuration:**

- `sweObeyMe.enterprise.sso.enabled` - Enable SSO
- `sweObeyMe.enterprise.sso.provider` - SSO provider (google, azure, okta, saml, oidc)
- `sweObeyMe.enterprise.sso.ssoUrl` - SSO URL from identity provider
- `sweObeyMe.enterprise.sso.entityId` - IdP Entity ID
- `sweObeyMe.enterprise.sso.certificate` - X509 Certificate for SAML
- `sweObeyMe.enterprise.sso.callbackUrl` - Callback URL for SSO
- `sweObeyMe.enterprise.sso.spEntityId` - SP Entity ID

**Features:**

- SAML 2.0 support
- SSO URL generation
- SAML response validation
- Session management
- User attribute extraction
- Session expiration handling
- Configuration testing

**Supported Providers:**

- Google Workspace
- Microsoft Entra ID (Azure AD)
- Okta
- Generic SAML 2.0
- OpenID Connect

**Usage:**

```javascript
// Get SSO URL
const ssoUrl = ssoManager.getSSOUrl();

// Handle SAML response
const userInfo = await ssoManager.handleSAMLResponse(samlResponse, relayState);

// Create session
const sessionId = ssoManager.createSession(userInfo);

// Validate session
const validation = ssoManager.validateSession(sessionId);
```

### 14. Admin Dashboard

**Configuration:**

- Enterprise features must be enabled to access the dashboard

**Features:**

- Overview panel with system statistics
- RBAC management interface
- Audit log viewer with search
- Metrics visualization
- Compliance report generation
- Backup management
- API key management
- Webhook management
- Enterprise settings configuration

**Access:**

- Open the SWEObeyMe activity bar
- Click on "SWEObeyMe Admin Dashboard"
- Navigate between tabs for different features

## Deployment Guide

### Individual Users

For individual users, enterprise features are disabled by default. The extension works as before with all standard features:

- Checkpoint management
- C# Bridge diagnostics
- Provider management
- Diff review
- Permission management
- Skills marketplace

### Enterprise Deployment

For enterprise deployment:

1. **Enable Enterprise Features:**

   ```json
   {
     "sweObeyMe.enterprise.enabled": true
   }
   ```

2. **Configure Required Features:**
   - Set up RBAC roles and permissions
   - Configure audit logging directory
   - Enable encryption
   - Set up backup schedule
   - Configure compliance standards

3. **System-Level Configuration:**
   - Deploy system-level rules to the appropriate directory
   - Configure organization-level settings
   - Set up SSO integration (if required)

4. **Admin Dashboard:**
   - Use the admin dashboard to configure and monitor enterprise features
   - Generate compliance reports
   - Manage API keys and webhooks

## Security Considerations

### Encryption

- All sensitive data is encrypted using AES-256-GCM
- Keys are automatically rotated based on schedule
- Keys are stored securely in the user's home directory

### Audit Logging

- All operations are logged for compliance
- Logs are retained based on retention policy
- Logs can be exported for external analysis

### RBAC

- Least privilege principle enforced
- Custom roles can be created for specific needs
- All permission checks are logged

### SSO

- SAML 2.0 protocol support
- Session expiration handling
- Secure callback URL validation

## Troubleshooting

### Enterprise Features Not Appearing

- Verify `sweObeyMe.enterprise.enabled` is set to `true`
- Reload VS Code after changing configuration
- Check the output panel for initialization errors

### Audit Logs Not Writing

- Verify the audit log directory exists and is writable
- Check retention days configuration
- Ensure audit logging is enabled

### Encryption Errors

- Verify encryption is enabled
- Check key directory permissions
- Ensure sufficient disk space for key storage

### Backup Failures

- Verify backup directory exists and is writable
- Check available disk space
- Review backup schedule configuration

## Backward Compatibility

All enterprise features are designed to be backward compatible:

- Enterprise features are disabled by default
- Existing functionality is not affected when enterprise features are disabled
- Configuration changes only apply when enterprise mode is enabled
- All existing commands and features continue to work as before

## Support

For enterprise support and documentation, refer to:

- Main README.md
- ONBOARDING.md
- Windsurf documentation: https://docs.windsurf.com
