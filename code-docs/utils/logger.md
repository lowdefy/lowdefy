# @lowdefy/logger

Centralized logging utilities for all Lowdefy environments: Node.js servers, development manager, CLI, and browser.

## Overview

The logger package provides environment-specific logger factories that share a common interface. Each logger exposes a `.ui` property with terminal-friendly methods (`log`, `error`, `warn`, `link`, `spin`, `succeed`) so that any component can emit structured output without knowing whether it's running in a CLI spinner, a pino JSON stream, or the browser console.

## Package Structure

```
@lowdefy/logger
├── node/      # createNodeLogger, wrapErrorLogger (pino-based)
├── dev/       # createDevLogger (pino + print mixin for manager)
├── cli/       # createCliLogger, createPrint, createStdOutLineHandler
└── browser/   # createBrowserLogger (console-based)
```

**Exports (subpaths):**

| Subpath | Exports | Runtime |
|---------|---------|---------|
| `@lowdefy/logger` | Re-exports node | Node.js |
| `@lowdefy/logger/node` | `createNodeLogger`, `wrapErrorLogger` | Node.js |
| `@lowdefy/logger/dev` | `createDevLogger` | Node.js |
| `@lowdefy/logger/cli` | `createCliLogger`, `createPrint`, `createStdOutLineHandler` | Node.js |
| `@lowdefy/logger/browser` | `createBrowserLogger` | Browser |

**Dependencies:** `pino` (8.16.2), `ora` (7.0.1)

## The `.ui` Interface

Every logger variant exposes `logger.ui` with the same methods:

```javascript
logger.ui.log(text)      // General output (white ∙)
logger.ui.dim(text)      // Low-priority trace (dim ∙) — e.g., request logs
logger.ui.info(text)     // Informational (blue ℹ)
logger.ui.warn(text)     // Warning (yellow ⚠)
logger.ui.error(text)    // Error (red ✖)
logger.ui.debug(text)    // Debug output (gray +)
logger.ui.link(text)     // Source link (blue ℹ, clickable)
logger.ui.spin(text)     // Spinner start/update
logger.ui.succeed(text)  // Spinner success (green ✔)
```

The `.ui` methods are environment-aware:
- **CLI**: Routes through `createPrint` (ora spinners, colored output)
- **Dev/Node**: Logs as pino JSON with `print` field for downstream rendering
- **Browser**: Maps to `console.*` methods

## Logger Variants

### createNodeLogger (`/node`)

Pino-based logger for production servers. Attaches a `.ui` property that maps to standard pino methods. Child loggers inherit `.ui` automatically.

```javascript
import { createNodeLogger } from '@lowdefy/logger/node';

const logger = createNodeLogger({
  name: 'lowdefy_server',
  level: 'info',
  base: { pid: undefined, hostname: undefined },
  mixin: (context, level) => ({ ...context, print: context.print ?? logger.levels.labels[level] }),
  serializers: {},
  destination: undefined,
});
```

**Error serializer:** Extracts `message`, `name`, `stack`, `source`, `config`, `configKey`, `isServiceError` from error objects — preserving Lowdefy error metadata through pino serialization.

### wrapErrorLogger (`/node`)

Wraps a pino logger's `.error()` method to format Lowdefy error objects. When an error has a `.source` property, it emits a separate `{ print: 'link' }` line before the error message — the CLI renders this as a blue clickable link.

```javascript
import { wrapErrorLogger } from '@lowdefy/logger/node';

const wrapped = wrapErrorLogger(logger, { includeSource: true });
wrapped.error(someError);
// Output (two pino JSON lines):
//   { print: 'link', msg: 'pages/home.yaml:15' }
//   { print: 'error', msg: '[ConfigError] Block type not found.' }
```

**Guard:** `_lowdefyWrapped` flag prevents double-wrapping when `wrapErrorLogger` is called multiple times.

### createDevLogger (`/dev`)

Used by the server-dev manager process. Wraps `createNodeLogger` with:
- Synchronous pino destination (`dest: 1`, stdout)
- `print` mixin that adds a `print` field to every JSON line
- Custom `.ui` that adds `print` context to each method

```javascript
import { createDevLogger } from '@lowdefy/logger/dev';

const logger = createDevLogger({ level: 'info', name: 'lowdefy build' });
logger.ui.spin('Building...');
// Outputs JSON: { print: 'spin', msg: 'Building...' }
```

### createCliLogger (`/cli`)

Lightweight logger for the CLI process. Uses `createPrint` for terminal output with ora spinners. Formats errors using `.print()` method or `[Name] message` fallback.

```javascript
import { createCliLogger } from '@lowdefy/logger/cli';

const logger = createCliLogger({ logLevel: 'info' });
logger.error(someError);   // Formats and prints via createPrint
logger.ui.spin('Working'); // Starts ora spinner
```

