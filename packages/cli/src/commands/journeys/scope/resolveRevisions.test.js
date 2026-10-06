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

import resolveRevisions from './resolveRevisions.js';

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
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-scope-git-'));
  git(['init', '-q', '-b', 'main'], repo);
  return repo;
}

let repo;
let baseSha;
let headSha;
beforeEach(() => {
  repo = createRepository();
  baseSha = commitFile({
    repo,
    file: 'app/lowdefy.yaml',
    content: 'lowdefy: 6.0.0\n',
    message: 'Base',
  });
  git(['checkout', '-q', '-b', 'feature'], repo);
  headSha = commitFile({
    repo,
    file: 'app/pages/tickets.yaml',
    content: 'id: tickets\n',
    message: 'Add the tickets page\n\nA page to list tickets.',
  });
});
afterEach(() => {
  fs.rmSync(repo, { recursive: true, force: true });
});

test('resolveRevisions --base uses the merge base with the ref', async () => {
  commitFile({ repo, file: 'other.txt', content: 'x', message: 'Unrelated' });
  git(['checkout', '-q', 'main'], repo);
  commitFile({ repo, file: 'main.txt', content: 'main moved on', message: 'Main moves on' });
  git(['checkout', '-q', 'feature'], repo);

  const revisions = await resolveRevisions({ base: 'main', cwd: path.join(repo, 'app') });

  expect(revisions.base).toEqual(baseSha);
  expect(revisions.head).toEqual(git(['rev-parse', 'HEAD'], repo));
  expect(revisions.dirty).toBe(false);
  // The native realpath: on Windows os.tmpdir() can be an 8.3 short path (RUNNER~1) that only
  // the native call expands, while git reports the long path.
  expect(fs.realpathSync.native(revisions.root)).toEqual(fs.realpathSync.native(repo));
});

test('resolveRevisions marks a working tree with uncommitted changes as dirty', async () => {
  fs.writeFileSync(path.join(repo, 'app', 'pages', 'tickets.yaml'), 'id: tickets\ntype: Box\n');
  const revisions = await resolveRevisions({ base: 'main', cwd: repo });
  expect(revisions.dirty).toBe(true);
  expect(revisions.head).toEqual(headSha);
});

test('resolveRevisions without --base resolves the head only, with no base', async () => {
  fs.writeFileSync(path.join(repo, 'app', 'pages', 'tickets.yaml'), 'id: tickets\ntype: Box\n');
  const revisions = await resolveRevisions({ cwd: path.join(repo, 'app') });
  expect(revisions).toEqual({ root: expect.any(String), head: headSha, dirty: true, base: null });
});

test('resolveRevisions --base reads a ref that starts with a dash as a ref, not a git option', async () => {
  await expect(resolveRevisions({ base: '--all', cwd: repo })).rejects.toThrow(
    'git merge-base --end-of-options --all HEAD failed'
  );
});
