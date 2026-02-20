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

import fs from 'fs';
import path from 'path';
import { defineConfig, devices } from '@playwright/test';

function createConfig({
  appDir = './',
  buildDir = '.lowdefy/server/build',
  commandPrefix = '',
  mocksFile = 'e2e/mocks.yaml',
  port = 3000,
  testDir = 'e2e',
  testMatch = '**/*.spec.js',
  timeout = 180000, // 3 minutes for cold production builds
  screenshot = 'only-on-failure', // 'off', 'on', or 'only-on-failure'
  outputDir = 'test-results',
} = {}) {
  const cliCommand = `${commandPrefix ? `${commandPrefix} ` : ''}npx lowdefy`;
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
    outputDir,
    use: {
      baseURL: `http://localhost:${port}`,
      trace: 'on-first-retry',
      screenshot,
    },
    projects: [
      {
        name: 'chromium',
        use: { ...devices['Desktop Chrome'] },
      },
    ],
    webServer: {
      // Build with e2e server and start
      command: `${cliCommand} build --server e2e && ${cliCommand} start --port ${port} --log-level warn`,
      // Use session API for health check — page URLs may redirect when auth is configured
      url: `http://localhost:${port}/api/auth/session`,
      reuseExistingServer: true,
      timeout,
      cwd: absoluteAppDir,
      // Exposes window.lowdefy for state testing
      env: { NEXT_PUBLIC_LOWDEFY_E2E: 'true' },
    },
  });
}

function createMultiAppConfig({
  apps = [],
  commandPrefix = '',
  testDir = 'e2e',
  testMatch = '**/*.spec.js',
  timeout = 180000,
  screenshot = 'only-on-failure',
  outputDir = 'test-results',
} = {}) {
  const cliCommand = `${commandPrefix ? `${commandPrefix} ` : ''}npx lowdefy`;

  // Set up projects for each app
  const projects = apps.map((app) => {
    const appBuildDir = path.resolve(app.appDir, app.buildDir ?? '.lowdefy/server/build');
    const appMocksFile = path.resolve(app.appDir, app.mocksFile ?? 'e2e/mocks.yaml');

    return {
      name: app.name,
      testDir: path.join(testDir, app.name),
      testMatch,
      use: {
        baseURL: `http://localhost:${app.port}`,
        buildDir: appBuildDir,
        mocksFile: fs.existsSync(appMocksFile) ? appMocksFile : undefined,
        ...devices['Desktop Chrome'],
      },
    };
  });

  // Set up webServers for each app
  const webServer = apps.map((app) => ({
    command: `${cliCommand} build --server e2e && ${cliCommand} start --port ${app.port} --log-level warn`,
    // Use session API for health check — page URLs may redirect when auth is configured
    url: `http://localhost:${app.port}/api/auth/session`,
    reuseExistingServer: true,
    timeout,
    cwd: app.appDir,
    env: { NEXT_PUBLIC_LOWDEFY_E2E: 'true' },
  }));

  return defineConfig({
    testDir,
    fullyParallel: true,
    reporter: 'list',
    outputDir,
    use: {
      trace: 'on-first-retry',
      screenshot,
    },
    projects,
    webServer,
  });
}

export { createConfig, createMultiAppConfig };
export default createConfig;
