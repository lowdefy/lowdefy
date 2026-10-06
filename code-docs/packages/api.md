# @lowdefy/api

Server-side API handler for Lowdefy applications. Executes requests, manages connections, and handles authentication context.

## Purpose

This package provides the server-side logic that:

- Executes data requests against configured connections
- Handles custom API endpoints
- Manages authentication/authorization context
- Serves page and menu configurations to the client

## Key Exports

```javascript
import {
  callEndpoint, // Execute custom API endpoints
  callRequest, // Execute data requests
  createApiContext, // Create server context with auth info
  getHomeAndMenus, // Fetch menu configuration
  getAuthConfig, // Auth.js configuration
  getPageConfig, // Fetch page configuration
  getRootConfig, // Fetch app root configuration
  logClientError, // Process client errors with schema validation
  ConfigurationError,
  RequestError,
  ServerError,
} from '@lowdefy/api';
```

## Architecture

### Request Flow

```
Client Action (Request)
        │
        ▼
┌───────────────────┐
│   callRequest()   │
└───────────────────┘
        │
        ▼
┌───────────────────┐     ┌────────────────────────┐
│ getRequestConfig  │────▶│ Read from build output │
└───────────────────┘     └────────────────────────┘
        │
        ▼
┌───────────────────┐
│authorizeRequest() │  ◀── Check user roles/permissions
└───────────────────┘
        │
        ▼
┌───────────────────┐
│  getConnection()  │  ◀── Load connection handler (MongoDB, HTTP, etc.)
└───────────────────┘
        │
        ▼
┌───────────────────┐
│evaluateOperators()│  ◀── Resolve _secret, _user, etc. in connection/request
└───────────────────┘
        │
        ▼
┌───────────────────┐
│  validateSchemas  │  ◀── Validate connection/request properties
└───────────────────┘
        │
        ▼
┌───────────────────┐
│callRequestResolver│  ◀── Execute the actual database/API call
└───────────────────┘
        │
        ▼
    Response
```

### Endpoint Flow (Custom API)

Endpoints allow multi-step server-side routines:

```
Client Action (Endpoint)
        │
        ▼
┌───────────────────┐
│  callEndpoint()   │
└───────────────────┘
        │
        ▼
┌───────────────────┐
│getEndpointConfig()│
└───────────────────┘
        │
        ▼
  InternalApi? ──yes──▶ throw "does not exist"
        │ no
        ▼
┌───────────────────┐
│authorizeEndpoint()│
└───────────────────┘
        │
        ▼
┌───────────────────┐
│   runRoutine()    │  ◀── Dispatch by prefix: request:, endpoint:, control
└───────────────────┘
     │          │
     ▼          ▼
 handleRequest  handleEndpointCall
     │              │
     │              ▼
     │          invokeEndpoint ──▶ runRoutine (child)
     │              ▲
     │              │
     │       callApi (resolver-side, constructed in callRequestResolver)
     ▼
   Response/Error
```

`invokeEndpoint` is the shared chokepoint for endpoint-to-endpoint calls. Both the routine `CallApi` step (via `handleEndpointCall`) and the resolver-side `callApi` function (constructed in `callRequestResolver` and passed into the request resolver argument bag) flow through it. The routine-step path wraps the returned envelope with `addStepResult` and status mapping; the resolver path throws on `error`/`reject` and returns the response otherwise.

### Agent Flow

Agents handle AI chat with streaming responses:

```
Client (AgentChat block)
        │
        ▼
POST /api/agent/{pageId}/{agentId}?conversationId=...
Body: { messages: UIMessage[], urlQuery }
        │
        ▼
┌───────────────────┐
│   callAgent()     │
└───────────────────┘
        │
        ▼
┌───────────────────┐     ┌──────────────────────────────┐
│ getAgentConfig()  │────▶│ Read from agents/{id}.json   │
└───────────────────┘     └──────────────────────────────┘
        │
        ▼
┌───────────────────┐
│evaluateOperators()│  ◀── Resolve _secret, _user in agent properties
└───────────────────┘
        │
        ▼
┌───────────────────┐
│  getConnection()  │  ◀── Load AI provider (Anthropic, OpenAI, Google)
└───────────────────┘
        │
        ▼
┌───────────────────┐
│getAgentResolver() │  ◀── Get agent type (ClaudeAgent, OpenAIAgent, etc.)
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ resolver(context) │  ◀── Calls handleAgentChat in @lowdefy/ai-utils
└───────────────────┘
        │
        ▼
   Streaming Response (text/event-stream)
```

