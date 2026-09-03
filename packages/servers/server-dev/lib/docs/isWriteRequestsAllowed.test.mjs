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

import isWriteRequestsAllowed from './isWriteRequestsAllowed.js';

let configDirectory;
const originalEnv = { ...process.env };

beforeEach(() => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-write-gate-'));
  process.env.LOWDEFY_DIRECTORY_CONFIG = configDirectory;
  delete process.env.LOWDEFY_TEST_RUN;
});

afterEach(() => {
  fs.rmSync(configDirectory, { recursive: true, force: true });
  process.env = { ...originalEnv };
});

function writeLowdefyYaml(content) {
  fs.writeFileSync(path.join(configDirectory, 'lowdefy.yaml'), content);
}

test('isWriteRequestsAllowed refuses when the app did not opt in', async () => {
  writeLowdefyYaml('name: app\nlowdefy: 5.0.0\n');
  await expect(isWriteRequestsAllowed()).resolves.toBe(false);
});

test('isWriteRequestsAllowed allows writes when the app opted in', async () => {
  writeLowdefyYaml('name: app\ncli:\n  agentTools:\n    allowWriteRequests: true\n');
  await expect(isWriteRequestsAllowed()).resolves.toBe(true);
});

test('isWriteRequestsAllowed allows writes for a server the test runner started', async () => {
  // The committed config stays fail-closed; the allowance lives in the
  // environment of a server `lowdefy test` owns for one run.
  writeLowdefyYaml('name: app\nlowdefy: 5.0.0\n');
  process.env.LOWDEFY_TEST_RUN = '1';
  await expect(isWriteRequestsAllowed()).resolves.toBe(true);
});

test('isWriteRequestsAllowed refuses when there is no lowdefy.yaml', async () => {
  await expect(isWriteRequestsAllowed()).resolves.toBe(false);
});
