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
lowdefy: 7.2.0

logger:
  sentry:
    # Enable/disable client-side logging (default: true)
    client: true
    # Enable/disable server-side logging (default: true)
    server: true
    # Trace server requests (default: true on the Node server, false on Vercel)
    serverTracing: true
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
| `serverTracing` | `true` on the Node server, `false` on Vercel | Server requests traced as streamed spans |
| `tracesSampleRate` | `0.1` | 10% of requests and page loads traced |
| `replaysSessionSampleRate` | `0` | Session replay disabled by default |
| `replaysOnErrorSampleRate` | `0.1` | 10% of error sessions replayed |
| `feedback` | `false` | User feedback widget disabled |
| `userFields` | `['id', '_id']` | Only user ID fields logged |

### Server Tracing on Vercel

On Vercel, the server reports errors only by default: with tracing, the function stays billed after each response while a sampled request's spans upload. Without tracing, a request that captures no error ends as soon as its response is sent, and one that captures an error waits only for that error to reach Sentry.

To trace server requests on Vercel anyway, set `serverTracing: true`:

```yaml
logger:
  sentry:
    serverTracing: true
    tracesSampleRate: 0.1
```

`tracesSampleRate` still sets the browser's trace sampling either way. Set `serverTracing: false` to report errors only from the Node server too.

### Traces

Lowdefy uses Sentry's JavaScript SDK 11, which streams spans: each request's spans are sent as they end, not collected into one transaction event. In Sentry, explore them as spans and traces. Alerts, queries and dashboards built on transaction events need to use spans instead. A server request's span is named by its method and route (`POST /api/endpoints/*`); its path and query are in its `url.path` and `url.query` attributes.

### What Sentry Receives

Lowdefy sets what the Sentry SDKs collect, on the server and in the browser, and it cannot be changed in `lowdefy.yaml`:

- No cookies, no request or response bodies, and no IP address or other user information Sentry would infer.
- Request headers and URL query parameters, except those Sentry treats as sensitive (names containing auth, token, session, key, cookie, password and similar), those that carry the client's address (forwarded, `-ip`, `remote-`, via, `-user`), and the `Referer` header, since the previous page's URL can carry a sign-in or reset link's token.
- No database query parameters or results, queue task arguments, or AI and MCP inputs and outputs.
- Every string Sentry receives from the server is scrubbed of the app's secrets (`LOWDEFY_SECRET_*`) and of values marked with `_credential` during the request.

Stack traces are attached only to errors, as before, so issues keep their grouping.

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
