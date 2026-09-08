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
import path from 'path';
import writeFileIfChanged from './writeFileIfChanged.js';

const baseDir = path.resolve(process.cwd(), 'test/writeFileIfChanged');

test('writeFileIfChanged writes when file does not exist and returns true', async () => {
  const filePath = path.resolve(baseDir, 'new-file.txt');
  try {
    fs.unlinkSync(filePath);
  } catch (error) {
    //pass
  }
  const changed = await writeFileIfChanged(filePath, 'content');
  expect(changed).toBe(true);
  expect(fs.readFileSync(filePath, 'utf8')).toEqual('content');
  fs.unlinkSync(filePath);
});

test('writeFileIfChanged skips identical content and keeps mtime stable', async () => {
  const filePath = path.resolve(baseDir, 'unchanged.txt');
  await writeFileIfChanged(filePath, 'same content');
  const statBefore = fs.statSync(filePath);
  // Filesystem mtime resolution can be coarse — ensure a measurable gap.
  await new Promise((resolve) => setTimeout(resolve, 20));
  const changed = await writeFileIfChanged(filePath, 'same content');
  const statAfter = fs.statSync(filePath);
  expect(changed).toBe(false);
  expect(statAfter.mtimeMs).toEqual(statBefore.mtimeMs);
  fs.unlinkSync(filePath);
});

test('writeFileIfChanged writes when content differs and returns true', async () => {
  const filePath = path.resolve(baseDir, 'changed.txt');
  await writeFileIfChanged(filePath, 'old content');
  const changed = await writeFileIfChanged(filePath, 'new content');
  expect(changed).toBe(true);
  expect(fs.readFileSync(filePath, 'utf8')).toEqual('new content');
  fs.unlinkSync(filePath);
});
