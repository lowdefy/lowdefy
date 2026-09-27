# Configuration

The `playwright.config.js` file in your `e2e/` directory controls how tests are run. The `@lowdefy/e2e-utils/config` module provides helper functions that set up sensible defaults for Lowdefy apps.

## Default configuration

The simplest configuration uses all defaults:

```javascript
import { createConfig } from '@lowdefy/e2e-utils/config';

export default createConfig();
```

This will:
- Look for your Lowdefy app in the current directory
- Build and start the app's e2e server on port 3000, or reuse it if it is already running there
- Run tests from the `e2e/` directory matching `**/*.spec.js`
- Take screenshots only on failure

## Configuration options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `appDir` | string | `'./'` | Path to your Lowdefy app root |
| `buildDir` | string | `'.lowdefy/server/build'` | Build output directory (relative to appDir) |
| `mocksFile` | string | `'e2e/mocks.yaml'` | Path to static mocks file (relative to appDir) |
| `port` | number | `3000` | Port for the test server |
| `testDir` | string | `'e2e'` | Directory containing test files |
| `testMatch` | string | `'**/*.spec.js'` | Glob pattern for test files |
| `timeout` | number | `180000` | Build + server start timeout in milliseconds (3 minutes) |
| `screenshot` | string | `'only-on-failure'` | When to take screenshots: `'off'`, `'on'`, or `'only-on-failure'` |
| `outputDir` | string | `'test-results'` | Directory for test artifacts |

###### Custom port and timeout:
```javascript
import { createConfig } from '@lowdefy/e2e-utils/config';

export default createConfig({
  port: 3001,
  timeout: 300000, // 5 minutes for slow builds
});
```

## Reusing a running server

Playwright reuses a server that is already listening on the configured port, so starting it once with `pnpm e2e:server` in another terminal skips the build on later runs. Before any test runs, the config asks that server which build it serves. Any other server on the port, such as `lowdefy dev`, a production build, or the e2e server of another app or git worktree, stops the run with an error that names the port, instead of the tests running against it. Stop that server, or give each app or worktree its own `port`.

## Multi-app configuration

If your project has multiple Lowdefy apps (for example, in a monorepo), use `createMultiAppConfig`:

```javascript
import { createMultiAppConfig } from '@lowdefy/e2e-utils/config';

export default createMultiAppConfig({
  apps: [
    { name: 'admin', appDir: './apps/admin', port: 3001 },
    { name: 'customer', appDir: './apps/customer', port: 3002 },
  ],
});
```

Each app gets its own Playwright project and web server. Tests for each app should be placed in subdirectories matching the app name (for example, `e2e/admin/` and `e2e/customer/`).

## Extending the configuration

Since `createConfig` returns a standard Playwright configuration object, you can extend it with any Playwright options:

```javascript
import { createConfig } from '@lowdefy/e2e-utils/config';

const base = createConfig({ port: 3000 });

export default {
  ...base,
  retries: 2,
  projects: [
    ...base.projects,
    {
      name: 'firefox',
      use: { browserName: 'firefox' },
    },
  ],
};
```

Keep `globalSetup` from the base configuration (spreading `base` does), since it runs the server check. To add your own global setup, pass both: `globalSetup: [base.globalSetup, './global-setup.js']`.

## Environment variables

The configuration sets these environment variables automatically:

| Variable | Purpose |
|----------|---------|
| `LOWDEFY_BUILD_DIR` | Absolute path to build artifacts — used by test fixtures to generate the block manifest |
| `LOWDEFY_E2E_MOCKS_FILE` | Absolute path to `mocks.yaml` — used by test fixtures to load static mocks |
| `LOWDEFY_E2E_SERVERS` | Port and build directory of each app server — used by the global setup to check a reused server |

## Assertion timeouts

Assertion methods accept an optional `{ timeout }` parameter. The defaults are:

| Assertion type | Default timeout |
|---------------|----------------|
| Request assertions (`toFinish`, `toHaveResponse`, `toHavePayload`) | 30 seconds |
| State assertions (`toBe`) | 5 seconds |
| URL assertions (`toBe`, `toMatch`) | 5 seconds |
| Validation assertions (`validationError`, etc.) | 5 seconds |

```javascript
// Override timeout for a slow request
await ldf.request('generate_report').expect.toFinish({ timeout: 60000 });
```
