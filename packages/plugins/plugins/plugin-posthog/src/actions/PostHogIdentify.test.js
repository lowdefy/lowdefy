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
  ({ PostHogIdentify, PostHogInit } = await import('../actions.js'));
});

function init(params = { apiKey: 'phc_key' }) {
  PostHogInit({ params });
}

test('PostHogIdentify identifies the person and remembers the id', () => {
  init();
  expect(PostHogIdentify({ globals, params: { id: 'user_1', properties: { plan: 'pro' } } })).toBe(
    null
  );
  expect(mockPostHog.identify.mock.calls).toEqual([['user_1', { plan: 'pro' }, {}]]);
  expect(storage.get('lowdefy_posthog_identified_id')).toBe('user_1');
});

test('PostHogIdentify drops null and undefined person properties', () => {
  init();
  PostHogIdentify({
    globals,
    params: { id: 'user_1', properties: { organization: null, plan: 'pro', role: undefined } },
  });
  expect(mockPostHog.identify.mock.calls).toEqual([['user_1', { plan: 'pro' }, {}]]);
});

test('PostHogIdentify does not resend unchanged person properties', () => {
  init();
  PostHogIdentify({ globals, params: { id: 'user_1', properties: { plan: 'pro' } } });
  PostHogIdentify({ globals, params: { id: 'user_1', properties: { plan: 'pro' } } });
  expect(mockPostHog.identify).toHaveBeenCalledTimes(1);
  expect(mockPostHog.setPersonProperties).not.toHaveBeenCalled();
});

test('PostHogIdentify sets person properties when they change for the same person', () => {
  init();
  PostHogIdentify({ globals, params: { id: 'user_1', properties: { plan: 'pro' } } });
  PostHogIdentify({ globals, params: { id: 'user_1', properties: { plan: 'enterprise' } } });
  expect(mockPostHog.identify).toHaveBeenCalledTimes(1);
  expect(mockPostHog.setPersonProperties.mock.calls).toEqual([[{ plan: 'enterprise' }, {}]]);
});

test('PostHogIdentify resets before identifying a different person on the same browser', () => {
  init();
  storage.set('lowdefy_posthog_identified_id', 'user_1');
  PostHogIdentify({ globals, params: { id: 'user_2' } });
  expect(mockPostHog.reset).toHaveBeenCalledTimes(1);
  expect(mockPostHog.identify.mock.calls).toEqual([['user_2', {}, {}]]);
  expect(storage.get('lowdefy_posthog_identified_id')).toBe('user_2');
});

test('PostHogIdentify does not reset when the browser has never identified', () => {
  init();
  PostHogIdentify({ globals, params: { id: 'user_1' } });
  expect(mockPostHog.reset).not.toHaveBeenCalled();
  expect(mockPostHog.identify).toHaveBeenCalledTimes(1);
});

test('PostHogIdentify sends propertiesOnce as the set once properties', () => {
  init();
  PostHogIdentify({
    globals,
    params: { id: 'user_1', propertiesOnce: { signed_up_at: '2026-01-01' } },
  });
  expect(mockPostHog.identify.mock.calls).toEqual([['user_1', {}, { signed_up_at: '2026-01-01' }]]);
});

test('PostHogIdentify does nothing when id is not given', () => {
  init();
  expect(PostHogIdentify({ globals, params: {} })).toBe(null);
  expect(mockPostHog.identify).not.toHaveBeenCalled();
});

test('PostHogIdentify does nothing when id is an empty string', () => {
  init();
  expect(PostHogIdentify({ globals, params: { id: '  ' } })).toBe(null);
  expect(mockPostHog.identify).not.toHaveBeenCalled();
});

test('PostHogIdentify does nothing before PostHogInit has run', () => {
  expect(PostHogIdentify({ globals, params: { id: 'user_1' } })).toBe(null);
  expect(mockPostHog.identify).not.toHaveBeenCalled();
});

test('PostHogIdentify does nothing when PostHog is disabled', () => {
  init({ enabled: false });
  expect(PostHogIdentify({ globals, params: { id: 'user_1' } })).toBe(null);
  expect(mockPostHog.identify).not.toHaveBeenCalled();
});

test('PostHogIdentify throws when id is not a string', () => {
  init();
  expect(() => PostHogIdentify({ globals, params: { id: 42 } })).toThrow(
    'PostHogIdentify "id" must be a string. Received 42.'
  );
});

test('PostHogIdentify still identifies when browser storage is blocked', () => {
  init();
  const blockedGlobals = {
    window: {
      get localStorage() {
        throw new Error('Storage is blocked.');
      },
    },
  };
  expect(PostHogIdentify({ globals: blockedGlobals, params: { id: 'user_1' } })).toBe(null);
  expect(mockPostHog.identify.mock.calls).toEqual([['user_1', {}, {}]]);
});
