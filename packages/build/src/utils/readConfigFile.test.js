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
  };
});

const directories = { config: './config' };

test('readConfigFile reads a file from the correct dir', async () => {
  const nodeUtils = await import('@lowdefy/node-utils');
  const createReadConfigFile = await import('./readConfigFile.js');
  const readConfigFile = createReadConfigFile.default({ directories });
  nodeUtils.readFile.mockImplementation(() => 'Text file content');
  const res = await readConfigFile('file.txt');
  expect(res).toEqual('Text file content');
  expect(nodeUtils.readFile.mock.calls).toEqual([[path.resolve(directories.config, 'file.txt')]]);
});

test('readConfigFile memoizes results', async () => {
  const nodeUtils = await import('@lowdefy/node-utils');
  const createReadConfigFile = await import('./readConfigFile.js');
  const readConfigFile = createReadConfigFile.default({ directories });
  nodeUtils.readFile.mockImplementation(() => 'Text file content');
  const res1 = await readConfigFile('file.txt');
  expect(res1).toEqual('Text file content');
  expect(nodeUtils.readFile.mock.calls).toEqual([[path.resolve(directories.config, 'file.txt')]]);
  const res2 = await readConfigFile('file.txt');
  expect(res2).toEqual('Text file content');
  expect(nodeUtils.readFile.mock.calls).toEqual([[path.resolve(directories.config, 'file.txt')]]);
});
