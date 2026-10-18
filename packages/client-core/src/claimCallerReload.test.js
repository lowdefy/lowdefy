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
import createMemoryStore from './test/createMemoryStore.js';

afterEach(() => {
  jest.useRealTimers();
});

test('claimCallerReload allows the first reload and records when it happened', () => {
  jest.useFakeTimers({ now: 1_000_000 });
  const stored = {};
  expect(claimCallerReload({ sessionStorage: createMemoryStore({ stored }) })).toBe(true);
  expect(stored['lowdefy.reloadedForCaller']).toEqual('1000000');
});

test('claimCallerReload refuses a second reload within 10 seconds', () => {
  jest.useFakeTimers({ now: 1_000_000 });
  const sessionStorage = createMemoryStore();
  expect(claimCallerReload({ sessionStorage })).toBe(true);
  jest.setSystemTime(1_009_999);
  expect(claimCallerReload({ sessionStorage })).toBe(false);
});

test('claimCallerReload allows another reload once 10 seconds have passed', () => {
  jest.useFakeTimers({ now: 1_000_000 });
  const sessionStorage = createMemoryStore();
  expect(claimCallerReload({ sessionStorage })).toBe(true);
  jest.setSystemTime(1_010_000);
  expect(claimCallerReload({ sessionStorage })).toBe(true);
});

test('claimCallerReload refuses when browser storage is disabled', () => {
  expect(claimCallerReload({ sessionStorage: createMemoryStore({ throws: true }) })).toBe(false);
});
