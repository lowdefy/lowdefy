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

import postHogState from './postHogState.js';
import resetPostHogState from '../test/resetPostHogState.js';

jest.unstable_mockModule('posthog-js', () => {
  throw new Error('Failed to fetch dynamically imported module.');
});

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

test('PostHogInit warns and turns the other actions into no-ops when posthog-js fails to load', async () => {
  await expect(PostHogInit({ params: { apiKey: 'phc_key' } })).resolves.toBe(null);
  expect(postHogState.status).toBe('failed');
  expect(warn).toHaveBeenCalledTimes(1);
  expect(warn.mock.calls[0][0]).toBe(
    'PostHogInit could not load posthog-js. PostHog actions will do nothing.'
  );
  await expect(PostHogCapture({ params: { event: 'report_submitted' } })).resolves.toBe(null);
  expect(warn).toHaveBeenCalledTimes(1);
});
