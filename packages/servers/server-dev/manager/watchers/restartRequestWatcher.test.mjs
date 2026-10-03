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

import flushFsEvents from '../../test-utils/flushFsEvents.mjs';
import waitFor from '../../test-utils/waitFor.mjs';

const { default: restartRequestWatcher } = await import('./restartRequestWatcher.mjs');

// File events can take seconds to arrive on a loaded machine.
jest.setTimeout(60000);

let fixtureDir;
let context;
let watcher;

beforeEach(async () => {
  fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-restart-watcher-test-'));
  fs.mkdirSync(path.join(fixtureDir, 'build'), { recursive: true });
  await flushFsEvents();
  context = {
    directories: { build: path.join(fixtureDir, 'build') },
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
    buildActivity: { setBusy: jest.fn() },
    lowdefyBuild: jest.fn(async () => {}),
    syncServer: jest.fn(async () => {}),
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
  await waitFor(() => context.syncServer.mock.calls.length > 0, {
    description: 'the server restart',
  });
  expect(fs.existsSync(sentinelPath)).toBe(false);

  // Removing the sentinel is itself a file event. A second request, seen
  // after it, fences it: any restart the removal caused lands before the
  // second request's.
  fs.writeFileSync(sentinelPath, JSON.stringify({ reason: 'Fence' }));
  await waitFor(() => context.syncServer.mock.calls.length > 1, {
    description: 'the second restart',
  });

  expect(context.syncServer).toHaveBeenCalledTimes(2);
  expect(
    context.logger.info.mock.calls.filter(([, message]) => message.startsWith('Restart requested'))
  ).toEqual([
    [{ spin: 'start' }, 'Restart requested by the dev tools: Edited a request plugin.'],
    [{ spin: 'start' }, 'Restart requested by the dev tools: Fence.'],
  ]);
});

test('a restart request rebuilds the config before restarting the server', async () => {
  watcher = await restartRequestWatcher(context);
  const sentinelPath = path.join(fixtureDir, 'build', '.restart');

  fs.writeFileSync(sentinelPath, JSON.stringify({ reason: 'Added a block type' }));
  await waitFor(() => context.syncServer.mock.calls.length > 0, {
    description: 'the server restart',
  });

  expect(context.lowdefyBuild).toHaveBeenCalledTimes(1);
  expect(context.lowdefyBuild.mock.invocationCallOrder[0]).toBeLessThan(
    context.syncServer.mock.invocationCallOrder[0]
  );
});

test('a restart request restarts the server when the config build fails', async () => {
  context.lowdefyBuild.mockRejectedValue(new Error('Build failed with 1 error(s).'));
  watcher = await restartRequestWatcher(context);
  const sentinelPath = path.join(fixtureDir, 'build', '.restart');

  fs.writeFileSync(sentinelPath, JSON.stringify({ reason: 'Added a block type' }));
  await waitFor(() => context.syncServer.mock.calls.length > 0, {
    description: 'the server restart',
  });

  expect(context.syncServer).toHaveBeenCalledTimes(1);
});
