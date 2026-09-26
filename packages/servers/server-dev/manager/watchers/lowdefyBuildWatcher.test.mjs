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

const { default: lowdefyBuildWatcher } = await import('./lowdefyBuildWatcher.mjs');

function waitFor(predicate, timeout = 5000) {
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

// The app lives in a git worktree under a dot-folder, like the worktrees
// Claude Code creates under .claude/worktrees/.
beforeEach(() => {
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
    lowdefyBuild: jest.fn(async () => {}),
    onConfigWatcherBusy: jest.fn(),
    options: { watch: [], watchIgnore: [] },
    reloadClients: jest.fn(async () => {}),
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
  watcher = await lowdefyBuildWatcher(context);
  fs.appendFileSync(path.join(configDir, 'pages', 'home.yaml'), 'layout: {}\n');

  await waitFor(invalidated);
  await waitFor(() => context.reloadClients.mock.calls.length > 0);
  expect(context.lowdefyBuild).not.toHaveBeenCalled();
});

test('adding a page to the pages list rebuilds the config', async () => {
  watcher = await lowdefyBuildWatcher(context);
  fs.appendFileSync(path.join(configDir, 'pages.yaml'), '- _ref: pages/about.yaml\n');

  await waitFor(() => context.lowdefyBuild.mock.calls.length === 1);
  expect(invalidated()).toBe(false);
});

test('after a failed config build, an edit to a file not in skeletonSourceFiles rebuilds the config', async () => {
  context.lastBuildFailed = true;
  watcher = await lowdefyBuildWatcher(context);
  write(path.join(localModuleRoot, 'api', 'check-name.yaml'), 'id: check-name\n');

  await waitFor(() => context.lowdefyBuild.mock.calls.length === 1);
  expect(invalidated()).toBe(false);
});

test('a skeleton file in a local module outside the config directory rebuilds the config', async () => {
  watcher = await lowdefyBuildWatcher(context);
  fs.appendFileSync(path.join(localModuleRoot, 'menus.yaml'), '- id: other\n');

  await waitFor(() => context.lowdefyBuild.mock.calls.length === 1);
});

test('a file the build read outside every watched directory invalidates pages when edited', async () => {
  watcher = await lowdefyBuildWatcher(context);
  fs.appendFileSync(
    path.join(repoDir, '.claude', 'worktrees', 'feature', 'modules', 'shared', 'title-block.yaml'),
    'type: Box\n'
  );

  await waitFor(invalidated);
  expect(context.lowdefyBuild).not.toHaveBeenCalled();
});

test('a file that appears in refMap.json after the watch started is watched', async () => {
  const footer = path.join(repoDir, 'shared', 'footer.yaml');
  write(footer, 'id: footer\n');
  watcher = await lowdefyBuildWatcher(context);

  const refMap = JSON.parse(fs.readFileSync(path.join(buildDir, 'refMap.json'), 'utf8'));
  refMap[6] = { parent: '3', path: path.relative(configDir, footer) };
  fs.writeFileSync(path.join(buildDir, 'refMap.json'), JSON.stringify(refMap));
  // The refMap watcher batches its change for half a second before adding.
  await new Promise((resolve) => setTimeout(resolve, 1500));
  fs.appendFileSync(footer, 'type: Box\n');

  await waitFor(invalidated);
});
