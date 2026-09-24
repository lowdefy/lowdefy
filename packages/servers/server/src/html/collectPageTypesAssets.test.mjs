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
      prefetch: [],
    },
    bbbbbbbbbbbb: {
      js: ['assets/bbbb.js', 'assets/icons.js', 'assets/ai.js'],
      css: [],
      prefetch: [],
    },
  });
});

// A page whose chunks import a lazy block implementation, an optional SDK, and
// a nested lazy import inside the implementation.
const lazyManifest = {
  'client/main.jsx': {
    file: 'assets/main.js',
    css: ['assets/main.css'],
    imports: ['_react.js'],
    dynamicImports: [
      'build/plugins/pageTypes/cccccccccccc.js',
      'build/plugins/pageTypes/dddddddddddd.js',
      'node_modules/app-wide/Everywhere.lazy.js',
    ],
  },
  '_react.js': { file: 'assets/react.js' },
  'build/plugins/icons.js': { file: 'assets/icons.js', imports: ['client/main.jsx'] },
  'node_modules/app-wide/Everywhere.lazy.js': {
    file: 'assets/Everywhere.lazy.js',
    isDynamicEntry: true,
  },
  'build/plugins/pageTypes/cccccccccccc.js': {
    file: 'assets/cccc.js',
    imports: ['_blocks.js', 'client/main.jsx'],
  },
  '_blocks.js': {
    file: 'assets/blocks.js',
    imports: ['_antd.js', '_react.js'],
    dynamicImports: [
      'plugins/blocks-antd-x/dist/blocks/AgentChat/AgentChat.lazy.js',
      'node_modules/posthog-js/dist/module.js',
    ],
  },
  '_antd.js': { file: 'assets/antd.js', css: ['assets/antd.css'], imports: ['_react.js'] },
  'plugins/blocks-antd-x/dist/blocks/AgentChat/AgentChat.lazy.js': {
    file: 'assets/AgentChat.lazy.js',
    css: ['assets/AgentChat.css'],
    isDynamicEntry: true,
    imports: ['_x.js', '_antd.js', '_react.js'],
    dynamicImports: ['node_modules/@ant-design/x/es/mermaid/index.js'],
  },
  '_x.js': { file: 'assets/x.js', imports: ['_markdown.js'] },
  '_markdown.js': { file: 'assets/markdown.js', css: ['assets/markdown.css'] },
  'node_modules/@ant-design/x/es/mermaid/index.js': {
    file: 'assets/mermaid.js',
    isDynamicEntry: true,
  },
  'node_modules/posthog-js/dist/module.js': { file: 'assets/posthog.js', isDynamicEntry: true },
  'build/plugins/pageTypes/dddddddddddd.js': {
    file: 'assets/dddd.js',
    imports: ['client/main.jsx'],
  },
};

test('collectPageTypesAssets prefetches the lazy block implementations a page imports, with their imports', () => {
  const pageTypes = collectPageTypesAssets({ manifest: lazyManifest, entryFiles });
  expect(pageTypes.cccccccccccc).toEqual({
    js: ['assets/cccc.js', 'assets/blocks.js', 'assets/antd.js', 'assets/icons.js'],
    css: ['assets/antd.css'],
    prefetch: [
      'assets/AgentChat.lazy.js',
      'assets/x.js',
      'assets/markdown.js',
      'assets/AgentChat.css',
      'assets/markdown.css',
    ],
  });
});

test('collectPageTypesAssets does not prefetch dynamic imports that are not *.lazy.js', () => {
  const { prefetch } = collectPageTypesAssets({ manifest: lazyManifest, entryFiles }).cccccccccccc;
  expect(prefetch).not.toContain('assets/posthog.js');
  // Imported only once the implementation runs, so it stays on demand.
  expect(prefetch).not.toContain('assets/mermaid.js');
});

test('collectPageTypesAssets does not prefetch lazy imports of the main entry or other page types', () => {
  const pageTypes = collectPageTypesAssets({ manifest: lazyManifest, entryFiles });
  expect(pageTypes.dddddddddddd.prefetch).toEqual([]);
  expect(pageTypes.cccccccccccc.prefetch).not.toContain('assets/Everywhere.lazy.js');
});
