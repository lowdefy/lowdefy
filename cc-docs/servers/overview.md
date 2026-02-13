# Servers Overview

Next.js-based servers for running Lowdefy applications.

## Package Summary

| Package | Purpose | Use Case |
|---------|---------|----------|
| `@lowdefy/server` | Production server | Deployment |
| `@lowdefy/server-dev` | Development server | Local development |
| `@lowdefy/server-e2e` | E2E testing server | Playwright testing with auth |

## Architecture

All three servers are built on Next.js 13.5.4 and share:
- Core API handlers for requests and endpoints
- Plugin loading from build artifacts
- Page rendering with server-side props

The production and dev servers use NextAuth for authentication. The e2e server replaces NextAuth with cookie-based session injection for Playwright testing.

## Key Differences

| Aspect | Production | Development | E2E |
|--------|------------|-------------|-----|
| Startup | `next start` | Process manager | `next start` |
| Build | Pre-built artifacts | Dynamic rebuilding | Pre-built artifacts |
| Watching | None | 3 concurrent watchers | None |
| Reload | N/A | SSE-based hot reload | N/A |
| Auth | NextAuth | NextAuth + mock user | Cookie-based |
| Optimization | Full | Disabled | Full |

## Build Artifacts

Both servers load from `./build/` directory:

```
build/
├── config.json           # Main configuration
├── auth.json             # Auth configuration
├── reload                # Trigger file (dev only)
├── pages/                # Page configurations
├── connections/          # Connection configs
├── plugins/
│   ├── blocks.js         # Block components
│   ├── actions.js        # Action handlers
│   ├── connections.js    # Connection types
│   ├── icons.js          # Icon components
│   ├── styles.less       # Custom styles
│   └── operators/
│       ├── client.js     # Client operators
│       ├── server.js     # Server operators
│       ├── clientJsMap.js
│       └── serverJsMap.js
└── auth/
    ├── adapters.js
    ├── callbacks.js
    ├── events.js
    └── providers.js
```

## API Routes

### Shared Routes

| Route | Purpose |
|-------|---------|
| `/api/request/[pageId]/[requestId]` | Execute requests |
| `/api/endpoints/[endpointId]` | Execute API endpoints |
| `/api/auth/[...nextauth]` | NextAuth handlers (production/dev only) |
| `/api/auth/session` | Session retrieval (e2e: returns cookie user) |
| `/api/usage` | Usage logging |

### Dev-Only Routes

| Route | Purpose |
|-------|---------|
| `/api/reload` | SSE for hot reload |
| `/api/ping` | Health check |
| `/api/page/[pageId]` | Page config fetch |
| `/api/root` | Root config fetch |

## Page Routes

| Route | Purpose |
|-------|---------|
| `/` | Homepage (redirects to home page) |
| `/[pageId]` | Dynamic page rendering |
| `/404` | Not found page |

## Context Object

API handlers receive a context with:

```javascript
{
  rid: 'request-uuid',
  buildDirectory: './build',
  config,           // From build/config.json
  connections,      // Available connections
  fileCache,        // Cached files
  headers,          // Request headers
  jsMap,            // JS operator map
  logger,           // Pino logger
  operators,        // Available operators
  req, res,         // Express-like objects
  secrets,          // Environment secrets
  session,          // NextAuth session
  authOptions       // NextAuth config
}
```

## See Also

- [server.md](./server.md) - Production server details
- [server-dev.md](./server-dev.md) - Development server details
- [server-e2e.md](./server-e2e.md) - E2E testing server details
