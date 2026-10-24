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

import getPageView from '../session/getPageView.js';
import types from '../plugins/types.js';
import typeManifest from '../plugins/typeManifest.js';
import shellVersion from '../version/shellVersion.js';
import getShellConfig from './getShellConfig.js';

// The Expo config a native build embedded: its shell version is older than the JavaScript's, and its
// type manifest predates the native Markdown block.
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      shell: {
        scheme: 'lowdefy-dev',
        version: '0.1.0',
        typeManifest: {
          actions: {},
          blocks: { Screen: { package: '@lowdefy/blocks-native', version: 6 } },
          operators: {},
        },
      },
    },
  },
}));

test('getShellConfig reads the type manifest from the bundle, not the embedded Expo config', () => {
  const shell = getShellConfig();
  expect(shell.typeManifest).toBe(typeManifest);
  expect(shell.scheme).toBe('lowdefy-dev');
});

test('getShellConfig reads the shell version from the bundle, not the embedded Expo config', () => {
  expect(getShellConfig().version).toBe(shellVersion);
});

test('an app whose minShellVersion the bundled JavaScript meets opens on a shell built before it', () => {
  const root = {
    minShellVersion: shellVersion,
    pageIndex: [{ path: 'home', pageId: 'home', hash: 'h-home-1', typesKey: 'basic' }],
    typeSets: {
      basic: { blocks: [{ type: 'Screen', ...typeManifest.blocks.Screen }] },
    },
  };
  const view = getPageView({ path: 'home', shell: getShellConfig(), state: { pages: {}, root } });
  expect(view.view).toBe('loading');
});

test('a block type in the plugin maps opens on a shell whose embedded Expo config lacks it', () => {
  expect(types.blocks.Markdown).not.toBeUndefined();
  const { version } = typeManifest.blocks.Markdown;
  const root = {
    minShellVersion: null,
    pageIndex: [{ path: 'notes', pageId: 'notes', hash: 'h-notes-1', typesKey: 'markdown' }],
    typeSets: {
      markdown: {
        blocks: [
          { type: 'Screen', package: '@lowdefy/blocks-native', version },
          { type: 'Markdown', package: '@lowdefy/blocks-native', version },
        ],
      },
    },
  };
  const view = getPageView({ path: 'notes', shell: getShellConfig(), state: { pages: {}, root } });
  expect(view.view).toBe('loading');
});
