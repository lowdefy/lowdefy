# @lowdefy/server-dev

Development server with hot reload and file watching.

## Overview

The development server provides:
- Automatic rebuilding on config changes
- Hot reload without full page refresh
- Extended plugin set for development
- Environment file watching
- Process management

## Key Differences from Production

| Feature | Development | Production |
|---------|-------------|------------|
| Minification | Disabled | Enabled |
| Compression | Disabled | Enabled |
| Source maps | Available | Disabled |
| File watching | 3 watchers | None |
| Hot reload | SSE-based | None |
| Plugins | Extended | Core only |

## Additional Dependencies

Beyond production server:
- `@lowdefy/build` - Build system
- `chokidar` (3.5.3) - File watcher
- `dotenv` (16.3.1) - Env loading
- `opener` (1.5.2) - Browser opener
- `swr` (2.2.4) - Data fetching

Additional block packages:
- `@lowdefy/blocks-aggrid`
- `@lowdefy/blocks-color-selectors`
- `@lowdefy/blocks-echarts`
- `@lowdefy/blocks-markdown`
- `@lowdefy/blocks-qr`

Additional operators:
- `@lowdefy/operators-change-case`
- `@lowdefy/operators-diff`
- `@lowdefy/operators-moment`
- `@lowdefy/operators-mql`
- `@lowdefy/operators-nunjucks`
- `@lowdefy/operators-uuid`
- `@lowdefy/operators-yaml`

## Scripts

```json
{
  "build": "cp package.json package.original.json",
  "start": "node manager/run.mjs"
}
```

## Directory Structure

```
server-dev/
├── lib/
│   ├── server/               # Server utilities
│   │   ├── jitPageBuilder.js # JIT page build on request
│   │   ├── pageCache.mjs     # PageCache class (shared by manager and server)
│   │   └── log/
│   │       └── createLogger.js
│   └── client/               # Client utilities (extended)
│       ├── App.js            # Dev app wrapper
│       ├── Page.js           # Page renderer (merges jsMap)
│       ├── Reload.js         # Hot reload component
│       ├── RestartingPage.js
│       └── Utils/
│           ├── usePageConfig.js       # SWR hook with versioned keys
│           ├── useRootConfig.js
│           ├── useMutateCache.js      # reloadVersion counter
│           └── waitForRestartedServer.js
├── manager/
│   ├── run.mjs               # Entry point
│   ├── getContext.mjs         # Context factory (stores JIT build state)
│   ├── processes/
│   │   ├── initialBuild.mjs
│   │   ├── lowdefyBuild.mjs  # Calls shallowBuild, captures result
│   │   ├── installPlugins.mjs
│   │   ├── nextBuild.mjs
│   │   ├── startServer.mjs
│   │   ├── restartServer.mjs
│   │   ├── shutdownServer.mjs
│   │   ├── readDotEnv.mjs
│   │   └── reloadClients.mjs
│   └── watchers/
│       ├── startWatchers.mjs
│       ├── lowdefyBuildWatcher.mjs   # Targeted invalidation logic
│       ├── envWatcher.mjs
│       └── nextBuildWatcher.mjs
├── pages/
│   └── api/
│       ├── reload.js         # SSE endpoint
│       ├── ping.js           # Health check
│       ├── page/[pageId].js  # Page API (triggers JIT build)
│       ├── js/[env].js       # Serves clientJsMap.js or serverJsMap.js
│       ├── root.js
│       └── dev-tools.js
├── next.config.js
└── package.json
```

## Manager System

### Entry Point

**File:** `manager/run.mjs`

