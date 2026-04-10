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

import FileSystemRead from './FileSystemRead.js';

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

test('FileSystemRead reads a file at the root', async () => {
  const result = await FileSystemRead({
    connection: { basePath },
    request: { path: 'hello.md' },
  });
  expect(result).toBe('Hello, world!');
});

test('FileSystemRead reads a nested file', async () => {
  const result = await FileSystemRead({
    connection: { basePath },
    request: { path: 'sub/nested.txt' },
  });
  expect(result).toBe('Nested content');
});

test('FileSystemRead throws when file does not exist', async () => {
  await expect(
    FileSystemRead({
      connection: { basePath },
      request: { path: 'missing.md' },
    })
  ).rejects.toThrow();
});

test('FileSystemRead throws on path traversal', async () => {
  await expect(
    FileSystemRead({
      connection: { basePath },
      request: { path: '../../../etc/passwd' },
    })
  ).rejects.toThrow('resolves outside the base directory');
});

test('FileSystemRead has correct meta', () => {
  expect(FileSystemRead.meta).toEqual({
    checkRead: true,
    checkWrite: false,
  });
});

test('FileSystemRead has schema', () => {
  expect(FileSystemRead.schema).toBeDefined();
  expect(FileSystemRead.schema.properties.path).toBeDefined();
});