The resolver context includes `callEndpoint` (for tool execution), `getAgentConfig` (for sub-agents), `getConnectionForAgent` (for sub-agent connections), and `resolveMcpSources` (for MCP connectionId references).

See [Agent System Architecture](../architecture/agent-system.md) for the complete flow.

## Key Modules

### `/context/`

| Module                       | Purpose                                                                                                             |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `createApiContext.js`        | Initializes context with user session, state, and helper functions (steps/payload live on routineContext, not here) |
| `createAuthorize.js`         | Creates authorization checker for role-based access                                                                 |
| `createReadConfigFile.js`    | Utility to read build output files                                                                                  |
| `createEvaluateOperators.js` | Server-side operator evaluation; accepts `steps`/`payload` per call for routine isolation                           |
| `errors.js`                  | Error types: ConfigurationError, RequestError, ServerError                                                          |

### `/routes/request/`

| Module                    | Purpose                                                |
| ------------------------- | ------------------------------------------------------ |
| `callRequest.js`          | Main entry point for request execution                 |
| `authorizeRequest.js`     | Check if user can execute this request                 |
| `getRequestConfig.js`     | Load request definition from build output              |
| `getConnectionConfig.js`  | Load connection definition                             |
| `getConnection.js`        | Get the connection handler (e.g., MongoDB client)      |
| `evaluateOperators.js`    | Resolve operators in connection/request properties     |
| `checkConnectionRead.js`  | Verify read permissions on connection                  |
| `checkConnectionWrite.js` | Verify write permissions on connection                 |
| `validateSchemas.js`      | Validate properties against connection/request schemas |
| `resolveTenancy.js`       | Resolve the tenant verdict (`{ field, value }`, filter and stamp) and the unscoped write guard (`{ field, stampChangeLog }`) in one call, so no call site (page request, routine step, webhook verifier, websocket) can take the verdict and miss the guard. The guard applies to `tenant: none` requests on scoped connections (`stampChangeLog: true`) and to `tenant: shared` connections the build marked `walled` (`stampChangeLog: false`). |
| `callRequestResolver.js`  | Execute the resolver function. Constructs `callApi` (closing over `context` + `endpointDepth`) and threads it into the resolver argument bag. Lowdefy errors pass through unchanged; raw errors wrap into `RequestError` / `ServiceError`. |

### `/routes/endpoints/`

| Module                    | Purpose                                                       |
| ------------------------- | ------------------------------------------------------------- |
| `callEndpoint.js`         | HTTP entry point for endpoint execution; blocks `InternalApi` |
| `runRoutine.js`           | Dispatch steps by ID prefix: `request:`, `endpoint:`, control. Catch sets `error.handled = true` so a single error crossing multiple `runRoutine` boundaries (e.g. a deep `callApi` chain) triggers `context.handleError` exactly once. |
| `handleRequest.js`        | Execute a database/API request step                           |
| `handleRenderNotification.js` | Execute a `RenderNotification` step: interpolate + validate + resolve links + render one notification to `{ subject, title, preview, html, text, data }`. Does not store or send. See [Notification Rendering](../architecture/notifications.md). |
| `handleEndpointCall.js`   | Execute a `CallApi` step. Evaluates operator-form `endpointId` / `payload`, calls `invokeEndpoint`, then maps the returned envelope (`addStepResult` + status mapping). |
| `invokeEndpoint.js`       | Shared helper: depth check → load config → authorize → build child `routineContext` → `runRoutine`. Used by `handleEndpointCall` (routine `CallApi` step) and `callApi` (resolver-side, constructed in `callRequestResolver`). |
| `addStepResult.js`        | Store step results in `routineContext.steps`                  |
| `getEndpointConfig.js`    | Load endpoint config from build artifacts                     |
| `authorizeApiEndpoint.js` | Check user access to endpoint                                 |
| `control/`                | Control flow handlers (if, for, try, switch, return, etc.). `controlThrow` and `controlReject` build `UserError` so routine-step and JS-boundary surfaces carry the same class for user-authored failures. `controlSetState` writes to `routineContext.state` — state is scoped to the routine frame, not the request. |

