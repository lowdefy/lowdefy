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

import { vi, expect, test } from 'vitest';

import buildMobile from './buildMobile.js';

function createContext() {
  return {
    directories: { config: '/' },
    errors: [],
    experimental: { mobile: true },
    handleWarning: vi.fn(),
    typesMapMobile: { plugins: [] },
  };
}

test('buildMobile merges the mobile pages of a valid mobile config', () => {
  const context = createContext();
  const components = {
    pages: [{ id: 'home' }],
    mobile: { homePageId: 'jobs', pages: [{ id: 'jobs' }] },
  };
  buildMobile({ components, context });
  expect(context.errors).toEqual([]);
  expect(components.pages).toEqual([{ id: 'home' }, { id: 'jobs', target: 'mobile' }]);
});

test('buildMobile collects every config error and merges no pages from an invalid config', () => {
  const context = createContext();
  const components = {
    pages: [{ id: 'home' }],
    mobile: {
      homePageId: 'missing',
      menus: {},
      auth: { emailCode: 'yes' },
      pages: [{ id: 'jobs' }],
    },
  };
  buildMobile({ components, context });
  // The page references are not checked against pages that were never merged.
  expect(context.errors.map((error) => error.message)).toEqual([
    'App "mobile.menus" should have exactly one of tabs, drawer, stack. Received none.',
    'App "mobile.auth.emailCode" should be a boolean.',
  ]);
  expect(components.pages).toEqual([{ id: 'home' }]);
});

test('buildMobile reports every page reference that is not a mobile page', () => {
  const context = createContext();
  const components = {
    pages: [{ id: 'home' }],
    mobile: {
      homePageId: 'home',
      menus: { drawer: [{ pageId: 'reports' }] },
      pages: [{ id: 'jobs' }],
    },
  };
  buildMobile({ components, context });
  expect(context.errors.map((error) => error.message)).toEqual([
    'Mobile menu item links to page "reports", which is not a mobile page. List it in "mobile.pages".',
    'App "mobile.homePageId" is "home", which is not a mobile page. List it in "mobile.pages".',
  ]);
});
