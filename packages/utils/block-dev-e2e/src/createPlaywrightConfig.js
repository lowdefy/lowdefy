/*
  Copyright 2020-2026 Lowdefy, Inc

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import path from 'path';
import { defineConfig, devices } from '@playwright/test';

// A package's block e2e suite builds and serves `e2e/app`. A package can also run a second
// suite against an app of its own (`appDir`, `name`, `testMatch`), with services such as a
// database or mock APIs started before the app (`services`, Playwright webServer entries) and
// environment variables for the app server (`env`).
function createPlaywrightConfig({
  packageDir,
  port: defaultPort = 3001,
  appDir: appDirOption,
  name,
  testMatch = ['src/**/tests/*.e2e.spec.js', 'e2e/tests/*.e2e.spec.js'],
  services = [],
  env,
  fullyParallel = true,
  workers,
}) {
  // Worktrees share the machine, so a fixed port could reach another checkout's server.
  // LOWDEFY_E2E_PORT moves the run, and an existing server is only reused on request.
  const port = Number(process.env.LOWDEFY_E2E_PORT ?? defaultPort);
  const e2eDir = path.join(packageDir, 'e2e');
  const appDir = appDirOption ?? path.join(e2eDir, 'app');
  const suiteName = name ?? path.basename(packageDir);

  // Calculate paths relative to monorepo root
  // packageDir is like: /path/to/lowdefy/packages/plugins/blocks/blocks-basic
  const monorepoRoot = path.resolve(packageDir, '../../../../');
  const cliPath = path.join(monorepoRoot, 'packages/cli/dist/index.js');
  const prepareServerPath = path.join(monorepoRoot, 'scripts/prepare-e2e-server.mjs');
  // Each suite builds into its own untracked copy of the server, so a run leaves the
  // worktree clean and different suites can run at the same time.
  const serverDir = path.join(monorepoRoot, '_server/e2e', suiteName);
  const reuseExistingServer = process.env.LOWDEFY_E2E_REUSE_SERVER === 'true';

  return defineConfig({
    testDir: packageDir,
    testMatch,
    fullyParallel,
    workers,
    reporter: 'list',
    outputDir: path.join(path.dirname(appDir), 'test-results'),
    use: {
      baseURL: `http://localhost:${port}`,
      trace: 'on-first-retry',
    },
    projects: [
      {
        name: 'chromium',
        use: { ...devices['Desktop Chrome'] },
      },
    ],
    webServer: [
      ...services.map((service) => ({ reuseExistingServer, ...service })),
      {
        command: [
          `node ${prepareServerPath} --config-directory ${appDir} --server-directory ${serverDir} --log-level warn`,
          `node ${cliPath} build --config-directory ${appDir} --server-directory ${serverDir}`,
          `node ${cliPath} start --config-directory ${appDir} --server-directory ${serverDir} --port ${port} --log-level warn`,
        ].join(' && '),
        url: `http://localhost:${port}`,
        reuseExistingServer,
        timeout: 180000,
        env: env === undefined ? undefined : { ...process.env, ...env },
      },
    ],
  });
}

export default createPlaywrightConfig;
