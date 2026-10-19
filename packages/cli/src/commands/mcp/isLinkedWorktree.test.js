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

import isLinkedWorktree from './isLinkedWorktree.js';

jest.setTimeout(60000);

let base;

function git(args, cwd) {
  execFileSync(
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
    { cwd, stdio: 'ignore' }
  );
}

function makeRepo(relativePath, initArgs = []) {
  const directory = path.join(base, relativePath);
  fs.mkdirSync(directory, { recursive: true });
  git(['init', '-q', ...initArgs], directory);
  git(['commit', '-q', '--allow-empty', '-m', 'init'], directory);
  return directory;
}

function addWorktree({ repo, relativePath, branch, args = [] }) {
  const directory = path.join(base, relativePath);
  git([...args, 'worktree', 'add', '-q', '-b', branch, directory], repo);
  return directory;
}

beforeEach(() => {
  base = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-linked-worktree-')));
});

afterEach(() => {
  fs.rmSync(base, { recursive: true, force: true });
});

test('isLinkedWorktree accepts the main checkout and a worktree of the repository', () => {
  const repo = makeRepo('app');
  const worktree = addWorktree({ repo, relativePath: 'app-wt', branch: 'feature' });
  const commonDir = path.join(repo, '.git');

  expect(isLinkedWorktree({ worktree: repo, commonDir })).toBe(true);
  expect(isLinkedWorktree({ worktree, commonDir })).toBe(true);
});

test('isLinkedWorktree refuses a checkout of another repository', () => {
  const repo = makeRepo('app');
  const other = makeRepo('other');
  const otherWorktree = addWorktree({ repo: other, relativePath: 'other-wt', branch: 'feature' });
  const commonDir = path.join(repo, '.git');

  expect(isLinkedWorktree({ worktree: other, commonDir })).toBe(false);
  expect(isLinkedWorktree({ worktree: otherWorktree, commonDir })).toBe(false);
});

test('isLinkedWorktree refuses a deleted worktree path reused by a fresh clone', () => {
  const repo = makeRepo('app');
  const gone = addWorktree({ repo, relativePath: 'gone', branch: 'gone' });
  fs.rmSync(gone, { recursive: true, force: true });
  makeRepo('gone');

  expect(isLinkedWorktree({ worktree: gone, commonDir: path.join(repo, '.git') })).toBe(false);
});

test('isLinkedWorktree refuses a .git file copied from a worktree to another directory', () => {
  const repo = makeRepo('app');
  const worktree = addWorktree({ repo, relativePath: 'app-wt', branch: 'feature' });
  const copy = path.join(base, 'copy');
  fs.mkdirSync(copy);
  fs.copyFileSync(path.join(worktree, '.git'), path.join(copy, '.git'));

  expect(isLinkedWorktree({ worktree: copy, commonDir: path.join(repo, '.git') })).toBe(false);
});

test('isLinkedWorktree refuses a .git file naming the clone .git directory', () => {
  const repo = makeRepo('app');
  const impostor = path.join(base, 'impostor');
  fs.mkdirSync(impostor);
  fs.writeFileSync(path.join(impostor, '.git'), `gitdir: ${path.join(repo, '.git')}\n`);

  expect(isLinkedWorktree({ worktree: impostor, commonDir: path.join(repo, '.git') })).toBe(false);
});

test('isLinkedWorktree accepts both checkouts of a --separate-git-dir clone', () => {
  const gitDir = path.join(base, 'git-dirs', 'app');
  fs.mkdirSync(path.dirname(gitDir));
  const repo = makeRepo('app', [`--separate-git-dir=${gitDir}`]);
  const worktree = addWorktree({ repo, relativePath: 'app-wt', branch: 'feature' });

  expect(isLinkedWorktree({ worktree: repo, commonDir: gitDir })).toBe(true);
  expect(isLinkedWorktree({ worktree, commonDir: gitDir })).toBe(true);
});

test('isLinkedWorktree accepts a worktree with relative gitdir links', () => {
  const repo = makeRepo('app');
  const worktree = addWorktree({
    repo,
    relativePath: 'app-wt',
    branch: 'feature',
    args: ['-c', 'worktree.useRelativePaths=true'],
  });

  expect(isLinkedWorktree({ worktree, commonDir: path.join(repo, '.git') })).toBe(true);
});

test('isLinkedWorktree accepts a symlinked path to a worktree', () => {
  const repo = makeRepo('app');
  const worktree = addWorktree({ repo, relativePath: 'app-wt', branch: 'feature' });
  const link = path.join(base, 'app-wt-link');
  fs.symlinkSync(worktree, link, 'dir');

  expect(isLinkedWorktree({ worktree: link, commonDir: path.join(repo, '.git') })).toBe(true);
});
