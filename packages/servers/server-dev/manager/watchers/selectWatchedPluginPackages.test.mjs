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

const { default: selectWatchedPluginPackages } = await import('./selectWatchedPluginPackages.mjs');

let root;
let configDirectory;

function addLinkedPackage(name) {
  const dir = path.join(root, 'plugins', name);
  fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
  fs.mkdirSync(path.dirname(path.join(configDirectory, 'node_modules', name)), {
    recursive: true,
  });
  fs.symlinkSync(dir, path.join(configDirectory, 'node_modules', name), 'dir');
  return fs.realpathSync(dir);
}

function addInstalledPackage(name) {
  fs.mkdirSync(path.join(configDirectory, 'node_modules', name), { recursive: true });
}

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-plugin-select-test-'));
  configDirectory = path.join(root, 'app');
  fs.mkdirSync(path.join(configDirectory, 'node_modules'), { recursive: true });
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

test('a linked connections-only package is watched', () => {
  const dir = addLinkedPackage('@app/db-plugin');
  const customTypesMap = {
    connections: { MyDb: { package: '@app/db-plugin', version: '1.0.0' } },
  };

  expect(selectWatchedPluginPackages({ configDirectory, customTypesMap })).toEqual([
    { package: '@app/db-plugin', dir },
  ]);
});

test('a linked blocks-only package is not watched because Vite hot-reloads it', () => {
  addLinkedPackage('@app/ui-plugin');
  const customTypesMap = {
    blocks: { Fancy: { package: '@app/ui-plugin', version: '1.0.0' } },
    actions: { Do: { package: '@app/ui-plugin', version: '1.0.0' } },
    operators: { client: { _ui: { package: '@app/ui-plugin', version: '1.0.0' } } },
  };

  expect(selectWatchedPluginPackages({ configDirectory, customTypesMap })).toEqual([]);
});

test('a linked package with both blocks and requests is watched once', () => {
  const dir = addLinkedPackage('@app/mixed-plugin');
  const customTypesMap = {
    blocks: { Fancy: { package: '@app/mixed-plugin', version: '1.0.0' } },
    requests: {
      Find: { package: '@app/mixed-plugin', version: '1.0.0' },
      Insert: { package: '@app/mixed-plugin', version: '1.0.0' },
    },
    operators: { server: { _srv: { package: '@app/mixed-plugin', version: '1.0.0' } } },
  };

  expect(selectWatchedPluginPackages({ configDirectory, customTypesMap })).toEqual([
    { package: '@app/mixed-plugin', dir },
  ]);
});

test('a server-side package resolving inside node_modules is not watched', () => {
  addInstalledPackage('@lowdefy/connection-mongodb');
  const customTypesMap = {
    connections: { MongoDB: { package: '@lowdefy/connection-mongodb', version: '4.0.0' } },
  };

  expect(selectWatchedPluginPackages({ configDirectory, customTypesMap })).toEqual([]);
});

test('auth kinds count as server-side and a missing package is skipped', () => {
  const dir = addLinkedPackage('@app/auth-plugin');
  const customTypesMap = {
    auth: { providers: { Corp: { package: '@app/auth-plugin', version: '1.0.0' } } },
    agents: { Bot: { package: '@app/not-installed', version: '1.0.0' } },
  };

  expect(selectWatchedPluginPackages({ configDirectory, customTypesMap })).toEqual([
    { package: '@app/auth-plugin', dir },
  ]);
});

test('an empty or missing customTypesMap watches nothing', () => {
  expect(selectWatchedPluginPackages({ configDirectory, customTypesMap: {} })).toEqual([]);
  expect(selectWatchedPluginPackages({ configDirectory, customTypesMap: null })).toEqual([]);
});
