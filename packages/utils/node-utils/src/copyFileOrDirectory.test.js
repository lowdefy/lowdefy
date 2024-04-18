/*
  Copyright 2020-2024 Lowdefy, Inc

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

import fs from 'fs-extra';
import path from 'path';
import copyFileOrDirectory from './copyFileOrDirectory.js';

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
