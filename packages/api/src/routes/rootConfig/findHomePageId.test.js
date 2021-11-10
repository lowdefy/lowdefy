/*
  Copyright 2020-2021 Lowdefy, Inc

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

import findHomePageId from './findHomePageId.js';
import testContext from '../../test/testContext.js';

test('findHomePageId, menu with configured home page id', () => {
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
  const res = findHomePageId(context, { menus });
  expect(res).toEqual('homePageId');
});

test('findHomePageId, get homePageId at first level', () => {
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
  const res = findHomePageId(context, { menus });
  expect(res).toEqual('page');
});

test('findHomePageId, get homePageId at second level', () => {
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
  const res = findHomePageId(context, { menus });
  expect(res).toEqual('page');
});

test('findHomePageId, get homePageId at third level', () => {
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
  const res = findHomePageId(context, { menus });
  expect(res).toEqual('page');
});

test('findHomePageId, no default menu, no configured homepage', () => {
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
  const res = findHomePageId(context, { menus });
  expect(res).toEqual('page');
});

test('findHomePageId, more than 1 menu, no configured homepage', () => {
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
  const res = findHomePageId(context, { menus });
  expect(res).toEqual('default-page');
});

test('findHomePageId, default menu has no links', () => {
  const context = testContext();
  const menus = [
    {
      menuId: 'default',
      links: [],
    },
  ];
  const res = findHomePageId(context, { menus });
  expect(res).toEqual(null);
});
