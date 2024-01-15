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

import getMenus from './getMenus.js';
import testContext from '../../../test/testContext.js';

const mockReadConfigFile = jest.fn();

const context = testContext({ readConfigFile: mockReadConfigFile });
const contextUser = testContext({
  readConfigFile: mockReadConfigFile,
  session: { user: { sub: 'sub' } },
});

beforeEach(() => {
  mockReadConfigFile.mockReset();
});

test('getMenus, menus not found', async () => {
  mockReadConfigFile.mockImplementation(() => {
    return null;
  });
  const res = await getMenus(context);
  expect(res).toEqual([]);
});

test('Menu all protected, public request', async () => {
  mockReadConfigFile.mockImplementation((path) => {
    if (path === 'menus.json') {
      return [
        {
          menuId: 'default',
          links: [
            {
              id: 'menuitem:default:1',
              menuItemId: '1',
              type: 'MenuLink',
              pageId: 'page',
              auth: { public: false },
            },
            {
              id: 'menuitem:default:2',
              menuItemId: '2',
              type: 'MenuGroup',
              auth: { public: true },
              links: [
                {
                  id: 'menuitem:default:3',
                  menuItemId: '3',
                  type: 'MenuLink',
                  pageId: 'page',
                  auth: { public: false },
                },
                {
                  id: 'menuitem:default:4',
                  menuItemId: '4',
                  type: 'MenuGroup',
                  auth: { public: true },
                  links: [
                    {
                      id: 'menuitem:default:5',
                      menuItemId: '5',
                      type: 'MenuLink',
                      pageId: 'page',
                      auth: { public: false },
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          menuId: 'other',
          links: [
            {
              id: 'menuitem:other:1',
              menuItemId: '1',
              type: 'MenuLink',
              pageId: 'page',
              auth: { public: false },
            },
          ],
        },
      ];
    }
    return null;
  });
  const res = await getMenus(context);
  expect(res).toEqual([
    {
      menuId: 'default',
      links: [],
    },
    {
      menuId: 'other',
      links: [],
    },
  ]);
});

test('Menu all protected, authenticated request', async () => {
  mockReadConfigFile.mockImplementation((path) => {
    if (path === 'menus.json') {
      return [
        {
          menuId: 'default',
          links: [
            {
              id: 'menuitem:default:1',
              menuItemId: '1',
              type: 'MenuLink',
              pageId: 'page',
              auth: { public: false },
            },
            {
              id: 'menuitem:default:2',
              menuItemId: '2',
              type: 'MenuGroup',
              auth: { public: true },
              links: [
                {
                  id: 'menuitem:default:3',
                  menuItemId: '3',
                  type: 'MenuLink',
                  pageId: 'page',
                  auth: { public: false },
                },
                {
                  id: 'menuitem:default:4',
                  menuItemId: '4',
                  type: 'MenuGroup',
                  auth: { public: true },
                  links: [
                    {
                      id: 'menuitem:default:5',
                      menuItemId: '5',
                      type: 'MenuLink',
                      pageId: 'page',
                      auth: { public: false },
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          menuId: 'other',
          links: [
            {
              id: 'menuitem:other:1',
              menuItemId: '1',
              type: 'MenuLink',
              pageId: 'page',
              auth: { public: false },
            },
          ],
        },
      ];
    }
    if (path === 'config.json') {
      return {};
    }
    return null;
  });
  const res = await getMenus(contextUser);
  expect(res).toEqual([
    {
      menuId: 'default',
      links: [
        {
          id: 'menuitem:default:1',
          menuItemId: '1',
          type: 'MenuLink',
          pageId: 'page',
          auth: { public: false },
        },
        {
          id: 'menuitem:default:2',
          menuItemId: '2',
          type: 'MenuGroup',
          auth: { public: true },
          links: [
            {
              id: 'menuitem:default:3',
              menuItemId: '3',
              type: 'MenuLink',
              pageId: 'page',
              auth: { public: false },
            },
            {
              id: 'menuitem:default:4',
              menuItemId: '4',
              type: 'MenuGroup',
              auth: { public: true },
              links: [
                {
                  id: 'menuitem:default:5',
                  menuItemId: '5',
                  type: 'MenuLink',
                  pageId: 'page',
                  auth: { public: false },
                },
              ],
            },
          ],
        },
      ],
    },
    {
      menuId: 'other',
      links: [
        {
          id: 'menuitem:other:1',
          menuItemId: '1',
          type: 'MenuLink',
          pageId: 'page',
          auth: { public: false },
        },
      ],
    },
  ]);
});

test('Menu filter some items, public request', async () => {
  mockReadConfigFile.mockImplementation((path) => {
    if (path === 'menus.json') {
      return [
        {
          menuId: 'default',
          links: [
            {
              id: 'menuitem:default:1',
              menuItemId: '1',
              type: 'MenuLink',
              pageId: 'page',
              auth: { public: false },
            },
            {
              id: 'menuitem:default:2',
              menuItemId: '2',
              type: 'MenuGroup',
              auth: { public: true },
              links: [
                {
                  id: 'menuitem:default:3',
                  menuItemId: '3',
                  type: 'MenuLink',
                  pageId: 'page',
                  auth: { public: false },
                },
                {
                  id: 'menuitem:default:4',
                  menuItemId: '4',
                  type: 'MenuLink',
                  pageId: 'page',
                  auth: { public: true },
                },
                {
                  id: 'menuitem:default:5',
                  menuItemId: '5',
                  type: 'MenuGroup',
                  auth: { public: true },
                  links: [
                    {
                      id: 'menuitem:default:6',
                      menuItemId: '6',
                      type: 'MenuLink',
                      pageId: 'page',
                      auth: { public: false },
                    },
                  ],
                },
                {
                  id: 'menuitem:default:7',
                  menuItemId: '7',
                  type: 'MenuGroup',
                  auth: { public: true },
                  links: [
                    {
                      id: 'menuitem:default:8',
                      menuItemId: '8',
                      type: 'MenuLink',
                      url: 'https://lowdefy.com',
                      auth: { public: true },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ];
    }
    return null;
  });
  const res = await getMenus(context);
  expect(res).toEqual([
    {
      links: [
        {
          id: 'menuitem:default:2',
          menuItemId: '2',
          type: 'MenuGroup',
          auth: { public: true },
          links: [
            {
              id: 'menuitem:default:4',
              menuItemId: '4',
              pageId: 'page',
              type: 'MenuLink',
              auth: { public: true },
            },
            {
              id: 'menuitem:default:7',
              menuItemId: '7',
              type: 'MenuGroup',
              auth: { public: true },
              links: [
                {
                  id: 'menuitem:default:8',
                  menuItemId: '8',
                  type: 'MenuLink',
                  url: 'https://lowdefy.com',
                  auth: { public: true },
                },
              ],
            },
          ],
        },
      ],
      menuId: 'default',
    },
  ]);
});

test('Filter invalid menu item types', async () => {
  mockReadConfigFile.mockImplementation((path) => {
    if (path === 'menus.json') {
      return [
        {
          menuId: 'default',
          links: [
            {
              id: 'menuitem:default:1',
              menuItemId: '1',
              type: 'MenuItem',
              pageId: 'page',
              auth: { public: false },
            },
          ],
        },
      ];
    }
    return null;
  });
  const res = await getMenus(context);
  expect(res).toEqual([
    {
      menuId: 'default',
      links: [],
    },
  ]);
});
