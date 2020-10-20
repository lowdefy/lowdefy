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
import readFile from './readFile';

test('readFile', async () => {
  const filePath = path.resolve(process.cwd(), 'src/test/readFile.txt');
  const res = await readFile(filePath);
  expect(res).toEqual(`/*
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

Test File`);
});

test('readFile file not found throws', async () => {
  const filePath = path.resolve(process.cwd(), 'src/test/doesNotExist.txt');
  // Since error message contains exact file path, test if parts of error message are present
  await expect(readFile(filePath)).rejects.toThrow('Tried to read file with file path');
  await expect(readFile(filePath)).rejects.toThrow(
    'src/test/doesNotExist.txt", but file does not exist'
  );
});

test('readFile error', async () => {
  const filePath = path.resolve(process.cwd(), 'src/test/');
  await expect(readFile(filePath)).rejects.toThrow(
    'EISDIR: illegal operation on a directory, read'
  );
});
