# @lowdefy/server-dev

Development server with hot reload and file watching.

## Overview

The development server provides:

- Automatic rebuilding on config changes
- Hot reload without full page refresh
- Vite HMR for client plugin code and CSS
- Extended plugin set for development
- Environment file watching
- Process management
- In-browser ErrorBar for build errors and warnings

## Key Differences from Production

| Feature       | Development                    | Production                      |
| ------------- | ------------------------------ | ------------------------------- |
| Client assets | Vite dev server modules + HMR  | Pre-built `dist/client/` bundle |
| Compression   | Disabled                       | Enabled                         |
| Page builds   | JIT per request                | All pages at build time         |
| File watching | 4 watchers                     | None                            |
| Hot reload    | SSE-based + Vite HMR           | None                            |
| Plugins       | Extended                       | Core only                       |

## Additional Dependencies

Beyond production server:

- `@lowdefy/build` - Build system
- `@lowdefy/engine` - State engine
- `@hono/vite-dev-server` (0.26.0) - Mounts the Hono app inside Vite
- `chokidar` (3.5.3) - File watcher
- `dotenv` (16.3.1) - Env loading
- `opener` (1.5.2) - Browser opener
- `swr` (2.2.4) - Data fetching
- `yaml`, `yargs` - Config parsing, CLI args

The block packages match production (`@lowdefy/blocks-antd`, `-antd-x`, `-aggrid`, `-basic`, `-echarts`, `-loaders`, `-markdown`, `-tiptap`).

Additional operators and connections:

- `@lowdefy/operators-change-case`
- `@lowdefy/operators-diff`
- `@lowdefy/operators-dayjs`
- `@lowdefy/operators-mql`
- `@lowdefy/operators-nunjucks`
- `@lowdefy/operators-uuid`
- `@lowdefy/operators-yaml`
- `@lowdefy/connection-axios-http`

### CRITICAL: Singleton Packages in Local Dev

**`antd` and `@ant-design/cssinjs` use React context for cross-component coordination.** Multiple instances break CSS-in-JS context sharing between `ConfigProvider`, `StyleProvider`, and `useDarkMode` — dark mode and theming silently fail (only some antd components respond to theme changes, no console errors).

Both `server` and `server-dev` have `antd` and `@ant-design/cssinjs` as direct dependencies. This is correct — the published packages need them for pnpm strict mode resolution.

**The singleton risk only exists in the local monorepo dev setup** (`scripts/dev.mjs`), where `rewriteDeps.mjs` rewrites `@lowdefy/*` deps to `link:` paths. Without overrides, pnpm would install a separate npm copy of antd for the dev server while linked `@lowdefy/client` uses the monorepo's copy — two instances.

**Fix:** `rewriteDeps.mjs` has a `SINGLETON_PACKAGES` list (`antd`, `@ant-design/cssinjs`) that adds `pnpm.overrides` entries pointing to the monorepo's `node_modules/` copies. This forces a single instance across the dev server and all linked packages.

**If you add a new package that uses React context across components** (like a UI library), add it to `SINGLETON_PACKAGES` in `scripts/lib/rewriteDeps.mjs`.

**Symptoms of duplicate instances:** Dark mode toggle only partially works — some antd components (like Menu) respond while the rest of the page stays in light mode. No errors in console.

