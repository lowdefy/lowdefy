# Dynamic JIT Pages

## Summary

Dynamic pages are pages whose config is computed at request time by server-side **page resolver** plugins. Unlike static pages (defined in YAML at build time) or existing JIT pages (defined in YAML but compiled lazily), dynamic pages produce their entire block tree on the fly — based on the current user, URL parameters, database state, or any server-side logic the resolver implements.

## Motivation

Static Lowdefy pages are declared in YAML and fully known at build time. The existing JIT system defers _compilation_ of static pages until first request, but the page content itself is still fixed in the YAML config. There is no mechanism for a page whose structure changes per-request.

Use cases:

1. **Personalised dashboards** — A home page whose blocks, requests, and layout depend on the signed-in user's role, preferences, or recent activity.
2. **LLM-generated pages** — A URL like `/ai?prompt=show+sales` where a resolver calls an LLM to produce a Lowdefy page config on the fly, constrained by the connections and schemas available in the app.
3. **Data-driven layouts** — An admin page whose form fields are generated from a database table's column metadata at request time.
4. **Multi-tenant theming** — A single page ID that resolves to different block trees depending on the tenant extracted from the request.

## Current Architecture (How JIT Works Today)

```
lowdefy.yaml → buildRefs (shallow) → pageRegistry.json
                                          ↓
              Browser GET /home → API /api/page/home
                                          ↓
              pageRegistry[home] has ~shallow markers
                                          ↓
              buildPageJit resolves ~shallow → runs buildPage pipeline
                                          ↓
              writes pages/home/home.json → cached in PageCache
                                          ↓
              getPageConfig reads pages/home/home.json → client renders
```

Key properties of the current system:

- **Pages are defined in YAML** — `lowdefy.pages` is an array of block objects.
- **Shallow build** stores page-level content (blocks, areas, events, requests, layout) with `~shallow` markers in the `pageRegistry`.
- **`buildPageJit`** resolves `~shallow` markers, runs operators, validates, and writes the compiled page JSON.
- **PageCache** tracks which pages are compiled and handles concurrency locks.
- **`getPageConfig`** reads the pre-built JSON from disk, checks auth, strips `auth`, and returns to the client.
- **The client** receives the page config and renders it through the standard Context → Block pipeline.

The page config format that the client receives is a standard block tree — this is the contract we must preserve.

## Design

### Core Concept: Page Resolvers

A **page resolver** is a server-side plugin function that receives request context (user, URL params, headers, connections) and returns a Lowdefy page config object (a block tree with events, requests, etc.). The returned config is then compiled through the existing `buildPageJit` pipeline so it gets full validation, key tracking, JS extraction, and operator support.

```
Browser GET /dashboard
        ↓
Server: is this a dynamic page? (check page config)
        ↓  yes
Load page resolver plugin
        ↓
resolver({ user, urlQuery, connections, pageConfig }) → raw page config
        ↓
buildPageJit compiles the raw config (same pipeline as today)
        ↓
Return compiled page to client (same format as static pages)
        ↓
Client renders normally (no client-side changes needed)
```

### Schema Extension

Dynamic pages are declared in the standard `lowdefy.pages` array with a `resolver` property:

```yaml
lowdefy: "4.x"

connections:
  - id: mainDb
    type: MongoDBCollection
    properties:
      uri:
        _secret: MONGODB_URI
      collection: activities

pages:
  # Static page (unchanged)
  - id: about
    type: Box
    blocks:
      - id: title
        type: Title
        properties:
          content: About Us

  # Dynamic page — resolver generates the block tree at request time
  - id: dashboard
    type: DynamicPage
    resolver:
      type: DashboardResolver
      properties:
        defaultLayout: two-column
        maxWidgets: 12
    auth:
      public: false
    # Optional: static skeleton shown while resolver runs (loading state)
    skeleton:
      type: Box
      blocks:
        - id: loading
          type: Spinner
    # Optional: caching strategy
    cache:
      strategy: per-user     # none | per-user | per-role | shared
      ttl: 300               # seconds, 0 = no cache
```

#### Schema Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | yes | Page ID, used in URLs and menus |
| `type` | string | yes | Must be `DynamicPage` (a virtual block type) |
| `resolver` | object | yes | Resolver plugin reference |
| `resolver.type` | string | yes | Resolver plugin type name |
| `resolver.properties` | object | no | Static config passed to the resolver |
| `auth` | object | no | Standard auth rules (checked before resolver runs) |
| `skeleton` | block | no | Static block tree shown as loading state |
| `cache` | object | no | Caching configuration |
| `cache.strategy` | string | no | `none`, `per-user`, `per-role`, `shared` |
| `cache.ttl` | number | no | Cache TTL in seconds |

### Resolver Plugin Interface

Resolvers are a new plugin category, alongside blocks, operators, actions, and connections:

