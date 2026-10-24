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
import { vi, afterEach, beforeEach, expect, test } from 'vitest';

// The real import runs, in a worker, and the spy counts the workers started.
const { default: realImportFresh } = await vi.importActual('./importFresh.mjs');
const mockImportFresh = vi.fn(realImportFresh);
vi.doMock('./importFresh.mjs', () => ({ default: mockImportFresh }));

const { clearPluginTypeCache, importPluginModule } = await import('./pluginTypeCache.mjs');

const packageName = '@app/plugin';
let pluginDir;
let entryPath;

function writePackage({ version }) {
  fs.writeFileSync(
    path.join(pluginDir, 'package.json'),
    JSON.stringify({ name: packageName, version, type: 'module' })
  );
}

function writeBlocks(names) {
  fs.writeFileSync(
    path.join(pluginDir, 'blocks.js'),
    names.map((name) => `export const ${name} = {};\n`).join('')
  );
}

function importTypes() {
  return importPluginModule({ entryPath, packageName });
}

beforeEach(() => {
  clearPluginTypeCache();
  mockImportFresh.mockClear();
  pluginDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-plugin-type-cache-'));
  writePackage({ version: '1.0.0' });
  writeBlocks(['Card']);
  // The entry re-exports its block list, as a local plugin's types.js often
  // does, so adding a block does not change the entry file.
  entryPath = path.join(pluginDir, 'types.js');
  fs.writeFileSync(
    entryPath,
    "import * as blocks from './blocks.js';\nexport default { blocks: Object.keys(blocks) };\n"
  );
});

afterEach(() => {
  fs.rmSync(pluginDir, { recursive: true, force: true });
});

test('a second import of an unchanged plugin starts no worker', async () => {
  expect(await importTypes()).toEqual({ blocks: ['Card'] });
  expect(await importTypes()).toEqual({ blocks: ['Card'] });

  expect(mockImportFresh).toHaveBeenCalledTimes(1);
});

test('a block added to a file the entry re-exports is read once the cache is cleared', async () => {
  await importTypes();
  writeBlocks(['Card', 'Fancy']);

  expect(await importTypes()).toEqual({ blocks: ['Card'] });
  clearPluginTypeCache();
  expect(await importTypes()).toEqual({ blocks: ['Card', 'Fancy'] });
  expect(mockImportFresh).toHaveBeenCalledTimes(2);
});

test('a changed entry file size misses the cache', async () => {
  await importTypes();
  writeBlocks(['Card', 'Fancy']);
  fs.appendFileSync(entryPath, '// changed\n');

  expect(await importTypes()).toEqual({ blocks: ['Card', 'Fancy'] });
  expect(mockImportFresh).toHaveBeenCalledTimes(2);
});

test('a changed entry file mtime misses the cache', async () => {
  await importTypes();
  const { mtime } = fs.statSync(entryPath);
  fs.utimesSync(entryPath, mtime, new Date(mtime.getTime() + 5000));

  await importTypes();
  expect(mockImportFresh).toHaveBeenCalledTimes(2);
});

test('a changed package.json version misses the cache', async () => {
  await importTypes();
  writePackage({ version: '1.0.1' });

  await importTypes();
  expect(mockImportFresh).toHaveBeenCalledTimes(2);
});

test('a failed import is not cached', async () => {
  fs.writeFileSync(path.join(pluginDir, 'blocks.js'), 'export const = {;\n');
  await expect(importTypes()).rejects.toThrow();

  writeBlocks(['Card']);
  expect(await importTypes()).toEqual({ blocks: ['Card'] });
  expect(mockImportFresh).toHaveBeenCalledTimes(2);
});

test('each caller gets its own copy of the cached value', async () => {
  const first = await importTypes();
  first.blocks.push('Changed');

  expect(await importTypes()).toEqual({ blocks: ['Card'] });
});

test('the key uses the package.json with the plugin name, not a nearer one', async () => {
  // A build output folder can carry its own package.json with no version.
  fs.mkdirSync(path.join(pluginDir, 'dist'));
  fs.writeFileSync(path.join(pluginDir, 'dist', 'package.json'), '{"type":"module"}');
  fs.renameSync(entryPath, path.join(pluginDir, 'dist', 'types.js'));
  fs.renameSync(path.join(pluginDir, 'blocks.js'), path.join(pluginDir, 'dist', 'blocks.js'));
  entryPath = path.join(pluginDir, 'dist', 'types.js');
  await importTypes();
  writePackage({ version: '2.0.0' });

  await importTypes();
  expect(mockImportFresh).toHaveBeenCalledTimes(2);
});
