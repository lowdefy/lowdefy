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

function writePackageJson(packageJson) {
  write(
    path.join(pluginDir, 'package.json'),
    JSON.stringify({ name: '@app/plugin', type: 'module', ...packageJson })
  );
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

  const { files, unsureDirs } = listServerPluginFiles({ directories, packages });

  expect(relativeFiles(files)).toEqual([
    'dist/Api/Api.js',
    'dist/Api/data.json',
    'dist/Api/lazy.js',
    'dist/Api/request.js',
    'dist/connections.js',
    'dist/shared/format.js',
  ]);
  expect(unsureDirs.size).toBe(0);
});

test('listServerPluginFiles resolves a directory import to its index file', () => {
  write(path.join(pluginDir, 'dist', 'connections.js'), "export * from './Api';\n");
  write(path.join(pluginDir, 'dist', 'Api', 'index.js'), 'export const Api = 1;\n');

  expect(relativeFiles(listServerPluginFiles({ directories, packages }).files)).toEqual([
    'dist/Api/index.js',
    'dist/connections.js',
  ]);
});

test('listServerPluginFiles resolves a TypeScript import of an output name to its source', () => {
  writePackageJson({ exports: { './connections': './src/connections.ts' } });
  write(
    path.join(pluginDir, 'src', 'connections.ts'),
    "export { default as Api } from './Api.js';\n"
  );
  write(path.join(pluginDir, 'src', 'Api.ts'), 'export default 1;\n');

  const { files, unsureDirs } = listServerPluginFiles({ directories, packages });

  expect(relativeFiles(files)).toEqual(['src/Api.ts', 'src/connections.ts']);
  expect(unsureDirs.size).toBe(0);
});

test('listServerPluginFiles follows the ES module export of a package that also exports CommonJS', () => {
  writePackageJson({
    exports: {
      './connections': { require: './cjs/connections.cjs', import: './esm/connections.js' },
    },
  });
  write(
    path.join(pluginDir, 'esm', 'connections.js'),
    "export { default as Api } from './Api.js';\n"
  );
  write(path.join(pluginDir, 'esm', 'Api.js'), 'export default 1;\n');
  write(path.join(pluginDir, 'cjs', 'connections.cjs'), "module.exports = require('./Api.cjs');\n");
  write(path.join(pluginDir, 'cjs', 'Api.cjs'), 'module.exports = 1;\n');

  expect(relativeFiles(listServerPluginFiles({ directories, packages }).files)).toEqual([
    'esm/Api.js',
    'esm/connections.js',
  ]);
});

test('listServerPluginFiles follows subpath imports through the package imports field', () => {
  writePackageJson({
    exports: { './connections': './src/connections.js' },
    imports: { '#lib/*': './src/lib/*', '#lodash': 'lodash' },
  });
  write(
    path.join(pluginDir, 'src', 'connections.js'),
    "import query from '#lib/query.js';\nimport lodash from '#lodash';\nexport const Api = query;\n"
  );
  write(path.join(pluginDir, 'src', 'lib', 'query.js'), 'export default 1;\n');

  const { files, unsureDirs } = listServerPluginFiles({ directories, packages });

  expect(relativeFiles(files)).toEqual(['src/connections.js', 'src/lib/query.js']);
  expect(unsureDirs.size).toBe(0);
});

test('listServerPluginFiles follows server imports into another local package', () => {
  const helpersDir = path.join(root, 'plugins', 'helpers');
  write(
    path.join(helpersDir, 'package.json'),
    JSON.stringify({ name: '@app/helpers', type: 'module', exports: { './query': './query.js' } })
  );
  write(path.join(helpersDir, 'query.js'), 'export default 1;\n');
  write(path.join(helpersDir, 'Card.js'), 'export default 1;\n');
  write(
    path.join(pluginDir, 'dist', 'connections.js'),
    "import query from '@app/helpers/query';\nexport const Api = query;\n"
  );

  const { files } = listServerPluginFiles({
    directories,
    packages: [...packages, { package: '@app/helpers', dir: helpersDir }],
  });

  expect(files.has(path.join(helpersDir, 'query.js'))).toBe(true);
  expect(files.has(path.join(helpersDir, 'Card.js'))).toBe(false);
});

test('listServerPluginFiles marks a package unsure when server code imports a computed path', () => {
  write(
    path.join(pluginDir, 'dist', 'connections.js'),
    "import format from './shared/format.js';\nexport const Api = (name) => import(`./handlers/${name}.js`);\n"
  );

  const { files, unsureDirs } = listServerPluginFiles({ directories, packages });

  expect([...unsureDirs]).toEqual([pluginDir]);
  expect(relativeFiles(files)).toEqual(['dist/connections.js', 'dist/shared/format.js']);
});

test('listServerPluginFiles marks a package unsure when a server import cannot be resolved', () => {
  write(path.join(pluginDir, 'dist', 'connections.js'), "export { Api } from './missing.js';\n");

  expect([...listServerPluginFiles({ directories, packages }).unsureDirs]).toEqual([pluginDir]);
});

test('listServerPluginFiles marks a package unsure when it does not export a server import', () => {
  writePackageJson({ exports: { './blocks': './dist/blocks.js' } });

  expect([...listServerPluginFiles({ directories, packages }).unsureDirs]).toEqual([pluginDir]);
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

  const { files, unsureDirs } = listServerPluginFiles({ directories, packages });

  expect(relativeFiles(files)).toEqual(['dist/connections.js']);
  expect(unsureDirs.size).toBe(0);
});

test('listServerPluginFiles reads comment markers inside strings as text', () => {
  write(
    path.join(pluginDir, 'dist', 'connections.js'),
    [
      "const pattern = 'handlers/*';",
      'export const Api = (name) => import(`./handlers/${name}.js`);',
      '/** A later comment. */',
    ].join('\n')
  );

  expect([...listServerPluginFiles({ directories, packages }).unsureDirs]).toEqual([pluginDir]);
});

test('listServerPluginFiles lists nothing when the build has no plugin import files', () => {
  fs.rmSync(path.join(directories.build, 'plugins'), { recursive: true });

  const { files, unsureDirs } = listServerPluginFiles({ directories, packages });

  expect(files.size).toBe(0);
  expect(unsureDirs.size).toBe(0);
});
