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

import fs from 'fs/promises';
import os from 'os';
import path from 'path';

import readFile from './readFile.js';

let basePath;

beforeAll(async () => {
  basePath = await fs.mkdtemp(path.join(os.tmpdir(), 'ldf-fs-read-'));
  await fs.mkdir(path.join(basePath, 'sub'), { recursive: true });
  await fs.writeFile(path.join(basePath, 'hello.md'), 'Hello, world!');
  await fs.writeFile(path.join(basePath, 'sub', 'nested.txt'), 'Nested content');
});

afterAll(async () => {
  await fs.rm(basePath, { recursive: true });
});

test('readFile reads a file at the root', async () => {
  const result = await readFile(basePath, { path: 'hello.md' });
  expect(result).toBe('Hello, world!');
});

test('readFile reads a nested file', async () => {
  const result = await readFile(basePath, { path: 'sub/nested.txt' });
  expect(result).toBe('Nested content');
});

test('readFile throws when file does not exist', async () => {
  await expect(readFile(basePath, { path: 'missing.md' })).rejects.toThrow();
});

test('readFile throws on path traversal', async () => {
  await expect(readFile(basePath, { path: '../../../etc/passwd' })).rejects.toThrow(
    'resolves outside the base directory'
  );
});