```javascript
// packages/plugins/resolvers/resolvers-community/src/resolvers/DashboardResolver/DashboardResolver.js

async function DashboardResolver({ user, urlQuery, connections, properties, pageId }) {
  // connections: map of connectionId → connection resolver (can execute queries)
  // user: current session user
  // urlQuery: URL query parameters
  // properties: static properties from the resolver config

  const activities = await connections.mainDb.find({
    query: { userId: user.sub },
    options: { sort: { date: -1 }, limit: 10 },
  });

  return {
    id: pageId,
    type: 'Box',
    properties: {
      title: `Welcome back, ${user.name}`,
    },
    blocks: [
      {
        id: 'recent_activity',
        type: 'List',
        properties: {
          data: activities,
        },
        blocks: [
          {
            id: 'activity_item',
            type: 'Card',
            properties: {
              title: { _index: 'name' },
            },
          },
        ],
      },
    ],
    // Requests for client-side data fetching after initial render
    requests: [
      {
        id: 'refreshActivities',
        type: 'MongoDBFind',
        connectionId: 'mainDb',
        properties: {
          query: { userId: { _user: 'sub' } },
          options: { sort: { date: -1 }, limit: 10 },
        },
      },
    ],
    events: {
      onInit: [
        { id: 'fetch', type: 'Request', params: 'refreshActivities' },
      ],
    },
  };
}

DashboardResolver.meta = {
  // Declares which connections this resolver needs access to.
  // Build validates these exist. Runtime provides only these.
  connections: ['mainDb'],
};

export default DashboardResolver;
```

#### Resolver Function Signature

```javascript
async function MyResolver({
  user,           // Session user object (null if not authenticated)
  urlQuery,       // URL query parameters ({ prompt: "show sales" })
  urlPath,        // URL path parameters if using parameterised routes
  headers,        // Request headers (read-only subset)
  properties,     // Static properties from resolver config in YAML
  pageId,         // The page ID being resolved
  connections,    // Connection executors (see below)
  global,         // Lowdefy global config object
  secrets,        // Server secrets accessor
}) {
  // Must return a valid Lowdefy page config (block tree)
  return {
    id: pageId,
    type: 'Box',
    blocks: [...],
    requests: [...],
    events: {...},
  };
}
```

#### Connection Executors

Resolvers should not get raw database clients. Instead, they receive **connection executors** — thin wrappers that use the existing connection/request infrastructure:

```javascript
// The resolver receives:
connections.mainDb.find({ query: {...} })
// Which internally calls the MongoDBFind request resolver
// with the connection config already loaded and auth-checked.
```

This reuses the existing `callRequestResolver` pipeline, ensuring:
- Connection properties are operator-evaluated (secrets resolved)
- Read/write checks are enforced
- Schema validation runs
- Errors are properly wrapped

### Build Pipeline Changes

#### Shallow Build (shallowBuild.js)

During shallow build, dynamic pages are processed like any other page for skeleton purposes (menus, auth, config). The key difference is that their `rawContent` in the page registry stores the `resolver` config instead of block content:

```javascript
// In createPageRegistry, for dynamic pages:
registry.set(page.id, {
  pageId: page.id,
  auth: page.auth,
  type: page.type,       // 'DynamicPage'
  dynamic: true,          // New flag
  resolver: page.resolver,
  skeleton: page.skeleton,
  cache: page.cache,
  refId: page['~r'] ?? null,
  rawContent: {},         // No static block content
});
```

The `DynamicPage` type is registered as a virtual block type so `buildTypes` doesn't reject it.

#### Full Build (index.js)

For production builds, dynamic pages are **not** pre-compiled. Instead, the build writes a marker file:

```
pages/dashboard/dashboard.json → { dynamic: true, resolver: {...}, skeleton: {...}, cache: {...} }
```

This marker tells the runtime that this page needs resolver execution.

#### JIT Build Extension (buildPageJit.js)

`buildPageJit` gains awareness of dynamic pages:

```javascript
async function buildPageJit({ pageId, pageRegistry, context, resolverContext }) {
  const pageEntry = pageRegistry[pageId];

  if (pageEntry.dynamic) {
    // 1. Load and execute the resolver
    const rawPageConfig = await executeResolver({
      pageEntry,
      resolverContext,   // { user, urlQuery, headers, ... }
      context,
    });

    // 2. Merge with standard page metadata
    const rawPage = {
      id: pageEntry.pageId,
      auth: pageEntry.auth,
      ...rawPageConfig,
    };

    // 3. Run through existing build pipeline
    // (addKeys, buildPage, validatePageTypes, jsMapParser, etc.)
    // ... same as current buildPageJit from this point
  }

  // Existing static page JIT logic (unchanged)
  // ...
}
```

### Runtime Changes

#### API Route: `/api/page/[pageId].js` (server-dev and server)

