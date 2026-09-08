# Logger

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
