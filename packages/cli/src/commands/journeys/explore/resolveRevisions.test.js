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

const mockReadPullRequest = jest.fn();
jest.unstable_mockModule('./readPullRequest.js', () => ({ default: mockReadPullRequest }));

const { default: resolveRevisions } = await import('./resolveRevisions.js');

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
  mockReadPullRequest.mockReset();
});
afterEach(() => {
  fs.rmSync(repo, { recursive: true, force: true });
});

test('resolveRevisions --against uses the merge base and the commit messages since it', async () => {
  commitFile({ repo, file: 'other.txt', content: 'x', message: 'Unrelated' });
  git(['checkout', '-q', 'main'], repo);
  commitFile({ repo, file: 'main.txt', content: 'main moved on', message: 'Main moves on' });
  git(['checkout', '-q', 'feature'], repo);

  const revisions = await resolveRevisions({ against: 'main', cwd: path.join(repo, 'app') });

  expect(revisions.base).toEqual(baseSha);
  expect(revisions.head).toEqual(git(['rev-parse', 'HEAD'], repo));
  expect(revisions.dirty).toBe(false);
  expect(revisions.pr).toBeNull();
  expect(revisions.context.title).toBeNull();
  expect(revisions.context.body).toContain('Add the tickets page');
  expect(revisions.context.body).toContain('A page to list tickets.');
  expect(revisions.context.body).toContain('Unrelated');
  expect(revisions.context.body).not.toContain('Main moves on');
  // The native realpath: on Windows os.tmpdir() can be an 8.3 short path (RUNNER~1) that only
  // the native call expands, while git reports the long path.
  expect(fs.realpathSync.native(revisions.root)).toEqual(fs.realpathSync.native(repo));
});

test('resolveRevisions marks a working tree with uncommitted changes as dirty', async () => {
  fs.writeFileSync(path.join(repo, 'app', 'pages', 'tickets.yaml'), 'id: tickets\ntype: Box\n');
  const revisions = await resolveRevisions({ against: 'main', cwd: repo });
  expect(revisions.dirty).toBe(true);
  expect(revisions.head).toEqual(headSha);
});

test('resolveRevisions --pr refuses a checkout that is not at the PR head', async () => {
  mockReadPullRequest.mockResolvedValue({
    number: 2531,
    title: 'Tickets page',
    body: '',
    url: 'https://github.com/acme/app/pull/2531',
    baseRefName: 'main',
    baseRefOid: baseSha,
    headRefName: 'feature',
    headRefOid: 'f'.repeat(40),
  });
  await expect(resolveRevisions({ pr: 2531, cwd: repo })).rejects.toThrow(
    `This checkout is at ${headSha}; PR #2531's head is ${'f'.repeat(
      40
    )}. Run from the PR's worktree (the journeys-from-pr skill makes one), or pass --against.`
  );
});

test('resolveRevisions --pr uses the merge base of the PR refs and the PR text as context', async () => {
  git(['checkout', '-q', 'main'], repo);
  const mainSha = commitFile({ repo, file: 'main.txt', content: 'main', message: 'Main moves on' });
  git(['checkout', '-q', 'feature'], repo);
  mockReadPullRequest.mockResolvedValue({
    number: 2531,
    title: 'Tickets page',
    body: 'Adds a page that lists tickets.',
    url: 'https://github.com/acme/app/pull/2531',
    baseRefName: 'main',
    baseRefOid: mainSha,
    headRefName: 'feature',
    headRefOid: headSha,
  });

  const revisions = await resolveRevisions({ pr: 2531, cwd: repo });

  expect(mockReadPullRequest).toHaveBeenCalledWith({ number: 2531, cwd: repo });
  expect(revisions.base).toEqual(baseSha);
  expect(revisions.pr).toEqual({
    number: 2531,
    url: 'https://github.com/acme/app/pull/2531',
    title: 'Tickets page',
  });
  expect(revisions.context).toEqual({
    title: 'Tickets page',
    body: 'Adds a page that lists tickets.',
  });
});

test('resolveRevisions needs exactly one of --pr and --against', async () => {
  await expect(resolveRevisions({ cwd: repo })).rejects.toThrow(
    'Pass one of --pr <number> or --against <ref>.'
  );
  await expect(resolveRevisions({ pr: 1, against: 'main', cwd: repo })).rejects.toThrow(
    'Pass one of --pr <number> or --against <ref>.'
  );
});

test('resolveRevisions --pr refuses anything but a pull request number', async () => {
  await expect(resolveRevisions({ pr: '--repo=acme/other', cwd: repo })).rejects.toThrow(
    '--pr should be a pull request number. Received "--repo=acme/other".'
  );
  await expect(resolveRevisions({ pr: 'feature', cwd: repo })).rejects.toThrow(
    '--pr should be a pull request number. Received "feature".'
  );
  expect(mockReadPullRequest).not.toHaveBeenCalled();
});

test('resolveRevisions --pr accepts the number as the string a command line passes', async () => {
  mockReadPullRequest.mockResolvedValue({
    number: 2531,
    title: 'Tickets page',
    body: '',
    url: 'https://github.com/acme/app/pull/2531',
    baseRefName: 'main',
    baseRefOid: baseSha,
    headRefName: 'feature',
    headRefOid: headSha,
  });
  const revisions = await resolveRevisions({ pr: '2531', cwd: repo });
  expect(mockReadPullRequest).toHaveBeenCalledWith({ number: 2531, cwd: repo });
  expect(revisions.base).toEqual(baseSha);
});

test('resolveRevisions --against reads a ref that starts with a dash as a ref, not a git option', async () => {
  await expect(resolveRevisions({ against: '--all', cwd: repo })).rejects.toThrow(
    'git merge-base --end-of-options --all HEAD failed'
  );
});
