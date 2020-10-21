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
import getFile from './getFile';

const baseDir = path.resolve(process.cwd(), 'src/test/getFile');

test('getFile jsonFile.json', async () => {
  const filePath = path.resolve(baseDir, 'jsonFile.json');
  const file = await getFile(filePath);
  expect(file).toEqual({
    filePath,
    content: {
      fileName: 'jsonFile.json',
      test: true,
    },
  });
});

test('getFile yamlFile.yaml', async () => {
  const filePath = path.resolve(baseDir, 'yamlFile.yaml');
  const file = await getFile(filePath);
  expect(file).toEqual({
    filePath,
    content: {
      fileName: 'yamlFile.yaml',
      test: true,
    },
  });
});

test('getFile ymlFile.yml', async () => {
  const filePath = path.resolve(baseDir, 'ymlFile.yml');
  const file = await getFile(filePath);
  expect(file).toEqual({
    filePath,
    content: {
      fileName: 'ymlFile.yml',
      test: true,
    },
  });
});

test('getFile markdown.md', async () => {
  const filePath = path.resolve(baseDir, 'markdown.md');
  const file = await getFile(filePath);
  expect(file).toEqual({
    filePath,
    content: `### Markdown title

Markdown body
`,
  });
});

test('getFile html.html', async () => {
  const filePath = path.resolve(baseDir, 'html.html');
  const file = await getFile(filePath);
  expect(file).toEqual({
    filePath,
    content: `<h1>HTML Heading</h1>
<p>Paragraph</p>
`,
  });
});

test('getFile text.txt', async () => {
  const filePath = path.resolve(baseDir, 'text.txt');
  const file = await getFile(filePath);
  expect(file).toEqual({
    filePath,
    content: `This is a txt file.`,
  });
});

test('getFile doesNotExist.txt', async () => {
  const filePath = path.resolve(baseDir, 'doesNotExist.txt');
  // Since error message contains exact file path, test if parts of error message are present
  await expect(getFile(filePath)).rejects.toThrow('Tried to read file with file path');
  await expect(getFile(filePath)).rejects.toThrow(
    'src/test/getFile/doesNotExist.txt", but file does not exist'
  );
});

test('getFile null', async () => {
  await expect(getFile(null)).rejects.toThrow(
    'Tried to read file with file path null, but file path should be a string'
  );
});
