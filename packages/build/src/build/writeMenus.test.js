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

import writeMenus from './writeMenus.js';
import testContext from '../test/testContext.js';

const mockWriteBuildArtifact = jest.fn();

const context = testContext({ writeBuildArtifact: mockWriteBuildArtifact });

beforeEach(() => {
  mockWriteBuildArtifact.mockReset();
});

test('writeMenus', async () => {
  const components = {
    menus: [
      {
        id: 'menu:default',
        menuId: 'default',
        links: [],
      },
    ],
  };
  await writeMenus({ components, context });
  expect(mockWriteBuildArtifact.mock.calls).toEqual([
    ['menus.json', '[{"id":"menu:default","menuId":"default","links":[]}]'],
  ]);
});

test('writeMenus empty menus', async () => {
  const components = {
    menus: [],
  };
  await writeMenus({ components, context });
  expect(mockWriteBuildArtifact.mock.calls).toEqual([['menus.json', '[]']]);
});

test('writeMenus menus undefined', async () => {
  const components = {};
  await expect(writeMenus({ components, context })).rejects.toThrow('Menus is not an array.');
});

test('writeMenus menus not an array', async () => {
  const components = {
    menus: 'menus',
  };
  await expect(writeMenus({ components, context })).rejects.toThrow('Menus is not an array.');
});
