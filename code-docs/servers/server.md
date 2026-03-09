# @lowdefy/server

Production Next.js server for deploying Lowdefy applications.

## Overview

The production server is a lightweight, optimized Next.js application that:

- Loads pre-built configuration from `./build/`
- Serves pages with server-side rendering
- Handles API requests and authentication
- Runs with full Next.js optimizations

## Installation

```bash
# Installed automatically by CLI
lowdefy build
```

## Scripts

```json
{
  "build": "cp package.json package.original.json",
  "build:lowdefy": "node lowdefy/build.mjs",
  "build:next": "next build",
  "dev": "next dev",
  "start": "next start"
}
```

## Dependencies

### Core Lowdefy

- `@lowdefy/api` - Backend API logic
- `@lowdefy/client` - Frontend framework
- `@lowdefy/helpers` - Utility functions
- `@lowdefy/layout` - Grid layout system
- `@lowdefy/node-utils` - Node utilities

### Blocks & Actions

- `@lowdefy/actions-core` - Core actions
- `@lowdefy/blocks-antd` - Ant Design blocks
- `@lowdefy/blocks-basic` - Basic blocks
- `@lowdefy/blocks-loaders` - Loading indicators
- `@lowdefy/block-utils` - Block utilities

### Framework

- `next` (13.5.4)
- `next-auth` (4.24.5)
- `react` (18.2.0)
- `pino` (8.16.2)

## Directory Structure

```
server/
├── lib/
│   ├── build/            # Build artifact loaders (deserialize JSON)
│   │   ├── app.js
│   │   ├── auth.js
│   │   ├── config.js
│   │   └── logger.js
│   ├── server/           # Server utilities
│   │   ├── apiWrapper.js
│   │   ├── serverSidePropsWrapper.js
│   │   ├── fileCache.js
│   │   ├── auth/
│   │   │   ├── getAuthOptions.js
│   │   │   └── getServerSession.js
│   │   └── log/
│   │       ├── createLogger.js
│   │       ├── logError.js
│   │       └── logRequest.js
│   └── client/           # Client utilities
│       ├── Page.js
│       ├── createLogUsage.js
│       └── auth/
│           ├── Auth.js
│           ├── AuthConfigured.js
│           └── AuthNotConfigured.js
├── lowdefy/
│   └── build.mjs         # Build orchestration
├── pages/
│   ├── _app.js
│   ├── _document.js
│   ├── index.js
│   ├── 404.js
│   ├── [pageId].js
│   └── api/
│       ├── auth/[...nextauth].js
│       ├── endpoints/[endpointId].js
│       ├── request/[pageId]/[requestId].js
│       └── usage.js
├── public_default/
├── next.config.js
└── package.json
```

## API Wrapper

**File:** `lib/server/apiWrapper.js`

Wraps API handlers with context and error handling:

```javascript
function apiWrapper(handler) {
  return async function wrappedHandler(req, res) {
    const context = {
      rid: crypto.randomUUID(),
      buildDirectory: path.join(cwd, 'build'),
      config,
      connections,
      fileCache,
      headers: req.headers,
      jsMap,
      logger,
      operators,
      req,
      res,
      secrets: getSecretsFromEnv(process.env),
    };

    // Add auth
    context.authOptions = getAuthOptions(context);
    context.session = await getServerSession(context);
    createApiContext(context);

    return handler({ context, req, res });
  };
}
```

## Server-Side Props Wrapper

**File:** `lib/server/serverSidePropsWrapper.js`

Wraps `getServerSideProps` with context:

```javascript
function serverSidePropsWrapper(handler) {
  return async function wrappedHandler(nextContext) {
    const context = {
      rid: crypto.randomUUID(),
      buildDirectory: path.join(cwd, 'build'),
      config,
      fileCache,
      headers: nextContext?.req?.headers,
      logger,
      nextContext,
      req: nextContext?.req,
      res: nextContext?.res,
    };

    context.authOptions = getAuthOptions(context);
    context.session = await getServerSession(context);
    createApiContext(context);

    return handler({ context, nextContext });
  };
}
```

