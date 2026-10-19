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

import writeBuildStatus from './writeBuildStatus.mjs';

let buildDir;

beforeEach(() => {
  buildDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-build-status-test-'));
});

afterEach(() => {
  fs.rmSync(buildDir, { recursive: true, force: true });
});

function readBuildStatus() {
  return JSON.parse(fs.readFileSync(path.join(buildDir, 'buildStatus.json'), 'utf8'));
}

test('writeBuildStatus writes an ok status with a timestamp', async () => {
  await writeBuildStatus({
    directories: { build: buildDir },
    status: 'ok',
    errors: [],
    warnings: [{ message: 'Deprecated feature used' }],
  });

  const buildStatus = readBuildStatus();
  expect(buildStatus.status).toBe('ok');
  expect(buildStatus.errors).toEqual([]);
  expect(buildStatus.warnings).toEqual([{ message: 'Deprecated feature used' }]);
  expect(new Date(buildStatus.timestamp).toString()).not.toBe('Invalid Date');
});

test('writeBuildStatus writes an error status with the errors array', async () => {
  await writeBuildStatus({
    directories: { build: buildDir },
    status: 'error',
    errors: [{ message: 'Bad config' }],
    warnings: [],
  });

  const buildStatus = readBuildStatus();
  expect(buildStatus.status).toBe('error');
  expect(buildStatus.errors).toEqual([{ message: 'Bad config' }]);
});

test('writeBuildStatus creates the build directory when it does not exist', async () => {
  const missingDir = path.join(buildDir, 'nested', 'build');

  await writeBuildStatus({
    directories: { build: missingDir },
    status: 'error',
    errors: [{ message: 'Bad config' }],
    warnings: [],
  });

  expect(fs.existsSync(path.join(missingDir, 'buildStatus.json'))).toBe(true);
});