```javascript
async function run() {
  const context = await getContext();

  // Initial build
  await context.initialBuild();

  // Start watchers (non-blocking)
  context.startWatchers();

  // Start server
  await context.startServer();

  // Open browser
  if (process.env.LOWDEFY_OPEN_BROWSER !== 'false') {
    opener(`http://localhost:${context.options.port}`);
  }
}
```

### Context

**File:** `manager/getContext.mjs`

```javascript
const context = {
  bin: { next: nextBin },
  directories: { build, config, server },
  logger,
  options: { port, refResolver, watch: [], watchIgnore: [] },
  version,
  packageManagerCmd,

  // JIT build state
  pageCache: new PageCache(),    // Manager's PageCache instance
  pageRegistry: null,            // Set after each skeleton build
  fileDependencyMap: null,       // Set after each skeleton build
  buildContext: null,            // Build context from shallowBuild

  // Bound functions
  initialBuild,
  installPlugins,
  lowdefyBuild,                  // Wrapped to capture build result
  nextBuild,
  readDotEnv,
  reloadClients,
  restartServer,
  shutdownServer,
  startWatchers
};
```

## JIT (Just-In-Time) Build System

The dev server uses a two-phase build strategy to minimize rebuild times:

1. **Skeleton build** (`shallowBuild`): Resolves all `_ref` operators except page content (blocks, areas, events, requests, layout). Page content is left as `_shallow` markers.
2. **JIT page build** (`buildPageJit`): When a page is requested, resolves that page's `_shallow` markers, runs build steps, and writes page artifacts.

### Two-Process Architecture

The manager process and the Next.js server run as **separate processes** with no shared memory:

```
Manager Process                    Next.js Server Process
┌────────────────────┐            ┌────────────────────┐
│ PageCache instance │            │ PageCache instance  │
│ fileDependencyMap  │            │ (jitPageBuilder.js) │
│ pageRegistry       │            │                     │
│ buildContext       │            │ cachedRegistry      │
│                    │            │ cachedBuildContext   │
│ Watcher → build    │            │ API → buildPageJit  │
└────────────────────┘            └────────────────────┘
         │                                  ↑
         │  invalidatePages.json            │
         └──── (file on disk) ─────────────→┘
