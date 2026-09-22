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
  opt_out_capturing: jest.fn(),
};

jest.unstable_mockModule('posthog-js', () => ({ default: mockPostHog }));

let PostHogInit;
let PostHogOptOut;

beforeEach(async () => {
  resetPostHogState();
  ({ PostHogInit, PostHogOptOut } = await import('../actions.js'));
});

test('PostHogOptOut opts the person out of capturing', () => {
  PostHogInit({ params: { apiKey: 'phc_key' } });
  expect(PostHogOptOut({ params: {} })).toBe(null);
  expect(mockPostHog.opt_out_capturing).toHaveBeenCalledTimes(1);
});

test('PostHogOptOut does nothing before PostHogInit has run', () => {
  expect(PostHogOptOut({ params: {} })).toBe(null);
  expect(mockPostHog.opt_out_capturing).not.toHaveBeenCalled();
});
