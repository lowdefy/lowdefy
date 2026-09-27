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
import { jest } from '@jest/globals';

const { default: pluginSourceWatcher } = await import('./pluginSourceWatcher.mjs');

function waitFor(predicate, timeout = 3000) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const tick = () => {
      if (predicate()) return resolve();
      if (Date.now() - started > timeout) return reject(new Error('Timed out waiting.'));
      setTimeout(tick, 25);
    };
    tick();
  });
}

let root;
let context;
let watcher;

function writeCustomTypesMap(customTypesMap) {
  fs.writeFileSync(
    path.join(context.directories.build, 'customTypesMap.json'),
    JSON.stringify(customTypesMap)
  );
}

function writeLowdefyYaml(pluginNames) {
  fs.writeFileSync(
    path.join(context.directories.config, 'lowdefy.yaml'),
    `lowdefy: local\nplugins:\n${pluginNames
      .map((name) => `  - name: '${name}'\n    version: 'workspace:*'\n`)
      .join('')}`
  );
}

function addLinkedPackage(name) {
  const dir = path.join(root, 'plugins', name);
  fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'dist'), { recursive: true });
  const linked = path.join(context.directories.server, 'node_modules', name);
  fs.mkdirSync(path.dirname(linked), { recursive: true });
  fs.symlinkSync(dir, linked, 'dir');
  return dir;
}

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-plugin-watcher-test-'));
  const config = path.join(root, 'app');
  const server = path.join(config, '.lowdefy', 'dev');
  fs.mkdirSync(path.join(server, 'node_modules'), { recursive: true });
  fs.mkdirSync(path.join(server, 'build'), { recursive: true });
  context = {
    buildActivity: { setBusy: jest.fn() },
    directories: { build: path.join(server, 'build'), config, server },
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
    lowdefyBuild: jest.fn(async () => {}),
    reloadClients: jest.fn(async () => {}),
    syncServer: jest.fn(async () => {}),
  };
  writeCustomTypesMap({});
});

afterEach(async () => {
  if (watcher) {
    await watcher.close();
    watcher = undefined;
  }
  fs.rmSync(root, { recursive: true, force: true });
});

test('pluginSourceWatcher watches nothing when lowdefy.yaml lists no local plugin', async () => {
  writeLowdefyYaml(['@lowdefy/blocks-basic']);

  await expect(pluginSourceWatcher(context)).resolves.toBeUndefined();
});

test.each([
  ['a server-side plugin rebuilds and restarts the server', 'requests', 'src/find.js', true],
  ['a block-only plugin rebuilds without a restart', 'blocks', 'src/Fancy.js', false],
  ['a plugin imported from its build output rebuilds', 'blocks', 'dist/Fancy.js', false],
])('editing %s', async (_, kind, file, restart) => {
  const dir = addLinkedPackage('@app/plugin');
  fs.writeFileSync(path.join(dir, file), 'export default 1;');
  writeLowdefyYaml(['@app/plugin']);
  writeCustomTypesMap({ [kind]: { Type: { package: '@app/plugin', version: '1.0.0' } } });

  watcher = await pluginSourceWatcher(context);
  fs.writeFileSync(path.join(dir, file), 'export default 2;');
  await waitFor(() => context.reloadClients.mock.calls.length > 0);

  expect(context.lowdefyBuild).toHaveBeenCalledTimes(1);
  expect(context.syncServer).toHaveBeenCalledWith({ restart });
  expect(context.buildActivity.setBusy.mock.calls[0]).toEqual([true]);
});

test('a fix to a plugin whose edit failed the build rebuilds again', async () => {
  const dir = addLinkedPackage('@app/plugin');
  fs.writeFileSync(path.join(dir, 'src', 'types.js'), 'export default {};');
  writeLowdefyYaml(['@app/plugin']);
  context.lowdefyBuild.mockRejectedValueOnce(new Error('Failed to import plugin "@app/plugin".'));

  watcher = await pluginSourceWatcher(context);
  fs.writeFileSync(path.join(dir, 'src', 'types.js'), 'export default {;');
  await waitFor(() => context.syncServer.mock.calls.length === 1);
  fs.writeFileSync(path.join(dir, 'src', 'types.js'), 'export default { blocks: [] };');
  await waitFor(() => context.syncServer.mock.calls.length === 2);

  expect(context.lowdefyBuild).toHaveBeenCalledTimes(2);
});
