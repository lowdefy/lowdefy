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

const mockUnsubscribe = jest.fn();

const mockPostHog = {
  init: jest.fn(),
  onFeatureFlags: jest.fn(() => mockUnsubscribe),
  reloadFeatureFlags: jest.fn(),
};

jest.unstable_mockModule('posthog-js', () => ({ default: mockPostHog }));

let PostHogInit;
let PostHogReloadFeatureFlags;

beforeEach(async () => {
  resetPostHogState();
  mockPostHog.onFeatureFlags.mockImplementation(() => mockUnsubscribe);
  ({ PostHogInit, PostHogReloadFeatureFlags } = await import('../actions.js'));
});

function init() {
  PostHogInit({ params: { apiKey: 'phc_key' } });
}

test('PostHogReloadFeatureFlags resolves with the flags once they load', async () => {
  init();
  mockPostHog.onFeatureFlags.mockImplementation((callback) => {
    setTimeout(() => callback(['new-checkout'], { 'new-checkout': 'variant-b' }), 0);
    return mockUnsubscribe;
  });
  const result = await PostHogReloadFeatureFlags({ params: {} });
  expect(result).toEqual({
    flags: ['new-checkout'],
    variants: { 'new-checkout': 'variant-b' },
  });
  expect(mockPostHog.reloadFeatureFlags).toHaveBeenCalledTimes(1);
  expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
});

test('PostHogReloadFeatureFlags resolves when the flags are already loaded', async () => {
  init();
  mockPostHog.onFeatureFlags.mockImplementation((callback) => {
    callback(['new-checkout'], { 'new-checkout': true });
    return mockUnsubscribe;
  });
  const result = await PostHogReloadFeatureFlags({ params: {} });
  expect(result).toEqual({ flags: ['new-checkout'], variants: { 'new-checkout': true } });
  expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
});

test('PostHogReloadFeatureFlags resolves with empty results when PostHog does not answer', async () => {
  init();
  mockPostHog.onFeatureFlags.mockImplementation(() => mockUnsubscribe);
  const result = await PostHogReloadFeatureFlags({ params: { timeout: 1 } });
  expect(result).toEqual({ flags: [], variants: {} });
});

test('PostHogReloadFeatureFlags does nothing before PostHogInit has run', () => {
  expect(PostHogReloadFeatureFlags({ params: {} })).toBe(null);
  expect(mockPostHog.reloadFeatureFlags).not.toHaveBeenCalled();
});

test('PostHogReloadFeatureFlags throws when timeout is not an integer', () => {
  init();
  expect(() => PostHogReloadFeatureFlags({ params: { timeout: '1000' } })).toThrow(
    'PostHogReloadFeatureFlags "timeout" must be an integer. Received "1000".'
  );
});
