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

import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

import materialiseTree from './materialiseTree.js';

function git(args, cwd) {
  return execFileSync(
    'git',
    [
      '-c',
      'user.name=Test',
      '-c',
      'user.email=test@example.com',
      '-c',
      'commit.gpgsign=false',
      '-c',
      'core.hooksPath=/dev/null',
      ...args,
    ],
    { cwd, encoding: 'utf8' }
  ).trim();
}

function commitFile({ repo, file, content, message }) {
  fs.mkdirSync(path.dirname(path.join(repo, file)), { recursive: true });
  fs.writeFileSync(path.join(repo, file), content);
  git(['add', '.'], repo);
  git(['commit', '-q', '-m', message], repo);
  return git(['rev-parse', 'HEAD'], repo);
}

function createRepository() {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-explore-git-'));
  git(['init', '-q', '-b', 'main'], repo);
  return repo;
}

let repo;
beforeEach(() => {
  repo = createRepository();
});
afterEach(() => {
  fs.rmSync(repo, { recursive: true, force: true });
});

test('materialiseTree extracts the whole repository at the base commit and returns its config directory', async () => {
  commitFile({ repo, file: 'shared/blocks.yaml', content: 'base shared', message: 'Shared' });
  const base = commitFile({
    repo,
    file: 'apps/crm/lowdefy.yaml',
    content: 'lowdefy: 6.0.0\n',
    message: 'App',
  });
  commitFile({ repo, file: 'shared/blocks.yaml', content: 'head shared', message: 'Change' });
  const exploreDirectory = path.join(repo, 'apps', 'crm', '.lowdefy', 'explore');

  const tree = await materialiseTree({
    root: repo,
    sha: base,
    configDirectory: path.join(repo, 'apps', 'crm'),
    exploreDirectory,
  });

  expect(tree.cached).toBe(false);
  expect(tree.treeDirectory).toEqual(path.join(exploreDirectory, 'trees', base));
  expect(tree.configDirectory).toEqual(path.join(exploreDirectory, 'trees', base, 'apps', 'crm'));
  expect(fs.readFileSync(path.join(tree.treeDirectory, 'shared', 'blocks.yaml'), 'utf8')).toEqual(
    'base shared'
  );
  expect(fs.readFileSync(path.join(tree.configDirectory, 'lowdefy.yaml'), 'utf8')).toEqual(
    'lowdefy: 6.0.0\n'
  );
  expect(git(['worktree', 'list'], repo).split('\n')).toHaveLength(1);
  expect(fs.readdirSync(path.join(exploreDirectory, 'trees'))).toEqual([base]);
});

test('materialiseTree reuses a tree it extracted before', async () => {
  const base = commitFile({
    repo,
    file: 'lowdefy.yaml',
    content: 'lowdefy: 6.0.0\n',
    message: 'App',
  });
  const exploreDirectory = path.join(repo, '.lowdefy', 'explore');
  const first = await materialiseTree({
    root: repo,
    sha: base,
    configDirectory: repo,
    exploreDirectory,
  });
  fs.writeFileSync(path.join(first.treeDirectory, 'marker'), 'kept');

  const second = await materialiseTree({
    root: repo,
    sha: base,
    configDirectory: repo,
    exploreDirectory,
  });

  expect(second.cached).toBe(true);
  expect(second.configDirectory).toEqual(first.treeDirectory);
  expect(fs.readFileSync(path.join(second.treeDirectory, 'marker'), 'utf8')).toEqual('kept');
});
