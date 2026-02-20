# JIT Page Resolver — Dynamic Server-Side Page Content

**Branch:** `claude/add-jit-page-resolver-7HuYf`
**Status:** Plan
**Goal:** Enable pages to dynamically resolve content at request time via a server-side resolver function, while keeping the page build pipeline intact and enforcing security through explicit connection scoping.

---

## 1. Core Insight

Lowdefy pages are built at build time (or JIT in dev) and served as static JSON config to the client. This works well for most cases, but some pages need **server-side dynamic content** — content that depends on the request URL, user identity, or data fetched at request time.

The JIT Page Resolver adds a **server-side resolution step** between reading the built page config and sending it to the client. A user-defined async resolver function runs on the server with access to runtime context (`input`, `urlQuery`, `global`, `user`) and can call the page's requests. It returns values that replace **delta markers** (`~delta`) placed throughout the page config.

The page is still built normally — validated, type-checked, and optimized. The resolver only fills in the "holes" marked by `~delta` at request time.

---

## 2. Architecture

### Current Page Serving Flow

```
[Build Time]
  lowdefy.yaml → buildPages → page.json + requests/*.json

[Request Time — Production]
  Browser requests /products
    → Next.js getServerSideProps
      → getPageConfig reads pages/products/products.json
      → returns pageConfig to client
    → Client renders page

[Request Time — Dev]
  Browser requests /products
    → Client fetches /api/page/products
      → JIT builds page if needed
      → reads pages/products/products.json
      → returns pageConfig to client
    → Client renders page
```

### New Flow With Resolver

```
[Build Time]
  lowdefy.yaml → buildPages → page.json + requests/*.json
  (page.json contains ~delta markers and resolver metadata)

[Request Time — Production]
  Browser requests /products?category=shoes
    → Next.js getServerSideProps
      → getPageConfig reads pages/products/products.json
      → detectResolver: page has ~delta config with type: 'Resolver'
      → resolvePageDeltas:
          1. Walk page config, collect all { ~delta: 'key' } markers
          2. Build resolver context: { input, urlQuery, global, user, callRequest }
          3. Execute resolver function (async)
          4. Replace ~delta markers with resolver return values
      → returns resolved pageConfig to client
    → Client renders page with dynamic content

[Request Time — Dev]
  Same flow, but via /api/page/[pageId] after JIT build
```

### Key Principle: Build Validates, Resolver Fills

The build pipeline continues to validate the entire page — block types, event references, state references, link targets. The `~delta` markers pass through validation as placeholder values. The resolver only provides values at request time; it cannot add new blocks, events, or requests. This keeps the security model intact.

---

## 3. Configuration Shape

### Enabling a Resolver on a Page

The `~delta` property on the **page-level block** (the first block) activates the resolver:

```yaml
pages:
  - id: products
    type: PageHeaderMenu
    # Resolver configuration on the page block
    ~delta:
      type: Resolver
      connectionIds:
        - productsDb
        - searchApi
      resolver:
        _ref: resolvers/products.js
    blocks:
      - id: page_title
        type: Title
        properties:
          content:
            ~delta: pageTitle       # ← dynamic injection point
      - id: product_grid
        type: AgGridAlpine
        properties:
          columnDefs:
            - headerName: Name
              field: name
            - headerName: Price
              field: price
          rowData:
            ~delta: productRows     # ← dynamic injection point
      - id: category_label
        type: Paragraph
        properties:
          content:
            ~delta: categoryLabel   # ← dynamic injection point
    requests:
      - id: fetchProducts
        type: MongoDBFind
        connectionId: productsDb
        properties:
          collection: products
          query:
            category:
              _urlQuery: category
```

### Delta Configuration Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | `'Resolver'` | Yes | Enables the resolver on this page |
| `connectionIds` | `string[]` | Yes | Connections the resolver can access. Security boundary — only these connections can be used by `callRequest` within the resolver |
| `resolver` | `object` | Yes | The resolver function. Use `_ref` to reference a JS file, or `_js` for an inline function |

