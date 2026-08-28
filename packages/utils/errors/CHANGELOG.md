# @lowdefy/errors

## 5.5.1

## 5.5.0

## 5.4.0

### Minor Changes

- 302e330: feat(api): Add `callApi({ endpointId, payload })` to the request-resolver argument bag.

  Request resolvers (the JS resolvers shipped by connection plugins — e.g. `plugin-http`'s `get`, `plugin-mongodb`'s `find`) now receive a `callApi` function in their argument bag. Calling it invokes another Lowdefy endpoint in-process with the same semantics as the routine `:call_api` step: depth cap (10), caller's user identity, isolated routine context, inherited parser closure (`_user`, `_secret`, `_env`, `_payload`), and `InternalApi` endpoints reachable. Returns the target routine's response or throws on failure — `UserError` for `:throw`/`:reject`, original Lowdefy error class preserved otherwise.

  Supporting improvements landed alongside:

  - `_state` is now scoped to the routine frame. `:set_state` writes no longer leak across routine boundaries. Two sibling `:call_api` invocations see independent state.
  - `UserError` now accepts and forwards `cause`. `controlThrow` (`:throw`) and `controlReject` (`:reject`) construct `UserError` so routine-step and JS-boundary surfaces carry the same class for user-authored failures.
  - `callRequestResolver` passes all Lowdefy errors (those with `isLowdefyError === true`) through unchanged. Only raw errors are wrapped into `RequestError` / `ServiceError`. A deep `callApi` chain no longer accumulates redundant `cause` nesting.
  - `runRoutine` guards against double `handleError` invocations when the same error crosses multiple `runRoutine` boundaries on a `callApi` chain.
  - The endpoint-invocation sequence (`depth check → load config → authorize → child routineContext → runRoutine`) is factored into a shared `invokeEndpoint` helper used by both the routine `:call_api` step and the new `callApi` function.

  **Behavior change:** any app that accidentally relied on `:set_state` writes leaking across routine boundaries (e.g., a routine called via `:call_api` reading state set by its caller) will break. The leakage was a bug, not a contract — there is no backwards-compatibility shim.

## 5.3.0

## 5.2.0

## 5.1.0

## 5.0.0

## 4.7.3

## 4.7.2

## 4.7.1

## 4.7.0

## 4.6.0

### Minor Changes

- aa0d6d363e: feat: Config-aware error tracing and Sentry integration

  **Config-Aware Error Tracing (#1940)**

  - Errors now trace back to exact YAML config locations with file:line
  - Clickable VSCode links in terminal and browser
  - Build-time validation catches typos with "Did you mean?" suggestions
  - Service vs Config error classification

  **Plugin Error Refactoring**

  - Operators throw simple error messages without formatting
  - Parsers (WebParser, ServerParser, BuildParser) format errors with received value and location
  - Removed redundant "Operator Error:" prefix from error messages
  - Consistent error format: "{message} Received: {params} at {location}."
  - Actions and connections also simplified: removed inline `received` from error messages (interface layer adds it)
  - Connection plugins (axios-http, knex, redis, sendgrid) no longer expose raw response data in errors

  **Error Class Hierarchy**

  - Unified error system in `@lowdefy/errors` with all error classes
    - `@lowdefy/errors/build` - Build-time classes with sync location resolution
  - Error classes: `LowdefyError`, `ConfigError`, `ConfigWarning`, `PluginError`, `ServiceError`
  - `ConfigWarning` supports `prodError` flag to throw in production builds
  - `ServiceError.isServiceError()` detects network/timeout/5xx errors
  - `~ignoreBuildChecks` cascades through descendants to suppress warnings/errors

  **Build Error Collection**

  - Errors collected in `context.errors[]` instead of throwing immediately
  - `tryBuildStep()` wrapper catches and collects errors from build steps
  - All errors logged together before summary message for proper ordering

  **Sentry Integration (#1945)**

  - Zero-config Sentry support - just set SENTRY_DSN
  - Client and server error capture with Lowdefy context (pageId, blockId, config location)
  - Configurable sampling rates, session replay, user feedback
  - Graceful no-op when DSN not set

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

- f673e3ab3: feat(errors): Add UserError class and thread actionId through request pipeline

  **UserError Class**

  - New `UserError` in `@lowdefy/errors` for expected user-facing errors (validation failures, intentional throws)
  - UserError logs to browser console only — never sent to the server terminal
  - `Throw` action now throws `UserError` instead of custom `ThrowActionError`

  **Engine Error Routing**

  - `Actions.logActionError()` routes errors by type: `UserError` → `console.error()`, all others → `logError()` (terminal)
  - Deduplication by error message + action ID prevents repeated logging

  **actionId Threading**

  - `actionId` threaded from `callAction` through `createRequest` to `Requests.callRequests`
  - Server-dev request handler logs request trace via `logger.ui.dim()` for dimmed output
  - Enables request logs to include the triggering action for better debugging context
