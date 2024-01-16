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

import writeMaps from './writeMaps.js';
import testContext from '../test/testContext.js';

const mockWriteBuildArtifact = jest.fn();

const context = testContext({ writeBuildArtifact: mockWriteBuildArtifact });

beforeEach(() => {
  mockWriteBuildArtifact.mockReset();
});

test('writeMaps', async () => {
  context.keyMap = {
    key: 'value',
  };
  context.refMap = {
    ref: 'value',
  };
  await writeMaps({ context });
  expect(mockWriteBuildArtifact.mock.calls).toEqual([
    ['keyMap.json', '{"key":"value"}'],
    ['refMap.json', '{"ref":"value"}'],
  ]);
});

test('keyMap is not an object', async () => {
  const context = {
    keyMap: 'keyMap',
    refMap: {},
  };
  await expect(writeMaps({ context })).rejects.toThrow('keyMap is not an object.');
});

test('refMap is not an object', async () => {
  const context = {
    refMap: 'refMap',
    keyMap: {},
  };
  await expect(writeMaps({ context })).rejects.toThrow('refMap is not an object.');
});
