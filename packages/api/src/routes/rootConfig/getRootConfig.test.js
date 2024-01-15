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

import testContext from '../../test/testContext.js';

const mockGetMenu = jest.fn();
jest.unstable_mockModule('./menus/getMenus.js', () => ({
  default: mockGetMenu,
}));

const mockReadConfigFile = jest.fn();

const context = testContext({ readConfigFile: mockReadConfigFile });

beforeEach(() => {
  mockReadConfigFile.mockReset();
});

test('getRootConfig', async () => {
  const getRootConfig = (await import('./getRootConfig.js')).default;
  mockReadConfigFile.mockImplementation((path) => {
    if (path === 'global.json') {
      return {
        global: true,
      };
    }
    return null;
  });
  const menus = [
    {
      menuId: 'default',
      links: [
        {
          id: 'menuitem:default:0',
          menuItemId: '0',
          type: 'MenuLink',
          pageId: 'page',
          auth: { public: true },
        },
      ],
    },
  ];
  mockGetMenu.mockImplementation(() => menus);
  const res = await getRootConfig(context);
  expect(res).toEqual({
    home: {
      configured: false,
      pageId: 'page',
    },
    lowdefyGlobal: {
      global: true,
    },
    menus: [
      {
        menuId: 'default',
        links: [
          {
            id: 'menuitem:default:0',
            menuItemId: '0',
            type: 'MenuLink',
            pageId: 'page',
            auth: { public: true },
          },
        ],
      },
    ],
  });
});
