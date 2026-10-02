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
import { jest } from '@jest/globals';

import findRepositoryKey from './findRepositoryKey.js';

// Each test runs git several times; timing is not under test.
jest.setTimeout(60000);

let base;

function git(args, cwd) {
  return execFileSync(
    'git',
    [
      '-c',
      'commit.gpgsign=false',
      '-c',
      'user.name=Lowdefy Test',
      '-c',
      'user.email=test@example.com',
      ...args,
    ],
    { cwd, stdio: ['ignore', 'pipe', 'ignore'] }
  ).toString();
}

function makeRepo(relativePath, initArgs = []) {
  const directory = path.join(base, relativePath);
  fs.mkdirSync(directory, { recursive: true });
  git(['init', '-q', ...initArgs], directory);
  git(['commit', '-q', '--allow-empty', '-m', 'init'], directory);
  return directory;
}

function makeBareRepo(relativePath) {
  const seed = makeRepo(`${relativePath}-seed`);
  const directory = path.join(base, relativePath);
  git(['clone', '-q', '--bare', seed, directory], base);
  return directory;
}

function addWorktree({ repo, relativePath, branch, args = [] }) {
  const directory = path.join(base, relativePath);
  git([...args, 'worktree', 'add', '-q', '-b', branch, directory], repo);
  return directory;
}

function gitSupportsRelativeWorktrees() {
  const [major, minor] = git(['--version'], base)
    .replace(/^git version /, '')
    .split('.')
    .map((part) => parseInt(part, 10));
  return major > 2 || (major === 2 && minor >= 48);
}

beforeEach(() => {
  base = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-repository-key-')));
});

afterEach(() => {
  fs.rmSync(base, { recursive: true, force: true });
});

test('findRepositoryKey returns null outside a git repository', () => {
  const directory = path.join(base, 'plain');
  fs.mkdirSync(directory);

  expect(findRepositoryKey({ root: directory })).toBeNull();
});

test('findRepositoryKey gives an ordinary clone and its worktree the clone .git directory', () => {
  const repo = makeRepo('app');
  const worktree = addWorktree({ repo, relativePath: 'app-wt', branch: 'feature' });

  expect(findRepositoryKey({ root: repo })).toEqual(path.join(repo, '.git'));
  expect(findRepositoryKey({ root: worktree })).toEqual(path.join(repo, '.git'));
});

test('findRepositoryKey gives two bare repositories in one directory different keys', () => {
  const first = makeBareRepo('repos/first.git');
  const second = makeBareRepo('repos/second.git');
  const firstWorktree = addWorktree({ repo: first, relativePath: 'repos/first', branch: 'a' });
  const secondWorktree = addWorktree({ repo: second, relativePath: 'repos/second', branch: 'b' });

  expect(findRepositoryKey({ root: firstWorktree })).toEqual(first);
  expect(findRepositoryKey({ root: secondWorktree })).toEqual(second);
});

test('findRepositoryKey gives a --separate-git-dir clone and its worktree the separate git directory', () => {
  const gitDir = path.join(base, 'git-dirs', 'app');
  fs.mkdirSync(path.dirname(gitDir));
  const repo = makeRepo('app', [`--separate-git-dir=${gitDir}`]);
  const worktree = addWorktree({ repo, relativePath: 'app-wt', branch: 'feature' });

  expect(findRepositoryKey({ root: repo })).toEqual(gitDir);
  expect(findRepositoryKey({ root: worktree })).toEqual(gitDir);
});

test('findRepositoryKey does not give a pruned worktree path reused by a fresh clone the old key', () => {
  const repo = makeRepo('app');
  const gone = addWorktree({ repo, relativePath: 'gone', branch: 'gone' });
  fs.rmSync(gone, { recursive: true, force: true });
  git(['worktree', 'prune'], repo);
  const fresh = makeRepo('gone');

  expect(findRepositoryKey({ root: fresh })).toEqual(path.join(fresh, '.git'));
});

test('findRepositoryKey returns null for a .git file naming a worktree that does not link back', () => {
  const repo = makeRepo('app');
  const worktree = addWorktree({ repo, relativePath: 'app-wt', branch: 'feature' });
  const impostor = path.join(base, 'impostor');
  fs.mkdirSync(impostor);
  fs.copyFileSync(path.join(worktree, '.git'), path.join(impostor, '.git'));

  expect(findRepositoryKey({ root: impostor })).toBeNull();
});

test('findRepositoryKey resolves a worktree added with relative gitdir links', () => {
  if (!gitSupportsRelativeWorktrees()) {
    // worktree.useRelativePaths arrived in git 2.48; nothing to check before it.
    return;
  }
  const repo = makeRepo('app');
  const worktree = addWorktree({
    repo,
    relativePath: 'app-wt',
    branch: 'feature',
    args: ['-c', 'worktree.useRelativePaths=true'],
  });

  expect(fs.readFileSync(path.join(worktree, '.git'), 'utf8')).not.toContain(base);
  expect(findRepositoryKey({ root: worktree })).toEqual(path.join(repo, '.git'));
});

test('findRepositoryKey gives a symlinked path to a repository the same key as its real path', () => {
  const repo = makeRepo('app');
  const worktree = addWorktree({ repo, relativePath: 'app-wt', branch: 'feature' });
  const repoLink = path.join(base, 'app-link');
  const worktreeLink = path.join(base, 'app-wt-link');
  fs.symlinkSync(repo, repoLink, 'dir');
  fs.symlinkSync(worktree, worktreeLink, 'dir');

  expect(findRepositoryKey({ root: repoLink })).toEqual(path.join(repo, '.git'));
  expect(findRepositoryKey({ root: worktreeLink })).toEqual(path.join(repo, '.git'));
});
