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
| `--port` | Server port; an explicit port (flag, `PORT`, `cli.port`) is strict, only the default moves | 3000 |
| `--no-open` | Don't open browser | Opens browser |
| `--watch` | Additional paths to watch | - |
| `--watch-ignore` | Paths to ignore | - |
| `--ref-resolver` | Custom ref resolver path | - |
| `--log-level` | Log level (error/warn/info/debug) | info |

**What happens:**

1. Refuses if `.lowdefy/instance.json` names a live dev server for this app (before touching `.lowdefy/dev`)
2. Resolves the port (`LOWDEFY_DEV_PORT` from the hub outranks `--port`)
3. Downloads dev server package
4. Runs `@lowdefy/build` on config
5. Starts the dev server manager (Vite + Hono child process), which writes `.lowdefy/instance.json`
6. Watches for config changes
7. Rebuilds on change

### `lowdefy mcp` / `lowdefy hub`

`lowdefy mcp` is the stdio MCP server agent clients spawn from `.mcp.json`; `lowdefy hub status|start|stop|logs` drive the per-user hub that runs dev servers for agents (`hub serve` is the hidden daemon entry). Both bypass `runCommand`/`startUp` (no lowdefy.yaml needed, nothing written to stdout) via `utils/runHubCommand.js`. See `code-docs/architecture/agent-dev-hub.md`.

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
| `--no-client-build` | Skip the Vite client build | Builds the client (`--no-next-build` is a deprecated alias) |
| `--ref-resolver` | Custom ref resolver path | - |
| `--log-level` | Log level | info |

**What happens:**

1. Downloads production server package
2. Runs `@lowdefy/build` on config
3. Runs the Vite client build (`pnpm run build:client`) on the server
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

### `lowdefy mobile`

Build, submit and update an app's phone shells with EAS (`commands/mobile/`). User docs: `packages/docs/concepts/cli.yaml`, "mobile".

```bash
lowdefy mobile config|build|submit|update|release|checklist [--shell <id>] [--env <environment>] [--dry-run]
```

