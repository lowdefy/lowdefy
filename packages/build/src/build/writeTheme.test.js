/*
  Copyright 2020-2026 Lowdefy, Inc

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

import writeTheme from './writeTheme.js';
import testContext from '../test-utils/testContext.js';

const mockWriteBuildArtifact = jest.fn();

const context = testContext({ writeBuildArtifact: mockWriteBuildArtifact });

beforeEach(() => {
  mockWriteBuildArtifact.mockReset();
});

test('writeTheme writes theme.json', async () => {
  const components = {
    theme: {
      antd: {
        token: { colorPrimary: '#00b96b' },
      },
    },
  };
  await writeTheme({ components, context });
  expect(mockWriteBuildArtifact.mock.calls).toEqual([
    ['theme.json', '{"antd":{"token":{"colorPrimary":"#00b96b"}}}'],
  ]);
});

test('writeTheme writes empty object when theme is empty', async () => {
  const components = {
    theme: {},
  };
  await writeTheme({ components, context });
  expect(mockWriteBuildArtifact.mock.calls).toEqual([['theme.json', '{}']]);
});

test('writeTheme defaults to empty object when theme is undefined', async () => {
  const components = {};
  await writeTheme({ components, context });
  expect(mockWriteBuildArtifact.mock.calls).toEqual([['theme.json', '{}']]);
});

test('writeTheme throws when theme is not an object', async () => {
  const components = {
    theme: 'theme',
  };
  await expect(writeTheme({ components, context })).rejects.toThrow('Theme is not an object.');
});
