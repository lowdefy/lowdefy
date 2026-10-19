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

import createIdleGc from './createIdleGc.mjs';

beforeEach(() => {
  // performance is not redefinable on this Node, and nothing here reads it.
  jest.useFakeTimers({ doNotFake: ['performance'] });
});

afterEach(() => {
  jest.useRealTimers();
});

test('createIdleGc collects once 5 s after the last build ends', () => {
  const gc = jest.fn();
  const idleGc = createIdleGc({ gc });

  idleGc.onBuildingChange(true);
  idleGc.onBuildingChange(false);
  jest.advanceTimersByTime(4999);
  expect(gc).not.toHaveBeenCalled();
  jest.advanceTimersByTime(1);

  expect(gc).toHaveBeenCalledTimes(1);
  jest.advanceTimersByTime(60_000);
  expect(gc).toHaveBeenCalledTimes(1);
});

test('createIdleGc cancels the collection when a build starts within 5 s', () => {
  const gc = jest.fn();
  const idleGc = createIdleGc({ gc });

  idleGc.onBuildingChange(false);
  jest.advanceTimersByTime(3000);
  idleGc.onBuildingChange(true);
  jest.advanceTimersByTime(60_000);

  expect(gc).not.toHaveBeenCalled();
});

test('createIdleGc collects once after several back-to-back builds', () => {
  const gc = jest.fn();
  const idleGc = createIdleGc({ gc });

  for (let i = 0; i < 4; i += 1) {
    idleGc.onBuildingChange(true);
    jest.advanceTimersByTime(1000);
    idleGc.onBuildingChange(false);
    jest.advanceTimersByTime(1000);
  }
  jest.advanceTimersByTime(5000);

  expect(gc).toHaveBeenCalledTimes(1);
});

test('createIdleGc exposes a working gc in a process started without --expose-gc', () => {
  jest.useRealTimers();
  const idleGc = createIdleGc({ delayMs: 0 });

  expect(() => idleGc.onBuildingChange(true)).not.toThrow();
});
