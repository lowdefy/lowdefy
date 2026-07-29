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

import getHomePathname from '../src/getHomePathname.js';

test('getHomePathname returns the app root when a homePageId is configured', () => {
  expect(getHomePathname({ lowdefy: { home: { configured: true, pageId: 'dashboard' } } })).toEqual(
    '/'
  );
});

test('getHomePathname returns the menu-derived pageId when no homePageId is configured', () => {
  expect(
    getHomePathname({ lowdefy: { home: { configured: false, pageId: 'first-page' } } })
  ).toEqual('/first-page');
});

test('getHomePathname returns undefined when the home config names no page', () => {
  // What getHomeAndMenus returns for an app with no homePageId whose authorized
  // menu yields no link - the input that built the literal "/null".
  expect(
    getHomePathname({ lowdefy: { home: { configured: false, pageId: null } } })
  ).toBeUndefined();
});

test('getHomePathname returns undefined when there is no home config at all', () => {
  expect(getHomePathname({ lowdefy: {} })).toBeUndefined();
});

test('getHomePathname ignores a non-string pageId', () => {
  expect(getHomePathname({ lowdefy: { home: { configured: false, pageId: 42 } } })).toBeUndefined();
});
