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
import spyOnChokidar from '../../test-utils/spyOnChokidar.mjs';

// macOS can hold file events back for tens of seconds on a busy machine.
jest.setTimeout(180000);

// The bus watches build/buildStatus.json under process.cwd() — point it at a
// throwaway server directory before the module is imported.
const originalCwd = process.cwd();
const fixtureDir = fs.realpathSync(
  fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-dev-event-bus-test-'))
);
fs.mkdirSync(path.join(fixtureDir, 'build'));
process.chdir(fixtureDir);

const statusPath = path.join(fixtureDir, 'build', 'buildStatus.json');

const watchers = spyOnChokidar();
const { bootedAt, publish, subscribe } = await import('./devEventBus.js');

const unsubscribers = [];

function listen(send) {
  const unsubscribe = subscribe(send);
  unsubscribers.push(unsubscribe);
  return unsubscribe;
}

// The bus starts its watcher with the first subscriber, so a test waits for
// that watcher to be ready before it writes the file.
function watcherReady() {
  return watchers.at(-1).ready;
}

// Resolves with the next event of the given type, so file-watcher tests wait
// for the real fs event instead of sleeping a guessed interval.
function nextEvent(type, { timeout = 60000 } = {}) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      unsubscribe();
      reject(new Error(`No ${type} event within ${timeout}ms.`));
    }, timeout);
    const unsubscribe = listen((event) => {
      if (event.type !== type) return;
      clearTimeout(timer);
      unsubscribe();
      resolve(event);
    });
  });
}