### `/routes/agent/`

| Module                | Purpose                                                         |
| --------------------- | --------------------------------------------------------------- |
| `callAgent.js`        | Main entry point for agent chat execution with streaming        |
| `getAgentConfig.js`   | Load agent definition from build artifacts (`agents/{id}.json`) |
| `getAgentResolver.js` | Load agent type resolver from plugin registry                   |

### `/routes/auth/`

Handles Auth.js configuration retrieval.

| Module                                | Purpose                                                     |
| ------------------------------------- | ----------------------------------------------------------- |
| `callbacks/createSessionCallback.js`  | Assembles session from OIDC claims, userFields, and plugins |
| `callbacks/validateSessionRoles.js`   | Validates `session.user.roles` is an array of strings       |
| `callbacks/createJWTCallback.js`      | JWT token assembly                                          |
| `callbacks/addUserFieldsToSession.js` | Maps provider fields to session via `auth.userFields`       |
| `callbacks/addUserFieldsToToken.js`   | Maps provider fields to JWT token via `auth.userFields`     |
| `callbacks/createCallbackPlugins.js`  | Filters callback plugins by type                            |

### `/routes/auth/organizations/`

| Module                          | Purpose |
| ------------------------------- | ------- |
| `createActiveOrgPolicyHook.js`  | `session.create` hook applying the active-organization policy, including the tenant signup mint under `create: auto`. The mint writes the organization with a server-only `mintPending` marker, writes the owner member row, then clears the marker; only a marked organization whose mint is in progress (under ten minutes old, no member other than the user) is joined as owner, and any other marker is cleared as stale. Lost races on the unique slug or member index are recovered by reading the winner's row. |
| `ensureAuthIndexes.js`          | Ensures the unique indexes the organization writes rely on (organization `slug`, member `(userId, organizationId)`) through the auth adapter's `adapter.options.ensureUniqueIndexes` capability. Run at startup by `getBetterAuth` and awaited by the mint, which refuses with 503 `ORGANIZATION_SETUP_UNAVAILABLE` without them. Success is kept per auth instance (no database read per mint); a failure is logged once and kept for a 30 s cool-down, during which mints are refused without touching the database, then one retry. Startup rather than build/CLI because only the running server reliably reaches the database it serves. |
| `ensureOrganization.js`         | Ensure-by-slug seeding of the pinned organization (id = slug). |
| `createAcceptExistingMemberHook.js` | Request `hooks.before` on `/organization/accept-invitation` (registered in `requestHooks/buildRequestHooks.js`). When the caller already holds a member row in the invitation's organization, it marks the invitation accepted (compare-and-set on `pending`), sets the organization active only if the session has none, and answers `{ invitation, member }` without touching the membership. Everything the route would refuse first falls through to the route. |

### `/routes/page/`

Serves page configuration to the client.

**Matching a path to a page.** `matchPagePath({ routes, path })` (in `@lowdefy/node-utils`, so the server-dev page route and the journey tools share it) is the one matcher from a request path (`basePath` and the leading `/` removed) to `{ pageId, pathParams }`, or `null`. `routes` is the build's `routes.json`, `[{ pageId, path, auth }]`, where `path` is the page's pattern or, for a page without one, its id. The matcher strips one trailing `/`; any other empty segment, a segment that fails `decodeURIComponent`, and a segment that decodes to `.` or `..` match nothing. Each segment is decoded once, so a `%2F` inside a value survives as `/`, and callers pass the path still encoded. Candidates are the patterns with the same segment count whose fixed segments equal the decoded segments (case-sensitive); walking left to right, at the first position where they differ a fixed segment beats a placeholder. The build refuses ties, so one candidate is left. The routes are grouped by segment count once per `routes` array.

