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

import { afterEach, beforeEach, expect, test } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';

import readAccessFile from './readAccessFile.js';
import writeAccessFile from './writeAccessFile.js';

let configDirectory;

beforeEach(() => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-access-file-'));
});

afterEach(() => {
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

function writeRaw(content) {
  const filePath = path.join(configDirectory, 'tests', 'access.yaml');
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

test('writeAccessFile writes one row per line that readAccessFile reads back', () => {
  const table = {
    data: 'roles',
    pages: { billing: { finance: 'allow', 'no-role': 'deny', none: 'deny' } },
    endpoints: { approve: { finance: 'allow', 'no-role': 'deny', none: 'deny' } },
  };
  writeAccessFile({ configDirectory, table });
  const text = fs.readFileSync(path.join(configDirectory, 'tests', 'access.yaml'), 'utf8');
  expect(text).toContain('\ndata: roles\npages:\n');
  expect(text).toContain('  billing: { finance: allow, no-role: deny, none: deny }\n');
  expect(text).toContain('  approve: { finance: allow, no-role: deny, none: deny }\n');
  expect(readAccessFile({ configDirectory })).toEqual({ exists: true, table });
});

test('readAccessFile answers exists false when the app has no access file', () => {
  expect(readAccessFile({ configDirectory })).toEqual({ exists: false });
});

test('readAccessFile refuses a file without a data set name', () => {
  writeRaw('pages: {}\n');
  expect(readAccessFile({ configDirectory }).error).toBe(
    'tests/access.yaml "data" should be the name of the data set in tests/data whose users the table is checked as. Received undefined.'
  );
});

test('readAccessFile refuses a row that is not a map of outcomes', () => {
  writeRaw('data: roles\npages:\n  billing: allow\n');
  expect(readAccessFile({ configDirectory }).error).toBe(
    'tests/access.yaml "pages.billing" should map each caller to allow, deny or enrol_required. Received "allow".'
  );
});

test('readAccessFile refuses a cell that is not allow, deny or enrol_required', () => {
  writeRaw('data: roles\npages:\n  billing: { finance: alow }\n');
  expect(readAccessFile({ configDirectory }).error).toBe(
    'tests/access.yaml "pages.billing" should map each caller to allow, deny or enrol_required. Received {"finance":"alow"}.'
  );
});

test('readAccessFile says a file it can not read could not be read, not that it is bad YAML', () => {
  fs.mkdirSync(path.join(configDirectory, 'tests', 'access.yaml'), { recursive: true });
  expect(readAccessFile({ configDirectory }).error).toMatch(
    /^tests\/access\.yaml could not be read\. /
  );
});
