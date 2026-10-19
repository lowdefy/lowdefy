# @lowdefy/errors

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

## 6.0.0

### Minor Changes

- 37c8c14: feat: `auth.strategies` — apiKey and JWT header authentication for API callers.

  - New `auth.strategies` config block: apiKey (default `X-API-Key` header) and jwt strategies, each granting the caller the strategy's `roles`.
  - MCP and service clients that cannot hold a session cookie authenticate per request; a matched strategy yields a caller (`apiKey:{strategyId}:{keyId}`) that flows through the existing authorization and `_user` machinery.
  - Unauthenticated calls to role-gated endpoints now return 401 (`AuthenticationError`) instead of a masked error.

### Patch Changes

- c9bea1c: fix(errors): Resolve config locations through module refs to the defining file.

  Blocks passed into a module via vars resolved their config location to lowdefy.yaml instead of the file where they are written, because a module invocation's ref has no file path of its own. Location resolution now walks the ref chain to the nearest real file, so Option/Alt+click open-in-editor, `/lowdefy-docs/find`, and error messages point at the correct yaml file and line for module content.

## 5.6.0

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
