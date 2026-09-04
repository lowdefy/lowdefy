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
import { execFile } from 'child_process';
import { jest } from '@jest/globals';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { promisify } from 'util';

import createAgainstWorktrees from './createAgainstWorktrees.js';

const execFileAsync = promisify(execFile);

let repoRoot;
let configDirectory;

function git(args) {
  return execFileAsync('git', args, { cwd: repoRoot });
}

async function writeFile(relativePath, content) {
  const filePath = path.join(configDirectory, relativePath);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content);
}

async function commit(message) {
  await git(['add', '-A']);
  await git([
    '-c',
    'user.name=Lowdefy Test',
    '-c',
    'user.email=test@lowdefy.com',
    'commit',
    '-m',
    message,
  ]);
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// A throwaway repository: a base commit, a "develop" branch that adds page
// orders and migration 002-b, and a HEAD that adds page orders and 001-a.
// Real git in a throwaway repository: under a full monorepo test run the
// default 5 s hook timeout is not enough for init plus three commits.
jest.setTimeout(30000);

beforeEach(async () => {
  repoRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'lowdefy-worktree-test-'));
  configDirectory = path.join(repoRoot, 'app');
  await git(['init', '-b', 'main', '--quiet']);
  await writeFile('lowdefy.yaml', 'lowdefy: 5.0.0\nname: test-app\n');
  await writeFile('pages/home.yaml', 'id: home\ntype: Box\n');
  await commit('base');

  await git(['checkout', '--quiet', '-b', 'develop']);
  await writeFile('pages/orders.yaml', 'id: orders\ntype: Box\n');
  await writeFile('migrations/002-b.yaml', 'name: b\n');
  await commit('develop adds orders');

  await git(['checkout', '--quiet', 'main']);
  await writeFile('pages/orders.yaml', 'id: orders\ntype: Box\n');
  await writeFile('migrations/001-a.yaml', 'name: a\n');
  await commit('main adds orders');
});

afterEach(async () => {
  await fs.rm(repoRoot, { recursive: true, force: true });
});

test('createAgainstWorktrees checks out the ref and the merge base at the config directory', async () => {
  const worktrees = await createAgainstWorktrees({ configDirectory, ref: 'develop' });
  try {
    expect(await exists(path.join(worktrees.againstDirectory, 'pages', 'orders.yaml'))).toBe(true);
    expect(await exists(path.join(worktrees.againstDirectory, 'migrations', '002-b.yaml'))).toBe(
      true
    );
    expect(await exists(path.join(worktrees.againstDirectory, 'migrations', '001-a.yaml'))).toBe(
      false
    );
    expect(await exists(path.join(worktrees.baseDirectory, 'pages', 'home.yaml'))).toBe(true);
    expect(await exists(path.join(worktrees.baseDirectory, 'pages', 'orders.yaml'))).toBe(false);
  } finally {
    await worktrees.remove();
  }
});

test('createAgainstWorktrees remove deletes both worktrees', async () => {
  const worktrees = await createAgainstWorktrees({ configDirectory, ref: 'develop' });
  await worktrees.remove();

  expect(await exists(worktrees.againstDirectory)).toBe(false);
  expect(await exists(worktrees.baseDirectory)).toBe(false);
  const { stdout } = await execFileAsync('git', ['worktree', 'list'], { cwd: repoRoot });
  expect(stdout.split('\n').filter((line) => line.trim() !== '')).toHaveLength(1);
});

test('createAgainstWorktrees refuses a ref with characters a git ref cannot contain', async () => {
  await expect(
    createAgainstWorktrees({ configDirectory, ref: 'develop; rm -rf /' })
  ).rejects.toThrow('Invalid git ref "develop; rm -rf /".');
});

test('createAgainstWorktrees leaves no worktree behind when a ref does not resolve', async () => {
  await expect(createAgainstWorktrees({ configDirectory, ref: 'no-such-ref' })).rejects.toThrow();

  const { stdout } = await execFileAsync('git', ['worktree', 'list'], { cwd: repoRoot });
  expect(stdout.split('\n').filter((line) => line.trim() !== '')).toHaveLength(1);
});
