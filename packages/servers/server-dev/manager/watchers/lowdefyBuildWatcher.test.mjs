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
import spyOnChokidar from '../../test-utils/spyOnChokidar.mjs';
import waitFor from '../../test-utils/waitFor.mjs';

const watchers = spyOnChokidar();
const { default: lowdefyBuildWatcher } = await import('./lowdefyBuildWatcher.mjs');

// macOS can hold file events back for tens of seconds on a busy machine.
jest.setTimeout(180000);

function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

let repoDir;
let configDir;
let buildDir;
let localModuleRoot;
let context;
let watcher;

function invalidated() {
  return fs.existsSync(path.join(buildDir, 'invalidatePages'));
}

// Starts the watcher under test and returns the chokidar watcher it watches
// the app with, the first one it creates.
async function startWatcher() {
  const first = watchers.length;
  watcher = await lowdefyBuildWatcher(context);
  return watchers[first].watcher;
}

function isWatched({ configWatcher, filePath }) {
  const names = configWatcher.getWatched()[path.dirname(filePath)] ?? [];
  return names.includes(path.basename(filePath));
}

// A file added to a running watcher is listed as watched a moment before its
// event stream starts, so an edit made in that gap goes unseen. The file is
// edited again every two seconds - well past the watcher's batch delay, so an
// edit that was seen is processed before the next - until pages are
// invalidated. Only a watched file can invalidate them.
async function editUntilInvalidated(filePath) {
  await waitFor(
    () => {
      if (invalidated()) return true;
      fs.appendFileSync(filePath, 'type: Box\n');
      return false;
    },
    { interval: 2000, description: `an edit to ${path.basename(filePath)} to invalidate pages` }
  );
}

// The app lives in a git worktree under a dot-folder, like the worktrees
// Claude Code creates under .claude/worktrees/.
beforeEach(async () => {
  const tmpDir = fs.realpathSync(os.tmpdir());
  repoDir = fs.mkdtempSync(path.join(tmpDir, 'lowdefy-build-watcher-test-'));
  const worktreeDir = path.join(repoDir, '.claude', 'worktrees', 'feature');
  configDir = path.join(worktreeDir, 'app');
  buildDir = path.join(configDir, '.lowdefy', 'server', 'build');
  localModuleRoot = path.join(worktreeDir, 'modules', 'layout');

  write(path.join(configDir, 'lowdefy.yaml'), 'lowdefy: local\n');
  write(path.join(configDir, 'pages.yaml'), '- _ref: pages/home.yaml\n');
  write(path.join(configDir, 'pages', 'home.yaml'), 'id: home\ntype: Box\n');
  write(path.join(localModuleRoot, 'module.lowdefy.yaml'), 'name: Layout\n');
  write(path.join(localModuleRoot, 'menus.yaml'), '- id: main\n');
  write(path.join(worktreeDir, 'modules', 'shared', 'title-block.yaml'), 'id: title\n');
  write(
    path.join(buildDir, 'skeletonSourceFiles.json'),
    JSON.stringify(['pages.yaml', path.join(localModuleRoot, 'menus.yaml')])
  );
  write(
    path.join(buildDir, 'refMap.json'),
    JSON.stringify({
      1: { parent: null },
      2: { parent: '1', path: 'pages.yaml' },
      3: { parent: '2', path: 'pages/home.yaml' },
      4: { parent: null, path: path.join(localModuleRoot, 'components', 'page.yaml') },
      5: { parent: '4', path: path.join(worktreeDir, 'modules', 'shared', 'title-block.yaml') },
    })
  );
  // Otherwise the fixture writes can reach the watcher as edits: a
  // lowdefy.yaml "edit" turns every page edit into a config rebuild.
  await flushFsEvents();

  context = {
    buildContext: {
      modules: {
        layout: { isLocal: true, moduleRoot: localModuleRoot },
        remote: { isLocal: false, moduleRoot: path.join(repoDir, 'cache', 'remote') },
      },
    },
    directories: {
      build: buildDir,
      config: configDir,
      server: path.join(configDir, '.lowdefy', 'server'),
    },
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
    buildActivity: { setBusy: jest.fn() },
    lowdefyBuild: jest.fn(async () => {}),
    options: { watch: [], watchIgnore: [] },
    reloadClients: jest.fn(async () => {}),
    syncServer: jest.fn(async () => {}),
    version: 'local',
  };
});

afterEach(async () => {
  if (watcher) {
    await watcher.close();
    watcher = undefined;
  }
  fs.rmSync(repoDir, { recursive: true, force: true });
});