```

Cross-process communication uses files in the build directory:
- `pageRegistry.json`: Page metadata + raw content for JIT resolution
- `refMap.json`, `keyMap.json`, `jsMap.json`: Shared build state
- `invalidatePages.json`: List of page IDs invalidated by the watcher

### Skeleton Build Flow

**File:** `manager/processes/lowdefyBuild.mjs`

```javascript
function lowdefyBuild({ directories, logger, options, pageCache }) {
  return async () => {
    const customTypesMap = await createCustomPluginTypesMap({ directories, logger });
    await pageCache.acquireSkeletonLock();
    try {
      const result = await shallowBuild({ customTypesMap, directories, logger, ... });
      return result; // { components, pageRegistry, fileDependencyMap, context }
    } finally {
      pageCache.invalidateAll();
      pageCache.releaseSkeletonLock();
    }
  };
}
```

The manager wraps `lowdefyBuild` to capture and store the result on the manager context:

```javascript
// In getContext.mjs
context.lowdefyBuild = async () => {
  const result = await buildFn();
  if (result) {
    context.pageRegistry = result.pageRegistry;
    context.fileDependencyMap = result.fileDependencyMap;
    context.buildContext = result.context;
  }
};
```

### JIT Page Build Flow

**File:** `lib/server/jitPageBuilder.js`

When a page API request arrives (`/api/page/[pageId]`):

1. `checkPageInvalidations()` reads `invalidatePages.json` (with mtime caching)
2. `loadPageRegistry()` reads `pageRegistry.json` (with mtime caching)
3. `pageCache.isCompiled(pageId)` checks if page was already built
4. If not compiled, acquires build lock and calls `buildPageJit()`
5. `getBuildContext()` creates/caches a build context with restored refMap/keyMap/jsMap

```javascript
async function buildPageIfNeeded({ pageId, buildDirectory, configDirectory }) {
  checkPageInvalidations(buildDirectory);
  const registry = loadPageRegistry(buildDirectory);
  if (!registry?.[pageId]) return false;

  if (pageCache.isCompiled(pageId)) return true;

  const shouldBuild = await pageCache.acquireBuildLock(pageId);
  if (!shouldBuild) return true; // Another request completed it

  try {
    const context = getBuildContext(buildDirectory, configDirectory);
    await buildPageJit({ pageId, pageRegistry: registry, context });
    pageCache.markCompiled(pageId);
    return true;
  } finally {
    pageCache.releaseBuildLock(pageId);
  }
}
```

### PageCache

**File:** `lib/server/pageCache.mjs`

Tracks which pages have been JIT-compiled and provides concurrency control:

| Method | Purpose |
|--------|---------|
| `isCompiled(pageId)` | Check if page has been built |
| `markCompiled(pageId)` | Mark page as built |
| `acquireBuildLock(pageId)` | Prevent concurrent builds of same page |
| `releaseBuildLock(pageId)` | Release build lock |
| `acquireSkeletonLock()` | Block page builds during skeleton rebuild |
| `releaseSkeletonLock()` | Allow page builds after skeleton rebuild |
| `invalidateAll()` | Clear all compiled pages (skeleton rebuild) |
| `invalidatePages(pageIds)` | Clear specific pages (targeted invalidation) |
| `invalidateByFiles(files, depMap)` | Clear pages affected by changed files |

Two separate instances exist: one in the manager process (for watcher invalidation) and one in the Next.js server (for JIT build tracking).

### File Dependency Map

**File:** `packages/build/src/build/createFileDependencyMap.js`

Maps config file paths → Set of page IDs that depend on them. Used for targeted invalidation.

Sources of dependencies:
1. **Page source file**: via `pageEntry.refId` → `refMap[refId].path`
2. **Child `_ref` paths**: Collected from `_shallow` markers in raw page content

### Targeted vs Full Rebuild

**File:** `manager/watchers/lowdefyBuildWatcher.mjs`

When a file changes, the watcher decides:

| Condition | Action |
|-----------|--------|
| `lowdefy.yaml` changed | Full skeleton rebuild |
| File not in dependency map and not in `pages/` | Full skeleton rebuild |
| File in dependency map | Targeted: invalidate affected pages, write `invalidatePages.json` |
| No affected pages found | Full skeleton rebuild (safety fallback) |

### Cross-Process Cache Invalidation

The manager and server run in separate processes with separate `PageCache` instances. When a file change only affects specific pages:

1. Manager's watcher calls `pageCache.invalidateByFiles()` on its own cache
2. Manager writes `invalidatePages.json` with affected page IDs
3. Manager calls `reloadClients()` (SSE event)
4. On next page request, server's `checkPageInvalidations()` reads the file
5. Server's `pageCache.invalidatePages()` clears affected pages
6. Server's `cachedBuildContext` is set to `null` to refresh maps

## Build Processes

### Initial Build

**File:** `manager/processes/initialBuild.mjs`

```javascript
async function initialBuild(context) {
  await context.readDotEnv();
  await context.lowdefyBuild();
  await context.installPlugins();
  await context.nextBuild();
}
```
```

### Install Plugins

**File:** `manager/processes/installPlugins.mjs`

```javascript
async function installPlugins(context) {
  await spawnProcess({
    command: context.packageManagerCmd,
    args: ['install', '--no-frozen-lockfile'],
    cwd: context.directories.server,
    logger: context.logger
  });
}
```

## File Watchers

### Watcher Orchestration

**File:** `manager/watchers/startWatchers.mjs`

```javascript
function startWatchers(context) {
  // Config changes → soft reload
  lowdefyBuildWatcher(context);

  // .env changes → hard restart
  envWatcher(context);

  // Plugin changes → rebuild + restart
  nextBuildWatcher(context);
}
```

### Lowdefy Build Watcher

**File:** `manager/watchers/lowdefyBuildWatcher.mjs`

Watches config directory for changes. Decides between targeted invalidation (fast) and full skeleton rebuild based on file dependency map:

