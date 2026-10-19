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

import testContext from '../../test/testContext.js';

const mockGetMenu = jest.fn();
jest.unstable_mockModule('./menus/getMenus.js', () => ({
  default: mockGetMenu,
}));

test('getHomeAndMenus, menu with configured home page id', async () => {
  const getHomeAndMenus = (await import('./getHomeAndMenus.js')).default;
  const context = testContext({ config: { homePageId: 'homePageId' } });
  const menus = [
    {
      menuId: 'default',
      links: [
        {
          id: 'menuitem:default:0',
          menuItemId: '0',
          type: 'MenuGroup',
          auth: { public: true },
          links: [
            {
              id: 'menuitem:default:1',
              menuItemId: '1',
              type: 'MenuLink',
              pageId: 'page',
              auth: { public: true },
            },
          ],
        },
      ],
    },
  ];
  mockGetMenu.mockImplementation(() => menus);
  const res = await getHomeAndMenus(context);
  expect(res).toEqual({ home: { configured: true, pageId: 'homePageId', pathParams: {} }, menus });
});

test('getHome, get homePageId at first level', async () => {
  const getHomeAndMenus = (await import('./getHomeAndMenus.js')).default;
  const context = testContext();
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
  const res = await getHomeAndMenus(context);
  expect(res).toEqual({ home: { configured: false, pageId: 'page', pathParams: {} }, menus });
});

test('getHome, get homePageId at second level', async () => {
  const getHomeAndMenus = (await import('./getHomeAndMenus.js')).default;
  const context = testContext();
  const menus = [
    {
      menuId: 'default',
      links: [
        {
          id: 'menuitem:default:0',
          menuItemId: '0',
          type: 'MenuGroup',
          auth: { public: true },
          links: [
            {
              id: 'menuitem:default:1',
              menuItemId: '1',
              type: 'MenuLink',
              pageId: 'page',
              auth: { public: true },
            },
          ],
        },
      ],
    },
  ];
  mockGetMenu.mockImplementation(() => menus);
  const res = await getHomeAndMenus(context);
  expect(res).toEqual({ home: { configured: false, pageId: 'page', pathParams: {} }, menus });
});

test('getHome, get homePageId at third level', async () => {
  const getHomeAndMenus = (await import('./getHomeAndMenus.js')).default;
  const context = testContext();
  const menus = [
    {
      menuId: 'default',
      links: [
        {
          id: 'menuitem:default:0',
          menuItemId: '0',
          type: 'MenuGroup',
          auth: { public: true },
          links: [
            {
              id: 'menuitem:default:1',
              menuItemId: '1',
              type: 'MenuGroup',
              auth: { public: true },
              links: [
                {
                  id: 'menuitem:default:2',
                  menuItemId: '2',
                  type: 'MenuLink',
                  pageId: 'page',
                  auth: { public: true },
                },
              ],
            },
          ],
        },
      ],
    },
  ];
  mockGetMenu.mockImplementation(() => menus);
  const res = await getHomeAndMenus(context);
  expect(res).toEqual({ home: { configured: false, pageId: 'page', pathParams: {} }, menus });
});

test('getHome, no default menu, no configured homepage', async () => {
  const getHomeAndMenus = (await import('./getHomeAndMenus.js')).default;
  const context = testContext();
  const menus = [
    {
      menuId: 'my_menu',
      links: [
        {
          id: 'menuitem:my_menu:0',
          menuItemId: '0',
          type: 'MenuLink',
          pageId: 'page',
          auth: { public: true },
        },
      ],
    },
  ];
  mockGetMenu.mockImplementation(() => menus);
  const res = await getHomeAndMenus(context);
  expect(res).toEqual({ home: { configured: false, pageId: 'page', pathParams: {} }, menus });
});

test('getHome, more than 1 menu, no configured homepage', async () => {
  const getHomeAndMenus = (await import('./getHomeAndMenus.js')).default;
  const context = testContext();
  const menus = [
    {
      menuId: 'other',
      links: [
        {
          id: 'menuitem:other:0',
          menuItemId: '0',
          type: 'MenuLink',
          pageId: 'other-page',
          auth: { public: true },
        },
      ],
    },
    {
      menuId: 'default',
      links: [
        {
          id: 'menuitem:default:0',
          menuItemId: '0',
          type: 'MenuLink',
          pageId: 'default-page',
          auth: { public: true },
        },
      ],
    },
  ];
  mockGetMenu.mockImplementation(() => menus);
  const res = await getHomeAndMenus(context, { menus });
  expect(res).toEqual({
    home: { configured: false, pageId: 'default-page', pathParams: {} },
    menus,
  });
});

test('getHome, default menu has no links', async () => {
  const getHomeAndMenus = (await import('./getHomeAndMenus.js')).default;
  const context = testContext();
  const menus = [
    {
      menuId: 'default',
      links: [],
    },
  ];
  mockGetMenu.mockImplementation(() => menus);
  const res = await getHomeAndMenus(context, { menus });
  expect(res).toEqual({ home: { configured: false, pageId: null, pathParams: {} }, menus });
});

test('getHome returns the path params of a first menu link to a page with placeholders', async () => {
  const getHomeAndMenus = (await import('./getHomeAndMenus.js')).default;
  const context = testContext();
  const menus = [
    {
      menuId: 'default',
      links: [
        {
          id: 'menuitem:default:0',
          menuItemId: '0',
          type: 'MenuLink',
          pageId: 'ticket',
          pathParams: { space: 'support', ticket_id: '1' },
          auth: { public: true },
        },
      ],
    },
  ];
  mockGetMenu.mockImplementation(() => menus);
  const res = await getHomeAndMenus(context);
  expect(res).toEqual({
    home: { configured: false, pageId: 'ticket', pathParams: { space: 'support', ticket_id: '1' } },
    menus,
  });
});
