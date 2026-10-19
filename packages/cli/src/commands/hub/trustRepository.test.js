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
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';
import { jest } from '@jest/globals';

import getHubPaths from './getHubPaths.js';
import readTrustedRepositories from './readTrustedRepositories.js';
import trustRepository from './trustRepository.js';
import untrustRepository from './untrustRepository.js';

jest.setTimeout(60000);

const execFileAsync = promisify(execFile);
const trustRepositoryUrl = new URL('./trustRepository.js', import.meta.url).href;
const cliDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

let home;
const originalHome = process.env.LOWDEFY_HOME;

beforeEach(() => {
  home = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-trust-'));
  process.env.LOWDEFY_HOME = home;
});

afterEach(() => {
  process.env.LOWDEFY_HOME = originalHome;
  fs.rmSync(home, { recursive: true, force: true });
});

test('readTrustedRepositories returns an empty list before anything is trusted', () => {
  expect(readTrustedRepositories()).toEqual([]);
});

test('trustRepository adds a repository once, readable only by the user', async () => {
  await trustRepository({ repository: '/work/b/.git' });
  await trustRepository({ repository: '/work/a/.git' });
  await trustRepository({ repository: '/work/b/.git' });

  expect(readTrustedRepositories()).toEqual(['/work/a/.git', '/work/b/.git']);
  if (process.platform !== 'win32') {
    expect(fs.statSync(getHubPaths().trustedPath).mode & 0o777).toEqual(0o600);
  }
  expect(fs.existsSync(getHubPaths().trustedLockPath)).toBe(false);
});

test('trustRepository keeps every repository when several processes trust at once', async () => {
  const repositories = Array.from({ length: 6 }, (_, index) => `/work/repo-${index}/.git`);

  await Promise.all(
    repositories.map((repository) =>
      execFileAsync(
        process.execPath,
        [
          '--input-type=module',
          '-e',
          `const { default: trustRepository } = await import(${JSON.stringify(
            trustRepositoryUrl
          )}); await trustRepository({ repository: ${JSON.stringify(repository)} });`,
        ],
        { cwd: cliDirectory, env: { ...process.env, LOWDEFY_HOME: home } }
      )
    )
  );

  expect(readTrustedRepositories()).toEqual([...repositories].sort());
});

test('untrustRepository removes the trusted entries it is given and returns them', async () => {
  await trustRepository({ repository: '/work/a/.git' });
  await trustRepository({ repository: '/work/b/.git' });

  expect(await untrustRepository({ repositories: ['/work/a', '/work/a/.git'] })).toEqual([
    '/work/a/.git',
  ]);
  expect(await untrustRepository({ repositories: ['/work/a/.git'] })).toEqual([]);
  expect(readTrustedRepositories()).toEqual(['/work/b/.git']);
});

test('readTrustedRepositories throws on a trust file without a repositories list', () => {
  const { trustedPath } = getHubPaths();
  fs.mkdirSync(path.dirname(trustedPath), { recursive: true });
  fs.writeFileSync(trustedPath, '{"repos": []}');

  expect(() => readTrustedRepositories()).toThrow(`${trustedPath} has no "repositories" list.`);
});

test('readTrustedRepositories names the trust file and how to fix it when it is not JSON', () => {
  const { trustedPath } = getHubPaths();
  fs.mkdirSync(path.dirname(trustedPath), { recursive: true });
  fs.writeFileSync(trustedPath, '{"repositories": [');

  expect(() => readTrustedRepositories()).toThrow(`${trustedPath} is not valid JSON`);
  expect(() => readTrustedRepositories()).toThrow(
    'Fix the JSON or delete the file, then trust repositories again by running `lowdefy hub trust <directory>` in a terminal.'
  );
});
