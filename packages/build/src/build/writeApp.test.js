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

import writeApp from './writeApp.js';
import testContext from '../test/testContext.js';

const mockWriteBuildArtifact = jest.fn();

const context = testContext({ writeBuildArtifact: mockWriteBuildArtifact });

beforeEach(() => {
  mockWriteBuildArtifact.mockReset();
});

test('writeApp', async () => {
  const components = {
    app: {
      key: 'value',
    },
  };
  await writeApp({ components, context });
  expect(mockWriteBuildArtifact.mock.calls).toEqual([['app.json', '{"key":"value"}']]);
});

test('writeApp empty config', async () => {
  const components = {
    app: {},
  };
  await writeApp({ components, context });
  expect(mockWriteBuildArtifact.mock.calls).toEqual([['app.json', '{}']]);
});

test('writeApp config undefined', async () => {
  const components = {};
  await writeApp({ components, context });
  expect(mockWriteBuildArtifact.mock.calls).toEqual([['app.json', '{}']]);
});