```javascript
const callback = async (filePaths) => {
  const changedFiles = filePaths.map(f => path.relative(configDir, f));

  // Check for version change in lowdefy.yaml
  if (lowdefyYamlModified) { /* exit if version changed */ }

  const isSkeletonChange = lowdefyYamlModified ||
    changedFiles.some(f => !fileDependencyMap?.has(f) && !f.startsWith('pages/'));

  if (isSkeletonChange) {
    await context.lowdefyBuild();          // Full rebuild
  } else {
    const affectedPages = pageCache.invalidateByFiles(changedFiles, fileDependencyMap);
    if (affectedPages.size > 0) {
      fs.writeFileSync(invalidationPath, JSON.stringify([...affectedPages]));
    } else {
      await context.lowdefyBuild();        // Fallback to full rebuild
    }
  }
  context.reloadClients();
};
```

### Environment Watcher

**File:** `manager/watchers/envWatcher.mjs`

Watches `.env` file:

```javascript
const watcher = chokidar.watch('.env', { ignoreInitial: true });

watcher.on('all', async () => {
  await context.readDotEnv();
  await context.restartServer();
});
```

### Next Build Watcher

**File:** `manager/watchers/nextBuildWatcher.mjs`

Watches build artifacts:

```javascript
const watcher = chokidar.watch([
  'build/plugins/**',
  'build/config.json',
  'server/package.json'
], { ignoreInitial: true });

watcher.on('all', async (event, filePath) => {
  if (filePath.includes('package.json')) {
    await context.installPlugins();
  }
  await context.nextBuild();
  await context.restartServer();
});
```

## Hot Reload System

### Server-Side (SSE)

**File:** `pages/api/reload.js`

```javascript
export default function handler(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  const watcher = chokidar.watch('./build/reload');

  watcher.on('change', () => {
    res.write('data: reload\n\n');
  });

  req.on('close', () => {
    watcher.close();
  });
}
```

### Client-Side

**File:** `lib/client/Reload.js`

```javascript
function Reload({ children, lowdefy, resetContext }) {
  const [restarting, setRestarting] = useState(false);

  useEffect(() => {
    const eventSource = new EventSource('/api/reload');

    eventSource.onmessage = (event) => {
      if (event.data === 'reload') {
        // Soft reload
        mutateCache();
        resetContext();
      }
    };

    eventSource.onerror = () => {
      // Server restarting
      setRestarting(true);
      waitForRestartedServer().then(() => {
        window.location.reload();
      });
    };

    return () => eventSource.close();
  }, []);

  if (restarting) {
    return <RestartingPage />;
  }

  return children;
}
```

### Reload Trigger

**File:** `manager/processes/reloadClients.mjs`

```javascript
async function reloadClients(context) {
  const reloadFile = path.join(context.directories.build, 'reload');
  fs.writeFileSync(reloadFile, Date.now().toString());
}
```

## Dev-Specific API Routes

### Page Config (JIT Build Trigger)

**File:** `pages/api/page/[pageId].js`

The page API endpoint triggers JIT page building before returning page config:

```javascript
export default apiWrapper(async ({ context, req, res }) => {
  const { pageId } = req.query;

  // Trigger JIT build if page not yet compiled
  const built = await buildPageIfNeeded({
    pageId,
    buildDirectory: context.directories.build,
    configDirectory: context.directories.config,
  });

  if (!built) {
    return res.status(404).json({ message: 'Page not found' });
  }

  // Read and return built page config
  const pageConfig = await getPageConfig(context, { pageId });
  return res.json(pageConfig);
});
```

### JS Map

**File:** `pages/api/js/[env].js`

Serves the client or server JS map as a JavaScript module. The client fetches this after a JIT build to get newly extracted `_js` function entries.

### Health Check

**File:** `pages/api/ping.js`

```javascript
export default function handler(req, res) {
  res.status(200).json({ status: 'ok' });
}
```

