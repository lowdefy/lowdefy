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

import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, devices } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function createConfig({
  appDir = './',
  buildDir = '.lowdefy/server/build',
  port = 3000,
  testDir = 'e2e',
  testMatch = '**/*.spec.js',
  timeout = 180000, // 3 minutes for cold production builds
} = {}) {
  const cliCommand = 'npx lowdefy';
  // Resolve absolute path for build directory
  const absoluteBuildDir = path.resolve(appDir, buildDir);

  // Set environment for fixtures to find build artifacts
  process.env.LOWDEFY_BUILD_DIR = absoluteBuildDir;

  return defineConfig({
    testDir,
    testMatch,
    fullyParallel: true,
    reporter: 'list',
    globalSetup: path.join(__dirname, 'globalSetup.js'),
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
      cwd: appDir,
    },
  });
}

export { createConfig };
export default createConfig;
