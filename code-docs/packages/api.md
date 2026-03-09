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
  getNextAuthConfig, // Auth.js configuration
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
┌───────────────────┐
│authorizeEndpoint()│
└───────────────────┘
        │
        ▼
┌───────────────────┐
│   runRoutine()    │  ◀── Execute steps: Request, Control, etc.
└───────────────────┘
        │
        ▼
   Response/Error
```

## Key Modules

### `/context/`

| Module                       | Purpose                                                            |
| ---------------------------- | ------------------------------------------------------------------ |
| `createApiContext.js`        | Initializes context with user session, state, and helper functions |
| `createAuthorize.js`         | Creates authorization checker for role-based access                |
| `createReadConfigFile.js`    | Utility to read build output files                                 |
| `createEvaluateOperators.js` | Server-side operator evaluation                                    |
| `errors.js`                  | Error types: ConfigurationError, RequestError, ServerError         |

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
| `callRequestResolver.js`  | Execute the actual resolver function                   |

### `/routes/endpoints/`

| Module            | Purpose                                 |
| ----------------- | --------------------------------------- |
| `callEndpoint.js` | Main entry point for endpoint execution |
| `runRoutine.js`   | Execute routine steps sequentially      |
| `control/`        | Control flow operators (if, try, etc.)  |

### `/routes/auth/`

Handles Auth.js (NextAuth) configuration retrieval.

### `/routes/page/`

Serves page configuration to the client.

### `/routes/rootConfig/`

Serves app configuration, menus, and home page info.

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
- **plugin-next-auth**: Provides auth session and configuration
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
