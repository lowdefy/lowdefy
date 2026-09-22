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
  alias: jest.fn(),
  init: jest.fn(),
};

jest.unstable_mockModule('posthog-js', () => ({ default: mockPostHog }));

let PostHogAlias;
let PostHogInit;

beforeEach(async () => {
  resetPostHogState();
  ({ PostHogAlias, PostHogInit } = await import('../actions.js'));
});

function init() {
  PostHogInit({ params: { apiKey: 'phc_key' } });
}

test('PostHogAlias aliases the current person', () => {
  init();
  expect(PostHogAlias({ params: { alias: 'user_1' } })).toBe(null);
  expect(mockPostHog.alias.mock.calls).toEqual([['user_1']]);
});

test('PostHogAlias does nothing before PostHogInit has run', () => {
  expect(PostHogAlias({ params: { alias: 'user_1' } })).toBe(null);
  expect(mockPostHog.alias).not.toHaveBeenCalled();
});

test('PostHogAlias throws when alias is missing', () => {
  init();
  expect(() => PostHogAlias({ params: {} })).toThrow(
    'PostHogAlias "alias" must be a non-empty string. Received undefined.'
  );
});
