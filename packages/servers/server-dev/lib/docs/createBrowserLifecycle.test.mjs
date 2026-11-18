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

import { EventEmitter } from 'node:events';

import { vi, afterEach, beforeEach, expect, test } from 'vitest';

import createBrowserLifecycle from './createBrowserLifecycle.js';

const IDLE = 90_000;

function createFakeBrowser() {
  return {
    close: vi.fn(async () => {}),
    isConnected: vi.fn(() => true),
  };
}

function createContext() {
  const context = new EventEmitter();
  context.close = async () => {
    context.emit('close');
  };
  return context;
}

// Lets the launch promise chain (catch, finally) run under fake timers.
async function flush() {
  for (let i = 0; i < 5; i += 1) {
    await Promise.resolve();
  }
}

beforeEach(() => {
  // performance is not redefinable on this Node, and nothing here reads it.
  vi.useFakeTimers({
    toFake: [
      'Date',
      'hrtime',
      'queueMicrotask',
      'requestAnimationFrame',
      'cancelAnimationFrame',
      'requestIdleCallback',
      'cancelIdleCallback',
      'setImmediate',
      'clearImmediate',
      'setInterval',
      'clearInterval',
      'setTimeout',
      'clearTimeout',
    ],
  });
});

afterEach(() => {
  vi.useRealTimers();
});

test('getBrowser launches once and shares the browser between concurrent calls', async () => {
  const browser = createFakeBrowser();
  const launch = vi.fn(async () => browser);
  const { getBrowser } = createBrowserLifecycle({ launch, idleTimeout: IDLE });

  const [first, second] = await Promise.all([getBrowser(), getBrowser()]);

  expect(first).toBe(browser);
  expect(second).toBe(browser);
  expect(launch).toHaveBeenCalledTimes(1);
});

test('the browser closes 90 s after the last getBrowser call when no context was opened', async () => {
  const browser = createFakeBrowser();
  const { getBrowser } = createBrowserLifecycle({ launch: async () => browser, idleTimeout: IDLE });

  await getBrowser();
  await flush();
  vi.advanceTimersByTime(IDLE - 1);
  expect(browser.close).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1);
  await flush();

  expect(browser.close).toHaveBeenCalledTimes(1);
});

test('the browser closes 90 s after the last context closes', async () => {
  const browser = createFakeBrowser();
  const { getBrowser, trackContext } = createBrowserLifecycle({
    launch: async () => browser,
    idleTimeout: IDLE,
  });

  await getBrowser();
  const context = createContext();
  trackContext({ browser, context });
  vi.advanceTimersByTime(IDLE * 2);
  await flush();
  expect(browser.close).not.toHaveBeenCalled();

  await context.close();
  vi.advanceTimersByTime(IDLE - 1);
  await flush();
  expect(browser.close).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1);
  await flush();
  expect(browser.close).toHaveBeenCalledTimes(1);
});

test('a getBrowser call at 89 s pushes the idle close out', async () => {
  const browser = createFakeBrowser();
  const launch = vi.fn(async () => browser);
  const { getBrowser } = createBrowserLifecycle({ launch, idleTimeout: IDLE });

  await getBrowser();
  await flush();
  vi.advanceTimersByTime(89_000);
  await getBrowser();
  vi.advanceTimersByTime(89_000);
  await flush();
  expect(browser.close).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1_000);
  await flush();

  expect(browser.close).toHaveBeenCalledTimes(1);
  expect(launch).toHaveBeenCalledTimes(1);
});

test('a context still open keeps the browser open', async () => {
  const browser = createFakeBrowser();
  const { getBrowser, trackContext } = createBrowserLifecycle({
    launch: async () => browser,
    idleTimeout: IDLE,
  });

  await getBrowser();
  const first = createContext();
  const second = createContext();
  trackContext({ browser, context: first });
  trackContext({ browser, context: second });
  await first.close();
  vi.advanceTimersByTime(IDLE * 3);
  await flush();

  expect(browser.close).not.toHaveBeenCalled();
});

test('a launch in flight keeps the idle close back until it settles', async () => {
  const browser = createFakeBrowser();
  let finishLaunch;
  const launch = vi.fn(
    () =>
      new Promise((resolve) => {
        finishLaunch = () => resolve(browser);
      })
  );
  const { getBrowser } = createBrowserLifecycle({ launch, idleTimeout: IDLE });

  const pending = getBrowser();
  vi.advanceTimersByTime(IDLE * 2);
  await flush();
  finishLaunch();
  await pending;
  await flush();
  vi.advanceTimersByTime(IDLE - 1);
  await flush();
  expect(browser.close).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1);
  await flush();

  expect(browser.close).toHaveBeenCalledTimes(1);
});