`getPageConfig(context, { path, urlQuery })` matches the path, then reads `pages/${pageId}.json` by the matched id and authorises it. It returns `{ status, pageId, pathParams, pageConfig }`: `pageConfig` on `ok` only, `pageId` and `pathParams` whenever the path matched. An unmatched path answers as an unknown page id did: `unauthenticated` under `pagesProtectedByDefault` for a signed-out caller, else `not_found`. A dynamic page's `resolveDynamicContent` gets `pathParams`, and each `Dynamic` endpoint's payload carries it next to `urlQuery`.

**Dynamic content (`routes/page/dynamic/`).** `resolveDynamicContent` calls each `Dynamic` block's endpoint in-process with `literalData` (`@lowdefy/operators` `createLiteralData`: the block's policy id, the app's client operator names from `plugins/clientOperators.json`, and the data-tracking state). The endpoint's `:return` is the trust boundary between data and page config:

- `ServerParser` scans every non-pass-through operator result for anything the client would run as an operator (`getPossibleOperators`, the one rule every check shares: vanishing siblings count, keys that name no client or server operator, such as `_score`, are data) and marks the result's tracked objects (a string `type` or a client operator key) as data by identity (`markDataObjects`). The copying reads carry the marks to their copies: `_get` and `_args` by position in what they read (`markCopiedData`), and a `_function` body that holds data by content digest as each call parses its copy (`indexDataShapes`, `markDataShape`). An object `_object.assign` merges data into becomes data too. Nothing else is matched by content, so an object built from `:return` config is never data, whatever it equals.
- `controlReturn` then runs `checkLiteralContent` on the finished `:return`: without a policy, a block or action (walked through slots, areas, skeletons, events and control branches) that is data is refused; under any policy, data that the client could run as an operator after a merge is refused.
- `checkDynamicContent` applies the policy (`policy/checkPolicy.js`) and builds the fragment. The policy judges URLs by the block schema's `urlKind` marks (`policy/collectUrlKinds.js`) (`urlKind: false` opts a URL-named property out) and falls back to key names for every value no schema marks; `_state` reads must name a literal key under `policy.state`. A same-origin navigation URL is matched with `matchPagePath` against `routes.json`, and the matched `pageId` must be in the policy's `links.pages`; a `pageId` value is checked as it is.

### `/routes/rootConfig/`

Serves app configuration, menus, and home page info.

`getRootConfig` returns `pagePaths`, `{ [pageId]: path }` for every page with a `path` (placeholders or not) whose route auth is not `deny` for this caller, filtered as menu links are (`getPagePaths`). A page without a `path` is left out: the client builds its URL from its id.

## Design Decisions

### Why Server-Side Operators?

Operators like `_secret` and `_user` must run server-side because:

- Secrets should never reach the client
- User session data comes from server
- Some operators need database access

### Why Separate Request and Endpoint?

**Requests** are simple data operations:

- Single connection, single operation
- Suitable for CRUD operations
- Limited to what the connection supports

**Endpoints** are programmable APIs:

- Multi-step routines with control flow
- Can chain multiple requests
- Support custom logic and transformations

### Connection Isolation

Each request gets a fresh connection context. Connections are:

- Loaded from the connection plugin
- Validated against schemas
- Given only the properties they need

## Integration Points

- **@lowdefy/build**: Consumes build output files (pages, requests, connections)
- **@lowdefy/operators**: Uses ServerParser for operator evaluation
- **plugin-better-auth**: Provides auth providers, API strategies and admin steps
- **Connection plugins**: Provides request resolvers (MongoDB, HTTP, etc.)

## Error Handling

Three error types for different scenarios:

| Error                | When Used                                         |
| -------------------- | ------------------------------------------------- |
| `ConfigurationError` | Invalid config (wrong schema, missing connection) |
| `RequestError`       | Expected errors (validation failed, unauthorized) |
| `ServerError`        | Unexpected errors (connection failed, bug)        |

