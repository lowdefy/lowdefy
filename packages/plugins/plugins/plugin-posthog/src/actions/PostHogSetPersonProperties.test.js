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
  ({ PostHogInit, PostHogSetPersonProperties } = await import('../actions.js'));
});

function init() {
  PostHogInit({ params: { apiKey: 'phc_key' } });
}

test('PostHogSetPersonProperties sets and set-once properties', () => {
  init();
  expect(
    PostHogSetPersonProperties({
      params: { set: { plan: 'pro' }, setOnce: { signed_up_at: '2026-01-01' } },
    })
  ).toBe(null);
  expect(mockPostHog.setPersonProperties.mock.calls).toEqual([
    [{ plan: 'pro' }, { signed_up_at: '2026-01-01' }],
  ]);
});

test('PostHogSetPersonProperties sets only the set properties', () => {
  init();
  PostHogSetPersonProperties({ params: { set: { plan: 'pro' } } });
  expect(mockPostHog.setPersonProperties.mock.calls).toEqual([[{ plan: 'pro' }, undefined]]);
});

test('PostHogSetPersonProperties does nothing before PostHogInit has run', () => {
  expect(PostHogSetPersonProperties({ params: { set: { plan: 'pro' } } })).toBe(null);
  expect(mockPostHog.setPersonProperties).not.toHaveBeenCalled();
});

test('PostHogSetPersonProperties throws when neither set nor setOnce is given', () => {
  init();
  expect(() => PostHogSetPersonProperties({ params: {} })).toThrow(
    'PostHogSetPersonProperties requires a "set" or "setOnce" object.'
  );
});

test('PostHogSetPersonProperties throws when set is not an object', () => {
  init();
  expect(() => PostHogSetPersonProperties({ params: { set: 'pro' } })).toThrow(
    'PostHogSetPersonProperties "set" must be an object. Received "pro".'
  );
});
