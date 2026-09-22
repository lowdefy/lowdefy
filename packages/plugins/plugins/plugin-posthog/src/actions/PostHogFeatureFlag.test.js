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
  ({ PostHogFeatureFlag, PostHogInit } = await import('../actions.js'));
});

function init() {
  PostHogInit({ params: { apiKey: 'phc_key' } });
}

test('PostHogFeatureFlag returns the flag value', () => {
  init();
  mockPostHog.getFeatureFlag.mockReturnValue('variant-b');
  expect(PostHogFeatureFlag({ params: { key: 'new-checkout' } })).toBe('variant-b');
  expect(mockPostHog.getFeatureFlag.mock.calls).toEqual([['new-checkout']]);
});

test('PostHogFeatureFlag returns the default when the flag is not set', () => {
  init();
  mockPostHog.getFeatureFlag.mockReturnValue(undefined);
  expect(PostHogFeatureFlag({ params: { key: 'new-checkout', default: 'control' } })).toBe(
    'control'
  );
});

test('PostHogFeatureFlag returns null when the flag is not set and no default is given', () => {
  init();
  mockPostHog.getFeatureFlag.mockReturnValue(undefined);
  expect(PostHogFeatureFlag({ params: { key: 'new-checkout' } })).toBe(null);
});

test('PostHogFeatureFlag returns false when the flag resolved to false', () => {
  init();
  mockPostHog.getFeatureFlag.mockReturnValue(false);
  expect(PostHogFeatureFlag({ params: { key: 'new-checkout', default: true } })).toBe(false);
});

test('PostHogFeatureFlag returns a boolean when enabled is true', () => {
  init();
  mockPostHog.isFeatureEnabled.mockReturnValue(true);
  expect(PostHogFeatureFlag({ params: { key: 'new-checkout', enabled: true } })).toBe(true);
  expect(mockPostHog.isFeatureEnabled.mock.calls).toEqual([['new-checkout']]);
  expect(mockPostHog.getFeatureFlag).not.toHaveBeenCalled();
});

test('PostHogFeatureFlag returns the flag payload when payload is true', () => {
  init();
  mockPostHog.getFeatureFlagPayload.mockReturnValue({ limit: 10 });
  expect(PostHogFeatureFlag({ params: { key: 'new-checkout', payload: true } })).toEqual({
    limit: 10,
  });
  expect(mockPostHog.getFeatureFlagPayload.mock.calls).toEqual([['new-checkout']]);
});

test('PostHogFeatureFlag returns the default before PostHogInit has run', () => {
  expect(PostHogFeatureFlag({ params: { key: 'new-checkout', default: 'control' } })).toBe(
    'control'
  );
  expect(mockPostHog.getFeatureFlag).not.toHaveBeenCalled();
});

test('PostHogFeatureFlag returns the default when PostHog is disabled', () => {
  PostHogInit({ params: { enabled: false } });
  expect(PostHogFeatureFlag({ params: { key: 'new-checkout', default: 'control' } })).toBe(
    'control'
  );
});

test('PostHogFeatureFlag returns null before PostHogInit has run and no default is given', () => {
  expect(PostHogFeatureFlag({ params: { key: 'new-checkout' } })).toBe(null);
});

test('PostHogFeatureFlag throws when key is missing', () => {
  init();
  expect(() => PostHogFeatureFlag({ params: {} })).toThrow(
    'PostHogFeatureFlag "key" must be a non-empty string. Received undefined.'
  );
});

test('PostHogFeatureFlag throws when payload is not a boolean', () => {
  init();
  expect(() => PostHogFeatureFlag({ params: { key: 'new-checkout', payload: 'yes' } })).toThrow(
    'PostHogFeatureFlag "payload" must be a boolean. Received "yes".'
  );
});