The page API route is the primary integration point. It needs to:

1. Check if the page is dynamic (from the page registry or marker file)
2. If dynamic, pass request context to the build/resolve pipeline
3. Handle caching (dynamic pages are NOT cached in PageCache by default)

```javascript
// Simplified flow in the API route handler:
async function handler({ context, req, res }) {
  const { pageId } = req.query;
  const pageEntry = getPageEntry(pageId);

  if (pageEntry?.dynamic) {
    // Dynamic page: resolve + build on every request (or check cache)
    const cachedPage = dynamicPageCache.get(pageId, context);
    if (cachedPage) {
      res.status(200).json(cachedPage);
      return;
    }

    const resolverContext = {
      user: context.session?.user,
      urlQuery: req.query,
      headers: req.headers,
    };

    const pageConfig = await buildDynamicPage({
      pageId,
      pageEntry,
      resolverContext,
      buildContext: context,
    });

    dynamicPageCache.set(pageId, context, pageConfig);
    res.status(200).json(pageConfig);
    return;
  }

  // Existing static page logic (unchanged)
  await buildPageIfNeeded({ pageId, ... });
  const pageConfig = await getPageConfig(context, { pageId });
  res.status(200).json(pageConfig);
}
```

#### Dynamic Page Cache

Unlike static JIT pages (compiled once, cached forever until invalidated), dynamic pages need request-aware caching:

```javascript
class DynamicPageCache {
  // cache key = pageId + strategy-dependent suffix
  getCacheKey(pageId, strategy, context) {
    switch (strategy) {
      case 'per-user':
        return `${pageId}:user:${context.user?.sub}`;
      case 'per-role':
        return `${pageId}:role:${context.user?.roles?.sort().join(',')}`;
      case 'shared':
        return `${pageId}:shared`;
      default: // 'none'
        return null; // Never cache
    }
  }
}
```

#### Production Server (server)

The production server currently uses `getServerSideProps` which reads pre-built JSON. For dynamic pages, it needs to detect the marker file and execute the resolver:

```javascript
// In getServerSidePropsHandler:
async function getServerSidePropsHandler({ context, nextContext }) {
  const { pageId } = nextContext.params;
  const pageConfig = await getPageConfig(context, { pageId });

  if (pageConfig?.dynamic) {
    // This is a dynamic page marker — execute resolver
    const resolvedConfig = await resolveDynamicPage({
      marker: pageConfig,
      context,
      req: nextContext.req,
    });
    return { props: { pageConfig: resolvedConfig, rootConfig, session } };
  }

  // Existing static path
  return { props: { pageConfig, rootConfig, session } };
}
```

### Client Changes

**None required.** The client receives a standard page config (block tree) regardless of whether it was statically defined or dynamically resolved. This is the key design principle — dynamic pages are transparent to the client.

The optional `skeleton` block tree can be used as an immediate loading state while the resolver executes server-side, but this is handled by the server's SSR/streaming, not by client-side code.

### Plugin Registration

Resolvers follow the existing plugin pattern:

```
packages/plugins/resolvers/
├── resolvers-community/
│   ├── src/
│   │   ├── resolvers/
│   │   │   ├── DashboardResolver/
│   │   │   │   ├── DashboardResolver.js
│   │   │   │   └── schema.json
│   │   │   └── LlmPageResolver/
│   │   │       ├── LlmPageResolver.js
│   │   │       └── schema.json
│   │   └── types.js
│   └── package.json
```

`types.js`:
```javascript
export default {
  resolvers: {
    DashboardResolver: {
      import: 'DashboardResolver',
      package: '@lowdefy/resolvers-community',
    },
    LlmPageResolver: {
      import: 'LlmPageResolver',
      package: '@lowdefy/resolvers-community',
    },
  },
};
```

Build imports generate the resolver map alongside existing plugin maps:

```javascript
// plugins/resolvers.js (generated by buildImports)
export { default as DashboardResolver } from '@lowdefy/resolvers-community/resolvers/DashboardResolver';
export { default as LlmPageResolver } from '@lowdefy/resolvers-community/resolvers/LlmPageResolver';
```

### LLM Page Resolver Example

```javascript
async function LlmPageResolver({ user, urlQuery, properties, connections }) {
  const { prompt } = urlQuery;
  const { model, systemPrompt, maxBlocks } = properties;

  // Get available schema info for the LLM
  const connectionSchemas = await getConnectionSchemas(connections);

  const llmResponse = await callLlm({
    model: model ?? 'claude-sonnet-4-20250514',
    system: systemPrompt ?? `You generate Lowdefy page configs as JSON.
