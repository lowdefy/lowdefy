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

// The same block specs are the only suite that exercises all three servers'
// render path, so CI runs them against each one. `prod` is the default: it is
// what an app ships, and a block's spec must keep passing there whatever the
// other two do.
//
// The mode is read from LOWDEFY_E2E_SERVER when the caller does not name one,
// because a CI matrix has to flip every block package's committed
// playwright.config.js at once and those files take no arguments.
const serverModes = ['prod', 'dev', 'e2e'];

function createWebServerCommand({ appDir, cliPath, monorepoRoot, port, server }) {
  if (server === 'dev') {
    const devDir = path.join(monorepoRoot, 'packages/servers/server-dev');
    return `node ${cliPath} dev --config-directory ${appDir} --dev-directory ${devDir} --port ${port} --no-open --log-level warn`;
  }
  const serverDir = path.join(
    monorepoRoot,
    server === 'e2e' ? 'packages/servers/server-e2e' : 'packages/servers/server'
  );
  return `node ${cliPath} build --config-directory ${appDir} --server-directory ${serverDir} && node ${cliPath} start --config-directory ${appDir} --server-directory ${serverDir} --port ${port} --log-level warn`;
}

function createPlaywrightConfig({
  packageDir,
  port = 3001,
  server = process.env.LOWDEFY_E2E_SERVER ?? 'prod',
}) {
  if (!serverModes.includes(server)) {
    throw new Error(
      `createPlaywrightConfig server must be one of ${serverModes.join(
        ', '
      )}. Received ${JSON.stringify(server)}.`
    );
  }
  const e2eDir = path.join(packageDir, 'e2e');
  const appDir = path.join(e2eDir, 'app');

  // Calculate paths relative to monorepo root
  // packageDir is like: /path/to/lowdefy/packages/plugins/blocks/blocks-basic
  const monorepoRoot = path.resolve(packageDir, '../../../../');
  const cliPath = path.join(monorepoRoot, 'packages/cli/dist/index.js');

  return defineConfig({
    testDir: packageDir,
    testMatch: ['src/**/tests/*.e2e.spec.js', 'e2e/tests/*.e2e.spec.js'],
    fullyParallel: true,
    reporter: 'list',
    outputDir: path.join(e2eDir, 'test-results'),
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
    webServer: {
      command: createWebServerCommand({ appDir, cliPath, monorepoRoot, port, server }),
      url: `http://localhost:${port}`,
      reuseExistingServer: true,
      // The dev server installs its own server directory and runs the build
      // before it serves anything, so it gets a longer budget than a prod
      // server that is started against an already built directory.
      timeout: server === 'dev' ? 600000 : 180000,
    },
  });
}

export default createPlaywrightConfig;