### createPrint (`/cli`)

Terminal output renderer with custom log levels and ora spinner integration:

| Level | Value | Rendering |
|-------|-------|-----------|
| `error` | 50 | Red text |
| `warn` | 40 | Yellow text |
| `succeed` | 33 | Green check + text |
| `spin` | 32 | Ora spinner |
| `log` | 31 | White dot + text |
| `dim` | 31 | White dot + dim text |
| `link` | 30 | Blue text (clickable path) |
| `info` | 30 | Default text |
| `debug` | 20 | Gray text |

Falls back to basic `console.*` in CI environments (no ora).

### createStdOutLineHandler (`/cli`)

Parses pino JSON lines from piped stdout and routes them to the CLI's `.ui` methods. Used by the CLI to render manager process output.

```javascript
import { createStdOutLineHandler } from '@lowdefy/logger/cli';

const handler = createStdOutLineHandler({ context: { logger: { ui } } });
handler('{"print":"spin","msg":"Building..."}');
// → ui.spin('Building...')
```

Handles `source` and `err.source` fields for error/warn lines — renders the source as a separate `ui.link()` call before the message.

**Print level resolution:** Uses `print` field if present, otherwise maps pino's numeric `level` (10=trace, 20=debug, 30=info, 40=warn, 50=error) to a UI method, defaulting to `'info'`. This ensures server logs without an explicit `print` field (e.g., default pino output) still appear in the terminal.

### createBrowserLogger (`/browser`)

Maps to `console.*` methods. Formats errors using `.print()` or `[Name] message`. The `.ui` property maps `link`/`spin`/`succeed` to `console.info`/`console.log`.

## Data Flow: Dev Server Logging

```
Server process (pino + print mixin + wrapErrorLogger)
  → stdout JSON lines with `print` field
  → stdio: 'inherit' → inherits manager stdout
  → piped to CLI process

Manager process (createDevLogger = pino + print mixin)
  → stdout JSON lines with `print` field
  → piped to CLI process

CLI process reads pipe
  → createStdOutLineHandler parses JSON
  → routes to context.logger.ui[print](msg)
  → terminal (ora spinners, colored output)
```

**Example flows:**

| Event | Server/Manager Output | CLI Rendering |
|-------|----------------------|---------------|
| HTTP request | `{ print: 'dim', msg: 'Request: ...' }` | Dim `∙ Request: ...` |
| Config error | `{ print: 'link', msg: 'file.yaml:10' }` then `{ print: 'error', msg: '[ConfigError] ...' }` | Blue link + Red error |
| Build start | `{ print: 'spin', msg: 'Building...' }` | Ora spinner |
| Build done | `{ print: 'succeed', msg: 'Build complete' }` | Green check |

## Key Design Decisions

### Why `stdio: 'inherit'` for the Server Process?

The server-dev manager spawns the Next.js server with `stdio: ['ignore', 'inherit', 'pipe']`. Server stdout is inherited directly by the manager process (which is piped to the CLI). This eliminates the need for a separate dev `createStdOutLineHandler` to parse and re-emit server logs — the server's pino JSON goes straight through to the CLI.

Only stderr is piped separately for error formatting through the manager logger.

### Why a `print` Mixin?

Pino's structured JSON output needs a way to tell the CLI _how_ to render each line. The `print` field (`'error'`, `'warn'`, `'spin'`, `'log'`, `'link'`, etc.) maps directly to `ui.*` methods. Without this, the CLI would have to guess rendering from log levels alone.

### Why `wrapErrorLogger` Emits Source as a Separate Line?

Source links and error messages need different terminal formatting (blue vs red). By emitting source as a separate `{ print: 'link' }` line via `originalInfo()`, the CLI can render each independently. The alternative (embedding source in the error message) would force single-color rendering.

## Key Files

| File | Purpose |
|------|---------|
| `src/node/createNodeLogger.js` | Pino factory with `.ui` and error serializer |
| `src/node/wrapErrorLogger.js` | Error formatting wrapper with source link emission |
| `src/dev/createDevLogger.js` | Manager logger with print mixin |
| `src/cli/createCliLogger.js` | CLI logger wrapping createPrint |
| `src/cli/createPrint.js` | Terminal output with ora spinners |
| `src/cli/createStdOutLineHandler.js` | Pino JSON line parser for CLI |
| `src/browser/createBrowserLogger.js` | Browser console logger |

## See Also

- [Server Dev](../servers/server-dev.md) - How the dev server uses these loggers
- [CLI](../packages/cli.md) - CLI command orchestration
- [Error Tracing](../architecture/error-tracing.md) - Error system that produces the errors loggers format
