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

async function init(params = { apiKey: 'phc_key' }) {
  await PostHogInit({ params });
}

test('PostHogCapture captures an event with properties', async () => {
  await init();
  await expect(
    PostHogCapture({ params: { event: 'report_submitted', properties: { step: 3 } } })
  ).resolves.toBe(null);
  expect(mockPostHog.capture.mock.calls).toEqual([['report_submitted', { step: 3 }]]);
});

test('PostHogCapture captures an event without properties', async () => {
  await init();
  await PostHogCapture({ params: { event: 'report_submitted' } });
  expect(mockPostHog.capture.mock.calls).toEqual([['report_submitted', {}]]);
});

test('PostHogCapture sends groups as the $groups property', async () => {
  await init();
  await PostHogCapture({
    params: { event: 'report_submitted', groups: { company: 'acme' }, properties: { step: 3 } },
  });
  expect(mockPostHog.capture.mock.calls).toEqual([
    ['report_submitted', { $groups: { company: 'acme' }, step: 3 }],
  ]);
});

test('PostHogCapture does nothing and warns once before PostHogInit has run', async () => {
  await expect(PostHogCapture({ params: { event: 'report_submitted' } })).resolves.toBe(null);
  await PostHogCapture({ params: { event: 'report_submitted' } });
  expect(mockPostHog.capture).not.toHaveBeenCalled();
  expect(warn.mock.calls).toEqual([
    [
      'PostHogCapture ran before PostHogInit, so it did nothing. Run PostHogInit in the page onInit event, with "enabled: false" where analytics should be off.',
    ],
  ]);
});

test('PostHogCapture does nothing and does not warn when PostHog is disabled', async () => {
  await init({ enabled: false });
  await expect(PostHogCapture({ params: { event: 'report_submitted' } })).resolves.toBe(null);
  expect(mockPostHog.capture).not.toHaveBeenCalled();
  expect(warn).not.toHaveBeenCalled();
});

test('PostHogCapture throws when event is missing', async () => {
  await init();
  await expect(PostHogCapture({ params: {} })).rejects.toThrow(
    'PostHogCapture "event" must be a non-empty string. Received undefined.'
  );
});

test('PostHogCapture throws when event is an empty string', async () => {
  await init();
  await expect(PostHogCapture({ params: { event: '   ' } })).rejects.toThrow(
    'PostHogCapture "event" must be a non-empty string. Received "   ".'
  );
});

test('PostHogCapture throws on invalid params even when PostHog is disabled', async () => {
  await init({ enabled: false });
  await expect(PostHogCapture({ params: {} })).rejects.toThrow(
    'PostHogCapture "event" must be a non-empty string. Received undefined.'
  );
});

test('PostHogCapture throws on invalid params before PostHogInit has run', async () => {
  await expect(
    PostHogCapture({ params: { event: 'report_submitted', groups: 1 } })
  ).rejects.toThrow('PostHogCapture "groups" must be an object. Received 1.');
});

test('PostHogCapture throws when properties is not an object', async () => {
  await init();
  await expect(
    PostHogCapture({ params: { event: 'report_submitted', properties: ['a'] } })
  ).rejects.toThrow('PostHogCapture "properties" must be an object. Received ["a"].');
});

test('PostHogCapture throws when groups is not an object', async () => {
  await init();
  await expect(
    PostHogCapture({ params: { event: 'report_submitted', groups: 'acme' } })
  ).rejects.toThrow('PostHogCapture "groups" must be an object. Received "acme".');
});
