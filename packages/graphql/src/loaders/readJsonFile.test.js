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
import readJsonFile from './readJsonFile';
import { ConfigurationError } from '../context/errors';

test('readJsonFile', async () => {
  const filePath = path.resolve(process.cwd(), 'src/test/readJsonFile.json');
  const res = await readJsonFile({ filePath });
  expect(res).toEqual({
    test: 'value',
  });
});

test('readJsonFile file not found', async () => {
  const filePath = path.resolve(process.cwd(), 'src/test/doesNotExist.json');
  const res = await readJsonFile({ filePath });
  expect(res).toEqual(null);
});

test('readJsonFile invalid json', async () => {
  const filePath = path.resolve(process.cwd(), 'src/test/readJsonFile.txt');
  await expect(readJsonFile({ filePath })).rejects.toThrow(ConfigurationError);
});
