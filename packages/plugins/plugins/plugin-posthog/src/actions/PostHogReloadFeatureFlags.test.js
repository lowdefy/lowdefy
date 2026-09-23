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
  onFeatureFlags: jest.fn(),
  reloadFeatureFlags: jest.fn(),
};

jest.unstable_mockModule('posthog-js', () => ({ default: mockPostHog }));

let PostHogInit;
let PostHogReloadFeatureFlags;
let flagsCallback;

beforeEach(async () => {
  resetPostHogState();
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  flagsCallback = null;
  mockPostHog.onFeatureFlags.mockImplementation((callback) => {
    flagsCallback = callback;
    return mockUnsubscribe;
  });
  ({ PostHogInit, PostHogReloadFeatureFlags } = await import('../actions.js'));
});

afterEach(() => {
  jest.restoreAllMocks();
});

async function init(params = { apiKey: 'phc_key' }) {
  await PostHogInit({ params });
}

async function flushPromises() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

test('PostHogReloadFeatureFlags resolves with the flags once they reload', async () => {
  await init();
  const result = PostHogReloadFeatureFlags({ params: {} });
  await flushPromises();
  expect(mockPostHog.reloadFeatureFlags).toHaveBeenCalledTimes(1);
  flagsCallback(['new-checkout'], { 'new-checkout': 'variant-b' });
  await expect(result).resolves.toEqual({
    flags: ['new-checkout'],
    variants: { 'new-checkout': 'variant-b' },
  });
  expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
});

test('PostHogReloadFeatureFlags ignores the already loaded flags onFeatureFlags calls back with straight away', async () => {
  await init();
  mockPostHog.onFeatureFlags.mockImplementation((callback) => {
    callback(['stale-flag'], { 'stale-flag': true });
    flagsCallback = callback;
    return mockUnsubscribe;
  });
  const result = PostHogReloadFeatureFlags({ params: {} });
  await flushPromises();
  expect(mockUnsubscribe).not.toHaveBeenCalled();
  flagsCallback(['fresh-flag'], { 'fresh-flag': true });
  await expect(result).resolves.toEqual({
    flags: ['fresh-flag'],
    variants: { 'fresh-flag': true },
  });
  expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
});

test('PostHogReloadFeatureFlags resolves with empty results when PostHog does not answer', async () => {
  await init();
  await expect(PostHogReloadFeatureFlags({ params: { timeout: 1 } })).resolves.toEqual({
    flags: [],
    variants: {},
  });
  expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
});

test('PostHogReloadFeatureFlags resolves with empty results before PostHogInit has run', async () => {
  await expect(PostHogReloadFeatureFlags({ params: {} })).resolves.toEqual({
    flags: [],
    variants: {},
  });
  expect(mockPostHog.reloadFeatureFlags).not.toHaveBeenCalled();
});

test('PostHogReloadFeatureFlags resolves with empty results when PostHog is disabled', async () => {
  await init({ enabled: false });
  await expect(PostHogReloadFeatureFlags({ params: {} })).resolves.toEqual({
    flags: [],
    variants: {},
  });
});

test('PostHogReloadFeatureFlags throws when timeout is not an integer', async () => {
  await init();
  await expect(PostHogReloadFeatureFlags({ params: { timeout: '1000' } })).rejects.toThrow(
    'PostHogReloadFeatureFlags "timeout" must be a non-negative integer. Received "1000".'
  );
});

test('PostHogReloadFeatureFlags throws when timeout is negative', async () => {
  await init({ enabled: false });
  await expect(PostHogReloadFeatureFlags({ params: { timeout: -1 } })).rejects.toThrow(
    'PostHogReloadFeatureFlags "timeout" must be a non-negative integer. Received -1.'
  );
});
