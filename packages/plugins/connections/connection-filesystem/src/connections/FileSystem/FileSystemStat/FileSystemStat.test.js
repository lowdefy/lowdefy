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

import FileSystemStat from './FileSystemStat.js';

let basePath;

beforeAll(async () => {
  basePath = await fs.mkdtemp(path.join(os.tmpdir(), 'ldf-fs-stat-'));
  await fs.mkdir(path.join(basePath, 'sub'), { recursive: true });
  await fs.writeFile(path.join(basePath, 'hello.md'), 'Hello, world!');
});

afterAll(async () => {
  await fs.rm(basePath, { recursive: true });
});

test('FileSystemStat returns metadata for a file', async () => {
  const result = await FileSystemStat({
    connection: { basePath },
    request: { path: 'hello.md' },
  });
  expect(result.name).toBe('hello.md');
  expect(result.path).toBe('hello.md');
  expect(result.type).toBe('file');
  expect(result.size).toBe(13);
  expect(result.modified).toBeDefined();
  expect(result.created).toBeDefined();
});

test('FileSystemStat returns metadata for a directory', async () => {
  const result = await FileSystemStat({
    connection: { basePath },
    request: { path: 'sub' },
  });
  expect(result.name).toBe('sub');
  expect(result.path).toBe('sub');
  expect(result.type).toBe('directory');
});

test('FileSystemStat returns ISO date strings', async () => {
  const result = await FileSystemStat({
    connection: { basePath },
    request: { path: 'hello.md' },
  });
  expect(() => new Date(result.modified)).not.toThrow();
  expect(() => new Date(result.created)).not.toThrow();
});

test('FileSystemStat throws when path does not exist', async () => {
  await expect(
    FileSystemStat({
      connection: { basePath },
      request: { path: 'missing.md' },
    })
  ).rejects.toThrow();
});

test('FileSystemStat throws on path traversal', async () => {
  await expect(
    FileSystemStat({
      connection: { basePath },
      request: { path: '../../etc' },
    })
  ).rejects.toThrow('resolves outside the base directory');
});

test('FileSystemStat has correct meta', () => {
  expect(FileSystemStat.meta).toEqual({
    checkRead: true,
    checkWrite: false,
  });
});
