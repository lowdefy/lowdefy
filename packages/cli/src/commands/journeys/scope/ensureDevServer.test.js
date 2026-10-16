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
import { jest } from '@jest/globals';

const mockInstallDevServer = jest.fn();
jest.unstable_mockModule('../../../utils/installDevServer.js', () => ({
  default: mockInstallDevServer,
}));

const { default: ensureDevServer } = await import('./ensureDevServer.js');

let root;
let context;
beforeEach(() => {
  mockInstallDevServer.mockReset();
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-scope-dev-'));
  context = {
    lowdefyVersion: '6.1.0',
    directories: { config: root, dev: path.join(root, '.lowdefy', 'dev') },
    logger: { info: jest.fn() },
  };
});
afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

test('ensureDevServer installs the dev server when none is installed', async () => {
  await ensureDevServer({ context });
  expect(mockInstallDevServer).toHaveBeenCalledTimes(1);
  expect(mockInstallDevServer).toHaveBeenCalledWith({ context });
});

test('ensureDevServer finishes an install that stopped before pnpm install succeeded', async () => {
  fs.mkdirSync(context.directories.dev, { recursive: true });
  fs.writeFileSync(path.join(context.directories.dev, 'package.json'), '{"version":"6.1.0"}');
  await ensureDevServer({ context });
  expect(mockInstallDevServer).toHaveBeenCalledTimes(1);
});

test('ensureDevServer leaves a finished install alone', async () => {
  fs.mkdirSync(path.join(context.directories.dev, 'node_modules'), { recursive: true });
  fs.writeFileSync(path.join(context.directories.dev, 'package.json'), '{"version":"6.1.0"}');
  fs.writeFileSync(
    path.join(context.directories.dev, 'node_modules', '.lowdefy-install-hash'),
    'x'
  );
  await ensureDevServer({ context });
  expect(mockInstallDevServer).not.toHaveBeenCalled();
});

test('ensureDevServer leaves a local dev server alone', async () => {
  context.lowdefyVersion = 'local';
  await ensureDevServer({ context });
  expect(mockInstallDevServer).not.toHaveBeenCalled();
});
