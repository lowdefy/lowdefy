# @lowdefy/logger

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
