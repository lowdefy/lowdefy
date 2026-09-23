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
  group: jest.fn(),
  init: jest.fn(),
};

jest.unstable_mockModule('posthog-js', () => ({ default: mockPostHog }));

let PostHogGroup;
let PostHogInit;

beforeEach(async () => {
  resetPostHogState();
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  ({ PostHogGroup, PostHogInit } = await import('../actions.js'));
});

afterEach(() => {
  jest.restoreAllMocks();
});

async function init(params = { apiKey: 'phc_key' }) {
  await PostHogInit({ params });
}

test('PostHogGroup associates the person with a group', async () => {
  await init();
  await expect(
    PostHogGroup({ params: { type: 'company', key: 'acme', properties: { plan: 'pro' } } })
  ).resolves.toBe(null);
  expect(mockPostHog.group.mock.calls).toEqual([['company', 'acme', { plan: 'pro' }]]);
});

test('PostHogGroup associates the person with a group without properties', async () => {
  await init();
  await PostHogGroup({ params: { type: 'company', key: 'acme' } });
  expect(mockPostHog.group.mock.calls).toEqual([['company', 'acme', undefined]]);
});

test('PostHogGroup does nothing before PostHogInit has run', async () => {
  await expect(PostHogGroup({ params: { type: 'company', key: 'acme' } })).resolves.toBe(null);
  expect(mockPostHog.group).not.toHaveBeenCalled();
});

test('PostHogGroup throws when type is missing', async () => {
  await init();
  await expect(PostHogGroup({ params: { key: 'acme' } })).rejects.toThrow(
    'PostHogGroup "type" must be a non-empty string. Received undefined.'
  );
});

test('PostHogGroup throws when key is missing', async () => {
  await init({ enabled: false });
  await expect(PostHogGroup({ params: { type: 'company' } })).rejects.toThrow(
    'PostHogGroup "key" must be a non-empty string. Received undefined.'
  );
});

test('PostHogGroup throws when properties is not an object', async () => {
  await init();
  await expect(
    PostHogGroup({ params: { type: 'company', key: 'acme', properties: 1 } })
  ).rejects.toThrow('PostHogGroup "properties" must be an object. Received 1.');
});
