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

import claimCallerReload from './claimCallerReload.js';

function createWindow({ stored = {}, throws = false } = {}) {
  return {
    sessionStorage: {
      getItem: (key) => {
        if (throws) throw new Error('storage disabled');
        return stored[key] ?? null;
      },
      setItem: (key, value) => {
        if (throws) throw new Error('storage disabled');
        stored[key] = value;
      },
    },
  };
}

afterEach(() => {
  jest.useRealTimers();
});

test('claimCallerReload allows the first reload and records when it happened', () => {
  jest.useFakeTimers({ now: 1_000_000 });
  const stored = {};
  expect(claimCallerReload({ window: createWindow({ stored }) })).toBe(true);
  expect(stored['lowdefy.reloadedForCaller']).toEqual('1000000');
});

test('claimCallerReload refuses a second reload within 10 seconds', () => {
  jest.useFakeTimers({ now: 1_000_000 });
  const window = createWindow();
  expect(claimCallerReload({ window })).toBe(true);
  jest.setSystemTime(1_009_999);
  expect(claimCallerReload({ window })).toBe(false);
});

test('claimCallerReload allows another reload once 10 seconds have passed', () => {
  jest.useFakeTimers({ now: 1_000_000 });
  const window = createWindow();
  expect(claimCallerReload({ window })).toBe(true);
  jest.setSystemTime(1_010_000);
  expect(claimCallerReload({ window })).toBe(true);
});

test('claimCallerReload refuses when browser storage is disabled', () => {
  expect(claimCallerReload({ window: createWindow({ throws: true }) })).toBe(false);
});
