# @lowdefy/logger

Centralized logging utilities for all Lowdefy environments: Node.js servers, development manager, CLI, and browser.

## Overview

The logger package provides environment-specific logger factories. Each logger exposes four standard level methods (`error`, `warn`, `info`, `debug`). The core principle: **`logger.error(error)` is the ONE way to log errors.** Display formatting happens only at the display layer (CLI logger, browser logger).

## Package Structure

```
@lowdefy/logger
├── node/      # createNodeLogger (plain pino)
├── dev/       # createDevLogger (thin wrapper around createNodeLogger)
├── cli/       # createCliLogger, createStdOutLineHandler
└── browser/   # createBrowserLogger (console-based)
```

**Exports (subpaths):**

| Subpath                   | Exports                                      | Runtime |
| ------------------------- | -------------------------------------------- | ------- |
| `@lowdefy/logger`         | Re-exports node                              | Node.js |
| `@lowdefy/logger/node`    | `createNodeLogger`                           | Node.js |
| `@lowdefy/logger/dev`     | `createDevLogger`                            | Node.js |
| `@lowdefy/logger/cli`     | `createCliLogger`, `createStdOutLineHandler` | Node.js |
| `@lowdefy/logger/browser` | `createBrowserLogger`                        | Browser |

**Dependencies:** `pino`, `ora`, `@lowdefy/errors`, `@lowdefy/helpers`

## Logger API

All logger variants expose the same four level methods. The standard call patterns:

```javascript
// Log an error object (THE primary pattern)
logger.error(error);

// Pino two-arg form: merge object + message string
logger.info({ spin: true }, 'Building pages...');
logger.info({ color: 'blue' }, 'some info');
logger.info({ succeed: true }, 'Build complete');

// Plain string
logger.info('Server started');
```

Color is passed via merge objects (not method chaining).

## Logger Variants

### createNodeLogger (`/node`)

Plain pino logger. No wrappers, no `attachLevelMethods`. Returns pino directly.

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

logger.info({ spin: true }, 'Building...');
logger.error(someError); // pino auto-detects Error, uses extractErrorProps
```

**Error serializer:** Uses `extractErrorProps` from `@lowdefy/helpers`. Captures all enumerable properties plus non-enumerable `message`, `name`, `stack`, `cause`.

**Parameters:**

| Parameter     | Default                                   | Description                              |
| ------------- | ----------------------------------------- | ---------------------------------------- |
| `name`        | `'lowdefy'`                               | Logger name                              |
| `level`       | `process.env.LOWDEFY_LOG_LEVEL ?? 'info'` | Log level                                |
| `base`        | `{ pid: undefined, hostname: undefined }` | Base fields                              |
| `mixin`       | —                                         | Pino mixin function                      |
| `serializers` | —                                         | Additional serializers (merged with err) |
| `destination` | —                                         | Pino destination                         |

### createDevLogger (`/dev`)

Thin wrapper around `createNodeLogger` with sync stdout destination. Used by the build process and dev server manager.

**Source:** `src/dev/createDevLogger.js`

```javascript
import { createDevLogger } from '@lowdefy/logger/dev';

const logger = createDevLogger({ level: 'info', name: 'lowdefy build' });
logger.info({ spin: true }, 'Building config...');
```

### createCliLogger (`/cli`)

Display-layer logger with ora spinners. Parses input to determine formatting. This is where `errorToDisplayString` is called — not in error handlers.

**Source:** `src/cli/createCliLogger.js`

```javascript
import { createCliLogger } from '@lowdefy/logger/cli';

const logger = createCliLogger({ logLevel: 'info' });
logger.error(someError); // Formats and prints error
logger.info({ spin: true }, 'Working...'); // Starts ora spinner
logger.info({ succeed: true }, 'Done'); // Green checkmark
logger.info({ color: 'blue' }, 'link'); // Blue text
```

**Input dispatch (4 paths):**

1. **Error-like** (has `.message`):

   - Log `error.source` in blue if present
   - Log `errorToDisplayString(error)` at the appropriate level
   - Log `error.stack` for `LowdefyError` and non-Lowdefy errors (actual bugs)
   - Suppress stack for ConfigError, PluginError, ServiceError, UserError, BuildError, ConfigWarning

2. **Pino two-arg form** (second arg is string):

   - First arg is options: extract `color`, `spin`, `succeed`
   - Display the string with those options

3. **Plain string** (first arg is string):

   - Display directly

4. **Fallback** (anything else):
   - `JSON.stringify(input, null, 2)`

**Stack trace logic (`shouldLogStack`):** Logs stacks for `LowdefyError` (internal bugs where stack is critical) and non-Lowdefy errors (plain `Error`, `TypeError`, etc. — JS bugs). Suppresses stacks for all other Lowdefy error types that use `source`/location instead of stack traces.

**Two modes:**

- **Interactive (default):** Ora spinner with timestamps and ANSI colors
- **Basic (CI):** Plain `console.*` — detected via `process.env.CI`

**Memoized:** Only one spinner per process. Multiple `createCliLogger` calls return the same instance.

**Log levels:**

| Level   | Pino Value | Rendering                                       |
| ------- | ---------- | ----------------------------------------------- |
| error   | 50         | `spinner.fail()` (red)                          |
| warn    | 40         | `spinner.warn()` (yellow)                       |
| succeed | 30         | `spinner.succeed()` (green)                     |
| spin    | 30         | `spinner.start()`                               |
| info    | 30         | `spinner.stopAndPersist({ symbol: '∙' })`       |
| debug   | 20         | `spinner.stopAndPersist({ symbol: gray('+') })` |

### createStdOutLineHandler (`/cli`)

Pure protocol translator. Parses pino JSON lines from piped stdout and routes to the CLI logger. Zero display logic.

**Source:** `src/cli/createStdOutLineHandler.js`

```javascript
import { createStdOutLineHandler } from '@lowdefy/logger/cli';

