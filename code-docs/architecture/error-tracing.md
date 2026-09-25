# Error Tracing System

Config-aware error tracing that maps runtime and build-time errors back to their source YAML configuration files.

> **IMPORTANT: Collect Errors, Don't Throw Immediately**
>
> Build-time validation errors MUST be collected using `collectExceptions()` instead of throwing `ConfigError` directly. This allows the build to continue and report ALL errors at once, rather than stopping at the first error.
>
> ```javascript
> // WRONG - stops build at first error
> throw new ConfigError('...', { configKey });
>
> // CORRECT - collects error, build continues
> import collectExceptions from '../utils/collectExceptions.js';
> collectExceptions(context, new ConfigError('...', { configKey }));
> ```
>
> When collecting errors, return early from the current function to avoid continuing with invalid data. The error will be reported with all other errors at the build checkpoint.

## Context

When Lowdefy throws errors (client, server, or build), developers need to trace them back to the specific location in their YAML configuration. This system uses build artifacts (`keyMap.json` and `refMap.json`) to resolve error locations with file paths and line numbers.

## Key Components

### Build-Time Tracking

The build pipeline tracks the origin of every config value:

| Artifact      | Purpose                                | Contents                                                            |
| ------------- | -------------------------------------- | ------------------------------------------------------------------- |
| `keyMap.json` | Maps internal keys to config locations | `{ "abc123": { key: "pages.0.blocks.0", "~r": "ref1", "~l": 15 } }` |
| `refMap.json` | Maps ref IDs to source files           | `{ "ref1": { path: "pages/home.yaml" } }`                           |

**Property markers added during build:**

- `~k` (configKey): Unique key identifying the config location
- `~l` (line): Line number in the source file
- `~r` (ref): Reference ID linking to the source file

### Location Resolution

Three functions handle different resolution contexts (all in `@lowdefy/errors`):

| Function                      | Context            | Signature                                                                 |
| ----------------------------- | ------------------ | ------------------------------------------------------------------------- |
| `resolveConfigLocation`       | Sync, post-addKeys | `({ configKey, keyMap, refMap, configDirectory })` → `{ source, config }` |
| `resolveErrorLocation`        | Sync, unified      | `(error, { keyMap, refMap, configDirectory })` — mutates error            |
| `loadAndResolveErrorLocation` | Async, runtime     | `({ error, readConfigFile, configDirectory })` → `{ source, config }`     |

```javascript
import { resolveConfigLocation } from '@lowdefy/errors';

const location = resolveConfigLocation({
  configKey: 'abc123',
  keyMap: context.keyMap,
  refMap: context.refMap,
  configDirectory: '/Users/dev/myapp',
});
// Returns:
// {
//   source: '/Users/dev/myapp/pages/home.yaml:15',  // absolute path:line
//   config: 'pages.0.blocks.0',                      // config path
// }
```

### Error Class Hierarchy

All error classes in `@lowdefy/errors` with single flat entry point:

| Error Class                       | Purpose                                                   | Thrown By                                                | Stack in CLI      |
| --------------------------------- | --------------------------------------------------------- | -------------------------------------------------------- | ----------------- |
| `LowdefyInternalError`            | Internal Lowdefy bugs                                     | Anywhere inside Lowdefy                                  | Yes (bugs)        |
| `ConfigError`                     | Config validation errors                                  | Build validation                                         | No (use source)   |
| `ConfigWarning`                   | Config inconsistencies                                    | Build validation                                         | No (use source)   |
| `BuildError`                      | Summary after errors logged                               | `logCollectedErrors`                                     | No (summary)      |
| `PluginError`                     | Base class (not used directly)                            | —                                                        | —                 |
| `OperatorError`                   | Operator failures                                         | Operator parsers                                         | No (use received) |
| `ActionError`                     | Action failures                                           | Action runner (engine)                                   | No (use received) |
| `RequestError`                    | Request/connection failures                               | Request handler (API)                                    | No (use received) |
| `BlockError`                      | Block rendering failures                                  | ErrorBoundary (client)                                   | No (use received) |
| `ServiceError`                    | External service failures                                 | Plugin interface layer                                   | No (use service)  |
| `AuthenticationError`             | Unauthenticated request (401)                             | API authorization gates                                  | No (warn line)    |
| `TwoFactorEnrolmentRequiredError` | Unenrolled caller under `twoFactor.required` (403)        | Authorization gate                                       | No (warn line)    |
| `AuthorizationError`              | Authenticated caller refused by a gate (wrong roles, 403) | Request/endpoint/agent/websocket/auth-step gates         | No (warn line)    |
| `UserError`                       | Expected user-interaction outcome                         | Validate, Throw, `:throw`/`:reject`, client auth methods | No (client-only)  |

**Key markers:** All classes set `isLowdefyError = true` — survives serialization, replaces `instanceof` checks.

### Faults vs. expected outcomes

Every error is one of two things, and the class says which:

- **A fault** — something a developer (config) or Lowdefy (internal) or an operator (service) has to fix. `ConfigError`, `LowdefyInternalError`, `ServiceError` and the `PluginError` subclasses are faults. They are logged at error level, resolved to a config location where one exists, captured to Sentry, and a browser-originated one is POSTed to `/api/client-error` so the server can log it with its source line.
- **An expected outcome** — the system worked and said no. `UserError` (validation failed, the author's `Throw`, a rejected sign-in), `AuthenticationError` (no credentials, 401), `AuthorizationError` (authenticated but wrong roles, 403 — the gate's message may stay deliberately generic so it does not reveal what exists) and `TwoFactorEnrolmentRequiredError` (403) are expected. They still surface to the caller — the message displays, `catch:` actions run, the HTTP status is right — but they log as one warn line on the server or to the browser console only, never at error level, never to Sentry, never against a config location.

The test when classifying: _would a developer need to change config to stop this from happening?_ If not, it is not an `ActionError`/`RequestError`/`ConfigError`.

**Auth server rejections are expected outcomes.** BetterAuth's client resolves `{ data, error }`; `unwrap` in `packages/client/src/auth/createAuthMethods.js` rethrows an `error.status` in the 4xx range as a `UserError` (with `metaData: { code, status }` for page config to branch on) and anything else — a 5xx or network failure — as a plain `Error`, which the action runner wraps as an `ActionError` and reports. Server-side, `options.onAPIError.onError` (`packages/api/src/routes/auth/createOnAPIError.js`) owns BetterAuth's API-error logging: a 4xx `APIError` is one warn line, everything else is `logger.error(error)`. Without it BetterAuth's router logged every 4xx at error level whenever the logger level was `warn` or `debug`, so a wrong password or an expired magic link produced an `ERROR [Better Auth]` line on every attempt.

**Key principle:** Plugins throw errors without knowing about config keys. The interface layer catches all errors and adds `configKey` for location resolution.

### Property Extraction from Cause Chain

All error constructors follow the TC39 standard: `new MyError(message, { cause, ...options })`. When wrapping an error via `cause`, properties are extracted from the cause as fallbacks:

| Property    | ConfigError                             | PluginError (base)                      | ServiceError        |
| ----------- | --------------------------------------- | --------------------------------------- | ------------------- |
| `configKey` | `options.configKey ?? cause?.configKey` | `cause?.configKey ?? options.configKey` | `options.configKey` |
| `received`  | `options.received ?? cause?.received`   | `options.received ?? cause?.received`   | N/A                 |
| `message`   | `message ?? cause?.message`             | `message ?? cause?.message`             | `message`           |

