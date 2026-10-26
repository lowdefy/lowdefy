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
import { afterEach, beforeEach, expect, test } from 'vitest';

import listServerPluginFiles from './listServerPluginFiles.mjs';

let root;
let directories;
let pluginDir;
let packages;

function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function relativeFiles(files) {
  return [...files].map((filePath) => path.relative(pluginDir, filePath)).sort();
}

beforeEach(() => {
  root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-server-files-test-')));
  const server = path.join(root, 'app', '.lowdefy', 'dev');
  directories = { build: path.join(server, 'build'), server };
  pluginDir = path.join(root, 'plugins', 'plugin');
  write(
    path.join(pluginDir, 'package.json'),
    JSON.stringify({
      name: '@app/plugin',
      type: 'module',
      exports: { './connections': './dist/connections.js', './blocks': './dist/blocks.js' },
    })
  );
  fs.mkdirSync(path.join(server, 'node_modules', '@app'), { recursive: true });
  fs.symlinkSync(pluginDir, path.join(server, 'node_modules', '@app', 'plugin'), 'dir');
  write(
    path.join(directories.build, 'plugins', 'connections.js'),
    "import { Api as Api } from '@app/plugin/connections';\nexport default { Api };\n"
  );
  write(
    path.join(directories.build, 'plugins', 'blocks.js'),
    "import { Card as Card } from '@app/plugin/blocks';\nexport default { Card };\n"
  );
  write(
    path.join(pluginDir, 'dist', 'blocks.js'),
    "export { default as Card } from './Card.js';\n"
  );
  write(path.join(pluginDir, 'dist', 'Card.js'), "import format from './shared/format.js';\n");
  write(path.join(pluginDir, 'dist', 'shared', 'format.js'), 'export default 1;\n');
  packages = [{ package: '@app/plugin', dir: pluginDir }];
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

test('listServerPluginFiles lists the files reachable from server-side plugin imports only', () => {
  write(
    path.join(pluginDir, 'dist', 'connections.js'),
    "export { default as Api } from './Api/Api.js';\n"
  );
  write(
    path.join(pluginDir, 'dist', 'Api', 'Api.js'),
    [
      "import request from './request';",
      "import format from '../shared/format.js';",
      "import data from './data.json' with { type: 'json' };",
      "const lazy = () => import('./lazy.js');",
      "import lodash from 'lodash';",
    ].join('\n')
  );
  write(path.join(pluginDir, 'dist', 'Api', 'request.js'), 'export default 1;\n');
  write(path.join(pluginDir, 'dist', 'Api', 'data.json'), '{}');
  write(path.join(pluginDir, 'dist', 'Api', 'lazy.js'), 'export default 1;\n');

  expect(relativeFiles(listServerPluginFiles({ directories, packages }))).toEqual([
    'dist/Api/Api.js',
    'dist/Api/data.json',
    'dist/Api/lazy.js',
    'dist/Api/request.js',
    'dist/connections.js',
    'dist/shared/format.js',
  ]);
});

test('listServerPluginFiles resolves a directory import to its index file', () => {
  write(path.join(pluginDir, 'dist', 'connections.js'), "export * from './Api';\n");
  write(path.join(pluginDir, 'dist', 'Api', 'index.js'), 'export const Api = 1;\n');

  expect(relativeFiles(listServerPluginFiles({ directories, packages }))).toEqual([
    'dist/Api/index.js',
    'dist/connections.js',
  ]);
});

test('listServerPluginFiles returns null when server code imports a computed path', () => {
  write(
    path.join(pluginDir, 'dist', 'connections.js'),
    'export const Api = (name) => import(`./handlers/${name}.js`);\n'
  );

  expect(listServerPluginFiles({ directories, packages })).toBe(null);
});

test('listServerPluginFiles returns null when a server import cannot be resolved', () => {
  write(path.join(pluginDir, 'dist', 'connections.js'), "export { Api } from './missing.js';\n");

  expect(listServerPluginFiles({ directories, packages })).toBe(null);
});

test('listServerPluginFiles ignores imports written in comments', () => {
  write(
    path.join(pluginDir, 'dist', 'connections.js'),
    [
      '/* A computed import(name) would be refused. */',
      "// import('./missing.js') used to live here",
      "const url = 'https://example.com/docs';",
      'export const Api = url;',
    ].join('\n')
  );

  expect(relativeFiles(listServerPluginFiles({ directories, packages }))).toEqual([
    'dist/connections.js',
  ]);
});

test('listServerPluginFiles returns an empty set when the build has no plugin import files', () => {
  fs.rmSync(path.join(directories.build, 'plugins'), { recursive: true });

  expect(listServerPluginFiles({ directories, packages }).size).toBe(0);
});