### Error Classes with Config Tracing

All error classes support optional `configKey` parameter for build artifact tracing:

```javascript
import { ConfigurationError, RequestError, ServerError } from '@lowdefy/api';

// Throw error with config location tracking
throw new ConfigurationError({
  message: 'Connection "mongoDB" not found',
  configKey: request['~k'], // Links error to source YAML location
});

// Error without location (still valid)
throw new ServerError({ message: 'Database connection failed' });
```

**Implementation:** `packages/api/src/context/errors.js`

The error classes accept an options object:

- `message` (string, required): Error message
- `configKey` (string, optional): The `~k` value for error tracing

When errors reach the client or logs, the `configKey` can be resolved to show file:line location using `resolveConfigLocation` from `@lowdefy/helpers`.

### Client Error Logging & Plugin Schema Validation

Client-side errors are sent to the server for centralized logging via the `logClientError` route. When errors carry `received` data (the params/properties that caused the failure), the server validates them against plugin schemas to produce more helpful error messages.

**Client-side:** `lowdefy._internal.handleError(error)` serializes the error with `serializer.serialize()` (using the `~e` marker) and POSTs to `/api/client-error`. The `received` property is preserved in the payload for server-side schema validation.

**Server route:** `packages/api/src/routes/log/logClientError.js`

Processes client errors:

1. Deserializes error via `serializer.deserialize()` — restores correct Lowdefy error class
2. **Schema validation** — if the error is a `BlockError`, `ActionError`, or `OperatorError` with `received` data, validates against plugin schemas (see below)
3. Calls `loadAndResolveErrorLocation()` — reads keyMap/refMap from build artifacts
4. Sets `error.source` and `error.config` on the error object
5. If validation produced a `ConfigError`, logs that (with cause chain preserving the original error)
6. Returns `{ source, configError }` to client — `configError` is the serialized validation error if schema validation failed

### `/routes/log/` — Plugin Schema Validation

| Module                     | Purpose                                                            |
| -------------------------- | ------------------------------------------------------------------ |
| `validatePluginSchema.js`  | Validates data against a plugin's JSON schema using `@lowdefy/ajv` |
| `formatValidationError.js` | Converts AJV errors into human-readable messages                   |
| `logClientError.js`        | Orchestrates error logging with optional schema validation         |

**Validation flow in `logClientError`:**

```
Client sends error (e.g., BlockError with received: { title: 123 })
    │
    ▼
┌──────────────────────────┐
│ Look up schema for type  │  ◀── Read from plugins/blockSchemas.json
└──────────────────────────┘
    │
    ▼
┌──────────────────────────┐
│  validatePluginSchema()  │  ◀── Validate received data against schema
└──────────────────────────┘
    │ (if invalid)
    ▼
┌──────────────────────────┐
│ formatValidationError()  │  ◀── Convert AJV errors to readable messages
└──────────────────────────┘
    │
    ▼
ConfigError with cause chain → logged to terminal
```

**Schema map files** (generated at build time):

| Error Type      | Schema File                    | Schema Key   | Field Label |
| --------------- | ------------------------------ | ------------ | ----------- |
| `BlockError`    | `plugins/blockSchemas.json`    | `properties` | property    |
| `ActionError`   | `plugins/actionSchemas.json`   | `params`     | param       |
| `OperatorError` | `plugins/operatorSchemas.json` | `params`     | param       |

**Example output:**

```
/Users/dev/app/pages/home.yaml:15
[ConfigError] Block "Button" property "title" must be type "string".
  Caused by: [BlockError] Error rendering block "submitBtn".
```

**Operator method names:** For operators with method-qualified names (e.g., `_yaml.parse`), the validation extracts params from the method-style `received` key (e.g., `{ '_yaml.parse': { on: ... } }`) and uses the display name `_yaml.parse` in error messages.

**Graceful degradation:** If schema files are missing, the plugin has no schema, or validation itself fails, the original error is logged unchanged. Schema validation never prevents error logging.

See [Error Tracing System](../architecture/error-tracing.md) for complete documentation.
