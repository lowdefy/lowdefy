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

const mockImportFresh = jest.fn();
jest.unstable_mockModule('./importFresh.mjs', () => ({ default: mockImportFresh }));
const mockCreatePluginTypesMap = jest.fn();
jest.unstable_mockModule('@lowdefy/build', () => ({
  createPluginTypesMap: mockCreatePluginTypesMap,
}));
jest.unstable_mockModule('@lowdefy/node-utils', () => ({
  readFile: jest.fn(async () => 'plugins:\n  - name: plugin-a\n  - name: plugin-b\n'),
}));
jest.unstable_mockModule('node:module', () => ({
  createRequire: () => ({ resolve: (name) => `/plugins/${name}.js` }),
}));

const { default: createCustomPluginTypesMap } = await import('./createCustomPluginTypesMap.mjs');
const { default: createCustomPluginMessagesMap } = await import(
  './createCustomPluginMessagesMap.mjs'
);

const logger = { debug: jest.fn(), error: jest.fn(), info: jest.fn() };
const directories = { config: '/app' };

// Holds every import open until release(), so a test can see which imports
// started before any of them finished.
function deferImports(values) {
  const releases = [];
  mockImportFresh.mockImplementation(
    (filePath) =>
      new Promise((resolve) => {
        releases.push(() => resolve(values[filePath]));
      })
  );
  return {
    started: () => mockImportFresh.mock.calls.map(([filePath]) => filePath),
    release: () => releases.forEach((release) => release()),
  };
}

test('createCustomPluginTypesMap imports every plugin before any import finishes', async () => {
  const imports = deferImports({
    '/plugins/plugin-a/types.js': { blocks: ['A'] },
    '/plugins/plugin-b/types.js': { blocks: ['B'] },
  });

  const result = createCustomPluginTypesMap({ directories, logger });
  await new Promise((resolve) => setTimeout(resolve, 10));
  expect(imports.started()).toEqual(['/plugins/plugin-a/types.js', '/plugins/plugin-b/types.js']);
  imports.release();
  await result;

  expect(mockCreatePluginTypesMap.mock.calls.map(([args]) => args.packageName)).toEqual([
    'plugin-a',
    'plugin-b',
  ]);
});

test('createCustomPluginMessagesMap imports every plugin before any import finishes', async () => {
  const imports = deferImports({
    '/plugins/plugin-a/messages.js': { hello: 'A' },
    '/plugins/plugin-b/messages.js': { hello: 'B' },
  });

  const result = createCustomPluginMessagesMap({ directories, logger });
  await new Promise((resolve) => setTimeout(resolve, 10));
  expect(imports.started()).toEqual([
    '/plugins/plugin-a/messages.js',
    '/plugins/plugin-b/messages.js',
  ]);
  imports.release();

  expect(await result).toEqual({ 'plugin-a': { hello: 'A' }, 'plugin-b': { hello: 'B' } });
});
