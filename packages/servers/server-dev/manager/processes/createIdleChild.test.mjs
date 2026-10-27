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

import { vi, afterEach, expect, test } from 'vitest';

import createIdleChild from './createIdleChild.mjs';
import syncServer from './syncServer.mjs';

const IDLE_MS = 180000;

let idleChild;

afterEach(() => {
  idleChild?.close();
  idleChild = undefined;
  vi.useRealTimers();
});

function createContext({ snapshot = {}, busy = false } = {}) {
  let clock = 1000000;
  const context = {
    clock: {
      now: () => clock,
      advance: (ms) => {
        clock += ms;
      },
    },
    activity: { activeRequests: 0, lastActivityAt: 1000000, openTabs: 0, ...snapshot },
    buildActivity: { isBusy: vi.fn(() => busy) },
    devServer: { pid: 1 },
    events: [],
    instance: { update: vi.fn() },
    logger: { info: vi.fn(), error: vi.fn() },
    serverArtifacts: { check: vi.fn(() => ({ install: false, restart: true })), record: vi.fn() },
  };
  context.requestActivity = { snapshot: () => context.activity };
  context.shutdownServer = vi.fn(() => {
    context.events.push('shutdown');
    context.devServer = null;
  });
  context.restartServer = vi.fn(async () => {
    context.events.push('restart');
    context.devServer = { pid: 2 };
  });
  context.syncServer = syncServer(context);
  context.syncServer.startFirst(async () => {});
  return context;
}

function create(context) {
  idleChild = createIdleChild(context, { idleMs: IDLE_MS, now: context.clock.now });
  context.idleChild = idleChild;
  return idleChild;
}

test('createIdleChild stops a child unused for the idle limit through shutdownServer', async () => {
  const context = createContext();
  create(context);
  context.clock.advance(IDLE_MS);

  expect(await idleChild.stop()).toBe(true);
  expect(context.shutdownServer).toHaveBeenCalledTimes(1);
  expect(idleChild.isStopped()).toBe(true);
  expect(context.instance.update).toHaveBeenLastCalledWith({ child: 'stopped' });
});

test.each([
  ['used within the idle limit', { lastActivityAt: 1000000 + 60000 }, false],
  ['with a request in flight', { activeRequests: 1 }, false],
  ['with a tab open', { openTabs: 1 }, false],
  ['while a build runs', {}, true],
])('createIdleChild keeps a child %s', async (_, snapshot, busy) => {
  const context = createContext({ snapshot, busy });
  create(context);
  context.clock.advance(IDLE_MS);

  expect(await idleChild.stop()).toBe(false);
  expect(context.shutdownServer).not.toHaveBeenCalled();
  expect(idleChild.isStopped()).toBe(false);
});

test('createIdleChild checks on a timer once started', async () => {
  vi.useFakeTimers();
  const context = createContext();
  create(context);
  idleChild.start();
  expect(context.instance.update).toHaveBeenCalledWith({ child: 'running' });

  vi.advanceTimersByTime(10000);
  await vi.runOnlyPendingTimersAsync();
  expect(context.shutdownServer).not.toHaveBeenCalled();

  context.clock.advance(IDLE_MS);
  await vi.advanceTimersByTimeAsync(10000);
  expect(context.shutdownServer).toHaveBeenCalledTimes(1);
  expect(idleChild.isStopped()).toBe(true);
});

test('createIdleChild wakes a stopped child once for two requests at once', async () => {
  const context = createContext();
  create(context);
  context.clock.advance(IDLE_MS);
  await idleChild.stop();

  await Promise.all([idleChild.wake(), idleChild.wake()]);

  expect(context.restartServer).toHaveBeenCalledTimes(1);
  expect(idleChild.isStopped()).toBe(false);
  expect(context.instance.update).toHaveBeenLastCalledWith({ child: 'running' });
});

test('createIdleChild marks a restart built while stopped pending and starts the child once on wake', async () => {
  const context = createContext();
  create(context);
  context.clock.advance(IDLE_MS);
  await idleChild.stop();

  await context.syncServer();
  await context.syncServer({ restart: true });
  expect(context.restartServer).not.toHaveBeenCalled();
  expect(idleChild.isRestartPending()).toBe(true);

  await idleChild.wake();
  expect(context.restartServer).toHaveBeenCalledTimes(1);
  expect(idleChild.isRestartPending()).toBe(false);
  expect(context.events).toEqual(['shutdown', 'restart']);
});

test('createIdleChild does not start a second child when a queued sync started one first', async () => {
  const context = createContext();
  create(context);
  context.clock.advance(IDLE_MS);
  await idleChild.stop();

  // A sync already in the queue when the wake comes sees the child running and restarts it.
  let finishBuild;
  const synced = context.syncServer.run(
    () =>
      new Promise((resolve) => {
        finishBuild = resolve;
      })
  );
  const woken = idleChild.wake();
  context.devServer = { pid: 3 };
  await new Promise((resolve) => setTimeout(resolve, 10));
  finishBuild();
  await Promise.all([synced, woken]);

  expect(context.restartServer).not.toHaveBeenCalled();
});

test('createIdleChild clears a pending restart when a queued sync started the child first', async () => {
  const context = createContext();
  create(context);
  context.clock.advance(IDLE_MS);
  await idleChild.stop();
  await context.syncServer();
  expect(idleChild.isRestartPending()).toBe(true);

  let finishInstall;
  const synced = context.syncServer.run(
    () =>
      new Promise((resolve) => {
        finishInstall = resolve;
      })
  );
  const woken = idleChild.wake();
  context.devServer = { pid: 3 };
  await new Promise((resolve) => setTimeout(resolve, 10));
  finishInstall();
  await Promise.all([synced, woken]);

  expect(context.restartServer).not.toHaveBeenCalled();
  expect(idleChild.isRestartPending()).toBe(false);
});

test('createIdleChild does not stop a child that was used while the stop waited in the queue', async () => {
  const context = createContext();
  create(context);
  context.clock.advance(IDLE_MS);
  let finishSync;
  const synced = context.syncServer.run(
    () =>
      new Promise((resolve) => {
        finishSync = resolve;
      })
  );
  const stopping = idleChild.stop();
  context.activity.activeRequests = 1;
  await new Promise((resolve) => setTimeout(resolve, 10));
  finishSync();
  await synced;

  expect(await stopping).toBe(false);
  expect(context.shutdownServer).not.toHaveBeenCalled();
});
