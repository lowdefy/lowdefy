/*
  Copyright 2020 Lowdefy, Inc

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

import path from 'path';
import createFileLoader from './fileLoader';

const baseDir = path.resolve(process.cwd(), 'src/test/fileLoader');

test('load file', async () => {
  const fileLoader = createFileLoader({ baseDir });
  const res = await fileLoader.load('fileLoader1.txt');
  expect(res).toEqual('File loader text file 1.');
});

test('load two files', async () => {
  const fileLoader = createFileLoader({ baseDir });
  const files = ['fileLoader1.txt', 'fileLoader2.txt'];
  const res = await Promise.all(files.map((file) => fileLoader.load(file)));
  expect(res).toEqual(['File loader text file 1.', 'File loader text file 2.']);
});

test('load two files, one file errors', async () => {
  const fileLoader = createFileLoader({ baseDir });
  const files = ['fileLoader1.txt', 'doesNotExist.txt'];
  await expect(Promise.all(files.map((file) => fileLoader.load(file)))).rejects.toThrow(
    'src/test/fileLoader/doesNotExist.txt", but file does not exist'
  );
});

test('load file, file does not exist', async () => {
  const filePath = path.resolve(baseDir, 'doesNotExist.txt');
  const fileLoader = createFileLoader({ baseDir });
  // Since error message contains exact file path, test if parts of error message are present
  await expect(fileLoader.load(filePath)).rejects.toThrow('Tried to read file with file path');
  await expect(fileLoader.load(filePath)).rejects.toThrow(
    'src/test/fileLoader/doesNotExist.txt", but file does not exist'
  );
});
