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

import { afterEach, expect, test } from 'vitest';

import findAccessSnapshotTest from './findAccessSnapshotTest.js';

const configDirectories = [];

function makeApp(files) {
  const config = fs.mkdtempSync(path.join(os.tmpdir(), 'access-snapshot-'));
  configDirectories.push(config);
  Object.entries(files).forEach(([file, content]) => {
    const filePath = path.join(config, file);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content);
  });
  return { config };
}

afterEach(() => {
  configDirectories.splice(0).forEach((config) => fs.rmSync(config, { recursive: true }));
});

test('findAccessSnapshotTest returns null when the app has no tests/endpoints folder', () => {
  expect(findAccessSnapshotTest({ directories: makeApp({}) })).toBe(null);
});

test('findAccessSnapshotTest returns null when no endpoint test calls accessMatrix', () => {
  const directories = makeApp({
    'tests/endpoints/orders.test.mjs': "await session.as('admin').call('orders-create', {});",
  });
  expect(findAccessSnapshotTest({ directories })).toBe(null);
});

test('findAccessSnapshotTest returns the test file that calls accessMatrix, from a nested folder', () => {
  const directories = makeApp({
    'tests/endpoints/orders.test.mjs': "await session.as('admin').call('orders-create', {});",
    'tests/endpoints/access/access.test.mjs':
      "t.assert.snapshot(await app.accessMatrix({ data: 'roles' }));",
  });
  expect(findAccessSnapshotTest({ directories })).toBe('tests/endpoints/access/access.test.mjs');
});

test('findAccessSnapshotTest ignores files that are not tests, such as the snapshot itself', () => {
  const directories = makeApp({
    'tests/endpoints/access.test.mjs.snapshot': 'accessMatrix(',
    'tests/endpoints/helpers.mjs': 'accessMatrix(',
  });
  expect(findAccessSnapshotTest({ directories })).toBe(null);
});
