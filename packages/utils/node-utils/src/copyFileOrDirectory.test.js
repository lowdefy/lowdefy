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
import copyFileOrDirectory from './copyFileOrDirectory.js';
import { afterEach, beforeEach, expect, test } from 'vitest';

let base;

beforeEach(() => {
  base = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-copy-'));
});

afterEach(() => {
  fs.rmSync(base, { recursive: true, force: true });
});

test('copy directory', async () => {
  const dirPathFrom = path.resolve(process.cwd(), 'test/copyDirectory/from/');
  const dirPathTo = path.resolve(process.cwd(), 'test/copyDirectory/to/');
  const filePathFrom = path.resolve(dirPathFrom, 'copyDirectory.txt');
  const filePathTo = path.resolve(dirPathTo, 'copyDirectory.txt');

  fs.mkdirSync(dirPathFrom, {
    recursive: true,
  });
  fs.writeFileSync(filePathFrom, 'copyDirectory');

  await copyFileOrDirectory(dirPathFrom, dirPathTo);
  expect(fs.existsSync(filePathTo)).toBe(true);
});

test('copy file', async () => {
  const dirPathFrom = path.resolve(process.cwd(), 'test/copyFile/from/');
  const dirPathTo = path.resolve(process.cwd(), 'test/copyFile/to/');
  const filePathFrom = path.resolve(dirPathFrom, 'copyFile.txt');
  const filePathTo = path.resolve(dirPathTo, 'copyFile.txt');

  fs.mkdirSync(dirPathFrom, {
    recursive: true,
  });
  fs.writeFileSync(filePathFrom, 'copyFile');

  await copyFileOrDirectory(filePathFrom, filePathTo);
  expect(fs.existsSync(filePathTo)).toBe(true);
});

test('copy directory merges into an existing directory and overwrites files', async () => {
  const dirPathFrom = path.resolve(base, 'from');
  const dirPathTo = path.resolve(base, 'to');
  fs.mkdirSync(path.resolve(dirPathFrom, 'nested'), { recursive: true });
  fs.mkdirSync(dirPathTo, { recursive: true });
  fs.writeFileSync(path.resolve(dirPathFrom, 'shared.txt'), 'from');
  fs.writeFileSync(path.resolve(dirPathFrom, 'nested', 'deep.txt'), 'deep');
  fs.writeFileSync(path.resolve(dirPathTo, 'shared.txt'), 'to');
  fs.writeFileSync(path.resolve(dirPathTo, 'kept.txt'), 'kept');

  await copyFileOrDirectory(dirPathFrom, dirPathTo);
  expect(fs.readFileSync(path.resolve(dirPathTo, 'shared.txt'), 'utf8')).toBe('from');
  expect(fs.readFileSync(path.resolve(dirPathTo, 'kept.txt'), 'utf8')).toBe('kept');
  expect(fs.readFileSync(path.resolve(dirPathTo, 'nested', 'deep.txt'), 'utf8')).toBe('deep');
});

test('copy file creates missing parent directories', async () => {
  const filePathFrom = path.resolve(base, 'from.txt');
  const filePathTo = path.resolve(base, 'a', 'b', 'to.txt');
  fs.writeFileSync(filePathFrom, 'parents');

  await copyFileOrDirectory(filePathFrom, filePathTo);
  expect(fs.readFileSync(filePathTo, 'utf8')).toBe('parents');
});

test('copy directory keeps a relative symlink relative', async () => {
  const dirPathFrom = path.resolve(base, 'from');
  const dirPathTo = path.resolve(base, 'to');
  fs.mkdirSync(dirPathFrom, { recursive: true });
  fs.writeFileSync(path.resolve(dirPathFrom, 'target.txt'), 'target');
  fs.symlinkSync('target.txt', path.resolve(dirPathFrom, 'link.txt'));

  await copyFileOrDirectory(dirPathFrom, dirPathTo);
  expect(fs.readlinkSync(path.resolve(dirPathTo, 'link.txt'))).toBe('target.txt');
  expect(fs.readFileSync(path.resolve(dirPathTo, 'link.txt'), 'utf8')).toBe('target');
});
