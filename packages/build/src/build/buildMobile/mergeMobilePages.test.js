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

import mergeMobilePages from './mergeMobilePages.js';

test('mergeMobilePages appends mobile pages with target mobile', () => {
  const components = {
    pages: [{ id: 'home', type: 'Box' }],
    mobile: { pages: [{ id: 'today', type: 'Box' }] },
  };
  mergeMobilePages({ components });
  expect(components.pages).toEqual([
    { id: 'home', type: 'Box' },
    { id: 'today', type: 'Box', target: 'mobile' },
  ]);
  expect(components.mobile).toEqual({});
});

test('mergeMobilePages marks a page with the same id and config as shared', () => {
  const components = {
    pages: [{ id: 'about', type: 'Box', '~r': 'r1' }],
    mobile: { pages: [{ id: 'about', type: 'Box', '~r': 'r2' }] },
  };
  mergeMobilePages({ components });
  expect(components.pages).toEqual([{ id: 'about', type: 'Box', '~r': 'r1', target: 'both' }]);
});

test('mergeMobilePages throws when a shared page id has different config', () => {
  const components = {
    pages: [{ id: 'home', type: 'Box', properties: { title: 'Web' } }],
    mobile: { pages: [{ id: 'home', type: 'Box', properties: { title: 'Mobile' } }] },
  };
  expect(() => mergeMobilePages({ components })).toThrow(
    'Page "home" is in both "pages" and "mobile.pages" with different config. A page shared by web and mobile must be the same config, for example the same _ref.'
  );
});

test('mergeMobilePages appends a mobile page without a string id for buildPage to report', () => {
  const components = {
    pages: [],
    mobile: { pages: [{ type: 'Box' }] },
  };
  mergeMobilePages({ components });
  expect(components.pages).toEqual([{ type: 'Box', target: 'mobile' }]);
});
