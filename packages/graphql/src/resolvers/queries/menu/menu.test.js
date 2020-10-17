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

import { gql } from 'apollo-server';
import runTestQuery from '../../../test/runTestQuery';
import menu from './menu';

const mockLoadMenus = jest.fn((id) => {
  if (id === 'menus') {
    return [
      {
        id: 'menu:default',
        menuId: 'default',
        links: [
          {
            id: 'menuitem:default:0',
            type: 'MenuGroup',
            links: [
              {
                id: 'menuitem:default:1',
                type: 'MenuLink',
                pageId: 'page',
              },
            ],
          },
        ],
      },
    ];
  }
  return null;
});

const mockGetMenus = jest.fn(() => {
  return {
    menus: [
      {
        id: 'menu:default',
        menuId: 'default',
        links: [
          {
            id: 'menuitem:default:0',
            type: 'MenuGroup',
            links: [
              {
                id: 'menuitem:default:1',
                type: 'MenuLink',
                pageId: 'page',
              },
            ],
          },
        ],
      },
    ],
    homePageId: 'page',
  };
});

const getController = jest.fn(() => ({
  getMenus: mockGetMenus,
}));

const loaders = {
  component: {
    load: mockLoadMenus,
  },
};
const setters = {};

const GET_MENUS = gql`
  fragment MenuLinkFragment on MenuLink {
    id
    type
    properties
    pageId
    url
  }
  query getMenus {
    menu {
      menus {
        id
        menuId
        properties
        links {
          ...MenuLinkFragment
          ... on MenuGroup {
            id
            type
            properties
            links {
              ... on MenuGroup {
                id
                type
                properties
                links {
                  ...MenuLinkFragment
                }
              }
              ...MenuLinkFragment
            }
          }
        }
      }
      homePageId
    }
  }
`;

test('menu resolver', async () => {
  const res = await menu(null, null, { getController });
  expect(res).toEqual({
    menus: [
      {
        id: 'menu:default',
        menuId: 'default',
        links: [
          {
            id: 'menuitem:default:0',
            type: 'MenuGroup',
            links: [
              {
                id: 'menuitem:default:1',
                type: 'MenuLink',
                pageId: 'page',
              },
            ],
          },
        ],
      },
    ],
    homePageId: 'page',
  });
});

test('menu graphql', async () => {
  const res = await runTestQuery({
    gqlQuery: GET_MENUS,
    loaders,
    setters,
  });
  expect(res.errors).toBe(undefined);
  expect(res.data).toEqual({
    menu: {
      menus: [
        {
          id: 'menu:default',
          menuId: 'default',
          properties: null,
          links: [
            {
              id: 'menuitem:default:0',
              type: 'MenuGroup',
              properties: null,
              links: [
                {
                  id: 'menuitem:default:1',
                  type: 'MenuLink',
                  properties: null,
                  pageId: 'page',
                  url: null,
                },
              ],
            },
          ],
        },
      ],
      homePageId: 'page',
    },
  });
});
