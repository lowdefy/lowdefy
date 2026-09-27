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

import createCheckoutGuard from './createCheckoutGuard.js';
import resolveApp from './resolveApp.js';

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

function makeRepo(relativePath) {
  const directory = path.join(base, relativePath);
  fs.mkdirSync(directory, { recursive: true });
  git(['init', '-q'], directory);
  git(['commit', '-q', '--allow-empty', '-m', 'init'], directory);
  return directory;
}

function addWorktree({ repo, relativePath, branch }) {
  const directory = path.join(base, relativePath);
  git(['worktree', 'add', '-q', '-b', branch, directory], repo);
  return directory;
}

function makeApp(directory) {
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, 'lowdefy.yaml'), 'lowdefy: 7.0.0\n');
  return directory;
}

function createServer({ elicitation, answer } = {}) {
  return {
    getClientCapabilities: () => (elicitation ? { elicitation: { form: {} } } : {}),
    elicitInput: jest.fn(async () => ({ action: answer })),
  };
}

function authorize({ guard, cwd, directory }) {
  return guard(resolveApp({ cwd, directory }));
}

beforeEach(() => {
  base = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-checkout-guard-')));
});

afterEach(() => {
  fs.rmSync(base, { recursive: true, force: true });
});

test('the checkout guard allows the session checkout and every git worktree of its repository', async () => {
  const repo = makeRepo('app');
  makeApp(repo);
  const sibling = makeApp(addWorktree({ repo, relativePath: 'app-wt', branch: 'feature' }));
  const nested = makeApp(
    addWorktree({ repo, relativePath: 'app/.claude/worktrees/agent-1', branch: 'agent' })
  );
  const guard = createCheckoutGuard({ cwd: repo, server: createServer() });

  await expect(authorize({ guard, cwd: repo })).resolves.toBeUndefined();
  await expect(authorize({ guard, cwd: repo, directory: sibling })).resolves.toBeUndefined();
  await expect(authorize({ guard, cwd: repo, directory: nested })).resolves.toBeUndefined();
});

test('the checkout guard allows a worktree added after the session started', async () => {
  const repo = makeRepo('app');
  const guard = createCheckoutGuard({ cwd: repo, server: createServer() });
  const worktree = makeApp(addWorktree({ repo, relativePath: 'later', branch: 'later' }));

  await expect(authorize({ guard, cwd: repo, directory: worktree })).resolves.toBeUndefined();
});

test.each([
  ['another repository', 'other'],
  ['a repository cloned inside the session checkout', 'app/vendor/cloned'],
])('the checkout guard refuses %s when the client cannot ask the user', async (_, relativePath) => {
  const repo = makeRepo('app');
  const other = makeApp(makeRepo(relativePath));
  const guard = createCheckoutGuard({ cwd: repo, server: createServer() });

  await expect(authorize({ guard, cwd: repo, directory: other })).rejects.toThrow(
    `${other} is outside this session's checkout (${repo}) and its git worktrees.`
  );
});

test('the checkout guard allows apps inside a session directory that is not a git repository', async () => {
  const session = path.join(base, 'session');
  const app = makeApp(path.join(session, 'apps', 'main'));
  const outside = makeApp(path.join(base, 'elsewhere'));
  const guard = createCheckoutGuard({ cwd: session, server: createServer() });

  await expect(authorize({ guard, cwd: session, directory: app })).resolves.toBeUndefined();
  await expect(authorize({ guard, cwd: session, directory: outside })).rejects.toThrow(
    'outside this session'
  );
});

test('the checkout guard asks the user once about another checkout and remembers an allow', async () => {
  const repo = makeRepo('app');
  const other = makeApp(makeRepo('other'));
  const server = createServer({ elicitation: true, answer: 'accept' });
  const guard = createCheckoutGuard({ cwd: repo, server });

  await Promise.all([
    authorize({ guard, cwd: repo, directory: other }),
    authorize({ guard, cwd: repo, directory: other }),
  ]);
  await authorize({ guard, cwd: repo, directory: other });

  expect(server.elicitInput).toHaveBeenCalledTimes(1);
  expect(server.elicitInput.mock.calls[0][0].message).toContain(
    `runs the dev script in its package.json. Allow ${other} for this session?`
  );
});

test('the checkout guard refuses a checkout the user declined without asking again', async () => {
  const repo = makeRepo('app');
  const other = makeApp(makeRepo('other'));
  const server = createServer({ elicitation: true, answer: 'decline' });
  const guard = createCheckoutGuard({ cwd: repo, server });

  await expect(authorize({ guard, cwd: repo, directory: other })).rejects.toThrow(
    'The user declined to allow it for this session.'
  );
  await expect(authorize({ guard, cwd: repo, directory: other })).rejects.toThrow('declined');
  expect(server.elicitInput).toHaveBeenCalledTimes(1);
});

test('the checkout guard asks again after the user dismissed the question', async () => {
  const repo = makeRepo('app');
  const other = makeApp(makeRepo('other'));
  const server = createServer({ elicitation: true, answer: 'cancel' });
  const guard = createCheckoutGuard({ cwd: repo, server });

  await expect(authorize({ guard, cwd: repo, directory: other })).rejects.toThrow(
    'outside this session'
  );
  await expect(authorize({ guard, cwd: repo, directory: other })).rejects.toThrow(
    'outside this session'
  );
  expect(server.elicitInput).toHaveBeenCalledTimes(2);
});
