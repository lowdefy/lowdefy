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

import searchFiles from './searchFiles.js';

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

test('searchFiles finds matches across files', async () => {
  const result = await searchFiles(basePath, { query: 'governance' });
  expect(result.length).toBe(2);
});

test('searchFiles is case-insensitive', async () => {
  const result = await searchFiles(basePath, { query: 'GOVERNANCE' });
  expect(result.length).toBe(2);
});

test('searchFiles returns line numbers and context', async () => {
  const result = await searchFiles(basePath, { query: 'governance' });
  const readme = result.find((r) => r.path === 'readme.md');
  expect(readme.matches).toHaveLength(1);
  expect(readme.matches[0].lineNumber).toBe(2);
  expect(readme.matches[0].line).toBe('Governance is key');
  expect(readme.matches[0].context.before).toBe('line one');
  expect(readme.matches[0].context.after).toBe('line three');
});

test('searchFiles with glob filter', async () => {
  const result = await searchFiles(basePath, { query: 'governance', glob: 'docs/**/*.md' });
  expect(result.length).toBe(1);
  expect(result[0].path).toBe(path.join('docs', 'guide.md'));
});

test('searchFiles returns empty array when no matches', async () => {
  const result = await searchFiles(basePath, { query: 'nonexistent-term-xyz' });
  expect(result).toEqual([]);
});