### Delta Markers

A `~delta` marker is placed anywhere in the page config where dynamic content should be injected:

```yaml
properties:
  title:
    ~delta: pageTitle          # Simple value replacement

  items:
    ~delta: menuItems          # Can replace with arrays, objects, any JSON value

  style:
    color:
      ~delta: themeColor       # Nested within other properties
```

Each marker's value is its **key name** — a string identifier that the resolver uses to map return values.

### The Resolver Function

```javascript
// resolvers/products.js
export default async function resolver({ deltas, input, urlQuery, global, user, callRequest }) {
  // deltas = { pageTitle: undefined, productRows: undefined, categoryLabel: undefined }
  // These are the keys found on the page — the resolver must return values for them.

  const category = urlQuery.category ?? 'all';

  // Call a request defined on this page (scoped to declared connectionIds)
  const products = await callRequest('fetchProducts');

  return {
    pageTitle: `${category.charAt(0).toUpperCase() + category.slice(1)} Products`,
    productRows: products,
    categoryLabel: `Showing ${products.length} products in "${category}"`,
  };
}
```

### Resolver Function Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `deltas` | `object` | Object with all delta keys found on the page, values are `undefined`. The resolver should return values for these keys |
| `input` | `object` | Page input (passed via `Link` actions or URL) |
| `urlQuery` | `object` | URL query parameters |
| `global` | `object` | Lowdefy global state |
| `user` | `object \| null` | Authenticated user object (from session), or `null` |
| `callRequest` | `function` | `async (requestId, { payload? }) => response` — calls a request defined on the page. Only requests using declared `connectionIds` are accessible |

### Resolver Return Value

The resolver must return a plain object mapping delta keys to their resolved values:

```javascript
{
  pageTitle: 'Shoes Products',        // string
  productRows: [{ name: '...' }],     // array
  categoryLabel: 'Showing 42 items',  // string
  themeColor: '#ff6600',              // any JSON-serializable value
}
```

Keys not returned by the resolver remain as their `~delta` marker (which the client should handle gracefully — e.g., show nothing or a placeholder).

---

## 4. End-to-End Examples

### Example 1: Dynamic Product Catalog

A page that displays products based on URL query parameters, with server-side data fetching:

**`lowdefy.yaml`:**

```yaml
lowdefy: 4.4.2
name: Product Store

connections:
  - id: productsDb
    type: MongoDBCollection
    properties:
      databaseUrl:
        _secret: MONGODB_URI
      collection: products

pages:
  - id: products
    type: PageHeaderMenu
    ~delta:
      type: Resolver
      connectionIds:
        - productsDb
      resolver:
        _ref: resolvers/products.js
    properties:
      title:
        ~delta: pageTitle
    blocks:
      - id: header
        type: Title
        properties:
          level: 2
          content:
            ~delta: headerText
      - id: stats
        type: Statistic
        properties:
          title: Products Found
          value:
            ~delta: productCount
      - id: grid
        type: AgGridAlpine
        properties:
          columnDefs:
            - headerName: Name
              field: name
            - headerName: Price
              field: price
              valueFormatter:
                _js:
                  code: |
                    return '$' + params.value.toFixed(2);
          rowData:
            ~delta: products
    requests:
      - id: getProducts
        type: MongoDBFind
        connectionId: productsDb
        properties:
          query:
            category:
              _payload: category
          options:
            sort:
              - - name
                - 1
```

**`resolvers/products.js`:**

```javascript
export default async function resolver({ deltas, urlQuery, user, callRequest }) {
  const category = urlQuery.category ?? 'all';

  const products = await callRequest('getProducts', {
    payload: { category: category === 'all' ? {} : category },
  });

  return {
    pageTitle: `${category} — Product Store`,
    headerText: category === 'all'
      ? 'All Products'
      : `Products: ${category}`,
    productCount: products.length,
    products,
  };
}
```

