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

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, expect, test } from 'vitest';

import claimRunStore from './claimRunStore.js';
import readRunStoreRecord from './readRunStoreRecord.js';

let directory;
let recordPath;

beforeEach(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-run-store-'));
  // In a folder that does not exist yet, as on a machine's first run.
  recordPath = path.join(directory, 'lowdefy-test-utils', 'data-store-7.json');
});

afterEach(() => {
  fs.rmSync(directory, { recursive: true, force: true });
});

test('claimRunStore writes the claim and returns its token to the first caller only', () => {
  const token = claimRunStore({ ownerPid: 7, recordPath });
  expect(token).toMatch(/^[0-9a-f]{16}$/);
  expect(readRunStoreRecord({ recordPath })).toEqual({
    ownerPid: 7,
    starterPid: process.pid,
    keeperPid: null,
    token,
    uri: null,
  });
  expect(claimRunStore({ ownerPid: 7, recordPath })).toBeNull();
  expect(readRunStoreRecord({ recordPath }).token).toEqual(token);
});
