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

import postHogState from '../lib/postHogState.js';
import resetPostHogState from '../test/resetPostHogState.js';

const mockPostHog = {
  capture: jest.fn(),
  init: jest.fn(),
};

jest.unstable_mockModule('posthog-js', () => ({ default: mockPostHog }));

let PostHogCapture;
let warn;
let PostHogInit;

beforeEach(async () => {
  resetPostHogState();
  warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  ({ PostHogCapture, PostHogInit } = await import('../actions.js'));
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('PostHogInit initialises posthog-js with the default api host', async () => {
  await expect(PostHogInit({ params: { apiKey: 'phc_key' } })).resolves.toBe(null);
  expect(mockPostHog.init.mock.calls).toEqual([
    ['phc_key', { api_host: 'https://us.i.posthog.com' }],
  ]);
  expect(postHogState.status).toBe('enabled');
});

test('PostHogInit passes apiHost, options and debug to posthog-js', async () => {
  await PostHogInit({
    params: {
      apiKey: 'phc_key',
      apiHost: 'https://eu.i.posthog.com',
      debug: true,
      options: { capture_pageview: 'history_change', person_profiles: 'identified_only' },
    },
  });
  expect(mockPostHog.init.mock.calls).toEqual([
    [
      'phc_key',
      {
        api_host: 'https://eu.i.posthog.com',
        capture_pageview: 'history_change',
        debug: true,
        person_profiles: 'identified_only',
      },
    ],
  ]);
});

test('PostHogInit does nothing when called again with the same apiKey', async () => {
  await PostHogInit({ params: { apiKey: 'phc_key' } });
  await PostHogInit({ params: { apiKey: 'phc_key', options: { autocapture: false } } });
  expect(mockPostHog.init).toHaveBeenCalledTimes(1);
});

test('PostHogInit initialises once when called twice before loading finishes', async () => {
  await Promise.all([
    PostHogInit({ params: { apiKey: 'phc_key' } }),
    PostHogInit({ params: { apiKey: 'phc_key' } }),
  ]);
  expect(mockPostHog.init).toHaveBeenCalledTimes(1);
});

test('PostHog actions wait for a PostHogInit that is still loading', async () => {
  const init = PostHogInit({ params: { apiKey: 'phc_key' } });
  await PostHogCapture({ params: { event: 'report_submitted' } });
  await init;
  expect(mockPostHog.capture.mock.calls).toEqual([['report_submitted', {}]]);
  expect(warn).not.toHaveBeenCalled();
});

test('PostHogInit throws when called again with a different apiKey', async () => {
  await PostHogInit({ params: { apiKey: 'phc_key' } });
  await expect(PostHogInit({ params: { apiKey: 'phc_other' } })).rejects.toThrow(
    'PostHogInit was already called with a different "apiKey". PostHog can only be initialised once per browser session. Received "phc_other".'
  );
});

test('PostHogInit makes the other actions silent no-ops when enabled is false', async () => {
  await expect(PostHogInit({ params: { enabled: false } })).resolves.toBe(null);
  expect(mockPostHog.init).not.toHaveBeenCalled();
  expect(postHogState.status).toBe('disabled');
  await expect(PostHogCapture({ params: { event: 'report_submitted' } })).resolves.toBe(null);
  expect(mockPostHog.capture).not.toHaveBeenCalled();
  expect(warn).not.toHaveBeenCalled();
});

test('PostHogInit does not require apiKey when enabled is false', async () => {
  await expect(PostHogInit({ params: { apiKey: null, enabled: false } })).resolves.toBe(null);
});

test('PostHogInit loads PostHog when called with an apiKey after enabled is false', async () => {
  await PostHogInit({ params: { enabled: false } });
  await PostHogInit({ params: { apiKey: 'phc_key' } });
  expect(mockPostHog.init).toHaveBeenCalledTimes(1);
  expect(postHogState.status).toBe('enabled');
});

test('PostHogInit throws when called with enabled false after PostHog was initialised', async () => {
  await PostHogInit({ params: { apiKey: 'phc_key' } });
  await expect(PostHogInit({ params: { enabled: false } })).rejects.toThrow(
    'PostHogInit was called with "enabled: false" after PostHog was already initialised.'
  );
});

test('PostHogInit throws when apiKey is missing', async () => {
  await expect(PostHogInit({ params: {} })).rejects.toThrow(
    'PostHogInit "apiKey" must be a non-empty string. Received undefined.'
  );
});

test('PostHogInit throws when apiKey is an empty string', async () => {
  await expect(PostHogInit({ params: { apiKey: '  ' } })).rejects.toThrow(
    'PostHogInit "apiKey" must be a non-empty string. Received "  ".'
  );
});

test('PostHogInit throws when params is not an object', async () => {
  await expect(PostHogInit({ params: 'phc_key' })).rejects.toThrow(
    'PostHogInit params must be an object. Received "phc_key".'
  );
});

test('PostHogInit throws when options is not an object', async () => {
  await expect(
    PostHogInit({ params: { apiKey: 'phc_key', options: 'autocapture' } })
  ).rejects.toThrow('PostHogInit "options" must be an object. Received "autocapture".');
});

test('PostHogInit throws when enabled is not a boolean', async () => {
  await expect(PostHogInit({ params: { apiKey: 'phc_key', enabled: 'false' } })).rejects.toThrow(
    'PostHogInit "enabled" must be a boolean. Received "false".'
  );
});

test('PostHogInit throws when apiHost is not a string', async () => {
  await expect(PostHogInit({ params: { apiKey: 'phc_key', apiHost: 1 } })).rejects.toThrow(
    'PostHogInit "apiHost" must be a non-empty string. Received 1.'
  );
});

test('PostHogInit throws when apiHost is an empty string', async () => {
  await expect(PostHogInit({ params: { apiKey: 'phc_key', apiHost: '' } })).rejects.toThrow(
    'PostHogInit "apiHost" must be a non-empty string. Received "".'
  );
});

test('PostHogInit throws when debug is not a boolean', async () => {
  await expect(PostHogInit({ params: { apiKey: 'phc_key', debug: 'yes' } })).rejects.toThrow(
    'PostHogInit "debug" must be a boolean. Received "yes".'
  );
});
