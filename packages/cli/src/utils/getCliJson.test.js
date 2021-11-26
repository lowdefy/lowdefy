/*
  Copyright 2020-2021 Lowdefy, Inc

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

// eslint-disable-next-line no-unused-vars

import path from 'path';
// eslint-disable-next-line no-unused-vars
import { v4 as uuid } from 'uuid';
import { readFile, writeFile } from '@lowdefy/node-utils';
import getCliJson from './getCliJson.js';

jest.mock('@lowdefy/node-utils', () => {
  const readFile = jest.fn();
  const writeFile = jest.fn();
  return {
    readFile,
    writeFile,
  };
});

jest.mock('uuid', () => ({
  v4: () => 'uuidv4',
}));

const baseDirectory = process.cwd();

test('getCliJson, no file exists', async () => {
  readFile.mockImplementation(() => {
    return null;
  });
  const res = await getCliJson({ baseDirectory });
  expect(res).toEqual({ appId: 'uuidv4' });
  expect(writeFile.mock.calls).toEqual([
    [
      {
        content: `{
  "appId": "uuidv4"
}`,
        filePath: path.resolve(process.cwd(), '.lowdefy/cli.json'),
      },
    ],
  ]);
});

test('getCliJson, no file exists', async () => {
  readFile.mockImplementation((filePath) => {
    if (filePath === path.resolve(process.cwd(), '.lowdefy/cli.json')) {
      return `{"appId": "appId"}`;
    }
  });
  const res = await getCliJson({ baseDirectory });
  expect(res).toEqual({ appId: 'appId' });
  expect(writeFile.mock.calls).toEqual([]);
});