## Client Components

### App Wrapper

**File:** `lib/client/App.js`

```javascript
function App({ children }) {
  const { data: rootConfig } = useRootConfig();

  return (
    <Reload lowdefy={lowdefy} resetContext={resetContext}>
      <Auth auth={auth}>
        {children}
      </Auth>
    </Reload>
  );
}
```

### SWR Hooks

**File:** `lib/client/Utils/usePageConfig.js`

Uses SWR with a versioned key to support cache busting on hot reload:

```javascript
import { getReloadVersion } from './useMutateCache.js';

async function fetchPageConfig(url) {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
  const data = await res.json();
  // After page config fetch (which triggers JIT build), fetch JS entries
  const basePath = url.replace(/\/api\/page\/.*$/, '');
  const jsEntries = await fetchJsEntries(basePath);
  data._jsEntries = jsEntries;
  return data;
}

function usePageConfig(pageId, basePath) {
  const url = `${basePath}/api/page/${pageId}`;
  // reloadVersion changes on hot reload, orphaning old SWR cache entries
  const { data } = useSWR(
    [url, getReloadVersion()],
    ([fetchUrl]) => fetchPageConfig(fetchUrl),
    { suspense: true }
  );
  return { data };
}
```

**File:** `lib/client/Utils/useMutateCache.js`

Manages cache busting via a `reloadVersion` counter:

```javascript
let reloadVersion = 0;

function getReloadVersion() { return reloadVersion; }

function useMutateCache(basePath) {
  const { mutate } = useSWRConfig();
  return () => {
    reloadVersion += 1;    // Orphans old SWR keys
    return mutate((key) => key === `${basePath}/api/root`);  // Only revalidate root
  };
}
```

**Why versioned keys instead of cache clearing:**
- Clearing SWR entries to `undefined` causes React Suspense on currently mounted components
- This creates a three-request waterfall (/api/root → /api/page → /api/js) with visible delay
- Versioned keys orphan old entries without triggering Suspense, and new keys force fresh fetches

**Why jsMap is fetched sequentially after page config:**
- Page config fetch triggers JIT build which may extract new `_js` functions
- If jsMap is fetched in parallel, it returns stale data missing the new JS entries
- The `_jsEntries` are merged with the static `jsMap` in `Page.js`

## Next.js Configuration

**File:** `next.config.js`

```javascript
const nextConfig = {
  // Disable optimizations for faster dev builds
  swcMinify: false,
  compress: false,
  outputFileTracing: false,
  generateEtags: false,
  optimizeFonts: false,

  webpack: (config) => {
    // Same browser fallbacks as production
    return config;
  }
};
```

## Key Files

| File | Purpose |
|------|---------|
| `manager/run.mjs` | Entry point |
| `manager/getContext.mjs` | Context factory with JIT build state |
| `manager/processes/lowdefyBuild.mjs` | Calls `shallowBuild`, captures result |
| `manager/watchers/lowdefyBuildWatcher.mjs` | Targeted invalidation or full rebuild |
| `lib/server/jitPageBuilder.js` | JIT page build on API request |
| `lib/server/pageCache.mjs` | PageCache class (compiled tracking, locks) |
| `pages/api/page/[pageId].js` | Page API (triggers JIT build) |
| `pages/api/js/[env].js` | Serves JS map as module |
| `pages/api/reload.js` | SSE endpoint |
| `lib/client/Reload.js` | Hot reload component |
| `lib/client/App.js` | Dev app wrapper |
| `lib/client/Page.js` | Page renderer (merges jsMap) |
| `lib/client/Utils/usePageConfig.js` | SWR hook with versioned cache keys |
| `lib/client/Utils/useMutateCache.js` | `reloadVersion` counter for cache busting |

## Reload Types