The `cause` property is set via TC39 standard `error.cause`, and the CLI logger walks the cause chain displaying `Caused by:` lines. `extractErrorProps` recursively serializes Error causes.

```javascript
// Plain error with received (e.g., from operator parser)
const err = new Error('bad input');
err.received = { _if: [true, 'a', 'b'] };
err.configKey = 'abc123';

// Wrapping preserves both properties via cause chain
const configError = new ConfigError(undefined, { cause: err });
configError.received; // { _if: [true, 'a', 'b'] }
configError.configKey; // 'abc123'
configError.cause; // err
```

### Error Catch Layers

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ERROR CATCH LAYERS                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Layer 1: TOP LEVEL (build/server/client entry points)                      │
│  ├─ Catches: Everything that bubbles up                                     │
│  ├─ Calls: context.handleError(error) — resolves location, logs, Sentry     │
│  └─ Re-throws: ConfigError, OperatorError, ActionError, etc. (formatted)    │
│                                                                             │
│  Layer 2: PLUGIN INTERFACE (parsers, action runner, request handler)        │
│  ├─ Catches: All errors from plugin code                                    │
│  ├─ Adds configKey to ALL errors for location tracing                       │
│  ├─ ConfigError: adds configKey if not present, re-throws                   │
│  ├─ ServiceError: creates new ServiceError(undefined, { cause: error, service, configKey }) │
│  └─ Plain Error: wraps in typed error (OperatorError, ActionError, etc.)    │
│                                                                             │
│  Layer 3: BUILD VALIDATION (schema, refs, type checking)                    │
│  ├─ Errors: collectExceptions(context, new ConfigError('...', { configKey }))  │
│  └─ Warnings: context.handleWarning(new ConfigWarning('...', { configKey }))   │
│                                                                             │
│  Layer 4: PLUGIN CODE (operators, actions, blocks, connections)             │
│  ├─ Throws: Plain Error('simple message')                                   │
│  └─ No knowledge of Lowdefy error classes                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## handleError and handleWarning

Error handling is separate from logging. `handleError` and `handleWarning` are explicit functions — not hidden behind logger methods.

### handleError

| Environment | Access                          | Async | Created By                            |
| ----------- | ------------------------------- | ----- | ------------------------------------- |
| **Build**   | `context.handleError`           | Sync  | `createBuildHandleError({ context })` |
| **Server**  | `context.handleError`           | Async | `createHandleError({ ... })`          |
| **Browser** | `lowdefy._internal.handleError` | Async | `createHandleError(lowdefy)`          |
| **CLI**     | `errorHandler` (imported)       | Async | Direct function                       |

**Build handleError** (`packages/build/src/utils/createBuildHandleError.js`):

```javascript
function handleError(error) {
  try {
    resolveErrorLocation(error, {
      keyMap: context.keyMap,
      refMap: context.refMap,
      configDirectory: context.directories?.config,
    });
    context.logger.error(error); // Just logger.error(error) — display layer formats
  } catch {
    try {
      context.logger.error(error);
    } catch {
      console.error(error);
    }
  }
}
```

Three-layer safety net: resolve + log → log without resolve → console.error.

**Server handleError** (`packages/servers/*/lib/server/log/createHandleError.js`):

