/*
  Copyright 2020-2024 Lowdefy, Inc

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

import fs from 'fs';
import path from 'path';
import { defineConfig, devices } from '@playwright/test';

function createConfig({
  appDir = './',
  buildDir = '.lowdefy/server/build',
  mocksFile = 'e2e/mocks.yaml',
  port = 3000,
  testDir = 'e2e',
  testMatch = '**/*.spec.js',
  timeout = 180000, // 3 minutes for cold production builds
} = {}) {
  const cliCommand = 'npx lowdefy';
  // Resolve absolute paths for all directories
  const absoluteAppDir = path.resolve(appDir);
  const absoluteBuildDir = path.resolve(absoluteAppDir, buildDir);

  // Set environment for fixtures to find build artifacts
  process.env.LOWDEFY_BUILD_DIR = absoluteBuildDir;

  // Set environment for mocks file if it exists
  const absoluteMocksFile = path.resolve(absoluteAppDir, mocksFile);
  if (fs.existsSync(absoluteMocksFile)) {
    process.env.LOWDEFY_E2E_MOCKS_FILE = absoluteMocksFile;
  }

  return defineConfig({
    testDir,
    testMatch,
    fullyParallel: true,
    reporter: 'list',
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
      // Build and start production server
      // NEXT_PUBLIC_LOWDEFY_E2E=true exposes window.lowdefy for state testing
      command: `NEXT_PUBLIC_LOWDEFY_E2E=true ${cliCommand} build && ${cliCommand} start --port ${port}`,
      url: `http://localhost:${port}`,
      reuseExistingServer: true,
      timeout,
      cwd: absoluteAppDir,
    },
  });
}

function createMultiAppConfig({
  apps = [],
  testDir = 'e2e',
  testMatch = '**/*.spec.js',
  timeout = 180000,
} = {}) {
  const cliCommand = 'npx lowdefy';

  // Set up projects for each app
  const projects = apps.map((app) => {
    const appBuildDir = path.resolve(app.appDir, '.lowdefy/server/build');

    return {
      name: app.name,
      testDir: path.join(testDir, app.name),
      testMatch,
      use: {
        baseURL: `http://localhost:${app.port}`,
        ...devices['Desktop Chrome'],
      },
      // Store build dir in metadata for fixtures
      metadata: {
        buildDir: appBuildDir,
      },
    };
  });

  // Set up webServers for each app
  const webServer = apps.map((app) => ({
    command: `NEXT_PUBLIC_LOWDEFY_E2E=true ${cliCommand} build && ${cliCommand} start --port ${app.port}`,
    url: `http://localhost:${app.port}`,
    reuseExistingServer: true,
    timeout,
    cwd: app.appDir,
  }));

  return defineConfig({
    testDir,
    fullyParallel: true,
    reporter: 'list',
    use: {
      trace: 'on-first-retry',
    },
    projects,
    webServer,
  });
}

export { createConfig, createMultiAppConfig };
export default createConfig;
