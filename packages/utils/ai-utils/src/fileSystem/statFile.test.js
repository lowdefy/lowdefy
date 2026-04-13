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

import statFile from './statFile.js';

let basePath;

beforeAll(async () => {
  basePath = await fs.mkdtemp(path.join(os.tmpdir(), 'ldf-fs-stat-'));
  await fs.mkdir(path.join(basePath, 'sub'), { recursive: true });
  await fs.writeFile(path.join(basePath, 'hello.md'), 'Hello, world!');
});

afterAll(async () => {
  await fs.rm(basePath, { recursive: true });
});

test('statFile returns metadata for a file', async () => {
  const result = await statFile(basePath, { path: 'hello.md' });
  expect(result.name).toBe('hello.md');
  expect(result.path).toBe('hello.md');
  expect(result.type).toBe('file');
  expect(result.size).toBe(13);
  expect(result.modified).toBeDefined();
  expect(result.created).toBeDefined();
});

test('statFile returns metadata for a directory', async () => {
  const result = await statFile(basePath, { path: 'sub' });
  expect(result.name).toBe('sub');
  expect(result.type).toBe('directory');
});

test('statFile throws when path does not exist', async () => {
  await expect(statFile(basePath, { path: 'missing.md' })).rejects.toThrow();
});

test('statFile throws on path traversal', async () => {
  await expect(statFile(basePath, { path: '../../etc' })).rejects.toThrow(
    'resolves outside the base directory'
  );
});
