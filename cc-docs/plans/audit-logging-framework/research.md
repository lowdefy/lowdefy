# Audit Logging Research

Best practices, standards, and industry patterns that informed the audit logging framework design.

---

## OWASP Guidelines

OWASP ranks Security Logging and Alerting Failures at **#9 in the OWASP Top 10:2025**. Key requirements:

### Mandatory Events to Log
- All authentication events (success, failure, lockout)
- Authorization failures
- High-value transactions
- Privilege changes
- Configuration modifications
- Input validation failures

### Mandatory Event Fields (When/Where/Who/What)
- **When**: ISO 8601 timestamp with timezone, correlation ID
- **Where**: Application name/version, hostname, URL, code location
- **Who**: Source IP, user identity, user classification/roles
- **What**: Event type, severity, description, outcome (success/fail)

### What Must NEVER Be Logged
- Passwords and credentials
- Session tokens and access tokens
- Database connection strings and encryption keys
- Payment card data (PCI DSS)
- Source code
- Health data or government IDs (unless legally required and masked)

### OWASP Logging Vocabulary (56 Event Types)

The OWASP Logging Vocabulary Cheat Sheet defines standardized event naming across 13 categories:

| Category | Prefix | Events |
|----------|--------|--------|
| Authentication | `authn_` | login_success, login_fail, login_fail_max, login_lock, password_change, impossible_travel, token_created, token_revoked, token_reuse |
| Authorization | `authz_` | fail, change, admin |
| Excessive Use | `excess_` | rate_limit_exceeded |
| Input Validation | `input_` | validation_fail |
| Malicious Behavior | `malicious_` | excess_404, sqli, cors, attack_tool |
| Privilege Changes | `privilege_` | permissions_changed |
| Sensitive Data | `sensitive_` | create, read, update, delete |
| Session Management | `session_` | created, renewed, expired, use_after_expire |
| System Events | `sys_` | startup, shutdown, restart, crash |
| User Management | `user_` | created, updated, archived, deleted |

The framework uses a simplified version of this vocabulary adapted for config-driven app context: `auth.*`, `request.*`, `endpoint.*`, `authz.*`, `error.*`.

---

## Audit Log Schema Standards

### CADF (Cloud Auditing Data Federation)

DMTF/OASIS standard for cloud auditing. Key concept: the **three-party model**:

- **Initiator**: Who triggered the event (user, service, API key)
- **Target**: What was affected (resource, endpoint, record)
- **Observer**: Who recorded the event (the framework itself)

This separation is more robust than simple actor/action schemas. The framework adopts CADF's initiator/target model.

### CEF (Common Event Format)

ArcSight SIEM format: `CEF:Version|Vendor|Product|Version|SignatureID|Name|Severity|Extension`. Best for SIEM integration but overly structured for application-level logging. Not adopted.

### JSON Structured Logging

De facto standard for application-level audit logs. Used by Elastic Common Schema, Splunk CIM, and OpenTelemetry. The framework uses JSON for maximum flexibility and tool compatibility.

---

## Industry Patterns: Low-Code Platforms

### Retool
- Automatic logging to `audit_trail_events` PostgreSQL table
- Schema: `id`, `actionType`, `userId`, `metadata` (JSONB), `createdAt`
- Captures: query executions (with parameters), password resets, group changes, app access
- Streaming: Datadog, Splunk, stdout
- Sensitive data control: `HIDE_ALL_HEADERS_IN_AUDIT_LOG_EVENTS` env var

### Appsmith
- Consistent schema: `event`, `workspace`, `resource`, `application`, `user`, `timestamp`, `metadata`
- Captures: workspace CRUD, app CRUD, page views, datasource changes, query execution
- `query.executed` event includes parameters (up to 5MB)

### Key Patterns Across Platforms
1. Audit logging is a premium/enterprise feature
2. Automatic capture at the platform level (apps don't implement their own logging)
3. JSONB metadata field for flexible action-specific details
4. Streaming to external tools (Datadog, Splunk) is standard
5. Query execution logging captures what queries were run, by whom, with what parameters
6. Config/deployment change tracking

---

## Storage Patterns

### Append-Only / Immutable
- Once written, audit events should never be modified or deleted
- Cloud WORM storage: AWS S3 Object Lock, Azure Immutable Blob, GCS Retention Policies
- Hash chaining: each entry linked to predecessor (tamper detection)

### Storage Tiers
| Tier | Duration | Storage | Purpose |
|------|----------|---------|---------|
| Hot | 0-90 days | Database/Elasticsearch | Real-time querying |
| Warm | 90-365 days | Cheaper indexed storage | Investigations |
| Cold | 1-7+ years | S3/Blob archival | Long-term compliance |

### Recommended Architecture
```
Application Events
       |
  [Audit Logger]
       |
       +---> Database (hot, 0-90 days)
       +---> Stdout/Stream → Log Aggregator
       +---> Object Storage (cold, 1-7+ years)
```

The framework uses the connection system for storage — MongoDB for hot storage, AxiosHttp for streaming to aggregators. The storage tier architecture is the deployer's responsibility, not the framework's.

---

## Compliance Requirements

| Requirement | SOC 2 | HIPAA | GDPR | PCI DSS |
|-------------|-------|-------|------|---------|
| Access logging | Required | Required | Required | Required |
| Tamper protection | Required | Required | Implied | Required |
| Retention minimum | Audit period | 6 years | Reasonable | 1 year |
| Breach notification | Required | 60 days | 72 hours | Required |
| Encryption at rest | Required | Required | Required | Required |
| Regular review | Required | Required | Required | Daily |

The framework provides the event capture layer. Compliance-specific requirements (retention, encryption, tamper protection) are properties of the storage backend, not the framework.

---

## Next.js Audit Logging Patterns

### API Route Handlers
Action-specific audit logging in route handlers (the approach used by the framework):
```javascript
export async function POST(request) {
  const result = await executeAction(request);
  await auditLog({ eventType, actor, target, outcome });
  return Response.json(result);
}
```

### Critical Principles
1. **Async, non-blocking**: Never block request/response for audit writes
2. **Server-side only**: Client-side logs can be tampered with
3. **Correlation IDs**: Thread request ID through all audit events
4. **Defense in depth**: Layer audit at multiple interception points