const handler = createStdOutLineHandler({ context: { logger } });
handler('{"level":30,"spin":true,"msg":"Building..."}');
// → logger.info({ spin: true }, 'Building...')
```

**Dispatch logic:**

1. Try `JSON.parse(line)`. If fails → `logger.info(line)` (raw string)
2. Map `parsed.level` to level name (50→error, 40→warn, 30→info, 20→debug)
3. If `parsed.err` exists → reconstruct error via `Object.create(ErrorClass.prototype)` + property assignment, call `logger[level](error)`
4. Else → `logger[level]({ source, color, spin, succeed }, parsed.msg)` (two-arg form)

**Error reconstruction:** Uses the same `lowdefyErrorTypes` map as the serializer `~e` reviver (direct imports of Lowdefy error classes). Same `Object.create + assign` pattern — no constructor called, no message re-formatting.

### createBrowserLogger (`/browser`)

Display-layer logger for the browser. Formats Lowdefy errors with `errorToDisplayString`; passes everything else through to `console.*`.

**Source:** `src/browser/createBrowserLogger.js`

```javascript
import { createBrowserLogger } from '@lowdefy/logger/browser';

const logger = createBrowserLogger();
logger.error(error); // Lowdefy errors: source in blue + errorToDisplayString
logger.info('loaded'); // Plain pass-through to console.info
```

**Error handling (error/warn levels):**

- `isLowdefyError === true` → display `error.source` in blue (if present), then `errorToDisplayString(error)`
- Everything else → plain `console.error(...args)` / `console.warn(...args)` (browser devtools render natively)

**Info/debug levels:** Pure pass-through to `console.info` / `console.debug`.

## Data Flow: Dev Server Logging

```
Server process (plain pino via createNodeLogger)
  → stdout JSON lines with optional color/spin/succeed fields
  → stdio: 'inherit' → inherits manager stdout
  → piped to CLI process

Manager process (createDevLogger = createNodeLogger + sync destination)
  → stdout JSON lines with optional color/spin/succeed fields
  → piped to CLI process

CLI process reads pipe
  → createStdOutLineHandler parses JSON
  → reconstructs errors from pino err field
  → routes to logger[level](error) or logger[level]({ opts }, msg)
  → createCliLogger renders terminal (ora spinners, colored output)
```

## Pino JSON Wire Format

```json
{"level":30,"spin":true,"msg":"Building..."}
{"level":30,"color":"blue","msg":"src/config.yaml:5"}
{"level":50,"err":{"message":"...","name":"ConfigError","configKey":"abc123","source":"/app/pages/home.yaml:15"},"msg":"..."}
{"level":30,"succeed":true,"msg":"Build complete"}
```

Fields `color`, `spin`, and `succeed` are optional UI hints. The `err` field contains the full serialized error (via `extractErrorProps`).

## Key Files

| File                                 | Purpose                                                 |
| ------------------------------------ | ------------------------------------------------------- |
| `src/node/createNodeLogger.js`       | Plain pino factory with extractErrorProps serializer    |
| `src/dev/createDevLogger.js`         | Thin wrapper with sync destination                      |
| `src/cli/createCliLogger.js`         | CLI display with ora, errorToDisplayString, stack logic |
| `src/cli/createStdOutLineHandler.js` | Pino JSON → CLI logger protocol translator              |
| `src/browser/createBrowserLogger.js` | Browser console with Lowdefy error formatting           |

## See Also

- [Errors](./errors.md) — Error classes and errorToDisplayString
- [Server Dev](../servers/server-dev.md) — How the dev server uses these loggers
- [CLI](../packages/cli.md) — CLI command orchestration
- [Error Tracing](../architecture/error-tracing.md) — Error system that produces the errors loggers format
