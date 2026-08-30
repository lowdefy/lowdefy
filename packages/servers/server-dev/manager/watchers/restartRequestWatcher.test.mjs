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

const { default: restartRequestWatcher } = await import('./restartRequestWatcher.mjs');

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

let fixtureDir;
let context;
let watcher;

beforeEach(() => {
  fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-restart-watcher-test-'));
  fs.mkdirSync(path.join(fixtureDir, 'build'), { recursive: true });
  context = {
    directories: { build: path.join(fixtureDir, 'build') },
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
    restartServer: jest.fn(),
  };
});

afterEach(async () => {
  if (watcher) {
    await watcher.close();
    watcher = undefined;
  }
  fs.rmSync(fixtureDir, { recursive: true, force: true });
});

test('writing build/.restart restarts the server once and removes the sentinel', async () => {
  watcher = await restartRequestWatcher(context);
  const sentinelPath = path.join(fixtureDir, 'build', '.restart');

  fs.writeFileSync(
    sentinelPath,
    JSON.stringify({ requestedAt: new Date().toISOString(), reason: 'Edited a request plugin' })
  );
  await waitFor(() => context.restartServer.mock.calls.length > 0);
  // Give the batch window a chance to fire a second time if it were going to.
  await new Promise((resolve) => setTimeout(resolve, 300));

  expect(context.restartServer).toHaveBeenCalledTimes(1);
  expect(fs.existsSync(sentinelPath)).toBe(false);
  expect(context.logger.info).toHaveBeenCalledWith(
    { spin: 'start' },
    'Restart requested by the dev tools: Edited a request plugin.'
  );
});
