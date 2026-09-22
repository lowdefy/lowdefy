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

let PostHogCapture;
let PostHogInit;

beforeEach(async () => {
  resetPostHogState();
  ({ PostHogCapture, PostHogInit } = await import('../actions.js'));
});

function init(params = { apiKey: 'phc_key' }) {
  PostHogInit({ params });
}

test('PostHogCapture captures an event with properties', () => {
  init();
  expect(PostHogCapture({ params: { event: 'report_submitted', properties: { step: 3 } } })).toBe(
    null
  );
  expect(mockPostHog.capture.mock.calls).toEqual([['report_submitted', { step: 3 }]]);
});

test('PostHogCapture captures an event without properties', () => {
  init();
  PostHogCapture({ params: { event: 'report_submitted' } });
  expect(mockPostHog.capture.mock.calls).toEqual([['report_submitted', {}]]);
});

test('PostHogCapture sends groups as the $groups property', () => {
  init();
  PostHogCapture({
    params: { event: 'report_submitted', groups: { company: 'acme' }, properties: { step: 3 } },
  });
  expect(mockPostHog.capture.mock.calls).toEqual([
    ['report_submitted', { $groups: { company: 'acme' }, step: 3 }],
  ]);
});

test('PostHogCapture does nothing before PostHogInit has run', () => {
  expect(PostHogCapture({ params: { event: 'report_submitted' } })).toBe(null);
  expect(mockPostHog.capture).not.toHaveBeenCalled();
});

test('PostHogCapture does nothing when PostHog is disabled', () => {
  init({ enabled: false });
  expect(PostHogCapture({ params: { event: 'report_submitted' } })).toBe(null);
  expect(mockPostHog.capture).not.toHaveBeenCalled();
});

test('PostHogCapture throws when event is missing', () => {
  init();
  expect(() => PostHogCapture({ params: {} })).toThrow(
    'PostHogCapture "event" must be a non-empty string. Received undefined.'
  );
});

test('PostHogCapture throws when event is an empty string', () => {
  init();
  expect(() => PostHogCapture({ params: { event: '   ' } })).toThrow(
    'PostHogCapture "event" must be a non-empty string. Received "   ".'
  );
});

test('PostHogCapture throws when properties is not an object', () => {
  init();
  expect(() =>
    PostHogCapture({ params: { event: 'report_submitted', properties: ['a'] } })
  ).toThrow('PostHogCapture "properties" must be an object. Received ["a"].');
});

test('PostHogCapture throws when groups is not an object', () => {
  init();
  expect(() => PostHogCapture({ params: { event: 'report_submitted', groups: 'acme' } })).toThrow(
    'PostHogCapture "groups" must be an object. Received "acme".'
  );
});
