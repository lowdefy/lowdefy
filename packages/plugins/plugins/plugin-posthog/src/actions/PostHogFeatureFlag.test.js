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
  getFeatureFlag: jest.fn(),
  getFeatureFlagPayload: jest.fn(),
  init: jest.fn(),
  isFeatureEnabled: jest.fn(),
};

jest.unstable_mockModule('posthog-js', () => ({ default: mockPostHog }));

let PostHogFeatureFlag;
let PostHogInit;

beforeEach(async () => {
  resetPostHogState();
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  ({ PostHogFeatureFlag, PostHogInit } = await import('../actions.js'));
});

afterEach(() => {
  jest.restoreAllMocks();
});

async function init(params = { apiKey: 'phc_key' }) {
  await PostHogInit({ params });
}

test('PostHogFeatureFlag returns the flag value', async () => {
  await init();
  mockPostHog.getFeatureFlag.mockReturnValue('variant-b');
  await expect(PostHogFeatureFlag({ params: { key: 'new-checkout' } })).resolves.toBe('variant-b');
  expect(mockPostHog.getFeatureFlag.mock.calls).toEqual([['new-checkout']]);
});

test('PostHogFeatureFlag returns the default when the flag is not set', async () => {
  await init();
  mockPostHog.getFeatureFlag.mockReturnValue(undefined);
  await expect(
    PostHogFeatureFlag({ params: { key: 'new-checkout', default: 'control' } })
  ).resolves.toBe('control');
});

test('PostHogFeatureFlag returns null when the flag is not set and no default is given', async () => {
  await init();
  mockPostHog.getFeatureFlag.mockReturnValue(undefined);
  await expect(PostHogFeatureFlag({ params: { key: 'new-checkout' } })).resolves.toBe(null);
});

test('PostHogFeatureFlag returns false when the flag resolved to false', async () => {
  await init();
  mockPostHog.getFeatureFlag.mockReturnValue(false);
  await expect(
    PostHogFeatureFlag({ params: { key: 'new-checkout', default: true } })
  ).resolves.toBe(false);
});

test('PostHogFeatureFlag returns a boolean when enabled is true', async () => {
  await init();
  mockPostHog.isFeatureEnabled.mockReturnValue(true);
  await expect(
    PostHogFeatureFlag({ params: { key: 'new-checkout', enabled: true } })
  ).resolves.toBe(true);
  expect(mockPostHog.isFeatureEnabled.mock.calls).toEqual([['new-checkout']]);
  expect(mockPostHog.getFeatureFlag).not.toHaveBeenCalled();
});

test('PostHogFeatureFlag returns the flag payload when payload is true', async () => {
  await init();
  mockPostHog.getFeatureFlagPayload.mockReturnValue({ limit: 10 });
  await expect(
    PostHogFeatureFlag({ params: { key: 'new-checkout', payload: true } })
  ).resolves.toEqual({ limit: 10 });
  expect(mockPostHog.getFeatureFlagPayload.mock.calls).toEqual([['new-checkout']]);
});

test('PostHogFeatureFlag payload takes precedence over enabled', async () => {
  await init();
  mockPostHog.getFeatureFlagPayload.mockReturnValue({ limit: 10 });
  await expect(
    PostHogFeatureFlag({ params: { key: 'new-checkout', enabled: true, payload: true } })
  ).resolves.toEqual({ limit: 10 });
  expect(mockPostHog.isFeatureEnabled).not.toHaveBeenCalled();
});

test('PostHogFeatureFlag returns the default before PostHogInit has run', async () => {
  await expect(
    PostHogFeatureFlag({ params: { key: 'new-checkout', default: 'control' } })
  ).resolves.toBe('control');
  expect(mockPostHog.getFeatureFlag).not.toHaveBeenCalled();
});

test('PostHogFeatureFlag returns the default when PostHog is disabled', async () => {
  await init({ enabled: false });
  await expect(
    PostHogFeatureFlag({ params: { key: 'new-checkout', default: 'control' } })
  ).resolves.toBe('control');
});

test('PostHogFeatureFlag returns null before PostHogInit has run and no default is given', async () => {
  await expect(PostHogFeatureFlag({ params: { key: 'new-checkout' } })).resolves.toBe(null);
});

test('PostHogFeatureFlag throws when key is missing', async () => {
  await init();
  await expect(PostHogFeatureFlag({ params: {} })).rejects.toThrow(
    'PostHogFeatureFlag "key" must be a non-empty string. Received undefined.'
  );
});

test('PostHogFeatureFlag throws when enabled is not a boolean', async () => {
  await init({ enabled: false });
  await expect(
    PostHogFeatureFlag({ params: { key: 'new-checkout', enabled: 'yes' } })
  ).rejects.toThrow('PostHogFeatureFlag "enabled" must be a boolean. Received "yes".');
});

test('PostHogFeatureFlag throws when payload is not a boolean', async () => {
  await init();
  await expect(
    PostHogFeatureFlag({ params: { key: 'new-checkout', payload: 'yes' } })
  ).rejects.toThrow('PostHogFeatureFlag "payload" must be a boolean. Received "yes".');
});
