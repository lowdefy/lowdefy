---
'@lowdefy/errors': minor
'@lowdefy/helpers': minor
'@lowdefy/api': patch
'@lowdefy/client': patch
'@lowdefy/operators': patch
'@lowdefy/build': patch
'@lowdefy/logger': patch
'@lowdefy/engine': patch
---

refactor: Consolidate error classes into @lowdefy/errors package with environment-specific subpaths

**Error Package Restructure**

- New `@lowdefy/errors` package with all error classes (`ConfigError`, `PluginError`, `ServiceError`, `UserError`, `LowdefyError`, `ConfigWarning`)
  - `@lowdefy/errors/build` - Build-time errors with sync resolution via keyMap/refMap
- Moved ConfigMessage, resolveConfigLocation from node-utils to errors/build

**TC39 Standard Constructor Signatures**

- All error constructors standardized to `new MyError(message, { cause, ...options })`:
  ```javascript
  new ConfigError('Property must be a string.', { configKey });
  new OperatorError(undefined, { cause: error, typeName: '_if', received: params });
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
