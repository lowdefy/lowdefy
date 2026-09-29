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

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, devices } from '@playwright/test';

const benchDir = path.dirname(fileURLToPath(import.meta.url));
// Worktrees share the machine: move the port with LOWDEFY_BENCH_PORT.
const port = Number(process.env.LOWDEFY_BENCH_PORT ?? 3116);
const viteConfig = path.join(benchDir, 'vite.config.mjs');

// D10 bench suite: Chromium only, 1440x900 at DPR 1, one worker so runs never share the CPU.
export default defineConfig({
  testDir: path.join(benchDir, 'tests'),
  testMatch: ['*.bench.js'],
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 10 * 60 * 1000,
  reporter: 'list',
  outputDir: path.join(benchDir, 'results', 'test-output'),
  use: {
    ...devices['Desktop Chrome'],
    baseURL: `http://localhost:${port}`,
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  },
  webServer: {
    command: `vite build --config ${viteConfig} && vite preview --config ${viteConfig} --port ${port} --strictPort`,
    url: `http://localhost:${port}`,
    reuseExistingServer: false,
    timeout: 180000,
  },
});
