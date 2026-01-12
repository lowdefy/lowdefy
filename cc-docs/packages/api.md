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
  callEndpoint,      // Execute custom API endpoints
  callRequest,       // Execute data requests
  createApiContext,  // Create server context with auth info
  getHomeAndMenus,   // Fetch menu configuration
  getNextAuthConfig, // Auth.js configuration
  getPageConfig,     // Fetch page configuration
  getRootConfig,     // Fetch app root configuration
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

| Module | Purpose |
|--------|---------|
| `createApiContext.js` | Initializes context with user session, state, and helper functions |
| `createAuthorize.js` | Creates authorization checker for role-based access |
| `createReadConfigFile.js` | Utility to read build output files |
| `createEvaluateOperators.js` | Server-side operator evaluation |
| `errors.js` | Error types: ConfigurationError, RequestError, ServerError |

### `/routes/request/`

| Module | Purpose |
|--------|---------|
| `callRequest.js` | Main entry point for request execution |
| `authorizeRequest.js` | Check if user can execute this request |
| `getRequestConfig.js` | Load request definition from build output |
| `getConnectionConfig.js` | Load connection definition |
| `getConnection.js` | Get the connection handler (e.g., MongoDB client) |
| `evaluateOperators.js` | Resolve operators in connection/request properties |
| `checkConnectionRead.js` | Verify read permissions on connection |
| `checkConnectionWrite.js` | Verify write permissions on connection |
| `validateSchemas.js` | Validate properties against connection/request schemas |
| `callRequestResolver.js` | Execute the actual resolver function |

### `/routes/endpoints/`

| Module | Purpose |
|--------|---------|
| `callEndpoint.js` | Main entry point for endpoint execution |
| `runRoutine.js` | Execute routine steps sequentially |
| `control/` | Control flow operators (if, try, etc.) |

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

| Error | When Used |
|-------|-----------|
| `ConfigurationError` | Invalid config (wrong schema, missing connection) |
| `RequestError` | Expected errors (validation failed, unauthorized) |
| `ServerError` | Unexpected errors (connection failed, bug) |
