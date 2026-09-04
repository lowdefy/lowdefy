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

// Chokidar's fsevents backend is slow to arm under a loaded test run, so both
// budgets are generous; every one of these resolves in well under a second
// when the watcher fires.
jest.setTimeout(30000);

function waitFor(predicate, timeout = 15000) {
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

test('watches nothing but the type map when no local server-side plugin exists', async () => {
  addLinkedPackage('@app/ui-plugin');
  writeCustomTypesMap({ blocks: { Fancy: { package: '@app/ui-plugin', version: '1.0.0' } } });

  watcher = await pluginSourceWatcher(context);

  expect(context.restartServer).not.toHaveBeenCalled();
});

test('starts even when customTypesMap.json is missing', async () => {
  watcher = await pluginSourceWatcher(context);

  expect(context.restartServer).not.toHaveBeenCalled();
});

test('a rebuild that does not change the package list does not restart the server', async () => {
  const map = { requests: { Find: { package: '@app/db-plugin', version: '1.0.0' } } };
  addLinkedPackage('@app/db-plugin');
  writeCustomTypesMap(map);

  watcher = await pluginSourceWatcher(context);
  // Every build rewrites the map; the same package list is not news.
  writeCustomTypesMap(map);
  await new Promise((resolve) => setTimeout(resolve, 800));

  expect(context.restartServer).not.toHaveBeenCalled();
});

test('a plugin package added mid-session is picked up when the type map is rewritten', async () => {
  writeCustomTypesMap({});
  const dir = addLinkedPackage('@app/late-plugin');
  fs.writeFileSync(path.join(dir, 'src', 'find.js'), 'export default 1;');

  watcher = await pluginSourceWatcher(context);
  writeCustomTypesMap({ requests: { Find: { package: '@app/late-plugin', version: '1.0.0' } } });
  await waitFor(() => context.logger.info.mock.calls.some((call) => `${call[0]}`.includes(dir)));

  fs.writeFileSync(path.join(dir, 'src', 'find.js'), 'export default 2;');
  await waitFor(() => context.restartServer.mock.calls.length > 0);

  expect(context.restartServer).toHaveBeenCalledTimes(1);
});

test('a package with a build step restarts on its built output, not on its src', async () => {
  const dir = addLinkedPackage('@app/built-plugin');
  fs.writeFileSync(
    path.join(dir, 'package.json'),
    JSON.stringify({ name: '@app/built-plugin', main: './dist/index.js' })
  );
  fs.mkdirSync(path.join(dir, 'dist'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'dist', 'index.js'), 'export default 1;');
  writeCustomTypesMap({
    connections: { MyDb: { package: '@app/built-plugin', version: '1.0.0' } },
  });

  watcher = await pluginSourceWatcher(context);
  // The restart has to land on the built output, which is what the server
  // imports - a restart onto a stale dist verifies a fix that is not running.
  fs.writeFileSync(path.join(dir, 'dist', 'index.js'), 'export default 2;');
  await waitFor(() => context.restartServer.mock.calls.length > 0);

  expect(context.restartServer).toHaveBeenCalledTimes(1);
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
