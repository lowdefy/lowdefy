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
│   ├── server/           # Server utilities
│   └── client/           # Client utilities (extended)
│       ├── App.js        # Dev app wrapper
│       ├── Reload.js     # Hot reload component
│       ├── RestartingPage.js
│       └── Utils/
│           ├── usePageConfig.js
│           ├── useRootConfig.js
│           ├── useMutateCache.js
│           └── waitForRestartedServer.js
├── manager/
│   ├── run.mjs           # Entry point
│   ├── getContext.mjs    # Context factory
│   ├── processes/        # Build processes
│   │   ├── initialBuild.mjs
│   │   ├── lowdefyBuild.mjs
│   │   ├── installPlugins.mjs
│   │   ├── nextBuild.mjs
│   │   ├── startServer.mjs
│   │   ├── restartServer.mjs
│   │   ├── shutdownServer.mjs
│   │   ├── readDotEnv.mjs
│   │   └── reloadClients.mjs
│   └── watchers/         # File watchers
│       ├── startWatchers.mjs
│       ├── lowdefyBuildWatcher.mjs
│       ├── envWatcher.mjs
│       └── nextBuildWatcher.mjs
├── pages/
│   └── api/
│       ├── reload.js     # SSE endpoint
│       ├── ping.js       # Health check
│       ├── page/[pageId].js
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
  options: {
    port,
    refResolver,
    watch: [],
    watchIgnore: []
  },
  version,
  packageManagerCmd,

  // Bound functions
  initialBuild,
  installPlugins,
  lowdefyBuild,
  nextBuild,
  readDotEnv,
  reloadClients,
  restartServer,
  shutdownServer,
  startWatchers
};
```

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

### Lowdefy Build

**File:** `manager/processes/lowdefyBuild.mjs`

```javascript
async function lowdefyBuild(context) {
  await build({
    customTypesMap,
    directories: context.directories,
    logger: context.logger,
    refResolver: context.options.refResolver,
    stage: 'dev'
  });
}
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

Watches config directory for changes:

```javascript
const watcher = chokidar.watch(watchPaths, {
  ignored: ['**/node_modules/**', ...watchIgnore],
  ignoreInitial: true
});

watcher.on('all', async (event, filePath) => {
  // Check for version change
  if (isVersionChange(filePath)) {
    logger.warn('Version changed, please restart');
    process.exit(1);
  }

  await context.lowdefyBuild();
  await context.reloadClients();
});
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

### Page Config

**File:** `pages/api/page/[pageId].js`

```javascript
export default apiWrapper(async ({ context, req, res }) => {
  const { pageId } = req.query;
  const pageConfig = await getPageConfig(context, { pageId });

  if (!pageConfig) {
    return res.status(404).json({ message: 'Page not found' });
  }

  return res.json(pageConfig);
});
```

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

```javascript
function usePageConfig(pageId) {
  const { data, error, mutate } = useSWR(
    `/api/page/${pageId}`,
    fetcher
  );

  return { pageConfig: data, error, mutate };
}
```

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
| `manager/getContext.mjs` | Context factory |
| `manager/processes/lowdefyBuild.mjs` | Config build |
| `manager/watchers/startWatchers.mjs` | Watcher orchestration |
| `pages/api/reload.js` | SSE endpoint |
| `lib/client/Reload.js` | Hot reload component |
| `lib/client/App.js` | Dev app wrapper |
| `lib/client/Utils/usePageConfig.js` | SWR hook |

## Reload Types

| Trigger | Watcher | Action | Result |
|---------|---------|--------|--------|
| Config change | lowdefyBuildWatcher | Build + SSE | Soft reload |
| .env change | envWatcher | Read env | Hard restart |
| Plugin change | nextBuildWatcher | Next build | Hard restart |
| package.json | nextBuildWatcher | Install + build | Hard restart |

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `LOWDEFY_OPEN_BROWSER` | Auto-open browser (default: true) |
| `LOWDEFY_DIRECTORY_CONFIG` | Config directory path |
| `PORT` | Server port (default: 3000) |
| `LOWDEFY_BUILD_REF_RESOLVER` | Custom ref resolver |