**What happens at request time:**

1. User visits `/products?category=shoes`
2. Server reads built page config (has `~delta` markers)
3. Server calls resolver with `urlQuery: { category: 'shoes' }`
4. Resolver calls `getProducts` request with `payload: { category: 'shoes' }`
5. Resolver returns `{ pageTitle: 'shoes — Product Store', headerText: 'Products: shoes', productCount: 12, products: [...] }`
6. Server replaces all `~delta` markers with resolved values
7. Client receives fully populated page config and renders normally

### Example 2: User-Specific Dashboard

A dashboard that customizes layout and data per user role:

```yaml
pages:
  - id: dashboard
    type: PageHeaderMenu
    ~delta:
      type: Resolver
      connectionIds:
        - mainDb
      resolver:
        _ref: resolvers/dashboard.js
    properties:
      title:
        ~delta: greeting
    blocks:
      - id: welcome
        type: Title
        properties:
          content:
            ~delta: welcomeMessage
      - id: stats_row
        type: Box
        layout:
          contentGutter: 16
        blocks:
          - id: stat1
            type: Statistic
            properties:
              title:
                ~delta: stat1Title
              value:
                ~delta: stat1Value
          - id: stat2
            type: Statistic
            properties:
              title:
                ~delta: stat2Title
              value:
                ~delta: stat2Value
      - id: recent_items
        type: AgGridAlpine
        properties:
          columnDefs:
            ~delta: tableColumns
          rowData:
            ~delta: tableData
    requests:
      - id: getAdminStats
        type: MongoDBFind
        connectionId: mainDb
        properties:
          collection: admin_stats
      - id: getUserActivity
        type: MongoDBFind
        connectionId: mainDb
        properties:
          collection: user_activity
          query:
            userId:
              _payload: userId
```

**`resolvers/dashboard.js`:**

```javascript
export default async function resolver({ deltas, user, callRequest }) {
  const isAdmin = user?.roles?.includes('admin');
  const name = user?.name ?? 'Guest';

  if (isAdmin) {
    const stats = await callRequest('getAdminStats');
    return {
      greeting: `Admin Dashboard — ${name}`,
      welcomeMessage: `Welcome back, ${name}. System overview:`,
      stat1Title: 'Total Users',
      stat1Value: stats[0]?.totalUsers ?? 0,
      stat2Title: 'Active Sessions',
      stat2Value: stats[0]?.activeSessions ?? 0,
      tableColumns: [
        { headerName: 'User', field: 'userName' },
        { headerName: 'Action', field: 'action' },
        { headerName: 'Time', field: 'timestamp' },
      ],
      tableData: stats[0]?.recentActivity ?? [],
    };
  }

  const activity = await callRequest('getUserActivity', {
    payload: { userId: user?.sub },
  });
  return {
    greeting: `My Dashboard — ${name}`,
    welcomeMessage: `Welcome, ${name}. Here's your recent activity:`,
    stat1Title: 'My Tasks',
    stat1Value: activity.filter(a => a.type === 'task').length,
    stat2Title: 'Completed',
    stat2Value: activity.filter(a => a.status === 'done').length,
    tableColumns: [
      { headerName: 'Task', field: 'title' },
      { headerName: 'Status', field: 'status' },
      { headerName: 'Due Date', field: 'dueDate' },
    ],
    tableData: activity.filter(a => a.type === 'task'),
  };
}
```

### Example 3: Multi-Tenant Page with Inline Resolver

For simple cases, the resolver can be defined inline using `_js`:

```yaml
pages:
  - id: tenant_home
    type: PageHeaderMenu
    ~delta:
      type: Resolver
      connectionIds: []
      resolver:
        _js:
          code: |
            const tenant = urlQuery.tenant ?? 'default';
            const themes = {
              acme: { color: '#e74c3c', name: 'Acme Corp' },
              globex: { color: '#3498db', name: 'Globex Inc' },
              default: { color: '#2ecc71', name: 'Welcome' },
            };
            const theme = themes[tenant] ?? themes.default;
            return {
              brandName: theme.name,
              brandColor: theme.color,
            };
    blocks:
      - id: header
        type: Title
        properties:
          content:
            ~delta: brandName
          style:
            color:
              ~delta: brandColor
