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
import os from 'os';
import path from 'path';

import waitForBuild from './waitForBuild.js';

let configDirectory;
const originalConfigDirectory = process.env.LOWDEFY_DIRECTORY_CONFIG;

function writeInstance({ building }) {
  fs.writeFileSync(
    path.join(configDirectory, '.lowdefy', 'instance.json'),
    JSON.stringify({ pid: process.pid, configDirectory, state: 'ready', building })
  );
}

beforeEach(() => {
  configDirectory = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'wait-for-build-')));
  fs.mkdirSync(path.join(configDirectory, '.lowdefy'));
  process.env.LOWDEFY_DIRECTORY_CONFIG = configDirectory;
});

afterEach(() => {
  process.env.LOWDEFY_DIRECTORY_CONFIG = originalConfigDirectory;
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

test('waitForBuild waits until the manager has processed the pending change', async () => {
  writeInstance({ building: true });
  setTimeout(() => writeInstance({ building: false }), 150);
  const result = await waitForBuild({ intervalMs: 10 });
  expect(result).toMatchObject({ settled: true, sawBuild: true });
  expect(result.waitedMs).toBeGreaterThanOrEqual(140);
});

test('waitForBuild catches a change the watcher sees just after the call', async () => {
  writeInstance({ building: false });
  setTimeout(() => writeInstance({ building: true }), 50);
  setTimeout(() => writeInstance({ building: false }), 200);
  const result = await waitForBuild({ intervalMs: 10, graceMs: 500 });
  expect(result).toMatchObject({ settled: true, sawBuild: true });
  expect(result.waitedMs).toBeGreaterThanOrEqual(190);
});

test('waitForBuild returns after the grace window when nothing is pending', async () => {
  writeInstance({ building: false });
  const result = await waitForBuild({ intervalMs: 10, graceMs: 100 });
  expect(result).toMatchObject({ settled: true, sawBuild: false });
});

test('waitForBuild gives up after the timeout and says so', async () => {
  writeInstance({ building: true });
  const result = await waitForBuild({ intervalMs: 10, graceMs: 10, timeoutMs: 100 });
  expect(result.settled).toBe(false);
});
