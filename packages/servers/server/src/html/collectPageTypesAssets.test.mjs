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

import collectPageTypesAssets from './collectPageTypesAssets.js';

const manifest = {
  'client/main.jsx': { file: 'assets/main.js', css: ['assets/main.css'], imports: ['_react.js'] },
  '_react.js': { file: 'assets/react.js' },
  'build/plugins/icons.js': { file: 'assets/icons.js', imports: ['_ai.js', 'client/main.jsx'] },
  '_ai.js': { file: 'assets/ai.js', imports: ['client/main.jsx'] },
  'build/plugins/pageTypes/aaaaaaaaaaaa.js': {
    file: 'assets/aaaa.js',
    imports: ['_antd.js', 'client/main.jsx'],
  },
  '_antd.js': { file: 'assets/antd.js', css: ['assets/antd.css'], imports: ['_react.js'] },
  'build/plugins/pageTypes/bbbbbbbbbbbb.js': {
    file: 'assets/bbbb.js',
    imports: ['client/main.jsx'],
  },
};

const entryFiles = new Set(['assets/main.js', 'assets/main.css', 'assets/react.js']);

test('collectPageTypesAssets preloads each key chunk, the icons, and every import, less main', () => {
  expect(collectPageTypesAssets({ manifest, entryFiles })).toEqual({
    aaaaaaaaaaaa: {
      js: ['assets/aaaa.js', 'assets/antd.js', 'assets/icons.js', 'assets/ai.js'],
      css: ['assets/antd.css'],
    },
    bbbbbbbbbbbb: {
      js: ['assets/bbbb.js', 'assets/icons.js', 'assets/ai.js'],
      css: [],
    },
  });
});
