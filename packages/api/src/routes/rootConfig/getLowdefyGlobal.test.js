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

import getLowdefyGlobal from './getLowdefyGlobal.js';
import testContext from '../../test/testContext.js';

const mockReadConfigFile = jest.fn();

const context = testContext({ readConfigFile: mockReadConfigFile });

beforeEach(() => {
  mockReadConfigFile.mockReset();
});

test('getLowdefyGlobal', async () => {
  mockReadConfigFile.mockImplementation((path) => {
    if (path === 'global.json') {
      return {
        x: 'value',
      };
    }
    return null;
  });
  const res = await getLowdefyGlobal(context);
  expect(res).toEqual({
    x: 'value',
  });
});

test('getLowdefyGlobal, global not found', async () => {
  mockReadConfigFile.mockImplementation(() => {
    return null;
  });
  const res = await getLowdefyGlobal(context);
  expect(res).toEqual({});
});
