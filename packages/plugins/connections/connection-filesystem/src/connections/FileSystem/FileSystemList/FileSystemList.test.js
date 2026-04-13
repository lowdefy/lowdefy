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

import FileSystemList from './FileSystemList.js';

let basePath;

beforeAll(async () => {
  basePath = await fs.mkdtemp(path.join(os.tmpdir(), 'ldf-fs-list-'));
  await fs.mkdir(path.join(basePath, 'principles'), { recursive: true });
  await fs.mkdir(path.join(basePath, 'templates'), { recursive: true });
  await fs.writeFile(path.join(basePath, 'index.md'), '# Index');
  await fs.writeFile(path.join(basePath, 'principles', 'p01.md'), 'Principle 1');
  await fs.writeFile(path.join(basePath, 'principles', 'p02.md'), 'Principle 2');
  await fs.writeFile(path.join(basePath, 'templates', 'charter.txt'), 'Charter');
});

afterAll(async () => {
  await fs.rm(basePath, { recursive: true });
});

test('FileSystemList lists root directory', async () => {
  const result = await FileSystemList({
    connection: { basePath },
    request: {},
  });
  const names = result.map((e) => e.name);
  expect(names).toContain('index.md');
  expect(names).toContain('principles');
  expect(names).toContain('templates');
});

test('FileSystemList lists subdirectory', async () => {
  const result = await FileSystemList({
    connection: { basePath },
    request: { path: 'principles' },
  });
  expect(result).toHaveLength(2);
  expect(result[0].name).toBe('p01.md');
  expect(result[0].type).toBe('file');
  expect(result[0].path).toBe(path.join('principles', 'p01.md'));
});

test('FileSystemList returns correct entry shape', async () => {
  const result = await FileSystemList({
    connection: { basePath },
    request: { path: 'principles' },
  });
  const entry = result[0];
  expect(entry).toHaveProperty('name');
  expect(entry).toHaveProperty('path');
  expect(entry).toHaveProperty('type');
  expect(entry).toHaveProperty('size');
  expect(typeof entry.size).toBe('number');
});

test('FileSystemList identifies directories', async () => {
  const result = await FileSystemList({
    connection: { basePath },
    request: {},
  });
  const dir = result.find((e) => e.name === 'principles');
  expect(dir.type).toBe('directory');
});

test('FileSystemList with glob pattern matches files recursively', async () => {
  const result = await FileSystemList({
    connection: { basePath },
    request: { glob: '**/*.md' },
  });
  const paths = result.map((e) => e.path);
  expect(paths).toContain('index.md');
  expect(paths).toContain(path.join('principles', 'p01.md'));
  expect(paths).toContain(path.join('principles', 'p02.md'));
  expect(paths).not.toContain(path.join('templates', 'charter.txt'));
});

test('FileSystemList with glob in subdirectory', async () => {
  const result = await FileSystemList({
    connection: { basePath },
    request: { path: 'principles', glob: '*.md' },
  });
  expect(result).toHaveLength(2);
});

test('FileSystemList throws on path traversal', async () => {
  await expect(
    FileSystemList({
      connection: { basePath },
      request: { path: '../../' },
    })
  ).rejects.toThrow('resolves outside the base directory');
});

test('FileSystemList filters out glob results that escape basePath', async () => {
  const secretPath = path.join(basePath, '..', 'secret-list.txt');
  await fs.writeFile(secretPath, 'secret data');
  try {
    const result = await FileSystemList({
      connection: { basePath },
      request: { glob: '../*' },
    });
    const names = result.map((e) => e.name);
    expect(names).not.toContain('secret-list.txt');
  } finally {
    await fs.rm(secretPath);
  }
});

test('FileSystemList filters out files outside basePath even with deep traversal glob', async () => {
  const secretPath = path.join(basePath, '..', 'deep-secret-list.txt');
  await fs.writeFile(secretPath, 'secret');
  try {
    const result = await FileSystemList({
      connection: { basePath },
      request: { glob: '../../**/*' },
    });
    const names = result.map((e) => e.name);
    expect(names).not.toContain('deep-secret-list.txt');
  } finally {
    await fs.rm(secretPath);
  }
});

test('FileSystemList has correct meta', () => {
  expect(FileSystemList.meta).toEqual({
    checkRead: true,
    checkWrite: false,
  });
});
