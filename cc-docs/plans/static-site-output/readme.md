# Plan: Lowdefy Static Site Output

## Goal

Allow Lowdefy apps to be built as fully static sites (HTML/CSS/JS) that can be deployed to any static hosting (S3, Cloudflare Pages, GitHub Pages, Netlify, Vercel static, etc.) with **zero server** required.

## What Works in Static Mode

| Feature                                                   | Status | Notes                   |
| --------------------------------------------------------- | ------ | ----------------------- |
| Block rendering (display, input, container, list)         | Works  | Pure client-side        |
| State management (setState, getState, setGlobal)          | Works  | Client-side engine      |
| Client operators (\_if, \_get, \_location, \_media, etc.) | Works  | WebParser               |
| Client actions (setState, validate, link, displayMessage) | Works  | No server needed        |
| Menus and navigation                                      | Works  | Pre-built at build time |
| Events (onClick, onChange, onInit, etc.)                  | Works  | Client-side engine      |
| Custom JS operators (\_js client-side)                    | Works  | Bundled at build time   |
| Public assets                                             | Works  | Copied to output        |
| `_build.*` operators                                      | Works  | Evaluated at build time |
| Sentry client logging                                     | Works  | Client-side SDK         |

## What Does NOT Work in Static Mode

| Feature                                        | Reason                                       |
| ---------------------------------------------- | -------------------------------------------- |
| Connections/Requests                           | Require server to execute DB/API queries     |
| Auth (NextAuth)                                | Requires server-side session management      |
| Server operators (\_secret, \_payload, \_hash) | Server-only execution                        |
| API endpoints (routines)                       | Server-side logic                            |
| Error location resolution (keyMap/refMap API)  | Requires server API route                    |
| `_user` operator                               | No auth = no user                            |
| `_request` operator                            | No requests = no response data               |
| `_request_details` operator                    | No requests = no loading/error state         |
| `_api` operator                                | No API endpoints = no response data          |
| **Server-calling actions:**                    |                                              |
| — `Request` action                             | POSTs to `/api/request/{pageId}/{requestId}` |
| — `CallAPI` action                             | POSTs to `/api/endpoints/{endpointId}`       |
| — `Login` action                               | Calls NextAuth `/api/auth/signin`            |
| — `Logout` action                              | Calls NextAuth `/api/auth/signout`           |
| — `UpdateSession` action                       | Calls NextAuth `/api/auth/session`           |