`resolve.dedupe: ['react', 'react-dom']` in `vite.config.js` handles the same problem for React itself — linked plugin packages must share one React instance.

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
├── src/                      # Hono app (run inside Vite via @hono/vite-dev-server)
│   ├── app.js                # Route mounting, middleware, static, onError
│   ├── html/
│   │   └── renderDevPage.js  # Config-free HTML shell
│   ├── middleware/
│   │   ├── apiContext.js     # Per-request context (replaces apiWrapper)
│   │   └── errorHandler.js   # app.onError — serialized error contract
│   ├── routes/               # reload, ping, jitPage, jsEnv, iconsDynamic,
│   │                         # root, request, endpoints, auth, agent,
│   │                         # clientError, usage, devTools
│   └── lib/                  # getPathSegments, safeScriptJson, serveBuildJs
├── client/                   # Vite client entry (served as modules with HMR)
│   ├── main.jsx              # CSS imports, router, HMR-stable React root
│   ├── App.jsx               # Providers (StyleProvider, XProvider, Auth, ErrorBar)
│   ├── Routing.jsx           # Page resolution from the custom router
│   ├── Page.jsx              # Page renderer (merges jsMap, dynamic icons)
│   └── Reload.jsx            # SSE hot reload listener
├── lib/
│   ├── build/                # Build artifact loaders (fs read + deserialize)
│   ├── server/
│   │   ├── jitPageBuilder.js # JIT page build on request
│   │   ├── pageCache.mjs     # PageCache class (compiled tracking, locks)
│   │   ├── auth/             # getAuthConfig, session, getMockSession
│   │   └── log/              # createLogger, createHandleError, logRequest
│   └── client/               # Dev pages + utilities
│       ├── BuildErrorPage.jsx / BuildingPage.jsx / InstallingPluginsPage.jsx
│       ├── RestartingPage.jsx / ErrorBar.jsx / setPageId.js
│       ├── auth/             # Auth.jsx, AuthConfigured.jsx (@hono/auth-js/react)
│       └── utils/
│           ├── usePageConfig.js       # SWR hook with versioned keys
│           ├── useRootConfig.js
│           ├── useMutateCache.js      # reloadVersion counter
│           └── waitForRestartedServer.js
├── manager/
│   ├── run.mjs               # Entry point (signal handling, orchestration)
│   ├── getContext.mjs        # Context factory (stores JIT build state)
│   ├── processes/
│   │   ├── initialBuild.mjs
│   │   ├── lowdefyBuild.mjs  # Calls shallowBuild, captures result
│   │   ├── installPlugins.mjs
│   │   ├── checkMockUserWarning.mjs
│   │   ├── startServer.mjs   # Spawns the Vite child process
│   │   ├── restartServer.mjs
│   │   ├── shutdownServer.mjs
│   │   ├── readDotEnv.mjs
│   │   └── reloadClients.mjs
│   ├── utils/
│   │   ├── getViteBin.mjs    # Resolves the vite bin path
│   │   ├── loadSkeletonSourceFiles.mjs  # Read skeletonSourceFiles.json as Set
│   │   └── updatePageTailwindCss.mjs    # Refresh Tailwind candidates on page edits
│   └── watchers/
│       ├── lowdefyBuildWatcher.mjs   # Skeleton vs page change classification
│       ├── moduleBuildWatcher.mjs    # Local module file change classification
│       ├── envWatcher.mjs
│       └── serverArtifactWatcher.mjs # Server-read artifacts → restart
├── vite.config.js
├── postcss.config.cjs        # @tailwindcss/postcss (read by Vite)
└── package.json
```

## Process Topology (Vite + Hono)

The manager spawns **one child process running Vite** (`node <vite-bin> --port N --strictPort`). Inside that process:

- **Vite owns HTTP.** It serves `/client/*`, `/lib/*`, `/build/*`, `/@*` (Vite internals), and `/node_modules/*` as ES modules with HMR — see the `exclude` list in `vite.config.js`.
- **Everything else routes to the Hono app** (`src/app.js`), mounted via the `@hono/vite-dev-server` plugin with `entry: './src/app.js'`.

```
Manager Process                     Vite Child Process
┌─────────────────────┐            ┌──────────────────────────────┐
│ initial build       │            │ Vite dev server (HTTP)        │
│ watchers            │  spawn     │ ├── /client/* → modules + HMR │
│ restart/shutdown    │ ─────────→ │ └── everything else →         │
│ SIGINT/SIGTERM      │            │     Hono app (src/app.js)     │
└─────────────────────┘            └──────────────────────────────┘
```

**The child-process model is load-bearing.** The Hono app imports server-read build artifacts (`build/plugins/connections.js`, `build/plugins/operators/server.js`, `build/config.json`, ...) through Node's ESM loader, and Node's module cache cannot be invalidated. Restarting the child is the only way to pick up changes to those artifacts — that is exactly what `serverArtifactWatcher` does. Client-side artifacts never need a restart: Vite serves them as modules and hot-replaces them.

Because `@hono/vite-dev-server` SSR-loads the server module graph through Vite, intentionally-dynamic imports in `@lowdefy/build` (e.g. `buildRefs/getUserJavascriptFunction.js`, `writePluginImports/write*SchemaMap.js`) carry `/* @vite-ignore */` so Vite does not try to statically resolve them.

## Manager System

### Entry Point

**File:** `manager/run.mjs`

```javascript
const context = await getContext();

// Shut the Vite child down on direct signals — a targeted SIGTERM would
// otherwise orphan the child.
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    context.shutdownServer();
    process.exit(0);
  });
}

await context.initialBuild();
context.startWatchers(); // Not awaited — chokidar's ready event is unreliable
startServer(context);
if (process.env.LOWDEFY_SERVER_DEV_OPEN_BROWSER === 'true') {
  opener(`http://localhost:${context.options.port}`);
}
```

### Context

**File:** `manager/getContext.mjs`

```javascript
const context = {
  bin: { vite: getViteBin() }, // Resolved from vite/package.json bin field
  directories: { build, config, server },
  logger, // createNodeLogger from @lowdefy/logger/node
  options: { port, refResolver, watch: [], watchIgnore: [] },
  version,
  packageManagerCmd, // pnpm / pnpm.cmd

  // JIT build state
  pageRegistry: null, // Set after each skeleton build
  buildContext: null, // Build context from shallowBuild

  // Bound functions
  checkMockUserWarning,
  initialBuild,
  installPlugins,
  lowdefyBuild, // Wrapped to capture build result
  readDotEnv,
  reloadClients,
  restartServer,
  shutdownServer,
  startWatchers,
};
```

## JIT (Just-In-Time) Build System

The dev server uses a two-phase build strategy to minimize rebuild times:

1. **Skeleton build** (`shallowBuild`): Resolves all `_ref` operators except page content (blocks, areas, events, requests, layout). Page content is left as `_shallow` markers.
2. **JIT page build** (`buildPageJit`): When a page is requested, resolves that page's `_shallow` markers, runs build steps, and writes page artifacts.

### Two-Process Architecture

The manager process and the Vite child (Hono app) run as **separate processes** with no shared memory:

```
Manager Process                    Vite Child Process
┌────────────────────┐            ┌─────────────────────────┐
│ pageRegistry       │            │ jitPageBuilder.js        │
│ buildContext       │            │   pageCache (PageCache)  │
│                    │            │   cachedRegistry         │
│ Watcher → build    │            │   cachedBuildContext     │
│                    │            │   route → buildPageJit   │
└────────────────────┘            └─────────────────────────┘
         │                                  ↑
         │  invalidatePages (signal file)   │
         └──── (file on disk) ─────────────→┘
