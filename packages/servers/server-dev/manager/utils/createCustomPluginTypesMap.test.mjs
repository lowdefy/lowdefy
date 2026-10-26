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

import fs from 'fs';
import os from 'os';
import path from 'path';
import { vi, afterAll, beforeEach, expect, test } from 'vitest';

// The plugin type cache reads each entry file's stat and package.json, so the
// resolved entries are real files. Their contents are never imported.
const pluginsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-custom-plugin-maps-'));
['plugin-a', 'plugin-b'].forEach((name) => {
  fs.mkdirSync(path.join(pluginsDir, name));
  fs.writeFileSync(
    path.join(pluginsDir, name, 'package.json'),
    JSON.stringify({ name, version: '1.0.0' })
  );
  fs.writeFileSync(path.join(pluginsDir, name, 'types.js'), '');
  fs.writeFileSync(path.join(pluginsDir, name, 'messages.js'), '');
});
const entry = (name) => path.join(pluginsDir, `${name}.js`);

const mockImportFresh = vi.fn();
vi.doMock('./importFresh.mjs', () => ({ default: mockImportFresh }));
const mockCreatePluginTypesMap = vi.fn();
vi.doMock('@lowdefy/build', () => ({
  createPluginTypesMap: mockCreatePluginTypesMap,
}));
// The module under test imports @lowdefy/build, which links against every
// export it uses, so the real module passes through and only readFile is
// replaced.
const realNodeUtils = await import('@lowdefy/node-utils');
vi.doMock('@lowdefy/node-utils', () => ({
  ...realNodeUtils,
  readFile: vi.fn(async () => 'plugins:\n  - name: plugin-a\n  - name: plugin-b\n'),
}));
vi.doMock('node:module', () => ({
  createRequire: () => ({ resolve: entry }),
}));

const { default: createCustomPluginTypesMap } = await import('./createCustomPluginTypesMap.mjs');
const { default: createCustomPluginMessagesMap } = await import(
  './createCustomPluginMessagesMap.mjs'
);
const { clearPluginTypeCache } = await import('./pluginTypeCache.mjs');

const logger = { debug: vi.fn(), error: vi.fn(), info: vi.fn() };
const directories = { config: '/app' };

beforeEach(() => {
  clearPluginTypeCache();
  mockImportFresh.mockReset();
  mockCreatePluginTypesMap.mockReset();
});

afterAll(() => {
  fs.rmSync(pluginsDir, { recursive: true, force: true });
});

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
    [entry('plugin-a/types')]: { blocks: ['A'] },
    [entry('plugin-b/types')]: { blocks: ['B'] },
  });

  const result = createCustomPluginTypesMap({ directories, logger });
  await new Promise((resolve) => setTimeout(resolve, 10));
  expect(imports.started()).toEqual([entry('plugin-a/types'), entry('plugin-b/types')]);
  imports.release();
  await result;

  expect(mockCreatePluginTypesMap.mock.calls.map(([args]) => args.packageName)).toEqual([
    'plugin-a',
    'plugin-b',
  ]);
});

test('createCustomPluginMessagesMap imports every plugin before any import finishes', async () => {
  const imports = deferImports({
    [entry('plugin-a/messages')]: { hello: 'A' },
    [entry('plugin-b/messages')]: { hello: 'B' },
  });

  const result = createCustomPluginMessagesMap({ directories, logger });
  await new Promise((resolve) => setTimeout(resolve, 10));
  expect(imports.started()).toEqual([entry('plugin-a/messages'), entry('plugin-b/messages')]);
  imports.release();

  expect(await result).toEqual({ 'plugin-a': { hello: 'A' }, 'plugin-b': { hello: 'B' } });
});

function resolveImports(values) {
  mockImportFresh.mockImplementation(async (filePath) => values[filePath]);
}

test('a second cached build of the plugin maps starts no import workers', async () => {
  resolveImports({
    [entry('plugin-a/types')]: { blocks: ['A'] },
    [entry('plugin-b/types')]: { blocks: ['B'] },
    [entry('plugin-a/messages')]: { hello: 'A' },
    [entry('plugin-b/messages')]: { hello: 'B' },
  });
  const build = () =>
    Promise.all([
      createCustomPluginTypesMap({ cache: true, directories, logger }),
      createCustomPluginMessagesMap({ cache: true, directories, logger }),
    ]);

  await build();
  expect(mockImportFresh).toHaveBeenCalledTimes(4);
  const [, messagesMap] = await build();

  expect(mockImportFresh).toHaveBeenCalledTimes(4);
  expect(messagesMap).toEqual({ 'plugin-a': { hello: 'A' }, 'plugin-b': { hello: 'B' } });
  expect(mockCreatePluginTypesMap.mock.calls.map(([args]) => args.packageTypes)).toEqual([
    { blocks: ['A'] },
    { blocks: ['B'] },
    { blocks: ['A'] },
    { blocks: ['B'] },
  ]);
});

test('the plugin maps import every plugin afresh without cache: true', async () => {
  resolveImports({
    [entry('plugin-a/types')]: { blocks: ['A'] },
    [entry('plugin-b/types')]: { blocks: ['B'] },
  });

  await createCustomPluginTypesMap({ directories, logger });
  await createCustomPluginTypesMap({ directories, logger });

  expect(mockImportFresh).toHaveBeenCalledTimes(4);
});
