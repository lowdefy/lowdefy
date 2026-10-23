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

import { vi, afterEach, beforeEach, expect, test } from 'vitest';
import createPageUnload from './createPageUnload.js';

function createWindow() {
  const target = new EventTarget();
  return {
    addEventListener: (...args) => target.addEventListener(...args),
    dispatch: (name) => target.dispatchEvent(new Event(name)),
  };
}

function track(promise) {
  const outcome = { settled: false };
  promise.then(
    (value) => Object.assign(outcome, { settled: true, value }),
    (error) => Object.assign(outcome, { settled: true, error })
  );
  return outcome;
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

test('createPageUnload starts with the page not leaving', () => {
  const pageUnload = createPageUnload({ window: createWindow() });
  expect(pageUnload.isLeaving()).toBe(false);
});

test('createPageUnload marks the page leaving on beforeunload', () => {
  const window = createWindow();
  const pageUnload = createPageUnload({ window });
  window.dispatch('beforeunload');
  expect(pageUnload.isLeaving()).toBe(true);
});

test('createPageUnload marks the page leaving on pagehide', () => {
  const window = createWindow();
  const pageUnload = createPageUnload({ window });
  window.dispatch('pagehide');
  expect(pageUnload.isLeaving()).toBe(true);
});

test('createPageUnload keeps a held rejection unsettled once the page hides', async () => {
  const window = createWindow();
  const pageUnload = createPageUnload({ window });
  window.dispatch('beforeunload');
  const outcome = track(pageUnload.hold(new TypeError('Failed to fetch')));
  window.dispatch('pagehide');
  await vi.advanceTimersByTimeAsync(60000);
  expect(outcome.settled).toBe(false);
  expect(pageUnload.isLeaving()).toBe(true);
});

test('createPageUnload throws a held rejection when the page stays after beforeunload', async () => {
  const window = createWindow();
  const pageUnload = createPageUnload({ window });
  window.dispatch('beforeunload');
  const error = new TypeError('Failed to fetch');
  const outcome = track(pageUnload.hold(error));
  await vi.advanceTimersByTimeAsync(9999);
  expect(outcome.settled).toBe(false);
  await vi.advanceTimersByTimeAsync(1);
  expect(outcome.error).toBe(error);
  expect(pageUnload.isLeaving()).toBe(false);
});

test('createPageUnload throws a held rejection when the page is shown again from the back-forward cache', async () => {
  const window = createWindow();
  const pageUnload = createPageUnload({ window });
  window.dispatch('pagehide');
  const error = new TypeError('Load failed');
  const outcome = track(pageUnload.hold(error));
  window.dispatch('pageshow');
  await vi.advanceTimersByTimeAsync(0);
  expect(outcome.error).toBe(error);
  expect(pageUnload.isLeaving()).toBe(false);
});
