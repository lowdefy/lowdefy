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
  get_distinct_id: jest.fn(),
  get_property: jest.fn(),
  identify: jest.fn(),
  init: jest.fn(),
  reset: jest.fn(),
  setPersonProperties: jest.fn(),
};

jest.unstable_mockModule('posthog-js', () => ({ default: mockPostHog }));

let PostHogIdentify;
let PostHogInit;

beforeEach(async () => {
  resetPostHogState();
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  mockPostHog.get_distinct_id.mockReturnValue('anonymous_uuid');
  mockPostHog.get_property.mockReturnValue('anonymous');
  ({ PostHogIdentify, PostHogInit } = await import('../actions.js'));
});

afterEach(() => {
  jest.restoreAllMocks();
});

async function init(params = { apiKey: 'phc_key' }) {
  await PostHogInit({ params });
}

function identifiedAs(id) {
  mockPostHog.get_distinct_id.mockReturnValue(id);
  mockPostHog.get_property.mockImplementation((name) =>
    name === '$user_state' ? 'identified' : undefined
  );
}

test('PostHogIdentify identifies an anonymous visitor without resetting', async () => {
  await init();
  await expect(
    PostHogIdentify({ params: { id: 'user_1', properties: { plan: 'pro' } } })
  ).resolves.toBe(null);
  expect(mockPostHog.reset).not.toHaveBeenCalled();
  expect(mockPostHog.identify.mock.calls).toEqual([['user_1', { plan: 'pro' }, {}]]);
});

test('PostHogIdentify drops null and undefined person properties', async () => {
  await init();
  await PostHogIdentify({
    params: { id: 'user_1', properties: { organization: null, plan: 'pro', role: undefined } },
  });
  expect(mockPostHog.identify.mock.calls).toEqual([['user_1', { plan: 'pro' }, {}]]);
});

test('PostHogIdentify sends propertiesOnce as the set once properties', async () => {
  await init();
  await PostHogIdentify({
    params: { id: 'user_1', propertiesOnce: { signed_up_at: '2026-01-01' } },
  });
  expect(mockPostHog.identify.mock.calls).toEqual([['user_1', {}, { signed_up_at: '2026-01-01' }]]);
});

test('PostHogIdentify only sets person properties when the person is already identified', async () => {
  await init();
  identifiedAs('user_1');
  await PostHogIdentify({ params: { id: 'user_1', properties: { plan: 'enterprise' } } });
  expect(mockPostHog.identify).not.toHaveBeenCalled();
  expect(mockPostHog.reset).not.toHaveBeenCalled();
  expect(mockPostHog.setPersonProperties.mock.calls).toEqual([[{ plan: 'enterprise' }, {}]]);
});

test('PostHogIdentify does nothing for the same person without properties', async () => {
  await init();
  identifiedAs('user_1');
  await PostHogIdentify({ params: { id: 'user_1', properties: { plan: null } } });
  expect(mockPostHog.identify).not.toHaveBeenCalled();
  expect(mockPostHog.setPersonProperties).not.toHaveBeenCalled();
});

test('PostHogIdentify resets before identifying a different person on the same browser', async () => {
  await init();
  identifiedAs('user_1');
  await PostHogIdentify({ params: { id: 'user_2' } });
  expect(mockPostHog.get_property.mock.calls).toEqual([['$user_state']]);
  expect(mockPostHog.reset).toHaveBeenCalledTimes(1);
  expect(mockPostHog.identify.mock.calls).toEqual([['user_2', {}, {}]]);
  expect(mockPostHog.reset.mock.invocationCallOrder[0]).toBeLessThan(
    mockPostHog.identify.mock.invocationCallOrder[0]
  );
});

test('PostHogIdentify does nothing when id is not given', async () => {
  await init();
  await expect(PostHogIdentify({ params: {} })).resolves.toBe(null);
  await PostHogIdentify({ params: { id: null } });
  expect(mockPostHog.identify).not.toHaveBeenCalled();
});

test('PostHogIdentify does nothing when id is an empty string', async () => {
  await init();
  await expect(PostHogIdentify({ params: { id: '  ' } })).resolves.toBe(null);
  expect(mockPostHog.identify).not.toHaveBeenCalled();
});

test('PostHogIdentify does nothing before PostHogInit has run', async () => {
  await expect(PostHogIdentify({ params: { id: 'user_1' } })).resolves.toBe(null);
  expect(mockPostHog.identify).not.toHaveBeenCalled();
});

test('PostHogIdentify does nothing when PostHog is disabled', async () => {
  await init({ enabled: false });
  await expect(PostHogIdentify({ params: { id: 'user_1' } })).resolves.toBe(null);
  expect(mockPostHog.identify).not.toHaveBeenCalled();
});

test('PostHogIdentify throws when id is not a string', async () => {
  await init();
  await expect(PostHogIdentify({ params: { id: 42 } })).rejects.toThrow(
    'PostHogIdentify "id" must be a string. Received 42.'
  );
});

test('PostHogIdentify throws on invalid params even when PostHog is disabled', async () => {
  await init({ enabled: false });
  await expect(PostHogIdentify({ params: { id: 'user_1', properties: 'pro' } })).rejects.toThrow(
    'PostHogIdentify "properties" must be an object. Received "pro".'
  );
});

test('PostHogIdentify throws when propertiesOnce is not an object', async () => {
  await init();
  await expect(PostHogIdentify({ params: { id: 'user_1', propertiesOnce: 1 } })).rejects.toThrow(
    'PostHogIdentify "propertiesOnce" must be an object. Received 1.'
  );
});
