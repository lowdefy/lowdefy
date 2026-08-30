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

function addLinkedPackage(name) {
  const dir = path.join(root, 'plugins', name);
  fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
  fs.mkdirSync(path.dirname(path.join(context.directories.config, 'node_modules', name)), {
    recursive: true,
  });
  fs.symlinkSync(dir, path.join(context.directories.config, 'node_modules', name), 'dir');
  return dir;
}

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-plugin-watcher-test-'));
  const config = path.join(root, 'app');
  fs.mkdirSync(path.join(config, 'node_modules'), { recursive: true });
  fs.mkdirSync(path.join(config, 'build'), { recursive: true });
  context = {
    directories: { build: path.join(config, 'build'), config },
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
    restartServer: jest.fn(),
  };
});

afterEach(async () => {
  if (watcher) {
    await watcher.close();
    watcher = undefined;
  }
  fs.rmSync(root, { recursive: true, force: true });
});

test('resolves immediately without watching when no local server-side plugin exists', async () => {
  addLinkedPackage('@app/ui-plugin');
  writeCustomTypesMap({ blocks: { Fancy: { package: '@app/ui-plugin', version: '1.0.0' } } });

  await expect(pluginSourceWatcher(context)).resolves.toBeUndefined();
  expect(context.restartServer).not.toHaveBeenCalled();
});

test('resolves immediately when customTypesMap.json is missing', async () => {
  await expect(pluginSourceWatcher(context)).resolves.toBeUndefined();
});

test('editing a request implementation under src restarts the server', async () => {
  const dir = addLinkedPackage('@app/db-plugin');
  fs.writeFileSync(path.join(dir, 'src', 'find.js'), 'export default 1;');
  writeCustomTypesMap({ requests: { Find: { package: '@app/db-plugin', version: '1.0.0' } } });

  watcher = await pluginSourceWatcher(context);
  fs.writeFileSync(path.join(dir, 'src', 'find.js'), 'export default 2;');
  await waitFor(() => context.restartServer.mock.calls.length > 0);

  expect(context.restartServer).toHaveBeenCalledTimes(1);
  expect(context.logger.info).toHaveBeenCalledWith(
    { spin: 'start' },
    'Local plugin source changed, restarting server.'
  );
});
