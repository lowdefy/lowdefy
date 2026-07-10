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

import getDevCommand from './getDevCommand.js';

let configDirectory;

beforeEach(() => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-agent-setup-test-'));
});

afterEach(() => {
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

test('getDevCommand falls back to npx when there is no package.json', () => {
  expect(getDevCommand({ configDirectory })).toEqual('npx lowdefy dev');
});

test('getDevCommand falls back to npx when no script runs "lowdefy dev"', () => {
  fs.writeFileSync(
    path.join(configDirectory, 'package.json'),
    JSON.stringify({ scripts: { build: 'lowdefy build' } })
  );
  expect(getDevCommand({ configDirectory })).toEqual('npx lowdefy dev');
});

test('getDevCommand uses pnpm when a pnpm-lock.yaml is present', () => {
  fs.writeFileSync(
    path.join(configDirectory, 'package.json'),
    JSON.stringify({ scripts: { dev: 'lowdefy dev' } })
  );
  fs.writeFileSync(path.join(configDirectory, 'pnpm-lock.yaml'), '');
  expect(getDevCommand({ configDirectory })).toEqual('pnpm dev');
});

test('getDevCommand uses yarn when a yarn.lock is present', () => {
  fs.writeFileSync(
    path.join(configDirectory, 'package.json'),
    JSON.stringify({ scripts: { start: 'lowdefy dev --open' } })
  );
  fs.writeFileSync(path.join(configDirectory, 'yarn.lock'), '');
  expect(getDevCommand({ configDirectory })).toEqual('yarn start');
});

test('getDevCommand defaults to npm run when no lockfile is present', () => {
  fs.writeFileSync(
    path.join(configDirectory, 'package.json'),
    JSON.stringify({ scripts: { dev: 'lowdefy dev' } })
  );
  expect(getDevCommand({ configDirectory })).toEqual('npm run dev');
});

test('getDevCommand falls back to npx when package.json is invalid JSON', () => {
  fs.writeFileSync(path.join(configDirectory, 'package.json'), '{ not json');
  expect(getDevCommand({ configDirectory })).toEqual('npx lowdefy dev');
});

test('getDevCommand uses a pnpm-lock.yaml at the project directory when the app has none', () => {
  const appDirectory = path.join(configDirectory, 'apps', 'myapp');
  fs.mkdirSync(appDirectory, { recursive: true });
  fs.writeFileSync(
    path.join(appDirectory, 'package.json'),
    JSON.stringify({ scripts: { dev: 'lowdefy dev' } })
  );
  fs.writeFileSync(path.join(configDirectory, 'pnpm-lock.yaml'), '');
  expect(
    getDevCommand({ configDirectory: appDirectory, projectDirectory: configDirectory })
  ).toEqual('pnpm dev');
});

test('getDevCommand uses a yarn.lock at the project directory when the app has none', () => {
  const appDirectory = path.join(configDirectory, 'apps', 'myapp');
  fs.mkdirSync(appDirectory, { recursive: true });
  fs.writeFileSync(
    path.join(appDirectory, 'package.json'),
    JSON.stringify({ scripts: { dev: 'lowdefy dev' } })
  );
  fs.writeFileSync(path.join(configDirectory, 'yarn.lock'), '');
  expect(
    getDevCommand({ configDirectory: appDirectory, projectDirectory: configDirectory })
  ).toEqual('yarn dev');
});
