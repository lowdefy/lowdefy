# @lowdefy/logger

Centralized logging utilities for all Lowdefy environments: Node.js servers, development manager, CLI, and browser.

## Overview

The logger package provides environment-specific logger factories that share a common interface. Each logger exposes four standard level methods (`error`, `warn`, `info`, `debug`) with six color sub-methods each (`.red()`, `.green()`, `.yellow()`, `.blue()`, `.gray()`, `.white()`). Spin and succeed are options on `info()`. There is no `.ui` namespace — level methods are the top-level API.

## Package Structure

```
@lowdefy/logger
├── node/      # createNodeLogger (pino-based with level method wrappers)
├── dev/       # createDevLogger (thin wrapper around createNodeLogger)
├── cli/       # createCliLogger, createPrint, createStdOutLineHandler
└── browser/   # createBrowserLogger (console-based)
```

**Exports (subpaths):**

| Subpath | Exports | Runtime |
|---------|---------|---------|
| `@lowdefy/logger` | Re-exports node | Node.js |
| `@lowdefy/logger/node` | `createNodeLogger` | Node.js |
| `@lowdefy/logger/dev` | `createDevLogger` | Node.js |
| `@lowdefy/logger/cli` | `createCliLogger`, `createPrint`, `createStdOutLineHandler` | Node.js |
| `@lowdefy/logger/browser` | `createBrowserLogger` | Browser |

**Dependencies:** `pino` (8.16.2), `ora` (7.0.1)

## Common API

All logger variants expose the same four level methods:

```javascript
logger.error(msg)                    // Error message
logger.error(msg, { color: 'blue' }) // Error with color override
logger.error(errorObj)               // Error object (source + formatted message)
logger.error.red(msg)                // Error with red color
logger.error.blue(msg)               // Error with blue color

logger.warn(msg)                     // Warning (same patterns as error)
logger.info(msg)                     // Info message
logger.info(msg, { spin: true })     // Start/update spinner
logger.info(msg, { succeed: true })  // Green checkmark success
logger.info.gray(msg)                // Info with gray color (replaces old .dim)
logger.info.blue(msg)                // Info with blue color (replaces old .link)
logger.debug(msg)                    // Debug message
```

**Color sub-methods:** `.red()`, `.green()`, `.yellow()`, `.blue()`, `.gray()`, `.white()` — available on all four levels.

**Error object handling (warn/error only):** When passed an object with `.name` or `.message`, the method extracts `.source` as a separate blue info line and formats the message via `formatUiMessage`.

## Logger Variants

### createNodeLogger (`/node`)

Pino-based logger for production servers. The `attachLevelMethods` function wraps each pino level method with:

1. **Pino-native pass-through:** `(mergeObj, msg, ...rest)` where second arg is string → passes directly to pino
2. **Error objects (warn/error):** Objects with `.name` or `.message` → emits `.source` as blue info, formats message
3. **Plain objects:** Non-error objects → passes directly to pino as merge object (pino's standard merge-object pattern)
4. **String messages:** `(msg)` or `(msg, { color, spin, succeed })` → builds merge object with optional fields

Child loggers inherit level methods through wrapped `.child()`.

**Source:** `src/node/createNodeLogger.js`

```javascript
import { createNodeLogger } from '@lowdefy/logger/node';

const logger = createNodeLogger({
  name: 'lowdefy_server',
  level: 'info',
  base: { pid: undefined, hostname: undefined },
  serializers: {},
  destination: undefined,
});

logger.info('Server started');
logger.info({ color: 'blue' }, 'Source link');  // Pino-native pass-through
logger.warn({ code: 'NEXTAUTH_URL' });          // Plain object merge
logger.error(someError);                         // Error object handling
```

**Error serializer:** Extracts `message`, `name`, `stack`, `source`, `config`, `configKey`, `isServiceError` from error objects — preserving Lowdefy error metadata through pino serialization.

### createDevLogger (`/dev`)

Thin wrapper around `createNodeLogger` for the server-dev manager process. Configures synchronous pino destination (stdout) and stripped base fields. All level methods and child wrapping are inherited from createNodeLogger.

**Source:** `src/dev/createDevLogger.js`

```javascript
import { createDevLogger } from '@lowdefy/logger/dev';

const logger = createDevLogger({ level: 'info', name: 'lowdefy build' });
logger.info('Building config...', { spin: true });
// Outputs JSON: { "level": 30, "spin": true, "msg": "Building..." }
```

### createCliLogger (`/cli`)

Lightweight logger for the CLI process. Uses `createPrint` for terminal output with ora spinners. Each level method routes to `print[level](text, { color })` with the same color sub-methods and error object handling.

**Source:** `src/cli/createCliLogger.js`

```javascript
import { createCliLogger } from '@lowdefy/logger/cli';

const logger = createCliLogger({ logLevel: 'info' });
logger.error(someError);                    // Formats and prints error
logger.info('Working...', { spin: true });  // Starts ora spinner
logger.info('Done', { succeed: true });     // Green checkmark
logger.info.blue('src/config.yaml:15');     // Blue source link
```

### createPrint (`/cli`)

Terminal output renderer with four standard levels + spin/succeed:

| Method | Level Value | Rendering |
|--------|-------------|-----------|
| `error(text, { color })` | 50 | `spinner.fail()` (default red) |
| `warn(text, { color })` | 40 | `spinner.warn()` (default yellow) |
| `info(text, { color })` | 30 | `spinner.stopAndPersist({ symbol: '∙' })` (default white) |
| `debug(text, { color })` | 20 | `spinner.stopAndPersist({ symbol: gray('+') })` (default gray) |
| `spin(text)` | 30 | `spinner.start()` |
| `succeed(text)` | 30 | `spinner.succeed(green(text))` |

Each method accepts optional `{ color }` to override the default. Six ANSI colors: red, green, yellow, blue, gray (dim attribute), white (identity).

Falls back to basic `console.*` in CI environments (no ora). Memoized — error handler and main logger share the same ora spinner instance.

**Source:** `src/cli/createPrint.js`

### createStdOutLineHandler (`/cli`)

Parses pino JSON lines from piped stdout and routes them to the CLI logger's level methods. Used by the CLI to render dev manager process output.

**Source:** `src/cli/createStdOutLineHandler.js`

```javascript
import { createStdOutLineHandler } from '@lowdefy/logger/cli';

const handler = createStdOutLineHandler({ context: { logger } });
handler('{"level":30,"spin":true,"msg":"Building..."}');
// → logger.info('Building...', { spin: true })
```

**JSON field mapping:**

| Field | Usage |
|-------|-------|
| `level` | Pino numeric level → mapped to `error`/`warn`/`info`/`debug` |
| `msg` | Message text (non-string values are JSON.stringified as safety net) |
| `color` | Passed as `{ color }` option to level method |
| `spin` | Routes to `logger.info(msg, { spin: true })` |
| `succeed` | Routes to `logger.info(msg, { succeed: true })` |
| `source`, `err.source` | Emitted as `logger.info.blue(source)` for error/warn lines |

Handles `source` and `err.source` fields for error/warn lines — renders the source as a separate blue info line before the message. Falls back to `logger.info(line)` for unparseable lines.

### createBrowserLogger (`/browser`)

Maps to `console.*` methods. Four level methods only — no color sub-methods, no spin/succeed. `warn`/`error` handle error objects (source extraction + formatting via `formatBrowserError`/`formatUiMessage`).

**Source:** `src/browser/createBrowserLogger.js`

## Data Flow: Dev Server Logging

```
Server process (createNodeLogger with attachLevelMethods)
  → stdout JSON lines with optional color/spin/succeed fields
  → stdio: 'inherit' → inherits manager stdout
  → piped to CLI process

Manager process (createDevLogger = createNodeLogger + sync destination)
  → stdout JSON lines with optional color/spin/succeed fields
  → piped to CLI process

CLI process reads pipe
  → createStdOutLineHandler parses JSON
  → routes to logger[level](msg, { color/spin/succeed })
  → createPrint renders terminal (ora spinners, colored output)
```

**Example flows:**

| Event | Server/Manager Output | CLI Rendering |
|-------|----------------------|---------------|
| HTTP request | `{ "level": 30, "color": "gray", "msg": "Request: ..." }` | Gray `∙ Request: ...` |
| Config error | `{ "level": 30, "color": "blue", "msg": "file.yaml:10" }` then `{ "level": 50, "msg": "[ConfigError] ..." }` | Blue link + Red error |
| Build start | `{ "level": 30, "spin": true, "msg": "Building..." }` | Ora spinner |
| Build done | `{ "level": 30, "succeed": true, "msg": "Build complete" }` | Green check |

## Pino JSON Wire Format

```json
{"level":30,"spin":true,"msg":"Building..."}
{"level":30,"color":"blue","msg":"src/config.yaml:5"}
{"level":40,"msg":"[ConfigWarning] Deprecated feature"}
{"level":30,"msg":"Built config."}
```

Fields `color`, `spin`, and `succeed` are optional. When absent, the stdOutLineHandler passes the message to the level method without options, and createPrint applies its default color for that level (error=red, warn=yellow, info=white, debug=gray).

## Key Design Decisions

### Why Level Methods Instead of `.ui` Namespace?

The old `.ui` interface duplicated pino's level methods with a parallel set of terminal-friendly methods. The new design wraps pino's own methods so there's one call path — `logger.warn(msg)` works for both structured JSON output and terminal rendering. Color is orthogonal to level (via sub-methods or options), not conflated with custom log levels.

### Why Color Sub-Methods Instead of Custom Pino Levels?

The old design used custom pino levels (`dim=31`, `link=30`, `succeed=33`, `spin=32`) which conflated rendering hints with log severity. The new design keeps standard pino levels (debug=20, info=30, warn=40, error=50) and uses flat JSON fields (`color`, `spin`, `succeed`) for rendering hints. This means log level filtering works correctly — `spin` and `succeed` are at info level, not custom levels that break filtering.

### Why `attachLevelMethods` Wraps Pino Methods?

Rather than maintaining a separate API layer, the wrappers detect the call signature and dispatch:
- `(mergeObj, string)` → pino-native (unchanged behavior)
- `(errorObj)` → extract source, format message (warn/error only)
- `(plainObj)` → pino merge-object pass-through
- `(string, options)` → build merge object with color/spin/succeed

This preserves compatibility with direct pino usage (e.g., `logger.info({ requestId }, 'msg')`) while adding the level method API.

### Why `stdio: 'inherit'` for the Server Process?

The server-dev manager spawns the Next.js server with `stdio: ['ignore', 'inherit', 'pipe']`. Server stdout is inherited directly by the manager process (which is piped to the CLI). This eliminates the need for a separate stdOutLineHandler to parse and re-emit server logs — the server's pino JSON goes straight through to the CLI.

Only stderr is piped separately for error formatting through the manager logger.

### Why Error Sources Are Separate Lines?

Source links and error messages need different terminal formatting (blue vs red). When `logger.error(errorObj)` detects a `.source` property, it emits `logger.info.blue(source)` as a separate pino JSON line before the error message. The CLI renders each independently.

## Key Files

| File | Purpose |
|------|---------|
| `src/node/createNodeLogger.js` | Pino factory with `attachLevelMethods` and error serializer |
| `src/dev/createDevLogger.js` | Thin wrapper around createNodeLogger with sync destination |
| `src/cli/createCliLogger.js` | CLI logger routing to createPrint |
| `src/cli/createPrint.js` | Terminal output with ora spinners and ANSI colors |
| `src/cli/createStdOutLineHandler.js` | Pino JSON line parser for CLI |
| `src/browser/createBrowserLogger.js` | Browser console logger |
| `src/formatUiMessage.js` | Error object → display string formatting |

## Migration from Old API

| Old Pattern | New Pattern |
|---|---|
| `logger.ui.log(text)` | `logger.info(text)` |
| `logger.ui.info(text)` | `logger.info(text)` |
| `logger.ui.warn(text)` | `logger.warn(text)` |
| `logger.ui.error(text)` | `logger.error(text)` |
| `logger.ui.debug(text)` | `logger.debug(text)` |
| `logger.ui.dim(text)` | `logger.info.gray(text)` |
| `logger.ui.link(text)` | `logger.info.blue(text)` |
| `logger.ui.spin(text)` | `logger.info(text, { spin: true })` |
| `logger.ui.succeed(text)` | `logger.info(text, { succeed: true })` |
| `wrapErrorLogger(logger)` | Built into `attachLevelMethods` — no separate wrapper needed |

## See Also

- [Server Dev](../servers/server-dev.md) - How the dev server uses these loggers
- [CLI](../packages/cli.md) - CLI command orchestration
- [Error Tracing](../architecture/error-tracing.md) - Error system that produces the errors loggers format
