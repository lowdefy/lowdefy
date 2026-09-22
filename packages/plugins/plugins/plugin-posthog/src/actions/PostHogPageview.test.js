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
  capture: jest.fn(),
  init: jest.fn(),
};

jest.unstable_mockModule('posthog-js', () => ({ default: mockPostHog }));

let PostHogInit;
let PostHogPageview;

beforeEach(async () => {
  resetPostHogState();
  ({ PostHogInit, PostHogPageview } = await import('../actions.js'));
});

function init() {
  PostHogInit({ params: { apiKey: 'phc_key' } });
}

test('PostHogPageview captures a pageview event', () => {
  init();
  expect(PostHogPageview({ params: {} })).toBe(null);
  expect(mockPostHog.capture.mock.calls).toEqual([['$pageview', undefined]]);
});

test('PostHogPageview captures a pageview event with properties', () => {
  init();
  PostHogPageview({ params: { properties: { section: 'reports' } } });
  expect(mockPostHog.capture.mock.calls).toEqual([['$pageview', { section: 'reports' }]]);
});

test('PostHogPageview does nothing before PostHogInit has run', () => {
  expect(PostHogPageview({ params: {} })).toBe(null);
  expect(mockPostHog.capture).not.toHaveBeenCalled();
});

test('PostHogPageview throws when properties is not an object', () => {
  init();
  expect(() => PostHogPageview({ params: { properties: 'reports' } })).toThrow(
    'PostHogPageview "properties" must be an object. Received "reports".'
  );
});
