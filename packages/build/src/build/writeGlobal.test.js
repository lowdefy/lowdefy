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

import writeGlobal from './writeGlobal.js';
import testContext from '../test/testContext.js';

const mockWriteBuildArtifact = jest.fn();

const context = testContext({ writeBuildArtifact: mockWriteBuildArtifact });

beforeEach(() => {
  mockWriteBuildArtifact.mockReset();
});

test('writeGlobal', async () => {
  const components = {
    global: {
      key: 'value',
    },
  };
  await writeGlobal({ components, context });
  expect(mockWriteBuildArtifact.mock.calls).toEqual([['global.json', '{"key":"value"}']]);
});

test('writeGlobal empty global', async () => {
  const components = {
    global: {},
  };
  await writeGlobal({ components, context });
  expect(mockWriteBuildArtifact.mock.calls).toEqual([['global.json', '{}']]);
});

test('writeGlobal global undefined', async () => {
  const components = {};
  await writeGlobal({ components, context });
  expect(mockWriteBuildArtifact.mock.calls).toEqual([['global.json', '{}']]);
});

test('writeGlobal global not an object', async () => {
  const components = {
    global: 'global',
  };
  await expect(writeGlobal({ components, context })).rejects.toThrow('Global is not an object.');
});
