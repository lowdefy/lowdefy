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

const manifest = {
  'client/main.jsx': {
    file: 'assets/main-aaa.js',
    css: ['assets/main-aaa.css'],
    imports: ['_vendor-bbb.js'],
    isEntry: true,
  },
  '_vendor-bbb.js': { file: 'assets/vendor-bbb.js' },
  '_shared-ccc.js': { file: 'assets/shared-ccc.js', imports: ['_vendor-bbb.js'] },
  '_antd-ddd.js': { file: 'assets/antd-ddd.js', imports: ['_shared-ccc.js'] },
  'build/plugins/pages/home.js': {
    file: 'assets/home-eee.js',
    imports: ['_antd-ddd.js', '_vendor-bbb.js'],
    dynamicImports: ['build/plugins/pages/other.js'],
    isDynamicEntry: true,
  },
  'build/plugins/pages/other.js': { file: 'assets/other-fff.js', isDynamicEntry: true },
  'build/plugins/pages/index.js': { file: 'assets/index-ggg.js', isDynamicEntry: true },
};

async function loadAssets(manifestJson = JSON.stringify(manifest)) {
  jest.resetModules();
  jest.unstable_mockModule('node:fs', () => ({
    default: { readFileSync: jest.fn(() => manifestJson) },
  }));
  const { default: getAssets } = await import('./getAssets.js');
  return getAssets();
}

test('getAssets reads the entry chunk, its css and its preloads from the manifest', async () => {
  const assets = await loadAssets();
  expect(assets.js).toEqual('assets/main-aaa.js');
  expect(assets.css).toEqual(['assets/main-aaa.css']);
  expect(assets.imports).toEqual(['assets/vendor-bbb.js']);
});

test('getAssets lists a page module chunk and the chunks it imports, per page', async () => {
  const assets = await loadAssets();
  expect(assets.pages.home).toEqual([
    'assets/home-eee.js',
    'assets/antd-ddd.js',
    'assets/shared-ccc.js',
  ]);
});

test('getAssets does not repeat a chunk the entry already preloads', async () => {
  const assets = await loadAssets();
  expect(assets.pages.home).not.toContain('assets/vendor-bbb.js');
});

test('getAssets does not list the chunks a page module only imports dynamically', async () => {
  const assets = await loadAssets();
  expect(assets.pages.home).not.toContain('assets/other-fff.js');
});

test('getAssets does not treat the page module index as a page', async () => {
  const assets = await loadAssets();
  expect(assets.pages.index).toBeUndefined();
  expect(Object.keys(assets.pages).sort()).toEqual(['home', 'other']);
});

test('getAssets has no page chunks when the build did not split pages', async () => {
  const assets = await loadAssets(
    JSON.stringify({ 'client/main.jsx': { file: 'assets/main-aaa.js' } })
  );
  expect(assets.pages).toEqual({});
  expect(assets.css).toEqual([]);
  expect(assets.imports).toEqual([]);
});

test('getAssets throws when the manifest has no client entry', async () => {
  await expect(loadAssets(JSON.stringify({}))).rejects.toThrow(
    'Vite manifest has no "client/main.jsx" entry.'
  );
});
