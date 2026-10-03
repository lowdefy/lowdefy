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
import { jest } from '@jest/globals';

import writeFileAtomic from './writeFileAtomic.js';

let directory;

beforeEach(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'writeFileAtomic-'));
});

afterEach(() => {
  fs.rmSync(directory, { recursive: true, force: true });
});

test('writeFileAtomic writes the content and creates missing directories', async () => {
  const filePath = path.join(directory, 'nested', 'file.json');
  await writeFileAtomic(filePath, '{"a":1}');
  expect(fs.readFileSync(filePath, 'utf8')).toEqual('{"a":1}');
  expect(fs.readdirSync(path.dirname(filePath))).toEqual(['file.json']);
});

test('writeFileAtomic never exposes the target before the whole content is written', async () => {
  const filePath = path.join(directory, 'file.json');
  const content = 'x'.repeat(1024 * 1024);
  const writeFile = fs.promises.writeFile;
  const seen = [];
  const spy = jest.spyOn(fs.promises, 'writeFile').mockImplementation(async (...args) => {
    await writeFile(...args);
    seen.push(fs.existsSync(filePath));
  });
  try {
    await writeFileAtomic(filePath, content);
  } finally {
    spy.mockRestore();
  }
  expect(seen).toEqual([false]);
  expect(fs.readFileSync(filePath, 'utf8')).toEqual(content);
});

test('writeFileAtomic removes its temporary file when the rename fails', async () => {
  const filePath = path.join(directory, 'target');
  fs.mkdirSync(path.join(filePath, 'child'), { recursive: true });
  await expect(writeFileAtomic(filePath, 'content')).rejects.toThrow();
  expect(fs.readdirSync(directory)).toEqual(['target']);
});
