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

let PostHogCapturePageLeave;
let PostHogInit;

beforeEach(async () => {
  resetPostHogState();
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  ({ PostHogCapturePageLeave, PostHogInit } = await import('../actions.js'));
});

afterEach(() => {
  jest.restoreAllMocks();
});

async function init(params = { apiKey: 'phc_key' }) {
  await PostHogInit({ params });
}

test('PostHogCapturePageLeave captures a pageleave event', async () => {
  await init();
  await expect(PostHogCapturePageLeave({ params: {} })).resolves.toBe(null);
  expect(mockPostHog.capture.mock.calls).toEqual([['$pageleave', undefined]]);
});

test('PostHogCapturePageLeave captures a pageleave event with properties', async () => {
  await init();
  await PostHogCapturePageLeave({ params: { properties: { section: 'reports' } } });
  expect(mockPostHog.capture.mock.calls).toEqual([['$pageleave', { section: 'reports' }]]);
});

test('PostHogCapturePageLeave does nothing before PostHogInit has run', async () => {
  await expect(PostHogCapturePageLeave({ params: {} })).resolves.toBe(null);
  expect(mockPostHog.capture).not.toHaveBeenCalled();
});

test('PostHogCapturePageLeave throws when properties is not an object', async () => {
  await init({ enabled: false });
  await expect(PostHogCapturePageLeave({ params: { properties: 'reports' } })).rejects.toThrow(
    'PostHogCapturePageLeave "properties" must be an object. Received "reports".'
  );
});
