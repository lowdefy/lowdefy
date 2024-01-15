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

import fs from 'fs';
import path from 'path';
import cleanDirectory from './cleanDirectory.js';

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

test('cleanDirectory does not throw when dir does not exist', async () => {
  const dirPath = path.resolve(process.cwd(), 'src/test/doesNotExist');
  const res = await cleanDirectory(dirPath);
  expect(res).toBe(undefined);
});
