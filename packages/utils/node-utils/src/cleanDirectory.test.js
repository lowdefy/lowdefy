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
import cleanDirectory from './cleanDirectory.js';
import { afterEach, beforeEach, expect, test } from 'vitest';

let base;

beforeEach(() => {
  base = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-clean-'));
});

afterEach(() => {
  fs.rmSync(base, { recursive: true, force: true });
});

test('cleanDirectory', async () => {
  const dirPath = path.resolve(process.cwd(), 'test/cleanDirectory/');
  const filePath1 = path.resolve(dirPath, 'cleanDirectory.txt');
  const filePath2 = path.resolve(dirPath, 'subdirectory/cleanDirectory.txt');

  fs.mkdirSync(path.resolve(dirPath, 'subdirectory/'), {
    recursive: true,
  });
  fs.mkdirSync(dirPath, {
    recursive: true,
  });
  fs.writeFileSync(filePath1, 'cleanDirectory');
  fs.writeFileSync(filePath2, 'cleanDirectory');

  await cleanDirectory(dirPath);
  expect(fs.existsSync(filePath1)).toBe(false);
  expect(fs.existsSync(filePath2)).toBe(false);
});

test('cleanDirectory empties the directory in place', async () => {
  const dirPath = path.resolve(base, 'inPlace');
  fs.mkdirSync(path.resolve(dirPath, 'subdirectory/'), { recursive: true });
  fs.writeFileSync(path.resolve(dirPath, '.dotfile'), 'cleanDirectory');
  fs.chmodSync(dirPath, 0o700);
  const before = fs.statSync(dirPath);

  await cleanDirectory(dirPath);
  const after = fs.statSync(dirPath);
  expect(fs.readdirSync(dirPath)).toEqual([]);
  expect(after.ino).toBe(before.ino);
  expect(after.mode).toBe(before.mode);
});

test('cleanDirectory creates the directory when it does not exist', async () => {
  const dirPath = path.resolve(base, 'missing', 'nested');
  const res = await cleanDirectory(dirPath);
  expect(res).toBe(undefined);
  expect(fs.readdirSync(dirPath)).toEqual([]);
});
