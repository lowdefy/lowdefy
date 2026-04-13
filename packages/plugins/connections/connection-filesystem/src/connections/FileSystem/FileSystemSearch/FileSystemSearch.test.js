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

import FileSystemSearch from './FileSystemSearch.js';

let basePath;

beforeAll(async () => {
  basePath = await fs.mkdtemp(path.join(os.tmpdir(), 'ldf-fs-search-'));
  await fs.mkdir(path.join(basePath, 'docs'), { recursive: true });
  await fs.writeFile(path.join(basePath, 'readme.md'), 'line one\nGovernance is key\nline three');
  await fs.writeFile(
    path.join(basePath, 'docs', 'guide.md'),
    'first\nGovernance principles\nthird\nfourth'
  );
  await fs.writeFile(path.join(basePath, 'data.txt'), 'no match here\njust data');
});

afterAll(async () => {
  await fs.rm(basePath, { recursive: true });
});

test('FileSystemSearch finds matches across files', async () => {
  const result = await FileSystemSearch({
    connection: { basePath },
    request: { query: 'governance' },
  });
  expect(result.length).toBe(2);
  const paths = result.map((r) => r.path);
  expect(paths).toContain(path.join('docs', 'guide.md'));
  expect(paths).toContain('readme.md');
});

test('FileSystemSearch is case-insensitive', async () => {
  const result = await FileSystemSearch({
    connection: { basePath },
    request: { query: 'GOVERNANCE' },
  });
  expect(result.length).toBe(2);
});

test('FileSystemSearch returns line numbers and context', async () => {
  const result = await FileSystemSearch({
    connection: { basePath },
    request: { query: 'governance' },
  });
  const readme = result.find((r) => r.path === 'readme.md');
  expect(readme.matches).toHaveLength(1);
  expect(readme.matches[0].lineNumber).toBe(2);
  expect(readme.matches[0].line).toBe('Governance is key');
  expect(readme.matches[0].context.before).toBe('line one');
  expect(readme.matches[0].context.after).toBe('line three');
});

test('FileSystemSearch with glob filter', async () => {
  const result = await FileSystemSearch({
    connection: { basePath },
    request: { query: 'governance', glob: 'docs/**/*.md' },
  });
  expect(result.length).toBe(1);
  expect(result[0].path).toBe(path.join('docs', 'guide.md'));
});

test('FileSystemSearch returns empty array when no matches', async () => {
  const result = await FileSystemSearch({
    connection: { basePath },
    request: { query: 'nonexistent-term-xyz' },
  });
  expect(result).toEqual([]);
});

test('FileSystemSearch context is null at file boundaries', async () => {
  const result = await FileSystemSearch({
    connection: { basePath },
    request: { query: 'line one' },
  });
  const readme = result.find((r) => r.path === 'readme.md');
  expect(readme.matches[0].context.before).toBeNull();
});

test('FileSystemSearch filters out glob results that escape basePath', async () => {
  const secretPath = path.join(basePath, '..', 'secret-search.txt');
  await fs.writeFile(secretPath, 'secret governance data');
  try {
    const result = await FileSystemSearch({
      connection: { basePath },
      request: { query: 'governance', glob: '../*' },
    });
    const paths = result.map((r) => r.path);
    expect(paths).not.toContain(expect.stringContaining('secret'));
  } finally {
    await fs.rm(secretPath);
  }
});

test('FileSystemSearch filters out files outside basePath even with deep traversal glob', async () => {
  const secretPath = path.join(basePath, '..', 'deep-secret.txt');
  await fs.writeFile(secretPath, 'deep secret data');
  try {
    const result = await FileSystemSearch({
      connection: { basePath },
      request: { query: 'data', glob: '../../**/*' },
    });
    const paths = result.map((r) => r.path);
    expect(paths).not.toContain(expect.stringContaining('deep-secret'));
  } finally {
    await fs.rm(secretPath);
  }
});

test('FileSystemSearch has correct meta', () => {
  expect(FileSystemSearch.meta).toEqual({
    checkRead: true,
    checkWrite: false,
  });
});
