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

import createIdleGc from './createIdleGc.mjs';

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

test('createIdleGc collects once 5 s after the last build ends', () => {
  const gc = vi.fn();
  const idleGc = createIdleGc({ gc });

  idleGc.onBuildingChange(true);
  idleGc.onBuildingChange(false);
  vi.advanceTimersByTime(4999);
  expect(gc).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1);

  expect(gc).toHaveBeenCalledTimes(1);
  vi.advanceTimersByTime(60_000);
  expect(gc).toHaveBeenCalledTimes(1);
});

test('createIdleGc cancels the collection when a build starts within 5 s', () => {
  const gc = vi.fn();
  const idleGc = createIdleGc({ gc });

  idleGc.onBuildingChange(false);
  vi.advanceTimersByTime(3000);
  idleGc.onBuildingChange(true);
  vi.advanceTimersByTime(60_000);

  expect(gc).not.toHaveBeenCalled();
});

test('createIdleGc collects once after several back-to-back builds', () => {
  const gc = vi.fn();
  const idleGc = createIdleGc({ gc });

  for (let i = 0; i < 4; i += 1) {
    idleGc.onBuildingChange(true);
    vi.advanceTimersByTime(1000);
    idleGc.onBuildingChange(false);
    vi.advanceTimersByTime(1000);
  }
  vi.advanceTimersByTime(5000);

  expect(gc).toHaveBeenCalledTimes(1);
});

test('createIdleGc exposes a working gc in a process started without --expose-gc', () => {
  vi.useRealTimers();
  const idleGc = createIdleGc({ delayMs: 0 });

  expect(() => idleGc.onBuildingChange(true)).not.toThrow();
});