Note: The `Fetch` action uses the browser's native `fetch()` and can call any external URL. It works in static mode for external APIs but not for Lowdefy's own server API routes (which don't exist).

## Architecture

### Current Flow (Server Mode)

```
User visits /pageId
  → Next.js getServerSideProps()
    → Server reads build/pages/pageId/pageId.json
    → Server checks auth, strips auth field
    → Returns as props
  → Client renders page (CSR - SSR is disabled)
```

### New Flow (Static Mode)

```
lowdefy build (with output: static)
  → Lowdefy build produces artifacts as usual
  → Next.js static export (output: 'export')
    → getStaticPaths() returns all page IDs
    → getStaticProps() embeds each page's config as props
    → Produces /out/ with HTML + JS + JSON for each page
  → Deploy /out/ to any static host
```

Key insight: `_app.js` already disables SSR (`dynamic(() => ..., { ssr: false })`), so the actual rendering is already 100% client-side. We just need to change how page configs reach the client — from server-fetched to statically embedded.

---

## Implementation Plan

### Phase 1: New Server Package — `@lowdefy/server-static`

Create a new lightweight server package that uses Next.js static export.

**Location:** `packages/servers/server-static/`

**Why a separate package instead of modifying `@lowdefy/server`:**

- The existing server has deep NextAuth integration, SSE reload, server-side API routes
- Static mode has fundamentally different pages (getStaticProps vs getServerSideProps)
- Clean separation avoids conditional complexity in the existing server
- Users explicitly opt into static mode — different deployment target
- The existing server pattern (`@lowdefy/server` vs `@lowdefy/server-dev`) already establishes this convention

**Key files:**

#### `next.config.js`

```javascript
const withLess = require('next-with-less');
const lowdefyConfig = require('./build/config.json');

module.exports = withLess({
  basePath: lowdefyConfig.basePath,
  reactStrictMode: true,
  output: 'export',
  images: { unoptimized: true }, // Required for static export
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        assert: false,
        buffer: false,
        crypto: false,
        events: false,
        fs: false,
        path: false,
        process: require.resolve('process/browser'),
        util: false,
      };
    }
    return config;
  },
  poweredByHeader: false,
  eslint: { ignoreDuringBuilds: true },
});
```

#### `pages/[pageId].js` — Static version

```javascript
import { createApiContext, getPageConfig, getRootConfig } from '@lowdefy/api';
import config from '../lib/build/config.js';
import fileCache from '../lib/server/fileCache.js';
import Page from '../lib/client/Page.js';

// Build a context for reading build artifacts at build time
function createBuildContext() {
  const context = {
    buildDirectory: path.join(process.cwd(), 'build'),
    config,
    fileCache,
    logger: console,
  };
  createApiContext(context);
  return context;
}

export async function getStaticPaths() {
  // Read menus.json or scan pages/ directory to discover all page IDs
  const context = createBuildContext();
  const menus = await context.readConfigFile('menus.json');
  const pageIds = extractPageIds(menus); // Collect all pageIds from menu links
  return {
    paths: pageIds.map((pageId) => ({ params: { pageId } })),
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const { pageId } = params;
  const context = createBuildContext();
  const [rootConfig, pageConfig] = await Promise.all([
    getRootConfig(context),
    getPageConfig(context, { pageId }),
  ]);
  if (!pageConfig) {
    return { notFound: true };
  }
  return { props: { pageConfig, rootConfig } };
}

export default Page;
```

#### `pages/index.js` — Static home redirect

```javascript
// For static export, we can't use server redirects.
// Option A: Render the home page directly at /
// Option B: Client-side redirect
export async function getStaticProps() {
  const context = createBuildContext();
  const rootConfig = await getRootConfig(context);
  const { home } = rootConfig;
  const pageConfig = await getPageConfig(context, { pageId: home.pageId });
  return { props: { pageConfig, rootConfig } };
}

export default Page;
```

#### `pages/_app.js` — Simplified (no Auth wrapper)

```javascript
function App({ Component, pageProps: { rootConfig, pageConfig } }) {
  const lowdefyRef = useRef({});
  const handleError = useCallback((error) => {
    console.error(error);
  }, []);
  return (
    <ErrorBoundary fullPage onError={handleError}>
      <Component
        auth={{ session: null, signIn: noop, signOut: noop }}
        lowdefy={lowdefyRef.current}
        rootConfig={rootConfig}
        pageConfig={pageConfig}
      />
    </ErrorBoundary>
  );
}
```

#### `lib/client/Page.js` — Same as existing

Reuse `@lowdefy/client` with same blocks/operators/actions imports. Identical to the existing `Page.js`.

#### No API routes

The `pages/api/` directory does not exist in the static server. No request, endpoint, auth, or client-error routes.

#### Page discovery helper

A utility to scan the build output and enumerate all page IDs:

```javascript
// Scan build/pages/ directory for page IDs
// OR parse menus.json to extract all referenced pageIds
// OR read a generated pageList.json from the build step
```

---

### Phase 2: Build Changes — `@lowdefy/build`

#### 2a. New config option: `config.output`

Add `output` to the schema in `lowdefySchema.js` under `config.properties`:

```yaml
# lowdefy.yaml
lowdefy: 4.4.0
config:
  output: static # New option. Default: 'server' (current behavior)
```

Schema addition:

```javascript
output: {
  type: 'string',
  enum: ['server', 'static'],
  description: 'Build output mode. "server" (default) requires a Node.js server. "static" produces a static site.',
  errorMessage: {
    type: 'App "config.output" should be a string.',
    enum: 'App "config.output" should be "server" or "static".',
  },
},
```

#### 2b. Build-time validation for static mode

Add a new build step `validateStaticOutput` (runs after `buildConnections`, `buildAuth`, `buildApi`, `buildPages`):

**Error if the config uses server-only features:**

| Check                                                           | Error Message                                                                                      |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `connections` array is non-empty                                | `Connections are not supported with "output: static". Remove connections or use "output: server".` |
| `auth` is defined                                               | `Authentication is not supported with "output: static".`                                           |
| `api` (endpoints) array is non-empty                            | `API endpoints are not supported with "output: static".`                                           |
| Any page has `requests`                                         | `Requests are not supported with "output: static". Page "{pageId}" has requests.`                  |
| Server operators used (`_secret`, `_payload`, `_hash`, `_user`) | `Server operator "{op}" is not supported with "output: static".`                                   |
| Client operators `_request`, `_request_details`, `_api` used    | `Operator "{op}" is not supported with "output: static" (no server to provide data).`              |
| Action type `Request` used                                      | `Action "Request" is not supported with "output: static". Page "{pageId}", block "{blockId}".`     |
| Action type `CallAPI` used                                      | `Action "CallAPI" is not supported with "output: static".`                                         |
| Action type `Login` used                                        | `Action "Login" is not supported with "output: static".`                                           |
| Action type `Logout` used                                       | `Action "Logout" is not supported with "output: static".`                                          |
| Action type `UpdateSession` used                                | `Action "UpdateSession" is not supported with "output: static".`                                   |

These should be **ConfigError** instances with `configKey` pointing to the offending config line.

#### 2c. Write a page list artifact

Add a new write step `writePageList` that writes `build/pageList.json`:

```json
["home", "about", "contact", "404"]
```

This is used by `getStaticPaths()` to know which pages to generate. Currently page IDs are discovered at runtime from the menus or by listing the `build/pages/` directory, but having an explicit list is cleaner.

#### 2d. Write output mode to config.json

Ensure `config.json` includes `output: 'static'` so `next.config.js` and the server package can read it.

#### 2e. Skip server-only artifacts in static mode

When `output: 'static'`:

- Skip `writeConnections` (no connections)
- Skip `writeRequests` (no requests)
- Skip `writeAuth` (no auth)
- Skip `writeApi` (no endpoints)
- Skip server operator imports (`plugins/operators/server.js`)
- Still write: `writePages`, `writeConfig`, `writeGlobal`, `writeMenus`, `writeApp`, `writePluginImports` (client only), `writeMaps`, `writeJs` (client JS only)

---

### Phase 3: CLI Changes — `@lowdefy/cli`

#### 3a. Read output mode from config

The CLI `build` command needs to use a different server package based on the output mode:

```javascript
// In build.js
async function build({ context }) {
  const outputMode = context.config?.output ?? 'server';
  const packageName = outputMode === 'static' ? '@lowdefy/server-static' : '@lowdefy/server';

  await getServer({ context, packageName, directory });
  // ... rest of build
}
```

**Challenge:** The CLI needs to know the output mode _before_ running the Lowdefy build (which is where config is parsed). Options:

1. **Pre-read lowdefy.yaml** — Parse just `config.output` from the raw YAML before the full build
2. **CLI flag** — `lowdefy build --output static` (simpler, but duplicates config)
3. **Two-pass** — Run Lowdefy build first, read config.json, then select server package

Option 1 is cleanest. Add a utility `readOutputMode({ configDirectory })` that does a quick YAML parse of `lowdefy.yaml` to extract `config.output`.

#### 3b. CLI flag (optional, in addition to config)

```
lowdefy build --output static
```

CLI flag overrides config file. This is useful for CI/CD where you want to build the same config as static without modifying `lowdefy.yaml`.

Add to `program.js`:

```javascript
.option('--output <mode>', 'Output mode: "server" or "static". Overrides config.output.')
```

---

### Phase 4: Client Adjustments — `@lowdefy/client`

#### 4a. No-op callRequest

When running in static mode, `callRequest` should not exist (there's no API route to call). The client already handles this gracefully if there are no requests defined on pages.

Since we validate at build time that no requests exist, no runtime changes are strictly needed. But as defense-in-depth:

```javascript
// In server-static's Page.js setup
const lowdefy = {
  _internal: {
    callRequest: () => {
      throw new Error('Requests are not available in static mode.');
    },
    callAPI: () => {
      throw new Error('API endpoints are not available in static mode.');
    },
  },
};
```

#### 4b. Auth pass-through

The static `_app.js` passes a stub auth object `{ session: null }` since there's no auth provider. The client and engine already handle the case where `session` is null (public pages).

---

### Phase 5: Dev Server — No Changes Needed

The dev server works as-is with `output: static`. The build step controls what artifacts exist — if `output: static`, the build won't produce connections, requests, auth, endpoints, or server operator imports. The dev server's API routes (`/api/request/...`, `/api/endpoints/...`, `/api/auth/...`) still exist in code but are never called because:

- No `Request` actions in pages → nothing POSTs to `/api/request/...`
- No `CallAPI` actions → nothing POSTs to `/api/endpoints/...`
- No `Login`/`Logout` actions → nothing calls `/api/auth/...`
- Build-time validation already rejects all of these

The dev server just builds and serves whatever the config produces. File watching, hot reload, and SSE all work normally. The only difference is less stuff in the build output.

---

## Detailed File Change List

### New Files

| File                                                | Purpose                                       |
| --------------------------------------------------- | --------------------------------------------- |
| `packages/servers/server-static/`                   | New server package                            |
| `packages/servers/server-static/package.json`       | Package manifest                              |
| `packages/servers/server-static/next.config.js`     | Next.js config with `output: 'export'`        |
| `packages/servers/server-static/pages/_app.js`      | Simplified app (no auth)                      |
| `packages/servers/server-static/pages/_document.js` | Same as server (HTML head/body injection)     |
| `packages/servers/server-static/pages/[pageId].js`  | Static page with getStaticPaths/Props         |
| `packages/servers/server-static/pages/index.js`     | Home page (static)                            |
| `packages/servers/server-static/pages/404.js`       | 404 page (same pattern as current)            |
| `packages/servers/server-static/lib/`               | Shared utilities (copied/adapted from server) |
| `packages/build/src/build/validateStaticOutput.js`  | Validation for static mode                    |
| `packages/build/src/build/writePageList.js`         | Write pageList.json artifact                  |

### Modified Files

| File                                       | Change                                              |
| ------------------------------------------ | --------------------------------------------------- |
| `packages/build/src/lowdefySchema.js`      | Add `config.output` property                        |
| `packages/build/src/index.js`              | Add `validateStaticOutput` step, conditional writes |
| `packages/build/src/build/writeConfig.js`  | Include `output` in config.json                     |
| `packages/cli/src/program.js`              | Add `--output` option to build command              |
| `packages/cli/src/commands/build/build.js` | Select server package based on output mode          |
| `packages/cli/src/utils/getServer.js`      | Support `@lowdefy/server-static` package            |

---

## Deployment Examples

### GitHub Pages

```yaml
# lowdefy.yaml
config:
  output: static
  basePath: /my-repo # GitHub Pages uses repo name as base path
```

```bash
lowdefy build
# Output in .lowdefy/server/out/
# Deploy .lowdefy/server/out/ to gh-pages branch
```

### Cloudflare Pages / Netlify / Vercel (static)

```bash
lowdefy build
# Point build output to .lowdefy/server/out/
```

### S3 + CloudFront

```bash
lowdefy build
aws s3 sync .lowdefy/server/out/ s3://my-bucket/
```

---

## Open Questions

1. **SPA routing vs multi-page:** Next.js static export generates an HTML file per page. Client-side navigation uses JS routing. But direct URL access needs either:

   - A rewrite rule (e.g., `/*` → `/index.html`) — common SPA pattern
   - OR individual HTML files per page (Next.js default with static export) — works out of the box

   Next.js `output: 'export'` produces individual HTML files, so direct URL access works. Client-side navigation uses `next/link`. This should work out of the box.

2. **`trailingSlash`:** Some static hosts require trailing slashes. Should we expose this as a config option? Next.js supports `trailingSlash: true` in config.

3. **Error display in static mode:** Without the keyMap/refMap API route, client-side errors can't resolve to file:line. Options:

   - Embed keyMap/refMap in the client bundle (increases size but enables error tracing)
   - Show errors without file location (simpler, acceptable for static sites)
   - Only embed in dev builds

4. **Package sharing:** `server-static` will share many files with `server` (Page.js, \_document.js, lib/build/\*, etc.). Should we extract shared code to a `@lowdefy/server-utils` package, or just duplicate the few files needed?

5. **Server-only operators in visible/properties:** The build validation catches `_secret`, `_payload` etc. But what about `_request` operator references (which reference data from requests that don't exist)? Need to validate these too.

---

## Implementation Order

1. **Schema + build validation** — Add `config.output` to schema, add `validateStaticOutput` build step. This is low-risk, testable independently, and gives users early feedback.

2. **`server-static` package** — Create the new server package. Start by copying from `server/` and removing server-only code.

3. **CLI integration** — Wire up `--output` flag and server package selection.

4. **Build conditional writes** — Skip server-only artifacts when `output: 'static'`.

5. **Testing** — Create a test Lowdefy app with `output: static`, build it, verify the output.

6. **Documentation** — Update user-facing docs with static mode guide.

---

## Non-Goals (Future Work)

- **Hybrid mode** (some pages static, some server-rendered) — Out of scope for v1
- **ISR (Incremental Static Regeneration)** — Requires a server, contradicts the goal
- **Static data fetching at build time** — e.g., fetch from API during build and embed as static data. Interesting but separate feature.
