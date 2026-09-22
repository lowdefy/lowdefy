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
  ({ PostHogGroup, PostHogInit } = await import('../actions.js'));
});

function init() {
  PostHogInit({ params: { apiKey: 'phc_key' } });
}

test('PostHogGroup associates the person with a group', () => {
  init();
  expect(
    PostHogGroup({ params: { type: 'company', key: 'acme', properties: { plan: 'pro' } } })
  ).toBe(null);
  expect(mockPostHog.group.mock.calls).toEqual([['company', 'acme', { plan: 'pro' }]]);
});

test('PostHogGroup associates the person with a group without properties', () => {
  init();
  PostHogGroup({ params: { type: 'company', key: 'acme' } });
  expect(mockPostHog.group.mock.calls).toEqual([['company', 'acme', undefined]]);
});

test('PostHogGroup does nothing before PostHogInit has run', () => {
  expect(PostHogGroup({ params: { type: 'company', key: 'acme' } })).toBe(null);
  expect(mockPostHog.group).not.toHaveBeenCalled();
});

test('PostHogGroup throws when type is missing', () => {
  init();
  expect(() => PostHogGroup({ params: { key: 'acme' } })).toThrow(
    'PostHogGroup "type" must be a non-empty string. Received undefined.'
  );
});

test('PostHogGroup throws when key is missing', () => {
  init();
  expect(() => PostHogGroup({ params: { type: 'company' } })).toThrow(
    'PostHogGroup "key" must be a non-empty string. Received undefined.'
  );
});

test('PostHogGroup throws when properties is not an object', () => {
  init();
  expect(() => PostHogGroup({ params: { type: 'company', key: 'acme', properties: 1 } })).toThrow(
    'PostHogGroup "properties" must be an object. Received 1.'
  );
});