## Page Rendering

**File:** `pages/[pageId].js`

```javascript
export const getServerSideProps = serverSidePropsWrapper(async ({ context, nextContext }) => {
  const [pageConfig, rootConfig] = await Promise.all([
    getPageConfig(context, { pageId }),
    getRootConfig(context),
  ]);

  if (!pageConfig) {
    return { redirect: { destination: '/404' } };
  }

  logPageView(context, { pageId });

  return {
    props: {
      pageConfig,
      rootConfig,
      session: context.session,
    },
  };
});
```

## Next.js Configuration

**File:** `next.config.js`

```javascript
const nextConfig = {
  basePath: config.basePath || '',
  output: process.env.LOWDEFY_BUILD_OUTPUT_STANDALONE ? 'standalone' : undefined,
  poweredByHeader: false,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Browser fallbacks for Node modules
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        path: false,
        os: false,
      };
    }
    return config;
  },
};
```

## Build Process

**File:** `lowdefy/build.mjs`

```javascript
import build from '@lowdefy/build';

const directories = {
  build: path.join(serverDirectory, 'build'),
  config: configDirectory,
  server: serverDirectory,
};

await build({
  customTypesMap,
  directories,
  logger,
  refResolver,
});
```

## Authentication

**File:** `lib/server/auth/getAuthOptions.js`

Loads auth configuration:

```javascript
function getAuthOptions({ buildDirectory, logger }) {
  const authJson = readJsonSync(path.join(buildDirectory, 'auth.json'));

  if (!authJson.configured) {
    return { configured: false };
  }

  return getNextAuthConfig({
    authJson,
    logger,
    plugins: loadAuthPlugins(buildDirectory),
    secrets: getSecretsFromEnv(process.env),
  });
}
```

## File Caching

**File:** `lib/server/fileCache.js`

Caches file reads for performance:

```javascript
const fileCache = new Map();

function readConfigFile(filePath) {
  if (fileCache.has(filePath)) {
    return fileCache.get(filePath);
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(content);
  fileCache.set(filePath, parsed);

  return parsed;
}
```

## Build Artifact Loading

**Files:** `lib/build/app.js`, `lib/build/auth.js`, `lib/build/config.js`, `lib/build/logger.js`

Build artifacts are loaded via JS modules that deserialize the raw JSON using `serializer.deserialize()`. This restores `~arr` wrapper markers back to arrays with non-enumerable `~k`, `~r`, `~l` properties, enabling runtime error tracing to resolve config locations.

```javascript
import { serializer } from '@lowdefy/helpers';
import raw from '../../build/app.json';
export default serializer.deserialize(raw);
```

## Logging

**File:** `lib/server/log/createLogger.js`

Uses Pino for structured logging:

```javascript
const logger = pino({
  level: process.env.LOWDEFY_LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
});
```

## Key Files

| File                                        | Purpose             |
| ------------------------------------------- | ------------------- |
| `lib/server/apiWrapper.js`                  | API context setup   |
| `lib/server/serverSidePropsWrapper.js`      | SSP context setup   |
| `lib/server/auth/getAuthOptions.js`         | Auth configuration  |
| `lib/client/Page.js`                        | Page component      |
| `lib/client/auth/Auth.js`                   | Auth wrapper        |
| `pages/[pageId].js`                         | Dynamic page route  |
| `pages/api/request/[pageId]/[requestId].js` | Request handler     |
| `lowdefy/build.mjs`                         | Build orchestration |
| `next.config.js`                            | Next.js config      |

## Environment Variables

| Variable                          | Purpose                       |
| --------------------------------- | ----------------------------- |
| `LOWDEFY_LOG_LEVEL`               | Logging level (default: info) |
| `LOWDEFY_BUILD_OUTPUT_STANDALONE` | Enable standalone output      |
| `NEXTAUTH_SECRET`                 | Session encryption key        |
| `NEXTAUTH_URL`                    | App URL for OAuth             |
