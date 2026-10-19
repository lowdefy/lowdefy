# @lowdefy/logger

## 6.1.0

### Patch Changes

- 6d6f8fa: Improved error handling: each reader of a server error now gets its own view of it.

  - **Users and app config see the author's message or one generic message.** A server error the app author did not write now reaches the browser as "Something went wrong.", with its `name`, `code`, `statusCode`, `configKey` and a `requestId`. Messages written with `:throw` or `:reject`, failed `ValidateSchema` steps, a plugin's `UserError`, and authentication refusals, are shown as before. This applies to the error toast, `_actions`, `_request_details`, websocket errors, MCP tool results and the AgentChat stream, the same way in development and production. An action whose error toast showed a connection's own message now shows the generic one.
    - The generic message is the built-in `server.genericError` i18n string. Override it per locale under `config.i18n.messages`, for example `server.genericError: 'Etwas ist schiefgelaufen.'`.
    - To show different text for one action, set `messages.error` on the action.
    - To show the real message, read it with the new `_error` operator in the endpoint's `:catch` and send it on, for example `:throw: { _error: message }`.
  - **The dev server shows the full error.** In `lowdefy dev`, the error bar, the browser console and the dev MCP tools show the full server error, with its config location, while app config sees the same generic error as in production. Different failures of the same action are now each shown, instead of only the first.
  - **The browser console prints the request id** under a server error, to find the matching server log line and Sentry event.
  - **Production logs and Sentry keep a fixed set of error fields.** Each logged error keeps its name, message, stack, `code`, `statusCode` and cause, plus Lowdefy's own fields (`configKey`, `source`, `received`, ...) on Lowdefy errors. Fields a library attaches, such as an HTTP client's request config and response, are no longer logged. Values of the app's secrets (`LOWDEFY_SECRET_*`, `CRON_SECRET`, `AUTH_SECRET`) are replaced with `[REDACTED]` in production log lines and Sentry events, and credential-named keys in `received` are masked. Sentry events now carry the error's fields under `extra.error` and a `requestId` tag, and no longer attach incoming request bodies.
  - **An AxiosHttp request that gets a 5xx response now fails with a `ServiceError`**, where it used to fail with a `RequestError`. AxiosHttp now sets `statusCode` on its error, and a 5xx status marks an error as a service failure, like a network error or timeout. Config that checks `name` for `RequestError` on these failures, for example `_eq: [{ _error: name }, 'RequestError']`, should also accept `ServiceError`, or check `statusCode` instead. The server log event for these failures is now `service_error`.

- Updated dependencies [6d6f8fa]
- Updated dependencies [6d6f8fa]
  - @lowdefy/helpers@6.1.0
  - @lowdefy/errors@6.1.0

## 6.0.0

### Patch Changes

- da0c62c: chore: Update pino from 8.16.2 to 10.3.1.

  No behavior change — the log output format, levels, and configuration are unchanged. The pino 9 and 10 majors only drop support for Node.js versions below 20, and Lowdefy already requires Node.js 22 or newer.

- Updated dependencies [37c8c14]
- Updated dependencies [6446ae6]
- Updated dependencies [c9bea1c]
  - @lowdefy/errors@6.0.0
  - @lowdefy/helpers@6.0.0

## 5.6.0

### Patch Changes

- 824f4be: fix(helpers): Serialized errors mark the values they cannot carry instead of dropping them.

  An error is turned into plain data in three places: the `err` field of a server log line, an error
  sent to a browser or API caller, and — new in this release — a dot-path read of an error value from
  config. That conversion used to lose fields silently and let a few live values through. Every own
  field of an error now appears, with anything unserializable replaced by a marker string:

  - A field holding a class instance no longer vanishes. A Node error carrying a `socket`, `agent` or
    similar field had that key dropped from the log line altogether, which is indistinguishable from
    the error not having the field; it now logs as `'[Object: Socket]'`. The instance's internals are
    still never expanded.
  - A field holding a function, a bigint or a symbol was passed through live. That leaked a closure
    over server state into serialized output, and a bigint field made `JSON.stringify` of the result
    throw `TypeError: Do not know how to serialize a BigInt`. These are now `'[Function: handler]'`,
    `'[BigInt: 10]'` and `'[Symbol: s]'`.
  - A circular `cause`, or an own field pointing back at the error itself, had its key dropped. Both
    are now `'[Circular]'`.
  - A `cause` chain longer than three levels ended with the fourth `cause` key simply absent. It is
    now `'[Truncated]'`.

  The markers are literal strings, so they show up wherever the serialized error does: a log line's
  `err.agent` reads `[Object: Socket]`, and `_actions: someAction.error.someField` can now resolve to
  `'[Object: Socket]'` rather than to the operator default.

  `extractErrorProps` also takes a new `omit` option — `extractErrorProps(error, { omit: (error) =>
['stack'] })`, called once per error node in the `cause` walk so a policy can key on the node it is
  looking at. `serializer.serialize` accepts the same function as `omitErrorProps` and passes it down.
  This is plugin and server API; app config is unaffected by it.

