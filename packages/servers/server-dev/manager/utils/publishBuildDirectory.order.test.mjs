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

import { jest } from '@jest/globals';

const realFs = await import('fs/promises');
const moved = [];

// readdir order is up to the file system. Listing in reverse alphabetical order puts the
// maps ahead of idCounter.json, so only an explicit order passes.
jest.unstable_mockModule('fs/promises', () => ({
  default: {
    ...realFs.default,
    readdir: async (...args) => (await realFs.default.readdir(...args)).reverse(),
    rename: async (from, to) => {
      moved.push(path.basename(to));
      return realFs.default.rename(from, to);
    },
  },
}));

const { default: publishBuildDirectory } = await import('./publishBuildDirectory.mjs');

test('publishBuildDirectory moves idCounter.json before the key and ref maps', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-publish-order-'));
  const buildDirectory = path.join(root, 'build');
  const stagingDirectory = path.join(root, 'build-staging');
  fs.mkdirSync(stagingDirectory, { recursive: true });
  ['app.json', 'idCounter.json', 'keyMap.json', 'pageRegistry.json', 'refMap.json'].forEach(
    (file) => fs.writeFileSync(path.join(stagingDirectory, file), '{}')
  );

  await publishBuildDirectory({ buildDirectory, stagingDirectory });
  fs.rmSync(root, { recursive: true, force: true });

  expect(moved[0]).toBe('idCounter.json');
  expect(moved.at(-1)).toBe('pageRegistry.json');
  expect(moved.slice(1, -1).sort()).toEqual(['app.json', 'keyMap.json', 'refMap.json']);
});
