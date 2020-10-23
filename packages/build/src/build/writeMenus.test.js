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

import writeMenus from './writeMenus';
import testContext from '../test/testContext';

const mockLogInfo = jest.fn();
const mockSet = jest.fn();

const logger = {
  info: mockLogInfo,
};

const artifactSetter = {
  set: mockSet,
};

const context = testContext({ logger, artifactSetter });

beforeEach(() => {
  mockLogInfo.mockReset();
  mockSet.mockReset();
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
  expect(mockSet.mock.calls).toEqual([
    [
      {
        filePath: 'menus.json',
        content: `[
  {
    "id": "menu:default",
    "menuId": "default",
    "links": []
  }
]`,
      },
    ],
  ]);
  expect(mockLogInfo.mock.calls).toEqual([['Updated menus']]);
});

test('writeMenus empty menus', async () => {
  const components = {
    menus: [],
  };
  await writeMenus({ components, context });
  expect(mockSet.mock.calls).toEqual([
    [
      {
        filePath: 'menus.json',
        content: `[]`,
      },
    ],
  ]);
  expect(mockLogInfo.mock.calls).toEqual([['Updated menus']]);
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
