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
  setPersonProperties: jest.fn(),
};

jest.unstable_mockModule('posthog-js', () => ({ default: mockPostHog }));

let PostHogInit;
let PostHogSetPersonProperties;

beforeEach(async () => {
  resetPostHogState();
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  ({ PostHogInit, PostHogSetPersonProperties } = await import('../actions.js'));
});

afterEach(() => {
  jest.restoreAllMocks();
});

async function init(params = { apiKey: 'phc_key' }) {
  await PostHogInit({ params });
}

test('PostHogSetPersonProperties sets and sets once person properties', async () => {
  await init();
  await expect(
    PostHogSetPersonProperties({
      params: { set: { plan: 'pro' }, setOnce: { first_seen: '2026-01-01' } },
    })
  ).resolves.toBe(null);
  expect(mockPostHog.setPersonProperties.mock.calls).toEqual([
    [{ plan: 'pro' }, { first_seen: '2026-01-01' }],
  ]);
});

test('PostHogSetPersonProperties sets person properties without setOnce', async () => {
  await init();
  await PostHogSetPersonProperties({ params: { set: { plan: 'pro' } } });
  expect(mockPostHog.setPersonProperties.mock.calls).toEqual([[{ plan: 'pro' }, undefined]]);
});

test('PostHogSetPersonProperties does nothing before PostHogInit has run', async () => {
  await expect(PostHogSetPersonProperties({ params: { set: { plan: 'pro' } } })).resolves.toBe(
    null
  );
  expect(mockPostHog.setPersonProperties).not.toHaveBeenCalled();
});

test('PostHogSetPersonProperties throws when neither set nor setOnce is given', async () => {
  await init({ enabled: false });
  await expect(PostHogSetPersonProperties({ params: {} })).rejects.toThrow(
    'PostHogSetPersonProperties requires a "set" or "setOnce" object.'
  );
});

test('PostHogSetPersonProperties throws when set is not an object', async () => {
  await init();
  await expect(PostHogSetPersonProperties({ params: { set: 'pro' } })).rejects.toThrow(
    'PostHogSetPersonProperties "set" must be an object. Received "pro".'
  );
});

test('PostHogSetPersonProperties throws when setOnce is not an object', async () => {
  await init();
  await expect(PostHogSetPersonProperties({ params: { setOnce: 1 } })).rejects.toThrow(
    'PostHogSetPersonProperties "setOnce" must be an object. Received 1.'
  );
});
