# lowdefy (CLI)

The command-line interface for Lowdefy. Provides commands for initializing, developing, building, and running Lowdefy applications.

## Purpose

The CLI is the primary entry point for developers working with Lowdefy:
- Initialize new projects
- Run development server with hot reload
- Build production applications
- Start production servers

## Commands

### `lowdefy init`

Initialize a new Lowdefy project in the current directory.

```bash
lowdefy init
```

Creates:
- `lowdefy.yaml` - Main configuration file
- `.gitignore` - Ignores build artifacts

### `lowdefy dev`

Start the development server with hot reload.

```bash
lowdefy dev [options]
```

**Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `--config-directory` | Config directory path | Current directory |
| `--dev-directory` | Dev server directory | `.lowdefy/dev` |
| `--port` | Server port | 3000 |
| `--no-open` | Don't open browser | Opens browser |
| `--watch` | Additional paths to watch | - |
| `--watch-ignore` | Paths to ignore | - |
| `--ref-resolver` | Custom ref resolver path | - |
| `--log-level` | Log level (error/warn/info/debug) | info |

**What happens:**
1. Downloads dev server package
2. Runs `@lowdefy/build` on config
3. Starts Next.js dev server
4. Watches for config changes
5. Rebuilds on change

### `lowdefy build`

Build a production-ready application.

```bash
lowdefy build [options]
```

**Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `--config-directory` | Config directory path | Current directory |
| `--server-directory` | Server output directory | `.lowdefy/server` |
| `--no-next-build` | Skip Next.js build | Builds Next.js |
| `--ref-resolver` | Custom ref resolver path | - |
| `--log-level` | Log level | info |

**What happens:**
1. Downloads production server package
2. Runs `@lowdefy/build` on config
3. Runs `next build` on the server
4. Outputs ready-to-deploy app

### `lowdefy start`

Start a built production application.

```bash
lowdefy start [options]
```

**Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `--config-directory` | Config directory path | Current directory |
| `--server-directory` | Server directory | `.lowdefy/server` |
| `--port` | Server port | 3000 |
| `--log-level` | Log level | info |

### `lowdefy init-docker`

Generate a Dockerfile for containerized deployment.

```bash
lowdefy init-docker [options]
```

### `lowdefy init-vercel`

Generate Vercel deployment scripts.

```bash
lowdefy init-vercel [options]
```

## Environment Variables

All options can be set via environment variables:

| Variable | Corresponding Option |
|----------|---------------------|
| `LOWDEFY_DIRECTORY_CONFIG` | `--config-directory` |
| `LOWDEFY_DIRECTORY_DEV` | `--dev-directory` |
| `LOWDEFY_DIRECTORY_SERVER` | `--server-directory` |
| `LOWDEFY_LOG_LEVEL` | `--log-level` |
| `LOWDEFY_DISABLE_TELEMETRY` | `--disable-telemetry` |
| `PORT` | `--port` |

## Architecture

```
┌─────────────────┐
│  lowdefy CLI    │
│  (Commander.js) │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│                    Commands                          │
├──────────┬──────────┬──────────┬──────────┬────────┤
│   init   │   dev    │  build   │  start   │ init-* │
└──────────┴────┬─────┴────┬─────┴────┬─────┴────────┘
                │          │          │
                ▼          ▼          ▼
         ┌──────────────────────────────────┐
         │      Server Package Download      │
         │  (from npm: @lowdefy/server-*)    │
         └──────────────────────────────────┘
                         │
                         ▼
         ┌──────────────────────────────────┐
         │        @lowdefy/build            │
         │    (config compilation)          │
         └──────────────────────────────────┘
                         │
                         ▼
         ┌──────────────────────────────────┐
         │         Next.js Server           │
         │   (dev server or production)     │
         └──────────────────────────────────┘
```

## Key Modules

### `/commands/`

| Directory | Purpose |
|-----------|---------|
| `init/` | Project initialization logic |
| `dev/` | Development server orchestration |
| `build/` | Production build orchestration |
| `start/` | Production server startup |
| `init-docker/` | Dockerfile generation |
| `init-vercel/` | Vercel scripts generation |

### `/utils/`

| Module | Purpose |
|--------|---------|
| `runCommand.js` | Command wrapper with error handling |
| `createPluginTypesMap.js` | Generate plugin type maps |

### Logging

The CLI uses `createCliLogger` from `@lowdefy/logger/cli` which wraps `createPrint` (ora spinners, colored terminal output). The logger is available as `context.logger` with four level methods (`error`, `warn`, `info`, `debug`), six color sub-methods each (`.red()`, `.blue()`, etc.), and options for spin/succeed (`logger.info(msg, { spin: true })`).

When running the dev server, the CLI pipes the manager process stdout through `createStdOutLineHandler` which parses pino JSON lines and routes them to `logger[level](msg, { color/spin/succeed })` for rendering.

See [@lowdefy/logger](../utils/logger.md) for the full logging architecture.

## Design Decisions

### Why Download Server Packages?

The CLI downloads `@lowdefy/server` and `@lowdefy/server-dev` on demand:
- Keeps CLI package small
- Server can be versioned independently
- Different server variants possible

### Why Not Bundle Build?

The build package (`@lowdefy/build`) is also downloaded:
- Reduces CLI size
- Ensures build matches server version
- Allows build improvements without CLI updates

### Node.js Version Check

The CLI enforces Node.js >= 18:
```javascript
if (Number(nodeMajorVersion) < 18) {
  throw new Error('...');
}
```

This ensures compatibility with:
- ES modules
- Modern JavaScript features
- Next.js requirements

## Integration Points

- **@lowdefy/build**: Called for config compilation
- **@lowdefy/server**: Downloaded for production builds
- **@lowdefy/server-dev**: Downloaded for development
- **Next.js**: Underlying framework for both servers

## Typical Workflow

```bash
# 1. Create new project
npx lowdefy init

# 2. Develop locally
npx lowdefy dev

# 3. Build for production
npx lowdefy build

# 4. Run production server
npx lowdefy start

# Or deploy to Vercel/Docker
npx lowdefy init-vercel  # or init-docker
```

## File Watching (Dev Mode)

The dev server watches:
- All `.yaml`, `.yml`, `.json`, `.json5` in config directory
- Custom paths via `--watch`
- Excludes `node_modules`, `.git`, `.lowdefy`

On change:
1. Rebuild config via `@lowdefy/build`
2. Hot reload the Next.js dev server
3. Browser refreshes automatically