- Updated dependencies [3ead269]
- Updated dependencies [79bbd84]
- Updated dependencies [824f4be]
- Updated dependencies [824f4be]
- Updated dependencies [3ead269]
- Updated dependencies [1a6223f]
- Updated dependencies [3ead269]
  - @lowdefy/helpers@5.6.0
  - @lowdefy/errors@5.6.0

## 5.5.1

### Patch Changes

- @lowdefy/errors@5.5.1
- @lowdefy/helpers@5.5.1

## 5.5.0

### Patch Changes

- @lowdefy/errors@5.5.0
- @lowdefy/helpers@5.5.0

## 5.4.0

### Patch Changes

- Updated dependencies [25225ab]
- Updated dependencies [f11addd]
- Updated dependencies [0108f38]
- Updated dependencies [302e330]
  - @lowdefy/helpers@5.4.0
  - @lowdefy/errors@5.4.0

## 5.3.0

### Patch Changes

- @lowdefy/errors@5.3.0
- @lowdefy/helpers@5.3.0

## 5.2.0

### Patch Changes

- e3fc007: fix(logger): Handle non-object JSON values in stdout line handler.

  `JSON.parse` can return `null` for literal `"null"` input, crashing the CLI log handler. Non-object parsed values are now treated as plain text lines.

  - @lowdefy/errors@5.2.0
  - @lowdefy/helpers@5.2.0

## 5.1.0

### Patch Changes

- @lowdefy/errors@5.1.0
- @lowdefy/helpers@5.1.0

## 5.0.0

### Patch Changes

- Updated dependencies [905d5d406]
  - @lowdefy/helpers@5.0.0
  - @lowdefy/errors@5.0.0

## 4.7.3

### Patch Changes

- @lowdefy/errors@4.7.3
- @lowdefy/helpers@4.7.3

## 4.7.2

### Patch Changes

- @lowdefy/errors@4.7.2
- @lowdefy/helpers@4.7.2

## 4.7.1

### Patch Changes

- @lowdefy/errors@4.7.1
- @lowdefy/helpers@4.7.1

## 4.7.0

### Patch Changes

- Updated dependencies [4543688f7]
- Updated dependencies [dea6651a1]
  - @lowdefy/helpers@4.7.0
  - @lowdefy/errors@4.7.0

## 4.6.0

### Minor Changes

- f673e3ab3d: feat(logger): Add centralized @lowdefy/logger package and standardize logging

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

### Patch Changes

- aebca6ab51: refactor: Consolidate error classes into @lowdefy/errors package with environment-specific subpaths

  **Error Package Restructure**

  - New `@lowdefy/errors` package with all error classes (`ConfigError`, `PluginError`, `ServiceError`, `UserError`, `LowdefyInternalError`, `ConfigWarning`)
    - `@lowdefy/errors/build` - Build-time errors with sync resolution via keyMap/refMap
  - Moved ConfigMessage, resolveConfigLocation from node-utils to errors/build

  **TC39 Standard Constructor Signatures**

  - All error constructors standardized to `new MyError(message, { cause, ...options })`:
    ```javascript
    new ConfigError('Property must be a string.', { configKey });
    new OperatorError(e.message, { cause: e, typeName: '_if', received: params });
    new ServiceError(undefined, { cause: error, service: 'MongoDB', configKey });
    ```
  - Plugins throw simple errors without knowing about configKey
  - Interface layer adds configKey before re-throwing

  **configKey Added to ALL Errors**

  - Interface layer now adds configKey to ALL error types (not just PluginError):
    - ConfigError: adds configKey if not present, re-throws
    - ServiceError: created via `new ServiceError(undefined, { cause: error, service, configKey })`
    - Plain Error: wraps in PluginError with configKey
  - Helps developers trace any error back to its config source, including service/network errors

  **Cause Chain Support**

  - All error classes use TC39 `error.cause` instead of custom stack copying
  - CLI logger walks cause chain displaying `Caused by:` lines
  - `extractErrorProps` recursively serializes Error causes for pino JSON logs
  - ConfigError and PluginError extract `received` and `configKey` from `cause`:
    ```javascript
    new ConfigError(undefined, { cause: plainError }); // extracts cause.received and cause.configKey
    new PluginError(undefined, { cause: plainError }); // same extraction
    ```

  **Error Display**

  - `errorToDisplayString()` formats errors for display, appending `Received: <JSON>` when `error.received` is defined
  - `rawMessage` stores the original unformatted message on PluginError

- Updated dependencies [aa0d6d363e]
- Updated dependencies [aebca6ab51]
- Updated dependencies [ab19b1bb77]
- Updated dependencies [8ec5f1be05]
- Updated dependencies [f673e3ab3]
  - @lowdefy/errors@4.6.0
  - @lowdefy/helpers@4.6.0
