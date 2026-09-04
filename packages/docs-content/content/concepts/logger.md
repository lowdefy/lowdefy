# Logger

Lowdefy provides built-in error logging and monitoring capabilities. When properly configured, errors from both client and server are captured and sent to external logging services.

## Sentry Integration

[Sentry](https://sentry.io) is a popular error tracking and performance monitoring platform. Lowdefy has built-in Sentry integration that captures errors with rich context including page IDs, block IDs, and config file locations.

### Quick Start

To enable Sentry, set the `SENTRY_DSN` environment variable:

```
SENTRY_DSN=https://your-dsn@sentry.io/project
```

With this environment variable set, Sentry will capture errors from both client and server with sensible defaults.

### Client-Side Configuration

For client-side error capture, you also need to expose the DSN to the browser:

```
```

### Configuration Options

You can customize Sentry behavior using the `logger` configuration in your `lowdefy.yaml`:

```yaml
lowdefy: 5.5.1

logger:
  sentry:
    # Enable/disable client-side logging (default: true)
    client: true
    # Enable/disable server-side logging (default: true)
    server: true
    # Sample rate for performance traces (default: 0.1)
    tracesSampleRate: 0.1
    # Sample rate for session replay (default: 0)
    replaysSessionSampleRate: 0
    # Sample rate for replay on errors (default: 0.1)
    replaysOnErrorSampleRate: 0.1
    # Enable user feedback widget (default: false)
    feedback: false
    # Override environment detection (default: auto from NODE_ENV)
    environment: production
    # User fields to include in error reports (default: ['id', '_id'])
    userFields:
      - id
      - _id
```

### Default Configuration

If you only set `SENTRY_DSN` without any `logger.sentry` configuration, these defaults are used:

| Option | Default | Description |
|--------|---------|-------------|
| `client` | `true` | Client-side error capture enabled |
| `server` | `true` | Server-side error capture enabled |
| `tracesSampleRate` | `0.1` | 10% of transactions traced |
| `replaysSessionSampleRate` | `0` | Session replay disabled by default |
| `replaysOnErrorSampleRate` | `0.1` | 10% of error sessions replayed |
| `feedback` | `false` | User feedback widget disabled |
| `userFields` | `['id', '_id']` | Only user ID fields logged |

### User Context

For authenticated users, Sentry automatically captures user context based on the `userFields` configuration. By default, only `id` and `_id` fields from the user session are included to avoid logging PII (personally identifiable information).

To include additional fields:

```yaml
logger:
  sentry:
    userFields:
      - id
      - _id
      - organization_id
```

### Source Maps

To enable readable stack traces in Sentry, set the `SENTRY_AUTH_TOKEN` environment variable during build:

```
SENTRY_AUTH_TOKEN=your-auth-token
```

This will upload source maps to Sentry during the client build.

### Environment Variables

| Variable | Description |
|----------|-------------|
| `SENTRY_DSN` | Sentry Data Source Name (DSN) for server-side error capture |
| `SENTRY_AUTH_TOKEN` | (Optional) Auth token for source map uploads during build |

Example `.env` file:

```
# .env
SENTRY_DSN=https://abc123@o123456.ingest.sentry.io/1234567
SENTRY_AUTH_TOKEN=your-auth-token
```

### Disabling Sentry

To disable Sentry for specific environments:

- **Disable client only:** Set `logger.sentry.client: false`
- **Disable server only:** Set `logger.sentry.server: false`
- **Disable completely:** Remove the `SENTRY_DSN` environment variable

### Error Context

When errors are captured, Lowdefy automatically includes:

- **Page ID:** The current page where the error occurred
- **Block ID:** The block that triggered the error (if applicable)
- **Config Location:** The source file and line number in your YAML config
- **User Context:** Configured user fields for authenticated sessions

## Wide Events

Every unit of server work writes one structured log line - a "wide event" - naming what ran, how long it took, whether it succeeded, and where in your config it is defined.

### The event catalogue

| `event` | Written by |
|---------|------------|
| `request_completed` / `request_failed` | A request resolver run (a page request, or a request step in an endpoint) |
| `step_completed` / `step_failed` | A routine step (controls like `:if` are structure and write no line; the steps inside them do) |
| `endpoint_completed` / `endpoint_failed` | An endpoint routine, with `entry` naming how it was called: `api`, `call_api`, `scheduled`, `webhook`, `detached`, or `background` for an `async: true` run that answered its caller before the routine finished |
| `agent_tool_completed` / `agent_tool_failed` | A tool call - an MCP `tools/call` (`transport: mcp`) or an agent calling one of its tools (`transport: agent`) |
| `process_started` | Written once when a server process starts |
| `migrations_checked` | Written once when the migration preflight first resolves |

### The fields

| Field | Description |
|-------|-------------|
| `event` | The event name from the table above |
| `rid` | The request id, shared by every line of one request (honours an upstream `x-request-id`) |
| `page_id`, `block_id` | The page and block the work belongs to, where there is one |
| `request_id`, `endpoint_id`, `step_id` | The ids of the unit that ran |
| `config_key` | The config location key of the unit - see below |
| `duration_ms` | Wall-clock duration of the unit |
| `success` | Whether the unit completed |
| `error.name`, `error.message`, `error.hint` | On a `*_failed` line only |
| `user.id`, `org` | Only when `logger.events.identity` is `true` |

Every line also carries `app_name`, `app_version` and `git_sha` from the app's build.

### Resolving `config_key` to a source location

A line carries `config_key`, not a file path. The build writes `keyMap.json`, which maps every key to the file and line it came from, so `source` is `keyMap.json[config_key]` for the build at that line's `git_sha`. Resolving it in your query tool - once per session - keeps the file read off the request path.

### Configuration

```yaml
# lowdefy.yaml
logger:
  # 'errors' (default): failures at info, successes at debug
  # 'all': successes at info too
  events: errors
```

The object form adds sampling and identity:

```yaml
# lowdefy.yaml
logger:
  events:
    level: errors
    # Keep a fraction of successful events at info. The decision is made
    # per request id, so a kept request is complete, never half-logged.
    sample_rate: 0.05
    # Off by default. Adds user.id and the tenant value (org) to every
    # event line - a material expansion of what your logs hold about a
    # person, so opt in deliberately.
    identity: false
```

### Process starts

`process_started` carries `app_version`, `git_sha`, the Lowdefy version and the Node version. On a long-lived server that is one line per deploy; on serverless it is one line per cold start, per replica - so group by `git_sha` in your queries, never by line count. `migrations_checked` follows on the first request, naming the stage and the migrations the build recorded as applied.

## Shipping logs to an observability platform

Lowdefy writes JSON log lines to stdout, which is all a platform that
collects stdout (Docker, Kubernetes, Vercel) needs. Where you want the
lines in a log store directly, `logger.otlp` adds an exporter beside
stdout: log lines are batched and POSTed as
[OTLP/HTTP JSON](https://opentelemetry.io/docs/specs/otlp/) log records.
Stdout keeps everything it had - the exporter is a second destination,
never a replacement.

```yaml
# lowdefy.yaml
logger:
  otlp:
    endpoint: https://api.axiom.co/v1/logs
    headers:
      Authorization:
        _secret: AXIOM_TOKEN
      X-Axiom-Dataset: my-dataset
```

[Axiom](https://axiom.co) is the example above, but there is no
vendor-specific configuration here: Grafana (Loki via the OTLP
gateway), Honeycomb and Datadog all accept the same wire format at
their own OTLP logs endpoint, with their own authorization header.

### Header secrets

An OTLP endpoint is authenticated by header, so the header value is a
secret. Use the `_secret` operator, as above, and set the secret as an
environment variable on the server:

```
LOWDEFY_SECRET_AXIOM_TOKEN=Bearer xaat-your-token
```

The build never resolves the operator - the artifact it writes holds
`{ _secret: AXIOM_TOKEN }`, not your token - and the server resolves it
once, when it creates the logger. A header value that is neither a
string nor a `_secret` operator fails at boot.

### Batching and flushing

```yaml
# lowdefy.yaml
logger:
  otlp:
    endpoint: https://api.axiom.co/v1/logs
    # Additional OpenTelemetry resource attributes, sent once per batch
    # beside app_name, app_version and git_sha.
    resource:
      deployment.environment: production
    batch:
      # Export once this many lines are buffered. Default 50.
      size: 50
      # Export a partial batch after this many milliseconds. Default 2000.
      flush_ms: 2000
```

Beyond the size and time triggers, the buffer is flushed after every
request. On a serverless platform the invocation can be frozen the
moment the response is sent, so the export is handed to the platform's
`waitUntil`, which keeps the invocation alive until the batch has left.
On a long-lived server the timer and a flush before the process exits
cover the rest.

The exporter is a sink and never fails a request: an export that fails
is retried once and then dropped, with at most one console warning a
minute. Your platform's own log stream still has every line.

## Monitors

Wide events only help if something is watching them. Every build
writes `build/monitors.json`: one monitor definition per unit your app
declares, over the events the servers already emit. Nothing is
configured per monitor - the build knows your endpoints, page
requests, notifications and connections, so it knows what is worth
an alert.

| Unit | Monitor |
| --- | --- |
| Api endpoint | Error rate: `endpoint_failed` over `endpoint_completed + endpoint_failed`, above 5% in 5 minutes |
| Scheduled endpoint | Freshness: no `endpoint_completed` for that `endpoint_id` in twice the longest gap its cron leaves |
| Page request | p95 `duration_ms` above 2000ms, and an error rate on `request_failed` |
| Connection | Rate of `request_failed` with `error.name == "ServiceError"` - the service being down, not a bad query |
| Notification | Written with `status: "no-event-yet"`: the notification path logs no structured delivery event yet, so the entry records the gap rather than hiding it |

Every entry carries `config_key` and `source` (`file:line`), so an
alert points at the config that declared the unit, not just at an id.
The file is always written, as `[]` when the app declares nothing.

### Pushing them to a sink

The framework produces the payload; you make the call. Axiom is the
first renderer that ships:

```
AXIOM_TOKEN=xaat-... AXIOM_ORG_ID=my-org AXIOM_DATASET=my-dataset \
  pnpm monitors:push .lowdefy/build
```

Each rule is rendered as an APL query over the dataset and created or
updated through Axiom's monitors API. The push is idempotent: monitors
are named `lowdefy:<app slug>:<monitor id>`, so re-running it on every
deploy updates the same monitors instead of duplicating them, and the
notifiers you attached in Axiom are left alone. `--dry-run` prints the
payloads and calls nothing.

The artifact is not Axiom-shaped. Any sink that accepts the same
events - Grafana, Datadog, Honeycomb, or your own alerting - can
consume `build/monitors.json`; the vendor mapping lives in two small
files (`scripts/monitors/renderApl.mjs` and
`renderAxiomMonitor.mjs`) that a renderer for another sink sits beside.

### Thresholds

The two thresholds are app-wide defaults, not a per-monitor surface:

```yaml
# lowdefy.yaml
logger:
  monitors:
    defaults:
      # Error rate above which an error-rate monitor fires. Default 0.05.
      error_rate: 0.05
      # p95 duration, in milliseconds, above which a page request
      # monitor fires. Default 2000.
      p95_ms: 2000
```

A monitor you want to shape by hand is a monitor to edit in your own
tool, where the rest of your alerting already lives.