- `loadMobileShell` builds the app (no client build) for the environment, picks the `mobile.shells` entry, copies the published `@lowdefy/shell` at the app's Lowdefy version into `.lowdefy/mobile/<shell>/project` (`getServer`) and loads its `profiles.js`, `runtimeVersion.js` and, when present, `resolveShellPlugins.js` and `checkShellPlugins.js` (`loadShellPackage`), which are authoritative at that version. `checklist` stops here.
- `config` writes `shell.json`, `eas.json`, the icon and a pnpm workspace into the project and installs it. `eas.json` is written after the install: each build profile pins `pnpm` to the version `node_modules/.modules.yaml` records (EAS's own newest pnpm refuses packages published that day) and sets `environment` (`production` for `prod`/`production`, else `preview`); each submit profile carries `ios.ascAppId`. Environments without a `url` get no profile. It returns `{ environment, projectDirectory, runtimeVersion, shell, shellJson, shellVersion }`, which `build`, `submit`, `update` and `release` build on.
- `runEas` is the only module that runs EAS: `npx --yes eas-cli@<EAS_CLI_VERSION>` in the project with `EAS_NO_VCS=1`, `LOWDEFY_SHELL_CONFIG=<project>/shell.json` (so eas reads the shell's app config, not Lowdefy Dev's) and `EAS_UPDATE_SKIP_ENVIRONMENT_CHECK=1` (the shell reads `shell.json`, not EAS environment variables). With `--json` in the args it returns the parsed output; with `dryRun` it prints and runs nothing. Tests stub this module.
- Store version: `build` and `release` read the latest finished build per store (`getLatestBuild`, `eas build:list`), compute the next patch on the entry's `major.minor` (`getNextStoreVersion`) and write it to `shell.json` (`setStoreVersion`). Build numbers use EAS's remote version source.
- `release` decides per store (`planRelease`): a different runtime version (or no build) builds and submits; the same runtime with another shell version in the latest update's message (`parseShellVersion`, written by `createUpdateMessage`) sends an update; else nothing.
- `checklist` turns the shell entry and its resolved profile into data (`createChecklist`) and prints it.
- Shell plugins (`mobile.shells[].plugins`): `config` reads each plugin's published `package.json` before writing anything (`readShellPluginPackages`, through `viewNpmPackage`, which runs `pnpm view <name>@<version> --json` in the app's directory so its `.npmrc` applies; tests stub this module) and checks its peers (`checkShellPluginPeers`: an `expo` range that includes the shell's `expo`, exact native peers, every peer optional, a peer the shell already has at the same version). It then adds the plugins and their native peers to the project's `package.json` from the shell's published one, kept as `package.original.json` (`addShellPluginDependencies`), writes `shell.json` `plugins`, rewrites `src/plugins/appTypes.js` to import each plugin's `./native` with its `typePrefix` (`writeShellAppTypes`), installs once, then runs the copied shell's `resolveShellPlugins` and `checkShellPlugins` (release variant), which refuse profile modules and profile permissions. It then runs the copied shell's `scripts/createTypeManifest.mjs --write` (`writeShellTypeManifest`), with or without plugins, which rewrites the bundled `src/plugins/typeManifest.js` with the plugins' native types and refuses type clashes. The runtime version takes the same plugin list. A shell without plugins otherwise writes what it did before. `--dry-run` reads and checks, and logs the dependencies it would add.
- `checklist` loads the plugins' `./shell` entries from the configured project (`loadInstalledShellPlugins`), failing when one is not installed at its version, and adds their data and a step listing what each declares.

### `lowdefy upgrade`

Upgrade a Lowdefy app by walking through migration prompts that handle breaking changes between versions.

```bash
lowdefy upgrade [options]
```

**Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `--to` | Target version | Latest stable |
| `--plan` | Show upgrade plan without executing | - |
| `--resume` | Resume interrupted upgrade | - |
| `--config-directory` | Config directory path | Current directory |
| `--log-level` | Log level | info |

**What happens:**

1. Reads current version from `lowdefy.yaml`
2. Fetches `@lowdefy/codemods@latest` from npm (reuses `fetchNpmTarball`)
3. Resolves the version chain via `resolveChain.js`
4. Presents migration prompts phase by phase via `executePhase.js`
5. Updates `lowdefy.yaml` version after each phase
6. Suggests git commit between phases

#### Architecture

```
┌─────────────────┐
│  upgrade command │
│  (upgrade.js)   │
└────────┬────────┘
         │
         ▼
┌──────────────────────┐     ┌───────────────────────────┐
│  fetchNpmTarball     │────▶│  @lowdefy/codemods@latest │
│  (reused from CLI)   │     │  → .lowdefy/codemods/     │
└──────────────────────┘     └───────────────────────────┘
         │
         ▼
┌──────────────────────┐
│  resolveChain.js     │  Reads registry.json, computes
│                      │  version chain using semver ranges
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│  executePhase.js     │  For each phase in the chain:
│                      │  presents prompts in order
└────────┬─────────────┘
         │
         ▼
┌──────────────────┐
│  handlePrompt.js │  Reads .md prompt, presents options:
│                  │  clipboard / view / skip
│                  │  AI tool detection
└────────┬─────────┘
         │
         ▼
┌──────────────────────┐
│  upgradeState.js     │  Writes .lowdefy/upgrade-state.json
│                      │  for --resume and build-time warnings
└──────────────────────┘
```

#### Key modules

| Module                             | Purpose                                                                  |
| ---------------------------------- | ------------------------------------------------------------------------ |
| `commands/upgrade/upgrade.js`      | Command entry point — fetch codemods, orchestrate                        |
| `commands/upgrade/resolveChain.js` | Version chain resolution from registry.json using semver ranges          |
| `commands/upgrade/executePhase.js` | Phase orchestrator — presents prompts in order                           |
| `commands/upgrade/handlePrompt.js` | Presents prompt options — clipboard, AI detection, manual guide          |
| `commands/upgrade/upgradeState.js` | Reads/writes `.lowdefy/upgrade-state.json` for resume and build warnings |

#### Integration points

- **`fetchNpmTarball`** — Reused from the existing server download flow to fetch `@lowdefy/codemods@latest`.
- **`validateVersion.js`** — Extended to check for `.lowdefy/upgrade-state.json` and warn about pending codemods during `build` and `dev`.
- **`@lowdefy/codemods`** — External package containing all migration prompts and registry. See [codemods.md](./codemods.md).

#### Design decisions

**Why `@lowdefy/codemods@latest`:** The codemods package contains the full migration history for all versions. Fetching `@latest` ensures the chain resolver has complete coverage. The `--to` flag controls the target version, not the codemods package version. This mirrors how `getServer.js` decouples CLI version from server version.

**Why prompts instead of scripts:** AI tools execute find-and-replace reliably from markdown prompts. Prompts can be updated after publishing (they're just text), work with any AI tool, and one format eliminates the need for script execution infrastructure (child_process.fork, backup logic, etc.).

**Why lazy AI detection:** The CLI checks for AI tool environment indicators only when presenting a prompt. Detection never blocks the upgrade flow — it may add options in future, falls back to clipboard/manual otherwise.

## Environment Variables

All options can be set via environment variables:

| Variable                    | Corresponding Option  |
| --------------------------- | --------------------- |
| `LOWDEFY_DIRECTORY_CONFIG`  | `--config-directory`  |
| `LOWDEFY_DIRECTORY_DEV`     | `--dev-directory`     |
| `LOWDEFY_DIRECTORY_SERVER`  | `--server-directory`  |
| `LOWDEFY_LOG_LEVEL`         | `--log-level`         |
| `LOWDEFY_DISABLE_TELEMETRY` | `--disable-telemetry` |
| `PORT`                      | `--port`              |

## Architecture

```
┌─────────────────┐
│  lowdefy CLI    │
│  (Commander.js) │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│                    Commands                                    │
├──────────┬──────────┬──────────┬──────────┬─────────┬────────┤
│   init   │   dev    │  build   │  start   │ upgrade │ init-* │
└──────────┴────┬─────┴────┬─────┴────┬─────┴────┬────┴────────┘
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
         │       Hono + Vite Server          │
         │   (dev server or production)     │
         └──────────────────────────────────┘
```

## Key Modules

### `/commands/`

| Directory      | Purpose                          |
| -------------- | -------------------------------- |
| `init/`        | Project initialization logic     |
| `dev/`         | Development server orchestration |
| `build/`       | Production build orchestration   |
| `start/`       | Production server startup        |
| `upgrade/`     | Codemod upgrade orchestration    |
| `mobile/`      | Phone shell builds through EAS   |
| `init-docker/` | Dockerfile generation            |
| `init-vercel/` | Vercel scripts generation        |

### `/utils/`

| Module                    | Purpose                             |
| ------------------------- | ----------------------------------- |
| `runCommand.js`           | Command wrapper with error handling |
| `createPluginTypesMap.js` | Generate plugin type maps           |

### Logging

The CLI uses `createCliLogger` from `@lowdefy/logger/cli` (ora spinners, colored terminal output). The logger is available as `context.logger` with four level methods (`error`, `warn`, `info`, `debug`). Color is passed via merge objects: `logger.info({ color: 'blue' }, 'text')`. Spin/succeed: `logger.info({ spin: true }, 'Building...')`.

When running the dev server, the CLI pipes the manager process stdout through `createStdOutLineHandler` which parses pino JSON lines, reconstructs errors, and routes them to `logger[level](error)` or `logger[level]({ color/spin/succeed }, msg)` for rendering.

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

The CLI enforces Node.js >= 24, matching `engines.node` in its `package.json`:

```javascript
if (Number(nodeMajorVersion) < 24) {
  throw new Error('...');
}
```

This ensures compatibility with:

- ES modules
- Modern JavaScript features
- Hono + Vite server requirements

## Integration Points

- **@lowdefy/build**: Called for config compilation
- **@lowdefy/server**: Downloaded for production builds
- **@lowdefy/server-dev**: Downloaded for development
- **Hono + Vite**: Underlying server and client bundler for both servers

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
2. Hot reload through Vite (client plugin code) or restart the server child process (server artifacts)
3. Browser refreshes automatically