```

---

## 5. Build-Time Processing

### 5.1 What Changes During Build

The build pipeline processes resolver pages with minimal changes:

1. **`~delta` config extraction**: The `~delta` property on the page block is extracted and stored as page-level metadata (similar to how `auth` is handled)
2. **`~delta` marker preservation**: Objects like `{ ~delta: 'keyName' }` throughout the page config are preserved as-is through the build pipeline — they're just regular objects with a string value
3. **Resolver function compilation**: If the resolver uses `_ref`, it's resolved during build. If it uses `_js`, it's extracted to `jsMap` like any other `_js` operator
4. **Connection validation**: The `connectionIds` in the resolver config are validated against the app's connections at build time
5. **Delta key collection**: All `~delta` marker keys are collected and stored in the page metadata for validation

### 5.2 Build Artifact Changes

The page JSON gains a `~resolver` metadata section:

```json
{
  "id": "products",
  "type": "PageHeaderMenu",
  "auth": { "public": true },
  "~resolver": {
    "connectionIds": ["productsDb"],
    "resolverFunctionId": "resolver:products",
    "deltaKeys": ["pageTitle", "headerText", "productCount", "products"]
  },
  "blocks": [
    {
      "id": "header",
      "type": "Title",
      "properties": {
        "content": { "~delta": "headerText" }
      }
    }
  ],
  "requests": [...]
}
```

The resolver function itself is stored in `jsMap` (server environment) as `resolver:products`, compiled and ready to execute.

### 5.3 New Build Steps

#### `buildPageResolver.js` — Extract and Validate Resolver Config

```javascript
function buildPageResolver({ page, context }) {
  const deltaConfig = page['~delta'];
  if (type.isNone(deltaConfig)) {
    return; // No resolver on this page
  }

  if (deltaConfig.type !== 'Resolver') {
    throw new ConfigError({
      message: `Page "${page.id}" has ~delta with unsupported type "${deltaConfig.type}". Only "Resolver" is supported.`,
      configKey: page['~k'],
      context,
    });
  }

  // Validate connectionIds exist
  for (const connectionId of deltaConfig.connectionIds ?? []) {
    if (!context.connectionIds.has(connectionId)) {
      throw new ConfigError({
        message: `Page "${page.id}" resolver references connection "${connectionId}" which does not exist.`,
        configKey: page['~k'],
        context,
      });
    }
  }

  // Collect all ~delta markers in the page config
  const deltaKeys = collectDeltaKeys(page);
  if (deltaKeys.length === 0) {
    context.logger.configWarning({
      message: `Page "${page.id}" has a resolver but no ~delta markers. The resolver will have no effect.`,
      configKey: page['~k'],
    });
  }

  // Store resolver metadata on the page
  page['~resolver'] = {
    connectionIds: deltaConfig.connectionIds ?? [],
    deltaKeys,
    // resolverFunctionId is set after jsMap extraction
  };

  // Remove ~delta from page block (it's metadata, not a property)
  delete page['~delta'];
}
```

#### `collectDeltaKeys.js` — Walk Config Tree for Delta Markers

```javascript
function collectDeltaKeys(obj) {
  const keys = [];

  function walk(node) {
    if (type.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (!type.isObject(node)) {
      return;
    }
    if (type.isString(node['~delta'])) {
      keys.push(node['~delta']);
      return; // Don't recurse into delta markers
    }
    Object.values(node).forEach(walk);
  }

  walk(obj);
  return [...new Set(keys)]; // Deduplicate
}
```

### 5.4 Serializer Handling

The `~delta` key uses the `~` prefix convention but is **not** a serializer marker like `~k` or `~r`. It's a user-defined config value. The serializer needs to preserve it through serialization/deserialization without special treatment.

Since `~delta` is not in the serializer's known marker set (`~d`, `~e`, `~k`, `~r`, `~arr`), it passes through as a regular object key. No serializer changes are needed.

---

## 6. Runtime Resolution

### 6.1 Production Server Flow

The resolver executes in `getPageConfig` (or a new wrapper around it):

#### `resolvePageDeltas.js` — Core Runtime Resolution

```javascript
async function resolvePageDeltas({ pageConfig, context }) {
  const resolverMeta = pageConfig['~resolver'];
  if (!resolverMeta) {
    return pageConfig; // No resolver — return as-is
  }

  const { connectionIds, deltaKeys, resolverFunctionId } = resolverMeta;

  // Build scoped callRequest that only allows declared connections
  const scopedCallRequest = createScopedCallRequest({
    context,
    pageId: pageConfig.id,
    allowedConnectionIds: new Set(connectionIds),
  });

  // Build resolver context
  const resolverContext = {
    deltas: Object.fromEntries(deltaKeys.map((k) => [k, undefined])),
    input: context.input ?? {},
    urlQuery: context.urlQuery ?? {},
    global: context.global ?? {},
    user: context.user ?? null,
    callRequest: scopedCallRequest,
  };

  // Execute the resolver function
  const resolverFn = context.jsMap[resolverFunctionId];
  const resolvedValues = await resolverFn(resolverContext);

  // Apply resolved values to the page config
  const resolvedPage = applyDeltas(pageConfig, resolvedValues);

  // Clean up resolver metadata (don't send to client)
  delete resolvedPage['~resolver'];

  return resolvedPage;
}
```

#### `createScopedCallRequest.js` — Security-Scoped Request Execution

```javascript
function createScopedCallRequest({ context, pageId, allowedConnectionIds }) {
  return async function scopedCallRequest(requestId, { payload } = {}) {
    // Load the request config
    const requestConfig = await context.readConfigFile(
      `pages/${pageId}/requests/${requestId}.json`
    );
    if (!requestConfig) {
      throw new Error(`Request "${requestId}" does not exist on page "${pageId}".`);
    }

    // Security check: verify the request's connection is in the allowed set
    if (!allowedConnectionIds.has(requestConfig.connectionId)) {
      throw new Error(
        `Request "${requestId}" uses connection "${requestConfig.connectionId}" ` +
        `which is not in the resolver's connectionIds. ` +
        `Allowed: [${[...allowedConnectionIds].join(', ')}].`
      );
    }

    // Delegate to the existing callRequest infrastructure
    const response = await callRequest(context, {
      blockId: 'resolver',
      pageId,
      payload: serializer.serialize(payload ?? {}),
      requestId,
    });

    return response.response;
  };
}
```

#### `applyDeltas.js` — Replace Delta Markers with Values

```javascript
function applyDeltas(obj, resolvedValues) {
  if (type.isArray(obj)) {
    return obj.map((item) => applyDeltas(item, resolvedValues));
  }

  if (!type.isObject(obj)) {
    return obj;
  }

  // Found a delta marker — replace with resolved value
  if (type.isString(obj['~delta'])) {
    const key = obj['~delta'];
    return resolvedValues[key] !== undefined ? resolvedValues[key] : null;
  }

  // Recurse into object
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = applyDeltas(value, resolvedValues);
  }
  // Preserve non-enumerable meta properties (~k, ~r, etc.)
  preserveMetaProperties(result, obj);
  return result;
}
```

### 6.2 Integration Points

#### Production Server: `getServerSideProps` in `[pageId].js`

```javascript
async function getServerSidePropsHandler({ context, nextContext }) {
  const { pageId } = nextContext.params;

  // Pass urlQuery and input to context for resolver access
  context.urlQuery = nextContext.query;
  context.input = nextContext.query._input
    ? JSON.parse(nextContext.query._input)
    : {};

  const [rootConfig, pageConfig] = await Promise.all([
    getRootConfig(context),
    getPageConfig(context, { pageId }),
  ]);

  if (!pageConfig) {
    return { redirect: { destination: '/404', permanent: false } };
  }

  // Resolve deltas if page has a resolver
  const resolvedConfig = await resolvePageDeltas({ pageConfig, context });

  return {
    props: {
      pageConfig: resolvedConfig,
      rootConfig,
      session: context.session,
    },
  };
}
```

#### Dev Server: `/api/page/[pageId].js`

Same integration — after JIT build completes and page config is read, call `resolvePageDeltas` before returning to client.

### 6.3 How `urlQuery` and `input` Reach the Resolver

Currently, `getPageConfig` doesn't receive `urlQuery` or `input`. These need to be threaded through:

**Production path:**
- `getServerSideProps` has access to `nextContext.query` (URL query params)
- `nextContext.query` is attached to `context.urlQuery` before calling resolver

**Dev path:**
- The client-side `usePageConfig` hook fetches `/api/page/[pageId]`
- URL query params are available on the API request's `req.query`
- These are attached to `context.urlQuery` in the API handler

**`global` state:**
- Read from the built `global.json` artifact at request time
- Available as `context.global`

**`input`:**
- In Lowdefy, `input` is typically passed via `Link` actions and stored client-side
- For the resolver, `input` comes from URL query parameters (encoded) or the page request body
- The server reads it from the request and passes it to the resolver

---

## 7. Security Model

### 7.1 Connection Scoping

The resolver's `connectionIds` array is the primary security boundary:

```yaml
~delta:
  type: Resolver
  connectionIds:
    - productsDb      # ✅ Resolver can call requests using this connection
    # paymentDb       # ✗ NOT listed — resolver cannot access payment data
