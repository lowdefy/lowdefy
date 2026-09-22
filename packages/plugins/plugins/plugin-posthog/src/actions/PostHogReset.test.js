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

import resetPostHogState from '../test/resetPostHogState.js';

const mockPostHog = {
  identify: jest.fn(),
  init: jest.fn(),
  reset: jest.fn(),
  setPersonProperties: jest.fn(),
};

jest.unstable_mockModule('posthog-js', () => ({ default: mockPostHog }));

let PostHogIdentify;
let PostHogInit;
let PostHogReset;
let globals;
let storage;

beforeEach(async () => {
  resetPostHogState();
  storage = new Map();
  globals = {
    window: {
      localStorage: {
        getItem: (key) => (storage.has(key) ? storage.get(key) : null),
        removeItem: (key) => storage.delete(key),
        setItem: (key, value) => storage.set(key, value),
      },
    },
  };
  ({ PostHogIdentify, PostHogInit, PostHogReset } = await import('../actions.js'));
});

function init() {
  PostHogInit({ params: { apiKey: 'phc_key' } });
}

test('PostHogReset resets posthog and forgets the identified id', () => {
  init();
  storage.set('lowdefy_posthog_identified_id', 'user_1');
  expect(PostHogReset({ globals, params: {} })).toBe(null);
  expect(mockPostHog.reset.mock.calls).toEqual([[false]]);
  expect(storage.has('lowdefy_posthog_identified_id')).toBe(false);
});

test('PostHogReset resets the device id when resetDeviceId is true', () => {
  init();
  PostHogReset({ globals, params: { resetDeviceId: true } });
  expect(mockPostHog.reset.mock.calls).toEqual([[true]]);
});

test('PostHogReset lets the next person identify without a person swap reset', () => {
  init();
  PostHogIdentify({ globals, params: { id: 'user_1' } });
  PostHogReset({ globals, params: {} });
  PostHogIdentify({ globals, params: { id: 'user_2' } });
  expect(mockPostHog.reset).toHaveBeenCalledTimes(1);
  expect(mockPostHog.identify.mock.calls).toEqual([
    ['user_1', {}, {}],
    ['user_2', {}, {}],
  ]);
});

test('PostHogReset does nothing before PostHogInit has run', () => {
  expect(PostHogReset({ globals, params: {} })).toBe(null);
  expect(mockPostHog.reset).not.toHaveBeenCalled();
});

test('PostHogReset throws when resetDeviceId is not a boolean', () => {
  init();
  expect(() => PostHogReset({ globals, params: { resetDeviceId: 'yes' } })).toThrow(
    'PostHogReset "resetDeviceId" must be a boolean. Received "yes".'
  );
});