async function writeUntilSeen({ pending, content }) {
  fs.writeFileSync(statusPath, content);
  const retry = setInterval(() => fs.writeFileSync(statusPath, content), 1000);
  try {
    return await pending;
  } finally {
    clearInterval(retry);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// fsevents can report a write made just before the watcher attached, so a
// file that must already exist when a test subscribes is flushed through
// before the test subscribes.
async function writeExistingStatus(status) {
  fs.writeFileSync(statusPath, JSON.stringify(status));
  await flushFsEvents();
}

afterEach(async () => {
  unsubscribers.splice(0).forEach((unsubscribe) => unsubscribe());
  await Promise.all(watchers.map(({ watcher }) => watcher.close()));
  if (fs.existsSync(statusPath)) fs.rmSync(statusPath);
  // The removal must not reach the next test's watcher.
  await flushFsEvents();
});

afterAll(() => {
  process.chdir(originalCwd);
  fs.rmSync(fixtureDir, { recursive: true, force: true });
});

test('bootedAt is an ISO timestamp fixed at module load', () => {
  expect(new Date(bootedAt).toISOString()).toEqual(bootedAt);
});

test('subscribe delivers published events with an ISO timestamp and unsubscribe stops delivery', () => {
  const send = jest.fn();
  const unsubscribe = listen(send);

  publish({ type: 'client_error', message: 'boom' });
  expect(send).toHaveBeenCalledTimes(1);
  const [event] = send.mock.calls[0];
  expect(event).toMatchObject({ type: 'client_error', message: 'boom' });
  expect(new Date(event.timestamp).toISOString()).toEqual(event.timestamp);

  unsubscribe();
  publish({ type: 'client_error', message: 'after unsubscribe' });
  expect(send).toHaveBeenCalledTimes(1);
});

test('publish keeps the entry timestamp when the entry carries one', () => {
  const send = jest.fn();
  listen(send);
  publish({ type: 'server_error', timestamp: '2026-01-02T03:04:05.000Z', message: 'x' });
  expect(send.mock.calls[0][0].timestamp).toEqual('2026-01-02T03:04:05.000Z');
});

test('publish rejects an unknown event type', () => {
  expect(() => publish({ type: 'nope' })).toThrow(
    'devEventBus event type must be one of build, client_error, server_error, restart. Received "nope".'
  );
});

test('subscribe rejects a non-function send', () => {
  expect(() => subscribe('not a function')).toThrow(
    'devEventBus.subscribe requires a "send" function. Received "not a function".'
  );
});

test('a subscriber that throws is removed and the others still receive', () => {
  const throwing = jest.fn(() => {
    throw new Error('stream gone');
  });
  const healthy = jest.fn();
  listen(throwing);
  listen(healthy);

  publish({ type: 'client_error', message: 'first' });
  publish({ type: 'client_error', message: 'second' });

  expect(throwing).toHaveBeenCalledTimes(1);
  expect(healthy).toHaveBeenCalledTimes(2);
});

test('a subscriber whose send rejects is removed after the rejection settles', async () => {
  const rejecting = jest.fn(() => Promise.reject(new Error('stream gone')));
  const healthy = jest.fn(() => Promise.resolve());
  listen(rejecting);
  listen(healthy);

  publish({ type: 'client_error', message: 'first' });
  await sleep(0);
  publish({ type: 'client_error', message: 'second' });

  expect(rejecting).toHaveBeenCalledTimes(1);
  expect(healthy).toHaveBeenCalledTimes(2);
});

test('a buildStatus.json write publishes a build event carrying the stale flag when the build failed', async () => {
  const pending = nextEvent('build');
  await watcherReady();
  // buildStatus.json does not exist yet, so the watcher watches its directory
  // for it, and that watch can start a moment after ready. The same write is
  // repeated until one is seen.
  const event = await writeUntilSeen({
    pending,
    content: JSON.stringify({
      status: 'error',
      timestamp: '2026-02-03T04:05:06.000Z',
      errors: [{ message: 'Block type "Buton" not found.' }],
      warnings: [],
    }),
  });
  expect(event).toMatchObject({
    type: 'build',
    status: 'error',
    errorCount: 1,
    warningCount: 0,
    errors: [{ message: 'Block type "Buton" not found.' }],
    warnings: [],
    stale: true,
    staleSince: '2026-02-03T04:05:06.000Z',
  });
  expect(event.staleReason).toContain('The last build failed.');
});

test('a successful buildStatus.json write publishes a build event that is not stale', async () => {
  await writeExistingStatus({ status: 'error', errors: [{}], warnings: [] });
  const pending = nextEvent('build');
  await watcherReady();
  fs.writeFileSync(
    statusPath,
    JSON.stringify({
      status: 'ok',
      timestamp: '2026-02-03T04:06:00.000Z',
      errors: [],
      warnings: [{ message: 'Unused block.' }],
    })
  );

  const event = await pending;
  expect(event).toMatchObject({
    type: 'build',
    status: 'ok',
    errorCount: 0,
    warningCount: 1,
    stale: false,
    staleSince: null,
  });
  expect(event).not.toHaveProperty('staleReason');
});

test('removing buildStatus.json publishes nothing', async () => {
  await writeExistingStatus({ status: 'ok', errors: [], warnings: [] });
  const send = jest.fn();
  listen(send);
  const { watcher } = watchers.at(-1);
  await watcherReady();
  // The bus handles a watcher event synchronously, so once the watcher has
  // reported the removal, anything the bus publishes for it has been sent.
  const removed = new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('The watcher did not report the removal within 60000ms.')),
      60000
    );
    watcher.on('unlink', (filePath) => {
      if (filePath !== statusPath) return;
      clearTimeout(timer);
      resolve();
    });
  });

  fs.rmSync(statusPath);
  await removed;

  expect(send).not.toHaveBeenCalled();
});

test('the watcher closes when the last subscriber leaves so a later write publishes nothing', async () => {
  const send = jest.fn();
  const unsubscribe = listen(send);
  const { watcher } = watchers.at(-1);
  await watcherReady();
  unsubscribe();
  expect(watcher.closed).toBe(true);

  fs.writeFileSync(statusPath, JSON.stringify({ status: 'ok', errors: [], warnings: [] }));
  // Every write so far has been handed out by the OS once this returns.
  await flushFsEvents();

  expect(send).not.toHaveBeenCalled();
});