Available connections: ${JSON.stringify(connectionSchemas)}.
Maximum ${maxBlocks ?? 20} blocks.
Return a valid Lowdefy page config object.`,
    prompt,
  });

  // Parse and validate the LLM output
  const pageConfig = JSON.parse(llmResponse);

  // The build pipeline will validate block types, connection refs, etc.
  // Invalid configs will produce build errors shown to the user.
  return pageConfig;
}

LlmPageResolver.schema = {
  type: 'object',
  properties: {
    model: { type: 'string' },
    systemPrompt: { type: 'string' },
    maxBlocks: { type: 'integer' },
  },
};

LlmPageResolver.meta = {
  connections: '*', // Access to all connections (for schema introspection)
};
```

YAML config:
```yaml
pages:
  - id: ai
    type: DynamicPage
    resolver:
      type: LlmPageResolver
      properties:
        model: claude-sonnet-4-20250514
        maxBlocks: 30
    auth:
      public: false
    cache:
      strategy: none  # Every request gets a fresh page
```

## Implementation Plan

### Phase 1: Schema and Build Support

1. **Add `DynamicPage` to schema** — Extend `lowdefySchema.js` with a `DynamicPage` block type that accepts `resolver`, `skeleton`, and `cache` properties.
2. **Extend `createPageRegistry`** — Store `dynamic: true`, `resolver`, `skeleton`, `cache` for dynamic pages instead of block content.
3. **Extend `buildPageJit`** — Add dynamic page branch that calls the resolver before running the standard build pipeline.
4. **Register `resolvers` as a plugin category** — Add `resolvers` to `typesMap`, `buildTypes`, `buildImports`.

### Phase 2: Resolver Execution Runtime

5. **Create `executeResolver` function** — Loads the resolver plugin, creates connection executors, calls the resolver function, validates the return value is a valid page shape.
6. **Create connection executor wrappers** — Thin wrappers around existing connection/request infrastructure that resolvers use to query data.
7. **Add `DynamicPageCache`** — Request-aware cache with strategy-based keys and TTL.

### Phase 3: Server Integration

8. **Update `server-dev` page API route** — Detect dynamic pages, pass request context, handle resolver errors with BuildErrorPage.
9. **Update `server` production handler** — Detect dynamic page marker files, execute resolver in `getServerSideProps`.
10. **Update `serverSidePropsWrapper` and `apiWrapper`** — Pass URL query params and headers through to the build context.

### Phase 4: Production Build Support

11. **Update full build (`index.js`)** — Write dynamic page marker files instead of compiled page JSON.
12. **Production resolver loading** — Ensure resolver plugins are included in the production bundle.

### Phase 5: Testing and Docs

13. **Unit tests** — `buildPageJit` with dynamic pages, resolver execution, caching.
14. **Integration tests** — End-to-end dynamic page resolution in dev and production modes.
15. **Documentation** — User-facing docs for defining dynamic pages and writing resolvers.

## Considerations

### Security

- **Auth runs before resolver** — The page-level `auth` config is checked before the resolver executes, so unauthenticated users never trigger resolver logic.
- **Connection sandboxing** — Resolvers only get executors for connections declared in their `meta.connections`. A resolver with `connections: ['mainDb']` cannot access `analyticsDb`.
- **No raw secrets** — Resolvers receive a secrets accessor (same as operators), not raw values.
- **Resolver output validation** — The returned config goes through the full `buildPageJit` pipeline including schema validation and type checking. A resolver cannot inject invalid block types or reference non-existent connections.

### Performance

- **Caching is critical** — Resolver execution can be expensive (DB queries, LLM calls). The cache strategy system lets developers choose the right trade-off.
- **Skeleton SSR** — The optional `skeleton` block tree is returned immediately as the page shell, with the dynamic content injected once the resolver completes. This gives instant TTFB.
- **Connection pooling** — Connection executors should reuse existing connection pools, not create new connections per resolver call.

### Compatibility

- **Client is unchanged** — Dynamic pages produce standard page configs. The client rendering pipeline (Context, Block, Areas) works identically.
- **Menus work** — Dynamic pages have static IDs and appear in menus normally. The menu entry for a dynamic page links to `/dashboard` just like a static page.
- **Operators work** — The resolver returns a page config that can contain operators (`_user`, `_state`, etc.). These are processed by the standard build pipeline (build-time operators) and client engine (runtime operators).
- **Requests work** — Resolvers can include `requests` in the returned config. These are compiled by `buildPageJit` and available for client-side `Request` actions.

### Limitations

- **No hot reload of resolver code** — Changing a resolver's JavaScript requires a server restart (same as changing connection plugins). The resolver's YAML _properties_ do hot-reload via the standard file watcher.
- **Build validation is partial** — Since the page content isn't known until request time, build-time validation (link refs, state refs) can only validate what the resolver actually returns. A resolver bug might only surface at runtime.
- **No ISR/SSG** — Dynamic pages are inherently SSR-only. They cannot be statically generated at build time (by definition).
