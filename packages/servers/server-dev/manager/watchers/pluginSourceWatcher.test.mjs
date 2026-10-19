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

import flushFsEvents from '../../test-utils/flushFsEvents.mjs';
import waitFor from '../../test-utils/waitFor.mjs';

const { default: pluginSourceWatcher } = await import('./pluginSourceWatcher.mjs');

// macOS can hold file events back for tens of seconds on a busy machine.
jest.setTimeout(180000);

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

// Otherwise the fixture writes can reach the watcher as edits and rebuild
// before the edit under test.
async function startWatcher() {
  await flushFsEvents();
  watcher = await pluginSourceWatcher(context);
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

  await startWatcher();
  fs.writeFileSync(path.join(dir, file), 'export default 2;');
  await waitFor(() => context.reloadClients.mock.calls.length > 0, {
    description: 'clients to reload',
  });

  expect(context.lowdefyBuild).toHaveBeenCalledTimes(1);
  expect(context.syncServer).toHaveBeenCalledWith({ restart });
  expect(context.buildActivity.setBusy.mock.calls[0]).toEqual([true]);
});

test('a fix to a plugin whose edit failed the build rebuilds again', async () => {
  const dir = addLinkedPackage('@app/plugin');
  fs.writeFileSync(path.join(dir, 'src', 'types.js'), 'export default {};');
  writeLowdefyYaml(['@app/plugin']);
  context.lowdefyBuild.mockRejectedValueOnce(new Error('Failed to import plugin "@app/plugin".'));

  await startWatcher();
  fs.writeFileSync(path.join(dir, 'src', 'types.js'), 'export default {;');
  await waitFor(() => context.syncServer.mock.calls.length === 1, {
    description: 'the failed build to sync the server',
  });
  fs.writeFileSync(path.join(dir, 'src', 'types.js'), 'export default { blocks: [] };');
  await waitFor(() => context.syncServer.mock.calls.length === 2, {
    description: 'the fixed build to sync the server',
  });

  expect(context.lowdefyBuild).toHaveBeenCalledTimes(2);
});

function linkConfigAsPackage(name) {
  const dir = context.directories.config;
  fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'dist'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'public', 'md'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'pages'), { recursive: true });
  const linked = path.join(context.directories.server, 'node_modules', name);
  fs.mkdirSync(path.dirname(linked), { recursive: true });
  fs.symlinkSync(dir, linked, 'dir');
  return dir;
}

// Gives chokidar time to report an event the watcher should ignore, then
// checks no build ran: a build would have started within the batch delay.
async function expectNoRebuild() {
  await new Promise((resolve) => setTimeout(resolve, 1200));
  expect(context.lowdefyBuild).not.toHaveBeenCalled();
}

describe('a plugin package that is also the config directory', () => {
  // Only non-code files are written before the watcher starts: macOS can
  // report a write made just before the watch began, which for a code file
  // would rebuild and spoil a test that expects none.
  beforeEach(() => {
    const dir = linkConfigAsPackage('@app/docs');
    fs.writeFileSync(path.join(dir, 'public', 'llms.txt'), 'one');
    fs.writeFileSync(path.join(dir, 'public', 'search-index.json'), '[]');
    fs.writeFileSync(path.join(dir, 'public', 'md', 'page.md'), 'one');
    fs.writeFileSync(path.join(dir, 'pages', 'home.yaml'), 'id: home');
    fs.writeFileSync(path.join(dir, 'pages', 'home.md'), 'one');
    writeLowdefyYaml(['@app/docs']);
  });

  test.each([['public/llms.txt'], ['public/search-index.json'], ['public/md/page.md']])(
    'writing %s does not rebuild',
    async (file) => {
      await startWatcher();
      fs.writeFileSync(path.join(context.directories.config, file), 'two');
      await expectNoRebuild();
    }
  );

  test.each([['pages/home.yaml'], ['pages/home.md']])(
    'editing %s does not rebuild',
    async (file) => {
      await startWatcher();
      fs.writeFileSync(path.join(context.directories.config, file), 'two');
      await expectNoRebuild();
    }
  );

  test('writing into the build directory does not rebuild', async () => {
    await startWatcher();
    fs.writeFileSync(path.join(context.directories.build, 'keyMap.json'), '{}');
    await expectNoRebuild();
  });

  test.each([['src/types.js'], ['dist/types.js']])('editing %s rebuilds', async (file) => {
    await startWatcher();
    fs.writeFileSync(path.join(context.directories.config, file), 'export default 2;');
    await waitFor(() => context.reloadClients.mock.calls.length > 0);
    expect(context.lowdefyBuild).toHaveBeenCalledTimes(1);
  });
});

test.each([
  ['a .js file rebuilds', 'src/other.js', true],
  ['a .json file rebuilds', 'package.json', true],
  ['a .md file does not rebuild', 'README.md', false],
  ['a .yaml file does not rebuild', 'src/config.yaml', false],
  ['a file with no extension does not rebuild', 'LICENSE', false],
])('in a plugin outside the config directory, %s', async (_, file, rebuilds) => {
  const dir = addLinkedPackage('@app/plugin');
  fs.writeFileSync(path.join(dir, file), 'one');
  writeLowdefyYaml(['@app/plugin']);

  await startWatcher();
  fs.writeFileSync(path.join(dir, file), 'two');
  if (rebuilds) {
    await waitFor(() => context.reloadClients.mock.calls.length > 0);
    expect(context.lowdefyBuild).toHaveBeenCalledTimes(1);
    return;
  }
  await expectNoRebuild();
});
