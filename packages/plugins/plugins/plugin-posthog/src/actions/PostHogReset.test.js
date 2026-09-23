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
  reset: jest.fn(),
};

jest.unstable_mockModule('posthog-js', () => ({ default: mockPostHog }));

let PostHogInit;
let PostHogReset;

beforeEach(async () => {
  resetPostHogState();
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  ({ PostHogInit, PostHogReset } = await import('../actions.js'));
});

afterEach(() => {
  jest.restoreAllMocks();
});

async function init(params = { apiKey: 'phc_key' }) {
  await PostHogInit({ params });
}

test('PostHogReset resets the current person', async () => {
  await init();
  await expect(PostHogReset({ params: {} })).resolves.toBe(null);
  expect(mockPostHog.reset.mock.calls).toEqual([[false]]);
});

test('PostHogReset also resets the device id when resetDeviceId is true', async () => {
  await init();
  await PostHogReset({ params: { resetDeviceId: true } });
  expect(mockPostHog.reset.mock.calls).toEqual([[true]]);
});

test('PostHogReset does nothing before PostHogInit has run', async () => {
  await expect(PostHogReset({ params: {} })).resolves.toBe(null);
  expect(mockPostHog.reset).not.toHaveBeenCalled();
});

test('PostHogReset throws when resetDeviceId is not a boolean', async () => {
  await init({ enabled: false });
  await expect(PostHogReset({ params: { resetDeviceId: 'yes' } })).rejects.toThrow(
    'PostHogReset "resetDeviceId" must be a boolean. Received "yes".'
  );
});