| Trigger | Watcher | Action | Result |
|---------|---------|--------|--------|
| Page-level config change | lowdefyBuildWatcher | Targeted invalidation + SSE | Soft reload (page rebuilt JIT) |
| Skeleton-level config change | lowdefyBuildWatcher | Full skeleton rebuild + SSE | Soft reload (all pages invalidated) |
| .env change | envWatcher | Read env | Hard restart |
| Plugin change | nextBuildWatcher | Next build | Hard restart |
| package.json | nextBuildWatcher | Install + build | Hard restart |

## Mock User for Testing

The dev server supports mock users for testing, bypassing the login flow.

### Configuration

**Environment Variable (takes precedence):**
```bash
LOWDEFY_DEV_USER='{"sub":"test-user","email":"test@example.com","roles":["admin"]}'
```

**Config File:**
```yaml
auth:
  dev:
    mockUser:
      sub: test-user
      email: test@example.com
```

### Key Files

| File | Purpose |
|------|---------|
| `lib/server/auth/getMockSession.js` | Core mock session logic |
| `lib/server/auth/checkMockUserWarning.js` | Startup warning |
| `lib/server/auth/getServerSession.js` | Server-side integration |
| `pages/api/auth/[...nextauth].js` | Client-side integration |

See [Auth System Architecture](../architecture/auth-system.md#mock-user-for-testing-dev-server-only) for full details.

## Plugin Strategy

The dev server uses a different plugin strategy than production to optimize for fast iteration.

### Pre-installed Packages

The dev server's `package.json` includes a broad set of default plugin packages (blocks, operators, actions, connections) as dependencies. This means:
- No code build (Next.js rebuild) is needed when a user first uses a new block or action type
- Bundle size is not a concern in development — all installed types are available immediately
- The skeleton build reads the server's `package.json` to determine installed packages and includes all types from those packages in the generated import files

### JIT Build and Type Counting

During development, the skeleton build (`shallowBuild`) stops at page content boundaries (`pages.*.blocks`, `pages.*.events`, etc.) and leaves `_shallow` markers. Page content is resolved just-in-time when requested. This means page-level types (actions, blocks, operators used inside pages) are NOT counted during the skeleton build.

To compensate, `shallowBuild` adds all types from installed packages to `components.types` after `buildTypes` runs. This ensures the generated plugin import files include all available types, not just those counted from non-page components (like connections and API config).

### New Plugin Detection

If a user configures a plugin package that isn't installed in the dev server:
1. The build detects the new package via `customTypesMap`
2. `installPlugins` runs `pnpm install` to add the package
3. A Next.js rebuild is triggered to bundle the new imports
4. The server restarts with the new plugin available

### Production Comparison

| Aspect | Development | Production |
|--------|-------------|------------|
| Type counting | Only non-page types counted; all installed types included | All pages built; exact type usage counted |
| Bundle size | All installed types bundled (larger) | Only used types bundled (tree-shaken) |
| Plugin availability | Immediate for pre-installed packages | Only what's declared and used |
| New plugin | Install + rebuild triggered automatically | Must be declared in `lowdefy.yaml` |

### Key Files

| File | Purpose |
|------|---------|
| `packages/build/src/build/shallowBuild.js` | `getInstalledPackages()` reads server `package.json`; `addInstalledTypes()` pre-seeds types |
| `packages/build/src/build/buildImports/buildImportsDev.js` | Generates imports from `components.types` |
| `packages/servers/server-dev/manager/processes/installPlugins.mjs` | Installs new plugin packages |
| `packages/servers/server-dev/manager/watchers/nextBuildWatcher.mjs` | Triggers rebuild on plugin changes |

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `LOWDEFY_OPEN_BROWSER` | Auto-open browser (default: true) |
| `LOWDEFY_DIRECTORY_CONFIG` | Config directory path |
| `PORT` | Server port (default: 3000) |
| `LOWDEFY_BUILD_REF_RESOLVER` | Custom ref resolver |
| `LOWDEFY_DEV_USER` | Mock user JSON for testing |
