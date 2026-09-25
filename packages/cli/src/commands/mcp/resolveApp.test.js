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

import resolveApp from './resolveApp.js';

let root;

function makeApp(relativePath) {
  const directory = path.join(root, relativePath);
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, 'lowdefy.yaml'), 'lowdefy: 6.0.0\n');
  return directory;
}

beforeEach(() => {
  root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-resolve-app-')));
  fs.mkdirSync(path.join(root, '.git'));
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

test('resolveApp returns the app when the working directory is the app', () => {
  makeApp('.');
  expect(resolveApp({ cwd: root })).toEqual({ configDirectory: root, root });
});

test('resolveApp returns the app containing a nested directory', () => {
  const app = makeApp('apps/main');
  fs.mkdirSync(path.join(app, 'pages'));
  expect(resolveApp({ cwd: path.join(app, 'pages') }).configDirectory).toEqual(app);
});

test('resolveApp returns the only app under the checkout root', () => {
  const app = makeApp('apps/main');
  expect(resolveApp({ cwd: root }).configDirectory).toEqual(app);
});

test('resolveApp resolves an explicit directory relative to the working directory', () => {
  makeApp('apps/main');
  const second = makeApp('apps/second');
  expect(resolveApp({ cwd: root, directory: 'apps/second' }).configDirectory).toEqual(second);
});

test('resolveApp resolves an absolute directory in another checkout, whatever the working directory', () => {
  makeApp('apps/main');
  const other = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-other-checkout-')));
  fs.mkdirSync(path.join(other, '.git'));
  fs.writeFileSync(path.join(other, 'lowdefy.yaml'), 'lowdefy: 6.0.0\n');
  try {
    expect(resolveApp({ cwd: root, directory: other })).toEqual({
      configDirectory: other,
      root: other,
    });
  } finally {
    fs.rmSync(other, { recursive: true, force: true });
  }
});

test('resolveApp lists the apps when the checkout holds several and none was named', () => {
  makeApp('apps/main');
  makeApp('apps/second');
  expect(() => resolveApp({ cwd: root })).toThrow(
    /several Lowdefy apps[\s\S]*apps\/main[\s\S]*apps\/second/
  );
});

test('resolveApp ignores apps inside a nested git worktree', () => {
  const app = makeApp('apps/main');
  const nested = path.join(root, '.claude', 'worktrees', 'agent-1');
  fs.mkdirSync(nested, { recursive: true });
  fs.writeFileSync(path.join(nested, '.git'), 'gitdir: /somewhere\n');
  fs.mkdirSync(path.join(nested, 'apps', 'main'), { recursive: true });
  fs.writeFileSync(path.join(nested, 'apps', 'main', 'lowdefy.yaml'), 'lowdefy: 6.0.0\n');
  expect(resolveApp({ cwd: root }).configDirectory).toEqual(app);
});

test('resolveApp throws when there is no app in the checkout', () => {
  expect(() => resolveApp({ cwd: root })).toThrow('No Lowdefy app (lowdefy.yaml) found');
});
