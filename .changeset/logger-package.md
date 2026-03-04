---
'@lowdefy/logger': minor
'lowdefy': minor
'@lowdefy/server-dev': minor
---

feat(logger): Add centralized @lowdefy/logger package and standardize logging

**New @lowdefy/logger Package**

- Centralized logging with environment-specific subpaths: `/node`, `/cli`, `/browser`
- `createNodeLogger` — pino factory with custom error serializer preserving Lowdefy error metadata (source, configKey, isServiceError)
- `createCliLogger` — wraps `createPrint` (ora spinners, colored output) with standard logger interface
- `createBrowserLogger` — maps to `console.*` with error formatting
- `wrapErrorLogger` — formats Lowdefy errors, emits source as separate `{ print: 'link' }` line for blue clickable links

**Standardized `.ui` Interface**

All logger variants expose `logger.ui` with consistent methods: `log`, `dim`, `info`, `warn`, `error`, `debug`, `link`, `spin`, `succeed`. This allows any component to emit structured output without knowing the runtime environment.

- `dim` renders as dimmed text in the CLI — useful for low-priority trace lines (e.g., request logs) that shouldn't compete visually with build output

**CLI Logger Migration**

- CLI now uses `createCliLogger` instead of raw `createPrint`
- `context.print` replaced with `context.logger` / `context.logger.ui`
- `createPrint` and `createStdOutLineHandler` moved from CLI to `@lowdefy/logger/cli`

**Server-Dev stdio:inherit**

- Server process spawned with `stdio: ['ignore', 'inherit', 'pipe']`
- Server pino JSON flows directly to manager stdout (inherited by CLI) — eliminates dev stdout line handler
- Only stderr piped for error formatting through manager logger
- Server `createLogger` includes `print` mixin so CLI can render each line correctly
