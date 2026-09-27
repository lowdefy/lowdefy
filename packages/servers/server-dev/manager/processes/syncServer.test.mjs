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

import { jest } from '@jest/globals';

import syncServer from './syncServer.mjs';

function createContext(changes) {
  const events = [];
  const record = (name, implementation = async () => {}) =>
    jest.fn(async () => {
      events.push(name);
      return implementation();
    });
  return {
    events,
    installPlugins: record('install'),
    logger: { warn: jest.fn() },
    lowdefyBuild: record('build'),
    restartServer: record('restart'),
    serverArtifacts: { check: jest.fn(() => changes) },
    shutdownServer: jest.fn(() => events.push('shutdown')),
  };
}

test.each([
  ['restarts when a server artifact changed', { install: false, restart: true }, {}, ['restart']],
  ['does nothing when nothing changed', { install: false, restart: false }, {}, []],
  ['restarts when asked to', { install: false, restart: false }, { restart: true }, ['restart']],
  [
    'installs new plugin packages, rebuilds and restarts',
    { install: true, restart: true },
    {},
    ['shutdown', 'install', 'build', 'restart'],
  ],
])('syncServer %s', async (_, changes, options, expected) => {
  const context = createContext(changes);

  await syncServer(context)(options);

  expect(context.events).toEqual(expected);
});

test('syncServer restarts the server after an install even when the rebuild fails', async () => {
  const context = createContext({ install: true, restart: true });
  context.lowdefyBuild.mockRejectedValueOnce(new Error('Build failed'));

  await expect(syncServer(context)()).rejects.toThrow('Build failed');
  expect(context.events).toEqual(['shutdown', 'install', 'restart']);
});

test('syncServer runs one sync at a time', async () => {
  const context = createContext({ install: false, restart: true });
  let finishFirst;
  context.restartServer.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        context.events.push('first restart');
        finishFirst = resolve;
      })
  );
  const sync = syncServer(context);
  const first = sync();
  const second = sync();
  await new Promise((resolve) => setTimeout(resolve, 10));
  expect(context.serverArtifacts.check).toHaveBeenCalledTimes(1);
  finishFirst();
  await Promise.all([first, second]);

  expect(context.serverArtifacts.check).toHaveBeenCalledTimes(2);
});