test('getBrowser relaunches after an idle close', async () => {
  const first = createFakeBrowser();
  const second = createFakeBrowser();
  const launch = vi.fn().mockResolvedValueOnce(first).mockResolvedValueOnce(second);
  const { getBrowser } = createBrowserLifecycle({ launch, idleTimeout: IDLE });

  await getBrowser();
  await flush();
  vi.advanceTimersByTime(IDLE);
  await flush();

  expect(await getBrowser()).toBe(second);
  expect(first.close).toHaveBeenCalledTimes(1);
  expect(launch).toHaveBeenCalledTimes(2);
});

test('getBrowser retries a failed launch on the next call', async () => {
  const browser = createFakeBrowser();
  const launch = vi
    .fn()
    .mockRejectedValueOnce(new Error('No browser.'))
    .mockResolvedValueOnce(browser);
  const { getBrowser } = createBrowserLifecycle({ launch, idleTimeout: IDLE });

  await expect(getBrowser()).rejects.toThrow('No browser.');
  await flush();

  expect(await getBrowser()).toBe(browser);
});

test('getBrowser relaunches once for concurrent callers when the browser disconnected', async () => {
  const crashed = createFakeBrowser();
  const fresh = createFakeBrowser();
  const launch = vi.fn().mockResolvedValueOnce(crashed).mockResolvedValueOnce(fresh);
  const { getBrowser } = createBrowserLifecycle({ launch, idleTimeout: IDLE });

  await getBrowser();
  crashed.isConnected.mockReturnValue(false);
  const [first, second] = await Promise.all([getBrowser(), getBrowser()]);

  expect(first).toBe(fresh);
  expect(second).toBe(fresh);
  expect(launch).toHaveBeenCalledTimes(2);
});

test('retire hands out a new browser on the next call while the crashed one stays connected', async () => {
  const crashed = createFakeBrowser();
  const fresh = createFakeBrowser();
  const launch = vi.fn().mockResolvedValueOnce(crashed).mockResolvedValueOnce(fresh);
  const { getBrowser, retire } = createBrowserLifecycle({ launch, idleTimeout: IDLE });

  await getBrowser();
  await flush();
  retire(crashed);
  await flush();

  expect(crashed.isConnected()).toBe(true);
  expect(crashed.close).toHaveBeenCalledTimes(1);
  expect(await getBrowser()).toBe(fresh);
  expect(launch).toHaveBeenCalledTimes(2);
});

test('concurrent calls that hit the same crash share one relaunch', async () => {
  const crashed = createFakeBrowser();
  const fresh = createFakeBrowser();
  const launch = vi.fn().mockResolvedValueOnce(crashed).mockResolvedValueOnce(fresh);
  const { getBrowser, retire } = createBrowserLifecycle({ launch, idleTimeout: IDLE });

  await getBrowser();
  await flush();
  retire(crashed);
  const [first, second] = await Promise.all([getBrowser(), getBrowser()]);
  await flush();
  // A late report of the same crash leaves the new browser alone.
  retire(crashed);

  expect(first).toBe(fresh);
  expect(second).toBe(fresh);
  expect(await getBrowser()).toBe(fresh);
  expect(launch).toHaveBeenCalledTimes(2);
  expect(crashed.close).toHaveBeenCalledTimes(1);
  expect(fresh.close).not.toHaveBeenCalled();
});

test('a retired browser closes once its last open context closes', async () => {
  const crashed = createFakeBrowser();
  const fresh = createFakeBrowser();
  const launch = vi.fn().mockResolvedValueOnce(crashed).mockResolvedValueOnce(fresh);
  const { getBrowser, retire, trackContext } = createBrowserLifecycle({
    launch,
    idleTimeout: IDLE,
  });

  await getBrowser();
  await flush();
  // A journey still running on the crashed browser.
  const running = createContext();
  trackContext({ browser: crashed, context: running });
  retire(crashed);
  expect(await getBrowser()).toBe(fresh);
  const freshContext = createContext();
  trackContext({ browser: fresh, context: freshContext });
  await flush();
  expect(crashed.close).not.toHaveBeenCalled();

  await running.close();
  await flush();

  expect(crashed.close).toHaveBeenCalledTimes(1);
  expect(fresh.close).not.toHaveBeenCalled();
});

test('retire while a relaunch is in flight leaves the relaunch alone', async () => {
  const crashed = createFakeBrowser();
  const fresh = createFakeBrowser();
  let finishLaunch;
  const launch = vi
    .fn()
    .mockResolvedValueOnce(crashed)
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishLaunch = () => resolve(fresh);
        })
    );
  const { getBrowser, retire } = createBrowserLifecycle({ launch, idleTimeout: IDLE });

  await getBrowser();
  await flush();
  retire(crashed);
  const pending = getBrowser();
  retire(crashed);
  finishLaunch();

  expect(await pending).toBe(fresh);
  expect(await getBrowser()).toBe(fresh);
  expect(launch).toHaveBeenCalledTimes(2);
});
