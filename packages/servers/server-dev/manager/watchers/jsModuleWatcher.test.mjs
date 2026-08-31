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

const { default: jsModuleWatcher } = await import('./jsModuleWatcher.mjs');

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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let root;
let context;
let watcher;
let artifactPath;

function writeArtifact(paths) {
  fs.writeFileSync(artifactPath, JSON.stringify(paths));
}

function writeModule(name, source) {
  const filePath = path.join(root, 'app', 'lib', name);
  fs.writeFileSync(filePath, source);
  return filePath;
}

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-js-module-watcher-'));
  const build = path.join(root, 'server', 'build');
  fs.mkdirSync(path.join(build, 'js'), { recursive: true });
  fs.mkdirSync(path.join(root, 'app', 'lib'), { recursive: true });
  artifactPath = path.join(build, 'js', 'serverModules.json');
  context = {
    directories: { build, config: path.join(root, 'app') },
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

test('editing a listed server module restarts the server', async () => {
  const modulePath = writeModule('rows.js', 'export const a = 1;');
  writeArtifact([modulePath]);

  watcher = await jsModuleWatcher(context);
  fs.writeFileSync(modulePath, 'export const a = 2;');
  await waitFor(() => context.restartServer.mock.calls.length > 0);

  expect(context.restartServer).toHaveBeenCalledTimes(1);
  expect(context.logger.info).toHaveBeenCalledWith(
    { spin: 'start' },
    'Server-side _js module changed - restarting server.'
  );
});

test('a rebuild that rewrites the artefact with the same module set does not restart', async () => {
  const modulePath = writeModule('rows.js', 'export const a = 1;');
  writeArtifact([modulePath]);

  watcher = await jsModuleWatcher(context);
  writeArtifact([modulePath]);
  await sleep(900);

  expect(context.restartServer).not.toHaveBeenCalled();
});

test('a build that adds a module restarts and extends the watch set', async () => {
  const first = writeModule('rows.js', 'export const a = 1;');
  const second = writeModule('url.js', 'export default 1;');
  writeArtifact([first]);

  watcher = await jsModuleWatcher(context);
  writeArtifact([first, second]);
  await waitFor(() => context.restartServer.mock.calls.length === 1);

  // Chokidar needs a moment to start watching the added path.
  await sleep(300);
  fs.writeFileSync(second, 'export default 2;');
  await waitFor(() => context.restartServer.mock.calls.length === 2);
});

test('starts with an empty watch set when the artefact does not exist yet', async () => {
  watcher = await jsModuleWatcher(context);
  const modulePath = writeModule('rows.js', 'export const a = 1;');
  writeArtifact([modulePath]);
  await waitFor(() => context.restartServer.mock.calls.length === 1);
});
