---
'@lowdefy/errors': minor
'@lowdefy/helpers': minor
'@lowdefy/api': patch
'@lowdefy/client': patch
'@lowdefy/operators': patch
'@lowdefy/build': patch
---

refactor: Consolidate error classes into @lowdefy/errors package with environment-specific subpaths

**Error Package Restructure**

- New `@lowdefy/errors` package with environment-specific subpaths:
  - `@lowdefy/errors/build` - Build-time errors with sync resolution via keyMap/refMap
  - `@lowdefy/errors/server` - Server-side errors (re-exports base classes)
  - `@lowdefy/errors/client` - Client-side errors with async resolution via API
- Moved ConfigMessage, resolveConfigLocation from node-utils to errors/build

**ConfigError String Overload**

- ConfigError now accepts simple string form for plugin convenience:
  ```javascript
  throw new ConfigError('Property must be a string.');
  ```
- Plugins throw simple errors without knowing about configKey
- Interface layer adds configKey before re-throwing

**configKey Added to ALL Errors**

- Interface layer now adds configKey to ALL error types (not just PluginError):
  - ConfigError: adds configKey if not present, re-throws
  - ServiceError: created via `new ServiceError({ error, service, configKey })`
  - Plain Error: wraps in PluginError with configKey
- Helps developers trace any error back to its config source, including service/network errors

**Property Extraction from Wrapped Errors**

- ConfigError and PluginError now extract `received` and `configKey` from the wrapped error:
  ```javascript
  new ConfigError({ error: plainError }) // extracts plainError.received and plainError.configKey
  new PluginError({ error: plainError }) // same extraction
  ```

**Error Message Pattern**

- All error classes have `.print()` method using shared `formatErrorMessage()`
- `formatErrorMessage()` appends `Received: <JSON>` when `error.received` is defined
- `rawMessage` stores the original unformatted message on PluginError