```

- **Build-time validation**: All listed `connectionIds` must exist in the app's connections
- **Runtime enforcement**: `createScopedCallRequest` checks every request's `connectionId` against the allowed set before execution
- **Principle of least privilege**: A resolver can only access the connections it explicitly declares

### 7.2 Request Scoping

The resolver can only call requests **defined on the same page**. It cannot call requests from other pages or arbitrary connections directly:

```javascript
// ✅ Calls a request defined on this page
const data = await callRequest('fetchProducts');

// ✗ Cannot call requests from other pages
// ✗ Cannot construct raw connection calls
// ✗ Cannot access secrets directly
```

### 7.3 Resolver Function Safety

- Resolver functions are compiled at build time (via `_ref` or `_js`) and stored in `jsMap`
- They execute in the same sandboxed environment as `_js` operators
- They cannot import arbitrary modules or access the filesystem
- They run on the server only — never sent to the client

### 7.4 Auth Integration

The resolver receives `user` from the session. Page-level auth still applies:

```yaml
pages:
  - id: admin_dashboard
    type: PageHeaderMenu
    auth:
      public: false        # Must be authenticated
      roles:
        - admin            # Must have admin role
    ~delta:
      type: Resolver
      connectionIds:
        - adminDb
      resolver:
        _ref: resolvers/admin.js
