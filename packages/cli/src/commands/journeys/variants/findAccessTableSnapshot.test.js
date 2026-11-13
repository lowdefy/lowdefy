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
import { afterEach, beforeEach, expect, test } from 'vitest';

import findAccessTableSnapshot from './findAccessTableSnapshot.js';

let configDirectory;

beforeEach(() => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-access-snapshot-'));
  fs.mkdirSync(path.join(configDirectory, 'tests', 'endpoints'), { recursive: true });
});

afterEach(() => {
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

function write(fileName, content) {
  fs.writeFileSync(path.join(configDirectory, 'tests', 'endpoints', fileName), content);
}

test('findAccessTableSnapshot finds the committed snapshot of a test that calls accessMatrix', () => {
  write('access.test.mjs', "t.assert.snapshot(await app.accessMatrix({ data: 'roles' }));");
  write('access.test.mjs.snapshot', 'exports[`who can reach what 1`] = `{}`;');
  expect(findAccessTableSnapshot({ configDirectory })).toBe(
    'tests/endpoints/access.test.mjs.snapshot'
  );
});

test('findAccessTableSnapshot is null without a snapshot, or for a snapshot of another test', () => {
  expect(findAccessTableSnapshot({ configDirectory })).toBeNull();
  write('access.test.mjs', "t.assert.snapshot(await app.accessMatrix({ data: 'roles' }));");
  expect(findAccessTableSnapshot({ configDirectory })).toBeNull();
  write('orders.test.mjs', 't.assert.snapshot(await session.call("orders"));');
  write('orders.test.mjs.snapshot', 'exports[`orders 1`] = `{}`;');
  expect(findAccessTableSnapshot({ configDirectory })).toBeNull();
  expect(
    findAccessTableSnapshot({ configDirectory: path.join(configDirectory, 'none') })
  ).toBeNull();
});
