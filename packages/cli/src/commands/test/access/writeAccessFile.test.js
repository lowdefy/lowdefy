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