Per-request, async. Reads keyMap/refMap from build artifacts, resolves location, logs with request metadata (user, URL, headers), captures to Sentry. It also sets `error.handled = true` — the signal the browser reads to know this error was already logged server-side. Once `handleError` has run, the error crosses the wire under the wire policy in [Readers and their policies](#readers-and-their-policies).

**Browser handleError** (`packages/client/src/createHandleError.js`):

Deduplicates by `message:configKey`, where the message is the dev error's in dev (see [Dev tools](#dev-tools)) — which is why the wire keeps `configKey`. Two paths:

1. **Already-logged errors** (`handled` is true): Logs to browser console only — the server already logged it, no round-trip needed.
2. **Client-originated errors** (`handled` falsy): Serializes error via `serializer.serialize()` (uses `~e` marker), sends to `/api/client-error`, receives resolved `source` back, displays via shared browser logger.

The gate is `handled`, not `source`. `source` conflates _has a resolved config location_ with _was already logged_, and the two come apart: a `LowdefyInternalError` is logged server-side but never gets a `source`, because location resolution is deliberately skipped for it. Keying on `source` therefore POSTed every internal error back and had it logged twice.

### handleWarning

Build-only. Created by `createHandleWarning({ context })`.

```javascript
function handleWarning(warning) {
  // 1. Check suppression
  if (shouldSuppressBuildCheck(warning, context.keyMap)) return;

  // 2. Escalate in prod if marked prodError
  if (warning.prodError && context.stage === 'prod') {
    collectExceptions(context, warning); // ConfigWarning extends ConfigError
    return;
  }

  // 3. Resolve location
  resolveErrorLocation(warning, { keyMap, refMap, configDirectory });

  // 4. Dedup by source location
  const dedupKey = warning.source ?? warning.message;
  if (context.seenSourceLines?.has(dedupKey)) return;
  context.seenSourceLines?.add(dedupKey);

  // 5. Log
  context.logger.warn(warning);
}
```

**Usage:**

```javascript
context.handleWarning(
  new ConfigWarning('_state references "userName" but no block with id "userName" exists.', {
    configKey: obj['~k'],
    checkSlug: 'state-refs',
    prodError: true,
  })
);
```

## Readers and their policies

A server error has four readers, and each gets its own policy:

| Reader                                                                                                                                                                | Sees                                                                                                           | Where                                                        |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| **End user and app config** (toast, `_actions: x.error`, `_request_details`, client `_error`, websocket `onError`, AgentChat `_event: message`, an app agent's model) | The author's message, or the generic one                                                                       | Every Lowdefy route and transport, identical in dev and prod |
| **Dev tools** (error bar, browser console, dev terminal, agent error feed, dev MCP tool results)                                                                      | The full error, through `devError`                                                                             | Dev server only                                              |
| **Prod logs and Sentry**                                                                                                                                              | Allowlisted fields per error node, every emitted string scrubbed of known secret values                        | Prod server only                                             |
| **Routine and client catch config** (`_error`)                                                                                                                        | An Error with name, message, code, statusCode and cause; secrets scrubbed; generic again if sent to the client | Identical in dev and prod                                    |

The dev/prod split never touches anything config can read. A `:catch` or a client `catch` list behaves the same on a laptop and in production, so an author cannot write error handling that only works in dev.

The three shapes that walk an error — the wire, the prod log and `_error`'s — are projections over the one serializer walk. `serializer.serialize(value, { projectError })` passes `projectError` to `extractErrorProps`, which calls it once per error node: the cause chain, an `Error`-valued own property, and an `Error` nested in a plain object or array. `project(err)` returns the props to emit for that node, and the walk recurses into the `cause` it returns, so a projection can rename `name`, replace `message`, add `requestId` or drop the cause, at every depth. `@lowdefy/helpers` knows only how to walk; which fields an audience sees stays with the package that owns the audience.

### `code` and `statusCode`

Every projection reads the two fields with `readErrorCodes` (`@lowdefy/errors`), one rule over the conventions libraries already follow instead of a per-driver table that goes stale:

- `code` — the node's own `code` (Node system errors, Postgres SQLSTATE, MongoDB, axios).
- `statusCode` — the first of the node's `statusCode`, `status` and `response.status` that is a number.

The rule reads each node's own fields, so the top-level error must carry them for config to branch on `statusCode` without reading the cause. `PluginError`'s constructor lifts both from its `cause` by the same rule, one level, which covers `RequestError`, `OperatorError` and `ActionError`. `AxiosHttp` sets `code` and `statusCode` (`error.response.status`) on the `Error` it throws for a non-2xx response, because that wrapper has no status of its own for `PluginError` to lift.

### Wire: end user and app config

**Every error a server sends to a user or app config goes through one projection, `createWireProjection(context)`** (`packages/api/src/response/createWireProjection.js`). Three functions exported from `@lowdefy/api` apply it, one per call shape: `redactErrorResponse(context, error)` for an error alone, `redactResponse(context, response)` for a response value that may contain one, and `buildEndpointResult(context, { error, response, status })` for the endpoint wire object. All three own the serialization as well as the policy, so there is no bare `serializer.serialize(error)` in response position for a caller to forget.

`redactResponse` exists because a response is an error-serialization site whenever it holds an error — `makeReplacer` wraps any `Error` it meets anywhere in a value. That is invisible to a grep for `serialize(error)`, which is why it is a function rather than a rule to remember. It governs the `response` field of `buildEndpointResult` and the request body from `callRequest`. It also serializes with `skipMarkers`: a response built from config (a `:return` literal, a `:set_state` value read back) carries that config's hidden `~k`, `~r` and `~l` markers, and the plain `serialize` would write them out as keys and wrap marked arrays as `{ '~arr': [...] }`. A webhook response goes to a third party verbatim and the dev tools return the wire as it is, so the markers stay off the wire.

**Only the author's message crosses.** A library's message embeds whatever the library saw — a URL with credentials, SQL, a hostname — so every error except the pass-through classes becomes:

| Field            | Value                                                                                      | Why it crosses                                                                                                                                                                                                                                                                     |
| ---------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`           | The class name if it is in `lowdefyErrorNames`, else `Error`                               | Config branches on it. A foreign class name can itself say which library or driver failed.                                                                                                                                                                                         |
| `message`        | `server.genericError`, translated for the request's locale                                 | The one generic message. A per-class set would tell the user nothing more useful.                                                                                                                                                                                                  |
| `code`           | `readErrorCodes`                                                                           | Config tells a duplicate key (`11000`) from anything else.                                                                                                                                                                                                                         |
| `statusCode`     | `readErrorCodes`                                                                           | Config tells a missing record (404) from an outage, and a client `catch` list can branch where a page request has no routine.                                                                                                                                                      |
| `configKey`      | The node's `~k` (`PluginError`'s `null` default becomes `undefined`, which the walk drops) | Names a config node the client already holds, and is half of the browser's dedup key.                                                                                                                                                                                              |
| `requestId`      | `context.rid`                                                                              | Printed on the browser console line; matches the server log line and the Sentry `requestId` tag.                                                                                                                                                                                   |
| `isLowdefyError` | Always `true`                                                                              | The client revives errors without running a constructor, so the flag exists only if the wire carries it. Without it the action runner wraps the error in a new `ActionError` without `handled`, POSTs it to `/api/client-error`, and the server logs and reports it a second time. |
| `handled`        | Copied from the node                                                                       | The already-logged gate (see [Browser handleError](#browser-handleerror)).                                                                                                                                                                                                         |

Nothing else crosses: no cause chain, no `source` or `config`, no `received`, no `stack`, no other own property. The full error stays in the server log, and in dev reaches the developer through `devError`.

**Pass-through classes.** Keyed on `err.name`, not `instanceof`: the error may come from another copy of `@lowdefy/errors` or from a serializer round trip, where the class identity is gone but the name survives.

- **`UserError`** keeps `name`, `message`, `cause`, `metaData`, `blockId`, `pageId`, `isReject`, `configKey`, `handled` and `requestId`, and sends `isLowdefyError: true` whether or not the node has it — an `_error` value rebuilt from a caught `UserError` keeps only its class. `UserError` is what an author or plugin throws when the message is meant for the user: `:throw`, `:reject`, a failed `ValidateSchema` step (its message is built from the schema path and rule, never the data), and plugins such as the MCP payload check. Its `cause` is returned raw so the walk projects it too: an `Error` cause takes the generic shape, and a non-`Error` cause is author data, cleaned as a value.
- **Auth refusals** keep their message, like `UserError`, because the framework writes those messages to reveal nothing and clients act on them. `AUTH_REFUSAL_NAMES` lists `AuthenticationError`, `AuthorizationError` and `TwoFactorEnrolmentRequiredError`. The server error handlers answer each directly with `{ name, message }` and a 401 or 403, before the projection; the projection matters where one reaches an endpoint result, a websocket reply or an MCP tool result instead.

**The generic message is translated on the server.** `server.genericError` (English "Something went wrong.") is a built-in i18n string in `builtinMessages.js`, overridable per locale in `config.i18n.messages`. `createWireProjection` translates it once per projection with `translate({ key: 'server.genericError', i18n: context?.i18n })`, where `context.i18n.active` is the locale `createApiContext` resolved from the request headers. Translating on the server needs no wire flag to mark generic errors and covers every transport alike: a websocket broadcast and the agent chat stream carry a bare string, and MCP clients never run the browser's decode. The context is optional — a websocket broadcast has no single request and the server error handler can run before any request context exists — so without one the message is the English default and there is no `requestId`.

**Sites covered.** Every place a server error leaves the process to a user or app config:

- **`redactErrorResponse`**: the hono error handlers' 500 responses for `/api/` paths (`servers/*/src/middleware/errorHandler.js`), `apiWrapper` in `server` and `server-e2e`, and `server-dev`'s page request route.
- **`buildEndpointResult`**: `callEndpoint`, `runScheduledEndpoint`, `runWebhookEndpoint`, `runDetachedEndpoint` and agent endpoint tool calls (`prepareAgent`). An endpoint result body carries an error at HTTP 200, and a cron or detached route returns one to a third party, so this is not only the 500 path.
- **`redactResponse`**: `callRequest`'s response and the `response` field of every endpoint result.
- **Websocket replies.** `createWebSocketConnection`'s `sendErrorPayload` answers a failed subscribe or publish with `{ type: 'error', websocketId, requestId, error: redactErrorResponse(context, error) }`. The client decodes it with `decodeServerError` and rejects the pending action with it.
- **Websocket broadcasts.** `createChannelRegistry`'s `broadcastError` sends a running channel's failure to each subscriber as a `message` string — `createWireProjection({ i18n: subscriber.i18n })(error).message`. Config reads a broadcast error only as a string (the channel's `onError`). The channel's context belongs to whoever subscribed first, so each subscriber object carries its own connection's `i18n` and the message is translated per subscriber. No `requestId`, since no single request raised it, and no `devError`, since the dev terminal already logs it and no dev tool displays a broadcast.
- **MCP tool errors.** Both branches of `createMcpServer` format through `formatErrorForAgent`, which in prod returns `createWireProjection(context)(error).message`: the wire message for a failed endpoint (from the endpoint result), and the projection of an error that never went through an endpoint result on the catch branch. In dev both branches return the full message instead — see [Dev tools](#dev-tools).
- **The agent chat stream.** `prepareAgent` passes `wireErrorMessage` into the agent context, since agent plugins cannot import `@lowdefy/api`. `handleAgentChat`'s `clientErrorText` returns it and is the `onError` of the outer `createUIMessageStream` and of both inner streams (`toUIMessageStream`, `createAgentUIStream`) — the AI SDK's default `onError` writes a tool error or in-stream error to the client raw. The AgentChat block hands that text to config as `_event: message`.
- **An app agent's tool results.** `buildAgentTools` throws the wire message of a failed endpoint back to the model, in both modes. The model's reply reaches the end user, so the model is a reader of the end-user kind, and an agent behaves in dev as it will in prod.

BetterAuth's own route bodies (`/api/auth/*`) are outside this policy: the auth library writes them for the user.

**What app config loses, knowingly.**

- The default error toast of an action shows "Something went wrong." for any server error the author did not write. `messages.error` on the action overrides the toast, and `_error` lets a `:catch` read the real message and choose what to send.
- `received` and `source` never cross. `errorToDisplayString` appends `Received: <json>` when `received` is present, so that branch is dead for every server-originated error, and config that rendered `_actions: x.error.received` reads `undefined`.
- The production browser loses the config location. Prod debugging happens in Sentry, which has it as `extra.configLocation`, and in the log, both found by `requestId`.

### Dev tools

**The dev server adds a `devError` field beside the wire error.** `redactErrorResponse` returns `{ '~e': <wire error> }` in every mode; when `context.mode === 'dev'` it adds `devError: { '~e': <full error> }` — the error as the dev terminal logs it: full cause chain, `stack`, `received`, `source` and `config`, plus `requestId`. It is neither scrubbed nor allowlisted: the developer's machine already holds every value in it. `normalizeErrorSources` makes each `source` in `devError` config-relative, so the dev tools show the path the developer knows; it keys on the error-node shape (`name` and `message` both strings), so a `source` key inside author data — a `UserError`'s `cause` or `metaData` — is never rewritten.

`devError` sits beside `~e`, not inside it, because the serializer's reviver replaces any object holding `~e` with its error: a plain `serializer.deserialize` of the payload drops `devError`, so no decode path that forgets about it can hand it to config. `buildEndpointResult`'s `error` field is `redactErrorResponse`'s payload, so it carries `devError` in dev; its `response` field never does — an Error in a response value is data the routine returned, not a failure of the request.

**The client decodes server errors in one function.** `decodeServerError(payload)` (`packages/engine/src/decodeServerError.js`) deserializes the wire error and, when the payload has `devError`, records the deserialized dev error in a module-level `WeakMap` keyed by the decoded error. `getDevError(error)` reads it back. Every decode site calls it: `client/src/request.js` for non-2xx responses, `engine/src/callAPIHandler.js` for endpoint results (decoded once, so the stored `api.error` and the thrown error are the same object and the key matches), and `client/src/websocket/createWebSocketClient.js` for reply error frames. The engine owns the module and exports both functions because `@lowdefy/client` depends on `@lowdefy/engine`, not the reverse, and one module keeps every decode site and the error handler on the same `WeakMap`.

The `WeakMap` is the guarantee that config never reads `devError`. The decoded error is stored as `request.error` / `api.error`, rethrown, and read by config through `_actions`, `_request_details` and `_error`, so any property on it — enumerable or not — is one operator change away from config. The error handler calls `getDevError(error)` instead and shows the dev error when there is one; every other decision (the `UserError` branch, the `handled` gate, the POST to `/api/client-error`) stays on the error config sees. The module also records each decoded error in a `WeakSet` (`isDecodedServerError`), which the action runner uses to pass a server error to a `catch` list's `_error` as decoded.

**`context.mode` is set by the server package.** Each server package sets it when it builds a request or system context: `server-dev`'s `createLowdefyContext` and auth-hook `createSystemContext` set `dev`; `server`'s auth-hook `createSystemContext` and `server`'s and `server-e2e`'s `apiContext` middleware and `apiWrapper` set `prod`. `@lowdefy/api`'s `createSystemContext` takes `mode` and `scrubSecrets` from the server like its other fields. `@lowdefy/api` has no other environment signal. `NODE_ENV` is the wrong one: `lowdefy start` runs the production server on a laptop, and `NODE_ENV` is easy to mis-set on a deployment, while the package that is running cannot be wrong. Nor is `configDirectory`: production leaves it unset by omission, not by contract, and the e2e server sets it for location resolution. The e2e server takes `prod` so end-to-end tests assert what production users and config see. Only the dev-tool branches read `mode` — `redactErrorResponse`'s `devError` and `formatErrorForAgent` — never anything config reads.

**Dedup.** The browser error handler dedups on `${shown.message}:${error.configKey}`, where `shown` is the dev error when there is one. Errors from different requests keep different keys through `configKey`, and a request that fails on every poll logs once — keying on `requestId` would log it on every poll. In prod the generic message means an action logs its first server failure per page load; in dev a developer who changes the input and gets a different failure sees it. That key is the only dedup for errors bound for `handleError`: `Actions.logActionError` keeps its own `${message}:${action.id}` set only for the `UserError` console line, which bypasses `handleError`. Deduping every error there would, with every server message identical, hide each later failure of an action in dev too.

**`requestId` on the console line.** The browser logger prints `  Request ID: <id>` under a Lowdefy error that carries one. The console, not the toast, carries it: it is what a user or support quotes to find the matching log line and Sentry event.

**Other dev tools.** The dev terminal and the agent error feed (`GET /lowdefy-docs/build-status`) read the server's own logging, never the wire, so they keep full fidelity; `server-dev` builds its logger with `createNodeLogger`'s default `err` serializer. The dev MCP route serves a coding agent, a dev tool: `formatErrorForAgent` returns the message with ` (at <source>)` and ` Hint: <hint>` appended — `devError`'s for a failed endpoint, the caught error's on the catch branch.

**Dev-only exemptions.** `logClientError` returns `configError: serializer.serialize(validationError)` plus an absolute `source` at HTTP 200, and `server-dev`'s `clientError.js` is the only route that forwards them to the browser (prod and e2e return `{ success: true }`). `jitPage` sends build-error `stack` because `BuildErrorPage.jsx` renders it. Both carry more than the wire allows, on the developer's own machine.

**Known residual.** `errorHandler`'s `else` branch, for requests that never got a `lowdefyContext`, logs via `logger.error` without setting `handled` or `source`. The client therefore POSTs such an error back and it is logged twice. Without a context there is no `keyMap` access, so the round trip is what resolves the error's config location, and the duplicate log is the price of getting it.

### Prod logs and Sentry

The prod log cannot enumerate every field a library hides a credential in — axios alone carries them in `config.auth`, `config.params`, `config.headers` and `baseURL`. So it does not try to. Two layers, each covering what the other cannot.

**Layer 1 — the shape comes from an allowlist.** The prod logger (`servers/server/lib/server/log/createLogger.js`) passes `serializeErrorForLog` as pino's `err` serializer. It is the log projection, `projectErrorForLog` (`logErrorProjection.js`), over the one walk, so it applies at every error node. Each node keeps:

- Every node: `name`, `message`, `stack`, `code`, `statusCode`, `cause`.
- Only nodes whose `name` is in `lowdefyErrorNames`: `configKey`, `source`, `config`, `handled`, `isLowdefyError`, `received`, `typeName`, `location`, `service`, `hint`, `methodName`, `metaData`, `blockId`, `pageId`, `isReject`. Libraries reuse some of these names for their own data — axios's `config` carries auth, params and headers — so keying on the field alone would let a library's copy through.

Everything else is dropped: axios's `config`, `request` and `response`, pg's `detail`, Node's `input`, any object a future library invents. Upstream response bodies go with them; that is the debugging cost of not depending on field names. `received` stays: it is the evaluated request properties, the most useful thing in the log, and layer 2 removes the secrets in it.

**Inside `received`, credential-named keys are masked.** `received` is the one kept field holding values the server fetched at runtime — a token from one step sent as `headers.Authorization` in the next — which the by-value scrub cannot recognise. `maskCredentialKeys` replaces, at any depth, the value under any key that, lower-cased with `-` and `_` removed, contains `authorization`, `token`, `secret`, `password`, `apikey` or `cookie` with `[REDACTED]`. That catches `Authorization`, `access_token`, `x-api-key` and `client_secret`, and masks a harmless `tokenCount` too, which costs a log nothing. The wire and `_error` never carry `received`, so the mask exists only in the log projection.

**Layer 2 — every emitted string is scrubbed by value.** The allowlist cannot make a message safe: a client library can put an API key into the URL in its message. The server knows every secret it holds, so `createSecretScrubber` (`@lowdefy/node-utils`) removes them from the finished output. Each server package builds it once at startup as `scrubSecrets` (`servers/*/lib/server/scrubSecrets.js`) and puts it on every request context and auth-hook system context beside `secrets`.

- **Which values:** every string leaf of the `LOWDEFY_SECRET_*` secrets (`getSecretsFromEnv`), plus `CRON_SECRET` and `BETTER_AUTH_SECRET`. Authors JSON-encode structured secrets and pick a leaf with `_json.parse`, and the log then holds the leaf, not the whole string, so when a value parses as a JSON object or array each of its string leaves joins the set too. Values shorter than 8 characters are skipped, so a secret like `true` or a port number does not shred unrelated text.
- **Which forms:** the raw value, its `encodeURIComponent` form, its JSON-escaped form, and its base64 and base64url forms at all three byte alignments, each replaced with `[REDACTED]`. A secret inside a larger base64 payload — a Basic auth header built from `user:password` — only matches the secret's own base64 when both start on the same 3-byte boundary, so the scrubber encodes the value at each offset and keeps only the characters whose bits fall wholly inside the secret. Forms are replaced longest first, so a form is removed whole before a shorter form it contains can break it up.
- **Where, for the log:** pino's `hooks.streamWrite` on the prod logger, through `createNodeLogger`'s `hooks` option. It sees each finished JSON line, so it covers every field of every log call — `err`, debug payloads, request results — with no walker to miss one.
- **Where, for Sentry:** `initSentry` sets `beforeSend`, `beforeSendTransaction`, `beforeSendSpan` and `beforeBreadcrumb`, each running `scrubEvent`, which scrubs every string in the event. `beforeSend` covers error events with their cause chain; the transaction and span hooks cover outgoing request URLs with their query strings, sent on every sampled request whether it failed or not; `beforeBreadcrumb` covers the outgoing request URLs the HTTP integration records. `captureSentryError` sends `serializeErrorForLog(error)` as `extra.error` — Sentry's own serialization carries only names, messages and stacks — and adds `requestId` as a tag.
- **Incoming request bodies are off.** `@sentry/node` attaches incoming request bodies to error events by default — an endpoint payload, a sign-in password — and no value scrub can recognise them. `initSentry` passes `httpIntegration({ maxIncomingRequestBodySize: 'none' })`, which replaces the default HTTP integration by name.
- **The error sink's fallback.** When location resolution or the log call throws, the prod `createHandleError` falls back to `console.error`, which writes to stderr past pino and its line scrub. It writes `scrubSecrets(JSON.stringify(serializeErrorForLog(error)))` so the fallback gets both layers by hand.

**The dev and e2e servers keep the full default.** `server-dev` builds its logger with `createNodeLogger`'s default `err` serializer and no hooks, because the CLI's dev terminal is parsed from that pino output and the developer needs the full error. `server-e2e`'s logs belong to a test run and never reach a log drain. Both still build `scrubSecrets`, because `_error` reads it off the context and must behave identically in every mode.

**The gap, stated.** A credential the server never held — an OAuth token fetched at runtime, a session token from an upstream — survives layer 2. Layer 1 drops it from library fields such as axios's `config`, and the key mask drops it from `received` when it sits under a credential-named key. It still reaches the log when a library writes it into a message, when it sits in `received` under a key the mask does not match (a body field named `assertion` or `code`), or inside a URL query string in `received`. Sentry's own server-side scrubbing is the backstop.

**Personal data stays in the log.** Driver messages quote row data: SQL with bound values, MongoDB E11000 duplicate keys, Postgres constraint text. The scrub removes secrets, not personal data, which is normal practice for error logs.

### `_error`: routine and client catch config

`_error` (`packages/plugins/operators/operators-js/src/operators/shared/error.js`) is one operator registered in both the client and server operator lists. It returns the `error` the parser hands it: the whole Error for `true` or `{ all: true }`, a field through `getFromObject` for a key, and `null` or the default outside a catch. The whole error is returned as is, not through `getFromObject`'s `all` branch, because that copies through the serializer and revives the Error with an enumerable `message`.

**The lexical rule.** Inside a server `:catch`, `_error` is the error of the innermost enclosing `:catch`. After an inner `:try` finishes, the outer `:catch` reads its own error again. A `:finally` reads the error of the `:catch` enclosing its `:try`, or `null`. Two `:parallel` branches each read their own. `:reject` bypasses `:catch`, so `_error` never holds a reject.

**The child routine context.** `controlTry` runs its `:catch` routine with `{ ...routineContext, error }` and runs `:try` and `:finally` with the context it received, the way `controlFor` passes `items`. Setting a field on the shared `routineContext` would break the lexical rule: `controlTry` hands one object to all three routines and `controlParallel` hands it to every branch at once, so an inner `:try` would overwrite the outer error without restoring it and parallel branches would read each other's. The child still shares `steps` and `state`, because routines mutate those objects in place. Every root routine context (`callEndpoint`, `invokeEndpoint`, `runScheduledEndpoint`, `runWebhookEndpoint`, `runDetachedEndpoint`, and `callRequest`'s frame for a page request) starts with `error: null`.

**`operatorScope`.** Every routine step and control evaluates operators through `evaluateRoutineOperators`, which spreads `operatorScope(routineContext)` — `{ error, items, payload, state, steps }`, with `error` defaulting to `null` — into `context.evaluateOperators`. `createEvaluateOperators` forwards `error` to `ServerParser.parse`, which passes it to every operator and to the `parser` it hands operators such as `_function`. A site that picked the frame fields off by hand and missed `error` would make `_error` silently `null` there — a request step inside a `:for` inside a `:catch`, say — and the "`null` outside a catch" rule means nothing would reveal it. A future scope field goes in `operatorScope` once.

On the client, `Actions.callActions` runs the main pass with `parseScope: { error: null }` and the catch pass with `parseScope: { error: caught }`. `callActionLoop`, `callAction`, `callAsyncAction`, `callControl` and `evaluateControlValue` carry `parseScope`, and every `parser.parse` call in that path spreads it; `WebParser.parse` passes `error` to every operator.

**The shape, built by `projectCaughtError`** (`@lowdefy/helpers`, so both sides apply the same field rule). It rebuilds the caught error as an Error — `Object.create` on the class's prototype from `lowdefyErrorTypes`, or `Error` for a foreign name — with only:

- `name`.
- `message`, scrubbed, defined as non-enumerable as on a constructed Error, so `JSON.stringify` skips it and an `_error` sent to a plugin as data (an HTTP body, a database insert) records no message.
- `code` (scrubbed when it is a string) and `statusCode`, by `readErrorCodes`.
- `handled`, copied. The server's error sink sets it once it has logged the error, and the client skips reporting a handled error back to the server, so a rethrown `_error` without it would be logged a second time.
- `cause`, when it is an Error, projected the same way down the chain (a cycle is cut, not followed).
- For a `UserError` only: a non-Error `cause` and `metaData`, deep-scrubbed. The author wrote them in config; any other class's non-Error cause is library data, such as a response body.

Nothing else: no `received`, `source`, `config`, `configKey`, `location` or `stack`. A non-Error thrown value becomes `new Error(String(value))` first.

**Why the raw error never enters scope.** `controlTry` builds the value once, when the `:catch` starts: `projectCaughtError(res.error, { scrub: context.scrubSecrets })`. Building it in the operator would rebuild the scrub on every read, and putting the raw error on the child context would hand every operator in scope its `received` — which can hold a token fetched at runtime that the scrub does not know — and its `source`.

**Client values.** For a server error the action runner passes the decoded error as is (`isDecodedServerError`): the wire shape, generic unless the author wrote it. For a client-side error it passes `projectCaughtError(error)` plus `actionId`, unscrubbed and with its real message: the browser built it from data it already holds and holds no server secrets.

**The wire policy follows the value.** `_error` returns an Error, so wherever config sends the whole value — a `:throw`'s `:cause`, a `:return` value, a field inside either — the serializer meets an Error node and applies the wire projection. The natural rethrow, `:throw: Customer lookup failed` with `:cause: { _error: true }`, therefore sends the cause generic. To send the real message the author names it: `:throw: { _error: message }`. `controlThrow` rethrows an Error message unchanged instead of wrapping it in a `UserError` (whose message the wire would pass through as author text), ignoring `:cause`; the wire then makes it generic unless it was a `UserError`, keeping `code` and `statusCode`. `controlReject` given an Error rejects with a `UserError` whose message is that Error's wire message — the author's for a `UserError` or an auth refusal, the generic one otherwise.

## Build-Time Error Handling

### Error Formatting and Collection

Build-time errors use classes from `@lowdefy/errors`:

```javascript
import { ConfigError, ConfigWarning } from '@lowdefy/errors';

// Fatal error — collected, build continues until checkpoint
collectExceptions(
  context,
  new ConfigError(`Block type "Buton" not found.`, {
    configKey: block['~k'],
    checkSlug: 'types',
  })
);

// Warning — suppression, dedup, location resolution
context.handleWarning(
  new ConfigWarning(`_state references "userName" but no block with id "userName" exists.`, {
    configKey: obj['~k'],
    checkSlug: 'state-refs',
    prodError: true,
  })
);
```

**Output format:**

```
/Users/dev/myapp/pages/home.yaml:15
[ConfigError] Block type "Buton" not found. Did you mean "Button"?
```

### Error Collection (Multi-Error Reporting)

Instead of stopping on the first error, the build system collects all errors and reports them at once.

**How it works:**

1. `createContext` initializes `context.errors = []` array
2. `collectExceptions(context, error)` checks suppression via `shouldSuppressBuildCheck`, then pushes to `context.errors`
3. `tryBuildStep` wraps each build phase to catch errors without stopping — also checks suppression
4. After all validation phases, `logCollectedErrors` iterates `context.errors`, calls `context.handleError(error)` for each (resolves location, logs), then throws `new BuildError('Build failed with N error(s).')`

**Example output:**

```
/Users/dev/app/pages/home.yaml:22
[ConfigError] Request "fetchData" not defined on page "home".

/Users/dev/app/pages/products.yaml:10
[ConfigError] Request "loadProducts" references non-existent connection "wrongDb".

Build failed with 2 error(s).
```

### Plugin Interface Examples

**Operators (in parser):**

```javascript
try {
  return operator({ params });
} catch (error) {
  // ConfigError — add configKey for location resolution
  if (error instanceof ConfigError) {
    if (!error.configKey) {
      error.configKey = configKey;
    }
    throw error;
  }
  // Plain errors get wrapped in OperatorError
  throw new OperatorError(error.message, {
    cause: error,
    typeName: '_if',
    received: params,
    configKey,
  });
}
```

**Requests (in callRequestResolver):**

```javascript
try {
  return await requestResolver({ ... });
} catch (error) {
  if (!error.configKey) error.configKey = requestConfig['~k'];

  if (error instanceof ConfigError) throw error;

  if (ServiceError.isServiceError(error)) {
    throw new ServiceError(undefined, {
      cause: error,
      service: connectionId,
      configKey: requestConfig['~k'],
    });
  }

  throw new RequestError(error.message, {
    cause: error,
    typeName: requestType,
    received: requestProperties,
    configKey: requestConfig['~k'],
  });
}
```

### Operator Key Extraction

`extractOperatorKey.js` extracts top-level keys from operator references. Used by validators to identify referenced IDs.

```javascript
extractOperatorKey({ operatorValue: 'user.name' }); // 'user'
extractOperatorKey({ operatorValue: { key: 'user.name' } }); // 'user'
extractOperatorKey({ operatorValue: null }); // null
```

Used by: `validateStateReferences`, `validatePayloadReferences`, `validateStepReferences`

## Build-Time Validations

The build pipeline validates references and provides helpful error messages:

### Connection Validation (`buildConnections.js`)

```
[ConfigError] Request "getData" at page "home" references non-existent connection "mongoDB".
Did you mean "MongoDB"?
```

### Type Validation (`buildTypes.js`)

```
[ConfigError] Block type "Buton" not found. Did you mean "Button"?
```

### Reference Validations

| Validator                       | Validates                               | Example Warning                                                          |
| ------------------------------- | --------------------------------------- | ------------------------------------------------------------------------ |
| `validateStateReferences`       | `_state` references blockIds            | `_state references "userName" but no block with id "userName" exists`    |
| `validateServerStateReferences` | `_state` not used in request properties | `_state is not available in request properties`                          |
| `validatePayloadReferences`     | `_payload` references payload keys      | `_payload references "query" but key not in request payload definition`  |
| `validateStepReferences`        | `_step` references step IDs             | `_step references "step1" but no step with id "step1" exists in routine` |
| `validateLinkReferences`        | `Link` action references pageIds        | `Link action references page "homePage" but page does not exist`         |
| `validateRequestReferences`     | `Request` action references requestIds  | `Request "getData" not defined on page "home"`                           |

#### Deduplication Between State Validators

`validateStateReferences` and `validateServerStateReferences` have overlapping scope — both can encounter `_state` inside `request.properties`. To avoid duplicate warnings:

- `validateServerStateReferences` uses `traverseConfig` to walk `request.properties`, find the first `_state` object, and report its exact `~k`
- `validateStateReferences` pre-collects all `~k` values inside `request.properties` subtrees and **skips** those objects

#### Skip Condition Handling

| Action Type | Skip Behavior                                             | Rationale                                                             |
| ----------- | --------------------------------------------------------- | --------------------------------------------------------------------- |
| **Request** | Skips validation for `skip: true` OR `skip: { operator }` | Requests are page-scoped, may not be defined in all contexts          |
| **Link**    | Skips validation ONLY for `skip: true`                    | Pages are app-scoped, must exist regardless of conditional navigation |

### Suppressing Build Validation with ~ignoreBuildChecks

The `~ignoreBuildChecks` property allows developers to suppress specific or all build-time validation errors and warnings. Suppression cascades down to all descendant config objects.

```yaml
# Suppress all checks for this object and descendants
~ignoreBuildChecks: true

# Suppress only specific check types
~ignoreBuildChecks:
  - state-refs
  - types
```

**Available Check Slugs:**

| Slug              | Description                                    |
| ----------------- | ---------------------------------------------- |
| `state-refs`      | Undefined `_state` reference warnings          |
| `payload-refs`    | Undefined `_payload` reference warnings        |
| `step-refs`       | Undefined `_step` reference warnings           |
| `link-refs`       | Invalid Link action page reference warnings    |
| `request-refs`    | Invalid Request action reference warnings      |
| `connection-refs` | Nonexistent connection ID references           |
| `types`           | All type validation                            |
| `schema`          | JSON schema validation warnings (non-blocking) |

**Implementation:** `shouldSuppressBuildCheck(error, keyMap)` walks up the `~k_parent` chain looking for `~ignoreBuildChecks` settings.

### Circular Reference Detection (`recursiveBuild.js`)

```
[ConfigError] Circular reference detected.
File "components/header.yaml" references itself through:
  components/header.yaml -> components/shared.yaml -> components/header.yaml
```

## Client-Side Error Handling

### Browser handleError

Located at `packages/client/src/createHandleError.js`. Single mechanism for all browser error handling:

```javascript
function createHandleError(lowdefy) {
  const loggedErrors = new Set();
  const logger = lowdefy._internal.logger;

  function logError(error) {
    lowdefy._runtimeErrorCallback?.(error); // the dev error bar
    logger.error(error);
  }

  return async function handleError(error) {
    // Display the dev server's full error when there is one; decide on the error config sees
    const devError = getDevError(error);
    const shown = devError ?? error;
    const errorKey = `${shown.message}:${error.configKey || ''}`;
    if (loggedErrors.has(errorKey)) return;
    loggedErrors.add(errorKey);

    // UserError is client-only — browser console, never the server or the error bar
    if (error instanceof UserError) {
      logger.error(shown);
      return;
    }

    if (error.isLowdefyError) {
      // The server already logged this one — just display locally
      if (error.handled) {
        logError(shown);
        return;
      }
      // Client-originated errors — send to server for logging + schema validation + location resolution
      const serialized = serializer.serialize(error);  // ~e marker, received preserved
      const response = await fetch(`${lowdefy?.basePath ?? ''}/api/client-error`, { ... });
      if (response.ok) {
        const { source, configError: serializedConfigError } = await response.json();
        if (source) error.source = source;
        // If server produced a ConfigError from schema validation, log it instead
        if (serializedConfigError) {
          logError(serializer.deserialize(serializedConfigError));
          return;
        }
      }
      logError(shown);
      return;
    }

    logError(shown);  // Other errors — just log locally
  };
}
```

**Key behaviors:**

- **Deduplication:** Same error logged only once per session, keyed on `message:configKey` — the dev error's message in dev, so two different dev failures of one action both show; `configKey` crosses the wire so two errors with the same message at different config locations do not collapse
- **Already-logged errors skip round-trip:** If `error.handled` is set (the server's `handleError` set it before responding), logs to browser only — no `/api/client-error` call
- **Client-originated errors use client-error API:** Serializes with `serializer.serialize()`, sends to server for logging, schema validation, and location resolution
- **Schema validation errors:** If the server produces a `ConfigError` from schema validation (returned as `configError`), the client logs that instead of the original error — the `ConfigError` includes the original error in its cause chain
- **Display:** Browser logger formats Lowdefy errors with `errorToDisplayString`, and prints `Request ID:` under one that carries a `requestId`
- **Dev error:** `getDevError(error)` returns the dev server's full error for a decoded server error; it is displayed in place of the wire error, and never stored on the error config reads

#### UserError — Client-Only, Console-Only

`UserError` represents expected user-facing errors (validation failures, intentional throws). It is **never sent to the server terminal** — it only logs to the browser console.

**Error routing by origin:**

```
Server-originated errors (arrive with handled: true):
  RequestError   → browser console only (server already logged)
  ServiceError   → browser console only (server already logged)
  ConfigError    → browser console only (server already logged)

Client-originated errors (handled not set):
  OperatorError  → handleError() → POST /api/client-error → server terminal
  ActionError    → handleError() → POST /api/client-error → server terminal
  BlockError     → handleError() → POST /api/client-error → server terminal

Client-only:
  UserError      → logger.error() in browser only, NEVER sent to server terminal
```

In `Actions.js`, `UserError` is detected by `instanceof` and routed to the browser logger only.

#### Server-Side Client Error Logging & Schema Validation

`logClientError` (`packages/api/src/routes/log/logClientError.js`) processes **client-originated** errors only (e.g., operator parse failures, block errors). Server-originated errors are logged once by the server's `handleError` and never sent back via this endpoint.

1. Deserializes error via `serializer.deserialize()` — restores correct error class
2. **Schema validation** — for `BlockError`, `ActionError`, `OperatorError` with `received` data:
   - Reads schema from build artifact (e.g., `plugins/blockSchemas.json`)
   - Validates `received` data against the plugin's JSON schema
   - If invalid, formats AJV errors into readable messages and creates a `ConfigError` with the original error as `cause`
3. Calls `loadAndResolveErrorLocation()` — reads keyMap/refMap from build artifacts
4. Sets `error.source` and `error.config`
5. Logs the `ConfigError` (if schema validation failed) or original error via `logger.error()`
6. Returns `{ source, configError }` to client — client logs the `ConfigError` if present

**Example:** A `BlockError` with `received: { title: 123 }` for a Button block is validated against the Button schema. Since `title` should be a string, the server produces:

```
/Users/dev/app/pages/home.yaml:15
[ConfigError] Block "Button" property "title" must be type "string".
  Caused by: [BlockError] Error rendering block "submitBtn".
```

See [api.md](../packages/api.md#client-error-logging--plugin-schema-validation) for implementation details.

## Runtime Error Tracing

### API Control Structures

Control structures include endpoint context in errors:

```javascript
throw new Error(`Invalid :for in endpoint "${endpointId}" - :in must evaluate to an array.`);
```

Control structures use `~k` for operator evaluation location:

```javascript
const array = evaluateOperators({
  input: control[':in'],
  items,
  location: control['~k'] ?? ':for',
});
```

## Sentry Integration

Lowdefy includes built-in Sentry error tracking that captures both client and server errors with config location context.

### Configuration

Sentry is enabled by setting the `SENTRY_DSN` environment variable. Configuration in `lowdefy.yaml`:

```yaml
logger:
  sentry:
    client: true
    server: true
    tracesSampleRate: 0.1
    replaysOnErrorSampleRate: 0.1
    userFields: ['id', '_id']
```

### Error Context

When capturing errors to Sentry, the following context is included:

- **Tags:** `pageId`, `requestId`, `blockId`, `isServiceError`
- **Extra:** `configLocation` (resolved from keyMap/refMap), `configKey`, and `error` — the log's allowlisted projection of the error (`serializeErrorForLog`)

Every event, transaction, span and breadcrumb passes through the secret scrub, and incoming request bodies are not attached — see [Prod logs and Sentry](#prod-logs-and-sentry).

### Graceful Degradation

All Sentry functions are no-ops when `SENTRY_DSN` is not set.

## Error Serialization

### Helpers Serializer (~e Marker)

The `@lowdefy/helpers` serializer handles error serialization via the `~e` marker:

- **Replacer:** `extractErrorProps(error, { project })` runs the caller's projection (`projectError` in the serializer options) at each error node — see [Readers and their policies](#readers-and-their-policies). With no projection it captures `message`, `name`, `stack`, `cause` (non-enumerable) + all enumerable properties → wraps as `{ '~e': props }`. Error `cause` values are recursively serialized via `extractErrorProps`. Plain objects, arrays, and non-Error causes are deep-cleaned via `cleanValue` — stripping class instances (replaced with `'[Object: ClassName]'`), detecting circular references (`'[Circular]'`), and capping nesting at 5 levels (`'[Truncated]'`). This prevents `JSON.stringify` crashes on errors with circular structures (e.g., Axios error responses containing Node.js request/response cycles).
- **Reviver:** `Object.create(ErrorClass.prototype)` + property assignment — reconstructs correct Lowdefy class without calling constructors

```javascript
// Round-trip preserves class and all properties
const serialized = serializer.serialize(operatorError);
// { '~e': { name: 'OperatorError', message: '...', typeName: '_if', ... } }
const restored = serializer.deserialize(serialized);
// restored instanceof OperatorError → false (Object.create, not constructor)
// restored.isLowdefyError → true
// restored.name → 'OperatorError'
```

### Pino Error Serialization

`createNodeLogger`'s default `err` serializer is the serializer walk with no projection, unwrapped from `~e`; `server-dev` and `server-e2e` use it. The prod server replaces it with `serializeErrorForLog`, the allowlist projection, and scrubs each finished line in `hooks.streamWrite` — see [Prod logs and Sentry](#prod-logs-and-sentry). The line handler reconstructs errors using the `lowdefyErrorTypes` map from `@lowdefy/errors` and the `Object.create + assign` pattern.

### Transport

Errors cross the HTTP boundary in both directions using the `~e` serialization format:

**Server → Browser (and any other caller):**

`redactErrorResponse` / `buildEndpointResult` serialize the error through the wire projection, and in dev add `devError` beside it — see [Wire](#wire-end-user-and-app-config) and [Dev tools](#dev-tools). This covers every status, not only 500: the hono error handlers (500), endpoint result bodies (200), cron, webhook and detached routes, and websocket reply frames.

The client `request.js` checks for `body['~e']` and decodes it with `decodeServerError`, reconstructing the Lowdefy error class by name (e.g., `RequestError`) and recording `devError` in its `WeakMap`. Server-originated errors keep their class name across the boundary, and the wire's `isLowdefyError: true` makes the engine pass them through without wrapping in `ActionError`.

**Browser → Server (client-error API):**

Browser `handleError` uses `serializer.serialize()` for the POST body to `/api/client-error`. The server uses `serializer.deserialize()` to restore the error class. Only used for **client-originated** errors (`handled` not set).

Note that `received` on this inbound direction is a different thing from `received` on the outbound direction, which the wire never carries: here the browser built the error, so its `received` never left the client, and dev keeps it (`servers/server-dev/src/routes/clientError.js`) so `logClientError` can run plugin-schema validation. Prod deletes it on arrival.

## Config Traversal

`packages/build/src/utils/traverseConfig.js` provides depth-first traversal for validation:

```javascript
traverseConfig({
  config: page,
  visitor: (obj) => {
    if (obj._state !== undefined) {
      const topLevelKey = extractOperatorKey({ operatorValue: obj._state });
      if (topLevelKey && !stateRefs.has(topLevelKey)) {
        stateRefs.set(topLevelKey, obj['~k']);
      }
    }
  },
});
```

## Related Files

### Error Classes and Utilities

- `packages/utils/errors/src/` — All error classes and resolution functions, `lowdefyErrorNames`, `lowdefyErrorTypes`, `readErrorCodes`
- `packages/plugins/operators/operators-js/src/operators/shared/error.js` — The `_error` operator, client and server

### Build Integration

- `packages/build/src/createContext.js` — Wires `context.handleError` and `context.handleWarning`
- `packages/build/src/utils/createBuildHandleError.js` — Build error handler
- `packages/build/src/utils/createHandleWarning.js` — Build warning handler
- `packages/build/src/utils/collectExceptions.js` — Error collector with suppression
- `packages/build/src/utils/tryBuildStep.js` — Build step wrapper with suppression
- `packages/build/src/utils/logCollectedErrors.js` — Logs all errors, throws BuildError

### Client Integration

- `packages/client/src/request.js` — Decodes typed errors from non-2xx responses
- `packages/client/src/websocket/createWebSocketClient.js` — Decodes websocket reply error frames
- `packages/engine/src/decodeServerError.js` — `decodeServerError`, `getDevError`, `isDecodedServerError`; the dev error `WeakMap`
- `packages/engine/src/Actions.js` — `parseScope` for catch lists, the client `_error` value, the `UserError` console dedup
- `packages/client/src/createHandleError.js` — Browser error handler
- `packages/client/src/initLowdefyContext.js` — Wires `lowdefy._internal.handleError`

### Server Integration

- `packages/api/src/response/createWireProjection.js` — The wire policy itself: the author's message or the generic one
- `packages/api/src/response/redactErrorResponse.js` — Applies the wire policy, owns the serialization, adds `devError` in dev
- `packages/api/src/response/redactResponse.js` — Same policy for a response value that may contain errors
- `packages/api/src/response/normalizeErrorSources.js` — Makes `source` in `devError` config-relative
- `packages/api/src/response/buildEndpointResult.js` — The endpoint result wire object (error + response, one policy)
- `packages/api/src/response/wireErrorPolicy.test.js` — Regression tests for the wire policy across real plugin errors and transports
- `packages/api/src/routes/websocket/createWebSocketConnection.js`, `createChannelRegistry.js` — Websocket reply and broadcast errors
- `packages/api/src/routes/mcp/createMcpServer.js` — MCP tool errors, dev and prod
- `packages/api/src/response/formatErrorForAgent.js` — MCP tool error text: full message with source and hint in dev, the wire message in prod
- `packages/api/src/routes/endpoints/control/controlTry.js` — Builds the `_error` value for a `:catch`
- `packages/api/src/routes/endpoints/operatorScope.js`, `evaluateRoutineOperators.js` — The routine operator scope, `error` included
- `packages/utils/helpers/src/projectCaughtError.js` — The `_error` shape
- `packages/utils/errors/src/readErrorCodes.js` — The `code` / `statusCode` rule
- `packages/utils/node-utils/src/createSecretScrubber.js` — The secret scrub
- `packages/servers/*/lib/server/scrubSecrets.js` — Each server package's scrubber, on every request context
- `packages/api/src/context/createSystemContext.js`, `packages/servers/{server,server-dev}/lib/server/auth/createSystemContext.js` — Auth-hook system contexts, which carry `mode` and `scrubSecrets` like request contexts
- `packages/servers/server/lib/server/log/logErrorProjection.js` — The prod log allowlist and the `received` key mask
- `packages/servers/server/lib/server/log/createLogger.js` — Prod logger: allowlist serializer and `streamWrite` scrub
- `packages/servers/*/src/middleware/errorHandler.js` — Hono app-level handler; 500 responses for `/api/` paths
- `packages/servers/*/lib/server/log/createHandleError.js` — Server error handler; resolves location, logs, sets `handled`
- `packages/api/src/routes/log/logClientError.js` — Client error endpoint (client-originated only)

### Sentry Integration

- `packages/servers/server/lib/server/sentry/` — Server-side Sentry utilities (`initSentry` hooks, `scrubEvent`, `captureSentryError`)
- `packages/servers/server/lib/client/sentry/` — Client-side Sentry utilities

### Issues & PRs

- Issue #1940 — Original feature request (config-aware error tracing)
- Issue #2022 — Logging & error formatting refactor
