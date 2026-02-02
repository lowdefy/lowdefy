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
import { defineConfig, devices } from '@playwright/test';

function createPlaywrightConfig({ packageDir, port = 3001, testMatch = '**/tests/*.e2e.spec.js' }) {
  const e2eDir = path.join(packageDir, 'e2e');
  const appDir = path.join(e2eDir, 'app');
  const srcDir = path.join(packageDir, 'src');

  // Calculate paths relative to monorepo root
  // packageDir is like: /path/to/lowdefy/packages/plugins/blocks/blocks-basic
  const monorepoRoot = path.resolve(packageDir, '../../../../');
  const cliPath = path.join(monorepoRoot, 'packages/cli/dist/index.js');
  const serverDevDir = path.join(monorepoRoot, 'packages/servers/server-dev');

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
      command: `node ${cliPath} dev --config-directory ${appDir} --dev-directory ${serverDevDir} --port ${port} --no-open`,
      url: `http://localhost:${port}`,
      reuseExistingServer: true,
      timeout: 120000,
    },
  });
}

export default createPlaywrightConfig;