```

Cross-process communication uses files in the build directory:

- `pageRegistry.json`: Page metadata + raw content for JIT resolution
- `refMap.json`, `keyMap.json`, `jsMap.json`: Shared build state
- `skeletonSourceFiles.json`: Set of files that affect skeleton (read by watcher)
- `invalidatePages`: Timestamp signal file written by watcher for page-only changes

### Skeleton Build Flow

**File:** `manager/processes/lowdefyBuild.mjs`

```javascript
function lowdefyBuild({ directories, logger, options }) {
  return async () => {
    logger.info({ spin: 'start' }, 'Building config...');
    const customTypesMap = await createCustomPluginTypesMap({ directories, logger });
    const customMessagesMap = await createCustomPluginMessagesMap({ directories, logger });
    const result = await shallowBuild({ customMessagesMap, customTypesMap, directories, ... });
    logger.info({ spin: 'succeed' }, `Built config in ...`);
    return result; // { components, pageRegistry, context }
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
    context.buildContext = result.context;
  }
};
```

### JIT Page Build Flow

**File:** `lib/server/jitPageBuilder.js`

When a page API request arrives (`GET /api/page/*`):

1. `checkPageInvalidations()` reads the `invalidatePages` signal file (with mtime caching)
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
    const result = await buildPageJit({ pageId, pageRegistry: registry, context });
    if (result?.installing) return result; // { installing: true, packages }
    pageCache.markCompiled(pageId);
    // Touch tailwind-candidates.css so Vite's CSS pipeline re-runs Tailwind
    // for classes the JIT build discovered — globals.css imports it.
    fs.writeFileSync(path.join(buildDirectory, 'tailwind-candidates.css'), ...);
    return { built: true, warnings: result?._warnings };
  } finally {
    pageCache.releaseBuildLock(pageId);
  }
}
```

`getBuildContext` also restores `connectionIds`, `modules`, `installedPluginPackages` (for missing-package detection), API endpoint configs (for JIT `CallAPI` validation), and advances the `makeId` counter past skeleton IDs. Icon imports are snapshotted once per server process (`bundledIconImports`) — skeleton rebuilds may discover new icons, but those are only importable after the next server restart.

### PageCache

**File:** `lib/server/pageCache.mjs`

Tracks which pages have been JIT-compiled and provides concurrency control:

| Method                     | Purpose                                     |
| -------------------------- | ------------------------------------------- |
| `isCompiled(pageId)`       | Check if page has been built                |
| `markCompiled(pageId)`     | Mark page as built                          |
| `acquireBuildLock(pageId)` | Prevent concurrent builds of same page      |
| `releaseBuildLock(pageId)` | Release build lock                          |
| `invalidateAll()`          | Clear all compiled pages (skeleton rebuild) |

A single instance lives in the server process (`jitPageBuilder.js`). The manager process holds no PageCache — it invalidates the server's cache through the `invalidatePages` signal file and `pageRegistry.json` mtime changes.

### Skeleton vs Page Change Classification

**File:** `manager/watchers/lowdefyBuildWatcher.mjs`

When a file changes, the watcher classifies it using the `skeletonSourceFiles.json` artifact (produced by the build's `collectSkeletonSourceFiles`):

| Condition                         | Action                                                           |
| --------------------------------- | ---------------------------------------------------------------- |
| `lowdefy.yaml` changed            | Full skeleton rebuild                                            |
| File in `skeletonSourceFiles`     | Full skeleton rebuild                                            |
| File not in `skeletonSourceFiles` | Page-only change: write `invalidatePages` signal, reload clients |

The `skeletonSourceFiles` set is derived from `~r` markers on non-page components during the shallow build. It includes every config file that contributes to non-page build artifacts (connections, API endpoints, auth, menus, etc.), traced through the refMap parent chain. This replaces the previous path-based heuristic (`!f.startsWith('pages/')`) which had false negatives for API files referenced from `pages/` and false positives for page templates outside `pages/`.

Both `lowdefyBuildWatcher` and `moduleBuildWatcher` use the same `loadSkeletonSourceFiles` helper and the same classification logic. The set contains relative paths for main config refs and absolute paths for module refs — matching the path formats each watcher receives from chokidar.

### Cross-Process Cache Invalidation

The manager and server run in separate processes with a single `PageCache` instance in the server. When a file change only affects pages (not skeleton):

1. Manager writes `invalidatePages` signal file (timestamp)
2. Manager runs `updatePageTailwindCss` to refresh Tailwind candidates for the changed page YAML
3. Manager calls `reloadClients()` (SSE event)
4. On next page request, server's `checkPageInvalidations()` detects the signal file (mtime-based)
5. Server's `pageCache.invalidateAll()` clears all compiled pages
6. Server's `cachedBuildContext` is set to `null` to refresh maps

For skeleton changes, `lowdefyBuild()` triggers a full rebuild; the server detects the new `pageRegistry.json` mtime on next request and invalidates everything.

## Server Process and Logging

### stdio: inherit

The manager spawns the Vite child with `stdio: ['ignore', 'inherit', 'pipe']`:

- **stdout** is inherited — server pino JSON flows directly to the manager's stdout (which the CLI reads)
- **stderr** is piped — the manager formats stderr lines through its own logger, with a friendly message for `EADDRINUSE`
- **stdin** is ignored

This eliminates the need for a dev stdout line handler to parse and re-emit server logs. The server's pino logger emits JSON with optional `color`/`spin`/`succeed` fields, so the CLI can render each line correctly (error → red, blue → source link, spin → spinner, etc.).

```javascript
// startServer.mjs
const devServer = spawn(
  'node',
  [context.bin.vite, '--port', String(context.options.port), '--strictPort'],
  {
    stdio: ['ignore', 'inherit', 'pipe'],
    env: {
      ...process.env,
      LOWDEFY_DIRECTORY_CONFIG: context.directories.config,
      PORT: context.options.port,
    },
  }
);
```

### Logger Setup

Both processes use `createNodeLogger` from `@lowdefy/logger/node`:

| Logger         | Name                | Purpose                             |
| -------------- | ------------------- | ----------------------------------- |
| Manager logger | `lowdefy build`     | Build orchestration, watcher output |
| Server logger  | `lowdefy_server_dev` | HTTP request logs, runtime errors   |

Both emit pino JSON with optional `color`/`spin`/`succeed` fields to stdout. The CLI reads this JSON and renders it via `createStdOutLineHandler` → `createCliLogger` (ora spinners, colored output). The JIT builder logs through a `jit-build` child logger.

See [@lowdefy/logger](../utils/logger.md) for details.

## Build Processes

### Initial Build

**File:** `manager/processes/initialBuild.mjs`

```javascript
function initialBuild(context) {
  return async () => {
    context.readDotEnv();
    await context.lowdefyBuild();
    await context.checkMockUserWarning();
    await context.installPlugins();
  };
}
```

There is no client build step — Vite compiles client modules on demand when the browser requests them.

### Install Plugins

**File:** `manager/processes/installPlugins.mjs`

```javascript
function installPlugins({ logger, packageManagerCmd }) {
  return async () => {
    await spawnProcess({
      command: packageManagerCmd,
      args: ['install', '--no-frozen-lockfile'],
      stdOutLineHandler: (line) => logger.debug(line),
    });
  };
}
```

## File Watchers

### Watcher Orchestration

**File:** `manager/processes/startWatchers.mjs`

```javascript
function startWatchers(context) {
  return async () => {
    await Promise.all([
      envWatcher(context), // .env changes → rebuild + hard restart
      lowdefyBuildWatcher(context), // Config changes → soft reload
      moduleBuildWatcher(context), // Local module changes → soft reload
      serverArtifactWatcher(context), // Server-read artifacts → restart
    ]);
  };
}
```

### Lowdefy Build Watcher

**File:** `manager/watchers/lowdefyBuildWatcher.mjs`

Watches the config directory (plus `--watch` paths). Decides between page invalidation (fast) and full skeleton rebuild:

```javascript
const callback = async (filePaths) => {
  const changedFiles = filePaths.map((f) => path.relative(configDir, f));

  // Check for version change in lowdefy.yaml
  if (lowdefyYamlModified) {
    /* exit if version changed */
  }

  const skeletonSourceFiles = loadSkeletonSourceFiles(context.directories.build);
  const isSkeletonChange =
    lowdefyYamlModified || changedFiles.some((f) => skeletonSourceFiles.has(f));

  if (isSkeletonChange) {
    await context.lowdefyBuild(); // Full skeleton rebuild
  } else {
    // Page-only change: write signal file so server invalidates its page cache
    fs.writeFileSync(invalidatePath, String(Date.now()));
    await updatePageTailwindCss({ changedFiles, context });
  }
  await context.reloadClients();
};
```

### Module Build Watcher

**File:** `manager/watchers/moduleBuildWatcher.mjs`

Watches local module directories (modules with `isLocal: true` in `buildContext.modules`). Uses the same `skeletonSourceFiles.json` artifact as the lowdefy build watcher to classify changes:

```javascript
const callback = async (filePaths) => {
  const changedFiles = filePaths.flat(); // Absolute paths from chokidar

  const moduleYamlChanged = changedFiles.some(
    (filePath) => path.basename(filePath) === 'module.lowdefy.yaml'
  );

  const skeletonSourceFiles = loadSkeletonSourceFiles(context.directories.build);
  const hasSkeletonChanges = changedFiles.some((f) => skeletonSourceFiles.has(f));

  if (moduleYamlChanged || hasSkeletonChanges) {
    await context.lowdefyBuild();
  } else {
    fs.writeFileSync(invalidatePath, String(Date.now()));
  }
  await context.reloadClients();
};
```

Module refs in the `skeletonSourceFiles` set are absolute paths (the walker resolves them via `path.resolve`), matching chokidar's absolute output. No path normalization needed.

The watcher only starts when local modules exist. If `buildContext.modules` is empty or has no local entries, `moduleBuildWatcher` returns immediately.

### Environment Watcher

**File:** `manager/watchers/envWatcher.mjs`

Watches the `.env` file in the config directory:

```javascript
const callback = async () => {
  context.readDotEnv();
  await context.lowdefyBuild();
  context.restartServer();
};
```

### Server Artifact Watcher

**File:** `manager/watchers/serverArtifactWatcher.mjs`

Replaces the old next build watcher. Only files the **server reads at startup** are tracked — a change requires a child restart for a fresh ESM module cache. Client-side artifacts (`blocks.js`, `operators/client.js`, `globals.css`, ...) are served by Vite itself and hot-replaced without a restart.

Tracked files:

```
build/app.json
build/auth.json
build/config.json
build/plugins/auth/adapters.js
build/plugins/auth/callbacks.js
build/plugins/auth/events.js
build/plugins/auth/providers.js
build/plugins/connections.js
build/plugins/operators/server.js
package.json            (server directory)
```

Each tracked file is content-hashed (sha1, with `~k` keys stripped from JSON before hashing) so rebuilds that produce identical output do not restart the server:

- **No hash changed** → log "Reloaded app.", no restart
- **Any hash changed** → shut down and restart the child
- **`package.json` changed** → run `installPlugins`, re-run `lowdefyBuild` (so newly installed packages are included in the plugin imports), re-hash all tracked files (to avoid detecting the build's own output as a new change), then restart

## Hot Reload System

### Server-Side (SSE)

**File:** `src/routes/reload.js`

```javascript
async function reloadHandler(c) {
  return streamSSE(c, async (stream) => {
    const watcher = chokidar.watch(['./build/reload'], { ignoreInitial: true });

    stream.onAbort(() => watcher.close());

    watcher.on('add', () => stream.writeSSE({ event: 'reload', data: '{}' }));
    watcher.on('change', () => stream.writeSSE({ event: 'reload', data: '{}' }));
    // No reload on unlink — cleanBuildDirectory deletes build/reload during
    // skeleton rebuilds, which would send a premature event before the new
    // artifacts are written.

    while (open) {
      await stream.sleep(15000);
      await stream.writeSSE({ event: 'ping', data: '' });
    }
  });
}
```

The 15s pings keep the connection alive; the route is registered before the api context middleware (it needs no request context) and dev has no compression middleware, so the stream is never buffered.

### Client-Side

**File:** `client/Reload.jsx`

```javascript
const Reload = ({ children, basePath, lowdefy }) => {
  const [reset, setReset] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const mutateCache = useMutateCache(basePath);

  useEffect(() => {
    const sse = new EventSource(`${basePath}/api/reload`);

    sse.addEventListener('reload', () => {
      setTimeout(async () => {
        await mutateCache();
        setReset(true);
      }, 600);
    });

    sse.onerror = () => {
      // Server restarting — stream closed
      setRestarting(true);
      sse.close();
      waitForRestartedServer(basePath); // Polls /api/ping, then reloads window
    };
    return () => sse.close();
  }, []);
  return <>{children({ reset, setReset, restarting })}</>;
};
```

Tailwind CSS updates arrive through Vite HMR (`globals.css` is in the dev module graph) — the old `tailwind-jit.css` link cache-bust is gone.

### Reload Trigger

**File:** `manager/processes/reloadClients.mjs`

```javascript
function reloadClients({ directories }) {
  return async () => {
    await writeFile(path.join(directories.build, 'reload'), `${Date.now()}`);
  };
}
```

## Hono App and Dev Routes

**File:** `src/app.js`

The Hono app is mounted into Vite via `@hono/vite-dev-server`. There is no compression in dev (parity with the old `compress: false`, and SSE must stay unbuffered). Mounting order matters:

1. **Context-free routes first**: `/api/reload`, `/api/ping`, `/api/js/:env`, `/api/icons/dynamic`, `/api/dev-tools` — these had no `apiWrapper` before and need no request context.
2. **`initAuthConfig`** (app-wide) — only when `authJson.configured === true`.
3. **`apiContext()`** on `/api/*`, then `/api/auth/*` (Auth.js handler), `/api/root`, `/api/page/*`, `/api/request/*`, `/api/endpoints/*`, `/api/client-error`, `/api/usage`, `/api/agent/*` (with a 10mb `bodyLimit`).
4. **`serveStatic({ root: './public' })`** for user public assets (icons, images).
5. **Page catch-all**: `GET /` and `GET /:rest{.+}` — every page path renders the same shell via `renderDevPage`; the client fetches config and handles home/404 routing.
6. **`app.onError`** — Hono routes every handler error to the app-level error handler (upstream middleware try/catch never sees them). API paths get serialized error JSON (with `received`/`stack`/`configKey` stripped); page paths get a plain 500. Same contract as production — see [server.md](./server.md#error-handling).

### Page Config (JIT Build Trigger)

**File:** `src/routes/jitPage.js`

The page route triggers JIT page building before returning page config. The response shapes are a **frozen contract** with the dev client:

| Response                                          | Meaning                                  |
| ------------------------------------------------- | ---------------------------------------- |
| `200 { installing: true, packages }`              | Plugin install in progress, client polls |
| `500 { buildError: true, errors, message, source }` | Build failed (errors include type/stack) |
| `404 'Page not found.'`                           | Page not in registry                     |
| `200 pageConfig` (+ `_warnings`)                  | Built page config, with build warnings   |

```javascript
async function jitPageHandler(c) {
  const context = c.get('lowdefyContext');
  const pageId = getPathSegments(c, '/api/page/').join('/');

  let buildResult;
  try {
    buildResult = await buildPageIfNeeded({ pageId, ... });
  } catch (error) {
    // error.buildErrors collected → 500 { buildError: true, errors, message, source }
  }

  if (buildResult?.installing) return c.json({ installing: true, packages });

  const pageConfig = await getPageConfig(context, { pageId });
  if (pageConfig === null) return c.text('Page not found.', 404);
  if (buildResult?.warnings?.length > 0) pageConfig._warnings = buildResult.warnings;
  return c.json(pageConfig);
}
```

### JS Map

**File:** `src/routes/jsEnv.js`

`GET /api/js/:env` (`client` or `server`) serves `clientJsMap.js` or `serverJsMap.js` from `build/plugins/operators/` as JavaScript. The client fetches this after a JIT build to get newly extracted `_js` function entries.

### Dynamic Icons

**File:** `src/routes/iconsDynamic.js`

`GET /api/icons/dynamic` serves `build/plugins/iconsDynamic.js` — icon SVG data discovered by JIT page builds that is not in the static icon imports.

### Health Check

**File:** `src/routes/ping.js`

```javascript
function pingHandler(c) {
  return c.json({ timestamp: new Date().toISOString() });
}
```

### API Context Middleware

**File:** `src/middleware/apiContext.js`

Builds the request context (`rid`, `config`, `connections`, `operators`, `secrets`, `session`, ...) and stores it on the Hono context — same shape as production, plus `configDirectory` (from `LOWDEFY_DIRECTORY_CONFIG`) for JIT builds. The server `jsMap` is loaded dynamically: the build rewrites `serverJsMap.js` when a JIT page discovers new `_js` operators, so the middleware mtime-checks the file and re-evaluates it via `new Function` (Node's ESM cache cannot re-import a changed file).

## HTML Shell

**File:** `src/html/renderDevPage.js`

Unlike production, the dev shell is **config-free** — the client fetches root config and page config over the API (SWR). The shell embeds only `{ basePath }` in `__LOWDEFY_CONFIG__`.

- Theme and app JSON (`build/theme.json`, `build/app.json`) are read from disk **per request**, so a `lowdefyBuild` updates the pre-hydration values (layer-order script, dark-mode flash prevention, `appendHead`/`appendBody`) without a server restart.
- The **react-refresh preamble** is inlined in the shell — required by `@vitejs/plugin-react` when serving custom HTML.
- `@hono/vite-dev-server` injects `/@vite/client` into the response automatically.
- The body loads `/client/main.jsx` as a module — Vite serves and transforms it on demand.

## Client Components

### Entry

**File:** `client/main.jsx`

```javascript
import '../build/layer-order.css'; // MUST be the first CSS import

import createRouter from '@lowdefy/client/adapters/createRouter.js';
import App from './App.jsx';

import '../build/globals.css'; // Tailwind — compiled by Vite's PostCSS pipeline

const config = JSON.parse(document.getElementById('__LOWDEFY_CONFIG__').textContent);
const router = createRouter({ basePath: config.basePath ?? '', window });

// Keep one React root across Vite HMR updates.
const root = import.meta.hot?.data.root ?? createRoot(container);
if (import.meta.hot) {
  import.meta.hot.data.root = root;
}
root.render(<App config={config} router={router} />);
```

### App Wrapper

**File:** `client/App.jsx`

Sets up the provider tree (`StyleProvider`, `XProvider`/antd theme, `AntdApp`, `ErrorBoundary`, `Auth`) and the `ErrorBar`. Subscribes to the root config SWR cache **without suspense** (deduplicates with Routing's fetch) for theme/dark-mode/i18n, and registers a runtime error callback that feeds the ErrorBar.

### Routing

**File:** `client/Routing.jsx`

Replaces the old `lib/client/App.js` — page resolution is driven by the custom router from `@lowdefy/client/adapters` instead of `next/router`, everything else preserved. It subscribes to router location changes, resolves `pageId` via `setPageId(location, rootConfig)` (location shape: `{ pageId, pathname, search }`; `pageId` is null at the root path, which resolves/redirects to the home page), and renders `<Reload>` → `<Suspense>` → `<Page>` keyed on `${pageId}_${reloadVersion}`.

### Page

**File:** `client/Page.jsx`

Fetches page config via `usePageConfig` and renders `@lowdefy/client`'s `Client`. Handles the JIT response contract: `buildError` → `BuildErrorPage`, `installing` → `InstallingPluginsPage`, `restarting` → `RestartingPage`, `null` → replace to `/404`. Merges `_jsEntries` into the static `jsMap` and mutates the static icons object with `_dynamicIcons` (via `GenIcon`) so JIT-discovered icons render immediately.

### ErrorBar

**File:** `lib/client/ErrorBar.jsx`

Fixed bottom bar that displays build errors and warnings in the browser. Build warnings propagate from the build pipeline through the page config (`_warnings`) and SSE reload channel to the client, giving developers immediate feedback without checking the terminal. Includes a copy-to-clipboard button for sharing error details with stack traces.

### SWR Hooks

**File:** `lib/client/utils/usePageConfig.js`

Uses SWR with a versioned key to support cache busting on hot reload:

```javascript
async function fetchPageConfig(url) {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
  if (res.status === 404) return null;
  const data = await res.json();
  if (data?.buildError || data?.installing) return data;

  // After page config fetch (which triggers JIT build), fetch JS entries
  // and dynamic icons (parallel with each other, sequential after the build)
  const basePath = url.replace(/\/api\/page\/.*$/, '');
  const [jsEntries, dynamicIcons] = await Promise.all([
    fetchJsEntries(basePath),
    fetchDynamicIcons(basePath),
  ]);
  data._jsEntries = jsEntries;
  data._dynamicIcons = dynamicIcons;
  return data;
}

function usePageConfig(pageId, basePath) {
  const url = `${basePath}/api/page/${pageId}`;
  // reloadVersion changes on hot reload, orphaning old SWR cache entries
  const { data } = useSWR([url, getReloadVersion()], ([fetchUrl]) => fetchPageConfig(fetchUrl), {
    suspense: true,
  });
  return { data };
}
```

The `/api/js/client` and `/api/icons/dynamic` responses are JS module text, evaluated client-side via `new Function`.

**File:** `lib/client/utils/useMutateCache.js`

Manages cache busting via a `reloadVersion` counter:

```javascript
let reloadVersion = 0;

function getReloadVersion() {
  return reloadVersion;
}

function useMutateCache(basePath) {
  const { mutate } = useSWRConfig();
  return () => {
    reloadVersion += 1; // Orphans old SWR keys
    return mutate((key) => key === `${basePath}/api/root`); // Only revalidate root
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
- The `_jsEntries` are merged with the static `jsMap` in `Page.jsx`

## Tailwind CSS Pipeline

Tailwind compiles through **Vite's PostCSS pipeline** (`postcss.config.cjs` → `@tailwindcss/postcss`). The old side-channel (`compileCss.mjs`, `lib/server/compileCss.js`, `public/tailwind-jit.css`) is gone.

- The build writes `build/globals.css`, which imports `tailwindcss`, the layout grid CSS, and `./tailwind-candidates.css`, and declares `@source "../lowdefy-build/tailwind/*.html"` for JIT class candidates.
- `client/main.jsx` imports `build/layer-order.css` **first** (locks the cascade layer order), then `build/globals.css`. Both are in the dev module graph, so CSS changes hot-replace via Vite.
- New Tailwind classes are picked up by **touching `build/tailwind-candidates.css`**, which forces PostCSS to re-run and Tailwind to re-scan its `@source` files:
  - **JIT page builds** touch it after writing page artifacts (`lib/server/jitPageBuilder.js`).
  - **Page YAML edits** go through `manager/utils/updatePageTailwindCss.mjs`, which extracts all strings from the changed YAML into `lowdefy-build/tailwind/<pageId>.html` and then touches the candidates file.

## Vite Configuration

**File:** `vite.config.js`

```javascript
export default defineConfig(({ mode }) => ({
  base: `${basePath}/`, // From build/config.json (best-effort — may not exist yet)
  plugins: [
    react(),
    devServer({
      entry: './src/app.js',
      // Vite serves these itself; everything else routes to the Hono app.
      exclude: [
        /^\/client\/.+/,
        /^\/lib\/.+/,
        /^\/build\/.+/,
        /^\/@.+$/,
        /^\/node_modules\/.*/,
        /\?t=\d+$/,
        /^\/favicon\.ico$/,
      ],
    }),
  ],
  define: {
    // Vite does not replace process.env.NODE_ENV inside dependencies —
    // plugin and client code branch on it.
    'process.env.NODE_ENV': JSON.stringify(mode === 'production' ? 'production' : 'development'),
  },
  resolve: {
    // Linked plugin packages (pnpm link: / workspace) must share one React.
    dedupe: ['react', 'react-dom'],
  },
}));
```

## Key Files

| File                                        | Purpose                                            |
| ------------------------------------------- | -------------------------------------------------- |
| `manager/run.mjs`                           | Entry point (signal handling, orchestration)       |
| `manager/getContext.mjs`                    | Context factory with JIT build state               |
| `manager/processes/startServer.mjs`         | Spawns the Vite child process                      |
| `manager/processes/lowdefyBuild.mjs`        | Calls `shallowBuild`, captures result              |
| `manager/utils/loadSkeletonSourceFiles.mjs` | Load skeleton source file set from build artifact  |
| `manager/utils/updatePageTailwindCss.mjs`   | Refresh Tailwind candidates on page edits          |
| `manager/watchers/lowdefyBuildWatcher.mjs`  | Skeleton vs page change classification             |
| `manager/watchers/moduleBuildWatcher.mjs`   | Local module file change classification            |
| `manager/watchers/serverArtifactWatcher.mjs`| Server-read artifact changes → restart             |
| `lib/server/jitPageBuilder.js`              | JIT page build on API request                      |
| `lib/server/pageCache.mjs`                  | PageCache class (compiled tracking, locks)         |
| `src/app.js`                                | Hono app assembly (routes, middleware, static)     |
| `src/routes/jitPage.js`                     | Page route (triggers JIT build, frozen contract)   |
| `src/routes/jsEnv.js`                       | Serves JS map as module                            |
| `src/routes/reload.js`                      | SSE endpoint                                       |
| `src/middleware/apiContext.js`              | Request context + dynamic serverJsMap loading      |
| `src/html/renderDevPage.js`                 | Config-free HTML shell                             |
| `client/main.jsx`                           | Client entry (CSS order, HMR-stable root)          |
| `client/Routing.jsx`                        | Page resolution from the custom router             |
| `client/Page.jsx`                           | Page renderer (merges jsMap, dynamic icons)        |
| `client/Reload.jsx`                         | SSE hot reload listener                            |
| `lib/client/utils/usePageConfig.js`         | SWR hook with versioned cache keys                 |
| `lib/client/utils/useMutateCache.js`        | `reloadVersion` counter for cache busting          |
| `vite.config.js`                            | Vite dev server + Hono mounting                    |

## Reload Types

| Trigger                                          | Handled by            | Action                                       | Result                                           |
| ------------------------------------------------ | --------------------- | -------------------------------------------- | ------------------------------------------------ |
| Page-level config change                         | lowdefyBuildWatcher   | Signal file + Tailwind candidates + SSE      | Soft reload (all pages invalidated, rebuilt JIT) |
| Skeleton-level config change                     | lowdefyBuildWatcher   | Full skeleton rebuild + SSE                  | Soft reload (all pages invalidated)              |
| Module skeleton / `module.lowdefy.yaml` change   | moduleBuildWatcher    | Full skeleton rebuild + SSE                  | Soft reload                                      |
| Module page content change                       | moduleBuildWatcher    | Signal file + SSE                            | Soft reload (all pages invalidated, rebuilt JIT) |
| Client plugin code / CSS change                  | Vite                  | HMR module replacement                       | In-place update (~hundreds of ms, no restart)    |
| Server artifact change (auth, connections, server operators, config) | serverArtifactWatcher | Restart child                | Hard restart                                     |
| `package.json` change                            | serverArtifactWatcher | Install + lowdefy build + restart            | Hard restart                                     |
| `.env` change                                    | envWatcher            | Read env + lowdefy build + restart           | Hard restart                                     |

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

| File                                       | Purpose                                          |
| ------------------------------------------ | ------------------------------------------------ |
| `lib/server/auth/getMockSession.js`        | Core mock session logic                          |
| `manager/processes/checkMockUserWarning.mjs` | Startup warning                                |
| `lib/server/auth/session.js`               | Server-side integration (mock checked first, then `getAuthUser(c)` from `@hono/auth-js`) |

Auth itself is Auth.js v5 (`@auth/core` via `@hono/auth-js`), wired the same way as production: `initAuthConfig` mounted app-wide when configured, `/api/auth/*` delegating to `authHandler()`, and `SessionProvider`/`useSession` from `@hono/auth-js/react` on the client. See [Auth System Architecture](../architecture/auth-system.md#mock-user-for-testing-dev-server-only) for full details.

## Plugin Strategy

The dev server uses a different plugin strategy than production to optimize for fast iteration.

### Pre-installed Packages

The dev server's `package.json` includes a broad set of default plugin packages (blocks, operators, actions, connections) as dependencies. This means:

- No bundling step is needed when a user first uses a new block or action type — Vite serves the module on demand
- Bundle size is not a concern in development — all installed types are available immediately
- The skeleton build reads the server's `package.json` to determine installed packages and includes all types from those packages in the generated import files

### JIT Build and Type Counting

During development, the skeleton build (`shallowBuild`) stops at page content boundaries (`pages.*.blocks`, `pages.*.events`, etc.) and leaves `_shallow` markers. Page content is resolved just-in-time when requested. This means page-level types (actions, blocks, operators used inside pages) are NOT counted during the skeleton build.

To compensate, `shallowBuild` adds all types from installed packages to `components.types` after `buildTypes` runs. This ensures the generated plugin import files include all available types, not just those counted from non-page components (like connections and API config).

### New Plugin Detection

If a user configures a plugin package that isn't installed in the dev server:

1. The JIT build detects the missing package (`detectMissingPluginPackages`) and writes it into the server `package.json` (`updateServerPackageJsonJit`)
2. The page route responds `{ installing: true, packages }` — the client shows `InstallingPluginsPage`
3. `serverArtifactWatcher` sees the `package.json` change: `installPlugins` runs `pnpm install`, `lowdefyBuild` regenerates the plugin imports
4. The server restarts with the new plugin available

### Production Comparison

| Aspect              | Development                                               | Production                                |
| ------------------- | --------------------------------------------------------- | ----------------------------------------- |
| Type counting       | Only non-page types counted; all installed types included | All pages built; exact type usage counted |
| Bundle size         | All installed types served on demand                      | Only used types bundled (tree-shaken)     |
| Plugin availability | Immediate for pre-installed packages                      | Only what's declared and used             |
| New plugin          | Install + rebuild + restart triggered automatically       | Must be declared in `lowdefy.yaml`        |

### Key Files

| File                                                                      | Purpose                                                                                     |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `packages/build/src/build/jit/shallowBuild.js`                            | Reads server `package.json`; `addInstalledTypes` pre-seeds types                            |
| `packages/build/src/build/jit/updateServerPackageJsonJit.js`              | Adds missing plugin packages to server `package.json`                                       |
| `packages/build/src/build/buildImports/buildImportsDev.js`                | Generates imports from `components.types`                                                   |
| `packages/servers/server-dev/manager/processes/installPlugins.mjs`        | Installs new plugin packages                                                                |
| `packages/servers/server-dev/manager/watchers/serverArtifactWatcher.mjs`  | Triggers install + rebuild + restart on `package.json` changes                              |

## Environment Variables

| Variable                          | Purpose                                        |
| --------------------------------- | ---------------------------------------------- |
| `LOWDEFY_SERVER_DEV_OPEN_BROWSER` | Open browser on start when set to `'true'`     |
| `LOWDEFY_DIRECTORY_CONFIG`        | Config directory path                          |
| `PORT` (or `--port`)              | Server port (default: 3000)                    |
| `LOWDEFY_LOG_LEVEL`               | Log level (default: info)                      |
| `LOWDEFY_BUILD_REF_RESOLVER`      | Custom ref resolver                            |
| `LOWDEFY_DEV_USER`                | Mock user JSON for testing                     |
| `LOWDEFY_SERVER_DEV_WATCH`        | Extra watch paths (JSON array)                 |
| `LOWDEFY_SERVER_DEV_WATCH_IGNORE` | Watch ignore paths (JSON array)                |
