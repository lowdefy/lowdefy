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

const { default: envWatcher } = await import('./envWatcher.mjs');

function waitFor(predicate, timeout = 3000) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const tick = () => {
      if (predicate()) return resolve();
      if (Date.now() - started > timeout) return reject(new Error('Timed out waiting.'));
      setTimeout(tick, 25);
    };
    tick();
  });
}

let configDir;
let context;
let watcher;

beforeEach(() => {
  configDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-env-watcher-test-'));
  fs.writeFileSync(path.join(configDir, '.env'), 'LOWDEFY_SECRET_A=one\n');
  context = {
    directories: { config: configDir },
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
    lowdefyBuild: jest.fn(async () => {}),
    readDotEnv: jest.fn(),
    restartServer: jest.fn(),
  };
});

afterEach(async () => {
  if (watcher) {
    await watcher.close();
    watcher = undefined;
  }
  fs.rmSync(configDir, { recursive: true, force: true });
});

test.each([
  ['succeeds', async () => {}],
  [
    'fails',
    async () => {
      throw new Error('Build failed with 1 error(s).');
    },
  ],
])(
  'a .env edit reads the file, rebuilds and restarts the server when the build %s',
  async (_, build) => {
    context.lowdefyBuild.mockImplementation(build);
    watcher = await envWatcher(context);

    fs.writeFileSync(path.join(configDir, '.env'), 'LOWDEFY_SECRET_A=two\n');
    await waitFor(() => context.restartServer.mock.calls.length > 0);

    expect(context.readDotEnv).toHaveBeenCalledTimes(1);
    expect(context.lowdefyBuild).toHaveBeenCalledTimes(1);
    expect(context.readDotEnv.mock.invocationCallOrder[0]).toBeLessThan(
      context.lowdefyBuild.mock.invocationCallOrder[0]
    );
  }
);
