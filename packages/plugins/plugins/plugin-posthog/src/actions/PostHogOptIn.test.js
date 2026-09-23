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
  init: jest.fn(),
  opt_in_capturing: jest.fn(),
};

jest.unstable_mockModule('posthog-js', () => ({ default: mockPostHog }));

let PostHogInit;
let PostHogOptIn;

beforeEach(async () => {
  resetPostHogState();
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  ({ PostHogInit, PostHogOptIn } = await import('../actions.js'));
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('PostHogOptIn opts the person into capturing', async () => {
  await PostHogInit({ params: { apiKey: 'phc_key' } });
  await expect(PostHogOptIn({ params: {} })).resolves.toBe(null);
  expect(mockPostHog.opt_in_capturing).toHaveBeenCalledTimes(1);
});

test('PostHogOptIn does nothing before PostHogInit has run', async () => {
  await expect(PostHogOptIn({ params: {} })).resolves.toBe(null);
  expect(mockPostHog.opt_in_capturing).not.toHaveBeenCalled();
});

test('PostHogOptIn does nothing when PostHog is disabled', async () => {
  await PostHogInit({ params: { enabled: false } });
  await expect(PostHogOptIn({ params: {} })).resolves.toBe(null);
  expect(mockPostHog.opt_in_capturing).not.toHaveBeenCalled();
});
