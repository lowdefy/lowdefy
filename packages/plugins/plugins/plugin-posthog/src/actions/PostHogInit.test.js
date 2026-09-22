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

test('PostHogInit initialises posthog-js with the default api host', () => {
  expect(PostHogInit({ params: { apiKey: 'phc_key' } })).toBe(null);
  expect(mockPostHog.init.mock.calls).toEqual([
    ['phc_key', { api_host: 'https://us.i.posthog.com' }],
  ]);
});

test('PostHogInit passes apiHost, options and debug to posthog-js', () => {
  PostHogInit({
    params: {
      apiKey: 'phc_key',
      apiHost: 'https://eu.i.posthog.com',
      debug: true,
      options: { capture_pageview: false, person_profiles: 'identified_only' },
    },
  });
  expect(mockPostHog.init.mock.calls).toEqual([
    [
      'phc_key',
      {
        api_host: 'https://eu.i.posthog.com',
        capture_pageview: false,
        debug: true,
        person_profiles: 'identified_only',
      },
    ],
  ]);
});

test('PostHogInit does nothing when called again with the same apiKey', () => {
  PostHogInit({ params: { apiKey: 'phc_key' } });
  PostHogInit({ params: { apiKey: 'phc_key', options: { autocapture: false } } });
  expect(mockPostHog.init).toHaveBeenCalledTimes(1);
});

test('PostHogInit throws when called again with a different apiKey', () => {
  PostHogInit({ params: { apiKey: 'phc_key' } });
  expect(() => PostHogInit({ params: { apiKey: 'phc_other' } })).toThrow(
    'PostHogInit was already called with a different "apiKey". Received "phc_other".'
  );
});

test('PostHogInit makes the other actions no-ops when enabled is false', () => {
  expect(PostHogInit({ params: { enabled: false } })).toBe(null);
  expect(mockPostHog.init).not.toHaveBeenCalled();
  expect(PostHogCapture({ params: { event: 'report_submitted' } })).toBe(null);
  expect(mockPostHog.capture).not.toHaveBeenCalled();
});

test('PostHogInit throws when apiKey is missing', () => {
  expect(() => PostHogInit({ params: {} })).toThrow(
    'PostHogInit "apiKey" must be a non-empty string. Received undefined.'
  );
});

test('PostHogInit throws when apiKey is an empty string', () => {
  expect(() => PostHogInit({ params: { apiKey: '  ' } })).toThrow(
    'PostHogInit "apiKey" must be a non-empty string. Received "  ".'
  );
});

test('PostHogInit throws when params is not an object', () => {
  expect(() => PostHogInit({ params: 'phc_key' })).toThrow(
    'PostHogInit params must be an object. Received "phc_key".'
  );
});

test('PostHogInit throws when options is not an object', () => {
  expect(() => PostHogInit({ params: { apiKey: 'phc_key', options: 'autocapture' } })).toThrow(
    'PostHogInit "options" must be an object. Received "autocapture".'
  );
});

test('PostHogInit throws when enabled is not a boolean', () => {
  expect(() => PostHogInit({ params: { apiKey: 'phc_key', enabled: 'false' } })).toThrow(
    'PostHogInit "enabled" must be a boolean. Received "false".'
  );
});

test('PostHogInit throws when apiHost is not a string', () => {
  expect(() => PostHogInit({ params: { apiKey: 'phc_key', apiHost: 1 } })).toThrow(
    'PostHogInit "apiHost" must be a string. Received 1.'
  );
});

test('PostHogInit throws when debug is not a boolean', () => {
  expect(() => PostHogInit({ params: { apiKey: 'phc_key', debug: 'yes' } })).toThrow(
    'PostHogInit "debug" must be a boolean. Received "yes".'
  );
});
