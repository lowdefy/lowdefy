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

import createReduceMotionStore from './createReduceMotionStore.js';

function createAccessibilityInfo({ enabled }) {
  const handlers = [];
  return {
    addEventListener: jest.fn((name, handler) => handlers.push({ handler, name })),
    change: (value) => handlers.forEach(({ handler }) => handler(value)),
    isReduceMotionEnabled: jest.fn(() => Promise.resolve(enabled)),
  };
}

test('createReduceMotionStore reads the setting only when the first component subscribes', async () => {
  const AccessibilityInfo = createAccessibilityInfo({ enabled: true });
  const store = createReduceMotionStore({ AccessibilityInfo });
  expect(store.getSnapshot()).toBe(false);
  expect(AccessibilityInfo.isReduceMotionEnabled).not.toHaveBeenCalled();
  const listener = jest.fn();
  store.subscribe(listener);
  store.subscribe(jest.fn());
  await Promise.resolve();
  expect(AccessibilityInfo.isReduceMotionEnabled).toHaveBeenCalledTimes(1);
  expect(AccessibilityInfo.addEventListener).toHaveBeenCalledTimes(1);
  expect(store.getSnapshot()).toBe(true);
  expect(listener).toHaveBeenCalledTimes(1);
});

test('createReduceMotionStore tells its subscribers when the setting changes, until they leave', async () => {
  const AccessibilityInfo = createAccessibilityInfo({ enabled: false });
  const store = createReduceMotionStore({ AccessibilityInfo });
  const listener = jest.fn();
  const unsubscribe = store.subscribe(listener);
  await Promise.resolve();
  expect(listener).not.toHaveBeenCalled();
  AccessibilityInfo.change(true);
  expect(store.getSnapshot()).toBe(true);
  expect(listener).toHaveBeenCalledTimes(1);
  unsubscribe();
  AccessibilityInfo.change(false);
  expect(store.getSnapshot()).toBe(false);
  expect(listener).toHaveBeenCalledTimes(1);
});
