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

import buildMobileMenu from './buildMobileMenu.js';
import testContext from '../test-utils/testContext.js';

const mockLogWarn = jest.fn();

const logger = {
  warn: mockLogWarn,
};

const context = testContext({ logger });

beforeEach(() => {
  mockLogWarn.mockReset();
});

test('buildMobileMenu synthesizes a default menu from mobile pages when no menus defined', () => {
  const components = {
    mobile: {
      pages: [
        {
          id: 'page:m_home',
          pageId: 'm_home',
          auth: { public: true },
        },
        {
          id: 'page:m_tasks',
          pageId: 'm_tasks',
          auth: { public: false },
        },
      ],
    },
  };
  buildMobileMenu({ components, context });
  expect(components.mobile.menus).toEqual([
    {
      id: 'menu:default',
      menuId: 'default',
      links: [
        {
          id: 'menuitem:default:0',
          menuItemId: '0',
          type: 'MenuLink',
          pageId: 'm_home',
          auth: { public: true },
        },
        {
          id: 'menuitem:default:1',
          menuItemId: '1',
          type: 'MenuLink',
          pageId: 'm_tasks',
          auth: { public: false },
        },
      ],
    },
  ]);
});

test('buildMobileMenu does not synthesize a default menu when there are no mobile pages', () => {
  const components = { mobile: { pages: [] } };
  buildMobileMenu({ components, context });
  expect(components.mobile.menus ?? []).toEqual([]);
  expect(mockLogWarn).not.toHaveBeenCalled();
});

test('buildMobileMenu validates links against mobile pages and inherits page auth', () => {
  const components = {
    mobile: {
      menus: [
        {
          id: 'default',
          links: [
            {
              id: 'home',
              type: 'MenuLink',
              pageId: 'm_home',
            },
          ],
        },
      ],
      pages: [
        {
          id: 'page:m_home',
          pageId: 'm_home',
          auth: { public: false, roles: ['admin'] },
        },
      ],
    },
  };
  buildMobileMenu({ components, context });
  expect(components.mobile.menus[0].links[0].auth).toEqual({ public: false, roles: ['admin'] });
});

test('buildMobileMenu removes links to pages that are not mobile pages and warns', () => {
  const components = {
    mobile: {
      menus: [
        {
          id: 'default',
          links: [
            {
              id: 'home',
              type: 'MenuLink',
              pageId: 'm_home',
            },
            {
              id: 'web_page',
              type: 'MenuLink',
              pageId: 'web_home',
            },
          ],
        },
      ],
      pages: [
        {
          id: 'page:m_home',
          pageId: 'm_home',
          auth: { public: true },
        },
      ],
    },
  };
  buildMobileMenu({ components, context });
  expect(components.mobile.menus[0].links.length).toEqual(1);
  expect(components.mobile.menus[0].links[0].menuItemId).toEqual('home');
  expect(mockLogWarn).toHaveBeenCalledWith(
    'Page "web_home" referenced in menu link "web_page" not found.'
  );
});

test('buildMobileMenu handles undefined mobile key', () => {
  const components = {};
  buildMobileMenu({ components, context });
  expect(mockLogWarn).not.toHaveBeenCalled();
});