test('a page file edit in an app under a dot-folder invalidates pages', async () => {
  await startWatcher();
  fs.appendFileSync(path.join(configDir, 'pages', 'home.yaml'), 'layout: {}\n');

  await waitFor(invalidated, { description: 'pages to be invalidated' });
  await waitFor(() => context.reloadClients.mock.calls.length > 0, {
    description: 'clients to reload',
  });
  expect(context.lowdefyBuild).not.toHaveBeenCalled();
  expect(context.syncServer).not.toHaveBeenCalled();
});

test('adding a page to the pages list rebuilds the config', async () => {
  await startWatcher();
  fs.appendFileSync(path.join(configDir, 'pages.yaml'), '- _ref: pages/about.yaml\n');

  await waitFor(() => context.lowdefyBuild.mock.calls.length === 1, {
    description: 'a config build',
  });
  await waitFor(invalidated, { description: 'the pages to be invalidated' });
});

test('a config rebuild stays busy until the server has caught up with the build', async () => {
  let finishSync;
  context.syncServer.mockImplementation(
    () =>
      new Promise((resolve) => {
        finishSync = resolve;
      })
  );
  await startWatcher();
  fs.appendFileSync(path.join(configDir, 'pages.yaml'), '- _ref: pages/about.yaml\n');

  await waitFor(() => context.syncServer.mock.calls.length === 1, {
    description: 'the server sync',
  });
  expect(context.buildActivity.setBusy.mock.calls).toEqual([[true]]);
  finishSync();
  await waitFor(() => context.buildActivity.setBusy.mock.calls.length === 2, {
    description: 'the watcher to report it is idle',
  });
  expect(context.buildActivity.setBusy.mock.calls).toEqual([[true], [false]]);
});

test('a lowdefy.yaml edit that breaks its YAML syntax still rebuilds the config', async () => {
  await startWatcher();
  write(path.join(configDir, 'lowdefy.yaml'), 'lowdefy: local\npages:\n  - id: a\n   - id: b\n');

  await waitFor(() => context.lowdefyBuild.mock.calls.length === 1, {
    description: 'a config build',
  });
  expect(context.logger.error).not.toHaveBeenCalled();
});

test('after a failed config build, an edit to a file not in skeletonSourceFiles rebuilds the config', async () => {
  context.lastBuildFailed = true;
  await startWatcher();
  write(path.join(localModuleRoot, 'api', 'check-name.yaml'), 'id: check-name\n');

  await waitFor(() => context.lowdefyBuild.mock.calls.length === 1, {
    description: 'a config build',
  });
  await waitFor(invalidated, { description: 'the pages to be invalidated' });
});

test('a skeleton file in a local module outside the config directory rebuilds the config', async () => {
  await startWatcher();
  fs.appendFileSync(path.join(localModuleRoot, 'menus.yaml'), '- id: other\n');

  await waitFor(() => context.lowdefyBuild.mock.calls.length === 1, {
    description: 'a config build',
  });
});

test('a file the build read outside every watched directory invalidates pages when edited', async () => {
  const titleBlock = path.join(
    repoDir,
    '.claude',
    'worktrees',
    'feature',
    'modules',
    'shared',
    'title-block.yaml'
  );
  const configWatcher = await startWatcher();

  await waitFor(() => isWatched({ configWatcher, filePath: titleBlock }), {
    description: 'title-block.yaml to be watched',
  });
  await editUntilInvalidated(titleBlock);
  expect(context.lowdefyBuild).not.toHaveBeenCalled();
});

test('a file that appears in refMap.json after the watch started is watched', async () => {
  const footer = path.join(repoDir, 'shared', 'footer.yaml');
  write(footer, 'id: footer\n');
  await flushFsEvents();
  const configWatcher = await startWatcher();
  expect(isWatched({ configWatcher, filePath: footer })).toBe(false);

  const refMap = JSON.parse(fs.readFileSync(path.join(buildDir, 'refMap.json'), 'utf8'));
  refMap[6] = { parent: '3', path: path.relative(configDir, footer) };
  fs.writeFileSync(path.join(buildDir, 'refMap.json'), JSON.stringify(refMap));

  // The refMap watcher batches its change before adding the file.
  await waitFor(() => isWatched({ configWatcher, filePath: footer }), {
    description: 'footer.yaml to be watched',
  });
  await editUntilInvalidated(footer);
});

test('a file a JIT page build read outside every watched directory is watched from its jitMaps file', async () => {
  const header = path.join(repoDir, 'shared', 'header.yaml');
  write(header, 'id: header\n');
  watcher = await lowdefyBuildWatcher(context);

  write(
    path.join(buildDir, 'jitMaps', 'abc123-1-1.json'),
    JSON.stringify({
      keyMap: {},
      refMap: { p_abc123_1: { parent: null, path: path.relative(configDir, header) } },
    })
  );
  // The maps watcher batches its change for half a second before adding.
  await new Promise((resolve) => setTimeout(resolve, 1500));
  fs.appendFileSync(header, 'type: Box\n');

  await waitFor(invalidated);
});
