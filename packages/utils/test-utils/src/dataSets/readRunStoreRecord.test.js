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

import readRunStoreRecord from './readRunStoreRecord.js';
import writeRunStoreRecord from './writeRunStoreRecord.js';

let directory;
let recordPath;

beforeEach(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-run-store-'));
  recordPath = path.join(directory, 'data-store-1.json');
});

afterEach(() => {
  fs.rmSync(directory, { recursive: true, force: true });
});

test('readRunStoreRecord returns null when there is no record', () => {
  expect(readRunStoreRecord({ recordPath })).toBeNull();
});

test('readRunStoreRecord returns null for a record that was created and not yet written', () => {
  fs.writeFileSync(recordPath, '');
  expect(readRunStoreRecord({ recordPath })).toBeNull();
});

test('readRunStoreRecord reads the record writeRunStoreRecord wrote, which leaves no temporary file', () => {
  const record = { ownerPid: 1, keeperPid: 2, token: 'abc', uri: 'mongodb://127.0.0.1:50000/' };
  writeRunStoreRecord({ recordPath, record });
  expect(readRunStoreRecord({ recordPath })).toEqual(record);
  expect(fs.readdirSync(directory)).toEqual(['data-store-1.json']);
});
