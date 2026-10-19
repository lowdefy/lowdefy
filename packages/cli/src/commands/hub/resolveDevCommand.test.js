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

import resolveDevCommand from './resolveDevCommand.js';

let configDirectory;

function writeApp({ lowdefyYaml = 'lowdefy: 6.0.0\n', scripts, lockfile }) {
  fs.writeFileSync(path.join(configDirectory, 'lowdefy.yaml'), lowdefyYaml);
  if (scripts) {
    fs.writeFileSync(path.join(configDirectory, 'package.json'), JSON.stringify({ scripts }));
  }
  if (lockfile) {
    fs.writeFileSync(path.join(configDirectory, lockfile), '');
  }
}

beforeEach(() => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-dev-command-'));
});

afterEach(() => {
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

test('resolveDevCommand runs the one script that runs lowdefy dev, with the lockfile package manager', async () => {
  writeApp({
    scripts: { dev: 'secrets run -- lowdefy dev', build: 'lowdefy build' },
    lockfile: 'pnpm-lock.yaml',
  });
  const devCommand = await resolveDevCommand({ configDirectory });
  expect(devCommand.args).toEqual(['run', 'dev']);
  expect(devCommand.display).toEqual('pnpm run dev');
});

test('resolveDevCommand refuses to guess between several dev scripts', async () => {
  writeApp({
    scripts: { 'dev:debug': 'lowdefy dev --log-level=debug', 'dev:prod': 'prod -- lowdefy dev' },
  });
  await expect(resolveDevCommand({ configDirectory })).rejects.toThrow(
    'Several package.json scripts run "lowdefy dev" (dev:debug, dev:prod). Set cli.devScript'
  );
});

test('resolveDevCommand uses cli.devScript when set', async () => {
  writeApp({
    lowdefyYaml: 'lowdefy: 6.0.0\ncli:\n  devScript: dev:debug\n',
    scripts: { 'dev:debug': 'lowdefy dev --log-level=debug', 'dev:prod': 'prod -- lowdefy dev' },
    lockfile: 'yarn.lock',
  });
  expect((await resolveDevCommand({ configDirectory })).display).toEqual('yarn run dev:debug');
});

test('resolveDevCommand throws when cli.devScript names a missing script', async () => {
  writeApp({
    lowdefyYaml: 'lowdefy: 6.0.0\ncli:\n  devScript: nope\n',
    scripts: { dev: 'lowdefy dev' },
  });
  await expect(resolveDevCommand({ configDirectory })).rejects.toThrow('names "nope"');
});

test('resolveDevCommand falls back to the installed lowdefy when no script runs lowdefy dev', async () => {
  writeApp({ scripts: { build: 'lowdefy build' } });
  expect((await resolveDevCommand({ configDirectory })).display).toEqual(
    'npx --no-install lowdefy dev'
  );
});
