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

import hubTrust from './hubTrust.js';
import hubTrusted from './hubTrusted.js';
import hubUntrust from './hubUntrust.js';
import readTrustedRepositories from './readTrustedRepositories.js';
import trustRepository from './trustRepository.js';

jest.setTimeout(60000);

let base;
let output;
const originalHome = process.env.LOWDEFY_HOME;
const originalIsTTY = process.stdin.isTTY;

function makeRepo(relativePath) {
  const directory = path.join(base, relativePath);
  fs.mkdirSync(directory, { recursive: true });
  execFileSync('git', ['init', '-q'], { cwd: directory, stdio: 'ignore' });
  return directory;
}

function printed() {
  return output.mock.calls.map(([text]) => text).join('');
}

beforeEach(() => {
  base = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-hub-trust-')));
  process.env.LOWDEFY_HOME = path.join(base, 'lowdefy-home');
  process.stdin.isTTY = true;
  output = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
});

afterEach(() => {
  output.mockRestore();
  process.stdin.isTTY = originalIsTTY;
  process.env.LOWDEFY_HOME = originalHome;
  fs.rmSync(base, { recursive: true, force: true });
});

test('hubTrust stores the git directory of the repository and prints it', async () => {
  const repo = makeRepo('app');
  fs.mkdirSync(path.join(repo, 'apps', 'web'), { recursive: true });

  await hubTrust({ directory: path.join(repo, 'apps', 'web') });

  expect(readTrustedRepositories()).toEqual([path.join(repo, '.git')]);
  expect(printed()).toContain(`Trusted ${path.join(repo, '.git')}`);
});

test('hubTrust refuses when stdin is not a terminal', async () => {
  const repo = makeRepo('app');
  process.stdin.isTTY = undefined;

  await expect(hubTrust({ directory: repo })).rejects.toThrow(
    '`lowdefy hub trust` only runs in an interactive terminal.'
  );
  expect(readTrustedRepositories()).toEqual([]);
});

test('hubTrust refuses a directory outside any git repository', async () => {
  const plain = path.join(base, 'plain');
  fs.mkdirSync(plain);

  await expect(hubTrust({ directory: plain })).rejects.toThrow(
    'Only git repositories can be trusted.'
  );
  expect(readTrustedRepositories()).toEqual([]);
});

test('hubUntrust removes a trusted repository', async () => {
  const repo = makeRepo('app');
  await trustRepository({ repository: path.join(repo, '.git') });

  await hubUntrust({ directory: repo });

  expect(readTrustedRepositories()).toEqual([]);
  expect(printed()).toContain(`No longer trusted: ${path.join(repo, '.git')}.`);
});

test('hubUntrust removes the entry of a repository whose directory was deleted', async () => {
  const repo = makeRepo('app');
  const other = makeRepo('other');
  await trustRepository({ repository: path.join(repo, '.git') });
  await trustRepository({ repository: path.join(other, '.git') });
  fs.rmSync(repo, { recursive: true, force: true });

  await hubUntrust({ directory: repo });

  expect(readTrustedRepositories()).toEqual([path.join(other, '.git')]);
  expect(printed()).toContain(`No longer trusted: ${path.join(repo, '.git')}.`);
});

test('hubUntrust removes a deleted git directory named by its own path', async () => {
  const gitDir = path.join(base, 'repos', 'gone.git');
  await trustRepository({ repository: gitDir });

  await hubUntrust({ directory: gitDir });

  expect(readTrustedRepositories()).toEqual([]);
});

test('hubUntrust says when a deleted directory was not trusted', async () => {
  await hubUntrust({ directory: path.join(base, 'never') });

  expect(printed()).toContain('was not trusted.');
});

test('hubTrusted marks entries whose directory is gone and says how to remove them', async () => {
  const repo = makeRepo('app');
  const gone = path.join(base, 'gone', '.git');
  await trustRepository({ repository: path.join(repo, '.git') });
  await trustRepository({ repository: gone });

  await hubTrusted();

  expect(printed()).toContain(`${path.join(repo, '.git')}\n`);
  expect(printed()).toContain(`${gone} (missing)\n`);
  expect(printed()).toContain('lowdefy hub untrust <path>');
});

test('hubTrusted says when nothing is trusted', async () => {
  await hubTrusted();

  expect(printed()).toEqual('No repositories are trusted.\n');
});

test('hubTrusted fails naming the trust file when it is corrupt', async () => {
  const trustedPath = path.join(process.env.LOWDEFY_HOME, 'hub', 'trusted.json');
  fs.mkdirSync(path.dirname(trustedPath), { recursive: true });
  fs.writeFileSync(trustedPath, 'not json');

  await expect(hubTrusted()).rejects.toThrow(`${trustedPath} is not valid JSON`);
});
