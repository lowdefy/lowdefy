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

import { jest } from '@jest/globals';
import fs from 'fs';
import os from 'os';
import path from 'path';

import writePluginChecksPending from './writePluginChecksPending.js';

let buildDir;

beforeEach(() => {
  buildDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-plugin-checks-pending-'));
});

afterEach(() => {
  fs.rmSync(buildDir, { recursive: true, force: true });
});

test('writePluginChecksPending writes the pending packages', async () => {
  const writeBuildArtifact = jest.fn();
  await writePluginChecksPending({
    context: { directories: { build: buildDir }, writeBuildArtifact },
    packages: ['@lowdefy/a', '@lowdefy/b'],
  });
  expect(writeBuildArtifact.mock.calls).toEqual([
    [
      'plugin-checks-pending.json',
      JSON.stringify({ packages: ['@lowdefy/a', '@lowdefy/b'] }, null, 2),
    ],
  ]);
});

test('writePluginChecksPending removes the file when no package is pending', async () => {
  const filePath = path.join(buildDir, 'plugin-checks-pending.json');
  fs.writeFileSync(filePath, '{ "packages": ["@lowdefy/a"] }');
  const writeBuildArtifact = jest.fn();
  await writePluginChecksPending({
    context: { directories: { build: buildDir }, writeBuildArtifact },
    packages: [],
  });
  expect(writeBuildArtifact).not.toHaveBeenCalled();
  expect(fs.existsSync(filePath)).toBe(false);
});

test('writePluginChecksPending does nothing in a check run', async () => {
  const filePath = path.join(buildDir, 'plugin-checks-pending.json');
  fs.writeFileSync(filePath, '{ "packages": ["@lowdefy/a"] }');
  await writePluginChecksPending({
    context: { directories: { build: buildDir }, validateOnly: true },
    packages: [],
  });
  expect(fs.existsSync(filePath)).toBe(true);
});