```

The auth check happens **before** the resolver runs. If the user isn't authorized for the page, they never reach the resolver.

---

## 8. Implementation Phases

### Phase 1: Build-Time Support

**Scope:** Recognize `~delta` config, validate, extract metadata, preserve markers through build.

**Files to create:**
- `packages/build/src/build/buildPages/buildPageResolver.js` — extract + validate resolver config
- `packages/build/src/build/buildPages/collectDeltaKeys.js` — walk config tree for delta markers

**Files to modify:**
- `packages/build/src/build/buildPages/buildPage.js` — call `buildPageResolver` during page build
- `packages/build/src/lowdefySchema.js` — add `~delta` to page block schema (optional, for validation)
- `packages/build/src/build/buildJs/jsMapParser.js` — handle resolver function extraction to server jsMap

**Deliverable:** Pages with `~delta` config build successfully. Resolver metadata is stored in page JSON. Delta markers preserved in output.

### Phase 2: Runtime Resolution Engine

**Scope:** Server-side delta resolution, scoped request execution, delta application.

**Files to create:**
- `packages/api/src/routes/page/resolvePageDeltas.js` — orchestrate resolver execution
- `packages/api/src/routes/page/createScopedCallRequest.js` — security-scoped callRequest
- `packages/api/src/routes/page/applyDeltas.js` — replace markers with values
- `packages/api/src/routes/page/collectDeltaKeys.js` — runtime delta key collection (or reuse build version)

**Files to modify:**
- `packages/api/src/routes/page/getPageConfig.js` — call `resolvePageDeltas` after reading config
- `packages/api/src/context/createApiContext.js` — ensure `urlQuery`, `input`, `global` are available on context

**Deliverable:** Resolver functions execute at request time. Delta markers are replaced with resolved values before page config reaches the client.

### Phase 3: Server Integration

**Scope:** Thread runtime context (`urlQuery`, `input`, `global`) through the server to the resolver.

**Files to modify:**
- `packages/servers/server/pages/[pageId].js` — pass `urlQuery`/`input` from Next.js context
- `packages/servers/server/lib/server/serverSidePropsWrapper.js` — add `urlQuery`/`input` to context
- `packages/servers/server/lib/server/apiWrapper.js` — add `urlQuery`/`input` to API context
- `packages/servers/server-dev/pages/api/page/[pageId].js` — same for dev server
- `packages/servers/server-dev/lib/server/jitPageBuilder.js` — ensure resolver works after JIT build

**Deliverable:** Full end-to-end flow works in both production and dev servers.

### Phase 4: Testing and Edge Cases

**Scope:** Comprehensive test coverage and edge case handling.

**Tests to write:**
- `buildPageResolver.test.js` — validation of resolver config, connectionIds check, delta key collection
- `collectDeltaKeys.test.js` — deeply nested deltas, arrays, deduplication
- `resolvePageDeltas.test.js` — full resolution flow, error handling
- `createScopedCallRequest.test.js` — connection scoping enforcement
- `applyDeltas.test.js` — marker replacement, nested objects, arrays, missing keys
- Build snapshot tests — pages with resolvers build correctly

**Edge cases:**
- Resolver throws an error → return error page or fallback content
- Resolver returns partial keys → unresolved deltas become `null`
- Resolver timeout → configurable timeout with sensible default (e.g., 10s)
- Nested `~delta` inside arrays → correctly replaced
- Same delta key used multiple times → all instances replaced
- Page with resolver but no requests → resolver runs but `callRequest` has nothing to call
- `connectionIds: []` → resolver runs but cannot call any requests (pure computation)

---

## 9. Changes to Existing Packages

### `@lowdefy/build` — Page Build Enhancement

| File | Change | Impact |
|------|--------|--------|
| `buildPage.js` | Call `buildPageResolver` as new build step | Additive — existing pages unaffected |
| `lowdefySchema.js` | Add `~delta` to page schema | Optional — prevents schema validation warnings |
| `jsMapParser.js` | Extract resolver functions to server jsMap | Reuses existing `_js` extraction infrastructure |

### `@lowdefy/api` — Runtime Resolution

| File | Change | Impact |
|------|--------|--------|
| `getPageConfig.js` | Call `resolvePageDeltas` after reading config | Conditional — only for pages with `~resolver` |
| `createApiContext.js` | Add `urlQuery`, `input`, `global` to context | Additive — provides more data on context |
| New files: `resolvePageDeltas.js`, `createScopedCallRequest.js`, `applyDeltas.js` | New runtime resolution logic | No impact on existing code |

### `@lowdefy/server` — Context Threading

| File | Change | Impact |
|------|--------|--------|
| `[pageId].js` | Pass URL query params to context | Additive |
| `serverSidePropsWrapper.js` | Add `urlQuery` to context | Additive |
| `apiWrapper.js` | Add `urlQuery` to context | Additive |

### `@lowdefy/server-dev` — Dev Server Support

| File | Change | Impact |
|------|--------|--------|
| `pages/api/page/[pageId].js` | Pass URL query params through | Additive |

### `@lowdefy/helpers` (Serializer) — No Changes

The `~delta` key passes through serialization as a regular object property. No serializer modifications needed.

### `@lowdefy/engine` — No Changes

The client-side engine receives already-resolved page config. It has no knowledge of resolvers or deltas.

### `@lowdefy/client` — No Changes

The client renders whatever page config it receives. Delta resolution happens server-side before the config reaches the client.

---

## 10. Risk Assessment

| Risk | Severity | Likelihood | Mitigation |
|------|----------|-----------|------------|
| Resolver function errors crash page load | High | Medium | Wrap resolver execution in try/catch. On error, log and return page with `null` delta values (or a dedicated error state) |
| Slow resolvers degrade page load time | Medium | Medium | Add configurable timeout (default 10s). Log slow resolvers. Consider caching resolved values |
| `~delta` key conflicts with future serializer markers | Low | Low | `~delta` is distinct from existing markers. Document as reserved |
| Security: resolver accessing unauthorized connections | High | Low | Runtime enforcement in `createScopedCallRequest` + build-time validation |
| Build validation gaps with `~delta` placeholder values | Medium | Medium | Ensure build validators skip `~delta` objects or treat them as valid placeholders |
| Resolver functions running arbitrary code | Medium | Low | Same sandboxing as `_js` operators. Resolver functions are compiled at build time |
| `urlQuery`/`input` not available in all server contexts | Medium | Medium | Phase 3 specifically addresses threading these through all server paths |

---

## 11. Open Questions

1. **Caching**: Should resolved pages be cached? If the same URL is requested twice with the same query params, should the resolver run again? Options: no cache (simplest), cache by URL+query hash, configurable TTL per page.

2. **Error display**: When a resolver fails, should the page show a generic error, the page with `null` deltas, or a custom error page? The answer may differ between dev (show error details) and production (show graceful fallback).

3. **Streaming/partial resolution**: For pages with many deltas, should the resolver be able to stream partial results? Likely not needed for v1 — full resolution before response is simpler.

4. **Client-side re-resolution**: Can the client trigger a re-resolution (e.g., after navigation with new query params)? Currently, page config is fetched once per navigation. Re-resolution would require a new API call.

5. **Resolver composition**: Can a resolver call another resolver? For v1, no — each page has its own independent resolver.

6. **Delta in requests**: Should `~delta` markers be allowed in request properties? This would allow dynamic request configuration. For v1, deltas are only in the page config (blocks, properties, layout). Request config is static.

7. **`_ref` resolver loading**: Should resolver JS files referenced via `_ref` be loaded from the config directory (like YAML refs) or from a special `resolvers/` directory? Following existing patterns, `_ref` should work the same way it does everywhere — relative to the lowdefy.yaml location.

---

## 12. Future Extensions

- **Delta types beyond `Resolver`**: The `~delta.type` field leaves room for other resolution strategies — e.g., `type: 'A/BTest'` for server-side A/B testing, `type: 'FeatureFlag'` for feature flags
- **Resolver middleware**: A chain of resolver functions that each transform the page
- **Shared resolvers**: A resolver function reused across multiple pages
- **Delta in areas/events**: Extending `~delta` support to dynamically add/remove blocks or events (requires careful security review)
- **Resolver dev tools**: Dev server UI showing resolver execution time, input/output, errors
