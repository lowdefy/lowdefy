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

import getDevInstancePath from './getDevInstancePath.js';
import readDevInstance from './readDevInstance.js';

let configDirectory;

beforeEach(() => {
  configDirectory = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-instance-')));
  fs.mkdirSync(path.join(configDirectory, '.lowdefy'));
});

afterEach(() => {
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

function writeRecord(record) {
  fs.writeFileSync(getDevInstancePath({ configDirectory }), JSON.stringify(record));
}

test('readDevInstance returns null when no instance record exists', () => {
  expect(readDevInstance({ configDirectory })).toBe(null);
});

test('readDevInstance returns the record when it names this directory and its pid is alive', () => {
  const record = { pid: process.pid, configDirectory, port: 4100 };
  writeRecord(record);
  expect(readDevInstance({ configDirectory })).toEqual(record);
});

test('readDevInstance ignores a record copied from another checkout', () => {
  writeRecord({ pid: process.pid, configDirectory: '/somewhere/else', port: 4100 });
  expect(readDevInstance({ configDirectory })).toBe(null);
});

test('readDevInstance ignores a record whose process has exited', () => {
  writeRecord({ pid: 2 ** 22 + 12345, configDirectory, port: 4100 });
  expect(readDevInstance({ configDirectory })).toBe(null);
});

test('readDevInstance returns null for an unreadable record', () => {
  fs.writeFileSync(getDevInstancePath({ configDirectory }), '{ not json');
  expect(readDevInstance({ configDirectory })).toBe(null);
});
