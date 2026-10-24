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

import { expect, test } from 'vitest';
import validateMobilePageRefs from './validateMobilePageRefs.js';

const pages = [
  { id: 'home', target: undefined },
  { id: 'today', target: 'mobile' },
  { id: 'about', target: 'both' },
];

test('validateMobilePageRefs accepts menu items and a home page that are mobile pages', () => {
  const components = {
    pages,
    mobile: {
      homePageId: 'about',
      menus: { tabs: [{ pageId: 'today' }, { pageId: 'about' }] },
    },
  };
  expect(() => validateMobilePageRefs({ components })).not.toThrow();
});

test('validateMobilePageRefs throws when a menu item links to a web page', () => {
  const components = {
    pages,
    mobile: { menus: { drawer: [{ pageId: 'home' }] } },
  };
  expect(() => validateMobilePageRefs({ components })).toThrow(
    'Mobile menu item links to page "home", which is not a mobile page. List it in "mobile.pages".'
  );
});

test('validateMobilePageRefs throws when homePageId is not a mobile page', () => {
  const components = { pages, mobile: { homePageId: 'missing' } };
  expect(() => validateMobilePageRefs({ components })).toThrow(
    'App "mobile.homePageId" is "missing", which is not a mobile page. List it in "mobile.pages".'
  );
});
