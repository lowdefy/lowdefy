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

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

let root;

const mcpJson = { views: { configured: false } };
vi.doMock('../../lib/build/mcp.js', () => ({ default: mcpJson }));

function writeManifest(manifest) {
  fs.mkdirSync(path.join(root, 'dist/client/.vite'), { recursive: true });
  fs.writeFileSync(path.join(root, 'dist/client/.vite/manifest.json'), JSON.stringify(manifest));
}

// getAssets reads the manifest once per process, so each test loads it afresh.
async function loadGetAssets() {
  vi.resetModules();
  const { default: getAssets } = await import('./getAssets.js');
  return getAssets;
}

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-server-assets-'));
  mcpJson.views.configured = false;
  vi.spyOn(process, 'cwd').mockReturnValue(root);
});

afterEach(() => {
  vi.restoreAllMocks();
  fs.rmSync(root, { recursive: true, force: true });
});

const icons = { 'build/plugins/icons.js': { file: 'assets/icons-1.js' } };

test('getAssets gives the entry script and stylesheets of a build with one entry', async () => {
  writeManifest({
    ...icons,
    'client/main.jsx': {
      file: 'assets/main-1.js',
      css: ['assets/main-1.css'],
      imports: ['_vendor.js'],
    },
    '_vendor.js': { file: 'assets/vendor-1.js' },
  });
  const assets = (await loadGetAssets())();
  expect(assets.js).toBe('assets/main-1.js');
  expect(assets.css).toEqual(['assets/main-1.css']);
  expect(assets.imports).toEqual(['assets/vendor-1.js']);
  expect(assets.view).toBeNull();
});

test('getAssets links the stylesheets of the chunks the main entry shares with the view entry', async () => {
  mcpJson.views.configured = true;
  writeManifest({
    ...icons,
    'client/main.jsx': { file: 'assets/main-1.js', imports: ['_globals.js'] },
    'client/view.jsx': { file: 'assets/view-1.js', imports: ['_globals.js', '_button.js'] },
    '_globals.js': { file: 'assets/globals-1.js', css: ['assets/globals-1.css'] },
    '_button.js': { file: 'assets/button-1.js', css: ['assets/button-1.css'] },
  });
  const assets = (await loadGetAssets())();
  expect(assets.css).toEqual(['assets/globals-1.css']);
  expect(assets.view).toEqual({
    js: 'assets/view-1.js',
    css: ['assets/globals-1.css', 'assets/button-1.css'],
  });
});

test('getAssets throws when the manifest has no main entry', async () => {
  writeManifest({ ...icons });
  const getAssets = await loadGetAssets();
  expect(() => getAssets()).toThrow('Vite manifest has no "client/main.jsx" entry.');
});

// Vite's own HTML links the stylesheets of a chunk's imports before the
// chunk's own, so the entry's rules win a tie in the cascade.
test('getAssets lists the stylesheets of statically imported chunks before the entry own, in import order', async () => {
  mcpJson.views.configured = true;
  const shared = {
    '_theme.js': { file: 'assets/theme-1.js', css: ['assets/theme-1.css'] },
    '_layout.js': {
      file: 'assets/layout-1.js',
      css: ['assets/layout-1.css'],
      imports: ['_theme.js'],
    },
    '_blocks.js': {
      file: 'assets/blocks-1.js',
      css: ['assets/blocks-1.css'],
      imports: ['_theme.js'],
    },
  };
  writeManifest({
    ...icons,
    ...shared,
    'client/main.jsx': {
      file: 'assets/main-1.js',
      css: ['assets/main-1.css'],
      imports: ['_layout.js', '_blocks.js'],
    },
    'client/view.jsx': {
      file: 'assets/view-1.js',
      css: ['assets/view-1.css'],
      imports: ['_blocks.js', '_layout.js'],
    },
  });
  const assets = (await loadGetAssets())();
  expect(assets.css).toEqual([
    'assets/theme-1.css',
    'assets/layout-1.css',
    'assets/blocks-1.css',
    'assets/main-1.css',
  ]);
  expect(assets.view.css).toEqual([
    'assets/theme-1.css',
    'assets/blocks-1.css',
    'assets/layout-1.css',
    'assets/view-1.css',
  ]);
});

test('getAssets throws for an app with a view whose client build has no view entry', async () => {
  mcpJson.views.configured = true;
  writeManifest({ ...icons, 'client/main.jsx': { file: 'assets/main-1.js' } });
  const getAssets = await loadGetAssets();
  expect(() => getAssets()).toThrow('Vite manifest has no "client/view.jsx" entry');
});
