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

import { defineConfig, devices } from '@playwright/test';

function createConfig({
  appDir = './',
  port = 3000,
  testDir = 'e2e',
  testMatch = '**/*.spec.js',
} = {}) {
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
      command: `npx lowdefy dev --port ${port}`,
      url: `http://localhost:${port}`,
      reuseExistingServer: true,
      timeout: 120000,
      cwd: appDir,
    },
  });
}

export { createConfig };
export default createConfig;
