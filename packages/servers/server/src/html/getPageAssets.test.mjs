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

import getPageAssets from './getPageAssets.js';

const assets = {
  icons: { js: ['assets/icons.js', 'assets/shared.js'], css: [] },
  pageTypes: {
    aaaaaaaaaaaa: {
      js: ['assets/aaaa.js', 'assets/shared.js'],
      css: ['assets/a.css'],
      prefetch: [],
    },
  },
};

test('getPageAssets preloads only the key chunks for a page that needs only its own icons', () => {
  expect(getPageAssets({ assets, pageConfig: { typesKey: 'aaaaaaaaaaaa' } })).toBe(
    assets.pageTypes.aaaaaaaaaaaa
  );
});

test.each([['loadAllIcons'], ['loadAllTypes']])(
  'getPageAssets also preloads every icon for a page flagged %s',
  (flag) => {
    expect(
      getPageAssets({ assets, pageConfig: { typesKey: 'aaaaaaaaaaaa', [flag]: true } })
    ).toEqual({
      js: ['assets/aaaa.js', 'assets/shared.js', 'assets/icons.js'],
      css: ['assets/a.css'],
      prefetch: [],
    });
  }
);
