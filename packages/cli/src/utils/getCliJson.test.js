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

import { jest } from '@jest/globals';
import path from 'path';

jest.unstable_mockModule('@lowdefy/node-utils', () => {
  return {
    readFile: jest.fn(),
    writeFile: jest.fn(),
  };
});

jest.unstable_mockModule('uuid', () => ({
  v4: () => 'uuidv4',
}));

const configDirectory = process.cwd();

test('getCliJson, no file exists', async () => {
  const { readFile, writeFile } = await import('@lowdefy/node-utils');
  const getCliJson = (await import('./getCliJson.js')).default;
  readFile.mockImplementation(() => {
    return null;
  });
  const res = await getCliJson({ configDirectory });
  expect(res).toEqual({ appId: 'uuidv4' });
  expect(writeFile.mock.calls).toEqual([
    [
      path.resolve(process.cwd(), '.lowdefy/cli.json'),
      `{
  "appId": "uuidv4"
}`,
    ],
  ]);
});

test('getCliJson, file exists', async () => {
  const nodeUtils = await import('@lowdefy/node-utils');
  const getCliJson = (await import('./getCliJson.js')).default;
  nodeUtils.readFile.mockImplementation((filePath) => {
    if (filePath === path.resolve(process.cwd(), '.lowdefy/cli.json')) {
      return '{"appId": "appId"}';
    }
    return null;
  });
  const res = await getCliJson({ configDirectory });
  expect(res).toEqual({ appId: 'appId' });
  expect(nodeUtils.writeFile.mock.calls).toEqual([]);
});
